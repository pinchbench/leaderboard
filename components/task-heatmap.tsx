'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LeaderboardEntry, TaskResult } from '@/lib/types'
import { PROVIDER_COLORS, CATEGORY_ICONS } from '@/lib/types'
import { fetchSubmissionClient } from '@/lib/api'
import { transformSubmission } from '@/lib/transforms'
import { ShareableWrapper } from '@/components/shareable-wrapper'

interface TaskHeatmapProps {
  entries: LeaderboardEntry[]
  scoreMode: 'best' | 'average'
}

interface ModelTaskData {
  model: string
  provider: string
  percentage: number
  tasks: Map<string, { score: number; maxScore: number; taskName: string; category: string }>
}

function getScoreColor(ratio: number): string {
  // Red (0%) -> Yellow (50%) -> Green (100%)
  if (ratio >= 0.85) return 'hsl(142, 71%, 35%)'
  if (ratio >= 0.7) return 'hsl(142, 50%, 28%)'
  if (ratio >= 0.5) return 'hsl(48, 90%, 35%)'
  if (ratio >= 0.3) return 'hsl(25, 90%, 35%)'
  if (ratio > 0) return 'hsl(0, 70%, 35%)'
  return 'hsl(0, 60%, 25%)'
}

function getScoreTextColor(ratio: number): string {
  if (ratio >= 0.7) return 'hsl(142, 70%, 75%)'
  if (ratio >= 0.5) return 'hsl(48, 90%, 75%)'
  if (ratio >= 0.3) return 'hsl(25, 90%, 75%)'
  return 'hsl(0, 70%, 75%)'
}

