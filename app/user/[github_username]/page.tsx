import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Github, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchUserSubmissions } from '@/lib/api'
import { PROVIDER_COLORS } from '@/lib/types'
import { normalizeProvider } from '@/lib/transforms'
import { formatDistanceToNow } from 'date-fns'

interface UserPageProps {
  params: Promise<{ github_username: string }>
  searchParams: Promise<{ version?: string }>
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const { github_username } = await params
  return {
    title: `${github_username} — PinchBench`,
    description: `PinchBench submissions by ${github_username}`,
  }
}

function formatScore(pct: number) {
  return `${(pct * 100).toFixed(1)}%`
}

function getScoreColor(pct: number) {
  if (pct >= 0.85) return 'text-green-500'
  if (pct >= 0.7) return 'text-yellow-500'
  return 'text-red-500'
}

export default async function UserPage({ params, searchParams }: UserPageProps) {
  const { github_username } = await params
  const { version } = await searchParams

  let data
  try {
    data = await fetchUserSubmissions(github_username, { version })
  } catch {
    notFound()
  }

  if (!data || !data.submissions) {
    notFound()
  }

  const { submissions, summary } = data

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block"
          >
            ← Back to Leaderboard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-4xl">🦞</span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{github_username}</h1>
                <a
                  href={`https://github.com/${github_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`View ${github_username} on GitHub`}
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                PinchBench submissions
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-card border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Submissions</div>
            <div className="text-3xl font-bold text-foreground">{summary.total_submissions}</div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Best Score</div>
            <div className={`text-3xl font-bold ${getScoreColor(summary.best_score_percentage)}`}>
              {formatScore(summary.best_score_percentage)}
            </div>
          </Card>
        </div>

        {/* Submissions table */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Submissions</h2>
          {submissions.length === 0 ? (
            <Card className="p-6 bg-card border-border text-center text-muted-foreground">
              No submissions found.
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/submission/${sub.id}`}
                  className="block"
                >
                  <Card className="p-4 bg-card border-border hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <code className="font-mono font-semibold text-foreground truncate">
                          {sub.model}
                        </code>
                        {(() => {
                          const provider = normalizeProvider(sub.provider, sub.model)
                          return (
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                              style={{
                                borderColor: PROVIDER_COLORS[provider] || '#666',
                                color: PROVIDER_COLORS[provider] || '#666',
                              }}
                            >
                              {provider}
                            </Badge>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-4 text-sm shrink-0">
                        <span className={`font-bold ${getScoreColor(sub.score_percentage)}`}>
                          {formatScore(sub.score_percentage)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(sub.timestamp), { addSuffix: true })}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {sub.total_execution_time_seconds > 0 && (
                        <span>⚡ {sub.total_execution_time_seconds.toFixed(0)}s</span>
                      )}
                      {sub.total_cost_usd > 0 && (
                        <span>💰 ${sub.total_cost_usd.toFixed(4)}</span>
                      )}
                      <span className="font-mono opacity-60">{sub.benchmark_version.slice(0, 7)}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          {data.has_more && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing {submissions.length} of {data.total} submissions.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
