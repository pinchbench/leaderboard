'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { LeaderboardEntry, SortMode } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { ShareableWrapper } from '@/components/shareable-wrapper'

interface SimpleLeaderboardProps {
  entries: LeaderboardEntry[]
  view: 'success' | 'speed' | 'cost' | 'value'
  scoreMode: 'best' | 'average'
  benchmarkVersion?: string | null
  officialOnly: boolean
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
  if (rank === 1) return '🦞'
  if (rank === 2) return '🦀'
  if (rank === 3) return '🦐'
  return ''
}

const getValueScoreColor = (valueScore: number) => {
  if (valueScore >= 200) return 'hsl(142, 71%, 45%)'
  if (valueScore >= 50) return 'hsl(38, 92%, 50%)'
  return 'hsl(0, 84%, 60%)'
}

const BEST_SCORE_COLOR = '#F35528'
const AVG_SCORE_COLOR = '#FF9151'

export function SimpleLeaderboard({
  entries,
  view,
  scoreMode,
  benchmarkVersion,
  officialOnly,
  onScoreModeChange,
  onProviderClick,
}: SimpleLeaderboardProps) {
  const [showLowScores, setShowLowScores] = useState(false)
  const [showZeroCostResults, setShowZeroCostResults] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('quality')
  const [maxCostFilter, setMaxCostFilter] = useState<string>('')
  const lowScoreCutoff = 40

  const submissionHref = (submissionId: string) => (
    officialOnly ? `/submission/${submissionId}` : `/submission/${submissionId}?official=false`
  )
  const getSortScorePercentage = (entry: LeaderboardEntry) => {
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
    if (view === 'value') return entry.value_score ?? null
    return getSortScorePercentage(entry)
  }

  const maxCost = useMemo(() => {
    const parsed = parseFloat(maxCostFilter)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [maxCostFilter])

  const budgetFilteredEntries = useMemo(() => {
    if (maxCost == null) return entries
    return entries.filter(
      (e) => e.best_cost_usd != null && e.best_cost_usd <= maxCost
    )
  }, [entries, maxCost])

  const sortedEntries = useMemo(() => {
    const src = (view === 'value' || maxCost != null) ? budgetFilteredEntries : entries
    return [...src].sort((a, b) => {
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

      if (view === 'value') {
        const aV = a.value_score ?? -1
        const bV = b.value_score ?? -1
        return bV - aV
      }

      // success view: respect sortMode
      if (sortMode === 'value') {
        const aV = a.value_score ?? -1
        const bV = b.value_score ?? -1
        if (Math.abs(bV - aV) > 1e-9) return bV - aV
      }

      const aScore = getSortScorePercentage(a) ?? -1
      const bScore = getSortScorePercentage(b) ?? -1
      return bScore - aScore
    })
  }, [budgetFilteredEntries, entries, view, sortMode, scoreMode, maxCost])

  const rankedEntries = sortedEntries.filter((entry) => getViewValue(entry) !== null)
  const nullEntries = sortedEntries.filter((entry) => getViewValue(entry) === null)

  const { displayedEntries, hiddenEntries, zeroCostEntries } = useMemo(() => {
    if (view === 'cost') {
      const nonZero = rankedEntries.filter((entry) => entry.best_cost_usd !== 0)
      const zero = rankedEntries.filter((entry) => entry.best_cost_usd === 0)
      return {
        displayedEntries: showZeroCostResults ? rankedEntries : nonZero,
        hiddenEntries: [] as LeaderboardEntry[],
        zeroCostEntries: zero,
      }
    }

    if (view === 'value') {
      return {
        displayedEntries: rankedEntries,
        hiddenEntries: [] as LeaderboardEntry[],
        zeroCostEntries: [] as LeaderboardEntry[],
      }
    }

    if (view !== 'success') {
      return {
        displayedEntries: rankedEntries,
        hiddenEntries: [] as LeaderboardEntry[],
        zeroCostEntries: [] as LeaderboardEntry[],
      }
    }

    const visible = rankedEntries.filter((entry) => {
      const scorePercentage = getSortScorePercentage(entry)
      return scorePercentage != null && scorePercentage >= lowScoreCutoff
    })
    const hidden = rankedEntries.filter((entry) => {
      const scorePercentage = getSortScorePercentage(entry)
      return scorePercentage != null && scorePercentage < lowScoreCutoff
    })

    return {
      displayedEntries: showLowScores ? visible.concat(hidden) : visible,
      hiddenEntries: hidden,
      zeroCostEntries: [] as LeaderboardEntry[],
    }
  }, [rankedEntries, showLowScores, showZeroCostResults, view, scoreMode])

  const showToggle = view === 'success' && hiddenEntries.length > 0

  // ----------------------------------------------------------------
  // VALUE view
  // ----------------------------------------------------------------
  if (view === 'value') {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <h2 className="text-xl font-bold text-foreground">
              Value Score &amp; Cost Efficiency
            </h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Models ranked by <strong>Value Score</strong> (success&nbsp;% ÷ cost per run).
          Higher = more bang for your buck. CPST = Cost Per Successful Task.
        </p>
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
          <Info className="h-3 w-3 flex-shrink-0" />
          Models without cost data are excluded. CPST is estimated from best run score (~40 tasks).
        </p>

        {/* Budget Filter */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg border border-border bg-muted/20">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">💰 Budget filter</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Max cost per run: $</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 0.50"
              value={maxCostFilter}
              onChange={(e) => setMaxCostFilter(e.target.value)}
              className="w-28 px-2 py-1 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {maxCostFilter && (
              <button
                type="button"
                onClick={() => setMaxCostFilter('')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕ Clear
              </button>
            )}
          </div>
          {maxCost != null && (
            <span className="text-xs text-primary font-medium">
              Showing {displayedEntries.length} models ≤ ${maxCost.toFixed(2)}/run
            </span>
          )}
        </div>

        <ShareableWrapper
          title="Value Score Rankings"
          subtitle={`${displayedEntries.length} models${maxCost != null ? ` • budget ≤ $${maxCost.toFixed(2)}` : ''}`}
        >
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Rank</th>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Model</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Provider</th>
                  <th className="px-2 md:px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    <ColumnTooltip
                      label="Value Score"
                      description="Success % divided by cost per run (USD). Higher is better — measures how much quality you get per dollar spent."
                      benchmarkVersion={benchmarkVersion}
                    />
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    <ColumnTooltip
                      label="Success %"
                      description="Best success rate for this model on the current benchmark."
                      benchmarkVersion={benchmarkVersion}
                    />
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    <ColumnTooltip
                      label="Best Cost"
                      description="Lowest total API cost (USD) across all runs for this model."
                      benchmarkVersion={benchmarkVersion}
                    />
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    <ColumnTooltip
                      label="CPST"
                      description="Cost Per Successful Task = best_cost / estimated_successful_tasks. Estimated from score % × ~40 tasks. Lower is better."
                      benchmarkVersion={benchmarkVersion}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedEntries.map((entry, index) => {
                  const vs = entry.value_score
                  const cpst = entry.cpst
                  return (
                    <tr key={entry.submission_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-2 md:px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                      </td>
                      <td className="px-2 md:px-4 py-3">
                        <Link href={`/submission/${entry.submission_id}`} className="flex items-center gap-2 transition-colors">
                          <code className="text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none">{entry.model}</code>
                        </Link>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onProviderClick?.(entry.provider)}
                          className="text-xs font-medium hover:underline cursor-pointer"
                          style={{ color: PROVIDER_COLORS[entry.provider.toLowerCase()] || '#666' }}
                        >
                          {entry.provider}
                        </button>
                      </td>
                      <td className="px-2 md:px-4 py-3 text-right">
                        {vs != null ? (
                          <span className="text-sm font-bold" style={{ color: getValueScoreColor(vs) }}>
                            {vs.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-right">
                        <span className="text-sm font-medium text-foreground">
                          {entry.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-right">
                        <span className="text-sm font-medium text-foreground">
                          {entry.best_cost_usd != null ? `$${entry.best_cost_usd.toFixed(3)}` : 'N/A'}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-right">
                        <span className="text-sm font-medium text-foreground">
                          {cpst != null ? `$${cpst.toFixed(4)}` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {nullEntries.map((entry) => (
                  <tr key={entry.submission_id} className="text-muted-foreground opacity-60">
                    <td className="px-2 md:px-4 py-3">--</td>
                    <td className="px-2 md:px-4 py-3">
                      <Link href={`/submission/${entry.submission_id}`}>
                        <code className="text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none">{entry.model}</code>
                      </Link>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <span className="text-xs">{entry.provider}</span>
                    </td>
                    <td className="px-2 md:px-4 py-3 text-right text-xs">N/A</td>
                    <td className="hidden md:table-cell px-4 py-3 text-right text-xs">{entry.percentage.toFixed(1)}%</td>
                    <td className="hidden md:table-cell px-4 py-3 text-right text-xs">no cost data</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-right text-xs">N/A</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">
              All tasks and grading criteria are{' '}
              <a href="https://github.com/pinchbench/skill" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                open source
              </a>
              . Value Score = Success% / Cost. CPST = Cost / Successful Tasks (est.).
            </div>
          </div>
        </ShareableWrapper>
      </div>
    )
  }

  // ----------------------------------------------------------------
  // SUCCESS view
  // ----------------------------------------------------------------
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
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort mode toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
              <button
                onClick={() => setSortMode('quality')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sortMode === 'quality'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Max Quality
              </button>
              <button
                onClick={() => setSortMode('value')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sortMode === 'value'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                💎 Best Value
              </button>
            </div>
            {/* Score sort toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
              <button
                onClick={() => onScoreModeChange?.('best')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'best'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Sort: Best
              </button>
              <button
                onClick={() => onScoreModeChange?.('average')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'average'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Sort: Avg
              </button>
            </div>
          </div>
        </div>

        {/* Budget Filter for success view */}
        <div className="flex items-center gap-3 mb-4 p-2 rounded-lg border border-border bg-muted/10">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">💰 Budget filter:</span>
          <span className="text-xs text-muted-foreground">Max $</span>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="no limit"
            value={maxCostFilter}
            onChange={(e) => setMaxCostFilter(e.target.value)}
            className="w-24 px-2 py-0.5 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">per run</span>
          {maxCostFilter && (
            <button
              type="button"
              onClick={() => setMaxCostFilter('')}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              ✕
            </button>
          )}
          {maxCost != null && (
            <span className="text-xs text-primary font-medium">
              {displayedEntries.length} models shown
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          Percentage of{' '}
          <Link
            href="https://github.com/pinchbench/skill/tree/main/tasks"
            className="underline underline-offset-2 hover:text-foreground"
            target="_blank"
          >
            tasks
          </Link> completed successfully across standardized
          OpenClaw agent tests
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
          subtitle={`${displayedEntries.length} models${sortMode === 'value' ? ' • sorted by value' : ` • sorted by ${scoreMode} score`}`}
          alwaysShowButton
        >
          <div className="hidden md:block bg-card border border-border rounded-lg p-6 mb-6">
            <div className="mb-4 flex items-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: BEST_SCORE_COLOR }} />
                Best Score
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: AVG_SCORE_COLOR }} />
                Average Score
              </span>
            </div>
            <div className="space-y-3">
              {displayedEntries.concat(nullEntries).map((entry) => {
                const bestPct = entry.percentage
                const avgPct = entry.average_score_percentage != null
                  ? entry.average_score_percentage * 100
                  : null
                return (
                  <Tooltip key={entry.submission_id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={submissionHref(entry.submission_id)}
                        className="block group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-72 flex items-center gap-2 flex-shrink-0">
                            <span className="text-xl" title={`Rank ${entry.rank}`}>
                              {getCrabEmoji(entry.rank)}
                            </span>
                            <code className="text-xs font-mono text-foreground transition-colors truncate">
                              {entry.model}
                            </code>
                            {entry.official === false && (
                              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                                Unofficial
                              </span>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="bg-muted rounded-full h-7 relative overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300 group-hover:opacity-80"
                                  style={{
                                    width: `${bestPct}%`,
                                    backgroundColor: BEST_SCORE_COLOR,
                                  }}
                                />
                                <span
                                  className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-foreground"
                                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                >
                                  {bestPct.toFixed(1)}%
                                </span>
                              </div>
                              <div className="bg-muted rounded-full h-7 relative overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300 group-hover:opacity-80"
                                  style={{
                                    width: `${avgPct ?? 0}%`,
                                    backgroundColor: AVG_SCORE_COLOR,
                                  }}
                                />
                                <span
                                  className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-foreground"
                                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                >
                                  {avgPct == null ? 'N/A' : `${avgPct.toFixed(1)}%`}
                                </span>
                              </div>
                            </div>
                            <div className="w-24 text-right space-y-1.5">
                              <div>
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: BEST_SCORE_COLOR }}
                                >
                                  {bestPct.toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: AVG_SCORE_COLOR }}
                                >
                                  {avgPct == null ? 'N/A' : `${avgPct.toFixed(1)}%`}
                                </span>
                              </div>
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
                        {entry.value_score != null && (
                          <>
                            <span className="text-muted-foreground">Value Score</span>
                            <span className="text-foreground font-medium text-right">{entry.value_score.toFixed(1)}</span>
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
          subtitle={`${displayedEntries.length} models • sorted by ${scoreMode} score`}
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
                    <span className="md:hidden">{scoreMode === 'best' ? 'Best %' : 'Avg %'}</span>
                    <span className="hidden md:inline">Best %</span>
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    <ColumnTooltip
                      label="Avg %"
                      description="Average success rate across all runs for this model. Click any row to see the per-task scoring breakdown with individual pass/fail details."
                      benchmarkVersion={benchmarkVersion}
                    />
                  </th>
                  {sortMode === 'value' && (
                    <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                      <ColumnTooltip
                        label="💎 Value Score"
                        description="Success % ÷ best cost per run. Higher means more quality per dollar."
                        benchmarkVersion={benchmarkVersion}
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedEntries.concat(nullEntries).map((entry) => {
                  const bestPct = entry.percentage
                  const avgPct = entry.average_score_percentage != null
                    ? entry.average_score_percentage * 100
                    : null
                  const mobileScore = scoreMode === 'best' ? bestPct : avgPct
                  const mobileScoreColor = scoreMode === 'best' ? BEST_SCORE_COLOR : AVG_SCORE_COLOR
                  return (
                    <tr
                      key={entry.submission_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-2 md:px-4 py-3">
                        <Link
                          href={submissionHref(entry.submission_id)}
                          className="flex items-center gap-2 transition-colors"
                        >
                          <span className="text-lg">{getCrabEmoji(entry.rank)}</span>
                          <code className="text-xs md:text-sm font-mono truncate max-w-[180px] md:max-w-none">{entry.model}</code>
                          {entry.official === false && (
                            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                              Unofficial
                            </span>
                          )}
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
                          className="text-sm font-bold md:hidden"
                          style={{ color: mobileScoreColor }}
                        >
                          {mobileScore == null ? 'N/A' : `${mobileScore.toFixed(1)}%`}
                        </span>
                        <span
                          className="hidden md:inline text-sm font-bold"
                          style={{ color: BEST_SCORE_COLOR }}
                        >
                          {bestPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-right">
                        <span className="text-sm font-medium" style={{ color: AVG_SCORE_COLOR }}>
                          {avgPct == null ? 'N/A' : `${avgPct.toFixed(1)}%`}
                        </span>
                      </td>
                      {sortMode === 'value' && (
                        <td className="hidden md:table-cell px-4 py-3 text-right">
                          {entry.value_score != null ? (
                            <span className="text-sm font-bold" style={{ color: getValueScoreColor(entry.value_score) }}>
                              {entry.value_score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </td>
                      )}
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

  // ----------------------------------------------------------------
  // SPEED / COST views (unchanged)
  // ----------------------------------------------------------------
  const formatValue = (entry: LeaderboardEntry) => {
    if (view === 'speed') {
      return entry.best_execution_time_seconds == null
        ? 'N/A'
        : `${entry.best_execution_time_seconds.toFixed(2)}s`
    }
    if (view === 'cost') {
      return entry.best_cost_usd == null ? 'N/A' : `$${entry.best_cost_usd.toFixed(2)}`
    }
    const scorePercentage = getSortScorePercentage(entry)
    return scorePercentage == null ? 'N/A' : `${scorePercentage.toFixed(1)}%`
  }

  const entriesToRank = view === 'cost' ? displayedEntries : rankedEntries
  const ranked = entriesToRank.map((entry, index) => ({ entry, rank: index + 1 }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{view === 'speed' ? '⚡' : '💰'}</span>
          <h2 className="text-xl font-bold text-foreground">
            {view === 'speed' ? 'Speed by model' : 'Cost by model'}
          </h2>
        </div>
        {view === 'cost' && zeroCostEntries.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-zero-cost"
              checked={showZeroCostResults}
              onCheckedChange={(checked) => setShowZeroCostResults(checked === true)}
            />
            <label
              htmlFor="show-zero-cost"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Show $0 Results
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cost tracking can be unreliable for some providers, resulting in $0 values being saved incorrectly. These results are hidden by default.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {view === 'speed'
          ? 'Fastest submission time per model (best run)'
          : 'Lowest submission cost per model (best run)'}
      </p>

      <ShareableWrapper
        title={view === 'speed' ? 'Speed Rankings' : 'Cost Rankings'}
        subtitle={`${ranked.length} models • Best run`}
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
                      ? "Wall-clock time for the model's fastest complete benchmark run across all submissions."
                      : "Total API cost (USD) for the model's cheapest complete benchmark run."}
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
                      href={submissionHref(entry.submission_id)}
                      className="flex items-center gap-2 transition-colors"
                    >
                      <code className="text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none">{entry.model}</code>
                      {entry.official === false && (
                        <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                          Unofficial
                        </span>
                      )}
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
                      href={submissionHref(entry.submission_id)}
                      className="flex items-center gap-2 transition-colors"
                    >
                      <code className="text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none">{entry.model}</code>
                      {entry.official === false && (
                        <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                          Unofficial
                        </span>
                      )}
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
