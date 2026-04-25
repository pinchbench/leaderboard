import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchBenchmarkVersions, fetchLeaderboard, fetchTransformedBestSubmissions } from "@/lib/api";
import { calculateRanks, transformLeaderboardEntry } from "@/lib/transforms";
import {
  BEST_FOR_CATEGORIES,
  formatCost,
  formatDuration,
  getBestForConfig,
  getCategoryScore,
  getQuickRecommendations,
  enrichEntriesWithSubmissions,
  sortEntriesForBestFor,
} from "@/lib/recommendations";
import { VersionSelector } from "@/components/version-selector";
import { QuickPicks } from "@/components/quick-picks";

interface BestForPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ version?: string; official?: string }>;
}

export function generateStaticParams() {
  return BEST_FOR_CATEGORIES.map((config) => ({ slug: config.slug }));
}

export async function generateMetadata({ params }: BestForPageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getBestForConfig(slug);
  if (!config) return {};

  return {
    title: `${config.title} | PinchBench`,
    description: config.description,
    openGraph: {
      title: `${config.title} | PinchBench`,
      description: config.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${config.title} | PinchBench`,
      description: config.description,
    },
  };
}

export default async function BestForPage({ params, searchParams }: BestForPageProps) {
  const { slug } = await params;
  const { version, official } = await searchParams;
  const config = getBestForConfig(slug);
  if (!config) notFound();

  const officialOnly = official !== "false";
  const [leaderboardResponse, versionsResponse] = await Promise.all([
    fetchLeaderboard(version, { officialOnly }),
    fetchBenchmarkVersions(),
  ]);

  const entries = calculateRanks(leaderboardResponse.leaderboard.map(transformLeaderboardEntry));
  const submissions = await fetchTransformedBestSubmissions(entries.slice(0, 60).map((entry) => entry.submission_id));
  const enrichedEntries = enrichEntriesWithSubmissions(entries, submissions);
  const rankedEntries = sortEntriesForBestFor(enrichedEntries, config.slug).slice(0, 10);
  const comparisonEntries = rankedEntries.slice(0, 5);
  const quickPicks = getQuickRecommendations(enrichedEntries);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link href={officialOnly ? "/" : "/?official=false"} className="text-sm text-muted-foreground hover:text-foreground">
              Back to leaderboard
            </Link>
            <VersionSelector versions={versionsResponse.versions} currentVersion={version ?? null} />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Best For</p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-5xl">{config.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">{config.description}</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <QuickPicks picks={quickPicks} />

        <section className="grid gap-4 md:grid-cols-3">
          {rankedEntries.slice(0, 3).map((entry, index) => {
            const categoryScore = config.category ? getCategoryScore(entry, config.category) : null;
            const metric = config.slug === "budget"
              ? `${entry.value_score?.toFixed(1) ?? "N/A"} value`
              : `${categoryScore?.scorePercentage.toFixed(1) ?? entry.percentage.toFixed(1)}%`;
            return (
              <Link
                key={entry.submission_id}
                href={`/model/${entry.provider.toLowerCase()}/${entry.model}${officialOnly ? "" : "?official=false"}`}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/60"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-2xl">{index === 0 ? "🦞" : index === 1 ? "🦀" : "🦐"}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">#{index + 1}</span>
                </div>
                <code className="block truncate text-lg font-bold text-foreground">{entry.model}</code>
                <p className="mt-1 text-sm text-muted-foreground">via {entry.provider}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <span className="text-2xl font-bold text-foreground">{metric}</span>
                  <span className="text-sm text-muted-foreground">{formatCost(entry.best_cost_usd)}</span>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xl font-bold text-foreground">What This Tests</h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">{config.taskSummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {BEST_FOR_CATEGORIES.map((item) => (
              <Link
                key={item.slug}
                href={`/best-for/${item.slug}`}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${item.slug === config.slug ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {item.navLabel}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">Top 5 Comparison</h2>
              <p className="text-sm text-muted-foreground">Side-by-side metrics for the strongest recommendations on this page.</p>
            </div>
            <Link
              href={`/?view=graphs&graph=radar&models=${encodeURIComponent(comparisonEntries.map((entry) => entry.model).slice(0, 3).join(","))}${officialOnly ? "" : "&official=false"}`}
              className="text-sm text-primary hover:underline"
            >
              Open comparison tool
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 text-left">Rank</th>
                  <th className="px-3 py-3 text-left">Model</th>
                  <th className="px-3 py-3 text-right">Overall</th>
                  <th className="px-3 py-3 text-right">Use-Case Score</th>
                  <th className="px-3 py-3 text-right">Cost</th>
                  <th className="px-3 py-3 text-right">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonEntries.map((entry, index) => {
                  const categoryScore = config.category ? getCategoryScore(entry, config.category) : null;
                  const useCaseScore = config.slug === "budget"
                    ? `${entry.value_score?.toFixed(1) ?? "N/A"} value`
                    : `${categoryScore?.scorePercentage.toFixed(1) ?? entry.percentage.toFixed(1)}%`;
                  return (
                    <tr key={entry.submission_id} className="hover:bg-muted/20">
                      <td className="px-3 py-3 text-muted-foreground">#{index + 1}</td>
                      <td className="px-3 py-3">
                        <Link href={`/model/${entry.provider.toLowerCase()}/${entry.model}${officialOnly ? "" : "?official=false"}`} className="hover:text-primary">
                          <code className="font-semibold">{entry.model}</code>
                        </Link>
                        <div className="text-xs text-muted-foreground">{entry.provider}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">{entry.percentage.toFixed(1)}%</td>
                      <td className="px-3 py-3 text-right font-semibold">{useCaseScore}</td>
                      <td className="px-3 py-3 text-right">{formatCost(entry.best_cost_usd)}</td>
                      <td className="px-3 py-3 text-right">{formatDuration(entry.average_execution_time_seconds)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
