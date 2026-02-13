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
  Customized,
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

// --- Tooltip ---

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

// --- Simple dot shape (no label -- labels rendered separately) ---

function SimpleDot(props: { cx?: number; cy?: number; payload?: DataPoint }) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={7}
      fill={payload.color}
      stroke="hsl(var(--background))"
      strokeWidth={1.5}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
    />
  )
}

// --- Label collision avoidance ---

const LABEL_FONT_SIZE = 10
const LABEL_CHAR_WIDTH = 5.5
const LABEL_HEIGHT = 14
const LABEL_PAD_X = 4
const LABEL_PAD_Y = 2

interface LabelRect {
  x: number
  y: number
  w: number
  h: number
  dotX: number
  dotY: number
  name: string
}

function resolveOverlaps(labels: LabelRect[], iterations = 120): LabelRect[] {
  const resolved = labels.map(l => ({ ...l }))

  for (let iter = 0; iter < iterations; iter++) {
    let anyOverlap = false

    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const a = resolved[i]
        const b = resolved[j]

        const overlapX = (a.x - LABEL_PAD_X) < (b.x + b.w + LABEL_PAD_X) &&
                         (a.x + a.w + LABEL_PAD_X) > (b.x - LABEL_PAD_X)
        const overlapY = (a.y - LABEL_PAD_Y) < (b.y + b.h + LABEL_PAD_Y) &&
                         (a.y + a.h + LABEL_PAD_Y) > (b.y - LABEL_PAD_Y)

        if (overlapX && overlapY) {
          anyOverlap = true

          const dx = (a.x + a.w / 2) - (b.x + b.w / 2)
          const dy = (a.y + a.h / 2) - (b.y + b.h / 2)

          // Nudge apart; prefer vertical separation since horizontal space is scarce
          const pushX = dx === 0 ? 0.5 : Math.sign(dx) * 1.5
          const pushY = dy === 0 ? -1.5 : Math.sign(dy) * 3

          a.x += pushX
          a.y += pushY
          b.x -= pushX
          b.y -= pushY
        }
      }

      // Also check overlap with the dot circles of OTHER points
      for (let j = 0; j < resolved.length; j++) {
        if (i === j) continue
        const label = resolved[i]
        const otherDotX = resolved[j].dotX
        const otherDotY = resolved[j].dotY
        const dotR = 9 // slightly larger than visual dot for padding

        // Check if label rect overlaps with the other dot circle (approximate as rect)
        const overlapX = (label.x - LABEL_PAD_X) < (otherDotX + dotR) &&
                         (label.x + label.w + LABEL_PAD_X) > (otherDotX - dotR)
        const overlapY = (label.y - LABEL_PAD_Y) < (otherDotY + dotR) &&
                         (label.y + label.h + LABEL_PAD_Y) > (otherDotY - dotR)

        if (overlapX && overlapY) {
          anyOverlap = true
          const dy = (label.y + label.h / 2) - otherDotY
          label.y += dy === 0 ? -3 : Math.sign(dy) * 3
        }
      }
    }

    if (!anyOverlap) break
  }

  return resolved
}

