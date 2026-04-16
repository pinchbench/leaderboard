"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import type { BenchmarkVersion, LeaderboardEntry } from "@/lib/types"
import { PROVIDER_COLORS } from "@/lib/types"
import { VersionSelector } from "@/components/version-selector"
import { ModelSearch } from "@/components/model-search"
import type { ModelTier } from "@/lib/model-tiers"
import { TIER_LABELS } from "@/lib/model-tiers"

type ViewMode = "success" | "speed" | "cost" | "value" | "graphs"

interface LeaderboardHeaderProps {
    entries: LeaderboardEntry[]
    filteredEntryCount: number
    totalRuns: number
    versions: BenchmarkVersion[]
    currentVersion: string | null
    lastUpdated: string
    providerFilters: string[]
    view: ViewMode
    officialOnly: boolean
    openWeightsOnly: boolean
    tierFilter: ModelTier | null
    modelSearchValue: string
    onViewChange: (view: ViewMode) => void
    onOfficialOnlyChange: (officialOnly: boolean) => void
    onOpenWeightsOnlyChange: (openWeightsOnly: boolean) => void
    onProviderFiltersChange: (providers: string[]) => void
    onTierFilterChange: (tier: ModelTier | null) => void
    onModelSearchChange: (value: string) => void
}

const VIEW_CONFIG: { key: ViewMode; label: string; shortLabel: string; icon: string }[] = [
    { key: "success", label: "Success Rate", shortLabel: "Success", icon: "\u{1F980}" },
    { key: "speed", label: "Speed", shortLabel: "Speed", icon: "\u26A1" },
    { key: "cost", label: "Cost", shortLabel: "Cost", icon: "\u{1F4B0}" },
    { key: "value", label: "Value", shortLabel: "Value", icon: "\u{1F48E}" },
    { key: "graphs", label: "Graphs", shortLabel: "Graphs", icon: "\u{1F4CA}" },
]

