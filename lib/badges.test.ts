import { describe, expect, test } from 'bun:test'
import {
  calculateValueScore,
  compareBadgeCandidates,
  computeModelBadgeStatuses,
  rankModelsForMetric,
} from './badges'
import type { ApiSubmissionListItem } from './types'

const baseTime = new Date('2026-03-28T12:00:00.000Z').getTime()

function submission(overrides: Partial<ApiSubmissionListItem>): ApiSubmissionListItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    model: overrides.model ?? 'openai/gpt-test',
    provider: overrides.provider ?? 'openai',
    score_percentage: overrides.score_percentage ?? 0.8,
    total_score: overrides.total_score ?? 32,
    max_score: overrides.max_score ?? 40,
    total_execution_time_seconds: overrides.total_execution_time_seconds ?? 100,
    total_cost_usd: overrides.total_cost_usd ?? 10,
    timestamp: overrides.timestamp ?? new Date(baseTime).toISOString(),
    created_at: overrides.created_at ?? new Date(baseTime).toISOString(),
    client_version: overrides.client_version ?? null,
    openclaw_version: overrides.openclaw_version ?? null,
    benchmark_version: overrides.benchmark_version ?? 'bench-123',
    claimed: overrides.claimed ?? 1,
    official: overrides.official ?? true,
  }
}

describe('badge helpers', () => {
  test('calculateValueScore guards against zero cost', () => {
    expect(calculateValueScore(0.9, 0)).toBeNull()
    expect(calculateValueScore(0.9, 5)).toBe(18)
  })

  test('rankModelsForMetric picks best run per model', () => {
    const ranked = rankModelsForMetric(
      [
        submission({ model: 'a', score_percentage: 0.85 }),
        submission({ model: 'a', score_percentage: 0.9 }),
        submission({ model: 'b', score_percentage: 0.88 }),
      ],
      'success',
    )

    expect(ranked).toHaveLength(2)
    expect(ranked[0]?.model).toBe('a')
    expect(ranked[0]?.scorePercentage).toBe(0.9)
  })

  test('compareBadgeCandidates prefers lower time for speed', () => {
    const faster = rankModelsForMetric(
      [
        submission({ model: 'a', total_execution_time_seconds: 55 }),
        submission({ model: 'b', total_execution_time_seconds: 72 }),
      ],
      'speed',
    )
    expect(compareBadgeCandidates('speed', faster[0], faster[1])).toBeLessThan(0)
  })

  test('computeModelBadgeStatuses marks winners in each window', () => {
    const statuses = computeModelBadgeStatuses(
      [
        submission({
          model: 'winner',
          score_percentage: 0.95,
          timestamp: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
        }),
        submission({
          model: 'challenger',
          score_percentage: 0.9,
          timestamp: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
        }),
      ],
      'winner',
      { now: baseTime, version: 'bench-123' },
    )

    const dailySuccess = statuses.find((status) => status.period === '1d' && status.metric === 'success')
    expect(dailySuccess?.awarded).toBe(true)
    expect(dailySuccess?.rank).toBe(1)
    expect(dailySuccess?.url).toContain('/api/badges/success/1d?model=winner')
  })
})