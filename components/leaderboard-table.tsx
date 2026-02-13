'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ColoredProgress } from '@/components/ui/colored-progress'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { LeaderboardEntry } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
}

const getMedalEmoji = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 85) return 'text-green-500'
  if (percentage >= 70) return 'text-yellow-500'
  return 'text-red-500'
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showLowScores, setShowLowScores] = useState(false)
  const lowScoreCutoff = 40

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === 'score') {
      return sortOrder === 'desc'
        ? b.percentage - a.percentage
        : a.percentage - b.percentage
    }
    return sortOrder === 'desc'
      ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  })

  const visibleEntries = sortedEntries.filter(
    (entry) => entry.percentage >= lowScoreCutoff
  )
  const hiddenEntries = sortedEntries.filter(
    (entry) => entry.percentage < lowScoreCutoff
  )
  const displayedEntries = showLowScores
    ? visibleEntries.concat(hiddenEntries)
    : visibleEntries
  const showToggle = hiddenEntries.length > 0

  const toggleSort = (column: 'score' | 'date') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Model
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Provider
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('score')}
              >
                <div className="flex items-center gap-1">
                  Score
                  {sortBy === 'score' &&
                    (sortOrder === 'desc' ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    ))}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Progress
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Submitted
                  {sortBy === 'date' &&
                    (sortOrder === 'desc' ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    ))}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedEntries.map((entry) => (
              <tr
                key={entry.submission_id}
                className="hover:bg-muted/30 transition-colors group"
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMedalEmoji(entry.rank)}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {entry.rank}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <code className="text-sm font-mono text-foreground">
                    {entry.model}
                  </code>
                </td>
                <td className="px-4 py-4">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor:
                        PROVIDER_COLORS[entry.provider.toLowerCase()] ||
                        '#666',
                      color:
                        PROVIDER_COLORS[entry.provider.toLowerCase()] ||
                        '#666',
                    }}
                  >
                    {entry.provider}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${getScoreColor(entry.percentage)}`}
                    >
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="w-32">
                    <ColoredProgress value={entry.percentage} className="h-2" />
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.timestamp), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link href={`/submission/${entry.submission_id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View Details
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </td>
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

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {displayedEntries.map((entry) => (
          <Link
            key={entry.submission_id}
            href={`/submission/${entry.submission_id}`}
            className="block p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMedalEmoji(entry.rank)}</span>
                <div>
                  <code className="text-sm font-mono text-foreground block">
                    {entry.model}
                  </code>
                  <Badge
                    variant="outline"
                    className="mt-1"
                    style={{
                      borderColor:
                        PROVIDER_COLORS[entry.provider.toLowerCase()] ||
                        '#666',
                      color:
                        PROVIDER_COLORS[entry.provider.toLowerCase()] ||
                        '#666',
                    }}
                  >
                    {entry.provider}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-lg font-bold ${getScoreColor(entry.percentage)}`}
                  >
                    {entry.percentage.toFixed(1)}%
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${getScoreColor(entry.percentage)}`}
                >
                  {entry.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <ColoredProgress value={entry.percentage} className="h-2 mb-2" />
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(entry.timestamp), {
                addSuffix: true,
              })}
            </div>
          </Link>
        ))}
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