export function LeaderboardHeader({
    entries,
    filteredEntryCount,
    totalRuns,
    versions,
    currentVersion,
    lastUpdated,
    providerFilters,
    view,
    officialOnly,
    openWeightsOnly,
    tierFilter,
    modelSearchValue,
    onViewChange,
    onOfficialOnlyChange,
    onOpenWeightsOnlyChange,
    onProviderFiltersChange,
    onTierFilterChange,
    onModelSearchChange,
}: LeaderboardHeaderProps) {
    const [filtersExpanded, setFiltersExpanded] = useState(false)

    const providerCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const entry of entries) {
            const p = entry.provider.toLowerCase()
            counts[p] = (counts[p] || 0) + 1
        }
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([provider, count]) => ({ provider, count }))
    }, [entries])

    const toggleProvider = (provider: string) => {
        if (providerFilters.includes(provider)) {
            onProviderFiltersChange(providerFilters.filter(p => p !== provider))
        } else {
            onProviderFiltersChange([...providerFilters, provider])
        }
    }

    const activeFilterCount = providerFilters.length + (tierFilter ? 1 : 0) + (openWeightsOnly ? 1 : 0)

    return (
        <header className="border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-5">
                {/* Top row: Logo + Search + Nav links */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/apple-touch-icon.png" alt="PinchBench" className="w-8 h-8 md:w-10 md:h-10" />
                        <div>
                            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <h1 className="text-xl md:text-2xl font-bold text-foreground">PinchBench</h1>
                            </Link>
                            <p className="hidden md:block text-sm text-muted-foreground">Find the best model for your OpenClaw</p>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center max-w-sm w-full">
                        <ModelSearch
                            entries={entries}
                            officialOnly={officialOnly}
                            searchValue={modelSearchValue}
                            onSearchChange={onModelSearchChange}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/about"
                            className="px-3 py-1 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                            About
                        </Link>
                        <a
                            href="https://github.com/pinchbench/skill"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
                        >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                            </svg>
                            <span className="hidden sm:inline">GitHub</span>
                        </a>
                        <div className="hidden md:block">
                            <VersionSelector versions={versions} currentVersion={currentVersion} />
                        </div>
                    </div>
                </div>

                {/* Segmented control for views + filter toggle */}
                <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1" data-share-exclude="true">
                        {VIEW_CONFIG.map(({ key, label, shortLabel, icon }) => (
                            <button
                                key={key}
                                onClick={() => onViewChange(key)}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                                    view === key
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                            >
                                <span className="mr-1.5">{icon}</span>
                                <span className="hidden sm:inline">{label}</span>
                                <span className="sm:hidden">{shortLabel}</span>
                            </button>
                        ))}
                    </div>

                    {/* Filter toggle button */}
                    <button
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-lg border text-xs md:text-sm font-medium transition-colors ${
                            activeFilterCount > 0
                                ? "border-primary/50 bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                        }`}
                        data-share-exclude="true"
                    >
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                        {filtersExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                        )}
                    </button>

                    {/* Stats + metadata */}
                    <div className="hidden md:flex ml-auto items-center gap-4 text-sm text-muted-foreground">
                        <span>{filteredEntryCount} models</span>
                        <Link
                            href={currentVersion
                                ? `/runs?version=${currentVersion}${officialOnly ? "" : "&official=false"}`
                                : (officialOnly ? "/runs" : "/runs?official=false")}
                            className="hover:underline hover:text-foreground transition-colors"
                        >
                            {totalRuns} runs
                        </Link>
                        <span className="text-muted-foreground/60 text-xs">Updated {lastUpdated}</span>
                    </div>
                </div>

                {/* Expandable filter panel */}
                {filtersExpanded && (
                    <div className="mt-3 rounded-lg border border-border bg-muted/10 p-4 space-y-4" data-share-exclude="true">
                        {/* Provider pills */}
                        <div>
                            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Providers</div>
                            <div className="flex flex-wrap gap-1.5">
                                {providerCounts.map(({ provider, count }) => {
                                    const isActive = providerFilters.includes(provider)
                                    const color = PROVIDER_COLORS[provider] || "#888"
                                    return (
                                        <button
                                            key={provider}
                                            onClick={() => toggleProvider(provider)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                                                isActive
                                                    ? "shadow-sm"
                                                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                                            }`}
                                            style={isActive ? {
                                                color: color,
                                                borderColor: color,
                                                backgroundColor: `${color}15`,
                                            } : undefined}
                                        >
                                            {provider}
                                            <span className={`text-[10px] tabular-nums ${isActive ? "opacity-80" : "opacity-50"}`}>
                                                {count}
                                            </span>
                                            {isActive && (
                                                <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                                            )}
                                        </button>
                                    )
                                })}
                                {providerFilters.length > 0 && (
                                    <button
                                        onClick={() => onProviderFiltersChange([])}
                                        className="px-2 py-1 rounded-full text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Second row: Tier filter + toggles */}
                        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/50">
                            {/* Model Tier */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier</span>
                                <div className="inline-flex rounded-md border border-border bg-background p-0.5">
                                    <button
                                        onClick={() => onTierFilterChange(null)}
                                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                            tierFilter === null
                                                ? "bg-secondary text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        All
                                    </button>
                                    {(["frontier", "mid", "budget"] as ModelTier[]).map((tier) => (
                                        <button
                                            key={tier}
                                            onClick={() => onTierFilterChange(tierFilter === tier ? null : tier)}
                                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                                tierFilter === tier
                                                    ? "bg-secondary text-foreground"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {TIER_LABELS[tier]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Open-weight only */}
                            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                                <input
                                    type="checkbox"
                                    checked={openWeightsOnly}
                                    onChange={(e) => onOpenWeightsOnlyChange(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border border-border/70 bg-muted/30 text-primary accent-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                                Open-weight only
                            </label>

                            {/* Official runs */}
                            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                                <input
                                    type="checkbox"
                                    checked={!officialOnly}
                                    onChange={(e) => onOfficialOnlyChange(!e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border border-border/70 bg-muted/30 text-primary accent-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                                Include unofficial runs
                            </label>
                        </div>
                    </div>
                )}

                {/* Active filter summary (collapsed state) */}
                {!filtersExpanded && activeFilterCount > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {providerFilters.map((provider) => {
                            const color = PROVIDER_COLORS[provider] || "#888"
                            return (
                                <span
                                    key={provider}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                                    style={{
                                        color: color,
                                        borderColor: color,
                                        backgroundColor: `${color}15`,
                                    }}
                                >
                                    {provider}
                                    <button
                                        onClick={() => toggleProvider(provider)}
                                        className="hover:opacity-70 transition-opacity"
                                        aria-label={`Remove ${provider} filter`}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )
                        })}
                        {tierFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-border bg-secondary/50">
                                {TIER_LABELS[tierFilter]}
                                <button
                                    onClick={() => onTierFilterChange(null)}
                                    className="hover:opacity-70 transition-opacity"
                                    aria-label="Clear tier filter"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {openWeightsOnly && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-border bg-secondary/50">
                                Open-weight
                                <button
                                    onClick={() => onOpenWeightsOnlyChange(false)}
                                    className="hover:opacity-70 transition-opacity"
                                    aria-label="Clear open-weight filter"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}

                {!officialOnly && (
                    <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        Showing official + unofficial results
                    </div>
                )}

                {/* Mobile stats + version */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground md:hidden">
                    <span>{filteredEntryCount} models</span>
                    <span>{totalRuns} runs</span>
                    <span className="text-muted-foreground/60">Updated {lastUpdated}</span>
                    <div className="ml-auto">
                        <VersionSelector versions={versions} currentVersion={currentVersion} />
                    </div>
                </div>
            </div>
        </header>
    )
}
