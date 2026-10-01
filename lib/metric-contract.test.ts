import { describe, expect, test } from "bun:test";
import {
  DEFAULT_SCORE_MODE,
  METRIC_CONTRACT,
  METRIC_LABELS,
  buildScatterPoint,
  calculateLeaderboardValueScore,
  canonicalizeLeaderboardSearchParams,
  getScoreModeMetric,
  scoreModeAppliesToGraph,
  unsupportedGraphScoreModeNote,
  getSuccessPercent,
  isEligibleForAverageClaim,
  isEligibleForCheapestClaim,
  isEligibleForValueClaim,
  parseOfficialOnly,
  parseScoreMode,
  parseVersionParam,
  rankEntries,
  serializeScoreMode,
  type MetricEntry,
} from "./metric-contract";

function entry(overrides: Partial<MetricEntry> & Pick<MetricEntry, "percentage" | "timestamp">): MetricEntry {
  return {
    model: overrides.model ?? "model",
    ...overrides,
  };
}

describe("metric contract defaults", () => {
  test("uses average as the canonical omitted score mode", () => {
    expect(DEFAULT_SCORE_MODE).toBe("average");
    expect(METRIC_CONTRACT.defaultScoreMode).toBe("average");
    expect(parseScoreMode(null)).toBe("average");
    expect(parseScoreMode("nope")).toBe("average");
    expect(serializeScoreMode("average")).toBeNull();
    expect(serializeScoreMode("best")).toBe("best");
  });

  test("treats omitted official and version params as current official results", () => {
    expect(parseOfficialOnly(null)).toBe(true);
    expect(parseOfficialOnly("true")).toBe(true);
    expect(parseOfficialOnly("false")).toBe(false);
    expect(parseVersionParam(null)).toBeNull();
    expect(parseVersionParam("  ")).toBeNull();
    expect(parseVersionParam(" abc123 ")).toBe("abc123");
    expect(METRIC_CONTRACT.officialParam).toBe("official");
    expect(METRIC_CONTRACT.omittedVersionMeansCurrent).toBe(true);
  });

  test("removes default URL values and preserves meaningful filters", () => {
    const params = canonicalizeLeaderboardSearchParams(new URLSearchParams({
      score: "average",
      view: "success",
      graph: "scatter",
      sort: "quality",
      official: "true",
      version: " ",
      weights: "closed",
      zerocost: "false",
      provider: "anthropic,openai",
      verified: "false",
    }));

    expect(params.get("score")).toBeNull();
    expect(params.get("view")).toBeNull();
    expect(params.get("graph")).toBeNull();
    expect(params.get("sort")).toBeNull();
    expect(params.get("official")).toBeNull();
    expect(params.get("version")).toBeNull();
    expect(params.get("weights")).toBeNull();
    expect(params.get("zerocost")).toBeNull();
    expect(params.get("provider")).toBe("anthropic,openai");
    expect(params.get("verified")).toBe("false");
  });

  test("keeps non-default URL values", () => {
    const params = canonicalizeLeaderboardSearchParams(new URLSearchParams({
      score: "best",
      view: "cost",
      graph: "radar",
      sort: "value",
      official: "false",
      version: "abc123",
      weights: "open",
      slm: "true",
      zerocost: "true",
    }));

    expect(params.get("score")).toBe("best");
    expect(params.get("view")).toBe("cost");
    expect(params.get("graph")).toBe("radar");
    expect(params.get("sort")).toBe("value");
    expect(params.get("official")).toBe("false");
    expect(params.get("version")).toBe("abc123");
    expect(params.get("weights")).toBe("open");
    expect(params.get("slm")).toBe("true");
    expect(params.get("zerocost")).toBe("true");
  });
});

describe("success metrics", () => {
  test("does not present a best score as an average", () => {
    const missingAverage = entry({ percentage: 91, timestamp: "2026-01-01T00:00:00Z", average_score_percentage: null });

    expect(getSuccessPercent(missingAverage, "average")).toBeNull();
    expect(getSuccessPercent(missingAverage, "best")).toBe(91);
    expect(isEligibleForAverageClaim(missingAverage)).toBe(false);
    expect(METRIC_LABELS.successAverage).toBe("Average");
    expect(METRIC_LABELS.successBest).toBe("Best observed");
  });

  test("ranks average descending and shares ranks for ties", () => {
    const ranked = rankEntries([
      entry({ model: "low", percentage: 99, timestamp: "2026-01-03T00:00:00Z", average_score_percentage: 0.7 }),
      entry({ model: "tied-older", percentage: 80, timestamp: "2026-01-01T00:00:00Z", average_score_percentage: 0.9 }),
      entry({ model: "tied-newer", percentage: 70, timestamp: "2026-01-02T00:00:00Z", average_score_percentage: 0.9 }),
      entry({ model: "missing", percentage: 100, timestamp: "2026-01-04T00:00:00Z", average_score_percentage: null }),
    ], "success");

    expect(ranked.map((item) => [item.entry.model, item.rank, item.metric])).toEqual([
      ["tied-newer", 1, 90],
      ["tied-older", 1, 90],
      ["low", 3, 70],
    ]);
  });
});

