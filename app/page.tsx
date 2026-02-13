'use client'

import { SimpleLeaderboard } from '@/components/simple-leaderboard'
import { mockLeaderboard } from '@/lib/mock-data'
import { useState } from 'react'

type ViewMode = 'success' | 'speed' | 'cost'

export default function Home() {
  const [view, setView] = useState<ViewMode>('success')
  const lastUpdated = new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🦞</span>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  PinchBench
                </h1>
                <p className="text-sm text-muted-foreground">
                  Claw-some AI Agent Testing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{mockLeaderboard.length} models</span>
              <span>{lastUpdated}</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setView('success')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'success'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <span className="mr-2">🦀</span>
              Success Rate
            </button>
            <button
              onClick={() => setView('speed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'speed'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <span className="mr-2">⚡</span>
              Speed
            </button>
            <button
              onClick={() => setView('cost')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'cost'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <span className="mr-2">💰</span>
              Cost
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <SimpleLeaderboard entries={mockLeaderboard} view={view} />
      </main>
    </div>
  )
}
