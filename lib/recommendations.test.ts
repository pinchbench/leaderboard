import { describe, expect, test } from "bun:test";
import {
  getAverageScorePercent,
  getBestForConfig,
  getQuickRecommendations,
  sortEntriesForBestFor,
} from "./recommendations";
import type { EnrichedLeaderboardEntry } from "./types";

function makeEntry(
  overrides: Partial<EnrichedLeaderboardEntry> & { model: string },
): EnrichedLeaderboardEntry {
  return {
    rank: 0,
    provider: "test",
    percentage: 0,
    timestamp: "2026-01-01T00:00:00Z",
    submission_id: `${overrides.model}-sub`,
    categoryScores: [],
    ...overrides,
  };
}

describe("getAverageScorePercent", () => {
  test("scales the 0-1 average to a 0-100 percentage", () => {
    expect(
      getAverageScorePercent(
        makeEntry({ model: "m", percentage: 90, average_score_percentage: 0.85 }),
      ),
    ).toBeCloseTo(85);
  });

  test("falls back to the best percentage when no average exists", () => {
    expect(
      getAverageScorePercent(
        makeEntry({ model: "m", percentage: 90, average_score_percentage: null }),
      ),
    ).toBe(90);
  });
});

describe("getQuickRecommendations", () => {
  test("Best Overall is chosen by average score, not max", () => {
    const a = makeEntry({ model: "A", percentage: 95, average_score_percentage: 0.8 });
    const b = makeEntry({ model: "B", percentage: 90, average_score_percentage: 0.88 });
    const overall = getQuickRecommendations([a, b]).find((p) => p.key === "overall");
    expect(overall?.entry.model).toBe("B");
    expect(overall?.metricValue).toBe("88.0%");
    expect(overall?.metricLabel).toBe("Average Score");
    expect(overall?.useAverageScore).toBe(true);
  });

  test("Best Open Weights picks the highest-average open-weight model", () => {
    const openLow = makeEntry({ model: "open-low", weights: "Open", percentage: 70, average_score_percentage: 0.6 });
    const openHigh = makeEntry({ model: "open-high", weights: "Open", percentage: 65, average_score_percentage: 0.68 });
    const closedTop = makeEntry({ model: "closed-top", weights: "Closed", percentage: 99, average_score_percentage: 0.95 });
    const ow = getQuickRecommendations([closedTop, openLow, openHigh]).find((p) => p.key === "open-weights");
    expect(ow?.entry.model).toBe("open-high");
    expect(ow?.icon).toBe("🔓");
    expect(ow?.metricLabel).toBe("Average Score");
    expect(ow?.metricValue).toBe("68.0%");
    expect(ow?.href).toBe("/?weights=open");
    expect(ow?.useAverageScore).toBe(true);
  });

  test("Best Open Weights card is omitted when no open-weight model exists", () => {
    const closed = makeEntry({ model: "c", weights: "Closed", percentage: 80, average_score_percentage: 0.75 });
    expect(
      getQuickRecommendations([closed]).find((p) => p.key === "open-weights"),
    ).toBeUndefined();
  });

  test("Best Open Weights is positioned immediately after Best Overall", () => {
    const open = makeEntry({ model: "open", weights: "Open", percentage: 60, average_score_percentage: 0.55 });
    const a = makeEntry({ model: "A", percentage: 95, average_score_percentage: 0.9 });
    const keys = getQuickRecommendations([a, open]).map((p) => p.key);
    expect(keys.indexOf("open-weights")).toBe(keys.indexOf("overall") + 1);
  });

  test("Best Budget still selects by best cost (selection unchanged)", () => {
    const x = makeEntry({ model: "X", average_score_percentage: 0.8, best_cost_usd: 0.1, average_cost_usd: 0.5 });
    const y = makeEntry({ model: "Y", average_score_percentage: 0.8, best_cost_usd: 0.2, average_cost_usd: 0.15 });
    const budget = getQuickRecommendations([x, y]).find((p) => p.key === "budget");
    expect(budget?.entry.model).toBe("X");
    expect(budget?.metricValue).toBe("$0.100");
    expect(budget?.useAverageScore).toBeUndefined();
  });
});

describe("sortEntriesForBestFor", () => {
  test("data-analysis ranks models by data_analysis category score", () => {
    const weakData = makeEntry({
      model: "weak-data",
      percentage: 90,
      categoryScores: [{ category: "data_analysis", scorePercentage: 40, taskCount: 4 }],
    });
    const strongData = makeEntry({
      model: "strong-data",
      percentage: 70,
      categoryScores: [{ category: "data_analysis", scorePercentage: 95, taskCount: 4 }],
    });
    const noData = makeEntry({
      model: "no-data",
      percentage: 99,
      categoryScores: [{ category: "code_devops", scorePercentage: 100, taskCount: 8 }],
    });

    const ranked = sortEntriesForBestFor([weakData, noData, strongData], "data-analysis");
    expect(ranked.map((entry) => entry.model)).toEqual(["strong-data", "weak-data"]);
  });

  test("coding ranks models by code_devops category score", () => {
    const ranked = sortEntriesForBestFor(
      [
        makeEntry({
          model: "coder",
          percentage: 60,
          categoryScores: [{ category: "code_devops", scorePercentage: 88, taskCount: 8 }],
        }),
        makeEntry({
          model: "analyst",
          percentage: 95,
          categoryScores: [{ category: "data_analysis", scorePercentage: 99, taskCount: 4 }],
        }),
      ],
      "coding",
    );
    expect(ranked.map((entry) => entry.model)).toEqual(["coder"]);
  });
});

describe("BEST_FOR_CATEGORIES", () => {
  test("maps landing-page slugs to current task category ids", () => {
    expect(getBestForConfig("data-analysis")?.category).toBe("data_analysis");
    expect(getBestForConfig("coding")?.category).toBe("code_devops");
  });
});
