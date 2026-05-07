'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { BestForBadge, LeaderboardEntry, BenchmarkVersion, RecommendationPick, SortMode, TaskResult } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { fetchSubmissionClient } from '@/lib/api'
import { calculateCategoryFilteredScore, calculateRanksByPercentage } from '@/lib/category-scores'
import { transformSubmission } from '@/lib/transforms'
import { SimpleLeaderboard } from '@/components/simple-leaderboard'
import { ScatterGraphs } from '@/components/scatter-graphs'
import { TaskHeatmap } from '@/components/task-heatmap'
import { ScoreDistribution } from '@/components/score-distribution'
import { ModelRadar } from '@/components/model-radar'
import { LeaderboardHeader } from '@/components/leaderboard-header'
import { KiloClawAdCard } from '@/components/kiloclaw-ad-card'
import { QuickPicks } from '@/components/quick-picks'

type ViewMode = 'success' | 'speed' | 'cost' | 'value' | 'graphs'
type ScoreMode = 'best' | 'average'
type GraphSubTab = 'scatter' | 'heatmap' | 'distribution' | 'radar'

function parseCategoriesParam(raw: string | null): string[] {
    if (!raw?.trim()) return []
    const parts = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    return [...new Set(parts)]
}

const VALID_VIEWS: ViewMode[] = ['success', 'speed', 'cost', 'value', 'graphs']
const VALID_SCORE_MODES: ScoreMode[] = ['best', 'average']
const VALID_GRAPH_TABS: GraphSubTab[] = ['scatter', 'heatmap', 'distribution', 'radar']
const VALID_SORT_MODES: SortMode[] = ['quality', 'value']

interface LeaderboardViewProps {
    entries: LeaderboardEntry[]
    lastUpdated: string
    versions: BenchmarkVersion[]
    currentVersion: string | null
    officialOnly: boolean
    quickPicks?: RecommendationPick[]
    championBadges?: Record<string, BestForBadge[]>
}

