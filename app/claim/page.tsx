import type { Metadata } from 'next'
import Link from 'next/link'
import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TopBanner } from '@/components/top-banner'

export const metadata: Metadata = {
  title: 'Claim Your PinchBench Submissions',
  description: 'Link your GitHub account to claim your PinchBench submissions on the leaderboard.',
}

const API_BASE = 'https://api.pinchbench.com/api'

interface ClaimPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ClaimPage({ searchParams }: ClaimPageProps) {
  const { token } = await searchParams

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBanner />
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Claim Your Runs</h1>
            <p className="text-muted-foreground">
              Link your GitHub account to claim your PinchBench submissions on the leaderboard.
            </p>
          </div>

          {token ? (
            <Card className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Signing in with GitHub links your identity to your API token so your runs are attached
                    to your GitHub profile on the leaderboard.
                  </p>
                  <p>
                    This is a one-time step — you only need to do it once per token.
                  </p>
                </div>
                <a
                  href={`${API_BASE}/claim/github?claim_code=${encodeURIComponent(token)}`}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Github className="h-5 w-5" />
                  Sign in with GitHub
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  You will be redirected to GitHub to authorize PinchBench.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h2 className="font-semibold text-foreground mb-1">Invalid Claim Link</h2>
                    <p className="text-sm text-muted-foreground">
                      This link is missing a claim token. Claim links are generated automatically
                      when you register a PinchBench API token via the CLI.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/30 border border-border p-3 text-sm">
                  <p className="text-muted-foreground mb-1">To get a valid claim link, run:</p>
                  <code className="font-mono text-foreground">npx pinchbench</code>
                </div>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Back to Leaderboard
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
