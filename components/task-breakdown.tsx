'use client'

import { Progress } from "@/components/ui/progress"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ColoredProgress } from '@/components/ui/colored-progress'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { TaskResult } from '@/lib/types'
import { CATEGORY_ICONS } from '@/lib/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface TaskBreakdownProps {
  tasks: TaskResult[]
}

const getScoreColor = (score: number, maxScore: number) => {
  const percentage = (score / maxScore) * 100
  if (percentage >= 85) return 'text-green-500'
  if (percentage >= 70) return 'text-yellow-500'
  return 'text-red-500'
}

const getScoreIcon = (score: number, maxScore: number, timedOut: boolean) => {
  if (timedOut) return '❌'
  const percentage = (score / maxScore) * 100
  if (percentage >= 85) return '✅'
  if (percentage >= 70) return '⚠️'
  return '❌'
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

export function TaskBreakdown({ tasks }: TaskBreakdownProps) {
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

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const percentage = (task.score / task.max_score) * 100
        const isOpen = openTasks.has(task.task_id)

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
                    <div className="text-2xl flex-shrink-0">
                      {getScoreIcon(task.score, task.max_score, task.timed_out)}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-foreground">
                          {task.task_name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_ICONS[task.category]}{' '}
                          {task.category}
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
                          className={`text-sm font-bold ${getScoreColor(task.score, task.max_score)}`}
                        >
                          {task.score.toFixed(2)} / {task.max_score.toFixed(2)}
                        </span>
                        <div className="flex-1 max-w-xs">
                          <ColoredProgress value={percentage} className="h-1.5" />
                        </div>
                        <span
                          className={`text-xs font-medium ${getScoreColor(task.score, task.max_score)}`}
                        >
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
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
                            <Progress value={value * 100} className="h-1.5" />
                          </div>
                          <span
                            className={`font-mono font-medium w-12 text-right ${getScoreColor(value, 1)}`}
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
                        <span className="font-semibold">Note:</span> {task.notes}
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
  )
}
