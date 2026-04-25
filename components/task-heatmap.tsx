'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LeaderboardEntry } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { fetchSubmissionClient } from '@/lib/api'
import { transformSubmission } from '@/lib/transforms'
import { ShareableWrapper } from '@/components/shareable-wrapper'
import { CategoryPills } from '@/components/category-pills'
import { getCategoryMeta } from '@/lib/category-scores'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TaskHeatmapProps {
  entries: LeaderboardEntry[]
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
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

export function TaskHeatmap({ entries, selectedCategories, onCategoriesChange }: TaskHeatmapProps) {
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

  const categoryFilterActive = selectedCategories.length > 0

  const filteredTasks = useMemo(() => {
    if (!categoryFilterActive) return allTasks
    const set = new Set(selectedCategories.map((c) => c.toLowerCase()))
    return allTasks.filter((t) => set.has(t.category.toLowerCase()))
  }, [allTasks, selectedCategories, categoryFilterActive])

  const modelFilteredPercentage = useMemo(() => {
    const map = new Map<string, number>()
    if (!categoryFilterActive || filteredTasks.length === 0) return map
    for (const m of modelData) {
      let sumScore = 0
      let sumMax = 0
      for (const task of filteredTasks) {
        const td = m.tasks.get(task.taskId)
        if (td) {
          sumScore += td.score
          sumMax += td.maxScore
        }
      }
      map.set(m.model, sumMax > 0 ? (sumScore / sumMax) * 100 : 0)
    }
    return map
  }, [modelData, filteredTasks, categoryFilterActive])

  // Sort models
  const sortedModels = useMemo(() => {
    const sorted = [...modelData]
    if (sortBy === 'score') {
      if (categoryFilterActive && filteredTasks.length > 0) {
        sorted.sort(
          (a, b) =>
            (modelFilteredPercentage.get(b.model) ?? 0) - (modelFilteredPercentage.get(a.model) ?? 0)
        )
      } else {
        sorted.sort((a, b) => b.percentage - a.percentage)
      }
    } else {
      sorted.sort((a, b) => a.model.localeCompare(b.model))
    }
    return sorted
  }, [modelData, sortBy, categoryFilterActive, filteredTasks.length, modelFilteredPercentage])

  // Group tasks by category for header display
  const categoryGroups = useMemo(() => {
    const groups: Array<{ category: string; count: number }> = []
    let current = ''
    let count = 0
    for (const task of filteredTasks) {
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
  }, [filteredTasks])

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

  if (categoryFilterActive && filteredTasks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          No tasks match the selected categories for this benchmark version.
        </p>
        <button
          type="button"
          onClick={() => onCategoriesChange([])}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90"
        >
          Show all categories
        </button>
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
        {categoryFilterActive && filteredTasks.length > 0 ? (
          <span className="block mt-1 text-muted-foreground/90">
            Filtered view: percentages in the model column reflect only the tasks shown in the heatmap.
          </span>
        ) : null}
      </p>

      {categoryFilterActive && filteredTasks.length > 0 ? (
        <div
          className="mb-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          role="status"
        >
          Showing {filteredTasks.length} of {allTasks.length} tasks · scores recalculated from selected
          categories
        </div>
      ) : null}

      <CategoryPills
        selectedCategories={selectedCategories}
        onCategoriesChange={onCategoriesChange}
        activeTaskCount={categoryFilterActive ? filteredTasks.length : null}
        className="mb-4"
      />

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground shrink-0">Sort models by:</span>
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
          {sortBy === 'score' && categoryFilterActive ? (
            <p className="text-[11px] text-muted-foreground max-w-xl pl-0 sm:pl-[5.5rem] sm:text-xs">
              Rank and model % use aggregate points only over visible tasks.
            </p>
          ) : null}
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-2 sm:ml-auto">
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

      <TooltipProvider delayDuration={100}>
        <ShareableWrapper
          title="Task-Level Performance Heatmap"
          subtitle={`${sortedModels.length} models × ${filteredTasks.length} tasks${categoryFilterActive ? ` (filtered from ${allTasks.length})` : ''}`}
        >
          <div className="rounded-lg border border-border bg-background overflow-x-auto min-w-0">
          <table
            className="text-xs border-collapse w-max mx-auto"
            style={{ minWidth: filteredTasks.length * 36 + 180 }}
          >
            {/* Category header row */}
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-background border-b border-r border-border p-1 min-w-[180px] w-[180px] box-border" />
                {categoryGroups.map((group) => (
                  <th
                    key={group.category}
                    colSpan={group.count}
                    className="border-b border-border px-1 py-1.5 text-center font-medium text-muted-foreground bg-muted/30"
                  >
                      <span title={getCategoryMeta(group.category).label}>
                        {getCategoryMeta(group.category).icon} {getCategoryMeta(group.category).shortLabel}
                    </span>
                  </th>
                ))}
              </tr>
              {/* Task name header row */}
              <tr>
                <th className="sticky left-0 z-20 bg-background border-b border-r border-border p-1 text-left font-medium text-muted-foreground min-w-[180px] w-[180px] box-border">
                  Model
                </th>
                {filteredTasks.map((task) => (
                  <th
                    key={task.taskId}
                    className="border-b border-border p-0 font-normal text-muted-foreground/70"
                    style={{ width: 36, minWidth: 36, maxWidth: 36 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="flex items-end justify-center overflow-hidden cursor-help"
                          style={{ height: 80 }}
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
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium">{task.taskName}</p>
                        <p className="text-xs text-muted-foreground">{getCategoryMeta(task.category).label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedModels.map((model) => {
                const providerColor = PROVIDER_COLORS[model.provider.toLowerCase()] || '#888'
                return (
                  <tr key={model.model} className="hover:bg-muted/20">
                    <td className="sticky left-0 z-10 bg-background border-b border-r border-border px-2 py-1.5 align-top min-w-[180px] w-[180px] max-w-[180px] box-border">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: providerColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-foreground truncate block max-w-[160px]" title={model.model}>
                            {model.model}
                          </span>
                          {categoryFilterActive && filteredTasks.length > 0 ? (
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">
                              {Math.round(modelFilteredPercentage.get(model.model) ?? 0)}%
                              <span className="text-muted-foreground/70"> · visible tasks</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    {filteredTasks.map((task) => {
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
      </TooltipProvider>
    </div>
  )
}
