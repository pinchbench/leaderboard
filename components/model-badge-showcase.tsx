'use client'

import { BadgeEmbedCard } from '@/components/badge-embed-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelBadgeStatus } from '@/lib/badges'

interface ModelBadgeShowcaseProps {
  model: string
  badges: ModelBadgeStatus[]
}

export function ModelBadgeShowcase({ model, badges }: ModelBadgeShowcaseProps) {
  const earnedBadges = badges.filter((badge) => badge.awarded)
  const unearnedBadges = badges.filter((badge) => !badge.awarded)

  return (
    <div className="space-y-6">
      <BadgeEmbedCard model={model} badges={badges} />

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Badge Showcase</CardTitle>
          <CardDescription>
            Embeddable badges showing success rate, speed, cost, and value metrics across daily, weekly, and monthly windows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge) => (
              <Badge
                key={`${badge.metric}-${badge.period}`}
                variant="default"
              >
                {badge.shortLabel} ✓
              </Badge>
            ))}
          </div>
          {unearnedBadges.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Not yet earned</p>
              <div className="flex flex-wrap gap-2">
                {unearnedBadges.map((badge) => (
                  <Badge
                    key={`unearned-${badge.metric}-${badge.period}`}
                    variant="secondary"
                    className="opacity-50 grayscale"
                  >
                    {badge.shortLabel}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
