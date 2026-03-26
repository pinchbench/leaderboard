'use client'

import { useState, useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { X, Rocket } from 'lucide-react'

const BANNER_DISMISSED_KEY = 'pinchbench-ph-banner-dismissed'

export function ProductHuntBanner() {
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
        posthog?.capture('product_hunt_click', {
            location: 'launch_banner',
            destination: 'https://www.producthunt.com/products/kiloclaw',
        })
    }

    if (isDismissed) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-[#da552f]/15 via-[#da552f]/10 to-[#da552f]/15 border-b border-[#da552f]/30">
            <div className="max-w-7xl mx-auto px-6 py-2.5 relative">
                <p className="text-center text-sm pr-8 flex items-center justify-center gap-2">
                    <Rocket className="h-4 w-4 text-[#da552f]" />
                    <span className="text-foreground font-medium">We're live on Product Hunt!</span>
                    <a
                        href="https://www.producthunt.com/products/kiloclaw"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1 ml-1 rounded-full bg-[#da552f] text-white text-xs font-semibold hover:bg-[#c44d2a] transition-colors"
                    >
                        Support us →
                    </a>
                </p>
                <button
                    onClick={handleDismiss}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-[#da552f]/10 transition-colors"
                    aria-label="Dismiss banner"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
