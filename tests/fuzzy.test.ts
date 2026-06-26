import { describe, it, expect } from 'vitest'
import { levenshtein, fuzzyScore, combinedScore, getPinyinInitials } from '../electron/utils/fuzzy'

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('hello', 'hello')).toBe(0)
  })

  it('returns distance for edits', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })
})

describe('fuzzyScore', () => {
  it('scores exact match highest', () => {
    expect(fuzzyScore('chrome', 'chrome')).toBe(100)
  })

  it('scores prefix match highly', () => {
    expect(fuzzyScore('chr', 'chrome')).toBeGreaterThan(90)
  })

  it('returns 0 for empty query', () => {
    expect(fuzzyScore('', 'chrome')).toBe(0)
  })
})

describe('combinedScore', () => {
  it('uses max of fuzzy and subsequence', () => {
    expect(combinedScore('gc', 'Google Chrome')).toBeGreaterThan(0)
  })
})

describe('getPinyinInitials', () => {
  it('extracts initials from Chinese', () => {
    const initials = getPinyinInitials('微信')
    expect(initials.length).toBeGreaterThan(0)
  })
})
