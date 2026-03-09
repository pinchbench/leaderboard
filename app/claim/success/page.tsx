import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Github, User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Account Linked — PinchBench',
  description: 'Your GitHub account has been linked to your PinchBench API token.',
}

interface ClaimSuccessPageProps {
  searchParams: Promise<{ username?: string }>
}

export default async function ClaimSuccessPage({ searchParams }: ClaimSuccessPageProps) {
  const { username } = await searchParams

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
            <h1 className="text-3xl font-bold text-foreground mb-2">You're All Set!</h1>
            <p className="text-muted-foreground">
              Your GitHub account has been linked to PinchBench.
            </p>
          </div>

          <Card className="p-6 bg-card border-border space-y-5">
            {username && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Github className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">@{username}</p>
                  <p className="text-xs text-muted-foreground">GitHub account linked</p>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>
                All your benchmark submissions are now associated with your GitHub identity.
                You can view your runs and track your progress on your personal dashboard.
              </p>
            </div>

            <div className="space-y-2">
              {username ? (
                <Link href={`/user/${encodeURIComponent(username)}`}>
                  <Button className="w-full gap-2">
                    <User className="h-4 w-4" />
                    View My Submissions
                  </Button>
                </Link>
              ) : (
                <Link href="/">
                  <Button className="w-full">View Leaderboard</Button>
                </Link>
              )}
              {username && (
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    View Leaderboard
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
