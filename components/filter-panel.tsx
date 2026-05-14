'use client'

import { useMemo, useState } from 'react'
import { SlidersHorizontal, X, Tag, Info, Search as SearchIcon, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import type { BenchmarkVersion, LeaderboardEntry } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { VersionSelector } from '@/components/version-selector'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

type ViewMode = 'success' | 'speed' | 'cost' | 'value' | 'graphs'
type ScoreMode = 'best' | 'average'
type SortMode = 'quality' | 'value'

interface FilterPanelProps {
  entries: LeaderboardEntry[]
  versions: BenchmarkVersion[]
  currentVersion: string | null
  view: ViewMode
  scoreMode: ScoreMode
  sortMode: SortMode
  officialOnly: boolean
  openWeightsOnly: boolean
  providerFilters: string[]
  maxCostFilter: string
  showZeroCostResults: boolean
  lastUpdated: string
  onVersionChange?: (version: string) => void
  onScoreModeChange: (mode: ScoreMode) => void
  onSortModeChange: (mode: SortMode) => void
  onOfficialOnlyChange: (officialOnly: boolean) => void
  onOpenWeightsOnlyChange: (openWeightsOnly: boolean) => void
  onProviderToggle: (provider: string) => void
  onClearProviders: () => void
  onMaxCostFilterChange: (value: string) => void
  onShowZeroCostResultsChange: (value: boolean) => void
}

export function FilterPanel({
  entries,
  versions,
  currentVersion,
  view,
  scoreMode,
  sortMode,
  officialOnly,
  openWeightsOnly,
  providerFilters,
  maxCostFilter,
  showZeroCostResults,
  lastUpdated,
  onScoreModeChange,
  onSortModeChange,
  onOfficialOnlyChange,
  onOpenWeightsOnlyChange,
  onProviderToggle,
  onClearProviders,
  onMaxCostFilterChange,
  onShowZeroCostResultsChange,
}: FilterPanelProps) {
  const [providerSearch, setProviderSearch] = useState('')
  const [providersOpen, setProvidersOpen] = useState(true)

  // Extract unique providers from entries, sorted by count
  const providers = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of entries) {
      const p = entry.provider.toLowerCase()
      counts.set(p, (counts.get(p) || 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, displayName: name.charAt(0).toUpperCase() + name.slice(1), count }))
  }, [entries])

  const filteredProviders = useMemo(() => {
    if (!providerSearch) return providers
    const q = providerSearch.toLowerCase()
    return providers.filter((p) => p.name.includes(q))
  }, [providers, providerSearch])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (!officialOnly) count++
    if (openWeightsOnly) count++
    if (providerFilters.length > 0) count += providerFilters.length
    if (maxCostFilter) count++
    if (showZeroCostResults) count++
    if (scoreMode === 'average') count++
    if (sortMode === 'value') count++
    return count
  }, [officialOnly, openWeightsOnly, providerFilters, maxCostFilter, showZeroCostResults, scoreMode, sortMode])

  const showBudgetFilter = view === 'success' || view === 'value'
  const showSortMode = view === 'success'
  const showZeroCostToggle = view === 'cost'
  const showScoreMode = view !== 'graphs'

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-xs font-medium relative"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            Filters &amp; Settings
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Version */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Benchmark Version</h3>
            </div>
            <VersionSelector versions={versions} currentVersion={currentVersion} />
          </section>

          <Separator />

          {/* View Mode Tabs - when in graphs */}
          {view === 'graphs' && (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Score Basis</h3>
                <div className="flex rounded-lg border border-border bg-background p-1">
                  <button
                    onClick={() => onScoreModeChange('best')}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'best'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Best Run
                  </button>
                  <button
                    onClick={() => onScoreModeChange('average')}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'average'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Average
                  </button>
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Score Mode - for table views */}
          {showScoreMode && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Score Display</h3>
              <div className="flex rounded-lg border border-border bg-background p-1">
                <button
                  onClick={() => onScoreModeChange('best')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'best'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Best Score
                </button>
                <button
                  onClick={() => onScoreModeChange('average')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scoreMode === 'average'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Average Score
                </button>
              </div>
            </section>
          )}

          {showScoreMode && <Separator />}

          {/* Sort Mode - success view only */}
          {showSortMode && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Sort Order</h3>
              <div className="flex rounded-lg border border-border bg-background p-1">
                <button
                  onClick={() => onSortModeChange('quality')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sortMode === 'quality'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Max Quality
                </button>
                <button
                  onClick={() => onSortModeChange('value')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sortMode === 'value'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Best Value
                </button>
              </div>
            </section>
          )}

          {showSortMode && <Separator />}

          {/* Budget Filter */}
          {showBudgetFilter && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Budget</h3>
              <p className="text-xs text-muted-foreground">
                Hide models that exceed your max cost per benchmark run.
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/30">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={maxCostFilter}
                  onChange={(e) => onMaxCostFilterChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium text-foreground focus:outline-none"
                />
                {maxCostFilter && (
                  <button
                    type="button"
                    onClick={() => onMaxCostFilterChange('')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '\u2264 $0.10', value: '0.10' },
                  { label: '\u2264 $0.50', value: '0.50' },
                  { label: '\u2264 $1.00', value: '1.00' },
                  { label: '\u2264 $5.00', value: '5.00' },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => onMaxCostFilterChange(preset.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      maxCostFilter === preset.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {showBudgetFilter && <Separator />}

          {/* Zero Cost Toggle */}
          {showZeroCostToggle && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Show $0 Results</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs p-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cost tracking can be unreliable for some providers, resulting in $0 values being saved incorrectly. These results are hidden by default.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  checked={showZeroCostResults}
                  onCheckedChange={onShowZeroCostResultsChange}
                />
              </div>
            </section>
          )}

          {showZeroCostToggle && <Separator />}

          {/* Toggles */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Display Options</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="unofficial-toggle" className="text-sm cursor-pointer">
                  Include unofficial runs
                </Label>
                <p className="text-xs text-muted-foreground">Show community submissions</p>
              </div>
              <Switch
                id="unofficial-toggle"
                checked={!officialOnly}
                onCheckedChange={(checked) => onOfficialOnlyChange(!checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="open-weights-toggle" className="text-sm cursor-pointer">
                  Open-weight only
                </Label>
                <p className="text-xs text-muted-foreground">Filter to open-source models</p>
              </div>
              <Switch
                id="open-weights-toggle"
                checked={openWeightsOnly}
                onCheckedChange={onOpenWeightsOnlyChange}
              />
            </div>
          </section>

          <Separator />

          {/* Providers Section */}
          <section className="space-y-3">
            <button
              onClick={() => setProvidersOpen(!providersOpen)}
              className="flex items-center gap-2 w-full text-left"
            >
              {providersOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Providers</h3>
                <span className="text-xs text-muted-foreground">({providers.length})</span>
              </div>
            </button>

            {providersOpen && (
              <div className="space-y-3">
                {/* Search input */}
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search providers..."
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    className="h-8 pl-8 pr-8 text-xs"
                  />
                  {providerSearch && (
                    <button
                      onClick={() => setProviderSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Active provider filters badges */}
                {providerFilters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {providerFilters.map((p) => {
                      const display = providers.find(pr => pr.name === p.toLowerCase())?.displayName || (p.charAt(0).toUpperCase() + p.slice(1))
                      const color = PROVIDER_COLORS[p.toLowerCase()] || '#666'
                      return (
                        <div
                          key={p}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/50 text-[10px] font-medium"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate max-w-[80px]">{display}</span>
                          <button
                            onClick={() => onProviderToggle(p)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Provider checkbox list */}
                <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                  {filteredProviders.map((provider) => {
                    const isActive = providerFilters.some(p => p.toLowerCase() === provider.name)
                    const color = PROVIDER_COLORS[provider.name] || '#666'
                    return (
                      <label
                        key={provider.name}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-secondary/70 text-foreground'
                            : 'text-muted-foreground hover:bg-secondary/30 hover:text-foreground'
                        }`}
                      >
                        <Checkbox
                          checked={isActive}
                          onCheckedChange={() => onProviderToggle(provider.name)}
                          className="h-3.5 w-3.5"
                        />
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="flex-1 truncate">{provider.displayName}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {provider.count}
                        </span>
                      </label>
                    )
                  })}
                  {filteredProviders.length === 0 && (
                    <p className="text-xs text-muted-foreground px-2 py-2 text-center">
                      No providers match "{providerSearch}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
