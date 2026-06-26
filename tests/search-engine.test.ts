import { describe, it, expect } from 'vitest'
import { combinedScore } from '../electron/utils/fuzzy'

describe('search ranking logic', () => {
  it('prefers exact filename match over partial', () => {
    const exact = combinedScore('report', 'report.pdf')
    const partial = combinedScore('report', 'annual-report.pdf')
    expect(exact).toBeGreaterThanOrEqual(partial)
  })

  it('ranks shorter closer matches higher', () => {
    const short = combinedScore('doc', 'doc')
    const long = combinedScore('doc', 'document-editor')
    expect(short).toBeGreaterThan(long)
  })
})
