import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  DollarSign,
  Activity,
  ExternalLink,
  Trophy,
} from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { TryKiloClawButton } from "@/components/try-kiloclaw-button";
import { CategoryBreakdownChart } from "@/components/category-breakdown-chart";
import { TaskResultsGrouped } from "@/components/task-results-grouped";
import { SimilarModels } from "@/components/similar-models";
import { ModelScoreTrend } from "@/components/model-score-trend";
import { PROVIDER_COLORS } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import {
  fetchLeaderboard,
  fetchSubmission,
  fetchModelSubmissions,
} from "@/lib/api";
import {
  transformLeaderboardEntry,
  calculateRanks,
  transformSubmission,
  normalizeProvider,
} from "@/lib/transforms";

interface ModelPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ official?: string }>;
}

export async function generateMetadata({
  params,
}: ModelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const modelName =
    slug.length >= 2
      ? `${slug[slug.length - 2]}/${slug[slug.length - 1]}`
      : slug.join("/");
  return {
    title: `${modelName} — PinchBench Model Details`,
    description: `Detailed benchmark results for ${modelName} on PinchBench — per-category breakdown, task-level scores, and comparison with similar models.`,
  };
}

export default async function ModelPage({
  params,
  searchParams,
}: ModelPageProps) {
  const { slug } = await params;
  const { official } = await searchParams;
  const officialOnly = official !== "false";

  if (slug.length < 2) {
    notFound();
  }

  // Support URL patterns:
  //   /model/anthropic/claude-opus-4.6 -> slug = ["anthropic", "claude-opus-4.6"]
  //   /model/anthropic/anthropic/claude-opus-4.6 -> slug = ["anthropic", "anthropic", "claude-opus-4.6"]
  // Model names in the API always use "provider/model" format, so take the last two segments.
  const modelName = `${slug[slug.length - 2]}/${slug[slug.length - 1]}`;

  // Fetch leaderboard (for rank + similar models) and model submissions in parallel
  const [leaderboardResponse, modelSubmissionsData] = await Promise.all([
    fetchLeaderboard(undefined, { officialOnly }),
    fetchModelSubmissions(modelName, { officialOnly }).catch(() => null),
  ]);

  const allEntries = calculateRanks(
    leaderboardResponse.leaderboard.map(transformLeaderboardEntry)
  );

  const modelEntry = allEntries.find(
    (e) => e.model.toLowerCase() === modelName.toLowerCase()
  );

  if (!modelEntry) {
    notFound();
  }

  // Fetch the best submission for task-level detail
  let submission;
  try {
    const response = await fetchSubmission(modelEntry.submission_id);
    submission = transformSubmission(response.submission);
  } catch {
    submission = null;
  }

  const provider = normalizeProvider(
    modelEntry.provider ?? "",
    modelEntry.model
  );
  const providerColor = PROVIDER_COLORS[provider] || "#666";

  // Category stats from task results
  const categoryStats = submission
    ? submission.task_results.reduce(
        (acc, task) => {
          if (!acc[task.category]) {
            acc[task.category] = { total: 0, max: 0, count: 0 };
          }
          acc[task.category].total += task.score;
          acc[task.category].max += task.max_score;
          acc[task.category].count += 1;
          return acc;
        },
        {} as Record<string, { total: number; max: number; count: number }>
      )
    : null;

  // Find similar models (+-3 positions in the leaderboard, including current for context)
  const modelIndex = allEntries.findIndex(
    (e) => e.model.toLowerCase() === modelName.toLowerCase()
  );
  const similarModels = allEntries.filter((_e, i) => {
    return Math.abs(i - modelIndex) <= 3;
  });

  // Submission history for score trend
  const submissions = modelSubmissionsData?.submissions ?? [];
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const trendData = [...submissions]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .map((s) => ({
      timestamp: s.timestamp,
      score: s.score_percentage * 100,
    }));

  const officialParam = officialOnly ? "" : "?official=false";
  const compareUrl = `/?view=graphs&graph=radar&models=${encodeURIComponent(modelName)}${officialOnly ? "" : "&official=false"}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link
            href={officialOnly ? "/" : "/?official=false"}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block"
          >
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leaderboard
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <code className="text-3xl font-mono font-bold text-foreground">
                  {modelEntry.model}
                </code>
                <Badge
                  variant="outline"
                  className="text-sm"
                  style={{
                    borderColor: providerColor,
                    color: providerColor,
                    backgroundColor: `${providerColor}10`,
                  }}
                >
                  {provider}
                </Badge>
                {modelEntry.weights && (
                  <Badge
                    variant="outline"
                    className={`text-sm ${
                      modelEntry.weights === "Open"
                        ? "border-green-500 text-green-500"
                        : "border-muted-foreground text-muted-foreground"
                    }`}
                  >
                    {modelEntry.weights === "Open"
                      ? "🔓 Open"
                      : "🔒 Closed"}
                  </Badge>
                )}
                {modelEntry.hf_link && (
                  <a
                    href={modelEntry.hf_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge
                      variant="outline"
                      className="text-sm border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 cursor-pointer"
                    >
                      🤗 HuggingFace
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Badge>
                  </a>
                )}
              </div>
              <p className="text-muted-foreground">
                Rank #{modelEntry.rank} of {allEntries.length} models
                {" \u00B7 "}Last submitted{" "}
                {formatDistanceToNow(new Date(modelEntry.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TryKiloClawButton model={modelEntry.model} />
              <Link href={compareUrl}>
                <Button variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Compare
                </Button>
              </Link>
              <ShareButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xs uppercase tracking-wider">Rank</span>
            </div>
            <span className="text-3xl font-bold">#{modelEntry.rank}</span>
            <p className="text-xs text-muted-foreground mt-1">
              of {allEntries.length} models
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider">
                Best Score
              </span>
            </div>
            <span
              className={`text-3xl font-bold ${
                modelEntry.percentage >= 85
                  ? "text-green-500"
                  : modelEntry.percentage >= 70
                    ? "text-yellow-500"
                    : "text-red-500"
              }`}
            >
              {modelEntry.percentage.toFixed(1)}%
            </span>
            {modelEntry.average_score_percentage != null && (
              <p className="text-xs text-muted-foreground mt-1">
                avg{" "}
                {(modelEntry.average_score_percentage * 100).toFixed(1)}%
              </p>
            )}
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs uppercase tracking-wider">Speed</span>
            </div>
            <span className="text-3xl font-bold">
              {modelEntry.best_execution_time_seconds != null
                ? `${Math.round(modelEntry.best_execution_time_seconds / 60)}m`
                : "\u2014"}
            </span>
            {modelEntry.average_execution_time_seconds != null && (
              <p className="text-xs text-muted-foreground mt-1">
                avg{" "}
                {Math.round(modelEntry.average_execution_time_seconds / 60)}m
              </p>
            )}
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs uppercase tracking-wider">Cost</span>
            </div>
            <span className="text-3xl font-bold">
              {modelEntry.best_cost_usd != null &&
              modelEntry.best_cost_usd > 0
                ? `$${modelEntry.best_cost_usd.toFixed(2)}`
                : "\u2014"}
            </span>
            {modelEntry.average_cost_usd != null &&
              modelEntry.average_cost_usd > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  avg ${modelEntry.average_cost_usd.toFixed(2)}
                </p>
              )}
          </Card>
        </div>

        {/* Category Breakdown */}
        {categoryStats && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Category Breakdown
            </h2>
            <CategoryBreakdownChart categoryStats={categoryStats} />
          </section>
        )}

        {/* Task-Level Results */}
        {submission && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Task Results
              </h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {
                    submission.task_results.filter(
                      (t) => t.score / t.max_score >= 0.5
                    ).length
                  }
                  /{submission.task_results.length} passed
                </span>
                <span>{"\u00B7"}</span>
                <span>
                  {submission.total_score.toFixed(1)}/{submission.max_score}{" "}
                  pts
                </span>
                <Link
                  href={`/submission/${modelEntry.submission_id}${officialParam}`}
                  className="text-primary hover:underline hidden sm:inline"
                >
                  Full details {"\u2192"}
                </Link>
              </div>
            </div>
            <TaskResultsGrouped tasks={submission.task_results} />
          </section>
        )}

        {/* Score Trend */}
        {trendData.length > 1 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Score Trend Over Time
            </h3>
            <ModelScoreTrend data={trendData} />
          </Card>
        )}

        {/* Submission History */}
        {sortedSubmissions.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-4">
              Submission History
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({sortedSubmissions.length} run
                {sortedSubmissions.length !== 1 ? "s" : ""})
              </span>
            </h3>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedSubmissions.map((s) => {
                    const pct = s.score_percentage * 100;
                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {s.is_best && (
                              <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            )}
                            {formatDistanceToNow(new Date(s.timestamp), {
                              addSuffix: true,
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-medium ${
                              pct >= 85
                                ? "text-green-500"
                                : pct >= 70
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            }`}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/submission/${s.id}${officialParam}`}
                          >
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Similar Models */}
        {similarModels.length > 1 && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Similar Models
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Models ranked nearby on the leaderboard
            </p>
            <SimilarModels
              models={similarModels}
              currentModel={modelEntry}
              officialOnly={officialOnly}
            />
          </section>
        )}
      </main>
    </div>
  );
}
