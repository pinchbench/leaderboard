import { describe, expect, test } from 'bun:test'
import { matchesBusinessFilters } from './leaderboard-view'
import type { LeaderboardEntry } from '@/lib/types'

function entry(overrides: Partial<LeaderboardEntry> & { model: string }): LeaderboardEntry {
  return {
    rank: 1,
    provider: 'nvidia',
    percentage: 80,
    timestamp: '2026-09-01T00:00:00Z',
    submission_id: `${overrides.model}-sub`,
    ...overrides,
  }
}

const noFilters = { providerFilters: [], openWeightsOnly: false, slmOnly: false }

const slm = entry({ model: 'nvidia/nemotron-3.5-lightning-30b-a3b', weights: 'Open', slm: true })
const openLarge = entry({ model: 'nvidia/nemotron-3-ultra-550b-a55b', weights: 'Open', slm: false })
const closed = entry({ model: 'anthropic/claude-opus-4.8', provider: 'anthropic', weights: 'Closed' })

describe('matchesBusinessFilters', () => {
  test('SLM-only keeps SLMs and hides every other model', () => {
    const filters = { ...noFilters, slmOnly: true }
    expect([slm, openLarge, closed].filter((e) => matchesBusinessFilters(e, filters))).toEqual([slm])
  })

  test('non-SLM models stay visible when SLM-only is off', () => {
    expect([slm, openLarge, closed].filter((e) => matchesBusinessFilters(e, noFilters))).toEqual([slm, openLarge, closed])
  })

  test('SLM-only combines with the provider filter', () => {
    const openaiSlm = entry({ model: 'openai/gpt-oss-20b', provider: 'openai', weights: 'Open', slm: true })
    const openaiClosed = entry({ model: 'openai/gpt-5.5', provider: 'openai', weights: 'Closed' })
    const filters = { ...noFilters, providerFilters: ['openai'], slmOnly: true }
    expect([slm, openaiSlm, openaiClosed].filter((e) => matchesBusinessFilters(e, filters))).toEqual([openaiSlm])
  })

  test('open-weight-only keeps SLMs and larger open models', () => {
    const filters = { ...noFilters, openWeightsOnly: true }
    expect([slm, openLarge, closed].filter((e) => matchesBusinessFilters(e, filters))).toEqual([slm, openLarge])
  })
})