describe("speed, cost, and value metrics", () => {
  test("ranks fastest observed time without using score mode", () => {
    const ranked = rankEntries([
      entry({ model: "slow", percentage: 99, timestamp: "2026-01-01T00:00:00Z", best_execution_time_seconds: 30, average_execution_time_seconds: 1 }),
      entry({ model: "fast", percentage: 50, timestamp: "2026-01-01T00:00:00Z", best_execution_time_seconds: 10, average_execution_time_seconds: 40 }),
      entry({ model: "missing", percentage: 100, timestamp: "2026-01-01T00:00:00Z", best_execution_time_seconds: null }),
    ], "speed", { scoreMode: "average" });

    expect(ranked.map((item) => item.entry.model)).toEqual(["fast", "slow"]);
    expect(METRIC_LABELS.speed).toBe("Fastest observed");
  });

  test("hides zero-cost rows unless explicitly included", () => {
    const entries = [
      entry({ model: "paid", percentage: 80, timestamp: "2026-01-01T00:00:00Z", best_cost_usd: 0.2 }),
      entry({ model: "free", percentage: 90, timestamp: "2026-01-02T00:00:00Z", best_cost_usd: 0 }),
      entry({ model: "missing", percentage: 70, timestamp: "2026-01-03T00:00:00Z", best_cost_usd: null }),
    ];

    expect(rankEntries(entries, "cost").map((item) => item.entry.model)).toEqual(["paid"]);
    expect(rankEntries(entries, "cost", { includeZeroCost: true }).map((item) => item.entry.model)).toEqual(["free", "paid"]);
    expect(isEligibleForCheapestClaim(entries[1])).toBe(false);
    expect(METRIC_LABELS.cost).toBe("Cheapest observed");
  });

  test("calculates value from best observed success and best observed cost", () => {
    expect(calculateLeaderboardValueScore(80, 0.4)).toBe(200);
    expect(calculateLeaderboardValueScore(80, 0)).toBeNull();
    expect(calculateLeaderboardValueScore(80, null)).toBeNull();

    const ranked = rankEntries([
      entry({ model: "efficient", percentage: 80, timestamp: "2026-01-01T00:00:00Z", best_cost_usd: 0.4, average_score_percentage: 0.1 }),
      entry({ model: "costly", percentage: 90, timestamp: "2026-01-02T00:00:00Z", best_cost_usd: 0.9, average_score_percentage: 0.99 }),
      entry({ model: "free", percentage: 100, timestamp: "2026-01-03T00:00:00Z", best_cost_usd: 0 }),
    ], "value", { scoreMode: "average" });

    expect(ranked.map((item) => [item.entry.model, item.metric])).toEqual([
      ["efficient", 200],
      ["costly", 100],
    ]);
    expect(isEligibleForValueClaim(ranked[0].entry)).toBe(true);
    expect(METRIC_CONTRACT.valueUsesBestScoreAndBestCost).toBe(true);
  });

  test("uses value ranking when the success table sort mode is value", () => {
    const ranked = rankEntries([
      entry({ model: "high-score", percentage: 95, timestamp: "2026-01-01T00:00:00Z", best_cost_usd: 2, average_score_percentage: 0.95 }),
      entry({ model: "high-value", percentage: 80, timestamp: "2026-01-01T00:00:00Z", best_cost_usd: 0.2, average_score_percentage: 0.5 }),
    ], "success", { sortMode: "value" });

    expect(ranked.map((item) => item.entry.model)).toEqual(["high-value", "high-score"]);
  });
});

describe("graph score mode", () => {
  test("applies Best/Average only to scatter and radar", () => {
    expect(scoreModeAppliesToGraph("scatter")).toBe(true);
    expect(scoreModeAppliesToGraph("radar")).toBe(true);
    expect(scoreModeAppliesToGraph("distribution")).toBe(false);
    expect(scoreModeAppliesToGraph("heatmap")).toBe(false);
    expect(unsupportedGraphScoreModeNote("distribution")).toContain("every submission");
    expect(unsupportedGraphScoreModeNote("heatmap")).toContain("one submission");
    expect(unsupportedGraphScoreModeNote("scatter")).toBeNull();
  });

  test("builds scatter points from the selected basis and drops missing values", () => {
    const sample = entry({
      percentage: 88,
      timestamp: "2026-01-01T00:00:00Z",
      average_score_percentage: 0.74,
      best_cost_usd: 0.25,
      average_cost_usd: 0.4,
      best_execution_time_seconds: 12,
      average_execution_time_seconds: null,
    });

    expect(buildScatterPoint(sample, "cost", "best")).toEqual({ x: 0.25, y: 88 });
    expect(buildScatterPoint(sample, "cost", "average")).toEqual({ x: 0.4, y: 74 });
    expect(buildScatterPoint(sample, "speed", "average")).toBeNull();
  });
});

describe("score-mode graph metrics", () => {
  test("returns the selected basis and leaves missing values unavailable", () => {
    const sample = entry({
      percentage: 88,
      timestamp: "2026-01-01T00:00:00Z",
      average_score_percentage: 0.74,
      best_cost_usd: 0.25,
      average_cost_usd: null,
      best_execution_time_seconds: 12,
      average_execution_time_seconds: 18,
    });

    expect(getScoreModeMetric(sample, "score", "average")).toBe(74);
    expect(getScoreModeMetric(sample, "score", "best")).toBe(88);
    expect(getScoreModeMetric(sample, "cost", "best")).toBe(0.25);
    expect(getScoreModeMetric(sample, "cost", "average")).toBeNull();
    expect(getScoreModeMetric(sample, "speed", "average")).toBe(18);
  });
});
