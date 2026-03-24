'use client'

import { usePostHog } from 'posthog-js/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function KiloClawAdCard() {
    const posthog = usePostHog()

    const handleClick = () => {
        posthog?.capture('kiloclaw_cta_click', {
            location: 'ad_card',
            destination: 'https://app.kilo.ai/claw',
        })
    }

    return (
        <Card className="my-6 border-[#F8F675]/30 bg-gradient-to-r from-[#F8F675]/10 via-card to-[#F8F675]/5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#F8F675]/50 bg-[#F8F675]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F8F675]">
                        <span>Totally An Ad</span>
                    </div>
                    <div className="flex gap-8 flex-col lg:flex-row">
                        <div className="flex-shrink">
                            <p className="text-lg font-semibold text-foreground">
                                Hosted OpenClaw — your personal AI agent, managed by Kilo.
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Hosting and inference cost for PinchBench sponsored by Kilo, so we totally hope you try KiloClaw so we can keep the lights on around here.
                            </p>
                        </div>
                        <p className="mt-1 flex-grow lg:min-w-[350px]">
                            From $8/month
                            + AI inference at cost
                        </p>
                    </div>
                </div>
                <Button
                    asChild
                    size="sm"
                    className="w-full border border-[#F8F675] bg-[#F8F675] text-black hover:bg-[#e6e45f] md:w-auto"
                >
                    <a href="https://app.kilo.ai/claw" target="_blank" rel="noopener noreferrer" onClick={handleClick}>
                        Try KiloClaw
                    </a>
                </Button>
            </div>
        </Card>
    )
}
