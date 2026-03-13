'use client'

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { LeaderboardEntry, BenchmarkVersion } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { ALL_CATEGORIES } from '@/lib/categories'
import { SimpleLeaderboard } from '@/components/simple-leaderboard'
import { ScatterGraphs } from '@/components/scatter-graphs'
import { TaskHeatmap } from '@/components/task-heatmap'
import { ScoreDistribution } from '@/components/score-distribution'
import { ModelRadar } from '@/components/model-radar'
import { LeaderboardHeader } from '@/components/leaderboard-header'
import { CategoryFilter } from '@/components/category-filter'

type ViewMode = 'success' | 'speed' | 'cost' | 'value' | 'graphs'
type ScoreMode = 'best' | 'average'
type GraphSubTab = 'scatter' | 'heatmap' | 'distribution' | 'radar'

const VALID_VIEWS: ViewMode[] = ['success', 'speed', 'cost', 'value', 'graphs']
const VALID_SCORE_MODES: ScoreMode[] = ['best', 'average']
const VALID_GRAPH_TABS: GraphSubTab[] = ['scatter', 'heatmap', 'distribution', 'radar']

interface LeaderboardViewProps {
    entries: LeaderboardEntry[]
    lastUpdated: string
    versions: BenchmarkVersion[]
    currentVersion: string | null
    officialOnly: boolean
}

export function LeaderboardView({ entries, lastUpdated, versions, currentVersion, officialOnly }: LeaderboardViewProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Read initial state from URL params
    const initialView = VALID_VIEWS.includes(searchParams.get('view') as ViewMode)
        ? (searchParams.get('view') as ViewMode)
        : 'success'
    const initialScoreMode = VALID_SCORE_MODES.includes(searchParams.get('score') as ScoreMode)
        ? (searchParams.get('score') as ScoreMode)
        : 'best'
    const initialProvider = searchParams.get('provider') || null
    const initialGraphTab = VALID_GRAPH_TABS.includes(searchParams.get('graph') as GraphSubTab)
        ? (searchParams.get('graph') as GraphSubTab)
        : 'scatter'
    
    // Category filter - parse from URL or default to all
    const initialCategories = useMemo(() => {
        const param = searchParams.get('categories')
        if (!param) return [...ALL_CATEGORIES]
        const cats = param.split(',').filter(c => ALL_CATEGORIES.includes(c))
        return cats.length > 0 ? cats : [...ALL_CATEGORIES]
    }, [searchParams])
    
    // Hide partial runs filter (default: true = hide models that didn't run all categories)
    const initialHidePartial = searchParams.get('partial') !== 'show'

    const [view, setViewState] = useState<ViewMode>(initialView)
    const [officialOnlyState, setOfficialOnlyState] = useState<boolean>(officialOnly)
    const [scoreMode, setScoreModeState] = useState<ScoreMode>(initialScoreMode)
    const [providerFilter, setProviderFilterState] = useState<string | null>(initialProvider)
    const [graphSubTab, setGraphSubTabState] = useState<GraphSubTab>(initialGraphTab)
    const [selectedCategories, setSelectedCategoriesState] = useState<string[]>(initialCategories)
    const [hidePartialRuns, setHidePartialRunsState] = useState<boolean>(initialHidePartial)

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
        if (params.get('score') === 'best') params.delete('score')
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

    const setSelectedCategories = useCallback((cats: string[]) => {
        setSelectedCategoriesState(cats)
        // Only add to URL if not all categories selected
        const isAll = cats.length === ALL_CATEGORIES.length && ALL_CATEGORIES.every(c => cats.includes(c))
        updateUrl({ categories: isAll ? null : cats.join(',') })
    }, [updateUrl])

    const setHidePartialRuns = useCallback((hide: boolean) => {
        setHidePartialRunsState(hide)
        // Default is hide (true), so only add param when showing partial
        updateUrl({ partial: hide ? null : 'show' })
    }, [updateUrl])

    const setOfficialOnly = useCallback((v: boolean) => {
        setOfficialOnlyState(v)
        updateUrl({ official: v ? null : 'false' })
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
                officialOnly={officialOnlyState}
                onViewChange={setView}
                onScoreModeChange={setScoreMode}
                onOfficialOnlyChange={setOfficialOnly}
                onClearProviderFilter={() => setProviderFilter(null)}
            />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {view === 'graphs' ? (
                    <div>
                        {/* Graph sub-tabs and filters */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
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
                            
                            {/* Category filter - show for heatmap and radar */}
                            {(graphSubTab === 'heatmap' || graphSubTab === 'radar') && (
                                <CategoryFilter
                                    selectedCategories={selectedCategories}
                                    onChange={setSelectedCategories}
                                />
                            )}
                            
                            {/* Hide partial runs toggle - show for heatmap and radar */}
                            {(graphSubTab === 'heatmap' || graphSubTab === 'radar') && (
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={hidePartialRuns}
                                        onChange={(e) => setHidePartialRuns(e.target.checked)}
                                        className="rounded border-border"
                                    />
                                    <span>Hide partial runs</span>
                                </label>
                            )}
                        </div>

                        {graphSubTab === 'scatter' && (
                            <ScatterGraphs entries={filteredEntries} scoreMode={scoreMode} />
                        )}
                        {graphSubTab === 'heatmap' && (
                            <TaskHeatmap 
                                entries={filteredEntries} 
                                scoreMode={scoreMode}
                                selectedCategories={selectedCategories}
                                hidePartialRuns={hidePartialRuns}
                            />
                        )}
                        {graphSubTab === 'distribution' && (
                            <ScoreDistribution entries={filteredEntries} scoreMode={scoreMode} currentVersion={currentVersion} officialOnly={officialOnlyState} />
                        )}
                        {graphSubTab === 'radar' && (
                            <ModelRadar 
                                entries={filteredEntries} 
                                scoreMode={scoreMode}
                                selectedCategories={selectedCategories}
                                hidePartialRuns={hidePartialRuns}
                            />
                        )}
                    </div>
                ) : (
                    <SimpleLeaderboard
                        entries={filteredEntries}
                        view={view as 'success' | 'speed' | 'cost' | 'value'}
                        scoreMode={scoreMode}
                        benchmarkVersion={currentVersion}
                        officialOnly={officialOnlyState}
                        onScoreModeChange={setScoreMode}
                        onProviderClick={setProviderFilter}
                    />
                )}

                {/* Disclaimer */}
                <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
                    <p>
                        This leaderboard is for entertainment purposes only and should not be relied upon for making critical decisions.
                    </p>
                </div>
            </main>
        </div>
    )
}
