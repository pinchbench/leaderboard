import type {
  ApiLeaderboardEntry,
  ApiSubmissionDetail,
  ApiTaskResult,
  LeaderboardEntry,
  Submission,
  TaskResult,
} from "@/lib/types";
import { TASK_FALLBACK } from "@/lib/task-metadata";

const EPSILON = 1e-6;

const normalizeProvider = (provider: string) => provider.toLowerCase();

/**
 * Estimate the number of successful tasks from a score percentage.
 * Uses best_score_percentage * max_score (from API) — but since max_score
 * is not in ApiLeaderboardEntry, we approximate using a standard task count of 40
 * (the current PinchBench task count). Falls back to null if score is unavailable.
 */
function estimateSuccessfulTasks(
  scorePercentage: number | null | undefined,
  taskCount = 40,
): number | null {
  if (scorePercentage == null) return null;
  return Math.max(1, Math.round(scorePercentage * taskCount));
}

export function transformLeaderboardEntry(
  apiEntry: ApiLeaderboardEntry,
): LeaderboardEntry {
  const scorePercentage = apiEntry.best_score_percentage; // 0-1 range
  const bestCost = apiEntry.best_cost_usd ?? null;

  // Value Score = score_percentage (0-100 scale) / cost_usd
  // Guard: cost must be > 0
  let value_score: number | null = null;
  if (bestCost != null && bestCost > EPSILON && scorePercentage != null) {
    value_score = (scorePercentage * 100) / bestCost;
  }

  // CPST = cost_usd / estimated_successful_tasks
  let cpst: number | null = null;
  const successfulTasks = estimateSuccessfulTasks(scorePercentage);
  if (bestCost != null && bestCost > EPSILON && successfulTasks != null && successfulTasks > 0) {
    cpst = bestCost / successfulTasks;
  }

  return {
    rank: 0,
    model: apiEntry.model,
    provider: normalizeProvider(apiEntry.provider),
    percentage: apiEntry.best_score_percentage * 100,
    timestamp: apiEntry.latest_submission,
    submission_id: apiEntry.best_submission_id,
    average_execution_time_seconds:
      apiEntry.average_execution_time_seconds ?? null,
    best_execution_time_seconds: apiEntry.best_execution_time_seconds ?? null,
    average_cost_usd: apiEntry.average_cost_usd ?? null,
    best_cost_usd: bestCost,
    submission_count: apiEntry.submission_count,
    average_score_percentage: apiEntry.average_score_percentage ?? null,
    value_score,
    cpst,
  };
}

export function calculateRanks(
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (Math.abs(b.percentage - a.percentage) > EPSILON) {
      return b.percentage - a.percentage;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return sorted.map((entry, index) => {
    if (
      index > 0 &&
      Math.abs(entry.percentage - sorted[index - 1].percentage) <= EPSILON
    ) {
      return { ...entry, rank: sorted[index - 1].rank };
    }
    return { ...entry, rank: index + 1 };
  });
}

export function transformTaskResult(apiTask: ApiTaskResult): TaskResult {
  const fallback = TASK_FALLBACK[apiTask.task_id];
  const taskName =
    apiTask.frontmatter?.name ?? fallback?.name ?? apiTask.task_id;
  const category =
    apiTask.frontmatter?.category ?? fallback?.category ?? "other";

  return {
    task_id: apiTask.task_id,
    task_name: taskName,
    category,
    score: apiTask.score,
    max_score: apiTask.max_score,
    breakdown: apiTask.breakdown ?? {},
    grading_type: apiTask.grading_type,
    timed_out: apiTask.timed_out,
    notes: apiTask.notes,
    execution_time_seconds: apiTask.execution_time_seconds ?? null,
  };
}

export function transformSubmission(
  apiSubmission: ApiSubmissionDetail,
): Submission {
  return {
    submission_id: apiSubmission.id,
    timestamp: apiSubmission.timestamp,
    openclaw_version: apiSubmission.openclaw_version ?? "unknown",
    model: apiSubmission.model,
    provider: normalizeProvider(apiSubmission.provider),
    task_results: apiSubmission.tasks.map(transformTaskResult),
    total_score: apiSubmission.total_score,
    max_score: apiSubmission.max_score,
    metadata: {
      run_timestamp: apiSubmission.metadata?.run_timestamp ?? 0,
      task_count:
        apiSubmission.metadata?.task_count ?? apiSubmission.tasks.length,
    },
    usage_summary: apiSubmission.usage_summary,
  };
}
