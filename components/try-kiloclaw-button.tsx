'use client'

import { usePostHog } from 'posthog-js/react'
import { Button } from '@/components/ui/button'

interface TryKiloClawButtonProps {
    model?: string
}

export function TryKiloClawButton({ model }: TryKiloClawButtonProps) {
    const posthog = usePostHog()

    const handleClick = () => {
        posthog?.capture('kiloclaw_cta_click', {
            location: 'submission_page',
            destination: 'https://app.kilo.ai/claw',
            model,
        })
    }

    return (
        <Button
            asChild
            size="sm"
            className="border border-[#F8F675] bg-[#F8F675] text-black hover:bg-[#e6e45f]"
        >
            <a href="https://app.kilo.ai/claw" target="_blank" rel="noopener noreferrer" onClick={handleClick}>
                Try in KiloClaw
            </a>
        </Button>
    )
}
