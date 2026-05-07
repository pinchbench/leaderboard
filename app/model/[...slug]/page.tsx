import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Activity } from 'lucide-react'
import { PROVIDER_COLORS, type TaskResult } from '@/lib/types'
import { fetchModelSubmissions, fetchSubmission } from '@/lib/api'
import { getModelBadgeStatuses } from '@/lib/badges'
import { ModelVarianceStats } from '@/components/model-variance-stats'
import { ModelBadgeShowcase } from '@/components/model-badge-showcase'
import { ModelTaskBreakdown } from '@/components/model-task-breakdown'
import { ModelCostEfficiency } from '@/components/model-cost-efficiency'
import { ModelRunHistory } from '@/components/model-run-history'
import { ModelScoreTrend } from '@/components/model-score-trend'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getScoreColorClass } from '@/lib/scores'

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
  const modelString = `${provider}/${modelName}`

  let modelData
  try {
    modelData = await fetchModelSubmissions(modelName, { officialOnly })
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

  if (!modelData || modelData.submissions.length === 0) {
    notFound()
  }

  const submissions = [...modelData.submissions].sort((a, b) =>
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

  // Find submissions with most complete task data
  async function fetchBestTaskData(submissionIds: string[]): Promise<Awaited<ReturnType<typeof fetchSubmission>> | null> {
    for (let i = 0; i < Math.min(submissionIds.length, 3); i++) {
      try {
        const detail = await fetchSubmission(submissionIds[i])
        if (detail?.submission?.tasks && detail.submission.tasks.length >= 5) {
          return detail
        }
      } catch {
        // Continue to next submission
      }
    }
    // Return whatever we got from the first attempt (even if incomplete)
    try {
      return await fetchSubmission(submissionIds[0])
    } catch {
      return null
    }
  }

  // Get submission IDs sorted by score (best first), then by recency
  const sortedByScore = [...submissions].sort((a, b) => {
    if (a.is_best && !b.is_best) return -1
    if (!a.is_best && b.is_best) return 1
    return (b.score_percentage ?? 0) - (a.score_percentage ?? 0)
  })

  const bestSubmissionDetail = await fetchBestTaskData(sortedByScore.map(s => s.id))

  const badgeStatuses = await getModelBadgeStatuses(modelName).catch(() => [])

  let tasks: TaskResult[] = []
  if (bestSubmissionDetail?.submission?.tasks) {
    tasks = bestSubmissionDetail.submission.tasks.map(t => ({
      task_id: t.task_id,
      task_name: t.frontmatter?.name ?? t.task_id,
      category: t.frontmatter?.category ?? 'other',
      score: t.score,
      max_score: t.max_score,
      breakdown: t.breakdown,
      grading_type: t.grading_type,
      timed_out: t.timed_out,
      notes: t.notes,
      execution_time_seconds: t.execution_time_seconds,
    }))
  }

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
                <h1 className="text-3xl font-mono font-bold text-foreground">
                  {modelName}
                </h1>
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
        {badgeStatuses && badgeStatuses.length > 0 && (
          <section aria-label="Badge Showcase">
            <ModelBadgeShowcase model={modelString} badges={badgeStatuses} />
          </section>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="cost">Cost</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <section aria-label="Performance Statistics">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground">Best Score</span>
                  <span className={`text-2xl font-bold ${getScoreColorClass(bestScore)}`}>{bestScore.toFixed(1)}%</span>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <span className={`text-2xl font-bold ${getScoreColorClass(avgScore)}`}>{avgScore.toFixed(1)}%</span>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground">Median Score</span>
                  <span className={`text-2xl font-bold ${getScoreColorClass(medianScore)}`}>{medianScore.toFixed(1)}%</span>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground">Avg Cost</span>
                  <span className="text-2xl font-bold text-muted-foreground">${avgCost.toFixed(4)}</span>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground">Avg Speed</span>
                  <span className="text-2xl font-bold text-muted-foreground">{avgSpeed.toFixed(1)}s</span>
                </Card>
              </div>
            </section>

            <ModelVarianceStats submissions={submissions} />

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Score Trend Over Time</h2>
              <ModelScoreTrend data={trendData} />
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {tasks.length > 0 ? (
              <ModelTaskBreakdown tasks={tasks} />
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">
                  Task breakdown data is not available for this model.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cost" className="space-y-6">
            <ModelCostEfficiency submissions={submissions} />
          </TabsContent>

          <TabsContent value="runs" className="space-y-6">
            <ModelRunHistory
              submissions={submissions}
              benchmarkVersions={modelData.benchmark_versions}
              officialOnly={officialOnly}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
