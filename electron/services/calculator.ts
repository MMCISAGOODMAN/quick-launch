import { evaluate } from 'mathjs'
import { clipboard } from 'electron'
import type { SearchResult } from '../../src/types'

const CALC_PATTERN = /^[\d\s+\-*/().%^]+$/

export function isCalcQuery(query: string): boolean {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return false
  if (!CALC_PATTERN.test(trimmed)) return false
  return /[\d]/.test(trimmed) && /[+\-*/%^]/.test(trimmed)
}

export function searchCalculator(query: string): SearchResult[] {
  if (!isCalcQuery(query)) return []

  try {
    const result = evaluate(query.trim())
    if (typeof result !== 'number' || !isFinite(result)) return []

    const formatted = Number.isInteger(result)
      ? result.toString()
      : parseFloat(result.toFixed(10)).toString()

    return [{
      id: `calc:${query}`,
      type: 'calc',
      title: formatted,
      subtitle: `${query.trim()} =`,
      score: 100,
      payload: { expression: query.trim(), result: formatted },
    }]
  } catch {
    return []
  }
}

export function copyCalcResult(result: string): void {
  clipboard.writeText(result)
}
