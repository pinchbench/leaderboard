import type {
  BestForBadge,
  CategoryScore,
  EnrichedLeaderboardEntry,
  LeaderboardEntry,
  RecommendationPick,
  Submission,
} from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/types";

export const BEST_FOR_CATEGORIES = [
  {
    slug: "coding",
    category: "coding",
    title: "Best AI Model for Coding in 2026",
    navLabel: "Coding",
    description:
      "Compare the leading AI coding agents on PinchBench tasks that require writing scripts, editing files, and completing developer workflows.",
    taskSummary:
      "Coding pages focus on benchmark tasks categorized as coding, including script generation and file operations. Scores come from the best verified submission for each model.",
  },
  {
    slug: "data-analysis",
    category: "api",
    title: "Best AI for Data Analysis",
    navLabel: "Data Analysis",
    description:
      "Find models that perform well on data-oriented research and API tasks where the agent must gather, transform, and present structured information.",
    taskSummary:
      "Data analysis uses API and data-retrieval tasks as the closest available PinchBench proxy for structured data work.",
  },
  {
    slug: "budget",
    category: null,
    title: "Best Cheap AI Models",
    navLabel: "Budget",
    description:
      "Rank models by useful benchmark quality at the lowest observed run cost, highlighting inexpensive and high-value OpenClaw agent options.",
    taskSummary:
      "Budget recommendations use Value Score, defined as success percentage divided by best observed cost per run. Models without usable cost data are excluded.",
  },
] as const;

export type BestForSlug = (typeof BEST_FOR_CATEGORIES)[number]["slug"];

export function getBestForConfig(slug: string) {
  return BEST_FOR_CATEGORIES.find((config) => config.slug === slug) ?? null;
}

