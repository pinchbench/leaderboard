'use client'

import { useMemo, useState } from 'react'
import { Search, X, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import type { LeaderboardEntry, BenchmarkVersion } from '@/lib/types'
import { PROVIDER_COLORS } from '@/lib/types'
import { VersionSelector } from '@/components/version-selector'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
  SidebarSeparator,
  SidebarFooter,
} from '@/components/ui/sidebar'

interface FilterSidebarProps {
  entries: LeaderboardEntry[]
  versions: BenchmarkVersion[]
  currentVersion: string | null
  officialOnly: boolean
  openWeightsOnly: boolean
  providerFilter: string | null
  lastUpdated: string
  onOfficialOnlyChange: (officialOnly: boolean) => void
  onOpenWeightsOnlyChange: (openWeightsOnly: boolean) => void
  onProviderFilterChange: (provider: string | null) => void
}

function CollapsibleGroup({
  label,
  defaultOpen = true,
  children,
}: {
  label: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <SidebarGroup className="py-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {label}
      </button>
      {open && <SidebarGroupContent className="mt-1">{children}</SidebarGroupContent>}
    </SidebarGroup>
  )
}

export function FilterSidebar({
  entries,
  versions,
  currentVersion,
  officialOnly,
  openWeightsOnly,
  providerFilter,
  lastUpdated,
  onOfficialOnlyChange,
  onOpenWeightsOnlyChange,
  onProviderFilterChange,
}: FilterSidebarProps) {
  const [providerSearch, setProviderSearch] = useState('')

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
    if (providerFilter) count++
    return count
  }, [officialOnly, openWeightsOnly, providerFilter])

  const clearAllFilters = () => {
    onOfficialOnlyChange(true)
    onOpenWeightsOnlyChange(false)
    onProviderFilterChange(null)
  }

  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-sidebar-foreground/70" />
            <span className="text-sm font-semibold text-sidebar-foreground">Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-0">
        {/* Data Quality */}
        <CollapsibleGroup label="Data Quality">
          <div className="space-y-2.5 px-1">
            <label className="flex items-center gap-2.5 text-xs text-sidebar-foreground/90 cursor-pointer hover:text-sidebar-foreground transition-colors pl-1">
              <Checkbox
                checked={!officialOnly}
                onCheckedChange={(checked) => onOfficialOnlyChange(!checked)}
                className="h-3.5 w-3.5 rounded border border-sidebar-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              Include unofficial runs
            </label>
            <label className="flex items-center gap-2.5 text-xs text-sidebar-foreground/90 cursor-pointer hover:text-sidebar-foreground transition-colors pl-1">
              <Checkbox
                checked={openWeightsOnly}
                onCheckedChange={(checked) => onOpenWeightsOnlyChange(!!checked)}
                className="h-3.5 w-3.5 rounded border border-sidebar-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              Open-weight only
            </label>
          </div>
        </CollapsibleGroup>

        <SidebarSeparator className="mx-3" />

        {/* Version */}
        <CollapsibleGroup label="Benchmark Version">
          <div className="px-1">
            <VersionSelector versions={versions} currentVersion={currentVersion} />
          </div>
        </CollapsibleGroup>

        <SidebarSeparator className="mx-3" />

        {/* Providers */}
        <CollapsibleGroup label={`Providers (${providers.length})`}>
          <div className="px-1 space-y-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50" />
              <SidebarInput
                placeholder="Search providers..."
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                className="h-8 pl-7 pr-7 text-xs"
              />
              {providerSearch && (
                <button
                  onClick={() => setProviderSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Active provider filter badge */}
            {providerFilter && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-sidebar-accent">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PROVIDER_COLORS[providerFilter.toLowerCase()] || '#666' }}
                />
                <span className="text-xs font-medium text-sidebar-accent-foreground flex-1 truncate">
                  {providerFilter}
                </span>
                <button
                  onClick={() => onProviderFilterChange(null)}
                  className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Provider checkbox list */}
            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              {filteredProviders.map((provider) => {
                const isActive = providerFilter?.toLowerCase() === provider.name
                const color = PROVIDER_COLORS[provider.name] || '#666'
                return (
                  <label
                    key={provider.name}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    }`}
                  >
                    <Checkbox
                      checked={isActive}
                      onCheckedChange={(checked) => {
                        onProviderFilterChange(checked ? provider.displayName : null)
                      }}
                      className="h-3.5 w-3.5 rounded border border-sidebar-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="flex-1 truncate">{provider.displayName}</span>
                    <span className="text-[10px] text-sidebar-foreground/50 tabular-nums">
                      {provider.count}
                    </span>
                  </label>
                )
              })}
              {filteredProviders.length === 0 && (
                <p className="text-xs text-sidebar-foreground/50 px-2 py-2 text-center">
                  No providers match "{providerSearch}"
                </p>
              )}
            </div>
          </div>
        </CollapsibleGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-2">
        <p className="text-[10px] text-sidebar-foreground/50">
          Updated {lastUpdated}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
