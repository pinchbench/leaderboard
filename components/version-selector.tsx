'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ChevronDown, Check, GitCommit } from 'lucide-react'
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

export function VersionSelector({ versions, currentVersion }: VersionSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

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

    const selectedVersion = currentVersion
        ? versions.find((v) => v.id === currentVersion)
        : null

    const currentVersions = versions.filter((v) => v.is_current)
    const selectedLabel = selectedVersion
        ? selectedVersion.id.slice(0, 8)
        : 'Latest'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs font-normal"
                >
                    <GitCommit className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium font-mono">{selectedLabel}</span>
                    {(selectedVersion?.is_current || !currentVersion) && (
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
                    {versions.length} benchmark versions ({currentVersions.length} current)
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

                {versions.map((v) => {
                    const isSelected = currentVersion === v.id

                    return (
                        <DropdownMenuItem
                            key={v.id}
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                            onSelect={() => handleVersionChange(v.id)}
                        >
                            {/* Check mark column */}
                            <div className="w-4 shrink-0">
                                {isSelected && (
                                    <Check className="h-4 w-4 text-foreground" />
                                )}
                            </div>

                            {/* Version hash */}
                            <span className="text-sm font-mono font-medium w-[4.5rem] shrink-0">
                                {v.id.slice(0, 8)}
                            </span>

                            {/* Submission count */}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {v.submission_count} {v.submission_count === 1 ? 'run' : 'runs'}
                            </span>

                            {/* Date */}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(v.created_at), 'MMM d, yyyy')}
                            </span>

                            {/* Current badge, pushed to the right */}
                            <div className="ml-auto">
                                {v.is_current && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4 border-green-500/50 text-green-500"
                                    >
                                        Current
                                    </Badge>
                                )}
                            </div>
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
