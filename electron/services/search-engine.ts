import { loadConfig, isConfigQuery, isThemeQuery, isSettingsQuery, openConfigInEditor } from './config'
import { getUsageBoost, recordUsage } from './database'
import { searchApps, launchApp, scanApps } from './app-scanner'
import { searchCalculator, copyCalcResult } from './calculator'
import { searchWeb, openWebSearch, openWebSearchByEngine } from './web-search'
import { searchCommands, executeCommand } from './commands'
import { searchClipboard, pasteClipboardText } from './clipboard'
import { searchPlugins, executePlugin } from './plugin-loader'
import { searchFiles, executeFileAction } from './file-search'
import { getRecentSearchResults, getQuickAccessApps } from './recents'
import { searchSnippets, executeSnippet } from './snippets'
import { enrichResultWithIcon } from './icon-extractor'
import { shell } from 'electron'
import type { SearchResult } from '../../src/types'

export async function performSearch(query: string): Promise<SearchResult[]> {
  const config = loadConfig()
  const limit = config.maxResults
  const trimmed = query.trim()

  if (!trimmed) {
    return getRecentSearchResults(Math.min(limit, 10))
  }

  const results: SearchResult[] = []

  const calcResults = searchCalculator(trimmed)
  if (calcResults.length > 0) results.push(...calcResults)

  const webResults = searchWeb(trimmed)
  if (webResults.some((r) => !r.payload.hint)) {
    results.push(...webResults.filter((r) => !r.payload.hint))
  }

  if (trimmed.toLowerCase().startsWith('clip ') || trimmed.toLowerCase().startsWith('cb ')) {
    results.push(...searchClipboard(trimmed))
  }

  const [apps, commands, files, clipboardResults, pluginResults, snippetResults] = await Promise.all([
    Promise.resolve(searchApps(trimmed, limit)),
    Promise.resolve(searchCommands(trimmed)),
    searchFiles(trimmed),
    Promise.resolve(trimmed.toLowerCase().startsWith('clip ') ? [] : searchClipboard(trimmed)),
    searchPlugins(trimmed),
    Promise.resolve(searchSnippets(trimmed)),
  ])

  results.push(...apps, ...commands, ...files, ...clipboardResults, ...pluginResults, ...snippetResults)

  if (!webResults.some((r) => !r.payload.hint)) {
    results.push(...webResults)
  }

  const boosted = await Promise.all(results.map(async (r) => {
    const iconUrl = (await enrichResultWithIcon(r)) ?? undefined
    return {
      ...r,
      iconUrl,
      score: r.score + getUsageBoost(r.id, r.type),
    }
  }))

  const seen = new Set<string>()
  const deduped = boosted
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

  return deduped.slice(0, limit)
}

export async function executeResult(
  result: SearchResult,
  query?: string,
  actionId?: string,
): Promise<void> {
  if (query && isConfigQuery(query)) {
    await openConfigInEditor()
    return
  }

  if (query && isThemeQuery(query)) {
    await executeCommand('toggle-theme')
    return
  }

  if (query && isSettingsQuery(query)) {
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
