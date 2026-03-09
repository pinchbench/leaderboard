import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Verification Successful — PinchBench',
  description: 'Your GitHub account has been linked to your PinchBench API token.',
}

export default function ClaimSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block"
          >
            ← Back to Leaderboard
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-6xl block mb-4">🦞</span>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Verification Successful!</h1>
            <p className="text-muted-foreground">
              Your GitHub account has been linked to your PinchBench API token.
            </p>
          </div>

          <Card className="p-6 bg-card border-border space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Your submissions will now appear as <span className="text-green-500 font-medium">verified</span> on
                the leaderboard. A verified badge will be shown next to your runs.
              </p>
              <p>
                You can filter the leaderboard to show only verified runs using the{' '}
                <span className="text-foreground font-medium">Verified only</span> toggle.
              </p>
            </div>
            <Link href="/">
              <Button className="w-full">View Leaderboard</Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}
