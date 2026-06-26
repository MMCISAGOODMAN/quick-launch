export type ResultType = 'app' | 'web' | 'calc' | 'command' | 'clipboard' | 'plugin' | 'file' | 'snippet'

export interface ResultAction {
  id: string
  label: string
}

export interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle?: string
  score: number
  iconUrl?: string
  payload: Record<string, unknown>
  actions?: ResultAction[]
}

export interface SearchEngine {
  id: string
  name: string
  prefix: string
  url: string
}

export interface CustomCommand {
  id: string
  name: string
  command: string
  shell?: boolean
  description?: string
}

export interface Snippet {
  id: string
  name: string
  trigger: string
  text: string
  autoPaste?: boolean
}

export interface FileSearchConfig {
  enabled: boolean
  maxResults: number
  searchPaths: string[]
  excludePatterns: string[]
}

export interface AppConfig {
  hotkey: string
  theme: 'dark' | 'light' | 'system'
  searchEngines: SearchEngine[]
  customCommands: CustomCommand[]
  snippets?: Snippet[]
  quickAccess?: string[]
  fileSearch?: FileSearchConfig
  maxResults: number
  clipboardHistorySize: number
  appScanPaths?: string[]
  window: {
    width: number
    height: number
  }
}

export interface UsageRecord {
  itemId: string
  itemType: string
  count: number
  lastUsed: number
}

export interface ClipboardItem {
  id: string
  text: string
  timestamp: number
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  main: string
  keywords?: string[]
}

export interface ElectronAPI {
  search: (query: string) => Promise<SearchResult[]>
  execute: (result: SearchResult, query?: string, actionId?: string) => Promise<void>
  openConfig: () => Promise<void>
  toggleTheme: () => Promise<'dark' | 'light'>
  hideWindow: () => void
  getConfig: () => Promise<AppConfig>
  saveConfig: (config: Partial<AppConfig>) => Promise<AppConfig>
  reloadConfig: () => Promise<AppConfig>
  getQuickAccess: () => Promise<SearchResult[]>
  getAccessibilityStatus: () => Promise<{ granted: boolean; platform: string }>
  dismissOnboarding: () => Promise<void>
  shouldShowOnboarding: () => Promise<boolean>
  getAppIcon: (path: string) => Promise<string | null>
  setTheme: (theme: 'dark' | 'light') => Promise<void>
  onThemeChanged: (callback: (theme: 'dark' | 'light') => void) => () => void
  onWindowShown: (callback: () => void) => () => void
  onWindowHidden: (callback: () => void) => () => void
  onOpenSettings: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
