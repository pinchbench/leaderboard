'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { LeaderboardEntry, ApiSubmissionListItem } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { fetchSubmissionsClient } from '@/lib/api'
import { ShareableWrapper } from '@/components/shareable-wrapper'

interface ScoreDistributionProps {
  entries: LeaderboardEntry[]
  scoreMode: 'best' | 'average'
  currentVersion: string | null
}

interface BoxPlotData {
  model: string
  provider: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  best: number
  count: number
  scores: number[]
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

function getProviderColor(provider: string): string {
  const normalized = provider.toLowerCase().replace(/\s+/g, '-')
  return PROVIDER_COLORS[normalized] || '#888888'
}

// Custom box plot shape
function BoxPlotShape(props: {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: BoxPlotData
  yAxis?: { scale: (v: number) => number }
}) {
  const { x, width, payload } = props
  if (x == null || width == null || !payload || !props.yAxis) return null

  const scale = props.yAxis.scale
  const cx = x + width / 2
  const boxWidth = Math.min(width * 0.6, 40)

  const yMin = scale(payload.min)
  const yQ1 = scale(payload.q1)
  const yMedian = scale(payload.median)
  const yQ3 = scale(payload.q3)
  const yMax = scale(payload.max)

  const color = getProviderColor(payload.provider)

  return (
    <g>
      {/* Whisker line: min to max */}
      <line
        x1={cx}
        x2={cx}
        y1={yMin}
        y2={yMax}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.6}
      />
      {/* Min cap */}
      <line
        x1={cx - boxWidth / 4}
        x2={cx + boxWidth / 4}
        y1={yMin}
        y2={yMin}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.6}
      />
      {/* Max cap */}
      <line
        x1={cx - boxWidth / 4}
        x2={cx + boxWidth / 4}
        y1={yMax}
        y2={yMax}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.6}
      />
      {/* Box: Q1 to Q3 */}
      <rect
        x={cx - boxWidth / 2}
        y={yQ3}
        width={boxWidth}
        height={yQ1 - yQ3}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={1.5}
        rx={2}
      />
      {/* Median line */}
      <line
        x1={cx - boxWidth / 2}
        x2={cx + boxWidth / 2}
        y1={yMedian}
        y2={yMedian}
        stroke={color}
        strokeWidth={2.5}
      />
    </g>
  )
}

// Custom tooltip
function BoxPlotTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: BoxPlotData }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
      <p className="font-medium text-sm text-foreground">{data.model}</p>
      <p className="text-xs text-muted-foreground capitalize">{data.provider}</p>
      <div className="mt-1.5 space-y-0.5 text-xs">
        <p><span className="text-muted-foreground">Runs: </span><span className="font-medium">{data.count}</span></p>
        <p><span className="text-muted-foreground">Best: </span><span className="font-medium">{data.max.toFixed(1)}%</span></p>
        <p><span className="text-muted-foreground">Q3: </span><span className="font-medium">{data.q3.toFixed(1)}%</span></p>
        <p><span className="text-muted-foreground">Median: </span><span className="font-medium">{data.median.toFixed(1)}%</span></p>
        <p><span className="text-muted-foreground">Q1: </span><span className="font-medium">{data.q1.toFixed(1)}%</span></p>
        <p><span className="text-muted-foreground">Worst: </span><span className="font-medium">{data.min.toFixed(1)}%</span></p>
        <p><span className="text-muted-foreground">Spread (IQR): </span><span className="font-medium">{(data.q3 - data.q1).toFixed(1)}%</span></p>
      </div>
    </div>
  )
}

