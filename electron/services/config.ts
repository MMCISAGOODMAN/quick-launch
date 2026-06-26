import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { dirname, join } from 'path'
import { execFile } from 'child_process'
import { shell, app } from 'electron'
import type { AppConfig, CustomCommand } from '../../src/types'
import { getConfigPath, getDefaultConfigPath, getUserDataPath } from '../utils/paths'

export const BUILTIN_COMMANDS: CustomCommand[] = [
  {
    id: 'open-config',
    name: 'Open Config',
    command: 'open-config',
    shell: false,
    description: 'Open Quick Launch config file',
  },
  {
    id: 'toggle-theme',
    name: '切换主题',
    command: 'toggle-theme',
    shell: false,
    description: '在暗色 / 亮色主题间切换',
  },
  {
    id: 'open-settings',
    name: '设置',
    command: 'open-settings',
    shell: false,
    description: '打开 Quick Launch 可视化设置',
  },
]

const DEFAULT_CONFIG: AppConfig = {
  hotkey: 'Alt+Shift+Space',
  theme: 'dark',
  maxResults: 20,
  clipboardHistorySize: 50,
  window: { width: 680, height: 420 },
  searchEngines: [
    { id: 'google', name: 'Google', prefix: 'g', url: 'https://www.google.com/search?q={query}' },
    { id: 'baidu', name: 'Baidu', prefix: 'bd', url: 'https://www.baidu.com/s?wd={query}' },
    { id: 'github', name: 'GitHub', prefix: 'gh', url: 'https://github.com/search?q={query}' },
  ],
  customCommands: [
    { id: 'restart-nginx', name: 'Restart Nginx', command: 'sudo nginx -s reload', shell: true, description: 'Reload nginx' },
    ...BUILTIN_COMMANDS,
  ],
  snippets: [
    { id: 'email', name: '邮箱签名', trigger: 'email', text: 'Best regards,\nYour Name', autoPaste: true },
  ],
  quickAccess: [],
  fileSearch: {
    enabled: true,
    maxResults: 15,
    searchPaths: [],
    excludePatterns: ['node_modules', '.git', 'Library/Caches'],
  },
  appScanPaths: [],
}

const LEGACY_FILE_SEARCH_PATHS = ['~/Documents', '~/Desktop', '~/Downloads']
const HOME_SEARCH_PATHS = ['~']

function isLegacyFileSearchPaths(paths: string[] | undefined): boolean {
  if (!paths || paths.length !== LEGACY_FILE_SEARCH_PATHS.length) return false
  const sorted = [...paths].sort()
  const legacy = [...LEGACY_FILE_SEARCH_PATHS].sort()
  return sorted.every((p, i) => p === legacy[i])
}

function isHomeOnlySearchPaths(paths: string[] | undefined): boolean {
  if (!paths || paths.length !== 1) return false
  return paths[0] === '~' || paths[0] === HOME_SEARCH_PATHS[0]
}

let cachedConfig: AppConfig | null = null

export function isConfigQuery(query: string): boolean {
  const q = query.trim().toLowerCase()
  return /^(open\s+config|open-config|config|配置文件|设置文件)$/.test(q)
}

export function isThemeQuery(query: string): boolean {
  const q = query.trim().toLowerCase()
  return /^(theme|toggle-theme|切换主题|主题|深色|浅色|暗色|亮色)$/.test(q)
}

export function isSettingsQuery(query: string): boolean {
  const q = query.trim().toLowerCase()
  return /^(settings|设置|open-settings|打开设置|偏好|preferences?)$/.test(q)
}

export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig

  const configPath = getConfigPath()
  if (!existsSync(configPath)) {
    const dir = dirname(configPath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    const defaultPath = getDefaultConfigPath()
    if (existsSync(defaultPath)) {
      copyFileSync(defaultPath, configPath)
    } else {
      writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
    }
  }

  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    cachedConfig = {
      ...DEFAULT_CONFIG,
      ...parsed,
      customCommands: parsed.customCommands ?? DEFAULT_CONFIG.customCommands,
      searchEngines: parsed.searchEngines ?? DEFAULT_CONFIG.searchEngines,
      fileSearch: { ...DEFAULT_CONFIG.fileSearch!, ...parsed.fileSearch },
      snippets: parsed.snippets ?? DEFAULT_CONFIG.snippets,
      quickAccess: parsed.quickAccess ?? DEFAULT_CONFIG.quickAccess,
    }

    // Migrate legacy default hotkey (conflicts with macOS input source switcher)
    if (cachedConfig.hotkey === 'Alt+Space') {
      cachedConfig.hotkey = 'Alt+Shift+Space'
      writeFileSync(configPath, JSON.stringify(cachedConfig, null, 2), 'utf-8')
      console.log('Migrated hotkey: Alt+Space → Alt+Shift+Space')
    }

    // Migrate legacy file search paths → entire disk (empty searchPaths)
    if (isLegacyFileSearchPaths(cachedConfig.fileSearch?.searchPaths)
      || isHomeOnlySearchPaths(cachedConfig.fileSearch?.searchPaths)) {
      cachedConfig.fileSearch = { ...cachedConfig.fileSearch!, searchPaths: [] }
      writeFileSync(configPath, JSON.stringify(cachedConfig, null, 2), 'utf-8')
      console.log('Migrated fileSearch.searchPaths → [] (entire disk)')
    }
  } catch {
    cachedConfig = DEFAULT_CONFIG
  }

  return cachedConfig!
}

export function saveConfig(config: Partial<AppConfig>): AppConfig {
  const current = loadConfig()
  cachedConfig = { ...current, ...config }
  writeFileSync(getConfigPath(), JSON.stringify(cachedConfig, null, 2), 'utf-8')
  return cachedConfig
}

export function reloadConfig(): AppConfig {
  cachedConfig = null
  return loadConfig()
}

export function shouldShowOnboarding(): boolean {
  const flagPath = join(getUserDataPath(), '.onboarding-done')
  return !existsSync(flagPath)
}

export function dismissOnboarding(): void {
  const flagPath = join(getUserDataPath(), '.onboarding-done')
  writeFileSync(flagPath, '1', 'utf-8')
}

export async function openConfigInEditor(): Promise<void> {
  loadConfig()
  const configPath = getConfigPath()

  const openError = await shell.openPath(configPath)
  if (!openError) return

  console.error('shell.openPath failed:', openError)

  await new Promise<void>((resolve) => {
    if (process.platform === 'darwin') {
      execFile('open', ['-e', configPath], (err) => {
        if (err) {
          execFile('open', [configPath], () => {
            shell.showItemInFolder(configPath)
            resolve()
          })
        } else {
          resolve()
        }
      })
      return
    }

    if (process.platform === 'win32') {
      execFile('notepad.exe', [configPath], (err) => {
        if (err) shell.showItemInFolder(configPath)
        resolve()
      })
      return
    }

    execFile('xdg-open', [configPath], (err) => {
      if (err) shell.showItemInFolder(configPath)
      resolve()
    })
  })
}

export function getTrayIconPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icon.png')
  }
  return join(app.getAppPath(), 'resources/icon.png')
}
