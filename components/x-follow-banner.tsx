'use client'

import { useState, useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { X } from 'lucide-react'

const BANNER_DISMISSED_KEY = 'pinchbench-x-banner-dismissed'

export function XFollowBanner() {
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
        posthog?.capture('x_follow_click', {
            location: 'top_banner',
            destination: 'https://x.com/pinchbench',
        })
    }

    if (isDismissed) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-blue-500/15 border-b border-blue-500/30">
            <div className="max-w-7xl mx-auto px-6 py-2.5 relative">
                <p className="text-center text-sm pr-8 flex items-center justify-center gap-2">
                    <svg
                        className="h-4 w-4 text-blue-500"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-foreground font-medium">Get notified when new model scores drop</span>
                    <a
                        href="https://x.com/pinchbench"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1 ml-1 rounded-full bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
                    >
                        Follow @pinchbench →
                    </a>
                </p>
                <button
                    onClick={handleDismiss}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-blue-500/10 transition-colors"
                    aria-label="Dismiss banner"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
