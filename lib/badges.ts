import type { ApiSubmissionListItem } from "@/lib/types";
import { fetchSubmissions } from "@/lib/api";
import { normalizeProvider } from "@/lib/transforms";

const EPSILON = 1e-6;
const PAGE_SIZE = 1000;
const MAX_PAGES = 5;

export const BADGE_PERIODS = {
  "1d": { label: "Daily", shortLabel: "1D" },
  "7d": { label: "Weekly", shortLabel: "7D" },
  "30d": { label: "Monthly", shortLabel: "30D" },
} as const;

export const PERIOD_ALIASES: Record<string, BadgePeriod> = {
  daily: "1d",
  weekly: "7d",
  monthly: "30d",
};

export const BADGE_METRICS = {
  success: { label: "Success", accent: "#22c55e" },
  speed: { label: "Speed", accent: "#38bdf8" },
  cost: { label: "Cost", accent: "#f59e0b" },
  value: { label: "Value", accent: "#a855f7" },
} as const;

export type BadgeMetric = keyof typeof BADGE_METRICS;
export type BadgePeriod = keyof typeof BADGE_PERIODS;

export function getPeriodStartMs(period: BadgePeriod, now: number): number {
  const date = new Date(now);
  if (period === "1d") {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  if (period === "7d") {
    const day = date.getUTCDay(); // 0 is Sunday
    const diff = day === 0 ? 6 : day - 1; // Monday as start of week
    return Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - diff,
    );
  }
  if (period === "30d") {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  }
  return now;
}

export interface BadgeLookupOptions {
  officialOnly?: boolean;
  version?: string;
  now?: number;
}

export interface BadgeCandidate {
  submissionId: string;
  model: string;
  provider: string;
  timestamp: string;
  timestampMs: number;
  scorePercentage: number;
  executionTimeSeconds: number;
  costUsd: number;
  valueScore: number | null;
}

export interface ModelBadgeStatus {
  metric: BadgeMetric;
  period: BadgePeriod;
  title: string;
  shortLabel: string;
  awarded: boolean;
  rank: number | null;
  displayValue: string;
  winnerModel: string | null;
  latestTimestamp: string | null;
  officialOnly: boolean;
  version: string | null;
  url: string;
}

function getTimestampMs(timestamp: string): number {
  const ms = new Date(timestamp).getTime();
  return Number.isFinite(ms) ? ms : Number.NaN;
}

export function calculateValueScore(
  scorePercentage: number,
  costUsd: number,
): number | null {
  if (!Number.isFinite(scorePercentage) || !Number.isFinite(costUsd) || costUsd <= EPSILON) {
    return null;
  }
  return (scorePercentage * 100) / costUsd;
}

function toCandidate(submission: ApiSubmissionListItem): BadgeCandidate {
  return {
    submissionId: submission.id,
    model: submission.model,
    provider: normalizeProvider(submission.provider, submission.model),
    timestamp: submission.timestamp,
    timestampMs: getTimestampMs(submission.timestamp),
    scorePercentage: submission.score_percentage,
    executionTimeSeconds: submission.total_execution_time_seconds,
    costUsd: submission.total_cost_usd,
    valueScore: calculateValueScore(
      submission.score_percentage,
      submission.total_cost_usd,
    ),
  };
}

function compareNumbers(a: number, b: number): number {
  if (Math.abs(a - b) <= EPSILON) return 0;
  return a - b;
}

export function compareBadgeCandidates(
  metric: BadgeMetric,
  a: BadgeCandidate,
  b: BadgeCandidate,
): number {
  if (metric === "success") {
    return (
      compareNumbers(b.scorePercentage, a.scorePercentage) ||
      compareNumbers(b.timestampMs, a.timestampMs)
    );
  }

  if (metric === "speed") {
    return (
      compareNumbers(a.executionTimeSeconds, b.executionTimeSeconds) ||
      compareNumbers(b.scorePercentage, a.scorePercentage) ||
      compareNumbers(b.timestampMs, a.timestampMs)
    );
  }

  if (metric === "cost") {
    return (
      compareNumbers(a.costUsd, b.costUsd) ||
      compareNumbers(b.scorePercentage, a.scorePercentage) ||
      compareNumbers(b.timestampMs, a.timestampMs)
    );
  }

  const aValue = a.valueScore ?? Number.NEGATIVE_INFINITY;
  const bValue = b.valueScore ?? Number.NEGATIVE_INFINITY;
  return (
    compareNumbers(bValue, aValue) ||
    compareNumbers(b.scorePercentage, a.scorePercentage) ||
    compareNumbers(b.timestampMs, a.timestampMs)
  );
}

function hasMetricValue(metric: BadgeMetric, candidate: BadgeCandidate): boolean {
  if (!Number.isFinite(candidate.timestampMs)) return false;
  if (metric === "value") return candidate.valueScore != null;
  return true;
}

export function rankModelsForMetric(
  submissions: ApiSubmissionListItem[],
  metric: BadgeMetric,
): BadgeCandidate[] {
  const bestByModel = new Map<string, BadgeCandidate>();

  for (const submission of submissions) {
    const candidate = toCandidate(submission);
    if (!hasMetricValue(metric, candidate)) continue;
    const current = bestByModel.get(candidate.model);
    if (!current || compareBadgeCandidates(metric, candidate, current) < 0) {
      bestByModel.set(candidate.model, candidate);
    }
  }

  return [...bestByModel.values()].sort((a, b) => compareBadgeCandidates(metric, a, b));
}

