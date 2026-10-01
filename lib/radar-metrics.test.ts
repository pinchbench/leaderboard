import { describe, expect, test } from "bun:test";
import { buildRadarMetrics } from "./radar-metrics";

describe("buildRadarMetrics", () => {
  const entries = [
    {
      model: "complete",
      provider: "openai",
      percentage: 90,
      timestamp: "2026-01-01T00:00:00Z",
      average_score_percentage: 0.8,
      best_cost_usd: 0.2,
      average_cost_usd: 0.4,
      best_execution_time_seconds: 10,
      average_execution_time_seconds: 20,
    },
    {
      model: "missing-average",
      provider: "anthropic",
      percentage: 95,
      timestamp: "2026-01-02T00:00:00Z",
      average_score_percentage: null,
      best_cost_usd: 0.5,
      average_cost_usd: null,
      best_execution_time_seconds: 30,
      average_execution_time_seconds: null,
    },
  ];

  test("uses the selected basis and leaves missing metrics unavailable", () => {
    const average = buildRadarMetrics(entries, "average");
    const missing = average.find((metric) => metric.model === "missing-average");
    const complete = average.find((metric) => metric.model === "complete");

    expect(complete?.score).toBe(80);
    expect(complete?.cost).toBe(0.4);
    expect(complete?.speed).toBe(20);
    expect(complete?.costEfficiency).not.toBeNull();
    expect(missing?.score).toBeNull();
    expect(missing?.cost).toBeNull();
    expect(missing?.speed).toBeNull();
    expect(missing?.costEfficiency).toBeNull();
    expect(missing?.speedEfficiency).toBeNull();
    expect(missing?.consistency).toBeNull();
  });

  test("best mode does not borrow average cost or time", () => {
    const best = buildRadarMetrics(entries, "best");
    const missing = best.find((metric) => metric.model === "missing-average");

    expect(missing?.score).toBe(95);
    expect(missing?.cost).toBe(0.5);
    expect(missing?.speed).toBe(30);
    expect(missing?.costEfficiency).not.toBe(50);
  });
});
