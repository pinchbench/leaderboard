import { describe, expect, test } from 'bun:test'
import {
  fmtNum,
  fmtCurrency,
  fmtDuration,
  fmtSpeed,
  fmtCost,
} from './format'

describe('fmtNum', () => {
  test('formats to 2 decimals by default', () => {
    expect(fmtNum(3.14159)).toBe('3.14')
  })

  test('formats to specified decimals', () => {
    expect(fmtNum(3.14159, 3)).toBe('3.142')
  })

  test('formats to 0 decimals', () => {
    expect(fmtNum(42.7, 0)).toBe('43')
  })

  test('pads with zeros', () => {
    expect(fmtNum(5)).toBe('5.00')
  })
})

describe('fmtCurrency', () => {
  test('formats with dollar sign and 2 decimals', () => {
    expect(fmtCurrency(1.5)).toBe('$1.50')
  })

  test('formats zero', () => {
    expect(fmtCurrency(0)).toBe('$0.00')
  })

  test('custom decimals', () => {
    expect(fmtCurrency(0.00123, 4)).toBe('$0.0012')
  })

  test('handles null cost via caller', () => {
    const cost: number | null = null
    const result = cost != null ? fmtCurrency(cost, 2) : 'N/A'
    expect(result).toBe('N/A')
  })
})

describe('fmtDuration', () => {
  test('formats seconds under 60', () => {
    expect(fmtDuration(30)).toBe('30s')
  })

  test('formats minutes and seconds', () => {
    expect(fmtDuration(90)).toBe('1m 30s')
  })

  test('formats exact minutes', () => {
    expect(fmtDuration(120)).toBe('2m 0s')
  })

  test('rounds seconds', () => {
    expect(fmtDuration(61.7)).toBe('1m 2s')
  })

  test('normalizes 60 seconds to next minute', () => {
    expect(fmtDuration(119.9)).toBe('2m 0s')
    expect(fmtDuration(59.9)).toBe('60s')
  })
})

describe('fmtSpeed', () => {
  test('returns N/A for null', () => {
    expect(fmtSpeed(null)).toBe('N/A')
  })

  test('returns N/A for undefined', () => {
    expect(fmtSpeed(undefined)).toBe('N/A')
  })

  test('formats seconds under 60 with 1 decimal', () => {
    expect(fmtSpeed(30.5)).toBe('30.5s')
  })

  test('formats minutes and seconds', () => {
    expect(fmtSpeed(90.3)).toBe('1m 30s')
  })
})

describe('fmtCost', () => {
  test('returns N/A for null', () => {
    expect(fmtCost(null)).toBe('N/A')
  })

  test('formats with 4 decimals', () => {
    expect(fmtCost(0.0012)).toBe('$0.0012')
  })

  test('formats zero', () => {
    expect(fmtCost(0)).toBe('$0.0000')
  })
})
