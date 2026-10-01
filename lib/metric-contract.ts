/**
 * Canonical ranking and URL semantics for the leaderboard.
 * Components should adopt these helpers instead of reimplementing defaults.
 */

export const COMPARISON_EPSILON = 1e-6;

export const SCORE_MODES = ["best", "average"] as const;
export type ScoreMode = (typeof SCORE_MODES)[number];
export const DEFAULT_SCORE_MODE: ScoreMode = "average";

export const LEADERBOARD_VIEWS = ["success", "speed", "cost", "value", "graphs"] as const;
export type LeaderboardView = (typeof LEADERBOARD_VIEWS)[number];
export type RankingView = Exclude<LeaderboardView, "graphs">;
export const DEFAULT_VIEW: LeaderboardView = "success";

export const GRAPH_TABS = ["scatter", "heatmap", "distribution", "radar"] as const;
export type GraphTab = (typeof GRAPH_TABS)[number];
export const DEFAULT_GRAPH_TAB: GraphTab = "scatter";

export const SORT_MODES = ["quality", "value"] as const;
export type SortMode = (typeof SORT_MODES)[number];
export const DEFAULT_SORT_MODE: SortMode = "quality";

export const RECOMMENDATION_MIN_SUBMISSIONS = 1;

export const METRIC_LABELS = {
  successAverage: "Average",
  successBest: "Best observed",
  speed: "Fastest observed",
  cost: "Cheapest observed",
  value: "Value Score",
} as const;

export const METRIC_CONTRACT = {
  defaultScoreMode: DEFAULT_SCORE_MODE,
  defaultView: DEFAULT_VIEW,
  defaultGraph: DEFAULT_GRAPH_TAB,
  defaultSort: DEFAULT_SORT_MODE,
  defaultOfficialOnly: true,
  officialParam: "official",
  omittedVersionMeansCurrent: true,
  speedRanksFastestObserved: true,
  costRanksCheapestObserved: true,
  valueUsesBestScoreAndBestCost: true,
  missingAverageDoesNotFallBackToBest: true,
  zeroCostHiddenByDefault: true,
  zeroCostIneligibleForValue: true,
  recommendationMinSubmissions: RECOMMENDATION_MIN_SUBMISSIONS,
} as const;

export interface MetricEntry {
  percentage: number;
  timestamp: string;
  model?: string;
  average_score_percentage?: number | null;
  best_execution_time_seconds?: number | null;
  average_execution_time_seconds?: number | null;
  best_cost_usd?: number | null;
  average_cost_usd?: number | null;
  submission_count?: number | null;
  weights?: "Open" | "Closed" | "Unknown" | null;
}

export interface RankingOptions {
  scoreMode?: ScoreMode;
  sortMode?: SortMode;
  includeZeroCost?: boolean;
}

export interface RankedEntry<T> {
  entry: T;
  rank: number;
  metric: number;
}

export type GraphAxis = "score" | "cost" | "speed";

const SCORE_MODE_SET = new Set<string>(SCORE_MODES);
const VIEW_SET = new Set<string>(LEADERBOARD_VIEWS);
const GRAPH_SET = new Set<string>(GRAPH_TABS);
const SORT_SET = new Set<string>(SORT_MODES);

export function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= COMPARISON_EPSILON;
}

export function parseScoreMode(value: string | null | undefined): ScoreMode {
  return value != null && SCORE_MODE_SET.has(value) ? (value as ScoreMode) : DEFAULT_SCORE_MODE;
}

export function serializeScoreMode(mode: ScoreMode): string | null {
  return mode === DEFAULT_SCORE_MODE ? null : mode;
}

export function scoreModeAppliesToGraph(tab: GraphTab): boolean {
  return tab === "scatter" || tab === "radar";
}

export function unsupportedGraphScoreModeNote(tab: GraphTab): string | null {
  if (scoreModeAppliesToGraph(tab)) return null;
  if (tab === "distribution") {
    return "Score Distribution shows every submission, so Best/Average does not change this chart.";
  }
  return "Task Heatmap shows one submission per model, so Best/Average does not change this chart.";
}

export function scoreModeBasisLabel(mode: ScoreMode): string {
  return mode === "best" ? METRIC_LABELS.successBest : METRIC_LABELS.successAverage;
}

