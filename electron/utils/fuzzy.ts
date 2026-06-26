/**
 * Fuzzy matching utilities: edit distance + pinyin initials
 */
import { pinyin } from 'pinyin-pro'

export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

export function getPinyinInitials(text: string): string {
  try {
    return pinyin(text, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase()
  } catch {
    return ''
  }
}

export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase()
  if (!q) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 90 + (q.length / t.length) * 10
  if (t.includes(q)) return 70 + (q.length / t.length) * 10

  const initials = getPinyinInitials(target)
  if (initials.startsWith(q)) return 80
  if (initials.includes(q)) return 60

  const distance = levenshtein(q, t)
  const maxLen = Math.max(q.length, t.length)
  const similarity = 1 - distance / maxLen
  if (similarity > 0.5) return similarity * 50

  const initDistance = levenshtein(q, initials)
  const initSimilarity = 1 - initDistance / Math.max(q.length, initials.length || 1)
  if (initSimilarity > 0.5) return initSimilarity * 40

  return 0
}

export function subsequenceMatch(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  if (qi === q.length) return 30 + (q.length / t.length) * 20
  return 0
}

export function combinedScore(query: string, target: string): number {
  return Math.max(fuzzyScore(query, target), subsequenceMatch(query, target))
}
