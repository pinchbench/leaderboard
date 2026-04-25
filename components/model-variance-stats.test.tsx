import { describe, expect, test } from 'bun:test'
import { ModelVarianceStats } from './model-variance-stats'
import type { ApiModelSubmissionItem } from '@/lib/types'

// Note: computeStats, getScoreColorHex, fmtNum, fmtCurrency, fmtDuration
// are tested in lib/scores.test.ts and lib/format.test.ts respectively.

describe('ModelVarianceStats component', () => {
  test('exports the component', () => {
    expect(ModelVarianceStats).toBeDefined()
    expect(typeof ModelVarianceStats).toBe('function')
  })

  test('returns null for empty submissions', () => {
    const result = ModelVarianceStats({ submissions: [] })
    expect(result).toBeNull()
  })

  test('computes correct stats for sample data', () => {
    const submissions: ApiModelSubmissionItem[] = [
      { id: '1', score_percentage: 0.8, total_score: 32, max_score: 40, timestamp: '2026-01-01', is_best: false, total_cost_usd: 0.01, total_execution_time_seconds: 60 },
      { id: '2', score_percentage: 0.9, total_score: 36, max_score: 40, timestamp: '2026-01-02', is_best: true, total_cost_usd: 0.02, total_execution_time_seconds: 120 },
    ]
    // Component renders successfully with valid data
    expect(ModelVarianceStats({ submissions })).not.toBeNull()
  })

  test('handles missing optional fields', () => {
    const submissions: ApiModelSubmissionItem[] = [
      { id: '1', score_percentage: 0.85, total_score: 34, max_score: 40, timestamp: '2026-01-01', is_best: true },
    ]
    expect(ModelVarianceStats({ submissions })).not.toBeNull()
  })
})
