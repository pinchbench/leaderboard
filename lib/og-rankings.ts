import { parseScoreMode, rankEntries, type ScoreMode } from "./metric-contract";
import type { LeaderboardEntry } from "./types";

export function selectOgEntries(
  entries: readonly LeaderboardEntry[],
  view: string | null,
  score: string | null = null,
  limit = 8,
): { title: string; entries: LeaderboardEntry[] } {
  const scoreMode: ScoreMode = parseScoreMode(score);
  if (view === "graphs") {
    return { title: "AI Agent Benchmark Results", entries: entries.slice(0, limit) };
  }
  if (view === "speed") {
    return {
      title: "Speed Leaderboard",
      entries: rankEntries(entries, "speed", { scoreMode }).slice(0, limit).map((item) => item.entry),
    };
  }
  if (view === "cost") {
    return {
      title: "Cost Leaderboard",
      entries: rankEntries(entries, "cost", { includeZeroCost: false }).slice(0, limit).map((item) => item.entry),
    };
  }
  if (view === "value") {
    return {
      title: "Value Score Leaderboard",
      entries: rankEntries(entries, "value").slice(0, limit).map((item) => item.entry),
    };
  }
  return {
    title: "Success Rate Leaderboard",
    entries: rankEntries(entries, "success", { scoreMode }).slice(0, limit).map((item) => item.entry),
  };
}
