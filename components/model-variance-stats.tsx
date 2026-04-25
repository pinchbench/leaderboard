'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ApiModelSubmissionItem } from '@/lib/types'
import { getScoreColorHex, computeStats } from '@/lib/scores'
import { fmtNum, fmtCurrency, fmtDuration } from '@/lib/format'

interface StatRowProps {
  label: string
  min: string
  max: string
  avg: string
  median?: string
  stddev?: string
}

function StatRow({ label, min, max, avg, median, stddev }: StatRowProps) {
  return (
    <div className="grid grid-cols-5 gap-2 py-2 border-b border-border last:border-b-0 text-sm">
      <div className="text-muted-foreground font-medium">{label}</div>
      <div>{min}</div>
      <div>{max}</div>
      <div>{avg}</div>
      <div className="flex gap-3">
        {median !== undefined && <span>{median}</span>}
        {stddev !== undefined && <span className="text-muted-foreground">±{stddev}</span>}
      </div>
    </div>
  )
}

export function ModelVarianceStats({ submissions }: { submissions: ApiModelSubmissionItem[] }) {
  if (submissions.length === 0) return null

  const scores = submissions.map(s => s.score_percentage * 100)
  const costs = submissions
    .map(s => s.total_cost_usd)
    .filter((c): c is number => c != null && c > 0)
  const times = submissions
    .map(s => s.total_execution_time_seconds)
    .filter((t): t is number => t != null && t > 0)

  const scoreStats = computeStats(scores)
  const costStats = computeStats(costs)
  const timeStats = computeStats(times)

  const bestData = [
    { name: 'Best', value: scoreStats?.max ?? 0, color: getScoreColorHex(scoreStats?.max ?? 0) },
    { name: 'Average', value: scoreStats?.avg ?? 0, color: getScoreColorHex(scoreStats?.avg ?? 0) },
    { name: 'Median', value: scoreStats?.median ?? 0, color: getScoreColorHex(scoreStats?.median ?? 0) },
  ]

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-lg font-semibold mb-3">Run Variance Statistics</h3>

      <div className="mb-4">
        <div className="grid grid-cols-5 gap-2 py-2 border-b border-border text-sm text-muted-foreground">
          <div>Metric</div>
          <div>Min</div>
          <div>Max</div>
          <div>Average</div>
          <div>Median / StdDev</div>
        </div>
        {scoreStats && (
          <StatRow
            label="Score"
            min={`${fmtNum(scoreStats.min, 1)}%`}
            max={`${fmtNum(scoreStats.max, 1)}%`}
            avg={`${fmtNum(scoreStats.avg, 1)}%`}
            median={`${fmtNum(scoreStats.median, 1)}%`}
            stddev={fmtNum(scoreStats.stddev, 1)}
          />
        )}
        <StatRow
          label="Cost"
          min={costStats ? fmtCurrency(costStats.min) : 'N/A'}
          max={costStats ? fmtCurrency(costStats.max) : 'N/A'}
          avg={costStats ? fmtCurrency(costStats.avg) : 'N/A'}
        />
        <StatRow
          label="Speed"
          min={timeStats ? fmtDuration(timeStats.min) : 'N/A'}
          max={timeStats ? fmtDuration(timeStats.max) : 'N/A'}
          avg={timeStats ? fmtDuration(timeStats.avg) : 'N/A'}
        />
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Score Comparison</h4>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={bestData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={60} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [`${fmtNum(value, 1)}%`, 'Score']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
              {bestData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
