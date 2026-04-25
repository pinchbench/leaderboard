import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Github, ExternalLink, Calendar, Layers, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchUserSubmissions } from '@/lib/api'
import { PROVIDER_COLORS } from '@/lib/types'
import { normalizeProvider } from '@/lib/transforms'
import { formatDistanceToNow, format } from 'date-fns'

interface UserPageProps {
  params: Promise<{ github_username: string }>
  searchParams: Promise<{ version?: string; page?: string }>
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const { github_username } = await params
  return {
    title: `${github_username} — PinchBench Contributor`,
    description: `PinchBench submissions and benchmark contributions by ${github_username}`,
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

const PAGE_SIZE = 20

export default async function UserPage({ params, searchParams }: UserPageProps) {
  const { github_username } = await params
  const { version, page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const offset = (pageNum - 1) * PAGE_SIZE

  let data
  try {
    data = await fetchUserSubmissions(github_username, { version, limit: PAGE_SIZE, offset })
  } catch {
    notFound()
  }

  if (!data || !data.submissions || data.submissions.length === 0 && data.total === 0) {
    notFound()
  }

  const { submissions, summary, total } = data

  // Compute derived stats from all submissions (fetch all for summary)
  const allSubmissions = total > PAGE_SIZE
    ? await fetchUserSubmissions(github_username, { version, limit: total }).then(d => d.submissions)
    : submissions

  const uniqueModels = [...new Set(allSubmissions.map(s => s.model))]
  const uniqueProviders = [...new Set(allSubmissions.map(s => normalizeProvider(s.provider, s.model)))]
  const timestamps = allSubmissions.map(s => new Date(s.timestamp).getTime()).filter(t => !isNaN(t))
  const firstSubmissionAt = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null
  const lastSubmissionAt = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null

  // Best scores per model
  const bestByModel = new Map<string, { model: string; provider: string; score_percentage: number; submission_id: string }>()
  for (const sub of allSubmissions) {
    const existing = bestByModel.get(sub.model)
    if (!existing || sub.score_percentage > existing.score_percentage) {
      bestByModel.set(sub.model, {
        model: sub.model,
        provider: normalizeProvider(sub.provider, sub.model),
        score_percentage: sub.score_percentage,
        submission_id: sub.id,
      })
    }
  }
  const bestScoresByModel = [...bestByModel.values()].sort((a, b) => b.score_percentage - a.score_percentage)

  const totalPages = Math.ceil(total / PAGE_SIZE)

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
            <img
              src={`https://github.com/${github_username}.png?size=80`}
              alt={`${github_username} avatar`}
              className="w-16 h-16 rounded-full border-2 border-border"
            />
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
                PinchBench contributor
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
              <Layers className="h-3 w-3" /> Submissions
            </div>
            <div className="text-3xl font-bold text-foreground">{summary.total_submissions}</div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
              <Award className="h-3 w-3" /> Models Tested
            </div>
            <div className="text-3xl font-bold text-foreground">{uniqueModels.length}</div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Best Score</div>
            <div className={`text-3xl font-bold ${getScoreColor(summary.best_score_percentage)}`}>
              {formatScore(summary.best_score_percentage)}
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
              <Calendar className="h-3 w-3" /> Active Since
            </div>
            <div className="text-sm font-bold text-foreground">
              {firstSubmissionAt ? format(firstSubmissionAt, 'MMM yyyy') : '—'}
            </div>
          </Card>
        </div>

        {/* Date range */}
        {(firstSubmissionAt || lastSubmissionAt) && (
          <div className="text-xs text-muted-foreground">
            {firstSubmissionAt && `First submission: ${formatDistanceToNow(firstSubmissionAt, { addSuffix: true })}`}
            {firstSubmissionAt && lastSubmissionAt && firstSubmissionAt.getTime() !== lastSubmissionAt.getTime() && (
              <span className="mx-2">·</span>
            )}
            {lastSubmissionAt && `Latest: ${formatDistanceToNow(lastSubmissionAt, { addSuffix: true })}`}
          </div>
        )}

        {/* Providers */}
        {uniqueProviders.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Providers</h3>
            <div className="flex flex-wrap gap-2">
              {uniqueProviders.map(provider => (
                <Badge
                  key={provider}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: PROVIDER_COLORS[provider] || '#666',
                    color: PROVIDER_COLORS[provider] || '#666',
                  }}
                >
                  {provider}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Best scores per model */}
        {bestScoresByModel.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Best Scores by Model</h2>
            <div className="space-y-2">
              {bestScoresByModel.map((best) => (
                <Link
                  key={best.submission_id}
                  href={`/submission/${best.submission_id}`}
                  className="block"
                >
                  <Card className="p-3 bg-card border-border hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <code className="font-mono text-sm font-semibold text-foreground truncate">
                          {best.model}
                        </code>
                        <Badge
                          variant="outline"
                          className="text-xs shrink-0"
                          style={{
                            borderColor: PROVIDER_COLORS[best.provider] || '#666',
                            color: PROVIDER_COLORS[best.provider] || '#666',
                          }}
                        >
                          {best.provider}
                        </Badge>
                      </div>
                      <span className={`font-bold text-sm shrink-0 ${getScoreColor(best.score_percentage)}`}>
                        {formatScore(best.score_percentage)}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All submissions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            All Submissions
            {version && <span className="text-sm font-normal text-muted-foreground ml-2">— version {version.slice(0, 7)}</span>}
          </h2>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6" data-share-exclude="true">
              {pageNum > 1 && (
                <Link href={`/user/${encodeURIComponent(github_username)}?page=${pageNum - 1}${version ? `&version=${version}` : ''}`}>
                  <Button variant="outline" size="sm">← Prev</Button>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {pageNum} of {totalPages} ({total} total)
              </span>
              {pageNum < totalPages && (
                <Link href={`/user/${encodeURIComponent(github_username)}?page=${pageNum + 1}${version ? `&version=${version}` : ''}`}>
                  <Button variant="outline" size="sm">Next →</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
