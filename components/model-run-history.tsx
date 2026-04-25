'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { ApiModelSubmissionItem } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getScoreColorClass } from '@/lib/scores'
import { fmtSpeed, fmtCurrency } from '@/lib/format'

interface ModelRunHistoryProps {
  submissions: ApiModelSubmissionItem[]
  benchmarkVersions: string[]
  officialOnly: boolean
}

export function filterSubmissionsByVersion(
  submissions: ApiModelSubmissionItem[],
  selectedVersion: string
): ApiModelSubmissionItem[] {
  if (selectedVersion === 'all') return submissions
  return submissions.filter(s => {
    const parts = s.id.split('_')
    const suffix = parts[parts.length - 1]
    return suffix.startsWith(selectedVersion)
  })
}

export function sortSubmissionsByTimestamp(
  submissions: ApiModelSubmissionItem[]
): ApiModelSubmissionItem[] {
  return [...submissions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function ModelRunHistory({ submissions, benchmarkVersions, officialOnly }: ModelRunHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>('all')

  const filteredSubmissions = useMemo(() => {
    return filterSubmissionsByVersion(submissions, selectedVersion)
  }, [submissions, selectedVersion])

  const sortedSubmissions = useMemo(() => {
    return sortSubmissionsByTimestamp(filteredSubmissions)
  }, [filteredSubmissions])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Run History</CardTitle>
        <Select value={selectedVersion} onValueChange={setSelectedVersion}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All versions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All versions</SelectItem>
            {benchmarkVersions.map(version => (
              <SelectItem key={version} value={version}>
                {version.slice(0, 7)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Score</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Speed</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cost</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Benchmark Version</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubmissions.map((submission) => {
                const date = new Date(submission.timestamp)
                const dateStr = formatDistanceToNow(date) + ' ago'
                const version = submission.id.split('_').pop()?.slice(0, 7) || 'Unknown'
                const linkHref = officialOnly
                  ? `/submission/${submission.id}`
                  : `/submission/${submission.id}?official=false`

                return (
                  <tr key={submission.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">{dateStr}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getScoreColorClass(submission.score_percentage * 100)}`}>
                          {(submission.score_percentage * 100).toFixed(1)}%
                        </span>
                        {submission.is_best && (
                          <Badge variant="default" className="bg-green-600 text-xs px-1.5 py-0">
                            Best
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {fmtSpeed(submission.total_execution_time_seconds)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {submission.total_cost_usd != null ? fmtCurrency(submission.total_cost_usd, 2) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {version}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={linkHref}>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {sortedSubmissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No runs found for the selected version
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
