'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { DEFAULT_TABLE_ROW_LIMIT } from '@/lib/constants'
import type { BestForBadge, LeaderboardEntry, SortMode } from '@/lib/types'
import { PROVIDER_COLORS, TASK_CATEGORY_BY_ID } from '@/lib/types'
import { ShareableWrapper } from '@/components/shareable-wrapper'
import { KiloClawAdCard } from '@/components/kiloclaw-ad-card'

interface SimpleLeaderboardProps {
  entries: LeaderboardEntry[]
  view: 'success' | 'speed' | 'cost' | 'value'
  scoreMode: 'best' | 'average'
  sortMode: SortMode
  maxCostFilter: string
  showZeroCostResults: boolean
  benchmarkVersion?: string | null
  officialOnly: boolean
  championBadges?: Record<string, BestForBadge[]>
  selectedCategories?: string[]
  activeCategoryTaskCount?: number | null
  onScoreModeChange?: (mode: 'best' | 'average') => void
  onSortModeChange?: (mode: SortMode) => void
  onMaxCostFilterChange?: (value: string) => void
  onShowZeroCostResultsChange?: (value: boolean) => void
  onProviderClick?: (provider: string) => void
  onProviderToggle?: (provider: string) => void
}

function toggleProviderInUrl(provider: string, url: URL) {
  const providers = url.searchParams.get('provider')
  if (!providers) {
    url.searchParams.set('provider', provider.toLowerCase())
    return
  }
  const list = providers.split(',').map(p => p.trim().toLowerCase())
  const idx = list.indexOf(provider.toLowerCase())
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(provider.toLowerCase())
  }
  if (list.length === 0) {
    url.searchParams.delete('provider')
  } else {
    url.searchParams.set('provider', list.join(','))
  }
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
  sortMode,
  maxCostFilter,
  showZeroCostResults,
  benchmarkVersion,
  officialOnly,
  championBadges = {},
  selectedCategories = [],
  activeCategoryTaskCount,
  onScoreModeChange,
  onSortModeChange,
  onMaxCostFilterChange,
  onShowZeroCostResultsChange,
  onProviderClick,
  onProviderToggle,
}: SimpleLeaderboardProps) {
  const [showAllEntries, setShowAllEntries] = useState(false)
  const categoryFilterActive = selectedCategories.length > 0
  const selectedCategoryLabels = selectedCategories
    .map((cat) => TASK_CATEGORY_BY_ID[cat]?.label ?? cat.replace(/_/g, ' '))
    .join(', ')

  const submissionHref = (submissionId: string) => (
    officialOnly ? `/submission/${submissionId}` : `/submission/${submissionId}?official=false`
  )

  const onProviderSelect = onProviderToggle ?? onProviderClick
  const handleProviderClick = (provider: string) => {
    if (onProviderSelect) {
      onProviderSelect(provider)
    }
  }

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
      const baseEntries = showZeroCostResults ? rankedEntries : nonZero
      return {
        displayedEntries: showAllEntries
          ? baseEntries
          : baseEntries.slice(0, DEFAULT_TABLE_ROW_LIMIT),
        hiddenEntries: baseEntries.slice(DEFAULT_TABLE_ROW_LIMIT),
        zeroCostEntries: zero,
      }
    }

    if (view === 'value') {
      return {
        displayedEntries: showAllEntries
          ? rankedEntries
          : rankedEntries.slice(0, DEFAULT_TABLE_ROW_LIMIT),
        hiddenEntries: rankedEntries.slice(DEFAULT_TABLE_ROW_LIMIT),
        zeroCostEntries: [] as LeaderboardEntry[],
      }
    }

    if (view === 'success') {
      return {
        displayedEntries: showAllEntries
          ? rankedEntries
          : rankedEntries.slice(0, DEFAULT_TABLE_ROW_LIMIT),
        hiddenEntries: rankedEntries.slice(DEFAULT_TABLE_ROW_LIMIT),
        zeroCostEntries: [] as LeaderboardEntry[],
      }
    }

    return {
      displayedEntries: showAllEntries
        ? rankedEntries
        : rankedEntries.slice(0, DEFAULT_TABLE_ROW_LIMIT),
      hiddenEntries: rankedEntries.slice(DEFAULT_TABLE_ROW_LIMIT),
      zeroCostEntries: [] as LeaderboardEntry[],
    }
  }, [rankedEntries, showAllEntries, showZeroCostResults, view])

  const hiddenRowCount = hiddenEntries.length + nullEntries.length
  const showToggle = hiddenRowCount > 0

  const modelHref = (provider: string, model: string) =>
    `/model/${provider.toLowerCase()}/${model}${officialOnly ? '' : '?official=false'}`

  const renderBadges = (entry: LeaderboardEntry) => {
    const badges = championBadges[entry.submission_id] ?? []
    if (badges.length === 0) return null

    return (
      <span className="flex flex-col items-start gap-1">
        {badges.slice(0, 3).map((badge) => (
          <span
            key={badge.key}
            className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200 whitespace-nowrap"
            title={`${badge.label} category champion`}
          >
            <span aria-hidden="true">👑</span>
            {badge.icon !== '👑' && <span aria-hidden="true">{badge.icon}</span>}
            {badge.label}
          </span>
        ))}
      </span>
    )
  }

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
        <p className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5">
          <Info className="h-3 w-3 flex-shrink-0" />
          Models without cost data are excluded. CPST is estimated from best run score (~40 tasks).
        </p>

        {maxCost != null && (
          <div className="mb-4 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary font-medium">
            Showing {displayedEntries.length} models ≤ ${maxCost.toFixed(2)}/run
          </div>
        )}

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
                        <Link href={modelHref(entry.provider, entry.model)} className="flex items-center gap-2 transition-colors">
                          <code className="text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none hover:text-primary transition-colors cursor-pointer">{entry.model}</code>
                        </Link>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleProviderClick(entry.provider)}
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
                {showAllEntries && nullEntries.map((entry) => (
                  <tr key={entry.submission_id} className="text-muted-foreground opacity-60">
                    <td className="px-2 md:px-4 py-3">--</td>
                    <td className="px-2 md:px-4 py-3">
                      <Link href={modelHref(entry.provider, entry.model)}>
                        <code className="text-xs md:text-sm font-mono truncate max-w-[150px] md:max-w-none hover:text-primary transition-colors cursor-pointer">{entry.model}</code>
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
            {showToggle && (
              <div className="border-t border-border bg-card px-4 py-3 text-center" data-share-exclude="true">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllEntries((prev) => !prev)}
                >
                  {showAllEntries
                    ? `Show top ${DEFAULT_TABLE_ROW_LIMIT}`
                    : `Show all (${hiddenRowCount} more)`}
                </Button>
              </div>
            )}
            <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">
              All tasks and grading criteria are{' '}
              <a href="https://github.com/pinchbench/skill" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                open source
              </a>
              . Value Score = Success% / Cost. CPST = Cost / Successful Tasks (est.).
            </div>
          </div>
        </ShareableWrapper>
        <KiloClawAdCard />
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
        </div>

        {maxCost != null && (
          <div className="mb-4 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary font-medium">
            Showing {displayedEntries.length} models ≤ ${maxCost.toFixed(2)}/run
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-2">
          {categoryFilterActive ? (
            <>
              Best-run scores recalculated from {selectedCategoryLabels}
              {activeCategoryTaskCount != null ? ` (${activeCategoryTaskCount} tasks)` : ''}.
            </>
          ) : (
            <>
              Percentage of{' '}
              <Link
                href="https://github.com/pinchbench/skill/tree/main/tasks"
                className="underline underline-offset-2 hover:text-foreground"
                target="_blank"
              >
                tasks
              </Link>{' '}
              completed successfully across standardized OpenClaw agent tests
            </>
          )}
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
          title={categoryFilterActive ? 'Category Score by Model' : 'Success Rate by Model'}
          subtitle={categoryFilterActive
            ? `${displayedEntries.length} models • ${selectedCategoryLabels}`
            : `${displayedEntries.length} models${sortMode === 'value' ? ' • sorted by value' : ` • sorted by ${scoreMode} score`}`}
          alwaysShowButton
        >
          <div className="hidden md:block bg-card border border-border rounded-lg p-6 mb-6">
            <div className="mb-4 flex items-center gap-5 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => onScoreModeChange?.('best')}
                className={`inline-flex items-center gap-2 cursor-pointer transition-opacity select-none ${scoreMode === 'best' ? 'opacity-100 font-semibold text-foreground' : 'opacity-60 hover:opacity-100'}`}
              >
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: BEST_SCORE_COLOR }} />
                {categoryFilterActive ? 'Category Score' : 'Best Score'}
              </button>
              {!categoryFilterActive && (
                <button
                  type="button"
                  onClick={() => onScoreModeChange?.('average')}
                  className={`inline-flex items-center gap-2 cursor-pointer transition-opacity select-none ${scoreMode === 'average' ? 'opacity-100 font-semibold text-foreground' : 'opacity-60 hover:opacity-100'}`}
                >
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: AVG_SCORE_COLOR }} />
                  Average Score
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(showAllEntries ? displayedEntries.concat(nullEntries) : displayedEntries).map((entry) => {
                const bestPct = entry.percentage
                const avgPct = entry.average_score_percentage != null
                  ? entry.average_score_percentage * 100
                  : null
                return (
                  <Tooltip key={entry.submission_id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={modelHref(entry.provider, entry.model)}
                        className="block group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-56 flex items-center gap-2 flex-shrink-0">
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
                          <div className="w-44 flex-shrink-0">
                            {renderBadges(entry)}
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 space-y-1.5">
                              <div className="bg-muted rounded-full h-5 relative overflow-hidden">
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
                              {!categoryFilterActive && (
                                <div className="bg-muted rounded-full h-5 relative overflow-hidden">
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
                              )}
                            </div>
                            <div className="w-24 text-right space-y-1">
                              <div>
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: BEST_SCORE_COLOR }}
                                >
                                  {bestPct.toFixed(1)}%
                                </span>
                              </div>
                              {!categoryFilterActive && (
                                <div>
                                  <span
                                    className="text-sm font-bold"
                                    style={{ color: AVG_SCORE_COLOR }}
                                  >
                                    {avgPct == null ? 'N/A' : `${avgPct.toFixed(1)}%`}
                                  </span>
                                </div>
                              )}
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
                        <span className="text-muted-foreground">{categoryFilterActive ? 'Category score' : 'Best score'}</span>
                        <span className="text-foreground font-medium text-right">{bestPct.toFixed(1)}%</span>
                        {!categoryFilterActive && avgPct != null && (
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
                  onClick={() => setShowAllEntries((prev) => !prev)}
                >
                  {showAllEntries
                    ? `Show top ${DEFAULT_TABLE_ROW_LIMIT}`
                    : `Show all (${hiddenRowCount} more)`}
                </Button>
              </div>
            )}
          </div>
        </ShareableWrapper>

        <KiloClawAdCard />

        {/* Simple Table */}
        <ShareableWrapper
          title={categoryFilterActive ? 'Category Score Rankings' : 'Success Rate Rankings'}
          subtitle={categoryFilterActive
            ? `${displayedEntries.length} models • ${selectedCategoryLabels}`
            : `${displayedEntries.length} models • sorted by ${scoreMode} score`}
        >
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Model
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Badges
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Provider
                  </th>
                  <th
                    className="px-2 md:px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => onScoreModeChange?.('best')}
                  >
                    <span className="md:hidden">{categoryFilterActive ? 'Cat %' : scoreMode === 'best' ? 'Best %' : 'Avg %'}</span>
                    <span className="hidden md:inline">{categoryFilterActive ? 'Category %' : 'Best %'}</span>
                  </th>
                  {!categoryFilterActive && (
                    <th
                      className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => onScoreModeChange?.('average')}
                    >
                      <ColumnTooltip
                        label="Avg %"
                        description="Average success rate across all runs for this model. Click any row to see the per-task scoring breakdown with individual pass/fail details."
                        benchmarkVersion={benchmarkVersion}
                      />
                    </th>
                  )}
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
                {(showAllEntries ? displayedEntries.concat(nullEntries) : displayedEntries).map((entry) => {
                  const bestPct = entry.percentage
                  const avgPct = entry.average_score_percentage != null
                    ? entry.average_score_percentage * 100
                    : null
                  const mobileScore = categoryFilterActive || scoreMode === 'best' ? bestPct : avgPct
                  const mobileScoreColor = categoryFilterActive || scoreMode === 'best' ? BEST_SCORE_COLOR : AVG_SCORE_COLOR
                  return (
                    <tr
                      key={entry.submission_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-2 md:px-4 py-3">
                        <Link
                          href={modelHref(entry.provider, entry.model)}
                          className="flex items-center gap-2 transition-colors"
                        >
                          <span className="text-lg">{getCrabEmoji(entry.rank)}</span>
                          <code className="text-xs md:text-sm font-mono truncate max-w-[180px] md:max-w-none">{entry.model}</code>
                          <span className="md:hidden">{renderBadges(entry)}</span>
                          {entry.official === false && (
                            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                              Unofficial
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        {renderBadges(entry)}
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
                      {!categoryFilterActive && (
                        <td className="hidden md:table-cell px-4 py-3 text-right">
                          <span className="text-sm font-medium" style={{ color: AVG_SCORE_COLOR }}>
                            {avgPct == null ? 'N/A' : `${avgPct.toFixed(1)}%`}
                          </span>
                        </td>
                      )}
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
                  onClick={() => setShowAllEntries((prev) => !prev)}
                >
                  {showAllEntries
                    ? `Show top ${DEFAULT_TABLE_ROW_LIMIT}`
                    : `Show all (${hiddenRowCount} more)`}
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
  // SPEED / COST views
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

  const entriesToRank = displayedEntries
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
                      href={modelHref(entry.provider, entry.model)}
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
                      onClick={() => handleProviderClick(entry.provider)}
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
                    <span className="text-sm font-medium text-foreground">
                      {formatValue(entry)}
                    </span>
                  </td>
                </tr>
              ))}
              {showAllEntries && nullEntries.map((entry) => (
                <tr key={entry.submission_id} className="text-muted-foreground opacity-60">
                  <td className="px-2 md:px-4 py-3">--</td>
                  <td className="px-2 md:px-4 py-3">
                    <Link
                      href={modelHref(entry.provider, entry.model)}
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
                      onClick={() => handleProviderClick(entry.provider)}
                      className="text-xs font-medium hover:underline cursor-pointer"
                      style={{
                        color:
                          PROVIDER_COLORS[entry.provider.toLowerCase()] || '#666',
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
                onClick={() => setShowAllEntries((prev) => !prev)}
              >
                {showAllEntries
                  ? `Show top ${DEFAULT_TABLE_ROW_LIMIT}`
                  : `Show all (${hiddenRowCount} more)`}
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
      <KiloClawAdCard />
    </div>
  )
}
