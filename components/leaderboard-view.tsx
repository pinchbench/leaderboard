'use client'

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import type { LeaderboardEntry, BenchmarkVersion } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { SimpleLeaderboard } from '@/components/simple-leaderboard'
import { ScatterGraphs } from '@/components/scatter-graphs'
import { TaskHeatmap } from '@/components/task-heatmap'
import { ScoreDistribution } from '@/components/score-distribution'
import { ModelRadar } from '@/components/model-radar'
import { LeaderboardHeader } from '@/components/leaderboard-header'

type ViewMode = 'success' | 'speed' | 'cost' | 'graphs'
type ScoreMode = 'best' | 'average'
type GraphSubTab = 'scatter' | 'heatmap' | 'distribution' | 'radar'

const VALID_VIEWS: ViewMode[] = ['success', 'speed', 'cost', 'graphs']
const VALID_SCORE_MODES: ScoreMode[] = ['best', 'average']
const VALID_GRAPH_TABS: GraphSubTab[] = ['scatter', 'heatmap', 'distribution', 'radar']

interface LeaderboardViewProps {
    entries: LeaderboardEntry[]
    lastUpdated: string
    versions: BenchmarkVersion[]
    currentVersion: string | null
}

export function LeaderboardView({ entries, lastUpdated, versions, currentVersion }: LeaderboardViewProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Read initial state from URL params
    const initialView = VALID_VIEWS.includes(searchParams.get('view') as ViewMode)
        ? (searchParams.get('view') as ViewMode)
        : 'success'
    const initialScoreMode = VALID_SCORE_MODES.includes(searchParams.get('score') as ScoreMode)
        ? (searchParams.get('score') as ScoreMode)
        : 'average'
    const initialProvider = searchParams.get('provider') || null
    const initialGraphTab = VALID_GRAPH_TABS.includes(searchParams.get('graph') as GraphSubTab)
        ? (searchParams.get('graph') as GraphSubTab)
        : 'scatter'

    const [view, setViewState] = useState<ViewMode>(initialView)
    const [scoreMode, setScoreModeState] = useState<ScoreMode>(initialScoreMode)
    const [providerFilter, setProviderFilterState] = useState<string | null>(initialProvider)
    const [graphSubTab, setGraphSubTabState] = useState<GraphSubTab>(initialGraphTab)

    // Helper to update URL params without full page reload
    const updateUrl = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === undefined) {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        }
        // Remove defaults to keep URL clean
        if (params.get('view') === 'success') params.delete('view')
        if (params.get('score') === 'average') params.delete('score')
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [searchParams, router, pathname])

    const setView = useCallback((v: ViewMode) => {
        setViewState(v)
        updateUrl({ view: v })
    }, [updateUrl])

    const setScoreMode = useCallback((m: ScoreMode) => {
        setScoreModeState(m)
        updateUrl({ score: m })
    }, [updateUrl])

    const setProviderFilter = useCallback((p: string | null) => {
        setProviderFilterState(p)
        updateUrl({ provider: p })
    }, [updateUrl])

    const setGraphSubTab = useCallback((t: GraphSubTab) => {
        setGraphSubTabState(t)
        updateUrl({ graph: t === 'scatter' ? null : t })
    }, [updateUrl])

    const filteredEntries = useMemo(() => {
        if (!providerFilter) return entries
        return entries.filter(
            (entry) => entry.provider.toLowerCase() === providerFilter.toLowerCase()
        )
    }, [entries, providerFilter])

    const providerColor = providerFilter
        ? PROVIDER_COLORS[providerFilter.toLowerCase()] || '#666'
        : undefined

    const totalRuns = useMemo(() => {
        return filteredEntries.reduce((sum, entry) => sum + (entry.submission_count ?? 0), 0)
    }, [filteredEntries])

    return (
        <div className="min-h-screen bg-background">
            <LeaderboardHeader
                filteredEntryCount={filteredEntries.length}
                totalRuns={totalRuns}
                versions={versions}
                currentVersion={currentVersion}
                lastUpdated={lastUpdated}
                providerFilter={providerFilter}
                providerColor={providerColor}
                view={view}
                scoreMode={scoreMode}
                onViewChange={setView}
                onScoreModeChange={setScoreMode}
                onClearProviderFilter={() => setProviderFilter(null)}
            />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {view === 'graphs' ? (
                    <div>
                        {/* Graph sub-tabs */}
                        <div className="flex gap-1 rounded-lg border border-border bg-background p-1 w-fit mb-6">
                            {([
                                ['scatter', 'Scatter Plots'],
                                ['heatmap', 'Task Heatmap'],
                                ['distribution', 'Score Distribution'],
                                ['radar', 'Model Comparison'],
                            ] as const).map(([tab, label]) => (
                                <button
                                    key={tab}
                                    onClick={() => setGraphSubTab(tab)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${graphSubTab === tab
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {graphSubTab === 'scatter' && (
                            <ScatterGraphs entries={filteredEntries} scoreMode={scoreMode} />
                        )}
                        {graphSubTab === 'heatmap' && (
                            <TaskHeatmap entries={filteredEntries} scoreMode={scoreMode} />
                        )}
                        {graphSubTab === 'distribution' && (
                            <ScoreDistribution entries={filteredEntries} scoreMode={scoreMode} currentVersion={currentVersion} />
                        )}
                        {graphSubTab === 'radar' && (
                            <ModelRadar entries={filteredEntries} scoreMode={scoreMode} />
                        )}
                    </div>
                ) : (
                    <SimpleLeaderboard
                        entries={filteredEntries}
                        view={view}
                        scoreMode={scoreMode}
                        onScoreModeChange={setScoreMode}
                        onProviderClick={setProviderFilter}
                    />
                )}
            </main>
        </div>
    )
}
