import { describe, it, expect } from 'vitest'
import { isCalcQuery, searchCalculator } from '../electron/services/calculator'

describe('isCalcQuery', () => {
  it('accepts valid expressions', () => {
    expect(isCalcQuery('1+2')).toBe(true)
    expect(isCalcQuery('10 * 5')).toBe(true)
  })

  it('rejects plain text', () => {
    expect(isCalcQuery('hello')).toBe(false)
  })

  it('rejects numbers only', () => {
    expect(isCalcQuery('42')).toBe(false)
  })
})

describe('searchCalculator', () => {
  it('returns calc result', () => {
    const results = searchCalculator('2+3')
    expect(results).toHaveLength(1)
    expect(results[0].type).toBe('calc')
    expect(results[0].title).toBe('5')
  })

  it('handles parentheses', () => {
    const results = searchCalculator('(2+3)*4')
    expect(results[0].title).toBe('20')
  })
})
