'use client'

import Link from 'next/link'
import { Github, BarChart3, Zap, Gem, DollarSign, Trophy } from 'lucide-react'
import type { LeaderboardEntry } from '@/lib/types'
import { ModelSearch } from '@/components/model-search'
import { FilterPanel } from '@/components/filter-panel'
import type { BenchmarkVersion } from '@/lib/types'

type ViewMode = 'success' | 'speed' | 'cost' | 'value' | 'graphs'
type ScoreMode = 'best' | 'average'
type SortMode = 'quality' | 'value'
type GraphSubTab = 'scatter' | 'heatmap' | 'distribution' | 'radar'

interface LeaderboardHeaderProps {
  entries: LeaderboardEntry[]
  filteredEntryCount: number
  totalRuns: number
  versions: BenchmarkVersion[]
  currentVersion: string | null
  lastUpdated: string
  providerFilter: string | null
  providerColor?: string
  view: ViewMode
  scoreMode: ScoreMode
  sortMode: SortMode
  officialOnly: boolean
  openWeightsOnly: boolean
  modelSearchValue: string
  maxCostFilter: string
  showZeroCostResults: boolean
  graphSubTab: GraphSubTab
  onViewChange: (view: ViewMode) => void
  onScoreModeChange: (mode: ScoreMode) => void
  onSortModeChange: (mode: SortMode) => void
  onOfficialOnlyChange: (officialOnly: boolean) => void
  onOpenWeightsOnlyChange: (openWeightsOnly: boolean) => void
  onClearProviderFilter: () => void
  onModelSearchChange: (value: string) => void
  onMaxCostFilterChange: (value: string) => void
  onShowZeroCostResultsChange: (value: boolean) => void
}

const VIEW_TABS = [
  { id: 'success' as ViewMode, label: 'Success Rate', icon: Trophy },
  { id: 'speed' as ViewMode, label: 'Speed', icon: Zap },
  { id: 'cost' as ViewMode, label: 'Cost', icon: DollarSign },
  { id: 'value' as ViewMode, label: 'Value', icon: Gem },
  { id: 'graphs' as ViewMode, label: 'Graphs', icon: BarChart3 },
]

export function LeaderboardHeader({
  entries,
  filteredEntryCount,
  totalRuns,
  versions,
  currentVersion,
  lastUpdated,
  providerFilter,
  providerColor,
  view,
  scoreMode,
  sortMode,
  officialOnly,
  openWeightsOnly,
  modelSearchValue,
  maxCostFilter,
  showZeroCostResults,
  graphSubTab,
  onViewChange,
  onScoreModeChange,
  onSortModeChange,
  onOfficialOnlyChange,
  onOpenWeightsOnlyChange,
  onClearProviderFilter,
  onModelSearchChange,
  onMaxCostFilterChange,
  onShowZeroCostResultsChange,
}: LeaderboardHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      {/* Top Row: Branding | Search | Actions */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/apple-touch-icon.png"
              alt="PinchBench"
              className="w-7 h-7 md:w-8 md:h-8"
            />
            <div className="hidden sm:block">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                  PinchBench <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary/50 border border-border/50 text-xs font-medium text-muted-foreground">v2</span>
                </h1>
                <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase mt-0.5">
                  OpenClaw Leaderboard
                </p>
              </Link>
            </div>
          </div>

          {/* Search - Prominent, centered, flex-grow */}
          <div className="flex-1 max-w-xl mx-auto">
            <ModelSearch
              entries={entries}
              officialOnly={officialOnly}
              searchValue={modelSearchValue}
              onSearchChange={onModelSearchChange}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <FilterPanel
              versions={versions}
              currentVersion={currentVersion}
              view={view}
              scoreMode={scoreMode}
              sortMode={sortMode}
              officialOnly={officialOnly}
              openWeightsOnly={openWeightsOnly}
              providerFilter={providerFilter}
              providerColor={providerColor}
              maxCostFilter={maxCostFilter}
              showZeroCostResults={showZeroCostResults}
              lastUpdated={lastUpdated}
              onVersionChange={(version) => {
                // This is handled by VersionSelector internally via router
                // We pass a no-op since VersionSelector manages its own navigation
              }}
              onScoreModeChange={onScoreModeChange}
              onSortModeChange={onSortModeChange}
              onOfficialOnlyChange={onOfficialOnlyChange}
              onOpenWeightsOnlyChange={onOpenWeightsOnlyChange}
              onClearProviderFilter={onClearProviderFilter}
              onMaxCostFilterChange={onMaxCostFilterChange}
              onShowZeroCostResultsChange={onShowZeroCostResultsChange}
            />
            <Link
              href="/about"
              className="hidden md:inline-flex px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              About
            </Link>
            <Link
              href="/contributors"
              className="hidden md:inline-flex px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Contributors
            </Link>
            <a
              href="https://github.com/pinchbench/skill"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Row: View Tabs + Stats */}
      <div className="border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-12">
            {/* View Tabs */}
            <nav className="flex items-center gap-1 -ml-2" aria-label="View tabs">
              {VIEW_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = view === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onViewChange(tab.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                  >
                    {isActive && (
                      <span className="absolute inset-x-1 -bottom-[9px] h-0.5 bg-primary rounded-full" />
                    )}
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Stats Pills */}
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/50">
                <span className="font-semibold text-foreground">{filteredEntryCount}</span>
                {' '}models
              </span>
              <Link
                href={currentVersion
                  ? `/runs?version=${currentVersion}${officialOnly ? '' : '&official=false'}`
                  : (officialOnly ? '/runs' : '/runs?official=false')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
              >
                <span className="font-semibold text-foreground">{totalRuns.toLocaleString()}</span>
                {' '}runs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Unofficial banner */}
      {!officialOnly && (
        <div className="bg-amber-500/10 border-t border-amber-500/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2">
            <p className="text-xs text-amber-200 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
              Showing official + unofficial results
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
