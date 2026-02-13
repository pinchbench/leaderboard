'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorPageProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">🦞</span>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">PinchBench</h1>
                            <p className="text-sm text-muted-foreground">Claw-some AI Agent Testing</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <Card className="p-6 bg-card border-border">
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        We couldn’t load the leaderboard right now. Please try again.
                    </p>
                    <Button onClick={reset}>Retry</Button>
                </Card>
            </main>
        </div>
    )
}
