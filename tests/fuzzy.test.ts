import { describe, it, expect } from 'vitest'
import {
  levenshtein,
  fuzzyScore,
  combinedScore,
  matchScore,
  getPinyinInitials,
  getPinyinFull,
  stripExtension,
  MIN_MATCH_SCORE,
} from '../electron/utils/fuzzy'

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

  it('matches token in multi-word target', () => {
    expect(fuzzyScore('chrome', 'Google Chrome')).toBeGreaterThan(70)
  })
})

describe('combinedScore', () => {
  it('matches subsequence in multi-word target', () => {
    expect(combinedScore('gc', 'Google Chrome')).toBeGreaterThan(0)
  })
})

describe('matchScore', () => {
  it('scores across multiple fields', () => {
    const score = matchScore('chrome', ['Google Chrome', 'com.google.Chrome'])
    expect(score).toBeGreaterThan(70)
  })

  it('prefers exact basename without extension', () => {
    const exact = matchScore('report', ['report.pdf'], '/Users/me/Documents/report.pdf')
    const partial = matchScore('report', ['annual-report.pdf'], '/Users/me/annual-report.pdf')
    expect(exact).toBeGreaterThanOrEqual(partial)
  })

  it('matches path segments', () => {
    const score = matchScore('documents', [], '/Users/me/Documents/report.pdf')
    expect(score).toBeGreaterThan(0)
  })

  it('matches pinyin initials for Chinese', () => {
    const initials = getPinyinInitials('微信')
    expect(matchScore(initials.slice(0, 2), ['微信'])).toBeGreaterThan(0)
  })

  it('matches full pinyin', () => {
    const full = getPinyinFull('微信')
    expect(full.length).toBeGreaterThan(0)
    expect(matchScore(full.slice(0, 4), ['微信'])).toBeGreaterThan(0)
  })
})

describe('stripExtension', () => {
  it('removes file extension', () => {
    expect(stripExtension('report.pdf')).toBe('report')
  })

  it('keeps hidden file names', () => {
    expect(stripExtension('.gitignore')).toBe('.gitignore')
  })
})

describe('MIN_MATCH_SCORE', () => {
  it('is a reasonable threshold', () => {
    expect(MIN_MATCH_SCORE).toBe(15)
  })
})

describe('getPinyinInitials', () => {
  it('extracts initials from Chinese', () => {
    const initials = getPinyinInitials('微信')
    expect(initials.length).toBeGreaterThan(0)
  })
})
