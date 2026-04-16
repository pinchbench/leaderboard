import type { Metadata } from 'next'
import { fetchLeaderboard, fetchBenchmarkVersions, fetchBenchmarkStats } from '@/lib/api'
import { calculateRanks, transformLeaderboardEntry } from '@/lib/transforms'
import { LeaderboardView } from '@/components/leaderboard-view'

interface HomeProps {
  searchParams: Promise<{ version?: string; view?: string; official?: string }>
}

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  const { version, view, official } = await searchParams
  const ogParams = new URLSearchParams()
  if (view) ogParams.set('view', view)
  if (version) ogParams.set('version', version)
  if (official === 'false') ogParams.set('official', 'false')
  const ogUrl = `/api/og${ogParams.toString() ? `?${ogParams.toString()}` : ''}`

  const viewTitles: Record<string, string> = {
    success: 'Best Models by Success Rate',
    speed: 'Fastest Models',
    cost: 'Most Cost-Effective Models',
    value: 'Best Value Models',
    graphs: 'Model Comparison Graphs',
  }
  const title = viewTitles[view ?? 'success'] ?? 'Best AI Models for OpenClaw'
  const description = 'Find the best AI model for your OpenClaw agent. Compare success rates, speed, and cost across 100+ LLMs on real coding tasks.'

  return {
    title: `${title} | PinchBench - OpenClaw Benchmark`,
    description,
    openGraph: {
      title: `${title} | PinchBench`,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | PinchBench`,
      description,
      images: [ogUrl],
    },
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const { version, official } = await searchParams
  const officialOnly = official !== 'false'
  const [response, versionsResponse, benchmarkStats] = await Promise.all([
    fetchLeaderboard(version, { officialOnly }),
    fetchBenchmarkVersions(),
    fetchBenchmarkStats(version, { officialOnly }),
  ])
  const entries = calculateRanks(response.leaderboard.map(transformLeaderboardEntry))
  const latestTimestamp = entries.reduce((latest, entry) => {
    const current = new Date(entry.timestamp).getTime()
    return Number.isNaN(current) ? latest : Math.max(latest, current)
  }, 0)
  const lastUpdated = latestTimestamp
    ? new Date(latestTimestamp).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    : 'Unknown'

  return (
    <LeaderboardView
      entries={entries}
      lastUpdated={lastUpdated}
      versions={versionsResponse.versions}
      currentVersion={version ?? null}
      officialOnly={officialOnly}
      benchmarkStats={benchmarkStats}
    />
  )
}
