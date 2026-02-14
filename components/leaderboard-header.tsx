'use client'

import Link from 'next/link'
import type { BenchmarkVersion } from '@/lib/types'
import { VersionSelector } from '@/components/version-selector'

type ViewMode = 'success' | 'speed' | 'cost' | 'graphs'
type ScoreMode = 'best' | 'average'

interface LeaderboardHeaderProps {
    filteredEntryCount: number
    totalRuns: number
    versions: BenchmarkVersion[]
    currentVersion: string | null
    lastUpdated: string
    providerFilter: string | null
    providerColor?: string
    view: ViewMode
    scoreMode: ScoreMode
    onViewChange: (view: ViewMode) => void
    onScoreModeChange: (mode: ScoreMode) => void
    onClearProviderFilter: () => void
}

export function LeaderboardHeader({
    filteredEntryCount,
    totalRuns,
    versions,
    currentVersion,
    lastUpdated,
    providerFilter,
    providerColor,
    view,
    scoreMode,
    onViewChange,
    onScoreModeChange,
    onClearProviderFilter,
}: LeaderboardHeaderProps) {
    return (
        <header className="border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <span className="text-3xl md:text-4xl">🦞</span>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-foreground">PinchBench</h1>
                            <p className="hidden md:block text-sm text-muted-foreground">Claw-some AI Agent Testing</p>
                        </div>
                    </Link>
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
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
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-1">
                            <VersionSelector versions={versions} currentVersion={currentVersion} />
                            <span className="text-xs text-muted-foreground/60">Updated {lastUpdated}</span>
                        </div>
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
                                onClick={onClearProviderFilter}
                                className="ml-1 hover:opacity-70 transition-opacity"
                                aria-label="Clear provider filter"
                            >
                                x
                            </button>
                        </span>
                    </div>
                )}

                {/* Navigation buttons - 2x2 grid on mobile, inline on desktop */}
                <div className="grid grid-cols-2 gap-2 mt-4 md:mt-6 md:flex md:flex-wrap md:items-center">
                    <button
                        onClick={() => onViewChange('success')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'success'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        <span className="mr-2">🦀</span>
                        Success Rate
                    </button>
                    <button
                        onClick={() => onViewChange('speed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'speed'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        <span className="mr-2">⚡</span>
                        Speed
                    </button>
                    <button
                        onClick={() => onViewChange('cost')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'cost'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        <span className="mr-2">💰</span>
                        Cost
                    </button>
                    <button
                        onClick={() => onViewChange('graphs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'graphs'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        <span className="mr-2">📊</span>
                        Graphs
                    </button>
                    <div className="hidden md:flex md:ml-auto items-center gap-4 text-sm text-muted-foreground">
                        <span>{filteredEntryCount} models</span>
                        <Link
                            href={currentVersion ? `/runs?version=${currentVersion}` : '/runs'}
                            className="hover:underline hover:text-foreground transition-colors"
                        >
                            {totalRuns} runs
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
