'use client'

import { useMemo } from 'react'
import { SlidersHorizontal, X, Tag, Info } from 'lucide-react'
import type { BenchmarkVersion } from '@/lib/types'
import { VersionSelector } from '@/components/version-selector'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type ViewMode = 'success' | 'speed' | 'cost' | 'value' | 'graphs'
type ScoreMode = 'best' | 'average'
type SortMode = 'quality' | 'value'

interface FilterPanelProps {
  versions: BenchmarkVersion[]
  currentVersion: string | null
  view: ViewMode
  scoreMode: ScoreMode
  sortMode: SortMode
  officialOnly: boolean
  openWeightsOnly: boolean
  providerFilter: string | null
  providerColor?: string
  maxCostFilter: string
  showZeroCostResults: boolean
  lastUpdated: string
  onVersionChange?: (version: string) => void
  onScoreModeChange: (mode: ScoreMode) => void
  onSortModeChange: (mode: SortMode) => void
  onOfficialOnlyChange: (officialOnly: boolean) => void
  onOpenWeightsOnlyChange: (openWeightsOnly: boolean) => void
  onClearProviderFilter: () => void
  onMaxCostFilterChange: (value: string) => void
  onShowZeroCostResultsChange: (value: boolean) => void
}

export function FilterPanel({
  versions,
  currentVersion,
  view,
  scoreMode,
  sortMode,
  officialOnly,
  openWeightsOnly,
  providerFilter,
  providerColor,
  maxCostFilter,
  showZeroCostResults,
  lastUpdated,
  onScoreModeChange,
  onSortModeChange,
  onOfficialOnlyChange,
  onOpenWeightsOnlyChange,
  onClearProviderFilter,
  onMaxCostFilterChange,
  onShowZeroCostResultsChange,
}: FilterPanelProps) {
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (!officialOnly) count++
    if (openWeightsOnly) count++
    if (providerFilter) count++
    if (maxCostFilter) count++
    if (showZeroCostResults) count++
    if (scoreMode === 'average') count++
    if (sortMode === 'value') count++
    return count
  }, [officialOnly, openWeightsOnly, providerFilter, maxCostFilter, showZeroCostResults, scoreMode, sortMode])

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

          {/* Active Provider Filter */}
          {providerFilter && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Active Provider</h3>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
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
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            </section>
          )}
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
