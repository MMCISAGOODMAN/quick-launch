import { shell } from 'electron'
import { loadConfig } from './config'
import { matchScore } from '../utils/fuzzy'
import type { SearchResult, SearchEngine } from '../../src/types'

export function parseWebQuery(query: string): { engine: SearchEngine; keyword: string } | null {
  const config = loadConfig()
  const trimmed = query.trim()
  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return null

  const prefix = parts[0].toLowerCase()
  const keyword = parts.slice(1).join(' ')
  if (!keyword) return null

  const engine = config.searchEngines.find((e) => e.prefix.toLowerCase() === prefix)
  if (!engine) return null

  return { engine, keyword }
}

export function searchWeb(query: string): SearchResult[] {
  const parsed = parseWebQuery(query)
  if (!parsed) {
    const config = loadConfig()
    if (!query.trim()) return []

    return config.searchEngines.map((engine) => ({
      id: `web-hint:${engine.id}`,
      type: 'web' as const,
      title: `Search ${engine.name}`,
      subtitle: `${engine.prefix} ${query.trim()}`,
      score: 10,
      payload: { engineId: engine.id, keyword: query.trim(), hint: true },
    }))
  }

  const { engine, keyword } = parsed
  return [{
    id: `web:${engine.id}:${keyword}`,
    type: 'web',
    title: `Search "${keyword}" on ${engine.name}`,
    subtitle: engine.url.replace('{query}', keyword),
    score: 95,
    payload: { engineId: engine.id, keyword, url: engine.url.replace('{query}', encodeURIComponent(keyword)) },
  }]
}

export function searchWebCommands(query: string): SearchResult[] {
  const config = loadConfig()
  if (!query.trim()) return []

  return config.searchEngines
    .filter((e) => matchScore(query, [e.name, e.prefix]) > 0)
    .map((engine) => ({
      id: `web-engine:${engine.id}`,
      type: 'web' as const,
      title: engine.name,
      subtitle: `Prefix: ${engine.prefix}`,
      score: matchScore(query, [engine.name, engine.prefix]),
      payload: { engineId: engine.id, hint: true },
    }))
}

export function openWebSearch(url: string): void {
  shell.openExternal(url)
}

export function openWebSearchByEngine(engineId: string, keyword: string): void {
  const config = loadConfig()
  const engine = config.searchEngines.find((e) => e.id === engineId)
  if (!engine) return
  const url = engine.url.replace('{query}', encodeURIComponent(keyword))
  shell.openExternal(url)
}
