'use client'

import { useMemo, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Label,
  Cell,
} from 'recharts'
import type { LeaderboardEntry } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'

type GraphTab = 'perf-vs-cost' | 'perf-vs-speed'

interface ScatterGraphsProps {
  entries: LeaderboardEntry[]
  scoreMode: 'best' | 'average'
}

interface DataPoint {
  name: string
  provider: string
  x: number
  y: number
  color: string
}

function getProviderColor(provider: string): string {
  const normalized = provider.toLowerCase().replace(/\s+/g, '-')
  return PROVIDER_COLORS[normalized] || '#888888'
}

function CustomTooltip({ active, payload, xLabel }: {
  active?: boolean
  payload?: Array<{ payload: DataPoint }>
  xLabel: string
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
      <p className="font-medium text-sm text-foreground">{data.name}</p>
      <p className="text-xs text-muted-foreground capitalize">{data.provider}</p>
      <div className="mt-1 space-y-0.5">
        <p className="text-xs">
          <span className="text-muted-foreground">Score: </span>
          <span className="font-medium">{data.y.toFixed(1)}%</span>
        </p>
        <p className="text-xs">
          <span className="text-muted-foreground">{xLabel}: </span>
          <span className="font-medium">
            {xLabel === 'Cost' ? `$${data.x.toFixed(4)}` : `${data.x.toFixed(1)}s`}
          </span>
        </p>
      </div>
    </div>
  )
}

function CustomDot(props: {
  cx?: number
  cy?: number
  payload?: DataPoint
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={payload.color}
        stroke="hsl(var(--background))"
        strokeWidth={1.5}
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
      />
      <text
        x={cx + 10}
        y={cy - 8}
        fill="hsl(var(--foreground))"
        fontSize={10}
        textAnchor="start"
        dominantBaseline="auto"
        style={{ pointerEvents: 'none' }}
      >
        {payload.name}
      </text>
    </g>
  )
}

function ProviderLegend({ providers }: { providers: Array<{ name: string; color: string }> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
      {providers.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: p.color, border: p.color === '#FFFFFF' ? '1px solid #888' : undefined }}
          />
          <span className="text-xs text-muted-foreground capitalize">{p.name}</span>
        </div>
      ))}
    </div>
  )
}