function ScatterLabels(props: {
  xAxisMap?: Record<string, { scale: (v: number) => number }>
  yAxisMap?: Record<string, { scale: (v: number) => number }>
  data: DataPoint[]
}) {
  const { xAxisMap, yAxisMap, data } = props
  if (!xAxisMap || !yAxisMap || !data.length) return null

  const xScale = Object.values(xAxisMap)[0]?.scale
  const yScale = Object.values(yAxisMap)[0]?.scale
  if (!xScale || !yScale) return null

  const labels: LabelRect[] = data.map(point => {
    const cx = xScale(point.x)
    const cy = yScale(point.y)
    const w = point.name.length * LABEL_CHAR_WIDTH
    return {
      x: cx + 10,
      y: cy - LABEL_HEIGHT - 4,
      w,
      h: LABEL_HEIGHT,
      dotX: cx,
      dotY: cy,
      name: point.name,
    }
  })

  const resolved = resolveOverlaps(labels)

  return (
    <g className="scatter-labels" style={{ pointerEvents: 'none' }}>
      {resolved.map((label, i) => {
        // Draw a leader line if the label has been pushed far from its dot
        const nearestLabelEdgeX = label.x < label.dotX ? label.x + label.w : label.x
        const nearestLabelEdgeY = label.y + label.h / 2
        const dist = Math.sqrt(
          (nearestLabelEdgeX - label.dotX) ** 2 +
          (nearestLabelEdgeY - label.dotY) ** 2
        )
        const showLeader = dist > 25

        return (
          <g key={`label-${i}`}>
            {showLeader && (
              <line
                x1={label.dotX}
                y1={label.dotY}
                x2={label.x + (label.x < label.dotX ? label.w + 2 : -2)}
                y2={label.y + label.h / 2}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.3}
                strokeWidth={0.75}
              />
            )}
            <text
              x={label.x}
              y={label.y + label.h - 2}
              fill="hsl(var(--foreground))"
              fontSize={LABEL_FONT_SIZE}
              textAnchor="start"
              dominantBaseline="auto"
              opacity={0.85}
            >
              {label.name}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// --- Clickable provider legend ---

function ProviderLegend({ providers, hiddenProviders, onToggle }: {
  providers: Array<{ name: string; color: string }>
  hiddenProviders: Set<string>
  onToggle: (provider: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
      {providers.map((p) => {
        const isHidden = hiddenProviders.has(p.name)
        return (
          <button
            key={p.name}
            onClick={() => onToggle(p.name)}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ opacity: isHidden ? 0.35 : 1 }}
            title={isHidden ? `Show ${p.name}` : `Hide ${p.name}`}
          >
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: isHidden ? 'hsl(var(--muted-foreground))' : p.color,
                border: p.color === '#FFFFFF' && !isHidden ? '1px solid #888' : undefined,
              }}
            />
            <span className={`text-xs capitalize ${isHidden ? 'line-through text-muted-foreground/50' : 'text-muted-foreground'}`}>
              {p.name}
            </span>
          </button>
        )
      })}
      {hiddenProviders.size > 0 && (
        <button
          onClick={() => {
            // Reset all -- parent handles this via special "reset" signal
            onToggle('__reset__')
          }}
          className="text-xs text-primary hover:underline ml-2"
        >
          Show all
        </button>
      )}
    </div>
  )
}

// --- Main component ---

export function ScatterGraphs({ entries, scoreMode }: ScatterGraphsProps) {
  const [graphTab, setGraphTab] = useState<GraphTab>('perf-vs-cost')
  const [hiddenProviders, setHiddenProviders] = useState<Set<string>>(new Set())

  const toggleProvider = (provider: string) => {
    if (provider === '__reset__') {
      setHiddenProviders(new Set())
      return
    }
    setHiddenProviders(prev => {
      const next = new Set(prev)
      if (next.has(provider)) {
        next.delete(provider)
      } else {
        next.add(provider)
      }
      return next
    })
  }

  // Compute ALL data points (unfiltered) to get providers list and domains
  const { allData, hiddenCount, providers, xDomain, quadrantX, yDomain, quadrantY } = useMemo(() => {
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

    const providerList = Array.from(providerSet.entries())
      .map(([name, color]) => ({ name, color }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Compute x domain from ALL points (not filtered) so axes stay stable
    let xMin = Infinity
    let xMax = -Infinity
    for (const p of points) {
      if (p.x < xMin) xMin = p.x
      if (p.x > xMax) xMax = p.x
    }

    const domain: [number, number] = points.length > 0
      ? [xMin * 0.7, xMax * 1.4]
      : [0.001, 100]

    const qX = points.length > 0
      ? Math.sqrt(xMin * xMax)
      : domain[1] / 2

    let yMin = 0
    let yMax = 100
    if (points.length > 0) {
      const minY = Math.min(...points.map(p => p.y))
      const maxY = Math.max(...points.map(p => p.y))
      yMin = Math.max(0, Math.floor(minY / 5) * 5 - 5)
      yMax = Math.min(100, Math.ceil(maxY / 5) * 5 + 5)
      if (yMax - yMin < 20) {
        const mid = (yMin + yMax) / 2
        yMin = Math.max(0, mid - 10)
        yMax = Math.min(100, mid + 10)
      }
    }

    const qY = (yMin + yMax) / 2

    return {
      allData: points,
      hiddenCount: hidden,
      providers: providerList,
      xDomain: domain,
      quadrantX: qX,
      yDomain: [yMin, yMax] as [number, number],
      quadrantY: qY,
    }
  }, [entries, scoreMode, graphTab])

  // Filter by visible providers
  const data = useMemo(() => {
    if (hiddenProviders.size === 0) return allData
    return allData.filter(p => !hiddenProviders.has(p.provider))
  }, [allData, hiddenProviders])

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
        {' \u2022 Click a provider to hide/show'}
      </p>

      {/* Quadrant legend */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-4 h-3 rounded-sm bg-green-500/15 border border-green-500/30" />
        <span className="text-xs text-muted-foreground">Most attractive quadrant</span>
      </div>

      {/* Provider legend (clickable) */}
      <ProviderLegend
        providers={providers}
        hiddenProviders={hiddenProviders}
        onToggle={toggleProvider}
      />

      {/* Chart */}
      {data.length < 2 ? (
        <div className="flex items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {allData.length < 2
              ? `Not enough data to display chart. At least 2 models with ${isCost ? 'cost' : 'speed'} data are needed.`
              : 'Too many providers hidden. Click providers above to show them.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background p-4">
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

              {/* Green "most attractive" quadrant */}
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
                scale="log"
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
                shape={<SimpleDot />}
                isAnimationActive={false}
              >
                {data.map((point, index) => (
                  <Cell key={`cell-${index}`} fill={point.color} />
                ))}
              </Scatter>

              {/* Labels with collision avoidance, rendered as a separate layer */}
              <Customized
                component={(rechartProps: Record<string, unknown>) => (
                  <ScatterLabels
                    {...(rechartProps as {
                      xAxisMap?: Record<string, { scale: (v: number) => number }>
                      yAxisMap?: Record<string, { scale: (v: number) => number }>
                    })}
                    data={data}
                  />
                )}
              />
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
