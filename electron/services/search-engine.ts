import { loadConfig, isConfigQuery, isThemeQuery, isSettingsQuery, openConfigInEditor } from './config'
import { getUsageBoost, recordUsage } from './database'
import { searchApps, launchApp, scanApps } from './app-scanner'
import { searchCalculator, copyCalcResult } from './calculator'
import { searchWeb, openWebSearch, openWebSearchByEngine, parseWebQuery } from './web-search'
import { searchCommands, searchSettingsCommands, executeCommand } from './commands'
import { searchClipboard, pasteClipboardText } from './clipboard'
import { searchPlugins, executePlugin } from './plugin-loader'
import { searchFiles, executeFileAction } from './file-search'
import { getRecentSearchResults, getQuickAccessApps } from './recents'
import { searchSnippets, executeSnippet } from './snippets'
import { enrichResultWithIcon } from './icon-extractor'
import { parseSearchQuery, isSettingsModeQuery } from './query-mode'
import { shell } from 'electron'
import type { SearchResult } from '../../src/types'

export { isClipboardModeQuery as isClipboardQuery } from './query-mode'

async function applyBoostAndIcons(results: SearchResult[]): Promise<SearchResult[]> {
  return Promise.all(results.map(async (r) => {
    const iconUrl = (await enrichResultWithIcon(r)) ?? undefined
    return {
      ...r,
      iconUrl,
      score: r.score + getUsageBoost(r.id, r.type),
    }
  }))
}

function dedupeResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>()
  return results.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
}

export function stableSortByScore(results: SearchResult[]): SearchResult[] {
  return results
    .map((r, index) => ({ r, index }))
    .sort((a, b) => {
      if (b.r.score !== a.r.score) return b.r.score - a.r.score
      const titleCmp = a.r.title.localeCompare(b.r.title, 'zh-CN')
      if (titleCmp !== 0) return titleCmp
      return a.index - b.index
    })
    .map(({ r }) => r)
}

function sortByScore(results: SearchResult[]): SearchResult[] {
  return stableSortByScore(results)
}

export function mergeTieredResults(
  tier1: SearchResult[],
  tier2: SearchResult[],
  tier3: SearchResult[],
  limit: number,
): SearchResult[] {
  return dedupeResults([...sortByScore(tier1), ...sortByScore(tier2), ...sortByScore(tier3)]).slice(0, limit)
}

export async function performSearch(query: string): Promise<SearchResult[]> {
  const config = loadConfig()
  const limit = config.maxResults
  const trimmed = query.trim()

  if (!trimmed) {
    return getRecentSearchResults(Math.min(limit, 10))
  }

  const parsed = parseSearchQuery(trimmed)

  if (parsed.mode === 'clipboard') {
    const results = searchClipboard(parsed.term)
    return applyBoostAndIcons(results.slice(0, limit))
  }

  if (parsed.mode === 'snippet') {
    const results = searchSnippets(parsed.term)
    return applyBoostAndIcons(results.slice(0, limit))
  }

  if (parsed.mode === 'settings') {
    const results = searchSettingsCommands(parsed.term)
    return applyBoostAndIcons(results.slice(0, limit))
  }

  const calcResults = searchCalculator(trimmed)
  const webResults = searchWeb(trimmed)
  const webActionResults = webResults.filter((r) => !r.payload.hint)
  const webHintResults = webResults.filter((r) => r.payload.hint)

  const apps = searchApps(trimmed, limit)
  const commands = searchCommands(trimmed)
  const pluginResults = await searchPlugins(trimmed)
  const snippetResults = searchSnippets(trimmed)

  const tier1: SearchResult[] = [...apps, ...calcResults]
  const tier2: SearchResult[] = [...commands, ...snippetResults, ...pluginResults, ...webActionResults]

  const tier3: SearchResult[] = []
  const hasWebPrefix = parseWebQuery(trimmed) !== null
  const primaryCount = apps.length + calcResults.length
  if (hasWebPrefix || primaryCount < 3) {
    tier3.push(...webHintResults)
  }

  const merged = mergeTieredResults(tier1, tier2, tier3, limit)
  return applyBoostAndIcons(merged)
}

/** File search only — called after fast results to avoid blocking the UI */
export async function performSearchFiles(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const parsed = parseSearchQuery(trimmed)
  if (parsed.mode !== 'default') return []

  const config = loadConfig()
  if (!config.fileSearch?.enabled) return []

  const files = await searchFiles(trimmed)
  return applyBoostAndIcons(files)
}

export async function executeResult(
  result: SearchResult,
  query?: string,
  actionId?: string,
): Promise<void> {
  if (result.payload.hint) return

  if (query && isConfigQuery(query)) {
    await openConfigInEditor()
    return
  }

  if (query && isThemeQuery(query)) {
    await executeCommand('toggle-theme')
    return
  }

  if (query && (isSettingsQuery(query) || isSettingsModeQuery(query))) {
    await executeCommand('open-settings')
    return
  }

  recordUsage(result.id, result.type)

  switch (result.type) {
    case 'app': {
      const path = result.payload.path as string
      if (actionId === 'reveal') {
        shell.showItemInFolder(path)
      } else {
        launchApp(path)
      }
      break
    }
    case 'file':
      await executeFileAction(result.payload.path as string, actionId ?? 'open')
      break
    case 'web':
      if (result.payload.url) {
        openWebSearch(result.payload.url as string)
      } else if (result.payload.engineId && result.payload.keyword) {
        openWebSearchByEngine(result.payload.engineId as string, result.payload.keyword as string)
      }
      break
    case 'calc':
      copyCalcResult(result.payload.result as string)
      break
    case 'command':
      await executeCommand(result.payload.commandId as string)
      break
    case 'clipboard':
      await pasteClipboardText(result.payload.text as string, actionId ?? 'paste')
      break
    case 'snippet':
      await executeSnippet(result.payload.snippetId as string, actionId ?? 'paste')
      break
    case 'plugin':
      await executePlugin(result)
      break
  }
}

export async function getQuickAccessResults(): Promise<SearchResult[]> {
  const config = loadConfig()
  const allApps = scanApps()

  if (config.quickAccess && config.quickAccess.length > 0) {
    return config.quickAccess
      .map((name) => allApps.find((a) => a.name.toLowerCase() === name.toLowerCase()))
      .filter((a): a is NonNullable<typeof a> => !!a)
      .slice(0, 8)
      .map((app) => ({
        id: app.id,
        type: 'app' as const,
        title: app.name,
        subtitle: app.path,
        score: 100,
        payload: { path: app.path },
      }))
  }

  return getQuickAccessApps(8)
}