export function buildScatterPoint(
  entry: MetricEntry,
  axis: "cost" | "speed",
  scoreMode: ScoreMode = DEFAULT_SCORE_MODE,
): { x: number; y: number } | null {
  const y = getScoreModeMetric(entry, "score", scoreMode);
  const x = getScoreModeMetric(entry, axis, scoreMode);
  if (y == null || x == null) return null;
  return { x, y };
}

export function parseLeaderboardView(value: string | null | undefined): LeaderboardView {
  return value != null && VIEW_SET.has(value) ? (value as LeaderboardView) : DEFAULT_VIEW;
}

export function serializeLeaderboardView(view: LeaderboardView): string | null {
  return view === DEFAULT_VIEW ? null : view;
}

export function parseGraphTab(value: string | null | undefined): GraphTab {
  return value != null && GRAPH_SET.has(value) ? (value as GraphTab) : DEFAULT_GRAPH_TAB;
}

export function serializeGraphTab(tab: GraphTab): string | null {
  return tab === DEFAULT_GRAPH_TAB ? null : tab;
}

export function parseSortMode(value: string | null | undefined): SortMode {
  return value != null && SORT_SET.has(value) ? (value as SortMode) : DEFAULT_SORT_MODE;
}

export function serializeSortMode(mode: SortMode): string | null {
  return mode === DEFAULT_SORT_MODE ? null : mode;
}

export function parseOfficialOnly(value: string | null | undefined): boolean {
  return value !== "false";
}

export function serializeOfficialOnly(officialOnly: boolean): string | null {
  return officialOnly ? null : "false";
}

export function parseVersionParam(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function canonicalizeLeaderboardSearchParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);

  const score = serializeScoreMode(parseScoreMode(next.get("score")));
  if (score == null) next.delete("score");
  else next.set("score", score);

  const view = serializeLeaderboardView(parseLeaderboardView(next.get("view")));
  if (view == null) next.delete("view");
  else next.set("view", view);

  const graph = serializeGraphTab(parseGraphTab(next.get("graph")));
  if (graph == null) next.delete("graph");
  else next.set("graph", graph);

  const sort = serializeSortMode(parseSortMode(next.get("sort")));
  if (sort == null) next.delete("sort");
  else next.set("sort", sort);

  const official = serializeOfficialOnly(parseOfficialOnly(next.get("official")));
  if (official == null) next.delete("official");
  else next.set("official", official);

  const version = parseVersionParam(next.get("version"));
  if (version == null) next.delete("version");
  else next.set("version", version);

  if (next.get("weights") !== "open") next.delete("weights");
  if (next.get("slm") !== "true") next.delete("slm");
  if (next.get("zerocost") !== "true") next.delete("zerocost");

  return next;
}

export function getSuccessPercent(entry: MetricEntry, scoreMode: ScoreMode = DEFAULT_SCORE_MODE): number | null {
  if (scoreMode === "average") {
    if (entry.average_score_percentage == null || !Number.isFinite(entry.average_score_percentage)) {
      return null;
    }
    return entry.average_score_percentage * 100;
  }

  return Number.isFinite(entry.percentage) ? entry.percentage : null;
}

export function calculateLeaderboardValueScore(
  bestSuccessPercent: number | null | undefined,
  bestCostUsd: number | null | undefined,
): number | null {
  if (bestSuccessPercent == null || bestCostUsd == null) return null;
  if (!Number.isFinite(bestSuccessPercent) || !Number.isFinite(bestCostUsd)) return null;
  if (bestCostUsd <= COMPARISON_EPSILON) return null;
  return bestSuccessPercent / bestCostUsd;
}

export function getValueScore(entry: MetricEntry): number | null {
  return calculateLeaderboardValueScore(entry.percentage, entry.best_cost_usd);
}

export function getScoreModeMetric(
  entry: MetricEntry,
  axis: GraphAxis,
  scoreMode: ScoreMode = DEFAULT_SCORE_MODE,
): number | null {
  if (axis === "score") return getSuccessPercent(entry, scoreMode);

  if (axis === "cost") {
    const cost = scoreMode === "best" ? entry.best_cost_usd : entry.average_cost_usd;
    if (cost == null || !Number.isFinite(cost) || cost <= COMPARISON_EPSILON) return null;
    return cost;
  }

  const time = scoreMode === "best" ? entry.best_execution_time_seconds : entry.average_execution_time_seconds;
  if (time == null || !Number.isFinite(time) || time < 0) return null;
  return time;
}