export function ScatterGraphs({ entries, scoreMode }: ScatterGraphsProps) {
  const [graphTab, setGraphTab] = useState<GraphTab>('perf-vs-cost')

  const { data, hiddenCount, providers, xDomain, quadrantX, yDomain, quadrantY } = useMemo(() => {
    const isCost = graphTab === 'perf-vs-cost'

    const points: DataPoint[] = []
    const providerSet = new Map<string, string>()

    for (const entry of entries) {
      const yVal = scoreMode === 'best'
        ? entry.percentage
        : (entry.average_score_percentage != null ? entry.average_score_percentage * 100 : null)

      const xVal = isCost
        ? (scoreMode === 'best' ? entry.best_cost_usd : entry.average_cost_usd)
        : (scoreMode === 'best' ? entry.best_execution_time_seconds : entry.average_execution_time_seconds)

      if (yVal == null || xVal == null || xVal <= 0) continue

      const color = getProviderColor(entry.provider)
      providerSet.set(entry.provider, color)
      points.push({
        name: entry.model,
        provider: entry.provider,
        x: xVal,
        y: yVal,
        color,
      })
    }

    const hidden = entries.length - points.length

    // Sort providers alphabetically
    const providerList = Array.from(providerSet.entries())
      .map(([name, color]) => ({ name, color }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Compute x domain for log scale
    let xMin = Infinity
    let xMax = -Infinity
    for (const p of points) {
      if (p.x < xMin) xMin = p.x
      if (p.x > xMax) xMax = p.x
    }

    // Add some padding
    const domain: [number, number] = points.length > 0
      ? [xMin * 0.7, xMax * 1.4]
      : [0.001, 100]

    // Quadrant boundary: use the geometric mean of the x range as the cutoff
    const qX = points.length > 0
      ? Math.sqrt(xMin * xMax)
      : domain[1] / 2

    // Smart Y-axis: compute a reasonable minimum from the data
    // Floor to the nearest 5% below the lowest point, with a bit of padding
    let yMin = 0
    let yMax = 100
    if (points.length > 0) {
      const minY = Math.min(...points.map(p => p.y))
      const maxY = Math.max(...points.map(p => p.y))
      // Floor to nearest 5, then subtract 5 more for padding
      yMin = Math.max(0, Math.floor(minY / 5) * 5 - 5)
      // Ceil to nearest 5, add a bit of room
      yMax = Math.min(100, Math.ceil(maxY / 5) * 5 + 5)
      // Ensure we always show at least a 20-point range
      if (yMax - yMin < 20) {
        const mid = (yMin + yMax) / 2
        yMin = Math.max(0, mid - 10)
        yMax = Math.min(100, mid + 10)
      }
    }

    // Quadrant Y: midpoint of visible range (models above this are "high performance")
    const qY = (yMin + yMax) / 2

    return {
      data: points,
      hiddenCount: hidden,
      providers: providerList,
      xDomain: domain,
      quadrantX: qX,
      yDomain: [yMin, yMax] as [number, number],
      quadrantY: qY,
    }
  }, [entries, scoreMode, graphTab])

  const isCost = graphTab === 'perf-vs-cost'
  const xLabel = isCost ? 'Cost' : 'Speed'

  const formatXTick = (val: number) => {
    if (isCost) {
      if (val >= 1) return `$${val.toFixed(0)}`
      if (val >= 0.01) return `$${val.toFixed(2)}`
      return `$${val.toFixed(3)}`
    }
    if (val >= 100) return `${val.toFixed(0)}s`
    if (val >= 1) return `${val.toFixed(1)}s`
    return `${val.toFixed(2)}s`
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1 w-fit mb-6">
        <button
          onClick={() => setGraphTab('perf-vs-cost')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            graphTab === 'perf-vs-cost'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Performance vs. Cost
        </button>
        <button
          onClick={() => setGraphTab('perf-vs-speed')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            graphTab === 'perf-vs-speed'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Performance vs. Speed
        </button>
      </div>

      {/* Chart title */}
      <h2 className="text-lg font-semibold text-foreground mb-1">
        {isCost ? 'Success Rate vs. Cost' : 'Success Rate vs. Execution Time'}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {scoreMode === 'best' ? 'Best' : 'Average'} score vs. {scoreMode === 'best' ? 'best' : 'average'}{' '}
        {isCost ? 'cost (USD)' : 'execution time (seconds)'}
      </p>

      {/* Quadrant legend */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-4 h-3 rounded-sm bg-green-500/15 border border-green-500/30" />
        <span className="text-xs text-muted-foreground">Most attractive quadrant</span>
      </div>

      {/* Provider legend */}
      <ProviderLegend providers={providers} />

      {/* Chart */}
      {data.length < 2 ? (
        <div className="flex items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Not enough data to display chart. At least 2 models with {isCost ? 'cost' : 'speed'} data are needed.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background p-4">
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

              {/* Green "most attractive" quadrant: top-left (high score, low cost/speed) */}
              <ReferenceArea
                x1={xDomain[0]}
                x2={quadrantX}
                y1={quadrantY}
                y2={yDomain[1]}
                fill="hsl(142, 71%, 45%)"
                fillOpacity={0.08}
                stroke="hsl(142, 71%, 45%)"
                strokeOpacity={0.15}
              />

              <XAxis
                type="number"
                dataKey="x"
                scale={isCost ? 'log' : 'log'}
                domain={xDomain}
                tickFormatter={formatXTick}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              >
                <Label
                  value={isCost ? 'Cost (USD, Log Scale)' : 'Execution Time (seconds, Log Scale)'}
                  position="bottom"
                  offset={20}
                  style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
              </XAxis>

              <YAxis
                type="number"
                dataKey="y"
                domain={yDomain}
                tickFormatter={(val: number) => `${val}%`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              >
                <Label
                  value="Success Rate (%)"
                  angle={-90}
                  position="insideLeft"
                  offset={-5}
                  style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', textAnchor: 'middle' }}
                />
              </YAxis>

              <Tooltip
                content={<CustomTooltip xLabel={xLabel} />}
                cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground))', strokeOpacity: 0.3 }}
              />

              <Scatter
                data={data}
                shape={<CustomDot />}
                isAnimationActive={false}
              >
                {data.map((point, index) => (
                  <Cell key={`cell-${index}`} fill={point.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hidden models note */}
      {hiddenCount > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          {hiddenCount} model{hiddenCount === 1 ? '' : 's'} hidden (no {isCost ? 'cost' : 'speed'} data available)
        </p>
      )}
    </div>
  )
}
