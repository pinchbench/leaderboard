'use client'

import { DollarSign, Clock, Calculator, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ApiModelSubmissionItem } from '@/lib/types'
import { fmtCurrency, fmtDuration } from '@/lib/format'

interface ModelCostEfficiencyProps {
  submissions: ApiModelSubmissionItem[]
}

export function calculateValueScore(avgScore: number | null, avgCost: number | null): number | null {
  return avgScore != null && avgCost != null && avgCost > 0
    ? (avgScore * 100) / avgCost
    : null
}

export function getValueScoreInterpretation(valueScore: number | null): string {
  if (valueScore == null) return 'Insufficient data'
  if (valueScore >= 500) return 'Excellent value'
  if (valueScore >= 200) return 'Good value'
  if (valueScore >= 100) return 'Moderate value'
  return 'Low value'
}

export function ModelCostEfficiency({ submissions }: ModelCostEfficiencyProps) {
  const costs = submissions
    .map(s => s.total_cost_usd)
    .filter((c): c is number => c != null && c >= 0)

  const times = submissions
    .map(s => s.total_execution_time_seconds)
    .filter((t): t is number => t != null && t > 0)

  const scores = submissions.map(s => s.score_percentage).filter(s => s > 0)

  // Detect if API is missing cost/time data entirely
  const hasCostData = costs.length > 0
  const hasTimeData = times.length > 0
  const hasAnyData = hasCostData || hasTimeData

  const minCost = hasCostData ? Math.min(...costs) : null
  const maxCost = hasCostData ? Math.max(...costs) : null
  const avgCost = hasCostData ? costs.reduce((a, b) => a + b, 0) / costs.length : null

  const minTime = hasTimeData ? Math.min(...times) : null
  const maxTime = hasTimeData ? Math.max(...times) : null
  const avgTime = hasTimeData ? times.reduce((a, b) => a + b, 0) / times.length : null

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null

  const valueScore = calculateValueScore(avgScore, avgCost)

  const costSubmissions = submissions
    .filter(s => s.total_cost_usd != null && s.total_cost_usd >= 0)
  const avgCostTime = costSubmissions.length > 0
    ? costSubmissions.reduce((sum, s) => sum + (s.total_execution_time_seconds ?? 0), 0) / costSubmissions.length
    : null
  const costPerSecond = avgCostTime != null && avgCostTime > 0
    ? costSubmissions.reduce((sum, s) => sum + (s.total_cost_usd ?? 0), 0) / avgCostTime
    : null

  const allCostsZero = costs.length > 0 && costs.every(c => c === 0)

  if (!hasAnyData) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-3">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">Cost &amp; Efficiency data unavailable</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The API does not currently include per-run cost and execution time in the model submissions list.
            This data is available on the leaderboard endpoint and will be added to model submissions in a future API update.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost per Run</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {hasCostData ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min</span>
                <span className="text-sm font-medium">{fmtCurrency(minCost!)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max</span>
                <span className="text-sm font-medium">{fmtCurrency(maxCost!)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Average</span>
                <span className="text-sm font-bold">{fmtCurrency(avgCost!)}</span>
              </div>
              {allCostsZero && (
                <p className="text-xs text-muted-foreground italic">All runs were free tier</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Cost data not available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Execution Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {hasTimeData ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min</span>
                <span className="text-sm font-medium">{fmtDuration(minTime!)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max</span>
                <span className="text-sm font-medium">{fmtDuration(maxTime!)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Average</span>
                <span className="text-sm font-bold">{fmtDuration(avgTime!)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Time data not available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Speed</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {hasTimeData && hasCostData ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Time</span>
                <span className="text-sm font-medium">{fmtDuration(avgTime!)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Cost/sec</span>
                <span className="text-sm font-bold">
                  {costPerSecond != null ? fmtCurrency(costPerSecond, 4) : 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Requires both cost &amp; time data</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Value Score</CardTitle>
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-popover border rounded-md shadow-md text-sm text-popover-foreground z-50">
                Value Score measures how much score you get per dollar spent. Higher is better.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
              </div>
            </div>
          </div>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {hasCostData ? (
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold">
                  {valueScore != null ? valueScore.toFixed(2) : 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  (score &times; 100) / avg cost
                </p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="space-y-1">
                <div className="flex justify-between gap-8">
                  <span className="text-sm text-muted-foreground">Avg Score</span>
                  <span className="text-sm font-medium">{avgScore != null ? `${(avgScore * 100).toFixed(1)}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-sm text-muted-foreground">Avg Cost</span>
                  <span className="text-sm font-medium">{fmtCurrency(avgCost!)}</span>
                </div>
                {allCostsZero && (
                  <div className="flex justify-between gap-8 pt-1">
                    <span className="text-sm text-muted-foreground">Note</span>
                    <span className="text-xs text-muted-foreground italic">All runs were free tier</span>
                  </div>
                )}
                <div className="flex justify-between gap-8 pt-1 border-t">
                  <span className="text-sm font-medium">Interpretation</span>
                  <span className="text-sm font-medium">
                    {getValueScoreInterpretation(valueScore)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold text-muted-foreground">N/A</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Requires cost data
                </p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="space-y-1">
                <div className="flex justify-between gap-8">
                  <span className="text-sm text-muted-foreground">Avg Score</span>
                  <span className="text-sm font-medium">{avgScore != null ? `${(avgScore * 100).toFixed(1)}%` : 'N/A'}</span>
                </div>
                <div className="flex justify-between gap-8 pt-1 border-t">
                  <span className="text-sm font-medium">Interpretation</span>
                  <span className="text-sm font-medium text-muted-foreground">Cost data unavailable</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
