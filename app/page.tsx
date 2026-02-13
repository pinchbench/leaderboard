import { fetchLeaderboard } from '@/lib/api'
import { calculateRanks, transformLeaderboardEntry } from '@/lib/transforms'
import { LeaderboardView } from '@/components/leaderboard-view'

export default async function Home() {
  const response = await fetchLeaderboard()
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

  return <LeaderboardView entries={entries} lastUpdated={lastUpdated} />
}
