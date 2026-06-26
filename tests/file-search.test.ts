import { describe, it, expect } from 'vitest'
import { scoreFilePath } from '../electron/services/file-search'
import { MIN_MATCH_SCORE } from '../electron/utils/fuzzy'

describe('scoreFilePath', () => {
  it('scores exact basename highly', () => {
    const score = scoreFilePath('/Users/me/Documents/report.pdf', 'report')
    expect(score).toBeGreaterThanOrEqual(90)
  })

  it('scores partial basename match', () => {
    const score = scoreFilePath('/Users/me/Documents/annual-report.pdf', 'report')
    expect(score).toBeGreaterThan(MIN_MATCH_SCORE)
  })

  it('filters unrelated paths below threshold', () => {
    const score = scoreFilePath('/System/Library/CoreServices/loginwindow.app', 'report')
    expect(score).toBeLessThan(MIN_MATCH_SCORE)
  })

  it('matches parent directory segment', () => {
    const score = scoreFilePath('/Users/me/Projects/quick-launch/README.md', 'projects')
    expect(score).toBeGreaterThan(MIN_MATCH_SCORE)
  })
})
