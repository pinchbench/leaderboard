'use client'

import { useState, useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { X, Sparkles } from 'lucide-react'

const BANNER_DISMISSED_KEY = 'pinchbench-release-2.0-banner-dismissed'

export function ReleaseBanner() {
    const [isDismissed, setIsDismissed] = useState(true) // Start hidden to avoid flash
    const posthog = usePostHog()

    useEffect(() => {
        const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY)
        setIsDismissed(dismissed === 'true')
    }, [])

    const handleDismiss = () => {
        localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
        setIsDismissed(true)
    }

    const handleClick = () => {
        posthog?.capture('release_banner_click', {
            location: 'top_banner',
            destination: 'https://github.com/pinchbench/skill/releases/tag/v2.0.0',
            version: '2.0.0',
        })
    }

    if (isDismissed) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border-b border-orange-500/30">
            <div className="max-w-7xl mx-auto px-6 py-2.5 relative">
                <p className="text-center text-sm pr-8 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <span className="text-foreground font-medium">PinchBench 2.0 Released!</span>
                    <span className="text-muted-foreground">148 tasks, parallel judging, thinking-level support</span>
                    <a
                        href="https://github.com/pinchbench/skill/releases/tag/v2.0.0"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1 ml-1 rounded-full bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
                    >
                        See what's new →
                    </a>
                </p>
                <button
                    onClick={handleDismiss}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-orange-500/10 transition-colors"
                    aria-label="Dismiss banner"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
