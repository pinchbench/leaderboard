import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PROVIDER_COLORS } from '@/lib/types'
import { fetchSubmissions, fetchBenchmarkVersions } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface RunsPageProps {
  searchParams: Promise<{ version?: string }>
}

export default async function RunsPage({ searchParams }: RunsPageProps) {
  const { version } = await searchParams
  const [submissionsResponse, versionsResponse] = await Promise.all([
    fetchSubmissions(version, 500),
    fetchBenchmarkVersions(),
  ])

  const submissions = submissionsResponse.submissions
  const currentVersions = versionsResponse.versions.filter(v => v.is_current).map(v => v.id)

  // Sort by model name, then by score descending
  const sorted = [...submissions].sort((a, b) => {
    const modelCmp = a.model.localeCompare(b.model)
    if (modelCmp !== 0) return modelCmp
    return b.score_percentage - a.score_percentage
  })

  const versionLabel = version ?? 'Current'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href={version ? `/?version=${version}` : '/'}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦞</span>
              <div>
                <h1 className="text-xl font-bold text-foreground">PinchBench</h1>
                <p className="text-xs text-muted-foreground">
                  All Runs &mdash; {versionLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {sorted.length} runs
          </h2>
          {!version && (
            <span className="text-sm text-muted-foreground">
              across versions: {currentVersions.join(', ')}
            </span>
          )}
          {version && (
            <span className="text-sm text-muted-foreground">
              version: {version}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 font-medium">Provider</th>
                <th className="py-2 pr-4 font-medium text-right">Score</th>
                <th className="py-2 pr-4 font-medium text-right">Cost</th>
                <th className="py-2 pr-4 font-medium text-right">Time</th>
                <th className="py-2 pr-4 font-medium">Bench Version</th>
                <th className="py-2 pr-4 font-medium">OpenClaw</th>
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((sub) => {
                const pct = (sub.score_percentage * 100).toFixed(1)
                const providerColor = PROVIDER_COLORS[sub.provider.toLowerCase()] || '#666'
                const costStr = sub.total_cost_usd > 0 ? `$${sub.total_cost_usd.toFixed(2)}` : '-'
                const timeMin = (sub.total_execution_time_seconds / 60).toFixed(1)
                return (
                  <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/submission/${sub.id}`}
                        className="font-mono text-foreground hover:underline"
                      >
                        {sub.model}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <span style={{ color: providerColor }}>{sub.provider}</span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">{pct}%</td>
                    <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{costStr}</td>
                    <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{timeMin}m</td>
                    <td className="py-2 pr-4">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{sub.benchmark_version}</code>
                    </td>
                    <td className="py-2 pr-4">
                      <code className="text-xs text-muted-foreground">{sub.openclaw_version ?? '-'}</code>
                    </td>
                    <td className="py-2 pr-4">
                      <code className="text-xs text-muted-foreground">{sub.client_version ?? '-'}</code>
                    </td>
                    <td className="py-2 text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(sub.timestamp), { addSuffix: true })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
