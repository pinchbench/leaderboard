'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { LeaderboardEntry } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { ShareableWrapper } from '@/components/shareable-wrapper'

interface SimpleLeaderboardProps {
  entries: LeaderboardEntry[]
  view: 'success' | 'speed' | 'cost'
  scoreMode: 'best' | 'average'
  onProviderClick?: (provider: string) => void
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

export function SimpleLeaderboard({ entries, view, scoreMode, onProviderClick }: SimpleLeaderboardProps) {
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
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🦀</span>
          <h2 className="text-xl font-bold text-foreground">
            Success rate by model
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Percentage of tasks completed successfully across standardized OpenClaw agent tests
        </p>

        {/* Bar Chart */}
        <ShareableWrapper
          title="Success Rate by Model"
          subtitle={`${scoreMode === 'best' ? 'Best' : 'Average'} score \u2022 ${displayedEntries.length} models`}
        >
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="space-y-3">
              {displayedEntries.concat(nullEntries).map((entry) => {
                const scorePercentage = getScorePercentage(entry)
                const displayPercentage = scorePercentage ?? 0
                return (
                  <Link
                    key={entry.submission_id}
                    href={`/submission/${entry.submission_id}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-48 flex items-center gap-2 flex-shrink-0">
                        <span className="text-xl" title={`Rank ${entry.rank}`}>
                          {getCrabEmoji(entry.rank)}
                        </span>
                        <code className="text-xs font-mono text-foreground group-hover:text-primary transition-colors truncate">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Success %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    Score
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
                      <td className="px-4 py-3">
                        <Link
                          href={`/submission/${entry.submission_id}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <span className="text-lg">{getCrabEmoji(entry.rank)}</span>
                          <code className="text-sm font-mono">{entry.model}</code>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3 text-right">
                        <span
                          className="text-sm font-bold"
                          style={{ color: getPercentageColor(displayPercentage) }}
                        >
                          {scorePercentage == null ? 'N/A' : `${scorePercentage.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
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

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Model
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Provider
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                {view === 'speed' ? 'Best Time' : 'Best Cost'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ranked.map(({ entry, rank }) => (
              <tr key={entry.submission_id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/submission/${entry.submission_id}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <code className="text-sm font-mono">{entry.model}</code>
                  </Link>
                </td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-foreground">
                    {formatValue(entry)}
                  </span>
                </td>
              </tr>
            ))}
            {nullEntries.map((entry) => (
              <tr key={entry.submission_id} className="text-muted-foreground">
                <td className="px-4 py-3">--</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/submission/${entry.submission_id}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <code className="text-sm font-mono">{entry.model}</code>
                  </Link>
                </td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-right">N/A</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showToggle && (
          <div className="border-t border-border bg-card px-4 py-3 text-center">
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
    </div>
  )
}