export function LeaderboardView({ entries, lastUpdated, versions, currentVersion, officialOnly, quickPicks = [], championBadges = {} }: LeaderboardViewProps) {
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
    const initialOpenWeights = searchParams.get('weights') === 'open'
    const initialGraphTab = VALID_GRAPH_TABS.includes(searchParams.get('graph') as GraphSubTab)
        ? (searchParams.get('graph') as GraphSubTab)
        : 'scatter'
    const initialModelSearch = searchParams.get('model') || ''
    const initialSortMode = VALID_SORT_MODES.includes(searchParams.get('sort') as SortMode)
        ? (searchParams.get('sort') as SortMode)
        : 'quality'
    const initialBudget = searchParams.get('budget') || ''
    const initialZeroCost = searchParams.get('zerocost') === 'true'

    const [view, setViewState] = useState<ViewMode>(initialView)
    const [officialOnlyState, setOfficialOnlyState] = useState<boolean>(officialOnly)
    const [scoreMode, setScoreModeState] = useState<ScoreMode>(initialScoreMode)
    const [providerFilter, setProviderFilterState] = useState<string | null>(initialProvider)
    const [openWeightsOnly, setOpenWeightsOnlyState] = useState<boolean>(initialOpenWeights)
    const [graphSubTab, setGraphSubTabState] = useState<GraphSubTab>(initialGraphTab)
    const [hiddenProviders, setHiddenProviders] = useState<Set<string>>(new Set())
    const [modelSearch, setModelSearchState] = useState<string>(initialModelSearch)
    const [sortMode, setSortModeState] = useState<SortMode>(initialSortMode)
    const [maxCostFilter, setMaxCostFilterState] = useState<string>(initialBudget)
    const [showZeroCostResults, setShowZeroCostResultsState] = useState<boolean>(initialZeroCost)
    const [taskDataBySubmission, setTaskDataBySubmission] = useState<Record<string, TaskResult[]>>({})
    const [taskDataLoading, setTaskDataLoading] = useState(false)
    const [taskDataError, setTaskDataError] = useState<string | null>(null)

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
        if (params.get('weights') !== 'open') params.delete('weights')
        if (params.get('sort') === 'quality') params.delete('sort')
        if (!params.get('budget')) params.delete('budget')
        if (params.get('zerocost') !== 'true') params.delete('zerocost')
        if (params.get('graph') === 'scatter') params.delete('graph')
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

    const setOpenWeightsOnly = useCallback((v: boolean) => {
        setOpenWeightsOnlyState(v)
        updateUrl({ weights: v ? 'open' : null })
    }, [updateUrl])

    const setGraphSubTab = useCallback((t: GraphSubTab) => {
        setGraphSubTabState(t)
        updateUrl({ graph: t === 'scatter' ? null : t })
    }, [updateUrl])

    const handleModelSearchChange = useCallback((s: string) => {
        setModelSearchState(s)
        updateUrl({ model: s || null })
    }, [updateUrl])

    const setOfficialOnly = useCallback((v: boolean) => {
        setOfficialOnlyState(v)
        updateUrl({ official: v ? null : 'false' })
    }, [updateUrl])

    const setSortMode = useCallback((m: SortMode) => {
        setSortModeState(m)
        updateUrl({ sort: m })
    }, [updateUrl])

    const setMaxCostFilter = useCallback((v: string) => {
        setMaxCostFilterState(v)
        updateUrl({ budget: v || null })
    }, [updateUrl])

    const setShowZeroCostResults = useCallback((v: boolean) => {
        setShowZeroCostResultsState(v)
        updateUrl({ zerocost: v ? 'true' : null })
    }, [updateUrl])

    const setSelectedCategories = useCallback((cats: string[]) => {
        const normalized = [...new Set(cats.map((c) => c.trim().toLowerCase()).filter(Boolean))]
        updateUrl({ categories: normalized.length ? normalized.join(',') : null })
    }, [updateUrl])

    const selectedCategories = useMemo(
        () => parseCategoriesParam(searchParams.get('categories')),
        [searchParams]
    )

    const categoryFilterActive = selectedCategories.length > 0

    // Business-level filters only (provider filter, open weights).
    // Used for legend provider list and all charts/tables.
    const businessFilteredEntries = useMemo(() => {
        return entries.filter(entry => {
            if (providerFilter && entry.provider.toLowerCase() !== providerFilter.toLowerCase()) return false
            if (openWeightsOnly && entry.weights !== 'Open') return false
            return true
        })
    }, [entries, providerFilter, openWeightsOnly])

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            if (providerFilter && entry.provider.toLowerCase() !== providerFilter.toLowerCase()) return false
            if (openWeightsOnly && entry.weights !== 'Open') return false
            if (modelSearch && !entry.model.toLowerCase().includes(modelSearch.toLowerCase())) return false
            return true
        })
    }, [entries, providerFilter, openWeightsOnly, modelSearch])

    // Scatter-visible entries: business filters + legend-hidden providers.
    const scatterVisibleEntries = useMemo(() => {
        return businessFilteredEntries.filter(entry =>
            !hiddenProviders.has(entry.provider.toLowerCase())
        )
    }, [businessFilteredEntries, hiddenProviders])

    // When business filters change, prune hiddenProviders
    const prevBusinessFiltersRef = useRef({ providerFilter, openWeightsOnly })
    useEffect(() => {
        const prev = prevBusinessFiltersRef.current
        if (prev.providerFilter !== providerFilter || prev.openWeightsOnly !== openWeightsOnly) {
            prevBusinessFiltersRef.current = { providerFilter, openWeightsOnly }
            const currentProviders = new Set(businessFilteredEntries.map(e => e.provider.toLowerCase()))
            setHiddenProviders(prev => {
                const pruned = new Set([...prev].filter(k => currentProviders.has(k)))
                return pruned.size === prev.size ? prev : pruned
            })
        }
    }, [providerFilter, openWeightsOnly, businessFilteredEntries])

    // Category filtering: fetch task data when category filter is active
    useEffect(() => {
        if (!categoryFilterActive) {
            setTaskDataLoading(false)
            setTaskDataError(null)
            return
        }

        const missingEntries = filteredEntries.filter(
            (entry) => !taskDataBySubmission[entry.submission_id]
        )

        if (missingEntries.length === 0) {
            setTaskDataLoading(false)
            return
        }

        let cancelled = false

        async function loadTaskData(entriesToLoad: LeaderboardEntry[]) {
            setTaskDataLoading(true)
            setTaskDataError(null)

            try {
                const loaded: Record<string, TaskResult[]> = {}
                const batchSize = 5

                for (let i = 0; i < entriesToLoad.length; i += batchSize) {
                    if (cancelled) return
                    const batch = entriesToLoad.slice(i, i + batchSize)
                    const results = await Promise.all(
                        batch.map(async (entry) => {
                            try {
                                const response = await fetchSubmissionClient(entry.submission_id)
                                return {
                                    submissionId: entry.submission_id,
                                    tasks: transformSubmission(response.submission).task_results,
                                }
                            } catch {
                                return null
                            }
                        })
                    )

                    for (const result of results) {
                        if (result) loaded[result.submissionId] = result.tasks
                    }
                }

                if (!cancelled) {
                    if (Object.keys(loaded).length > 0) {
                        setTaskDataBySubmission((current) => ({ ...current, ...loaded }))
                    }
                    setTaskDataLoading(false)
                }
            } catch {
                if (!cancelled) {
                    setTaskDataError('Unable to load category scores')
                    setTaskDataLoading(false)
                }
            }
        }

        loadTaskData(missingEntries)
        return () => { cancelled = true }
    }, [categoryFilterActive, filteredEntries, taskDataBySubmission])

    const categoryScoredEntries = useMemo(() => {
        if (!categoryFilterActive) return filteredEntries

        const scored: LeaderboardEntry[] = []

        for (const entry of filteredEntries) {
            const tasks = taskDataBySubmission[entry.submission_id]
            if (!tasks) continue
            const categoryScore = calculateCategoryFilteredScore(tasks, selectedCategories)
            if (categoryScore.percentage == null || categoryScore.count === 0) continue
            scored.push({
                ...entry,
                percentage: categoryScore.percentage,
                average_score_percentage: null,
            })
        }

        scored.sort((a, b) => b.percentage - a.percentage)

        return calculateRanksByPercentage(scored)
    }, [categoryFilterActive, filteredEntries, selectedCategories, taskDataBySubmission])

    const activeCategoryTaskCount = useMemo(() => {
        if (!categoryFilterActive) return null
        const counts = new Set<number>()
        for (const entry of filteredEntries) {
            const tasks = taskDataBySubmission[entry.submission_id]
            if (!tasks) continue
            const count = calculateCategoryFilteredScore(tasks, selectedCategories).count
            if (count > 0) counts.add(count)
        }
        if (counts.size > 0) return Math.max(...counts)
        return taskDataLoading ? null : 0
    }, [categoryFilterActive, filteredEntries, selectedCategories, taskDataBySubmission, taskDataLoading])

    const providerColor = providerFilter
        ? PROVIDER_COLORS[providerFilter.toLowerCase()] || '#666'
        : undefined

    // Header stats entries
    const headerEntries =
        view === 'graphs' && graphSubTab === 'scatter' ? scatterVisibleEntries : businessFilteredEntries

    const totalRuns = useMemo(() => {
        return headerEntries.reduce((sum, entry) => sum + (entry.submission_count ?? 0), 0)
    }, [headerEntries])

    return (
        <div className="min-h-screen bg-background">
            <LeaderboardHeader
                entries={entries}
                filteredEntryCount={headerEntries.length}
                totalRuns={totalRuns}
                versions={versions}
                currentVersion={currentVersion}
                lastUpdated={lastUpdated}
                providerFilter={providerFilter}
                providerColor={providerColor}
                view={view}
                scoreMode={scoreMode}
                sortMode={sortMode}
                officialOnly={officialOnlyState}
                openWeightsOnly={openWeightsOnly}
                selectedCategories={selectedCategories}
                categoryDataLoading={taskDataLoading}
                activeCategoryTaskCount={activeCategoryTaskCount}
                modelSearchValue={modelSearch}
                maxCostFilter={maxCostFilter}
                showZeroCostResults={showZeroCostResults}
                graphSubTab={graphSubTab}
                onViewChange={setView}
                onScoreModeChange={setScoreMode}
                onSortModeChange={setSortMode}
                onOfficialOnlyChange={setOfficialOnly}
                onOpenWeightsOnlyChange={setOpenWeightsOnly}
                onCategoriesChange={setSelectedCategories}
                onClearProviderFilter={() => setProviderFilter(null)}
                onModelSearchChange={handleModelSearchChange}
                onMaxCostFilterChange={setMaxCostFilter}
                onShowZeroCostResultsChange={setShowZeroCostResults}
            />

            {/* Hero tagline */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-2" data-share-exclude="true">
                <h2 className="text-2xl md:text-4xl font-serif font-medium text-foreground leading-tight">
                    The best <span className="text-orange-400">models</span> for your{' '}
                    <a href="https://openclaw.ai/" target="_blank" rel="noopener noreferrer" className="italic hover:underline hover:text-orange-300 transition-colors">
                        OpenClaw
                    </a>{' '}
                    agent.
                </h2>
            </section>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
                {view === 'graphs' ? (
                    <div>
                        {/* Graph sub-tabs */}
                        <nav className="flex items-center gap-1 -ml-2 mb-6" aria-label="Graph tabs">
                            {([
                                ['scatter', 'Scatter Plots'],
                                ['heatmap', 'Task Heatmap'],
                                ['distribution', 'Score Distribution'],
                                ['radar', 'Model Comparison'],
                            ] as const).map(([tab, label]) => {
                                const isActive = graphSubTab === tab
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setGraphSubTab(tab)}
                                        className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                            ? 'text-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                            }`}
                                    >
                                        {isActive && (
                                            <span className="absolute inset-x-1 -bottom-[1px] h-0.5 bg-primary rounded-full" />
                                        )}
                                        {label}
                                    </button>
                                )
                            })}
                        </nav>

                        {graphSubTab === 'scatter' && (
                            <ScatterGraphs
                                entries={businessFilteredEntries}
                                scoreMode={scoreMode}
                                hiddenProviders={hiddenProviders}
                                onHiddenProvidersChange={setHiddenProviders}
                            />
                        )}
                        {graphSubTab === 'heatmap' && (
                            <TaskHeatmap
                                entries={filteredEntries}
                                selectedCategories={selectedCategories}
                                onCategoriesChange={setSelectedCategories}
                            />
                        )}
                        {graphSubTab === 'distribution' && (
                            <ScoreDistribution entries={businessFilteredEntries} scoreMode={scoreMode} currentVersion={currentVersion} officialOnly={officialOnlyState} />
                        )}
                        {graphSubTab === 'radar' && (
                            <ModelRadar entries={businessFilteredEntries} scoreMode={scoreMode} />
                        )}

                        <KiloClawAdCard />
                    </div>
                ) : (
                    <>
                        {view === 'success' && <QuickPicks picks={quickPicks} />}
                        {categoryFilterActive && taskDataError ? (
                            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                {taskDataError}
                            </div>
                        ) : null}
                        {categoryFilterActive && taskDataLoading ? (
                            <div className="mb-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                Loading category-specific scores for {filteredEntries.length} models...
                            </div>
                        ) : null}
                        <SimpleLeaderboard
                            entries={categoryScoredEntries}
                            view={view as 'success' | 'speed' | 'cost' | 'value'}
                            scoreMode={scoreMode}
                            sortMode={sortMode}
                            maxCostFilter={maxCostFilter}
                            showZeroCostResults={showZeroCostResults}
                            benchmarkVersion={currentVersion}
                            officialOnly={officialOnlyState}
                            championBadges={championBadges}
                            selectedCategories={selectedCategories}
                            activeCategoryTaskCount={activeCategoryTaskCount}
                            onScoreModeChange={setScoreMode}
                            onSortModeChange={setSortMode}
                            onMaxCostFilterChange={setMaxCostFilter}
                            onShowZeroCostResultsChange={setShowZeroCostResults}
                            onProviderClick={setProviderFilter}
                        />
                    </>
                )}
            </main>
        </div>
    )
}
