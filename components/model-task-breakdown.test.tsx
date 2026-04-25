import { describe, expect, test } from 'bun:test'
import { getComparisonIndicator } from './model-task-breakdown'

describe('getComparisonIndicator', () => {
  test('returns null when no average score provided', () => {
    expect(getComparisonIndicator(90, 100)).toBeNull()
  })

  test('returns "Above average" when task score is > 5% above average', () => {
    const result = getComparisonIndicator(90, 100, 80)
    expect(result).not.toBeNull()
    expect(result?.label).toBe('Above average')
    expect(result?.icon).toBe('↑')
    expect(result?.color).toBe('text-green-500')
    expect(result?.bg).toBe('bg-green-500/10')
    expect(result?.border).toBe('border-green-500/20')
  })

  test('returns "Average" when task score is within 5% of average', () => {
    const result = getComparisonIndicator(75, 100, 73)
    expect(result).not.toBeNull()
    expect(result?.label).toBe('Average')
    expect(result?.icon).toBe('→')
    expect(result?.color).toBe('text-yellow-500')
    expect(result?.bg).toBe('bg-yellow-500/10')
    expect(result?.border).toBe('border-yellow-500/20')
  })

  test('returns "Below average" when task score is > 5% below average', () => {
    const result = getComparisonIndicator(60, 100, 70)
    expect(result).not.toBeNull()
    expect(result?.label).toBe('Below average')
    expect(result?.icon).toBe('↓')
    expect(result?.color).toBe('text-red-500')
    expect(result?.bg).toBe('bg-red-500/10')
    expect(result?.border).toBe('border-red-500/20')
  })

  test('handles exact 5% difference as Average', () => {
    const result = getComparisonIndicator(75, 100, 70)
    expect(result?.label).toBe('Average')
  })

  test('handles exact -5% difference as Average', () => {
    const result = getComparisonIndicator(65, 100, 70)
    expect(result?.label).toBe('Average')
  })

  test('handles scores above 100%', () => {
    const result = getComparisonIndicator(110, 100, 90)
    expect(result?.label).toBe('Above average')
  })

  test('handles zero scores', () => {
    const result = getComparisonIndicator(0, 100, 50)
    expect(result?.label).toBe('Below average')
  })

  test('perfect score vs lower average', () => {
    const result = getComparisonIndicator(100, 100, 80)
    expect(result?.label).toBe('Above average')
  })

  test('task score 85%, avg 79% => Above average (diff = 6%)', () => {
    const result = getComparisonIndicator(85, 100, 79)
    expect(result?.label).toBe('Above average')
  })

  test('task score 84%, avg 80% => Average (diff = 4%)', () => {
    const result = getComparisonIndicator(84, 100, 80)
    expect(result?.label).toBe('Average')
  })

  test('task score 76%, avg 82% => Below average (diff = -6%)', () => {
    const result = getComparisonIndicator(76, 100, 82)
    expect(result?.label).toBe('Below average')
  })

  test('task score 77%, avg 82% => Average (diff = -5%)', () => {
    const result = getComparisonIndicator(77, 100, 82)
    expect(result?.label).toBe('Average')
  })

  test('uses maxScore to calculate percentage correctly', () => {
    const result = getComparisonIndicator(45, 50, 80)
    expect(result?.label).toBe('Above average')
  })

  test('same score as average returns Average', () => {
    const result = getComparisonIndicator(80, 100, 80)
    expect(result?.label).toBe('Average')
  })
})
