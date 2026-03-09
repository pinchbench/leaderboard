import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { XCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Verification Failed — PinchBench',
  description: 'There was a problem verifying your PinchBench API token.',
}

const REASON_MESSAGES: Record<string, { title: string; message: string; extra?: string }> = {
  invalid: {
    title: 'Invalid Claim Link',
    message: 'This claim link is invalid. Please generate a new one from the CLI.',
  },
  expired: {
    title: 'Claim Link Expired',
    message: 'This claim link has expired. Run your benchmark again or use the CLI to generate a new claim link.',
    extra: 'Claim links are valid for 24 hours.',
  },
  already_claimed: {
    title: 'Already Claimed',
    message: 'This token has already been claimed and linked to a GitHub account.',
  },
  github_error: {
    title: 'GitHub Connection Error',
    message: 'Something went wrong connecting to GitHub. Please try again.',
  },
}

interface ClaimErrorPageProps {
  searchParams: Promise<{ reason?: string }>
}

export default async function ClaimErrorPage({ searchParams }: ClaimErrorPageProps) {
  const { reason } = await searchParams
  const info = (reason ? REASON_MESSAGES[reason] : null) ?? {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
  }

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
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">{info.title}</h1>
            <p className="text-muted-foreground">{info.message}</p>
          </div>

          <Card className="p-6 bg-card border-border space-y-4">
            {info.extra && (
              <p className="text-sm text-muted-foreground">{info.extra}</p>
            )}
            {(reason === 'invalid' || reason === 'expired') && (
              <div className="rounded-lg bg-muted/30 border border-border p-3 text-sm">
                <p className="text-muted-foreground mb-1">To get a new claim link, run:</p>
                <code className="font-mono text-foreground">npx pinchbench</code>
              </div>
            )}
            <Link href="/">
              <Button variant="outline" className="w-full">Back to Leaderboard</Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}
