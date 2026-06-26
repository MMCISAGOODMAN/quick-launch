import { isConfigQuery, isSettingsQuery, isThemeQuery } from './config'
import { matchScore } from '../utils/fuzzy'

export type SearchMode = 'default' | 'clipboard' | 'snippet' | 'settings'

export interface ParsedQuery {
  mode: SearchMode
  /** Search term after mode prefix (empty = list all in mode) */
  term: string
  raw: string
}

const CLIP_PREFIX = /^(clip|cb|剪贴板|clipboard)\s*/i
const SNIP_PREFIX = /^(snip|snippet|snippets?|片段|文本片段)\s*/i

export function isClipboardModeQuery(query: string): boolean {
  const q = query.trim()
  if (!q) return false
  return /^(clip|cb|剪贴板|clipboard)$/i.test(q) || CLIP_PREFIX.test(q)
}

export function isSnippetModeQuery(query: string): boolean {
  const q = query.trim()
  if (!q) return false
  return /^(snip|snippet|snippets?|片段|文本片段)$/i.test(q) || SNIP_PREFIX.test(q)
}

export function isSettingsModeQuery(query: string): boolean {
  const q = query.trim()
  if (!q) return false
  if (isSettingsQuery(q) || isConfigQuery(q) || isThemeQuery(q)) return true
  if (/^(设置|shezhi|sz)$/i.test(q)) return true
  if (/^设/.test(q) && q.length <= 3) return true
  return matchScore(q, ['设置', '打开设置', 'settings', 'preferences', '偏好设置']) >= 70
}

export function parseSearchQuery(query: string): ParsedQuery {
  const raw = query.trim()
  if (!raw) return { mode: 'default', term: '', raw }

  if (isClipboardModeQuery(raw)) {
    const term = raw.replace(CLIP_PREFIX, '').replace(/^(clip|cb|剪贴板|clipboard)$/i, '').trim()
    return { mode: 'clipboard', term, raw }
  }

  if (isSnippetModeQuery(raw)) {
    const term = raw.replace(SNIP_PREFIX, '').replace(/^(snip|snippet|snippets?|片段|文本片段)$/i, '').trim()
    return { mode: 'snippet', term, raw }
  }

  if (isSettingsModeQuery(raw)) {
    return { mode: 'settings', term: raw, raw }
  }

  return { mode: 'default', term: raw, raw }
}
