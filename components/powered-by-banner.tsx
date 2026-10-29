'use client'

import { usePostHog } from 'posthog-js/react'

export function PoweredByBanner() {
    const posthog = usePostHog()

    const handleClick = () => {
        posthog?.capture('kilo_cta_click', {
            location: 'top_banner',
            destination: 'https://kilo.ai?utm_source=pinchbench&utm_medium=referral',
        })
    }

    return (
        <div className="bg-gradient-to-r from-[#F8F675]/15 via-[#F8F675]/8 to-[#F8F675]/15 border-b border-[#F8F675]/30">
            <div className="max-w-7xl mx-auto px-6 py-2.5">
                <p className="text-center text-sm flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-[#F8F675]/50 bg-[#F8F675]/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#F8F675]">
                        Totally An Ad
                    </span>
                    <span className="text-foreground">
                        The open source AI coding agent with 500+ models.
                    </span>
                    <span className="text-muted-foreground hidden sm:inline">
                        Hosting and inference for PinchBench is sponsored by Kilo.
                    </span>
                    <a
                        href="https://kilo.ai?utm_source=pinchbench&utm_medium=referral"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1 ml-1 rounded-full border border-[#F8F675] bg-[#F8F675] text-black text-xs font-semibold hover:bg-[#e6e45f] transition-colors"
                    >
                        Try Kilo
                    </a>
                </p>
            </div>
        </div>
    )
}
