import { execFile } from 'child_process'
import { promisify } from 'util'
import { homedir } from 'os'
import { join, basename } from 'path'
import { existsSync, statSync } from 'fs'
import { platform } from 'os'
import { shell, clipboard } from 'electron'
import { loadConfig } from './config'
import { combinedScore } from '../utils/fuzzy'
import type { SearchResult } from '../../src/types'

const execFileAsync = promisify(execFile)

function expandHome(p: string): string {
  if (p === '~') return homedir()
  return p.startsWith('~/') ? join(homedir(), p.slice(2)) : p
}

function shouldExclude(path: string, patterns: string[]): boolean {
  return patterns.some((p) => path.includes(p))
}

function filterPaths(
  paths: string[],
  searchPaths: string[],
  exclude: string[],
): string[] {
  const expanded = searchPaths.map(expandHome)
  return paths
    .filter((p) => existsSync(p))
    .filter((p) => !shouldExclude(p, exclude))
    .filter((p) => expanded.length === 0 || expanded.some((sp) => p.startsWith(sp)))
}

function buildMdfindArgs(query: string, searchPaths: string[]): string[] {
  const expanded = searchPaths.map(expandHome)
  if (expanded.length === 1) {
    return ['-onlyin', expanded[0], '-name', query]
  }
  // Empty searchPaths: search entire Spotlight index (all volumes)
  return ['-name', query]
}

async function searchMacFiles(query: string, limit: number): Promise<string[]> {
  const config = loadConfig()
  const fsConfig = config.fileSearch
  if (!fsConfig?.enabled) return []

  const searchPaths = fsConfig.searchPaths ?? []
  const exclude = fsConfig.excludePatterns ?? ['node_modules', '.git', 'Library/Caches']

  try {
    const { stdout } = await execFileAsync('mdfind', buildMdfindArgs(query, searchPaths), {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    })

    const paths = stdout.trim().split('\n').filter(Boolean)
    return filterPaths(paths, searchPaths, exclude).slice(0, limit * 3)
  } catch {
    return []
  }
}

async function searchLinuxFiles(query: string, limit: number): Promise<string[]> {
  const config = loadConfig()
  if (!config.fileSearch?.enabled) return []

  const searchPaths = (config.fileSearch.searchPaths ?? []).map(expandHome)
  const exclude = config.fileSearch.excludePatterns ?? ['node_modules', '.git']
  const roots = searchPaths.length > 0 ? searchPaths : ['/', '/home', '/mnt', '/media']

  // Prefer locate for full-disk speed when available
  if (searchPaths.length === 0) {
    try {
      const { stdout } = await execFileAsync('locate', ['-i', query], {
        timeout: 3000,
        maxBuffer: 1024 * 512,
      })
      const paths = stdout.trim().split('\n').filter(Boolean)
      return filterPaths(paths, [], exclude).slice(0, limit * 3)
    } catch { /* fall through to find */ }
  }

  const collected: string[] = []
  for (const root of roots) {
    if (!existsSync(root)) continue
    try {
      const { stdout } = await execFileAsync('find', [
        root, '-iname', `*${query}*`, '-type', 'f',
        '-not', '-path', '*/node_modules/*',
        '-not', '-path', '*/.git/*',
      ], { timeout: 5000, maxBuffer: 1024 * 256 })
      collected.push(...stdout.trim().split('\n').filter(Boolean))
      if (collected.length >= limit * 3) break
    } catch { /* try next root */ }
  }

  return filterPaths(collected, searchPaths, exclude).slice(0, limit * 3)
}

async function searchWindowsFiles(query: string, limit: number): Promise<string[]> {
  const config = loadConfig()
  if (!config.fileSearch?.enabled) return []

  const searchPaths = config.fileSearch.searchPaths ?? []
  const safeQuery = query.replace(/"/g, '')
  const perRoot = limit * 2

  let ps: string
  if (searchPaths.length > 0) {
    const paths = searchPaths.map((p) => expandHome(p).replace(/'/g, "''")).join("','")
    ps = `$paths=@('${paths}'); foreach($p in $paths){ Get-ChildItem -Path $p -Recurse -File -Filter "*${safeQuery}*" -ErrorAction SilentlyContinue | Select-Object -First ${perRoot} -ExpandProperty FullName }`
  } else {
    ps = `Get-PSDrive -PSProvider FileSystem | ForEach-Object { Get-ChildItem -Path $_.Root -Recurse -File -Filter "*${safeQuery}*" -ErrorAction SilentlyContinue | Select-Object -First ${perRoot} -ExpandProperty FullName }`
  }

  try {
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', ps], {
      timeout: 12000,
      maxBuffer: 1024 * 512,
    })
    const exclude = config.fileSearch.excludePatterns ?? ['node_modules', '.git']
    return filterPaths(stdout.trim().split('\r\n').filter(Boolean), searchPaths, exclude)
      .slice(0, limit * 3)
  } catch {
    return []
  }
}

function pathToResult(filePath: string, query: string): SearchResult {
  const name = basename(filePath)
  let isDirectory = false
  try {
    isDirectory = statSync(filePath).isDirectory()
  } catch { /* skip */ }

  const score = combinedScore(query, name) + (name.toLowerCase() === query.toLowerCase() ? 30 : 0)

  return {
    id: `file:${filePath}`,
    type: 'file',
    title: name,
    subtitle: filePath,
    score,
    payload: { path: filePath, isDirectory },
    actions: [
      { id: 'open', label: '打开' },
      { id: 'reveal', label: '在 Finder 中显示' },
      { id: 'copy-path', label: '复制路径' },
    ],
  }
}

export async function searchFiles(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const config = loadConfig()
  const limit = config.fileSearch?.maxResults ?? 15
  if (!config.fileSearch?.enabled) return []

  const os = platform()
  let paths: string[] = []
  if (os === 'darwin') paths = await searchMacFiles(query, limit)
  else if (os === 'win32') paths = await searchWindowsFiles(query, limit)
  else paths = await searchLinuxFiles(query, limit)

  return paths
    .map((p) => pathToResult(p, query))
    .filter((r) => r.score > 0 || query.length >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function openFile(path: string): void {
  shell.openPath(path)
}

export function revealFile(path: string): void {
  shell.showItemInFolder(path)
}

export function copyPath(path: string): void {
  clipboard.writeText(path)
}

export async function executeFileAction(path: string, actionId: string): Promise<void> {
  switch (actionId) {
    case 'reveal':
      revealFile(path)
      break
    case 'copy-path':
      copyPath(path)
      break
    default:
      openFile(path)
  }
}
