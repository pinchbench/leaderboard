"use client"

import { useCallback, useMemo, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import type { LeaderboardEntry, BenchmarkVersion } from "@/lib/types"
import { SimpleLeaderboard } from "@/components/simple-leaderboard"
import { ScatterGraphs } from "@/components/scatter-graphs"
import { TaskHeatmap } from "@/components/task-heatmap"
import { ScoreDistribution } from "@/components/score-distribution"
import { ModelRadar } from "@/components/model-radar"
import { LeaderboardHeader } from "@/components/leaderboard-header"
import { KiloClawAdCard } from "@/components/kiloclaw-ad-card"
import { getModelTier, type ModelTier } from "@/lib/model-tiers"

type ViewMode = "success" | "speed" | "cost" | "value" | "graphs"
type ScoreMode = "best" | "average"
type GraphSubTab = "scatter" | "heatmap" | "distribution" | "radar"

function parseCategoriesParam(raw: string | null): string[] {
    if (!raw?.trim()) return []
    const parts = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    return [...new Set(parts)]
}

const VALID_VIEWS: ViewMode[] = ["success", "speed", "cost", "value", "graphs"]
const VALID_SCORE_MODES: ScoreMode[] = ["best", "average"]
const VALID_GRAPH_TABS: GraphSubTab[] = ["scatter", "heatmap", "distribution", "radar"]
const VALID_TIERS: ModelTier[] = ["frontier", "mid", "budget"]

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

    const initialView = VALID_VIEWS.includes(searchParams.get("view") as ViewMode)
        ? (searchParams.get("view") as ViewMode)
        : "success"
    const initialScoreMode = VALID_SCORE_MODES.includes(searchParams.get("score") as ScoreMode)
        ? (searchParams.get("score") as ScoreMode)
        : "best"
    // Support both old ?provider= (single) and new ?providers= (multi) params
    const initialProviders = searchParams.get("providers")
        ? searchParams.get("providers")!.split(",").filter(Boolean)
        : searchParams.get("provider")
            ? [searchParams.get("provider")!]
            : []
    const initialOpenWeights = searchParams.get("weights") === "open"
    const initialGraphTab = VALID_GRAPH_TABS.includes(searchParams.get("graph") as GraphSubTab)
        ? (searchParams.get("graph") as GraphSubTab)
        : "scatter"
    const initialModelSearch = searchParams.get("model") || ""
    const initialTier = VALID_TIERS.includes(searchParams.get("tier") as ModelTier)
        ? (searchParams.get("tier") as ModelTier)
        : null

    const [view, setViewState] = useState<ViewMode>(initialView)
    const [officialOnlyState, setOfficialOnlyState] = useState<boolean>(officialOnly)
    const [scoreMode, setScoreModeState] = useState<ScoreMode>(initialScoreMode)
    const [providerFilters, setProviderFiltersState] = useState<string[]>(initialProviders)
    const [openWeightsOnly, setOpenWeightsOnlyState] = useState<boolean>(initialOpenWeights)
    const [graphSubTab, setGraphSubTabState] = useState<GraphSubTab>(initialGraphTab)
    const [modelSearch, setModelSearchState] = useState<string>(initialModelSearch)
    const [tierFilter, setTierFilterState] = useState<ModelTier | null>(initialTier)

    const updateUrl = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === undefined) {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        }
        if (params.get("view") === "success") params.delete("view")
        if (params.get("score") === "best") params.delete("score")
        if (params.get("weights") !== "open") params.delete("weights")
        params.delete("provider")
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

    const setProviderFilters = useCallback((providers: string[]) => {
        setProviderFiltersState(providers)
        updateUrl({ providers: providers.length > 0 ? providers.join(",") : null })
    }, [updateUrl])

    const setOpenWeightsOnly = useCallback((v: boolean) => {
        setOpenWeightsOnlyState(v)
        updateUrl({ weights: v ? "open" : null })
    }, [updateUrl])

    const setGraphSubTab = useCallback((t: GraphSubTab) => {
        setGraphSubTabState(t)
        updateUrl({ graph: t === "scatter" ? null : t })
    }, [updateUrl])

    const handleModelSearchChange = useCallback((s: string) => {
        setModelSearchState(s)
        updateUrl({ model: s || null })
    }, [updateUrl])

    const setOfficialOnly = useCallback((v: boolean) => {
        setOfficialOnlyState(v)
        updateUrl({ official: v ? null : "false" })
    }, [updateUrl])

    const setTierFilter = useCallback((tier: ModelTier | null) => {
        setTierFilterState(tier)
        updateUrl({ tier: tier })
    }, [updateUrl])

    const selectedCategories = useMemo(
        () => parseCategoriesParam(searchParams.get("categories")),
        [searchParams]
    )

    const setSelectedCategories = useCallback((cats: string[]) => {
        const normalized = [...new Set(cats.map((c) => c.trim().toLowerCase()).filter(Boolean))]
        updateUrl({ categories: normalized.length ? normalized.join(",") : null })
    }, [updateUrl])

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            if (providerFilters.length > 0) {
                const lowerProviders = providerFilters.map(p => p.toLowerCase())
                if (!lowerProviders.includes(entry.provider.toLowerCase())) return false
            }
            if (openWeightsOnly && entry.weights !== "Open") return false
            if (modelSearch && !entry.model.toLowerCase().includes(modelSearch.toLowerCase())) return false
            if (tierFilter && getModelTier(entry.model) !== tierFilter) return false
            return true
        })
    }, [entries, providerFilters, openWeightsOnly, modelSearch, tierFilter])

    const totalRuns = entries.reduce((acc, entry) => acc + (entry.submission_count || 1), 0)

    return (
        <div className="min-h-screen bg-background">
            <LeaderboardHeader
                entries={entries}
                filteredEntryCount={filteredEntries.length}
                totalRuns={totalRuns}
                versions={versions}
                currentVersion={currentVersion}
                lastUpdated={lastUpdated}
                providerFilters={providerFilters}
                view={view}
                officialOnly={officialOnlyState}
                openWeightsOnly={openWeightsOnly}
                tierFilter={tierFilter}
                modelSearchValue={modelSearch}
                onViewChange={setView}
                onOfficialOnlyChange={setOfficialOnly}
                onOpenWeightsOnlyChange={setOpenWeightsOnly}
                onProviderFiltersChange={setProviderFilters}
                onTierFilterChange={setTierFilter}
                onModelSearchChange={handleModelSearchChange}
            />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {view === "graphs" ? (
                    <div>
                        <div className="flex gap-1 rounded-lg border border-border bg-background p-1 w-fit mb-6">
                            {([
                                ["scatter", "Scatter Plots"],
                                ["heatmap", "Task Heatmap"],
                                ["distribution", "Score Distribution"],
                                ["radar", "Model Comparison"],
                            ] as const).map(([tab, label]) => (
                                <button
                                    key={tab}
                                    onClick={() => setGraphSubTab(tab)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${graphSubTab === tab
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {graphSubTab === "scatter" && (
                            <ScatterGraphs entries={filteredEntries} scoreMode={scoreMode} />
                        )}
                        {graphSubTab === "heatmap" && (
                            <TaskHeatmap
                                entries={filteredEntries}
                                selectedCategories={selectedCategories}
                                onCategoriesChange={setSelectedCategories}
                            />
                        )}
                        {graphSubTab === "distribution" && (
                            <ScoreDistribution entries={filteredEntries} scoreMode={scoreMode} currentVersion={currentVersion} officialOnly={officialOnlyState} />
                        )}
                        {graphSubTab === "radar" && (
                            <ModelRadar entries={filteredEntries} scoreMode={scoreMode} />
                        )}

                        <KiloClawAdCard />
                    </div>
                ) : (
                    <SimpleLeaderboard
                        entries={filteredEntries}
                        view={view as "success" | "speed" | "cost" | "value"}
                        scoreMode={scoreMode}
                        benchmarkVersion={currentVersion}
                        officialOnly={officialOnlyState}
                        onScoreModeChange={setScoreMode}
                        onProviderClick={(provider) => {
                            const lower = provider.toLowerCase()
                            if (providerFilters.includes(lower)) {
                                setProviderFilters(providerFilters.filter(p => p !== lower))
                            } else {
                                setProviderFilters([...providerFilters, lower])
                            }
                        }}
                    />
                )}
            </main>
        </div>
    )
}
