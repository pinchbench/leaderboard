import { describe, expect, test } from 'bun:test'
import {
  SCORE_THRESHOLDS,
  getScoreColorHex,
  getScoreColorClass,
  getScoreBgClass,
  getScoreLabel,
  computeStats,
} from './scores'

describe('SCORE_THRESHOLDS', () => {
  test('EXCELLENT is 85', () => {
    expect(SCORE_THRESHOLDS.EXCELLENT).toBe(85)
  })

  test('GOOD is 70', () => {
    expect(SCORE_THRESHOLDS.GOOD).toBe(70)
  })
})

describe('getScoreColorHex', () => {
  test('returns green for >= 85', () => {
    expect(getScoreColorHex(85)).toBe('#22c55e')
    expect(getScoreColorHex(100)).toBe('#22c55e')
  })

  test('returns yellow for >= 70 and < 85', () => {
    expect(getScoreColorHex(70)).toBe('#f59e0b')
    expect(getScoreColorHex(84)).toBe('#f59e0b')
  })

  test('returns red for < 70', () => {
    expect(getScoreColorHex(69)).toBe('#ef4444')
    expect(getScoreColorHex(0)).toBe('#ef4444')
  })
})

describe('getScoreColorClass', () => {
  test('returns Tailwind green class for >= 85', () => {
    expect(getScoreColorClass(85)).toBe('text-green-500')
  })

  test('returns Tailwind yellow class for >= 70 and < 85', () => {
    expect(getScoreColorClass(70)).toBe('text-yellow-500')
  })

  test('returns Tailwind red class for < 70', () => {
    expect(getScoreColorClass(69)).toBe('text-red-500')
  })
})

describe('getScoreBgClass', () => {
  test('returns bg-green-500 for >= 85', () => {
    expect(getScoreBgClass(85)).toBe('bg-green-500')
  })

  test('returns bg-yellow-500 for >= 70 and < 85', () => {
    expect(getScoreBgClass(70)).toBe('bg-yellow-500')
  })

  test('returns bg-red-500 for < 70', () => {
    expect(getScoreBgClass(69)).toBe('bg-red-500')
  })
})

describe('getScoreLabel', () => {
  test('returns Excellent for >= 85', () => {
    expect(getScoreLabel(85)).toBe('Excellent')
  })

  test('returns Good for >= 70 and < 85', () => {
    expect(getScoreLabel(70)).toBe('Good')
  })

  test('returns Needs Improvement for < 70', () => {
    expect(getScoreLabel(69)).toBe('Needs Improvement')
  })
})

describe('computeStats', () => {
  test('returns null for empty array', () => {
    expect(computeStats([])).toBeNull()
  })

  test('computes stats for [10, 20, 30, 40, 50]', () => {
    const stats = computeStats([10, 20, 30, 40, 50])
    expect(stats).not.toBeNull()
    expect(stats!.min).toBe(10)
    expect(stats!.max).toBe(50)
    expect(stats!.avg).toBe(30)
    expect(stats!.median).toBe(30)
    expect(stats!.stddev).toBeCloseTo(14.14, 2)
  })

  test('computes median for even-length array', () => {
    const stats = computeStats([10, 20, 30, 40])
    expect(stats!.median).toBe(25)
  })

  test('works with unsorted input', () => {
    const stats = computeStats([50, 10, 30, 20, 40])
    expect(stats!.min).toBe(10)
    expect(stats!.max).toBe(50)
    expect(stats!.avg).toBe(30)
  })

  test('returns zero stddev for identical values', () => {
    const stats = computeStats([5, 5, 5])
    expect(stats!.stddev).toBe(0)
  })

  test('single element array', () => {
    const stats = computeStats([42])
    expect(stats!.min).toBe(42)
    expect(stats!.max).toBe(42)
    expect(stats!.avg).toBe(42)
    expect(stats!.median).toBe(42)
    expect(stats!.stddev).toBe(0)
  })
})
