import { describe, expect, test } from "bun:test";
import { transformLeaderboardEntry } from "./transforms";
import type { ApiLeaderboardEntry } from "./types";

function apiEntry(model: string, weights: ApiLeaderboardEntry["weights"]): ApiLeaderboardEntry {
  return {
    model,
    provider: "openrouter",
    best_score_percentage: 0.8,
    latest_submission: "2026-09-01T00:00:00Z",
    best_submission_id: `${model}-sub`,
    weights,
    hf_link: null,
    average_execution_time_seconds: 900,
    best_execution_time_seconds: 800,
    average_cost_usd: 1.2,
    best_cost_usd: 1,
    submission_count: 3,
    average_score_percentage: 0.75,
    official: true,
  };
}

describe("SLM tagging", () => {
  test.each([
    "nvidia/nemotron-3.5-lightning-30b-a3b",
    "openai/gpt-oss-20b",
    "meta-llama/llama-3.1-70b-instruct",
    "meta-llama/llama-4-scout",
    "openai/gpt-oss-120b",
    "nvidia/nemotron-3-super-120b-a12b",
    "mistralai/devstral-2512",
    "qwen/qwen-2.5-7b-instruct",
    "qwen/qwen3.5-27b",
    "qwen/qwen3.5-35b-a3b",
    "qwen/qwen3-coder-next",
    "z-ai/glm-4.5-air",
    "qwen/qwen3.5-122b-a10b",
  ])("tags open-weights model %s (125B total params or less) as an SLM", (model) => {
    expect(transformLeaderboardEntry(apiEntry(model, "Open")).slm).toBe(true);
  });

  test.each([
    "stepfun/step-3.5-flash",
    "minimax/minimax-m2.7",
    "nvidia/nemotron-3-ultra-550b-a55b",
    "mistralai/mistral-large-2512",
  ])("does not tag open-weights model %s (over 125B total params)", (model) => {
    expect(transformLeaderboardEntry(apiEntry(model, "Open")).slm).toBe(false);
  });

  test("does not tag open-weights models whose size is unknown", () => {
    expect(transformLeaderboardEntry(apiEntry("z-ai/glm-5-turbo", "Open")).slm).toBe(false);
  });

  test.each([
    ["google/gemma-4-26b-a4b-it", "Unknown"],
    ["google/gemma-4-31b-it", "Unknown"],
    ["mistralai/mistral-small-2603", "Unknown"],
    ["qwen/qwen3.5-9b", "Unknown"],
    ["meta-llama/llama-3.1-70b", "Unknown"],
    ["nvidia/nemotron-3-super-120b-a12b:free", "Unknown"],
    ["nvidia/nemotron-3-nano-30b-a3b", "Unknown"],
    ["z-ai/glm-4.7-flash", "Unknown"],
    ["google/gemma-4-26B-A4B-it", "Unknown"],
    ["google/gemma-4-31b-it", null],
  ] as const)("treats %s as an open-weights SLM when the API reports %p weights", (model, weights) => {
    const entry = transformLeaderboardEntry(apiEntry(model, weights));
    expect(entry.weights).toBe("Open");
    expect(entry.slm).toBe(true);
  });

  test("never overrides weights the API reports as Closed", () => {
    const entry = transformLeaderboardEntry(apiEntry("openai/gpt-oss-20b", "Closed"));
    expect(entry.weights).toBe("Closed");
    expect(entry.slm).toBe(false);
  });

  test("leaves models outside the open-weights list untouched", () => {
    const entry = transformLeaderboardEntry(apiEntry("custom/gemma-4-26b-agent-ebft", "Unknown"));
    expect(entry.weights).toBe("Unknown");
    expect(entry.slm).toBe(false);
  });
});