export function ScoreDistribution({ entries, scoreMode, currentVersion }: ScoreDistributionProps) {
  const [submissions, setSubmissions] = useState<ApiSubmissionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'median' | 'spread' | 'best'>('median')

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchSubmissionsClient(currentVersion ?? undefined, 500)
        if (!cancelled) {
          setSubmissions(response.submissions)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load submission data')
          setLoading(false)
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [currentVersion])

  const boxPlotData = useMemo(() => {
    // Group submissions by model
    const byModel = new Map<string, { provider: string; scores: number[] }>()

    for (const sub of submissions) {
      const key = sub.model
      if (!byModel.has(key)) {
        byModel.set(key, { provider: sub.provider, scores: [] })
      }
      byModel.get(key)!.scores.push(sub.score_percentage * 100)
    }

    // Compute box plot stats for models with at least 2 submissions
    const results: BoxPlotData[] = []

    for (const [model, { provider, scores }] of byModel) {
      if (scores.length < 2) continue

      const sorted = [...scores].sort((a, b) => a - b)
      const entry = entries.find(e => e.model === model)

      results.push({
        model,
        provider: provider.toLowerCase(),
        min: sorted[0],
        q1: quantile(sorted, 0.25),
        median: quantile(sorted, 0.5),
        q3: quantile(sorted, 0.75),
        max: sorted[sorted.length - 1],
        best: entry?.percentage ?? sorted[sorted.length - 1],
        count: scores.length,
        scores: sorted,
      })
    }

    // Sort
    if (sortBy === 'median') {
      results.sort((a, b) => b.median - a.median)
    } else if (sortBy === 'spread') {
      results.sort((a, b) => (b.q3 - b.q1) - (a.q3 - a.q1))
    } else {
      results.sort((a, b) => b.max - a.max)
    }

    return results
  }, [submissions, entries, sortBy])

  // Compute Y domain
  const yDomain = useMemo((): [number, number] => {
    if (boxPlotData.length === 0) return [0, 100]
    const minVal = Math.min(...boxPlotData.map(d => d.min))
    const maxVal = Math.max(...boxPlotData.map(d => d.max))
    return [
      Math.max(0, Math.floor(minVal / 5) * 5 - 5),
      Math.min(100, Math.ceil(maxVal / 5) * 5 + 5),
    ]
  }, [boxPlotData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading submission data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (boxPlotData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Not enough data. Models need at least 2 submissions to show distribution.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Score Distribution per Model
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Box plots showing the distribution of scores across all submissions for each model.
        The box spans Q1-Q3 (interquartile range), the line inside is the median, and whiskers show min/max.
        Models with only 1 submission are excluded.
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className="text-muted-foreground">Sort by:</span>
        <button
          onClick={() => setSortBy('median')}
          className={`px-2 py-1 rounded transition-colors ${
            sortBy === 'median'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Median
        </button>
        <button
          onClick={() => setSortBy('best')}
          className={`px-2 py-1 rounded transition-colors ${
            sortBy === 'best'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Best
        </button>
        <button
          onClick={() => setSortBy('spread')}
          className={`px-2 py-1 rounded transition-colors ${
            sortBy === 'spread'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Most Variable
        </button>
      </div>

      <ShareableWrapper
        title="Score Distribution"
        subtitle={`${boxPlotData.length} models with multiple submissions`}
      >
        <div className="rounded-lg border border-border bg-background p-4">
          <ResponsiveContainer width="100%" height={Math.max(400, boxPlotData.length * 36)}>
            <ComposedChart
              data={boxPlotData}
              layout="vertical"
              margin={{ top: 10, right: 30, bottom: 20, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
                horizontal={false}
              />

              <XAxis
                type="number"
                domain={yDomain}
                tickFormatter={(val: number) => `${val}%`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{
                  value: 'Score (%)',
                  position: 'bottom',
                  offset: 5,
                  style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
                }}
              />

              <YAxis
                type="category"
                dataKey="model"
                width={150}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />

              <Tooltip content={<BoxPlotTooltip />} />

              {/* Invisible bar to anchor the box plot positions, showing median */}
              <Bar
                dataKey="median"
                fill="transparent"
                isAnimationActive={false}
                barSize={20}
                shape={(shapeProps: unknown) => {
                  const barProps = shapeProps as {
                    x?: number
                    y?: number
                    width?: number
                    height?: number
                    payload?: BoxPlotData
                    background?: { x: number; y: number; width: number; height: number }
                  }
                  const { y, height, payload, background } = barProps
                  if (y == null || height == null || !payload || !background) return <g />

                  const color = getProviderColor(payload.provider)
                  const totalWidth = background.width
                  const xStart = background.x
                  const range = yDomain[1] - yDomain[0]

                  const toX = (val: number) => xStart + ((val - yDomain[0]) / range) * totalWidth
                  const cx = y + height / 2
                  const boxHeight = Math.min(height * 0.65, 24)

                  const xMin = toX(payload.min)
                  const xQ1 = toX(payload.q1)
                  const xMedian = toX(payload.median)
                  const xQ3 = toX(payload.q3)
                  const xMax = toX(payload.max)

                  return (
                    <g>
                      {/* Whisker line: min to max */}
                      <line
                        x1={xMin} x2={xMax}
                        y1={cx} y2={cx}
                        stroke={color} strokeWidth={1.5} opacity={0.5}
                      />
                      {/* Min cap */}
                      <line
                        x1={xMin} x2={xMin}
                        y1={cx - boxHeight / 4} y2={cx + boxHeight / 4}
                        stroke={color} strokeWidth={1.5} opacity={0.5}
                      />
                      {/* Max cap */}
                      <line
                        x1={xMax} x2={xMax}
                        y1={cx - boxHeight / 4} y2={cx + boxHeight / 4}
                        stroke={color} strokeWidth={1.5} opacity={0.5}
                      />
                      {/* Box: Q1 to Q3 */}
                      <rect
                        x={xQ1}
                        y={cx - boxHeight / 2}
                        width={Math.max(xQ3 - xQ1, 2)}
                        height={boxHeight}
                        fill={color}
                        fillOpacity={0.25}
                        stroke={color}
                        strokeWidth={1.5}
                        rx={2}
                      />
                      {/* Median line */}
                      <line
                        x1={xMedian} x2={xMedian}
                        y1={cx - boxHeight / 2} y2={cx + boxHeight / 2}
                        stroke={color} strokeWidth={2.5}
                      />
                      {/* Individual score dots */}
                      {payload.scores.map((score, i) => (
                        <circle
                          key={i}
                          cx={toX(score)}
                          cy={cx + (Math.random() - 0.5) * boxHeight * 0.5}
                          r={2}
                          fill={color}
                          fillOpacity={0.4}
                        />
                      ))}
                    </g>
                  )
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ShareableWrapper>
    </div>
  )
}
