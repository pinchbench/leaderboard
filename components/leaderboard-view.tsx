'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { LeaderboardEntry, BenchmarkVersion } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { SimpleLeaderboard } from '@/components/simple-leaderboard'
import { ScatterGraphs } from '@/components/scatter-graphs'
import { VersionSelector } from '@/components/version-selector'

type ViewMode = 'success' | 'speed' | 'cost' | 'graphs'
type ScoreMode = 'best' | 'average'

interface LeaderboardViewProps {
    entries: LeaderboardEntry[]
    lastUpdated: string
    versions: BenchmarkVersion[]
    currentVersion: string | null
}

export function LeaderboardView({ entries, lastUpdated, versions, currentVersion }: LeaderboardViewProps) {
    const [view, setView] = useState<ViewMode>('success')
    const [scoreMode, setScoreMode] = useState<ScoreMode>('best')
    const [providerFilter, setProviderFilter] = useState<string | null>(null)

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
            <header className="border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">🦞</span>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">PinchBench</h1>
                                <p className="text-sm text-muted-foreground">
                                    Claw-some AI Agent Testing
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{filteredEntries.length} models</span>
                                <Link
                                    href={currentVersion ? `/runs?version=${currentVersion}` : '/runs'}
                                    className="hover:underline hover:text-foreground transition-colors"
                                >
                                    {totalRuns} runs
                                </Link>
                                <VersionSelector versions={versions} currentVersion={currentVersion} />
                            </div>
                            <span className="text-xs text-muted-foreground/60">Updated {lastUpdated}</span>
                        </div>
                    </div>

                    {providerFilter && (
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-sm text-muted-foreground">Filtered by provider:</span>
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
                                style={{
                                    color: providerColor,
                                    borderColor: providerColor,
                                }}
                            >
                                {providerFilter}
                                <button
                                    onClick={() => setProviderFilter(null)}
                                    className="ml-1 hover:opacity-70 transition-opacity"
                                    aria-label="Clear provider filter"
                                >
                                    x
                                </button>
                            </span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-6">
                        <button
                            onClick={() => setView('success')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'success'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                        >
                            <span className="mr-2">🦀</span>
                            Success Rate
                        </button>
                        <button
                            onClick={() => setView('speed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'speed'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                        >
                            <span className="mr-2">⚡</span>
                            Speed
                        </button>
                        <button
                            onClick={() => setView('cost')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'cost'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                        >
                            <span className="mr-2">💰</span>
                            Cost
                        </button>
                        <button
                            onClick={() => setView('graphs')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'graphs'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                        >
                            <span className="mr-2">📊</span>
                            Graphs
                        </button>
                        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                            <button
                                onClick={() => setScoreMode('best')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'best'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Best score
                            </button>
                            <button
                                onClick={() => setScoreMode('average')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'average'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Average score
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {view === 'graphs' ? (
                    <ScatterGraphs entries={filteredEntries} scoreMode={scoreMode} />
                ) : (
                    <SimpleLeaderboard entries={filteredEntries} view={view} scoreMode={scoreMode} onProviderClick={setProviderFilter} />
                )}
            </main>
        </div>
    )
}
