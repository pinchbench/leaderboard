import {
  getScoreModeMetric,
  getSuccessPercent,
  type MetricEntry,
  type ScoreMode,
} from "./metric-contract";

export interface RadarModel extends MetricEntry {
  model: string;
  provider: string;
}

export interface RadarMetric {
  model: string;
  provider: string;
  score: number | null;
  cost: number | null;
  speed: number | null;
  costEfficiency: number | null;
  speedEfficiency: number | null;
  consistency: number | null;
}

function normalizeToPercent(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function buildRadarMetrics(
  entries: readonly RadarModel[],
  scoreMode: ScoreMode,
): RadarMetric[] {
  const costs: number[] = [];
  const speeds: number[] = [];

  for (const entry of entries) {
    const cost = getScoreModeMetric(entry, "cost", scoreMode);
    const speed = getScoreModeMetric(entry, "speed", scoreMode);
    if (cost != null) costs.push(cost);
    if (speed != null) speeds.push(speed);
  }

  const costMin = costs.length > 0 ? Math.min(...costs) : 0;
  const costMax = costs.length > 0 ? Math.max(...costs) : 0;
  const speedMin = speeds.length > 0 ? Math.min(...speeds) : 0;
  const speedMax = speeds.length > 0 ? Math.max(...speeds) : 0;

  return entries.map((entry) => {
    const score = getSuccessPercent(entry, scoreMode);
    const cost = getScoreModeMetric(entry, "cost", scoreMode);
    const speed = getScoreModeMetric(entry, "speed", scoreMode);
    const best = Number.isFinite(entry.percentage) ? entry.percentage : null;
    const average = entry.average_score_percentage != null && Number.isFinite(entry.average_score_percentage)
      ? entry.average_score_percentage * 100
      : null;
    const consistency = best != null && best > 0 && average != null
      ? Math.max(0, Math.min(100, (average / best) * 100))
      : null;

    return {
      model: entry.model,
      provider: entry.provider,
      score,
      cost,
      speed,
      costEfficiency: cost == null ? null : 100 - normalizeToPercent(cost, costMin, costMax),
      speedEfficiency: speed == null ? null : 100 - normalizeToPercent(speed, speedMin, speedMax),
      consistency,
    };
  });
}
