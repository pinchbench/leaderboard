import type { Metadata } from 'next'
import { fetchLeaderboard, fetchBenchmarkVersions } from '@/lib/api'
import { calculateRanks, transformLeaderboardEntry } from '@/lib/transforms'
import { LeaderboardView } from '@/components/leaderboard-view'

interface HomeProps {
  searchParams: Promise<{ version?: string; view?: string }>
}

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  const { version, view } = await searchParams
  const ogParams = new URLSearchParams()
  if (view) ogParams.set('view', view)
  if (version) ogParams.set('version', version)
  const ogUrl = `/api/og${ogParams.toString() ? `?${ogParams.toString()}` : ''}`

  const viewTitles: Record<string, string> = {
    success: 'Success Rate Leaderboard',
    speed: 'Speed Leaderboard',
    cost: 'Cost Leaderboard',
    graphs: 'Benchmark Graphs',
  }
  const title = viewTitles[view ?? 'success'] ?? 'AI Agent Benchmark Leaderboard'

  return {
    title: `PinchBench - ${title}`,
    description: 'Benchmarking LLM models as AI agents across standardized coding tasks',
    openGraph: {
      title: `PinchBench - ${title}`,
      description: 'Benchmarking LLM models as AI agents across standardized coding tasks',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `PinchBench - ${title}`,
      description: 'Benchmarking LLM models as AI agents across standardized coding tasks',
      images: [ogUrl],
    },
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const { version } = await searchParams
  const [response, versionsResponse] = await Promise.all([
    fetchLeaderboard(version),
    fetchBenchmarkVersions(),
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
    />
  )
}
