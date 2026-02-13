import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Copy } from 'lucide-react'
import { ScoreGauge } from '@/components/score-gauge'
import { TaskBreakdown } from '@/components/task-breakdown'
import { PROVIDER_COLORS } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { fetchSubmission } from '@/lib/api'
import { transformSubmission } from '@/lib/transforms'

interface SubmissionPageProps {
  params: Promise<{ id: string }>
}

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const { id } = await params
  let submission

  try {
    const response = await fetchSubmission(id)
    submission = transformSubmission(response.submission)
  } catch (error) {
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
                  <p className="text-xs text-muted-foreground">Submission Details</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Card className="p-6 bg-card border-border">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Unable to load submission
            </h2>
            <p className="text-sm text-muted-foreground">
              There was a problem fetching this submission. Please try again later.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  if (!submission) {
    notFound()
  }

  const categoryStats = submission.task_results.reduce(
    (acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = { total: 0, max: 0, count: 0 }
      }
      acc[task.category].total += task.score
      acc[task.category].max += task.max_score
      acc[task.category].count += 1
      return acc
    },
    {} as Record<string, { total: number; max: number; count: number }>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <h1 className="text-xl font-bold text-foreground">
                  PinchBench
                </h1>
                <p className="text-xs text-muted-foreground">
                  Submission Details
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Model Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <code className="text-3xl font-mono font-bold text-foreground">
                  {submission.model}
                </code>
                <Badge
                  variant="outline"
                  className="text-sm"
                  style={{
                    borderColor:
                      PROVIDER_COLORS[submission.provider.toLowerCase()] ||
                      '#666',
                    color:
                      PROVIDER_COLORS[submission.provider.toLowerCase()] ||
                      '#666',
                  }}
                >
                  {submission.provider}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Submitted{' '}
                {formatDistanceToNow(new Date(submission.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Copy className="h-4 w-4 mr-2" />
              Copy ID
            </Button>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">OpenClaw Version: </span>
              <code className="font-mono text-foreground">
                {submission.openclaw_version}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">Submission ID: </span>
              <code className="font-mono text-foreground text-xs">
                {submission.submission_id}
              </code>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <ScoreGauge
              score={submission.total_score}
              maxScore={submission.max_score}
            />
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const percentage = (stats.total / stats.max) * 100
              const getColor = () => {
                if (percentage >= 85) return 'text-green-500'
                if (percentage >= 70) return 'text-yellow-500'
                return 'text-red-500'
              }

              return (
                <Card
                  key={category}
                  className="p-4 bg-card border-border flex flex-col"
                >
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    {category}
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-2xl font-bold ${getColor()}`}>
                      {percentage.toFixed(0)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({stats.count} tasks)
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {stats.total.toFixed(1)} / {stats.max.toFixed(1)}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Task Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              Task Breakdown
            </h2>
            <p className="text-sm text-muted-foreground">
              {submission.task_results.length} tasks completed
            </p>
          </div>
          <TaskBreakdown tasks={submission.task_results} />
        </div>

        {/* Help Section */}
        <Card className="mt-8 p-6 bg-muted/30 border-border">
          <div className="flex items-start gap-4">
            <div className="text-2xl">🦀</div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Understanding the Scores
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Automated:</strong> Deterministic checks (file
                  existence, API calls, format validation)
                </p>
                <p>
                  <strong>LLM Judge:</strong> Quality assessment by another LLM
                  (coherence, grammar, engagement)
                </p>
                <p>
                  <strong>Hybrid:</strong> Combination of automated checks and
                  LLM evaluation
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>


    </div>
  )
}
