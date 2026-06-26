import { getRecentUsage } from './database'
import type { SearchResult } from '../../src/types'

interface UsageRow {
  item_id: string
  item_type: string
  count: number
  last_used: number
}

export function getRecentItems(limit = 10): UsageRow[] {
  try {
    return getRecentUsage(limit)
  } catch {
    return []
  }
}

export function getRecentSearchResults(limit = 10): SearchResult[] {
  const rows = getRecentItems(limit * 2)
  const results: SearchResult[] = []

  for (const row of rows) {
    const result = usageRowToResult(row)
    if (result) results.push(result)
    if (results.length >= limit) break
  }

  return results
}

function usageRowToResult(row: UsageRow): SearchResult | null {
  const { item_id, item_type } = row

  if (item_type === 'app') {
    const path = item_id.replace(/^app:/, '')
    const name = path.split('/').pop()?.replace(/\.app$/, '') ?? path
    return {
      id: item_id,
      type: 'app',
      title: name,
      subtitle: path,
      score: 50,
      payload: { path },
    }
  }

  if (item_type === 'file') {
    const path = item_id.replace(/^file:/, '')
    const name = path.split('/').pop() ?? path
    return {
      id: item_id,
      type: 'file',
      title: name,
      subtitle: path,
      score: 50,
      payload: { path, isDirectory: false },
    }
  }

  if (item_type === 'command') {
    return {
      id: item_id,
      type: 'command',
      title: item_id.replace(/^cmd:/, ''),
      subtitle: '最近使用',
      score: 50,
      payload: { commandId: item_id.replace(/^cmd:/, '') },
    }
  }

  return null
}

export function getQuickAccessApps(limit = 8): SearchResult[] {
  return getRecentSearchResults(limit).filter((r) => r.type === 'app')
}
