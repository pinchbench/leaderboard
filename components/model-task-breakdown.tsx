'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColoredProgress } from '@/components/ui/colored-progress'
import { ChevronDown, ChevronRight, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { TaskResult } from '@/lib/types'
import { CATEGORY_ICONS } from '@/lib/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { getScoreColorFromRaw, getScoreColorClass, SCORE_THRESHOLDS } from '@/lib/scores'

interface ModelTaskBreakdownProps {
  tasks: TaskResult[]
  averageTaskScores?: Record<string, number>
}

const getScoreIcon = (score: number, maxScore: number, timedOut: boolean): React.ReactElement => {
  if (timedOut) return <XCircle className="h-5 w-5 text-red-500" />
  const percentage = (score / maxScore) * 100
  if (percentage >= SCORE_THRESHOLDS.EXCELLENT) return <CheckCircle className="h-5 w-5 text-green-500" />
  if (percentage >= SCORE_THRESHOLDS.GOOD) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
  return <XCircle className="h-5 w-5 text-red-500" />
}

const getGradingBadgeVariant = (
  type: 'automated' | 'llm_judge' | 'hybrid'
) => {
  switch (type) {
    case 'automated':
      return 'default'
    case 'llm_judge':
      return 'secondary'
    case 'hybrid':
      return 'outline'
  }
}

type ComparisonResult = {
  label: string
  icon: string
  color: string
  bg: string
  border: string
} | null

export const getComparisonIndicator = (
  taskScore: number,
  maxScore: number,
  averageScore?: number
): ComparisonResult => {
  if (averageScore === undefined) return null

  const taskPercentage = (taskScore / maxScore) * 100
  const diff = taskPercentage - averageScore

  if (diff > 5) {
    return {
      label: 'Above average',
      icon: '↑',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    }
  }
  if (diff < -5) {
    return {
      label: 'Below average',
      icon: '↓',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    }
  }
  return {
    label: 'Average',
    icon: '→',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  }
}

export function ModelTaskBreakdown({
  tasks,
  averageTaskScores,
}: ModelTaskBreakdownProps) {
  const [openTasks, setOpenTasks] = useState<Set<string>>(new Set())

  const toggleTask = (taskId: string) => {
    const newOpenTasks = new Set(openTasks)
    if (newOpenTasks.has(taskId)) {
      newOpenTasks.delete(taskId)
    } else {
      newOpenTasks.add(taskId)
    }
    setOpenTasks(newOpenTasks)
  }

  const excellingCount = tasks.filter((t) => {
    const pct = (t.score / t.max_score) * 100
    return pct >= SCORE_THRESHOLDS.EXCELLENT
  }).length

  const strugglingCount = tasks.filter((t) => {
    const pct = (t.score / t.max_score) * 100
    return pct < SCORE_THRESHOLDS.GOOD
  }).length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Task Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {excellingCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Tasks excelling (≥{SCORE_THRESHOLDS.EXCELLENT}%)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {strugglingCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Tasks struggling (&lt;{SCORE_THRESHOLDS.GOOD}%)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {tasks.length}
              </div>
              <div className="text-xs text-muted-foreground">Total tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {tasks.map((task) => {
          const percentage = (task.score / task.max_score) * 100
          const isOpen = openTasks.has(task.task_id)
          const avgScore = averageTaskScores?.[task.task_id]
          const comparison = getComparisonIndicator(
            task.score,
            task.max_score,
            avgScore
          )

          return (
            <Collapsible
              key={task.task_id}
              open={isOpen}
              onOpenChange={() => toggleTask(task.task_id)}
            >
              <div className="rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getScoreIcon(
                          task.score,
                          task.max_score,
                          task.timed_out
                        )}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-foreground">
                            {task.task_name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_ICONS[task.category]} {task.category}
                          </Badge>
                          <Badge
                            variant={getGradingBadgeVariant(task.grading_type)}
                            className="text-xs"
                          >
                            {task.grading_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-bold ${getScoreColorFromRaw(task.score, task.max_score)}`}
                          >
                            {task.score.toFixed(2)} /{' '}
                            {task.max_score.toFixed(2)}
                          </span>
                          <div className="flex-1 max-w-xs">
                            <ColoredProgress
                              value={percentage}
                              className="h-1.5"
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${getScoreColorFromRaw(task.score, task.max_score)}`}
                          >
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {comparison && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${comparison.color} ${comparison.bg} ${comparison.border}`}
                        >
                          {comparison.icon} {comparison.label}
                        </Badge>
                      )}
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border px-4 py-4">
                    {avgScore !== undefined && (
                      <div className="mb-4 p-3 rounded bg-muted/50 border border-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Leaderboard Average
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-24">
                              <ColoredProgress
                                value={avgScore}
                                className="h-1.5"
                              />
                            </div>
                            <span
                              className={`font-mono font-medium ${getScoreColorClass(avgScore)}`}
                            >
                              {avgScore.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <h5 className="text-sm font-semibold text-foreground mb-3">
                      Criterion Breakdown
                    </h5>
                    <div className="space-y-2">
                      {Object.entries(task.breakdown).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <ColoredProgress
                                value={value * 100}
                                className="h-1.5"
                              />
                            </div>
                            <span
                              className={`font-mono font-medium w-12 text-right ${getScoreColorFromRaw(value, 1)}`}
                            >
                              {value.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {task.timed_out && (
                      <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">
                          ⏱️ Task exceeded timeout limit
                        </p>
                      </div>
                    )}
                    {task.notes && (
                      <div className="mt-3 p-2 rounded bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Note:</span>{' '}
                          {task.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
