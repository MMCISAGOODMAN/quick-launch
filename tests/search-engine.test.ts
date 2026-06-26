import { describe, it, expect } from 'vitest'
import { matchScore } from '../electron/utils/fuzzy'
import { mergeTieredResults } from '../electron/services/search-engine'
import type { SearchResult } from '../src/types'

function result(id: string, type: SearchResult['type'], score: number): SearchResult {
  return { id, type, title: id, score, payload: {} }
}

describe('search ranking logic', () => {
  it('prefers exact filename match over partial', () => {
    const exact = matchScore('report', ['report.pdf'], '/Users/me/Documents/report.pdf')
    const partial = matchScore('report', ['annual-report.pdf'], '/Users/me/annual-report.pdf')
    expect(exact).toBeGreaterThanOrEqual(partial)
  })

  it('ranks shorter closer matches higher', () => {
    const short = matchScore('doc', ['doc'])
    const long = matchScore('doc', ['document-editor'])
    expect(short).toBeGreaterThan(long)
  })
})

describe('mergeTieredResults', () => {
  it('places tier1 before tier2 and tier3', () => {
    const merged = mergeTieredResults(
      [result('app:1', 'app', 80)],
      [result('cmd:1', 'command', 90)],
      [result('web:1', 'web', 100)],
      10,
    )
    expect(merged[0].type).toBe('app')
    expect(merged[1].type).toBe('command')
    expect(merged[2].type).toBe('web')
  })

  it('sorts within each tier by score', () => {
    const merged = mergeTieredResults(
      [result('app:low', 'app', 50), result('app:high', 'app', 95)],
      [],
      [],
      10,
    )
    expect(merged[0].id).toBe('app:high')
  })

  it('deduplicates by id', () => {
    const merged = mergeTieredResults(
      [result('dup', 'app', 80)],
      [result('dup', 'command', 90)],
      [],
      10,
    )
    expect(merged).toHaveLength(1)
  })
})
