'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const BANNER_DISMISSED_KEY = 'pinchbench-banner-dismissed'

export function PoweredByBanner() {
    const [isDismissed, setIsDismissed] = useState(true) // Start hidden to avoid flash

    useEffect(() => {
        const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY)
        setIsDismissed(dismissed === 'true')
    }, [])

    const handleDismiss = () => {
        localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
        setIsDismissed(true)
    }

    if (isDismissed) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-orange-500/10 border-b border-orange-500/20">
            <div className="max-w-7xl mx-auto px-6 py-2 relative">
                <p className="text-center text-sm pr-8">
                    <span className="text-muted-foreground">Powered by </span>
                    <a
                        href="https://kilo.ai/kiloclaw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                    >
                        KiloClaw
                    </a>
                    <span className="text-muted-foreground"> — The best way to Claw</span>
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
