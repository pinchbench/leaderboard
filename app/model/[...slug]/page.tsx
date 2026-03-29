import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, BarChart3, Clock, DollarSign, Activity } from 'lucide-react'
import { PROVIDER_COLORS } from '@/lib/types'
import { fetchModelSubmissions } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { ModelScoreTrend } from '@/components/model-score-trend'

interface ModelPageProps {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ official?: string }>
}

export default async function ModelPage({ params, searchParams }: ModelPageProps) {
  const { slug } = await params
  const { official } = await searchParams
  const officialOnly = official !== 'false'

  if (slug.length < 2) {
    notFound()
  }

  const provider = slug[0]
  const modelName = slug.slice(1).join('/')

  let data
  try {
    data = await fetchModelSubmissions(modelName, { officialOnly })
  } catch (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="max-w-4xl mx-auto p-6">
          <h2 className="text-xl font-bold mb-4">Error loading model data</h2>
          <p className="text-muted-foreground">Could not fetch submissions for {modelName}.</p>
          <Link href="/">
             <Button className="mt-4">Back to Leaderboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!data || data.submissions.length === 0) {
    notFound()
  }

  const submissions = data.submissions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const scores = submissions.map(s => s.score_percentage * 100)
  const bestScore = Math.max(...scores)
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const sortedScores = [...scores].sort((a, b) => a - b)
  const medianScore = sortedScores[Math.floor(sortedScores.length / 2)]

  const avgCost = submissions.reduce((a, b) => a + (b.total_cost_usd || 0), 0) / submissions.length
  const avgSpeed = submissions.reduce((a, b) => a + (b.total_execution_time_seconds || 0), 0) / submissions.length

  const compareUrl = `/?view=graphs&graph=radar&models=${encodeURIComponent(modelName)}${officialOnly ? '' : '&official=false'}`

  const trendData = submissions.map(s => ({
    timestamp: s.timestamp,
    score: s.score_percentage * 100
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link
            href={officialOnly ? '/' : '/?official=false'}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block"
          >
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leaderboard
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <code className="text-3xl font-mono font-bold text-foreground">
                  {modelName}
                </code>
                <Badge
                  variant="outline"
                  className="text-sm"
                  style={{
                    borderColor: PROVIDER_COLORS[provider as keyof typeof PROVIDER_COLORS] || 'hsl(var(--border))',
                    color: PROVIDER_COLORS[provider as keyof typeof PROVIDER_COLORS] || 'hsl(var(--foreground))',
                    backgroundColor: `${PROVIDER_COLORS[provider as keyof typeof PROVIDER_COLORS]}10` || 'transparent'
                  }}
                >
                  {provider}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Model performance overview and history
              </p>
            </div>
            <Link href={compareUrl}>
              <Button className="bg-primary text-primary-foreground">
                <Activity className="h-4 w-4 mr-2" />
                Compare with other models
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-5 w-5 text-primary mb-2" />
            <span className="text-sm text-muted-foreground">Best Score</span>
            <span className="text-2xl font-bold">{bestScore.toFixed(1)}%</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center text-center">
            <Activity className="h-5 w-5 text-blue-500 mb-2" />
            <span className="text-sm text-muted-foreground">Average Score</span>
            <span className="text-2xl font-bold">{avgScore.toFixed(1)}%</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center text-center">
            <Activity className="h-5 w-5 text-purple-500 mb-2" />
            <span className="text-sm text-muted-foreground">Median Score</span>
            <span className="text-2xl font-bold">{medianScore.toFixed(1)}%</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center text-center">
            <DollarSign className="h-5 w-5 text-green-500 mb-2" />
            <span className="text-sm text-muted-foreground">Avg Cost</span>
            <span className="text-2xl font-bold">${avgCost.toFixed(4)}</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center text-center">
            <Clock className="h-5 w-5 text-orange-500 mb-2" />
            <span className="text-sm text-muted-foreground">Avg Speed</span>
            <span className="text-2xl font-bold">{avgSpeed.toFixed(1)}s</span>
          </Card>
        </div>

        {/* Score Trend Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Score Trend Over Time</h3>
          <ModelScoreTrend data={trendData} />
        </Card>

        {/* Submissions Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Submission History</h3>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Speed</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(s.timestamp), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {(s.score_percentage * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {s.total_execution_time_seconds ? `${s.total_execution_time_seconds.toFixed(1)}s` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {s.total_cost_usd ? `$${s.total_cost_usd.toFixed(4)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/submission/${s.id}${officialOnly ? '' : '?official=false'}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
