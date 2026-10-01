'use client'

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
import { canonicalizeLeaderboardSearchParams, scoreModeBasisLabel } from '@/lib/metric-contract'
import { buildRadarMetrics, type RadarMetric } from '@/lib/radar-metrics'
import { formatCost, formatDuration } from '@/lib/recommendations'
import { ShareableWrapper } from '@/components/shareable-wrapper'

interface ModelRadarProps {
  entries: LeaderboardEntry[]
  scoreMode: 'best' | 'average'
}

const MAX_SELECTED = 3

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

function formatRadarValue(value: number | null): string {
  return value == null ? 'n/a' : String(Math.round(value))
}

export function ModelRadar({ entries, scoreMode }: ModelRadarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize selected models from URL params
  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    const param = searchParams.get('models')
    if (!param) return []
    const modelNames = param.split(',').map(m => m.trim()).filter(Boolean)
    const validModels = new Set(entries.map(e => e.model))
    return modelNames.filter(m => validModels.has(m)).slice(0, MAX_SELECTED)
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Sync selected models to URL, ensuring graph=radar and view=graphs are set
  const updateModelsInUrl = useCallback((models: string[]) => {
    const params = new URLSearchParams(searchParams.toString())
    if (models.length === 0) {
      params.delete('models')
    } else {
      params.set('models', models.join(','))
      // Ensure the URL navigates to the radar graph view
      params.set('view', 'graphs')
      params.set('graph', 'radar')
    }
    const canonical = canonicalizeLeaderboardSearchParams(params)
    router.replace(`${pathname}?${canonical.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const { metrics, radarData } = useMemo(() => {
    const metricsMap = new Map<string, RadarMetric>(
      buildRadarMetrics(entries, scoreMode).map((metric) => [metric.model, metric]),
    )

    const axes = ['Score', 'Cost Efficiency', 'Speed', 'Consistency'] as const
    const data = axes.map((axis) => {
      const point: Record<string, string | number | null> = { axis }
      for (const modelName of selectedModels) {
        const metric = metricsMap.get(modelName)
        if (!metric) continue
        const value = axis === 'Score'
          ? metric.score
          : axis === 'Cost Efficiency'
            ? metric.costEfficiency
            : axis === 'Speed'
              ? metric.speedEfficiency
              : metric.consistency
        point[modelName] = value == null ? null : Math.round(value)
      }
      return point
    })

    return { metrics: metricsMap, radarData: data }
  }, [entries, scoreMode, selectedModels])

  const selectedEntries = useMemo(
    () => selectedModels.map((model) => entries.find((entry) => entry.model === model)).filter(Boolean) as LeaderboardEntry[],
    [entries, selectedModels]
  )

  const toggleModel = (model: string) => {
    setSelectedModels(prev => {
      let next: string[]
      if (prev.includes(model)) {
        next = prev.filter(m => m !== model)
      } else if (prev.length >= MAX_SELECTED) {
        next = [...prev.slice(1), model]
      } else {
        next = [...prev, model]
      }
      updateModelsInUrl(next)
      return next
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
        Model Comparison Tool
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Select 2-{MAX_SELECTED} models to compare {scoreModeBasisLabel(scoreMode).toLowerCase()} score, speed, and cost. Missing values stay unavailable.
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
                  onClick={() => {
                    setSelectedModels([])
                    updateModelsInUrl([])
                  }}
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
                    <span className="ml-auto text-muted-foreground flex-shrink-0">
                      {metrics.get(entry.model)?.score == null ? 'n/a' : `${metrics.get(entry.model)!.score!.toFixed(1)}%`}
                    </span>
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
                        connectNulls={false}
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
                        {selectedEntries.map((entry, i) => (
                          <th key={entry.model} className="text-right py-1.5 px-2 font-medium" style={{ color: RADAR_COLORS[i] }}>
                            {entry.model}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="py-1.5 px-2 text-muted-foreground">{scoreModeBasisLabel(scoreMode)}</td>
                        {selectedEntries.map((entry) => (
                          <td key={entry.model} className="text-right py-1.5 px-2 font-medium text-foreground">
                            {metrics.get(entry.model)?.score == null ? 'n/a' : `${metrics.get(entry.model)!.score!.toFixed(1)}%`}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-1.5 px-2 text-muted-foreground">{scoreMode === 'best' ? 'Best cost' : 'Average cost'}</td>
                        {selectedEntries.map((entry) => (
                          <td key={entry.model} className="text-right py-1.5 px-2 font-medium text-foreground">
                            {formatCost(metrics.get(entry.model)?.cost)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-1.5 px-2 text-muted-foreground">{scoreMode === 'best' ? 'Best time' : 'Average time'}</td>
                        {selectedEntries.map((entry) => (
                          <td key={entry.model} className="text-right py-1.5 px-2 font-medium text-foreground">
                            {formatDuration(metrics.get(entry.model)?.speed)}
                          </td>
                        ))}
                      </tr>
                      {(['Cost Efficiency', 'Speed', 'Consistency'] as const).map((axis) => (
                        <tr key={axis} className="border-b border-border/50">
                          <td className="py-1.5 px-2 text-muted-foreground">{axis}</td>
                          {selectedEntries.map((entry) => (
                            <td key={entry.model} className="text-right py-1.5 px-2 font-medium text-foreground">
                              {formatRadarValue(
                                axis === 'Cost Efficiency'
                                  ? metrics.get(entry.model)?.costEfficiency ?? null
                                  : axis === 'Speed'
                                    ? metrics.get(entry.model)?.speedEfficiency ?? null
                                    : metrics.get(entry.model)?.consistency ?? null,
                              )}
                            </td>
                          ))}
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
