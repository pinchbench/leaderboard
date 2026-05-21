import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Activity } from 'lucide-react'
import { PROVIDER_COLORS } from '@/lib/types'
import { fetchRecentSubmissions, fetchBenchmarkVersions } from '@/lib/api'
import { normalizeProvider } from '@/lib/transforms'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = {
  title: 'Recent Runs | PinchBench - OpenClaw Benchmark',
  description: 'Live stream of the most recent PinchBench benchmark submissions. See what models are being tested right now.',
}

interface StreamPageProps {
  searchParams: Promise<{ version?: string; official?: string }>
}

export default async function StreamPage({ searchParams }: StreamPageProps) {
  const { version, official } = await searchParams
  const officialOnly = official !== 'false'

  const [submissionsResponse, versionsResponse] = await Promise.all([
    fetchRecentSubmissions(version, 100, { officialOnly }),
    fetchBenchmarkVersions(),
  ])

  const submissions = submissionsResponse.submissions
  const currentVersions = versionsResponse.versions.filter(v => v.is_current).map(v => v.id)

  const versionLabel = version ?? 'Current'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href={version ? `/?version=${version}${officialOnly ? '' : '&official=false'}` : (officialOnly ? '/' : '/?official=false')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦞</span>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-400" />
                  Recent Runs
                </h1>
                <p className="text-xs text-muted-foreground">
                  {versionLabel} — newest first
                </p>
                {!officialOnly && (
                  <p className="text-xs text-amber-300">Including unofficial runs</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {submissions.length} recent runs
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
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 font-medium">Provider</th>
                <th className="py-2 pr-4 font-medium text-right">Score</th>
                <th className="py-2 pr-4 font-medium text-right">Cost</th>
                <th className="py-2 pr-4 font-medium text-right">Time</th>
                <th className="py-2 pr-4 font-medium">Bench Version</th>
                <th className="py-2 pr-4 font-medium">OpenClaw</th>
                <th className="py-2 pr-4 font-medium">Client</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const pct = (sub.score_percentage * 100).toFixed(1)
                const provider = normalizeProvider(sub.provider, sub.model)
                const providerColor = PROVIDER_COLORS[provider] || '#666'
                const costStr = sub.total_cost_usd > 0 ? `$${sub.total_cost_usd.toFixed(2)}` : '-'
                const timeMin = (sub.total_execution_time_seconds / 60).toFixed(1)
                const when = formatDistanceToNow(new Date(sub.timestamp), { addSuffix: true })
                return (
                  <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span className="text-muted-foreground" title={new Date(sub.timestamp).toLocaleString()}>
                        {when}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={officialOnly ? `/submission/${sub.id}` : `/submission/${sub.id}?official=false`}
                        className="inline-flex items-center gap-2 font-mono text-foreground hover:underline"
                      >
                        {sub.model}
                        {sub.official === false && (
                          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                            Unofficial
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <span style={{ color: providerColor }}>{provider}</span>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {submissions.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No recent runs found</p>
            <p className="text-sm mt-1">Check back soon — benchmarks run continuously.</p>
          </div>
        )}
      </div>
    </div>
  )
}
