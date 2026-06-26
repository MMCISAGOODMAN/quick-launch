import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getPluginsPath } from '../utils/paths'
import { getPluginData, setPluginData } from './database'
import type { SearchResult, PluginManifest } from '../../src/types'

interface LoadedPlugin {
  manifest: PluginManifest
  search?: (query: string) => SearchResult[] | Promise<SearchResult[]>
  execute?: (result: SearchResult) => void | Promise<void>
}

const plugins: LoadedPlugin[] = []

export function loadPlugins(): void {
  const pluginsPath = getPluginsPath()
  if (!existsSync(pluginsPath)) return

  try {
    const dirs = readdirSync(pluginsPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)

    for (const dir of dirs) {
      const manifestPath = join(pluginsPath, dir, 'manifest.json')
      if (!existsSync(manifestPath)) continue

      try {
        const manifest: PluginManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        const mainPath = join(pluginsPath, dir, manifest.main)

        if (existsSync(mainPath)) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pluginModule = require(mainPath)
          const api = createPluginAPI(manifest.id)
          if (typeof pluginModule.init === 'function') {
            pluginModule.init(api)
          }
          plugins.push({
            manifest,
            search: pluginModule.search,
            execute: pluginModule.execute,
          })
          console.log(`Loaded plugin: ${manifest.name}`)
        }
      } catch (err) {
        console.error(`Failed to load plugin ${dir}:`, err)
      }
    }
  } catch (err) {
    console.error('Failed to scan plugins:', err)
  }
}

export async function searchPlugins(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  for (const plugin of plugins) {
    if (!plugin.search) continue
    try {
      const pluginResults = await plugin.search(query)
      results.push(...pluginResults.map((r) => ({
        ...r,
        type: 'plugin' as const,
        payload: { ...r.payload, pluginId: plugin.manifest.id },
      })))
    } catch (err) {
      console.error(`Plugin ${plugin.manifest.id} search error:`, err)
    }
  }

  return results
}

export async function executePlugin(result: SearchResult): Promise<void> {
  const pluginId = result.payload.pluginId as string
  const plugin = plugins.find((p) => p.manifest.id === pluginId)
  if (plugin?.execute) {
    await plugin.execute(result)
  }
}

export function createPluginAPI(pluginId: string) {
  const iconPaths = new Map<string, string>()

  return {
    getData: (key: string) => getPluginData(pluginId, key),
    setData: (key: string, value: string) => setPluginData(pluginId, key, value),
    registerIcon: (itemId: string, iconPath: string) => {
      iconPaths.set(itemId, iconPath)
    },
    getIconPath: (itemId: string) => iconPaths.get(itemId) ?? null,
  }
}

export function getLoadedPlugins(): PluginManifest[] {
  return plugins.map((p) => p.manifest)
}