export function meetsRecommendationSampleSize(entry: MetricEntry): boolean {
  if (entry.submission_count == null) return true;
  return entry.submission_count >= RECOMMENDATION_MIN_SUBMISSIONS;
}

export function isEligibleForAverageClaim(entry: MetricEntry): boolean {
  return meetsRecommendationSampleSize(entry) && getSuccessPercent(entry, "average") != null;
}

export function isEligibleForFastestClaim(entry: MetricEntry): boolean {
  return meetsRecommendationSampleSize(entry) && isRankingEligible(entry, "speed");
}

export function isEligibleForCheapestClaim(entry: MetricEntry): boolean {
  return meetsRecommendationSampleSize(entry) && isRankingEligible(entry, "cost");
}

export function isEligibleForValueClaim(entry: MetricEntry): boolean {
  return meetsRecommendationSampleSize(entry) && isRankingEligible(entry, "value");
}

export function isRankingEligible(
  entry: MetricEntry,
  view: RankingView,
  scoreMode: ScoreMode = DEFAULT_SCORE_MODE,
  options: Pick<RankingOptions, "includeZeroCost"> = {},
): boolean {
  if (view === "success") return getSuccessPercent(entry, scoreMode) != null;
  if (view === "speed") {
    const time = entry.best_execution_time_seconds;
    return time != null && Number.isFinite(time) && time >= 0;
  }
  if (view === "cost") {
    const cost = entry.best_cost_usd;
    if (cost == null || !Number.isFinite(cost) || cost < 0) return false;
    return options.includeZeroCost === true ? true : cost > COMPARISON_EPSILON;
  }
  return getValueScore(entry) != null;
}

function timestampMs(timestamp: string): number {
  const ms = Date.parse(timestamp);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

function primaryMetric(
  entry: MetricEntry,
  view: RankingView,
  scoreMode: ScoreMode,
): number | null {
  if (view === "success") return getSuccessPercent(entry, scoreMode);
  if (view === "speed") return entry.best_execution_time_seconds ?? null;
  if (view === "cost") return entry.best_cost_usd ?? null;
  return getValueScore(entry);
}

function effectiveRankingView(view: RankingView, sortMode: SortMode): RankingView {
  return view === "success" && sortMode === "value" ? "value" : view;
}

function compareEntries(a: MetricEntry, b: MetricEntry, view: RankingView, scoreMode: ScoreMode): number {
  const aMetric = primaryMetric(a, view, scoreMode);
  const bMetric = primaryMetric(b, view, scoreMode);
  if (aMetric == null || bMetric == null) return 0;

  const primary = view === "speed" || view === "cost"
    ? (nearlyEqual(aMetric, bMetric) ? 0 : aMetric - bMetric)
    : (nearlyEqual(aMetric, bMetric) ? 0 : bMetric - aMetric);
  if (primary !== 0) return primary;

  const aScore = getSuccessPercent(a, scoreMode);
  const bScore = getSuccessPercent(b, scoreMode);
  if (aScore != null && bScore != null && !nearlyEqual(aScore, bScore)) return bScore - aScore;

  const timeDelta = timestampMs(b.timestamp) - timestampMs(a.timestamp);
  if (timeDelta !== 0) return timeDelta;

  return (a.model ?? "").localeCompare(b.model ?? "");
}

export function rankEntries<T extends MetricEntry>(
  entries: readonly T[],
  view: RankingView,
  options: RankingOptions = {},
): RankedEntry<T>[] {
  const scoreMode = options.scoreMode ?? DEFAULT_SCORE_MODE;
  const sortMode = options.sortMode ?? DEFAULT_SORT_MODE;
  const rankingView = effectiveRankingView(view, sortMode);
  const eligible = entries.filter((entry) => isRankingEligible(entry, rankingView, scoreMode, options));
  const sorted = [...eligible].sort((a, b) => compareEntries(a, b, rankingView, scoreMode));

  let lastRank = 0;
  let lastMetric = Number.NaN;

  return sorted.map((entry, index) => {
    const metric = primaryMetric(entry, rankingView, scoreMode);
    if (metric == null) {
      throw new Error("Eligible leaderboard entry is missing its ranking metric");
    }
    if (lastRank === 0 || !nearlyEqual(metric, lastMetric)) {
      lastRank = index + 1;
      lastMetric = metric;
    }
    return { entry, rank: lastRank, metric };
  });
}
