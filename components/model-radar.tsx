'use client'

import { useMemo, useState } from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import type { LeaderboardEntry } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { ShareableWrapper } from '@/components/shareable-wrapper'

interface ModelRadarProps {
  entries: LeaderboardEntry[]
  scoreMode: 'best' | 'average'
}

const MAX_SELECTED = 4

// Distinct colors for the overlay lines (not provider-based since overlays need contrast)
const RADAR_COLORS = [
  '#22d3ee', // cyan
  '#f97316', // orange
  '#a855f7', // purple
  '#22c55e', // green
]

function getProviderColor(provider: string): string {
  const normalized = provider.toLowerCase().replace(/\s+/g, '-')
  return PROVIDER_COLORS[normalized] || '#888888'
}

interface NormalizedMetrics {
  model: string
  provider: string
  score: number         // 0-100 raw
  costEfficiency: number    // 0-100 (inverted: cheaper = higher)
  speedEfficiency: number   // 0-100 (inverted: faster = higher)
  consistency: number       // 0-100 (lower spread between best and avg = more consistent)
}

function normalizeToPercent(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

export function ModelRadar({ entries, scoreMode }: ModelRadarProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Compute normalized metrics for all models
  const { metrics, radarData } = useMemo(() => {
    // Collect raw values for normalization
    const costs: number[] = []
    const speeds: number[] = []

    for (const entry of entries) {
      const cost = scoreMode === 'best' ? entry.best_cost_usd : entry.average_cost_usd
      const speed = scoreMode === 'best' ? entry.best_execution_time_seconds : entry.average_execution_time_seconds
      if (cost != null && cost > 0) costs.push(cost)
      if (speed != null && speed > 0) speeds.push(speed)
    }

    const costMin = Math.min(...costs)
    const costMax = Math.max(...costs)
    const speedMin = Math.min(...speeds)
    const speedMax = Math.max(...speeds)

    const metricsMap = new Map<string, NormalizedMetrics>()

    for (const entry of entries) {
      const score = scoreMode === 'best'
        ? entry.percentage
        : (entry.average_score_percentage != null ? entry.average_score_percentage * 100 : entry.percentage)

      const cost = scoreMode === 'best' ? entry.best_cost_usd : entry.average_cost_usd
      const speed = scoreMode === 'best' ? entry.best_execution_time_seconds : entry.average_execution_time_seconds

      // Cost efficiency: invert so cheaper = higher score
      const costEfficiency = cost != null && cost > 0
        ? 100 - normalizeToPercent(cost, costMin, costMax)
        : 50

      // Speed efficiency: invert so faster = higher score
      const speedEfficiency = speed != null && speed > 0
        ? 100 - normalizeToPercent(speed, speedMin, speedMax)
        : 50

      // Consistency: if we have both best and avg scores, measure how close they are
      const bestPct = entry.percentage
      const avgPct = entry.average_score_percentage != null ? entry.average_score_percentage * 100 : null
      let consistency = 50
      if (avgPct != null && bestPct > 0) {
        // ratio of avg to best: 1.0 = perfectly consistent, 0.0 = very inconsistent
        const ratio = avgPct / bestPct
        consistency = Math.max(0, Math.min(100, ratio * 100))
      }

      metricsMap.set(entry.model, {
        model: entry.model,
        provider: entry.provider,
        score,
        costEfficiency,
        speedEfficiency,
        consistency,
      })
    }

    // Build radar data for selected models
    const axes = ['Score', 'Cost Efficiency', 'Speed', 'Consistency']
    const data = axes.map((axis) => {
      const point: Record<string, string | number> = { axis }
      for (const modelName of selectedModels) {
        const m = metricsMap.get(modelName)
        if (m) {
          switch (axis) {
            case 'Score':
              point[modelName] = Math.round(m.score)
              break
            case 'Cost Efficiency':
              point[modelName] = Math.round(m.costEfficiency)
              break
            case 'Speed':
              point[modelName] = Math.round(m.speedEfficiency)
              break
            case 'Consistency':
              point[modelName] = Math.round(m.consistency)
              break
          }
        }
      }
      return point
    })

    return { metrics: metricsMap, radarData: data }
  }, [entries, scoreMode, selectedModels])

  const toggleModel = (model: string) => {
    setSelectedModels(prev => {
      if (prev.includes(model)) {
        return prev.filter(m => m !== model)
      }
      if (prev.length >= MAX_SELECTED) {
        return [...prev.slice(1), model]
      }
      return [...prev, model]
    })
  }

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter(e =>
      e.model.toLowerCase().includes(q) ||
      e.provider.toLowerCase().includes(q)
    )
  }, [entries, searchQuery])

  // Sort entries: selected first, then by score
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const aSelected = selectedModels.includes(a.model) ? 1 : 0
      const bSelected = selectedModels.includes(b.model) ? 1 : 0
      if (aSelected !== bSelected) return bSelected - aSelected
      return b.percentage - a.percentage
    })
  }, [filteredEntries, selectedModels])

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Multi-Dimensional Model Comparison
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Select up to {MAX_SELECTED} models to compare across score, cost efficiency (cheaper = better),
        speed (faster = better), and consistency (avg/best score ratio).
        All axes are normalized to 0-100.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model selector */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {selectedModels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-border">
                {selectedModels.map((model, i) => (
                  <button
                    key={model}
                    onClick={() => toggleModel(model)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80"
                    style={{
                      color: RADAR_COLORS[i],
                      borderColor: RADAR_COLORS[i],
                      backgroundColor: `${RADAR_COLORS[i]}15`,
                    }}
                  >
                    {model}
                    <span className="ml-0.5">x</span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedModels([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-0.5">
              {sortedEntries.map((entry) => {
                const isSelected = selectedModels.includes(entry.model)
                const selectedIndex = selectedModels.indexOf(entry.model)
                const providerColor = getProviderColor(entry.provider)
                return (
                  <button
                    key={entry.model}
                    onClick={() => toggleModel(entry.model)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-accent'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 border"
                      style={{
                        backgroundColor: isSelected ? RADAR_COLORS[selectedIndex] : 'transparent',
                        borderColor: isSelected ? RADAR_COLORS[selectedIndex] : providerColor,
                      }}
                    />
                    <span className="truncate font-medium text-foreground">{entry.model}</span>
                    <span className="ml-auto text-muted-foreground flex-shrink-0">{entry.percentage.toFixed(1)}%</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <div className="lg:col-span-2">
          {selectedModels.length === 0 ? (
            <div className="flex items-center justify-center h-[460px] rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Select models from the list to compare them.
              </p>
            </div>
          ) : (
            <ShareableWrapper
              title="Model Comparison"
              subtitle={selectedModels.join(' vs ')}
            >
              <div className="rounded-lg border border-border bg-background p-4">
                <ResponsiveContainer width="100%" height={460}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.5}
                    />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val: number) => `${val}`}
                    />

                    {selectedModels.map((model, i) => (
                      <Radar
                        key={model}
                        name={model}
                        dataKey={model}
                        stroke={RADAR_COLORS[i]}
                        fill={RADAR_COLORS[i]}
                        fillOpacity={0.12}
                        strokeWidth={2}
                        dot={{
                          r: 4,
                          fill: RADAR_COLORS[i],
                          stroke: 'hsl(var(--background))',
                          strokeWidth: 1,
                        }}
                      />
                    ))}

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />

                    <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>

                {/* Detailed metrics table below chart */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Metric</th>
                        {selectedModels.map((model, i) => (
                          <th key={model} className="text-right py-1.5 px-2 font-medium" style={{ color: RADAR_COLORS[i] }}>
                            {model}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['Score', 'Cost Efficiency', 'Speed', 'Consistency'].map((axis) => (
                        <tr key={axis} className="border-b border-border/50">
                          <td className="py-1.5 px-2 text-muted-foreground">{axis}</td>
                          {selectedModels.map((model) => {
                            const dataPoint = radarData.find(d => d.axis === axis)
                            const value = dataPoint?.[model] as number | undefined
                            return (
                              <td key={model} className="text-right py-1.5 px-2 font-medium text-foreground">
                                {value != null ? value : '-'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ShareableWrapper>
          )}
        </div>
      </div>
    </div>
  )
}
