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
  // Sort by score descending
  const sortedEntries = [...entries].sort((a, b) => b.total_score - a.total_score)

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
          Percentage of tasks completed successfully out of 10 standardized OpenClaw agent tests
        </p>

        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="space-y-3">
            {sortedEntries.map((entry) => (
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
                        {entry.total_score.toFixed(0)}/10
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
              {sortedEntries.map((entry) => (
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
                      {entry.total_score.toFixed(1)}/10.0
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
          ? 'Coming soon - Average time per task completion'
          : 'Coming soon - Total cost per benchmark run'}
      </p>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <span className="text-6xl mb-4 block">🦞</span>
        <p className="text-muted-foreground">
          {view === 'speed' ? 'Speed' : 'Cost'} metrics coming soon!
        </p>
      </div>
    </div>
  )
}
