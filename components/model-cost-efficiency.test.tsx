import { describe, expect, test } from 'bun:test'
import { calculateValueScore, getValueScoreInterpretation } from './model-cost-efficiency'

describe('calculateValueScore', () => {
  test('calculates value score correctly: (avgScore * 100) / avgCost', () => {
    expect(calculateValueScore(0.85, 0.02)).toBe(4250)
  })

  test('returns null when avgScore is null', () => {
    expect(calculateValueScore(null, 0.02)).toBeNull()
  })

  test('returns null when avgCost is null', () => {
    expect(calculateValueScore(0.85, null)).toBeNull()
  })

  test('returns null when avgCost is zero', () => {
    expect(calculateValueScore(0.85, 0)).toBeNull()
  })

  test('returns null when avgCost is negative', () => {
    expect(calculateValueScore(0.85, -0.01)).toBeNull()
  })

  test('handles high score with low cost = high value', () => {
    const result = calculateValueScore(0.95, 0.01)
    expect(result).toBe(9500)
  })

  test('handles low score with high cost = low value', () => {
    const result = calculateValueScore(0.50, 10)
    expect(result).toBe(5)
  })

  test('handles moderate score and cost', () => {
    const result = calculateValueScore(0.80, 0.04)
    expect(result).toBe(2000)
  })

  test('score percentage as whole number (0-100 scale)', () => {
    const result = calculateValueScore(85, 0.10)
    expect(result).toBe(85000)
  })

  test('very small cost produces large value score', () => {
    const result = calculateValueScore(0.90, 0.001)
    expect(result).toBe(90000)
  })

  test('equal score and cost', () => {
    const result = calculateValueScore(0.50, 0.50)
    expect(result).toBe(100)
  })

  test('both null returns null', () => {
    expect(calculateValueScore(null, null)).toBeNull()
  })
})

describe('getValueScoreInterpretation', () => {
  test('returns "Insufficient data" for null', () => {
    expect(getValueScoreInterpretation(null)).toBe('Insufficient data')
  })

  test('returns "Excellent value" for score >= 500', () => {
    expect(getValueScoreInterpretation(500)).toBe('Excellent value')
    expect(getValueScoreInterpretation(1000)).toBe('Excellent value')
  })

  test('returns "Good value" for score >= 200 and < 500', () => {
    expect(getValueScoreInterpretation(200)).toBe('Good value')
    expect(getValueScoreInterpretation(499)).toBe('Good value')
  })

  test('returns "Moderate value" for score >= 100 and < 200', () => {
    expect(getValueScoreInterpretation(100)).toBe('Moderate value')
    expect(getValueScoreInterpretation(199)).toBe('Moderate value')
  })

  test('returns "Low value" for score < 100', () => {
    expect(getValueScoreInterpretation(99)).toBe('Low value')
    expect(getValueScoreInterpretation(0)).toBe('Low value')
  })

  test('boundary: 500 is Excellent', () => {
    expect(getValueScoreInterpretation(500)).toBe('Excellent value')
  })

  test('boundary: 499 is Good', () => {
    expect(getValueScoreInterpretation(499)).toBe('Good value')
  })

  test('boundary: 200 is Good', () => {
    expect(getValueScoreInterpretation(200)).toBe('Good value')
  })

  test('boundary: 199 is Moderate', () => {
    expect(getValueScoreInterpretation(199)).toBe('Moderate value')
  })

  test('boundary: 100 is Moderate', () => {
    expect(getValueScoreInterpretation(100)).toBe('Moderate value')
  })

  test('boundary: 99 is Low', () => {
    expect(getValueScoreInterpretation(99)).toBe('Low value')
  })

  test('handles negative values as Low', () => {
    expect(getValueScoreInterpretation(-50)).toBe('Low value')
  })
})
