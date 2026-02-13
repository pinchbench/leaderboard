import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Submission Not Found
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            The submission ID you're looking for doesn't exist or has been
            removed from the leaderboard.
          </p>
          <Link href="/">
            <Button size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
