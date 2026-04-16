'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { TaskCategoryBreakdown } from '@/lib/types'

interface StatCardProps {
    value: number
    label: string
    icon: string
    href?: string
    popoverContent?: React.ReactNode
}

function StatCard({ value, label, icon, href, popoverContent }: StatCardProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    const content = (
        <div className="flex flex-col items-center gap-0.5 px-4 py-3 min-w-[80px]">
            <span className="text-sm opacity-70">{icon}</span>
            <span className="text-xl md:text-2xl font-bold tabular-nums text-foreground">{value.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
    )

    if (!popoverContent && !href) {
        return (
            <div className="rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
                {content}
            </div>
        )
    }

    if (href && !popoverContent) {
        return (
            <Link
                href={href}
                className="rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 hover:border-border transition-colors cursor-pointer"
            >
                {content}
            </Link>
        )
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                className="rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 hover:border-border transition-colors cursor-pointer"
            >
                {content}
            </button>
            {open && popoverContent && (
                <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg text-sm"
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-l border-t border-border bg-popover" />
                    {popoverContent}
                </div>
            )}
        </div>
    )
}

interface StatsBarProps {
    taskCount: number
    modelCount: number
    runCount: number
    categories: TaskCategoryBreakdown[]
    providers: { name: string; count: number }[]
    currentVersion: string | null
    officialOnly: boolean
}

function formatCategoryName(cat: string): string {
    return cat
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
}

export function StatsBar({
    taskCount,
    modelCount,
    runCount,
    categories,
    providers,
    currentVersion,
    officialOnly,
}: StatsBarProps) {
    const categoryCount = categories.length

    if (taskCount === 0) return null

    const taskPopover = (
        <div>
            <p className="font-medium text-foreground mb-2">
                {taskCount} tasks across {categoryCount} categories
            </p>
            <div className="space-y-1">
                {categories.map(({ category, count, icon }) => (
                    <div key={category} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            {icon} {formatCategoryName(category)}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    )

    const modelPopover = providers.length > 0 ? (
        <div>
            <p className="font-medium text-foreground mb-2">
                {modelCount} models from {providers.length} providers
            </p>
            <div className="space-y-1">
                {providers.map(({ name, count }) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{name}</span>
                        <span className="font-medium tabular-nums text-foreground">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    ) : undefined

    const runsHref = currentVersion
        ? `/runs?version=${currentVersion}${officialOnly ? '' : '&official=false'}`
        : (officialOnly ? '/runs' : '/runs?official=false')

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-4">
            <StatCard
                value={taskCount}
                label="Tasks"
                icon="📋"
                popoverContent={taskPopover}
            />
            <StatCard
                value={modelCount}
                label="Models"
                icon="🤖"
                popoverContent={modelPopover}
            />
            <StatCard
                value={runCount}
                label="Runs"
                icon="🔄"
                href={runsHref}
            />
            <StatCard
                value={categoryCount}
                label="Categories"
                icon="📂"
                popoverContent={taskPopover}
            />
        </div>
    )
}