function formatBadgeValue(metric: BadgeMetric, candidate: BadgeCandidate | null): string {
  if (!candidate) return "N/A";
  if (metric === "success") return `${(candidate.scorePercentage * 100).toFixed(1)}%`;
  if (metric === "speed") return `${candidate.executionTimeSeconds.toFixed(1)}s`;
  if (metric === "cost") return `$${candidate.costUsd.toFixed(2)}`;
  return candidate.valueScore == null ? "N/A" : candidate.valueScore.toFixed(1);
}

export function isBadgeMetric(value: string): value is BadgeMetric {
  return value in BADGE_METRICS;
}

export function isBadgePeriod(value: string): value is BadgePeriod {
  return value in BADGE_PERIODS || value in PERIOD_ALIASES;
}

export function normalizePeriod(period: string): BadgePeriod {
  if (period in BADGE_PERIODS) return period as BadgePeriod;
  return PERIOD_ALIASES[period.toLowerCase()] || "30d";
}

export function buildBadgeUrl(
  metric: BadgeMetric,
  period: BadgePeriod,
  options: { model: string; officialOnly?: boolean; version?: string | null },
): string {
  const params = new URLSearchParams({ model: options.model });
  if (options.officialOnly === false) params.set("official", "false");
  if (options.version) params.set("version", options.version);
  return `/api/badges/${metric}/${period}?${params.toString()}`;
}

export async function fetchRecentBadgeSubmissions(
  options: BadgeLookupOptions & { maxPeriod?: BadgePeriod },
): Promise<ApiSubmissionListItem[]> {
  const maxPeriod = options.maxPeriod ?? "30d";
  const now = options.now ?? Date.now();
  const cutoffMs = getPeriodStartMs(maxPeriod, now);
  const results: ApiSubmissionListItem[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetchSubmissions(
      options.version,
      PAGE_SIZE,
      page * PAGE_SIZE,
      { officialOnly: options.officialOnly ?? true },
    );

    if (response.submissions.length === 0) break;

    let allOlderThanWindow = true;
    for (const submission of response.submissions) {
      const timestampMs = getTimestampMs(submission.timestamp);
      if (!Number.isFinite(timestampMs)) continue;
      if (timestampMs >= cutoffMs) {
        results.push(submission);
        allOlderThanWindow = false;
      }
    }

    if (!response.has_more || allOlderThanWindow) break;
  }

  return results;
}

export function computeModelBadgeStatuses(
  submissions: ApiSubmissionListItem[],
  model: string,
  options: BadgeLookupOptions & { periods?: BadgePeriod[] } = {},
): ModelBadgeStatus[] {
  const now = options.now ?? Date.now();
  const officialOnly = options.officialOnly ?? true;
  const periods = options.periods ?? (Object.keys(BADGE_PERIODS) as BadgePeriod[]);
  const metrics = Object.keys(BADGE_METRICS) as BadgeMetric[];

  return periods.flatMap((period) => {
    const windowStart = getPeriodStartMs(period, now);
    const periodSubmissions = submissions.filter((submission) => {
      const timestampMs = getTimestampMs(submission.timestamp);
      return Number.isFinite(timestampMs) && timestampMs >= windowStart;
    });

    return metrics.map((metric) => {
      const rankings = rankModelsForMetric(periodSubmissions, metric);
      const winner = rankings[0] ?? null;
      const rank = rankings.findIndex((candidate) => candidate.model === model);
      const current = rank >= 0 ? rankings[rank] : null;
      return {
        metric,
        period,
        title: `${BADGE_PERIODS[period].label} ${BADGE_METRICS[metric].label} Winner`,
        shortLabel: `${BADGE_PERIODS[period].shortLabel} ${BADGE_METRICS[metric].label}`,
        awarded: rank === 0 && winner != null,
        rank: rank >= 0 ? rank + 1 : null,
        displayValue: formatBadgeValue(metric, current),
        winnerModel: winner?.model ?? null,
        latestTimestamp: current?.timestamp ?? null,
        officialOnly,
        version: options.version ?? null,
        url: buildBadgeUrl(metric, period, {
          model,
          officialOnly,
          version: options.version ?? null,
        }),
      } satisfies ModelBadgeStatus;
    });
  });
}

export async function getModelBadgeStatuses(
  model: string,
  options: BadgeLookupOptions = {},
): Promise<ModelBadgeStatus[]> {
  const submissions = await fetchRecentBadgeSubmissions({
    ...options,
    maxPeriod: "30d",
  });
  return computeModelBadgeStatuses(submissions, model, options);
}

export async function getModelBadgeStatus(
  model: string,
  metric: BadgeMetric,
  period: BadgePeriod,
  options: BadgeLookupOptions = {},
): Promise<ModelBadgeStatus> {
  const submissions = await fetchRecentBadgeSubmissions({
    ...options,
    maxPeriod: period,
  });
  const statuses = computeModelBadgeStatuses(submissions, model, {
    ...options,
    periods: [period],
  });
  return statuses.find((status) => status.metric === metric && status.period === period) ?? {
    metric,
    period,
    title: `${BADGE_PERIODS[period].label} ${BADGE_METRICS[metric].label} Winner`,
    shortLabel: `${BADGE_PERIODS[period].shortLabel} ${BADGE_METRICS[metric].label}`,
    awarded: false,
    rank: null,
    displayValue: "N/A",
    winnerModel: null,
    latestTimestamp: null,
    officialOnly: options.officialOnly ?? true,
    version: options.version ?? null,
    url: buildBadgeUrl(metric, period, {
      model,
      officialOnly: options.officialOnly ?? true,
      version: options.version ?? null,
    }),
  };
}