/**
 * Fuzzy matching: multi-field scoring with pinyin, token, path segment support
 */
import { pinyin } from 'pinyin-pro'

export const MIN_MATCH_SCORE = 15

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

export function getPinyinFull(text: string): string {
  try {
    return pinyin(text, { toneType: 'none', type: 'array' }).join('').toLowerCase()
  } catch {
    return ''
  }
}

export function stripExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0) return filename
  return filename.slice(0, lastDot)
}

export function getPathSegments(path: string): string[] {
  return path.split(/[/\\]/).filter(Boolean)
}

export function subsequenceMatch(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  if (qi === q.length) return 35 + (q.length / Math.max(t.length, 1)) * 25
  return 0
}

function tokenMatchScore(query: string, target: string): number {
  const q = query.toLowerCase().trim()
  const tokens = target.toLowerCase().split(/[\s\-_.]+/).filter(Boolean)
  if (tokens.length === 0) return 0

  let best = 0
  for (const token of tokens) {
    if (token === q) best = Math.max(best, 95)
    else if (token.startsWith(q)) best = Math.max(best, 85 + (q.length / token.length) * 10)
    else if (token.includes(q)) best = Math.max(best, 72 + (q.length / token.length) * 8)
  }
  return best
}

function singleFieldScore(query: string, target: string): number {
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase()
  if (!q || !t) return 0

  if (t === q) return 100
  if (t.startsWith(q)) return 90 + (q.length / t.length) * 10
  if (t.includes(q)) return 70 + (q.length / t.length) * 10

  const tokenScore = tokenMatchScore(q, target)
  if (tokenScore > 0) return tokenScore

  const subseq = subsequenceMatch(q, t)
  if (subseq > 0) return subseq

  const initials = getPinyinInitials(target)
  if (initials) {
    if (initials === q) return 82
    if (initials.startsWith(q)) return 78
    if (initials.includes(q)) return 62
    const initSubseq = subsequenceMatch(q, initials)
    if (initSubseq > 0) return initSubseq
  }

  const fullPinyin = getPinyinFull(target)
  if (fullPinyin) {
    if (fullPinyin === q) return 88
    if (fullPinyin.startsWith(q)) return 84
    if (fullPinyin.includes(q)) return 68
  }

  // Short-query edit distance only for comparable lengths
  if (q.length >= 3 && t.length <= q.length * 3) {
    const distance = levenshtein(q, t)
    const maxLen = Math.max(q.length, t.length)
    const similarity = 1 - distance / maxLen
    if (similarity > 0.6) return similarity * 45
  }

  return 0
}

/** Score query against a single text field */
export function fuzzyScore(query: string, target: string): number {
  return singleFieldScore(query, target)
}

/** Score query against a single text field (alias for backward compatibility) */
export function combinedScore(query: string, target: string): number {
  return singleFieldScore(query, target)
}

/** Score query against multiple fields; optional path for segment matching */
export function matchScore(query: string, fields: string[], filePath?: string): number {
  const q = query.trim()
  if (!q) return 0

  let best = 0
  for (const field of fields) {
    if (!field) continue
    best = Math.max(best, singleFieldScore(q, field))

    const withoutExt = stripExtension(field)
    if (withoutExt !== field) {
      best = Math.max(best, singleFieldScore(q, withoutExt))
      if (withoutExt.toLowerCase() === q.toLowerCase()) {
        best = Math.max(best, 100)
      }
    }
  }

  if (filePath) {
    const segments = getPathSegments(filePath)
    for (const seg of segments) {
      best = Math.max(best, singleFieldScore(q, seg) * 0.85)
      const segNoExt = stripExtension(seg)
      if (segNoExt !== seg) {
        best = Math.max(best, singleFieldScore(q, segNoExt) * 0.85)
      }
    }
  }

  return Math.round(best)
}
