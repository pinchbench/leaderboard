/** Score thresholds used consistently across the app */
export const SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
} as const

/** Hex color for score display (used in charts/SVG/OG images) */
export function getScoreColorHex(pct: number): string {
  if (pct >= SCORE_THRESHOLDS.EXCELLENT) return '#22c55e'
  if (pct >= SCORE_THRESHOLDS.GOOD) return '#f59e0b'
  return '#ef4444'
}

/** Get Tailwind color class from raw score/maxScore (e.g. 0.85/1.0 → 85%) */
export function getScoreColorFromRaw(score: number, maxScore: number): string {
  if (maxScore <= 0) return getScoreColorClass(0)
  return getScoreColorClass((score / maxScore) * 100)
}

/** Tailwind CSS class for score text color */
export function getScoreColorClass(pct: number): string {
  if (pct >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-500'
  if (pct >= SCORE_THRESHOLDS.GOOD) return 'text-yellow-500'
  return 'text-red-500'
}

/** Tailwind CSS class for score background color (bg-* variant) */
export function getScoreBgClass(pct: number): string {
  if (pct >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-500'
  if (pct >= SCORE_THRESHOLDS.GOOD) return 'bg-yellow-500'
  return 'bg-red-500'
}

/** Determine score quality label */
export function getScoreLabel(pct: number): string {
  if (pct >= SCORE_THRESHOLDS.EXCELLENT) return 'Excellent'
  if (pct >= SCORE_THRESHOLDS.GOOD) return 'Good'
  return 'Needs Improvement'
}

/** Compute statistics for an array of numbers */
export interface StatsResult {
  min: number
  max: number
  avg: number
  median: number
  stddev: number
}

export function computeStats(values: number[]): StatsResult | null {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
  const stddev = Math.sqrt(variance)

  return { min, max, avg, median, stddev }
}
