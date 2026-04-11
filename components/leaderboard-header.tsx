'use client'

import Link from 'next/link'
import type { LeaderboardEntry } from '@/lib/types'
import { ModelSearch } from '@/components/model-search'
import { SidebarTrigger } from '@/components/ui/sidebar'

type ViewMode = 'success' | 'speed' | 'cost' | 'value' | 'graphs'
type ScoreMode = 'best' | 'average'

interface LeaderboardHeaderProps {
    entries: LeaderboardEntry[]
    filteredEntryCount: number
    totalRuns: number
    currentVersion: string | null
    officialOnly: boolean
    view: ViewMode
    scoreMode: ScoreMode
    modelSearchValue: string
    onViewChange: (view: ViewMode) => void
    onScoreModeChange: (mode: ScoreMode) => void
    onModelSearchChange: (value: string) => void
}

export function LeaderboardHeader({
    entries,
    filteredEntryCount,
    totalRuns,
    currentVersion,
    officialOnly,
    view,
    scoreMode,
    modelSearchValue,
    onViewChange,
    onScoreModeChange,
    onModelSearchChange,
}: LeaderboardHeaderProps) {
    return (
        <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="h-8 w-8" />
                        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                            <img src="/apple-touch-icon.png" alt="PinchBench" className="w-7 h-7 md:w-8 md:h-8" />
                            <div>
                                <h1 className="text-lg md:text-xl font-bold text-foreground">PinchBench</h1>
                                <p className="hidden md:block text-xs text-muted-foreground">Find the best model for your OpenClaw</p>
                            </div>
                        </Link>
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
                            className="px-2.5 py-1.5 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors hidden sm:block"
                        >
                            About
                        </Link>
                        <a
                            href="https://github.com/pinchbench/skill"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
                        >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                            </svg>
                            <span className="hidden sm:inline">GitHub</span>
                        </a>
                        <a
                            href="https://github.com/pinchbench/skill"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                            Run the benchmark →
                        </a>
                    </div>
                </div>

                {/* View mode buttons */}
                <div className="grid grid-cols-3 gap-2 mt-3 md:mt-4 md:flex md:flex-wrap md:items-center">
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
                        onClick={() => onViewChange('value')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'value'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        <span className="mr-2">💎</span>
                        Value
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
                            href={currentVersion
                                ? `/runs?version=${currentVersion}${officialOnly ? '' : '&official=false'}`
                                : (officialOnly ? '/runs' : '/runs?official=false')}
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
