'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ChevronDown, Check, Tag } from 'lucide-react'
import type { BenchmarkVersion } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface VersionSelectorProps {
    versions: BenchmarkVersion[]
    currentVersion: string | null
}

interface VersionGroup {
    semver: string
    versions: BenchmarkVersion[]
    totalSubmissionCount: number
    isCurrent: boolean
    latestCreatedAt: string
}

function groupVersionsBySemver(versions: BenchmarkVersion[]): VersionGroup[] {
    const groups = new Map<string, BenchmarkVersion[]>()

    // Group versions by their semver (or label if semver is null)
    for (const version of versions) {
        const key = version.semver ?? version.label
        if (!groups.has(key)) {
            groups.set(key, [])
        }
        groups.get(key)!.push(version)
    }

    // Convert to array and compute aggregates
    const result: VersionGroup[] = []
    for (const [semver, groupVersions] of groups) {
        const totalSubmissionCount = groupVersions.reduce(
            (sum, v) => sum + v.submission_count,
            0
        )
        const isCurrent = groupVersions.some((v) => v.is_current)
        // Get latest created_at from the group
        const latestCreatedAt = groupVersions
            .map((v) => v.created_at)
            .sort()
            .pop()!

        result.push({
            semver,
            versions: groupVersions,
            totalSubmissionCount,
            isCurrent,
            latestCreatedAt,
        })
    }

    // Sort by created_at descending (newest first)
    result.sort(
        (a, b) =>
            new Date(b.latestCreatedAt).getTime() -
            new Date(a.latestCreatedAt).getTime()
    )

    return result
}

function isVersionInGroup(group: VersionGroup, versionId: string | null): boolean {
    if (!versionId) return false
    return group.versions.some((v) => v.id === versionId)
}

export function VersionSelector({ versions, currentVersion }: VersionSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const groupedVersions = groupVersionsBySemver(versions)

    const handleVersionChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'latest') {
            params.delete('version')
        } else {
            params.set('version', value)
        }
        const query = params.toString()
        router.push(query ? `/?${query}` : '/')
    }

    // Find which group is currently selected (if any)
    const selectedGroup = currentVersion
        ? groupedVersions.find((g) => isVersionInGroup(g, currentVersion))
        : null

    const currentGroupCount = groupedVersions.filter((g) => g.isCurrent).length
    const totalGroups = groupedVersions.length

    const selectedLabel = selectedGroup
        ? selectedGroup.semver
        : 'Latest'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs font-normal"
                >
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium font-mono">{selectedLabel}</span>
                    {(selectedGroup?.isCurrent || !currentVersion) && (
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 border-green-500/50 text-green-500"
                        >
                            Current
                        </Badge>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px]">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    {totalGroups} version groups ({currentGroupCount} current)
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Latest option */}
                <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    onSelect={() => handleVersionChange('latest')}
                >
                    <div className="w-4 shrink-0">
                        {!currentVersion && (
                            <Check className="h-4 w-4 text-foreground" />
                        )}
                    </div>
                    <span className="text-sm font-medium">Latest</span>
                    <span className="text-xs text-muted-foreground">
                        Auto-select newest current version
                    </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {groupedVersions.map((group) => {
                    const isSelected = isVersionInGroup(group, currentVersion)
                    // Use the first version ID as the filter value
                    const versionId = group.versions[0].id
                    // Show count of unique version hashes in this group
                    const versionCount = group.versions.length

                    return (
                        <DropdownMenuItem
                            key={group.semver}
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                            onSelect={() => handleVersionChange(versionId)}
                        >
                            {/* Check mark column */}
                            <div className="w-4 shrink-0">
                                {isSelected && (
                                    <Check className="h-4 w-4 text-foreground" />
                                )}
                            </div>

                            {/* Version semver */}
                            <span className="text-sm font-mono font-medium min-w-[5rem] shrink-0">
                                {group.semver}
                            </span>

                            {/* Submission count */}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {group.totalSubmissionCount.toLocaleString()}{' '}
                                {group.totalSubmissionCount === 1 ? 'run' : 'runs'}
                            </span>

                            {/* Version count indicator */}
                            {versionCount > 1 && (
                                <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                                    ({versionCount} builds)
                                </span>
                            )}

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Latest date */}
                            <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                                {format(new Date(group.latestCreatedAt), 'MMM d, yyyy')}
                            </span>

                            {/* Current badge */}
                            {group.isCurrent && (
                                <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4 border-green-500/50 text-green-500 shrink-0"
                                >
                                    Current
                                </Badge>
                            )}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
