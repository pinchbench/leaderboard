import type { LeaderboardEntry, TaskResult } from "@/lib/types";
import { TASK_CATEGORY_BY_ID } from "@/lib/types";

export interface CategoryScore {
  category: string;
  label: string;
  shortLabel: string;
  icon: string;
  total: number;
  max: number;
  count: number;
  percentage: number;
}

export interface CategoryFilteredScore {
  total: number;
  max: number;
  count: number;
  percentage: number | null;
}

export function normalizeCategoryId(category: string): string {
  return category.trim().toLowerCase();
}

export function getCategoryMeta(category: string) {
  const normalized = normalizeCategoryId(category);
  return TASK_CATEGORY_BY_ID[normalized] ?? {
    id: normalized,
    label: normalized.replace(/_/g, " "),
    shortLabel: normalized.replace(/_/g, " "),
    icon: "📌",
    description: "Benchmark tasks in this category",
  };
}

export function aggregateCategoryScores(tasks: TaskResult[]): CategoryScore[] {
  const scores = tasks.reduce(
    (acc, task) => {
      const category = normalizeCategoryId(task.category || "other");
      if (!acc[category]) {
        acc[category] = { total: 0, max: 0, count: 0 };
      }
      acc[category].total += task.score;
      acc[category].max += task.max_score;
      acc[category].count += 1;
      return acc;
    },
    {} as Record<string, { total: number; max: number; count: number }>,
  );

  return Object.entries(scores)
    .map(([category, score]) => {
      const meta = getCategoryMeta(category);
      return {
        category,
        label: meta.label,
        shortLabel: meta.shortLabel,
        icon: meta.icon,
        total: score.total,
        max: score.max,
        count: score.count,
        percentage: score.max > 0 ? (score.total / score.max) * 100 : 0,
      };
    })
    .sort((a, b) => b.percentage - a.percentage || a.label.localeCompare(b.label));
}

export function calculateCategoryFilteredScore(
  tasks: TaskResult[],
  selectedCategories: string[],
): CategoryFilteredScore {
  const categorySet = new Set(selectedCategories.map(normalizeCategoryId));
  let total = 0;
  let max = 0;
  let count = 0;

  for (const task of tasks) {
    if (!categorySet.has(normalizeCategoryId(task.category || "other"))) continue;
    total += task.score;
    max += task.max_score;
    count += 1;
  }

  return {
    total,
    max,
    count,
    percentage: max > 0 ? (total / max) * 100 : null,
  };
}

export function calculateRanksByPercentage(
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  let lastRank = 0;
  let lastPercentage = Number.NaN;

  return entries.map((entry, index) => {
    if (
      lastRank > 0 &&
      Math.abs(entry.percentage - lastPercentage) <= 1e-6
    ) {
      return { ...entry, rank: lastRank };
    }
    lastRank = index + 1;
    lastPercentage = entry.percentage;
    return { ...entry, rank: lastRank };
  });
}
