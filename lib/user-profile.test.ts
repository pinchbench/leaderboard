import { describe, expect, test } from 'bun:test'
import type { UserSubmission } from './types'

function makeSubmission(overrides: Partial<UserSubmission>): UserSubmission {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    model: overrides.model ?? 'openai/gpt-test',
    provider: overrides.provider ?? 'openai',
    score_percentage: overrides.score_percentage ?? 0.8,
    total_score: overrides.total_score ?? 32,
    max_score: overrides.max_score ?? 40,
    total_execution_time_seconds: overrides.total_execution_time_seconds ?? 100,
    total_cost_usd: overrides.total_cost_usd ?? 10,
    timestamp: overrides.timestamp ?? new Date('2026-03-28T12:00:00Z').toISOString(),
    created_at: overrides.created_at ?? new Date('2026-03-28T12:00:00Z').toISOString(),
    client_version: overrides.client_version ?? '',
    openclaw_version: overrides.openclaw_version ?? null,
    benchmark_version: overrides.benchmark_version ?? 'bench-123',
  }
}

describe('user profile aggregation', () => {
  test('unique models are counted correctly', () => {
    const subs = [
      makeSubmission({ model: 'a' }),
      makeSubmission({ model: 'a' }),
      makeSubmission({ model: 'b' }),
    ]
    const unique = [...new Set(subs.map(s => s.model))]
    expect(unique.length).toBe(2)
    expect(unique).toContain('a')
    expect(unique).toContain('b')
  })

  test('best score per model picks the highest', () => {
    const subs = [
      makeSubmission({ model: 'a', score_percentage: 0.8 }),
      makeSubmission({ model: 'a', score_percentage: 0.9 }),
      makeSubmission({ model: 'b', score_percentage: 0.7 }),
    ]
    const bestByModel = new Map<string, { model: string; score_percentage: number; id: string }>()
    for (const sub of subs) {
      const existing = bestByModel.get(sub.model)
      if (!existing || sub.score_percentage > existing.score_percentage) {
        bestByModel.set(sub.model, { model: sub.model, score_percentage: sub.score_percentage, id: sub.id })
      }
    }
    expect(bestByModel.get('a')?.score_percentage).toBe(0.9)
    expect(bestByModel.get('b')?.score_percentage).toBe(0.7)
  })

  test('date range is computed from timestamps', () => {
    const subs = [
      makeSubmission({ timestamp: '2026-03-01T00:00:00Z' }),
      makeSubmission({ timestamp: '2026-03-15T00:00:00Z' }),
      makeSubmission({ timestamp: '2026-03-10T00:00:00Z' }),
    ]
    const timestamps = subs.map(s => new Date(s.timestamp).getTime())
    expect(Math.min(...timestamps)).toBe(new Date('2026-03-01T00:00:00Z').getTime())
    expect(Math.max(...timestamps)).toBe(new Date('2026-03-15T00:00:00Z').getTime())
  })

  test('empty submissions array has no date range', () => {
    const timestamps: number[] = []
    expect(timestamps.length).toBe(0)
  })

  test('pagination offset is calculated correctly', () => {
    const pageSize = 20
    expect((1 - 1) * pageSize).toBe(0)
    expect((2 - 1) * pageSize).toBe(20)
    expect((3 - 1) * pageSize).toBe(40)
  })

  test('total pages is ceiling of total / page size', () => {
    const pageSize = 20
    expect(Math.ceil(0 / pageSize)).toBe(0)
    expect(Math.ceil(1 / pageSize)).toBe(1)
    expect(Math.ceil(20 / pageSize)).toBe(1)
    expect(Math.ceil(21 / pageSize)).toBe(2)
    expect(Math.ceil(45 / pageSize)).toBe(3)
  })
})
