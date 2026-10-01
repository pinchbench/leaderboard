import { describe, expect, test } from "bun:test";
import { parseTaskCountFromReleaseNotes } from "./benchmark-metadata";
import { selectOgEntries } from "./og-rankings";
import type { LeaderboardEntry } from "./types";

function entry(overrides: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    rank: 0,
    model: overrides.model ?? "model",
    provider: "openai",
    percentage: overrides.percentage ?? 80,
    timestamp: "2026-01-01T00:00:00Z",
    submission_id: overrides.model ?? "model",
    best_cost_usd: overrides.best_cost_usd,
    best_execution_time_seconds: overrides.best_execution_time_seconds,
    average_score_percentage: overrides.average_score_percentage,
    value_score: overrides.value_score,
    ...overrides,
  };
}

describe("shared ranking outputs", () => {
  test("does not invent a task count", () => {
    expect(parseTaskCountFromReleaseNotes("PinchBench 2.0 with 147 tasks")).toBe(147);
    expect(parseTaskCountFromReleaseNotes(null)).toBeNull();
    expect(parseTaskCountFromReleaseNotes("no count here")).toBeNull();
  });

  test("ranks value and hides zero-cost entries in shared images", () => {
    const entries = [
      entry({ model: "free", percentage: 99, best_cost_usd: 0, value_score: null }),
      entry({ model: "value", percentage: 80, best_cost_usd: 0.4, value_score: 200 }),
      entry({ model: "costly", percentage: 90, best_cost_usd: 1, value_score: 90 }),
    ];

    expect(selectOgEntries(entries, "value").entries.map((item) => item.model)).toEqual(["value", "costly"]);
    expect(selectOgEntries(entries, "cost").entries.map((item) => item.model)).toEqual(["value", "costly"]);
  });

  test("success images follow the selected score mode", () => {
    const entries = [
      entry({ model: "best-only", percentage: 99, average_score_percentage: 0.4 }),
      entry({ model: "steady", percentage: 70, average_score_percentage: 0.9 }),
    ];

    expect(selectOgEntries(entries, "success", null).entries[0]?.model).toBe("steady");
    expect(selectOgEntries(entries, "success", "best").entries[0]?.model).toBe("best-only");
  });
});
