import type { Metadata } from 'next'
import { fetchLeaderboard, fetchBenchmarkVersions, fetchSubmission } from '@/lib/api'
import { calculateRanks, transformLeaderboardEntry, EPSILON, estimateSuccessfulTasks } from '@/lib/transforms'
import { isExcludedLeaderboardTask } from '@/lib/task-metadata'
import { LeaderboardView } from '@/components/leaderboard-view'

interface HomeProps {
  searchParams: Promise<{ version?: string; view?: string; official?: string; excludeImageGen?: string }>
}

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  const { version, view, official } = await searchParams
  const ogParams = new URLSearchParams()
  if (view) ogParams.set('view', view)
  if (version) ogParams.set('version', version)
  if (official === 'false') ogParams.set('official', 'false')
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
  const { version, official, excludeImageGen } = await searchParams
  const officialOnly = official !== 'false'
  const excludeImageGenBool = excludeImageGen === 'true'
  const [response, versionsResponse] = await Promise.all([
    fetchLeaderboard(version, { officialOnly }),
    fetchBenchmarkVersions(),
  ])
  let transformedEntries = response.leaderboard.map(transformLeaderboardEntry)

  if (excludeImageGenBool) {
    // Fetch best submission details and adjust scores to exclude image-generation tasks.
    const bestSubmissions = []
    const batchSize = 10

    for (let i = 0; i < transformedEntries.length; i += batchSize) {
      const batch = transformedEntries.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(entry =>
          fetchSubmission(entry.submission_id)
            .then(res => res.submission)
            .catch(err => {
              console.error('Failed to fetch submission for', entry.submission_id, err)
              return null
            })
        )
      )
      bestSubmissions.push(...results)
    }

    const adjustedEntries = []

    for (let i = 0; i < transformedEntries.length; i++) {
      const entry = transformedEntries[i]
      const sub = bestSubmissions[i]

      // Preserve the original entry if submission details are temporarily unavailable.
      if (!sub) {
        adjustedEntries.push(entry)
        continue
      }

      const excludedTasks = sub.tasks.filter(task => isExcludedLeaderboardTask(task.task_id))
      if (excludedTasks.length === 0) {
        adjustedEntries.push(entry)
        continue
      }

      const excludedScore = excludedTasks.reduce((sum, task) => sum + task.score, 0)
      const excludedMax = excludedTasks.reduce((sum, task) => sum + task.max_score, 0)
      const remainingTaskCount = sub.tasks.filter(task => !isExcludedLeaderboardTask(task.task_id)).length

      const adjustedScore = sub.total_score - excludedScore
      const adjustedMax = sub.max_score - excludedMax
      if (adjustedMax <= 0 || remainingTaskCount <= 0) {
        adjustedEntries.push(entry)
        continue
      }

      const adjustedPercentage = adjustedScore / adjustedMax
      if (!Number.isFinite(adjustedPercentage)) {
        adjustedEntries.push(entry)
        continue
      }

      const bestCost = entry.best_cost_usd
      let value_score: number | null = null
      if (bestCost != null && bestCost > EPSILON) {
        value_score = (adjustedPercentage * 100) / bestCost
      }

      let cpst: number | null = null
      const successfulTasks = estimateSuccessfulTasks(adjustedPercentage, remainingTaskCount)
      if (bestCost != null && bestCost > EPSILON && successfulTasks != null && successfulTasks > 0) {
        cpst = bestCost / successfulTasks
      }

      adjustedEntries.push({
        ...entry,
        percentage: adjustedPercentage * 100,
        value_score,
        cpst,
      })
    }

    transformedEntries = adjustedEntries
  }

  const entries = calculateRanks(transformedEntries)
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
      excludeImageGen={excludeImageGenBool}
    />
  )
}