export function formatCost(cost: number | null | undefined): string {
  if (cost == null) return "N/A";
  if (cost === 0) return "FREE";
  return `$${cost.toFixed(cost < 1 ? 3 : 2)}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "N/A";
  if (seconds >= 60) return `${(seconds / 60).toFixed(1)}m`;
  return `${seconds.toFixed(1)}s`;
}

export function getCategoryScores(submission: Submission): CategoryScore[] {
  const byCategory = new Map<string, { score: number; maxScore: number; taskCount: number }>();

  for (const task of submission.task_results) {
    const category = task.category || "other";
    const existing = byCategory.get(category) ?? { score: 0, maxScore: 0, taskCount: 0 };
    existing.score += task.score;
    existing.maxScore += task.max_score;
    existing.taskCount += 1;
    byCategory.set(category, existing);
  }

  return Array.from(byCategory.entries())
    .map(([category, totals]) => ({
      category,
      scorePercentage: totals.maxScore > 0 ? (totals.score / totals.maxScore) * 100 : 0,
      taskCount: totals.taskCount,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function enrichEntriesWithSubmissions(
  entries: LeaderboardEntry[],
  submissions: Submission[],
): EnrichedLeaderboardEntry[] {
  const scoresBySubmission = new Map(
    submissions.map((submission) => [submission.submission_id, getCategoryScores(submission)]),
  );

  return entries.map((entry) => ({
    ...entry,
    categoryScores: scoresBySubmission.get(entry.submission_id) ?? [],
  }));
}

export function getCategoryScore(
  entry: EnrichedLeaderboardEntry,
  category: string,
): CategoryScore | null {
  return entry.categoryScores.find((score) => score.category === category) ?? null;
}

export function sortEntriesForBestFor(
  entries: EnrichedLeaderboardEntry[],
  slug: BestForSlug,
): EnrichedLeaderboardEntry[] {
  const config = getBestForConfig(slug);
  if (!config) return entries;

  if (config.slug === "budget") {
    return [...entries]
      .filter((entry) => entry.best_cost_usd != null && entry.best_cost_usd > 0 && entry.value_score != null)
      .sort((a, b) => (b.value_score ?? -1) - (a.value_score ?? -1));
  }

  if (!config.category) return entries;

  return [...entries]
    .filter((entry) => getCategoryScore(entry, config.category!) != null)
    .sort((a, b) => {
      const aScore = getCategoryScore(a, config.category!)?.scorePercentage ?? -1;
      const bScore = getCategoryScore(b, config.category!)?.scorePercentage ?? -1;
      if (Math.abs(bScore - aScore) > 1e-9) return bScore - aScore;
      return b.percentage - a.percentage;
    });
}

export function getCategoryChampionBadges(entries: EnrichedLeaderboardEntry[]): Map<string, BestForBadge[]> {
  const badges = new Map<string, BestForBadge[]>();
  const categories = new Set<string>();

  for (const entry of entries) {
    for (const score of entry.categoryScores) {
      categories.add(score.category);
    }
  }

  for (const category of categories) {
    const champion = [...entries]
      .filter((entry) => getCategoryScore(entry, category) != null)
      .sort((a, b) => {
        const aScore = getCategoryScore(a, category)?.scorePercentage ?? -1;
        const bScore = getCategoryScore(b, category)?.scorePercentage ?? -1;
        if (Math.abs(bScore - aScore) > 1e-9) return bScore - aScore;
        return b.percentage - a.percentage;
      })[0];

    if (!champion) continue;

    const current = badges.get(champion.submission_id) ?? [];
    current.push({
      key: `category-${category}`,
      label: titleCase(category),
      icon: CATEGORY_ICONS[category] ?? "👑",
    });
    badges.set(champion.submission_id, current);
  }

  return badges;
}

export function getQuickRecommendations(entries: EnrichedLeaderboardEntry[]): RecommendationPick[] {
  const bestOverall = [...entries].sort((a, b) => b.percentage - a.percentage)[0];
  const fastest = [...entries]
    .filter((entry) => entry.best_execution_time_seconds != null)
    .sort((a, b) => (a.best_execution_time_seconds ?? Infinity) - (b.best_execution_time_seconds ?? Infinity))[0];
  const cheapest = [...entries]
    .filter((entry) => entry.best_cost_usd != null && entry.best_cost_usd > 0)
    .sort((a, b) => (a.best_cost_usd ?? Infinity) - (b.best_cost_usd ?? Infinity))[0];
  const bestValue = sortEntriesForBestFor(entries, "budget")[0];
  const bestCode = sortEntriesForBestFor(entries, "coding")[0];
  const bestData = sortEntriesForBestFor(entries, "data-analysis")[0];

  const picks: Array<RecommendationPick | null | undefined> = [
    bestOverall && {
      key: "overall",
      label: "Best Overall",
      shortLabel: "Overall",
      icon: "👑",
      description: "Highest verified success rate across the benchmark.",
      href: "/",
      entry: bestOverall,
      metricLabel: "Score",
      metricValue: `${bestOverall.percentage.toFixed(1)}%`,
    },
    fastest && {
      key: "speed",
      label: "Fastest",
      shortLabel: "Speed",
      icon: "⚡",
      description: "Lowest observed complete benchmark runtime.",
      href: "/?view=speed",
      entry: fastest,
      metricLabel: "Best Time",
      metricValue: formatDuration(fastest.best_execution_time_seconds),
    },
    cheapest && {
      key: "budget",
      label: "Best Budget",
      shortLabel: "Budget",
      icon: "💰",
      description: "Lowest observed non-zero benchmark run cost.",
      href: "/best-for/budget",
      entry: cheapest,
      metricLabel: "Best Cost",
      metricValue: formatCost(cheapest.best_cost_usd),
    },
    bestValue && {
      key: "value",
      label: "Best Value",
      shortLabel: "Value",
      icon: "💎",
      description: "Best success percentage per dollar.",
      href: "/?view=value",
      entry: bestValue,
      metricLabel: "Value Score",
      metricValue: bestValue.value_score?.toFixed(1) ?? "N/A",
    },
    bestCode && {
      key: "coding",
      label: "Best for Code",
      shortLabel: "Code",
      icon: "🔧",
      description: "Highest score on coding-category tasks.",
      href: "/best-for/coding",
      entry: bestCode,
      metricLabel: "Coding Score",
      metricValue: `${getCategoryScore(bestCode, "coding")?.scorePercentage.toFixed(1) ?? bestCode.percentage.toFixed(1)}%`,
    },
    bestData && {
      key: "data",
      label: "Best for Data",
      shortLabel: "Data",
      icon: "📊",
      description: "Highest score on data-oriented API tasks.",
      href: "/best-for/data-analysis",
      entry: bestData,
      metricLabel: "Data Score",
      metricValue: `${getCategoryScore(bestData, "api")?.scorePercentage.toFixed(1) ?? bestData.percentage.toFixed(1)}%`,
    },
  ];

  return picks.filter((pick): pick is RecommendationPick => Boolean(pick));
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
