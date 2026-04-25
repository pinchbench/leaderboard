import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Users, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchContributors } from '@/lib/api'
import { PROVIDER_COLORS } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = {
  title: 'Top Contributors — PinchBench',
  description: 'Ranking of top PinchBench contributors by submissions, models tested, and benchmark coverage.',
}

interface ContributorRow {
  github_username: string
  total_submissions: number
  unique_models: number
  best_score_percentage: number
  first_submission_at: string
  last_submission_at: string
  providers: string[]
}

function getScoreColor(pct: number) {
  if (pct >= 0.85) return 'text-green-500'
  if (pct >= 0.7) return 'text-yellow-500'
  return 'text-red-500'
}

function getRankEmoji(rank: number) {
  if (rank === 1) return '🦞'
  if (rank === 2) return '🦀'
  if (rank === 3) return '🦐'
  return ''
}

export default async function ContributorsPage() {
  let contributors: ContributorRow[] = []

  try {
    const data = await fetchContributors({ limit: 100 })
    contributors = data.contributors.map(c => ({
      github_username: c.github_username,
      total_submissions: c.total_submissions,
      unique_models: c.unique_models,
      best_score_percentage: c.best_score_percentage,
      first_submission_at: c.first_submission_at,
      last_submission_at: c.last_submission_at,
      providers: c.providers,
    }))
  } catch {
    // API endpoint doesn't exist yet — show coming soon
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦞</span>
              <div>
                <h1 className="text-xl font-bold text-foreground">PinchBench</h1>
                <p className="text-xs text-muted-foreground">Top Contributors</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground">Contributor Leaderboard</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Ranking of community members who have contributed benchmark runs.
          Sorted by total submissions, with models tested and best score shown.
        </p>

        {contributors.length === 0 ? (
          <Card className="p-8 bg-card border-border text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  The contributor leaderboard is being prepared. Once available, you'll see
                  rankings of top community benchmarkers by submissions, models tested, and coverage.
                </p>
              </div>
              <Link href="/">
                <Button variant="outline">Back to Leaderboard</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 px-4 font-medium">Rank</th>
                  <th className="py-3 px-4 font-medium">Contributor</th>
                  <th className="py-3 px-4 font-medium text-right">Submissions</th>
                  <th className="py-3 px-4 font-medium text-right">Models</th>
                  <th className="py-3 px-4 font-medium text-right">Best Score</th>
                  <th className="py-3 px-4 font-medium hidden md:table-cell">Providers</th>
                  <th className="py-3 px-4 font-medium hidden md:table-cell">Active</th>
                </tr>
              </thead>
              <tbody>
                {contributors.map((contributor, index) => (
                  <tr
                    key={contributor.github_username}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getRankEmoji(index + 1)}</span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/user/${encodeURIComponent(contributor.github_username)}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <img
                          src={`https://github.com/${contributor.github_username}.png?size=32`}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-mono text-foreground">{contributor.github_username}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      {contributor.total_submissions}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-foreground">
                      {contributor.unique_models}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${getScoreColor(contributor.best_score_percentage)}`}>
                      {(contributor.best_score_percentage * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {contributor.providers.slice(0, 3).map(provider => (
                          <Badge
                            key={provider}
                            variant="outline"
                            className="text-[10px]"
                            style={{
                              borderColor: PROVIDER_COLORS[provider] || '#666',
                              color: PROVIDER_COLORS[provider] || '#666',
                            }}
                          >
                            {provider}
                          </Badge>
                        ))}
                        {contributor.providers.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{contributor.providers.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {formatDistanceToNow(new Date(contributor.last_submission_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
