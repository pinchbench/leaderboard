import { describe, expect, test } from 'bun:test'
import {
  filterSubmissionsByVersion,
  sortSubmissionsByTimestamp,
  ModelRunHistory,
} from './model-run-history'
import type { ApiModelSubmissionItem } from '@/lib/types'

// Note: getScoreColorClass is tested in lib/scores.test.ts
// Note: fmtSpeed and fmtCurrency are tested in lib/format.test.ts

function submission(overrides: Partial<ApiModelSubmissionItem>): ApiModelSubmissionItem {
  return {
    id: overrides.id ?? 'run_123',
    model: overrides.model ?? 'test-model',
    provider: overrides.provider ?? 'test',
    score_percentage: overrides.score_percentage ?? 0.8,
    total_score: overrides.total_score ?? 32,
    max_score: overrides.max_score ?? 40,
    total_execution_time_seconds: overrides.total_execution_time_seconds ?? 100,
    total_cost_usd: overrides.total_cost_usd ?? 0.05,
    timestamp: overrides.timestamp ?? '2026-03-28T12:00:00.000Z',
    created_at: overrides.created_at ?? '2026-03-28T12:00:00.000Z',
    client_version: overrides.client_version ?? null,
    openclaw_version: overrides.openclaw_version ?? null,
    benchmark_version: overrides.benchmark_version ?? 'bench-123',
    claimed: overrides.claimed ?? 1,
    official: overrides.official ?? true,
    is_best: overrides.is_best ?? false,
  }
}

describe('filterSubmissionsByVersion', () => {
  test('returns all submissions when version is "all"', () => {
    const subs = [
      submission({ id: 'run_v1_abc123', timestamp: '2026-03-28T12:00:00.000Z' }),
      submission({ id: 'run_v2_def456', timestamp: '2026-03-28T13:00:00.000Z' }),
    ]
    const result = filterSubmissionsByVersion(subs, 'all')
    expect(result).toHaveLength(2)
  })

  test('filters by version in ID suffix', () => {
    const subs = [
      submission({ id: 'model_v1_abc123', timestamp: '2026-03-28T12:00:00.000Z' }),
      submission({ id: 'model_v2_def456', timestamp: '2026-03-28T13:00:00.000Z' }),
      submission({ id: 'model_v3_abc123', timestamp: '2026-03-28T14:00:00.000Z' }),
    ]
    const result = filterSubmissionsByVersion(subs, 'abc123')
    expect(result).toHaveLength(2)
    expect(result.every(s => s.id.includes('abc123'))).toBe(true)
  })

  test('returns empty array when no matches', () => {
    const subs = [
      submission({ id: 'model_v1_abc123' }),
      submission({ id: 'model_v2_def456' }),
    ]
    const result = filterSubmissionsByVersion(subs, 'xyz789')
    expect(result).toHaveLength(0)
  })

  test('handles empty submissions array', () => {
    const result = filterSubmissionsByVersion([], 'abc123')
    expect(result).toHaveLength(0)
  })
})

describe('sortSubmissionsByTimestamp', () => {
  test('sorts by timestamp newest first', () => {
    const subs = [
      submission({ id: 'run1', timestamp: '2026-03-28T10:00:00.000Z' }),
      submission({ id: 'run2', timestamp: '2026-03-28T14:00:00.000Z' }),
      submission({ id: 'run3', timestamp: '2026-03-28T12:00:00.000Z' }),
    ]
    const result = sortSubmissionsByTimestamp(subs)
    expect(result[0]?.id).toBe('run2')
    expect(result[1]?.id).toBe('run3')
    expect(result[2]?.id).toBe('run1')
  })

  test('handles single submission', () => {
    const subs = [submission({ id: 'run1' })]
    const result = sortSubmissionsByTimestamp(subs)
    expect(result).toHaveLength(1)
  })

  test('handles empty array', () => {
    const result = sortSubmissionsByTimestamp([])
    expect(result).toHaveLength(0)
  })

  test('does not mutate original array', () => {
    const subs = [
      submission({ id: 'run1', timestamp: '2026-03-28T10:00:00.000Z' }),
      submission({ id: 'run2', timestamp: '2026-03-28T14:00:00.000Z' }),
    ]
    const original = [...subs]
    sortSubmissionsByTimestamp(subs)
    expect(subs[0]?.id).toBe(original[0]?.id)
  })
})

describe('ModelRunHistory component', () => {
  test('exports the component', () => {
    expect(ModelRunHistory).toBeDefined()
    expect(typeof ModelRunHistory).toBe('function')
  })
})
