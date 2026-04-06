'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ModelBadgeStatus } from '@/lib/badges'

interface BadgeEmbedCardProps {
  model: string
  badges: ModelBadgeStatus[]
}

export function BadgeEmbedCard({ model, badges }: BadgeEmbedCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const earnedBadges = useMemo(() => badges.filter((badge) => badge.awarded), [badges])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1800)
    } catch {
      // noop
    }
  }

  if (earnedBadges.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2">Rolling-window badges</h3>
        <p className="text-sm text-muted-foreground">
          <code className="font-mono text-foreground">{model}</code> does not currently hold a daily,
          weekly, or monthly winner badge for success, speed, cost, or value.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Embed winner badges</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Copy a public SVG badge URL, Markdown snippet, or HTML image tag for the badges this model
          currently holds.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {earnedBadges.map((badge) => {
          const absoluteUrl = `${origin}${badge.url}`
          const markdown = `![${badge.title}](${absoluteUrl})`
          const html = `<img src="${absoluteUrl}" alt="${badge.title}" />`

          return (
            <div key={`${badge.metric}-${badge.period}`} className="rounded-lg border border-border bg-background/60 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {badge.displayValue} • {badge.officialOnly ? 'official only' : 'official + unofficial'}
                  </p>
                </div>
                <a
                  href={badge.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Open ${badge.title}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <img
                src={badge.url}
                alt={badge.title}
                className="w-full rounded-md border border-border bg-[#09090b]"
              />

              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ['url', absoluteUrl, 'Copy URL'],
                  ['md', markdown, 'Markdown'],
                  ['html', html, 'HTML'],
                ].map(([kind, value, label]) => {
                  const key = `${badge.metric}-${badge.period}-${kind}`
                  const copied = copiedKey === key
                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(key, value)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied!' : label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}