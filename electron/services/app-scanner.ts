import { readdirSync, statSync, existsSync, readFileSync } from 'fs'
import { join, basename, extname } from 'path'
import { execSync, execFileSync } from 'child_process'
import { platform } from 'os'
import { loadConfig } from './config'
import { matchScore } from '../utils/fuzzy'
import type { SearchResult } from '../../src/types'

export interface AppInfo {
  id: string
  name: string
  path: string
  displayName?: string
  bundleName?: string
  icon?: string
}

let cachedApps: AppInfo[] | null = null
let lastScanTime = 0
const SCAN_CACHE_TTL = 5 * 60 * 1000

function readMacAppPlist(appPath: string): { displayName?: string; bundleName?: string } {
  const plistPath = join(appPath, 'Contents', 'Info.plist')
  if (!existsSync(plistPath)) return {}

  try {
    const json = execFileSync('plutil', ['-convert', 'json', '-o', '-', plistPath], {
      encoding: 'utf-8',
      timeout: 2000,
    })
    const data = JSON.parse(json) as Record<string, string>
    return {
      displayName: data.CFBundleDisplayName || data.CFBundleName,
      bundleName: data.CFBundleName,
    }
  } catch {
    try {
      const content = readFileSync(plistPath, 'utf-8')
      const displayMatch = content.match(/<key>CFBundleDisplayName<\/key>\s*<string>([^<]+)<\/string>/)
      const nameMatch = content.match(/<key>CFBundleName<\/key>\s*<string>([^<]+)<\/string>/)
      return {
        displayName: displayMatch?.[1] || nameMatch?.[1],
        bundleName: nameMatch?.[1],
      }
    } catch {
      return {}
    }
  }
}

function scanMacApps(): AppInfo[] {
  const apps: AppInfo[] = []
  const paths = [
    '/Applications',
    '/System/Applications',
    join(process.env.HOME || '', 'Applications'),
  ]
  const config = loadConfig()
  paths.push(...(config.appScanPaths || []))

  for (const basePath of paths) {
    if (!existsSync(basePath)) continue
    scanMacDirectory(basePath, apps)
  }
  return apps
}

function scanMacDirectory(dir: string, apps: AppInfo[]): void {
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      try {
        if (entry.endsWith('.app')) {
          const folderName = entry.replace('.app', '')
          const plist = readMacAppPlist(fullPath)
          const displayName = plist.displayName || folderName
          apps.push({
            id: `app:${fullPath}`,
            name: displayName,
            path: fullPath,
            displayName,
            bundleName: plist.bundleName,
          })
        } else if (statSync(fullPath).isDirectory() && !entry.startsWith('.')) {
          scanMacDirectory(fullPath, apps)
        }
      } catch { /* skip inaccessible */ }
    }
  } catch { /* skip */ }
}

function scanWindowsApps(): AppInfo[] {
  const apps: AppInfo[] = []
  const paths = [
    join(process.env.ProgramFiles || 'C:\\Program Files'),
    join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'),
    join(process.env.LOCALAPPDATA || '', 'Programs'),
  ]

  for (const basePath of paths) {
    if (!existsSync(basePath)) continue
    scanWindowsDirectory(basePath, apps, 0)
  }

  try {
    const startMenu = join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs')
    if (existsSync(startMenu)) scanWindowsLnk(startMenu, apps)
  } catch { /* skip */ }

  return apps
}

function scanWindowsDirectory(dir: string, apps: AppInfo[], depth: number): void {
  if (depth > 3) return
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry)
      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory()) {
          scanWindowsDirectory(fullPath, apps, depth + 1)
        } else if (/\.(exe|lnk)$/i.test(entry)) {
          const name = basename(entry, extname(entry))
          apps.push({ id: `app:${fullPath}`, name, path: fullPath, displayName: name })
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
}

function scanWindowsLnk(dir: string, apps: AppInfo[]): void {
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry)
      if (entry.endsWith('.lnk')) {
        const name = basename(entry, '.lnk')
        apps.push({ id: `app:${fullPath}`, name, path: fullPath, displayName: name })
      } else if (statSync(fullPath).isDirectory()) {
        scanWindowsLnk(fullPath, apps)
      }
    }
  } catch { /* skip */ }
}

function scanLinuxApps(): AppInfo[] {
  const apps: AppInfo[] = []
  const paths = [
    '/usr/share/applications',
    '/usr/local/share/applications',
    join(process.env.HOME || '', '.local/share/applications'),
  ]

  for (const basePath of paths) {
    if (!existsSync(basePath)) continue
    try {
      for (const entry of readdirSync(basePath)) {
        if (!entry.endsWith('.desktop')) continue
        const fullPath = join(basePath, entry)
        try {
          const content = readFileSync(fullPath, 'utf-8')
          const nameMatch = content.match(/^Name=(.+)$/m)
          const execMatch = content.match(/^Exec=(.+)$/m)
          const hidden = content.match(/^NoDisplay=true$/m) || content.match(/^Hidden=true$/m)
          if (hidden || !nameMatch) continue
          const name = nameMatch[1].trim()
          const exec = execMatch?.[1]?.replace(/%[fuFUFU]/g, '').trim() || fullPath
          apps.push({ id: `app:${fullPath}`, name, path: exec, displayName: name })
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }
  return apps
}

export function scanApps(force = false): AppInfo[] {
  const now = Date.now()
  if (!force && cachedApps && now - lastScanTime < SCAN_CACHE_TTL) {
    return cachedApps
  }

  const os = platform()
  if (os === 'darwin') cachedApps = scanMacApps()
  else if (os === 'win32') cachedApps = scanWindowsApps()
  else cachedApps = scanLinuxApps()

  cachedApps = deduplicateApps(cachedApps)
  lastScanTime = now
  return cachedApps
}

function deduplicateApps(apps: AppInfo[]): AppInfo[] {
  const seen = new Map<string, AppInfo>()
  for (const app of apps) {
    if (!seen.has(app.path)) seen.set(app.path, app)
  }
  return Array.from(seen.values())
}

function appSearchFields(app: AppInfo): string[] {
  const folderName = basename(app.path).replace(/\.app$/, '')
  return [
    app.displayName || app.name,
    app.name,
    app.bundleName || '',
    folderName,
  ].filter(Boolean)
}

export function searchApps(query: string, limit: number): SearchResult[] {
  const apps = scanApps()
  if (!query.trim()) {
    return []
  }

  return apps
    .map((app) => ({
      app,
      score: matchScore(query, appSearchFields(app)),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ app, score }) => ({
      id: app.id,
      type: 'app' as const,
      title: app.displayName || app.name,
      subtitle: app.path,
      score,
      payload: { path: app.path },
      actions: [
        { id: 'open', label: '打开' },
        { id: 'reveal', label: '在 Finder 中显示' },
      ],
    }))
}

export function launchApp(path: string): void {
  const os = platform()
  try {
    if (os === 'darwin') {
      execSync(`open "${path.replace(/"/g, '\\"')}"`, { stdio: 'ignore' })
    } else if (os === 'win32') {
      execSync(`start "" "${path.replace(/"/g, '\\"')}"`, { stdio: 'ignore', shell: 'cmd.exe' })
    } else {
      execSync(`xdg-open "${path.replace(/"/g, '\\"')}"`, { stdio: 'ignore' })
    }
  } catch (err) {
    console.error('Failed to launch app:', err)
  }
}

export function initAppScanner(): void {
  setImmediate(() => scanApps(true))
}