export function TaskHeatmap({ entries, scoreMode }: TaskHeatmapProps) {
  const [modelData, setModelData] = useState<ModelTaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score')
  const [hoveredCell, setHoveredCell] = useState<{ model: string; taskId: string } | null>(null)

  // Fetch task-level data for each model's best submission
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        // Fetch submissions in batches of 5 to avoid overwhelming the API
        const results: ModelTaskData[] = []
        const batchSize = 5

        for (let i = 0; i < entries.length; i += batchSize) {
          if (cancelled) return

          const batch = entries.slice(i, i + batchSize)
          const batchResults = await Promise.all(
            batch.map(async (entry) => {
              try {
                const response = await fetchSubmissionClient(entry.submission_id)
                const submission = transformSubmission(response.submission)
                const taskMap = new Map<string, { score: number; maxScore: number; taskName: string; category: string }>()

                for (const task of submission.task_results) {
                  taskMap.set(task.task_id, {
                    score: task.score,
                    maxScore: task.max_score,
                    taskName: task.task_name,
                    category: task.category,
                  })
                }

                return {
                  model: entry.model,
                  provider: entry.provider,
                  percentage: entry.percentage,
                  tasks: taskMap,
                } as ModelTaskData
              } catch {
                return null
              }
            })
          )

          results.push(...batchResults.filter((r): r is ModelTaskData => r !== null))
        }

        if (!cancelled) {
          setModelData(results)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load task data')
          setLoading(false)
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [entries])

  // Collect all unique tasks and sort by category
  const allTasks = useMemo(() => {
    const taskMap = new Map<string, { taskName: string; category: string }>()
    for (const model of modelData) {
      for (const [taskId, task] of model.tasks) {
        if (!taskMap.has(taskId)) {
          taskMap.set(taskId, { taskName: task.taskName, category: task.category })
        }
      }
    }

    return Array.from(taskMap.entries())
      .map(([taskId, info]) => ({ taskId, ...info }))
      .sort((a, b) => {
        const catCmp = a.category.localeCompare(b.category)
        if (catCmp !== 0) return catCmp
        return a.taskName.localeCompare(b.taskName)
      })
  }, [modelData])

  // Sort models
  const sortedModels = useMemo(() => {
    const sorted = [...modelData]
    if (sortBy === 'score') {
      sorted.sort((a, b) => b.percentage - a.percentage)
    } else {
      sorted.sort((a, b) => a.model.localeCompare(b.model))
    }
    return sorted
  }, [modelData, sortBy])

  // Group tasks by category for header display
  const categoryGroups = useMemo(() => {
    const groups: Array<{ category: string; count: number }> = []
    let current = ''
    let count = 0
    for (const task of allTasks) {
      if (task.category !== current) {
        if (current) groups.push({ category: current, count })
        current = task.category
        count = 1
      } else {
        count++
      }
    }
    if (current) groups.push({ category: current, count })
    return groups
  }, [allTasks])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
        <p className="text-sm text-muted-foreground">
          Loading task-level data for {entries.length} models...
        </p>
        {modelData.length > 0 && (
          <p className="text-xs text-muted-foreground/60 mt-1">
            {modelData.length} of {entries.length} loaded
          </p>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (modelData.length === 0 || allTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">No task data available.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Task-Level Performance Heatmap
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Each cell shows the score percentage for a model on a specific task.
        Tasks are grouped by category.
      </p>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort models by:</span>
          <button
            onClick={() => setSortBy('score')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              sortBy === 'score'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Score
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              sortBy === 'name'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Name
          </button>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">Score:</span>
          <div className="flex items-center gap-0.5">
            {[0, 0.3, 0.5, 0.7, 0.85, 1.0].map((v) => (
              <div
                key={v}
                className="w-5 h-3 rounded-sm"
                style={{ backgroundColor: getScoreColor(v) }}
                title={`${Math.round(v * 100)}%`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">0% - 100%</span>
        </div>
      </div>

      <ShareableWrapper
        title="Task-Level Performance Heatmap"
        subtitle={`${sortedModels.length} models x ${allTasks.length} tasks`}
      >
        <div className="rounded-lg border border-border bg-background overflow-x-auto">
          <table className="text-xs border-collapse w-full" style={{ minWidth: allTasks.length * 36 + 180 }}>
            {/* Category header row */}
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-background border-b border-r border-border p-1" />
                {categoryGroups.map((group) => (
                  <th
                    key={group.category}
                    colSpan={group.count}
                    className="border-b border-border px-1 py-1.5 text-center font-medium text-muted-foreground bg-muted/30"
                  >
                    <span title={group.category} className="capitalize">
                      {CATEGORY_ICONS[group.category] || ''} {group.category}
                    </span>
                  </th>
                ))}
              </tr>
              {/* Task name header row */}
              <tr>
                <th className="sticky left-0 z-20 bg-background border-b border-r border-border p-1 text-left font-medium text-muted-foreground min-w-[180px]">
                  Model
                </th>
                {allTasks.map((task) => (
                  <th
                    key={task.taskId}
                    className="border-b border-border p-0 font-normal text-muted-foreground/70"
                    style={{ width: 36, minWidth: 36, maxWidth: 36 }}
                  >
                    <div
                      className="flex items-end justify-center overflow-hidden"
                      style={{ height: 80 }}
                      title={task.taskName}
                    >
                      <span
                        className="block whitespace-nowrap text-[9px] origin-bottom-left"
                        style={{
                          transform: 'rotate(-55deg)',
                          transformOrigin: 'center center',
                          maxWidth: 75,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.taskName}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedModels.map((model) => {
                const providerColor = PROVIDER_COLORS[model.provider.toLowerCase()] || '#888'
                return (
                  <tr key={model.model} className="hover:bg-muted/20">
                    <td className="sticky left-0 z-10 bg-background border-b border-r border-border px-2 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: providerColor }}
                        />
                        <span className="font-medium text-foreground truncate max-w-[160px]" title={model.model}>
                          {model.model}
                        </span>
                      </div>
                    </td>
                    {allTasks.map((task) => {
                      const taskData = model.tasks.get(task.taskId)
                      const ratio = taskData ? taskData.score / taskData.maxScore : 0
                      const hasData = !!taskData
                      const isHovered = hoveredCell?.model === model.model && hoveredCell?.taskId === task.taskId

                      return (
                        <td
                          key={task.taskId}
                          className="border-b border-border/30 p-0 text-center relative"
                          style={{
                            backgroundColor: hasData ? getScoreColor(ratio) : 'transparent',
                            width: 36,
                            minWidth: 36,
                            maxWidth: 36,
                          }}
                          onMouseEnter={() => setHoveredCell({ model: model.model, taskId: task.taskId })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {hasData && (
                            <span
                              className="text-[10px] font-medium"
                              style={{ color: getScoreTextColor(ratio) }}
                            >
                              {Math.round(ratio * 100)}
                            </span>
                          )}
                          {!hasData && (
                            <span className="text-muted-foreground/30 text-[10px]">-</span>
                          )}

                          {/* Tooltip */}
                          {isHovered && taskData && (
                            <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none">
                              <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md whitespace-nowrap">
                                <p className="font-medium text-sm text-popover-foreground">{model.model}</p>
                                <p className="text-xs text-muted-foreground">{task.taskName}</p>
                                <p className="text-xs mt-1">
                                  <span className="text-muted-foreground">Score: </span>
                                  <span className="font-medium">{taskData.score}/{taskData.maxScore}</span>
                                  <span className="text-muted-foreground ml-1">({Math.round(ratio * 100)}%)</span>
                                </p>
                              </div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ShareableWrapper>
    </div>
  )
}
