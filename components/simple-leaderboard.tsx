'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { LeaderboardEntry } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { ShareableWrapper } from '@/components/shareable-wrapper'

interface SimpleLeaderboardProps {
  entries: LeaderboardEntry[]
  view: 'success' | 'speed' | 'cost'
  scoreMode: 'best' | 'average'
  benchmarkVersion?: string | null
  onScoreModeChange?: (mode: 'best' | 'average') => void
  onProviderClick?: (provider: string) => void
}

function ColumnTooltip({
  label,
  description,
  benchmarkVersion,
}: {
  label: string
  description: string
  benchmarkVersion?: string | null
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help">
          {label}
          <Info className="h-3 w-3 text-muted-foreground/60" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs p-3 normal-case">
        <p className="font-medium text-foreground text-xs mb-1">{label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        {benchmarkVersion && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Benchmark version: <code className="font-mono">{benchmarkVersion}</code>
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <a href="/about" className="text-xs text-primary hover:underline">
            How we benchmark
          </a>
          <span className="text-xs text-muted-foreground">·</span>
          <a
            href="https://github.com/pinchbench/skill/tree/main/tasks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View tasks
          </a>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

const getCrabEmoji = (rank: number) => {
  if (rank === 1) return '🦞' // Lobster for #1
  if (rank === 2) return '🦀' // Crab for #2
  if (rank === 3) return '🦐' // Shrimp for #3
  return ''
}

const getPercentageColor = (percentage: number) => {
  if (percentage >= 85) return 'hsl(142, 71%, 45%)' // green
  if (percentage >= 70) return 'hsl(38, 92%, 50%)' // yellow
  return 'hsl(0, 84%, 60%)' // red
}

export function SimpleLeaderboard({
  entries,
  view,
  scoreMode,
  benchmarkVersion,
  onScoreModeChange,
  onProviderClick,
}: SimpleLeaderboardProps) {
  const [showLowScores, setShowLowScores] = useState(false)
  const lowScoreCutoff = 40
  const getScorePercentage = (entry: LeaderboardEntry) => {
    if (scoreMode === 'average') {
      return entry.average_score_percentage != null
        ? entry.average_score_percentage * 100
        : null
    }
    return entry.percentage
  }

  const getViewValue = (entry: LeaderboardEntry) => {
    if (view === 'speed') return entry.best_execution_time_seconds ?? null
    if (view === 'cost') return entry.best_cost_usd ?? null
    return getScorePercentage(entry)
  }

  const sortedEntries = [...entries].sort((a, b) => {
    if (view === 'speed') {
      const aValue = a.best_execution_time_seconds
      const bValue = b.best_execution_time_seconds
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      return aValue - bValue
    }

    if (view === 'cost') {
      const aValue = a.best_cost_usd
      const bValue = b.best_cost_usd
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      return aValue - bValue
    }

    const aScore = getScorePercentage(a) ?? -1
    const bScore = getScorePercentage(b) ?? -1
    return bScore - aScore
  })

  const rankedEntries = sortedEntries.filter((entry) => getViewValue(entry) !== null)
  const nullEntries = sortedEntries.filter((entry) => getViewValue(entry) === null)

  const { displayedEntries, hiddenEntries } = useMemo(() => {
    if (view !== 'success') {
      return {
        displayedEntries: rankedEntries,
        hiddenEntries: [] as LeaderboardEntry[],
      }
    }

    const visible = rankedEntries.filter((entry) => {
      const scorePercentage = getScorePercentage(entry)
      return scorePercentage != null && scorePercentage >= lowScoreCutoff
    })
    const hidden = rankedEntries.filter((entry) => {
      const scorePercentage = getScorePercentage(entry)
      return scorePercentage != null && scorePercentage < lowScoreCutoff
    })

    return {
      displayedEntries: showLowScores ? visible.concat(hidden) : visible,
      hiddenEntries: hidden,
    }
  }, [rankedEntries, showLowScores, view, scoreMode])

  const showToggle = view === 'success' && hiddenEntries.length > 0

  if (view === 'success') {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦀</span>
            <h2 className="text-xl font-bold text-foreground">
              Success rate by model
            </h2>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <button
              onClick={() => onScoreModeChange?.('best')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'best'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Best score
            </button>
            <button
              onClick={() => onScoreModeChange?.('average')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'average'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Average score
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Percentage of tasks completed successfully across standardized{' '}
          <Link
            href="https://github.com/pinchbench/skill/tree/main/tasks"
            className="underline underline-offset-2 hover:text-foreground"
          >
            OpenClaw agent tests
          </Link>
        </p>
        <p className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5">
          <Info className="h-3 w-3 flex-shrink-0" />
          Scores are graded via automated checks and LLM judge.{' '}
          <Link href="/about" className="text-primary hover:underline">
            How we benchmark
          </Link>
          <span>·</span>
          <a
            href="https://github.com/pinchbench/skill/tree/main/tasks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View all tasks
          </a>
        </p>

        {/* Bar Chart - hidden on mobile */}
        <ShareableWrapper
          title="Success Rate by Model"
          subtitle={`${scoreMode === 'best' ? 'Best' : 'Average'} score \u2022 ${displayedEntries.length} models`}
          alwaysShowButton
        >
          <div className="hidden md:block bg-card border border-border rounded-lg p-6 mb-6">
            <div className="space-y-3">
              {displayedEntries.concat(nullEntries).map((entry) => {
                const scorePercentage = getScorePercentage(entry)
                const displayPercentage = scorePercentage ?? 0
                const bestPct = entry.percentage
                const avgPct = entry.average_score_percentage != null
                  ? entry.average_score_percentage * 100
                  : null
                return (
                  <Tooltip key={entry.submission_id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/submission/${entry.submission_id}`}
                        className="block group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-48 flex items-center gap-2 flex-shrink-0">
                            <span className="text-xl" title={`Rank ${entry.rank}`}>
                              {getCrabEmoji(entry.rank)}
                            </span>
                            <code className="text-xs font-mono text-foreground transition-colors truncate">
                              {entry.model}
                            </code>
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 bg-muted rounded-full h-7 relative overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300 group-hover:opacity-80"
                                style={{
                                  width: `${displayPercentage}%`,
                                  backgroundColor: getPercentageColor(displayPercentage),
                                }}
                              />
                              <span
                                className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                              >
                                {scorePercentage == null ? 'N/A' : `${scorePercentage.toFixed(1)}%`}
                              </span>
                            </div>
                            <div className="w-16 text-right">
                              <span
                                className="text-sm font-bold"
                                style={{ color: getPercentageColor(displayPercentage) }}
                              >
                                {scorePercentage == null ? 'N/A' : `${scorePercentage.toFixed(1)}%`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs p-3">
                      <p className="font-medium text-foreground text-xs mb-1.5">
                        {entry.model}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          via {entry.provider}
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <span className="text-muted-foreground">Best score</span>
                        <span className="text-foreground font-medium text-right">{bestPct.toFixed(1)}%</span>
                        {avgPct != null && (
                          <>
                            <span className="text-muted-foreground">Avg score</span>
                            <span className="text-foreground font-medium text-right">{avgPct.toFixed(1)}%</span>
                          </>
                        )}
                        {entry.best_execution_time_seconds != null && (
                          <>
                            <span className="text-muted-foreground">Fastest run</span>
                            <span className="text-foreground font-medium text-right">{entry.best_execution_time_seconds.toFixed(0)}s</span>
                          </>
                        )}
                        {entry.best_cost_usd != null && (
                          <>
                            <span className="text-muted-foreground">Lowest cost</span>
                            <span className="text-foreground font-medium text-right">${entry.best_cost_usd.toFixed(2)}</span>
                          </>
                        )}
                        {entry.submission_count != null && (
                          <>
                            <span className="text-muted-foreground">Runs</span>
                            <span className="text-foreground font-medium text-right">{entry.submission_count}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Click for full task breakdown
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
            {showToggle && (
              <div className="mt-4 text-center" data-share-exclude="true">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLowScores((prev) => !prev)}
                >
                  {showLowScores
                    ? 'Show less'
                    : `Show more (${hiddenEntries.length})`}
                </Button>
              </div>
            )}
          </div>
        </ShareableWrapper>

        {/* Simple Table */}
        <ShareableWrapper
          title="Success Rate Rankings"
          subtitle={`${scoreMode === 'best' ? 'Best' : 'Average'} score \u2022 ${displayedEntries.length} models`}
        >
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Model
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Provider
                  </th>
                  <th className="px-2 md:px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    <ColumnTooltip
                      label="Success %"
                      description={scoreMode === 'best'
                        ? 'Highest success rate across all runs for this model. Tasks are graded via automated checks, LLM judge evaluation, or a hybrid of both.'
                        : 'Average success rate across all runs for this model. Tasks are graded via automated checks, LLM judge evaluation, or a hybrid of both.'}
                      benchmarkVersion={benchmarkVersion}
                    />
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    <ColumnTooltip
                      label="Score"
                      description="Raw success percentage. Click any row to see the per-task scoring breakdown with individual pass/fail details."
                      benchmarkVersion={benchmarkVersion}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedEntries.concat(nullEntries).map((entry) => {
                  const scorePercentage = getScorePercentage(entry)
                  const displayPercentage = scorePercentage ?? 0
                  return (
                    <tr
                      key={entry.submission_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-2 md:px-4 py-3">
                        <Link
                          href={`/submission/${entry.submission_id}`}
                          className="flex items-center gap-2 transition-colors"
                        >
                          <span className="text-lg">{getCrabEmoji(entry.rank)}</span>
                          <code className="text-xs md:text-sm font-mono truncate max-w-[180px] md:max-w-none">{entry.model}</code>
                        </Link>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onProviderClick?.(entry.provider)
                          }}
                          className="text-xs font-medium hover:underline cursor-pointer"
                          style={{
                            color:
                              PROVIDER_COLORS[entry.provider.toLowerCase()] || '#666',
                          }}
                        >
                          {entry.provider}
                        </button>
                      </td>
                      <td className="px-2 md:px-4 py-3 text-right">
                        <span
                          className="text-sm font-bold"
                          style={{ color: getPercentageColor(displayPercentage) }}
                        >
                          {scorePercentage == null ? 'N/A' : `${scorePercentage.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-right">
                        <span className="text-sm font-medium text-foreground">
                          {scorePercentage == null ? 'N/A' : `${scorePercentage.toFixed(1)}%`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {showToggle && (
              <div className="border-t border-border bg-card px-4 py-3 text-center" data-share-exclude="true">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLowScores((prev) => !prev)}
                >
                  {showLowScores
                    ? 'Show less'
                    : `Show more (${hiddenEntries.length})`}
                </Button>
              </div>
            )}
            <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">
              All tasks and grading criteria are{' '}
              <a
                href="https://github.com/pinchbench/skill"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                open source
              </a>
              . Hover column headers for details.
            </div>
          </div>
        </ShareableWrapper>
      </div>
    )
  }

  const formatValue = (entry: LeaderboardEntry) => {
    if (view === 'speed') {
      return entry.best_execution_time_seconds == null
        ? 'N/A'
        : `${entry.best_execution_time_seconds.toFixed(2)}s`
    }
    if (view === 'cost') {
      return entry.best_cost_usd == null ? 'N/A' : `$${entry.best_cost_usd.toFixed(2)}`
    }
    const scorePercentage = getScorePercentage(entry)
    return scorePercentage == null ? 'N/A' : `${scorePercentage.toFixed(1)}%`
  }

  const ranked = rankedEntries.map((entry, index) => ({ entry, rank: index + 1 }))

  // Speed and Cost views - simple table only
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{view === 'speed' ? '⚡' : '💰'}</span>
        <h2 className="text-xl font-bold text-foreground">
          {view === 'speed' ? 'Speed by model' : 'Cost by model'}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {view === 'speed'
          ? 'Fastest submission time per model (best run)'
          : 'Lowest submission cost per model (best run)'}
      </p>

      <ShareableWrapper
        title={view === 'speed' ? 'Speed Rankings' : 'Cost Rankings'}
        subtitle={`${ranked.length} models \u2022 Best run`}
      >
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Rank
                </th>
                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Model
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Provider
                </th>
                <th className="px-2 md:px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  <ColumnTooltip
                    label={view === 'speed' ? 'Best Time' : 'Best Cost'}
                    description={view === 'speed'
                      ? 'Wall-clock time for the model\'s fastest complete benchmark run across all submissions.'
                      : 'Total API cost (USD) for the model\'s cheapest complete benchmark run.'}
                    benchmarkVersion={benchmarkVersion}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranked.map(({ entry, rank }) => (
                <tr key={entry.submission_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-2 md:px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {rank}
                    </span>
                  </td>
                  <td className="px-2 md:px-4 py-3">
                    <Link
                      href={`/submission/${entry.submission_id}`}
                      className="flex items-center gap-2 transition-colors"
                    >
                      <code className="text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none">{entry.model}</code>
                    </Link>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onProviderClick?.(entry.provider)}
                      className="text-xs font-medium hover:underline cursor-pointer"
                      style={{
                        color: PROVIDER_COLORS[entry.provider.toLowerCase()] || '#666',
                      }}
                    >
                      {entry.provider}
                    </button>
                  </td>
                  <td className="px-2 md:px-4 py-3 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {formatValue(entry)}
                    </span>
                  </td>
                </tr>
              ))}
              {nullEntries.map((entry) => (
                <tr key={entry.submission_id} className="text-muted-foreground">
                  <td className="px-2 md:px-4 py-3">--</td>
                  <td className="px-2 md:px-4 py-3">
                    <Link
                      href={`/submission/${entry.submission_id}`}
                      className="flex items-center gap-2 transition-colors"
                    >
                      <code className="text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none">{entry.model}</code>
                    </Link>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onProviderClick?.(entry.provider)}
                      className="text-xs font-medium hover:underline cursor-pointer"
                      style={{
                        color: PROVIDER_COLORS[entry.provider.toLowerCase()] || '#666',
                      }}
                    >
                      {entry.provider}
                    </button>
                  </td>
                  <td className="px-2 md:px-4 py-3 text-right">N/A</td>
                </tr>
              ))}
            </tbody>
          </table>
          {showToggle && (
            <div className="border-t border-border bg-card px-4 py-3 text-center" data-share-exclude="true">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLowScores((prev) => !prev)}
              >
                {showLowScores
                  ? 'Show less'
                  : `Show more (${hiddenEntries.length})`}
              </Button>
            </div>
          )}
          <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">
            All tasks and grading criteria are{' '}
            <a
              href="https://github.com/pinchbench/skill"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              open source
            </a>
            . Hover column headers for details.
          </div>
        </div>
      </ShareableWrapper>
    </div>
  )
}
