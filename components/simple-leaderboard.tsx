'use client'

import Link from 'next/link'
import type { LeaderboardEntry } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'

interface SimpleLeaderboardProps {
  entries: LeaderboardEntry[]
  view: 'success' | 'speed' | 'cost'
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

export function SimpleLeaderboard({ entries, view }: SimpleLeaderboardProps) {
  const getViewValue = (entry: LeaderboardEntry) => {
    if (view === 'speed') return entry.best_execution_time_seconds ?? null
    if (view === 'cost') return entry.best_cost_usd ?? null
    return entry.percentage
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

    return b.percentage - a.percentage
  })

  const rankedEntries = sortedEntries.filter((entry) => getViewValue(entry) !== null)
  const nullEntries = sortedEntries.filter((entry) => getViewValue(entry) === null)

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
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="space-y-3">
            {rankedEntries.concat(nullEntries).map((entry) => (
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
                          width: `${entry.percentage}%`,
                          backgroundColor: getPercentageColor(entry.percentage),
                        }}
                      />
                      <span
                        className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {entry.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-16 text-right">
                      <span
                        className="text-sm font-bold"
                        style={{ color: getPercentageColor(entry.percentage) }}
                      >
                        {entry.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Simple Table */}
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
              {rankedEntries.concat(nullEntries).map((entry) => (
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
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:
                          PROVIDER_COLORS[entry.provider.toLowerCase()] || '#666',
                      }}
                    >
                      {entry.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="text-sm font-bold"
                      style={{ color: getPercentageColor(entry.percentage) }}
                    >
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    return `${entry.percentage.toFixed(1)}%`
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
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: PROVIDER_COLORS[entry.provider.toLowerCase()] || '#666',
                    }}
                  >
                    {entry.provider}
                  </span>
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
                <td className="px-4 py-3">—</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/submission/${entry.submission_id}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <code className="text-sm font-mono">{entry.model}</code>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: PROVIDER_COLORS[entry.provider.toLowerCase()] || '#666',
                    }}
                  >
                    {entry.provider}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">N/A</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
