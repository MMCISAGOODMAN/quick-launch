import { contextBridge, ipcRenderer } from 'electron'
import type { SearchResult, AppConfig } from '../src/types'

const electronAPI = {
  search: (query: string): Promise<SearchResult[]> =>
    ipcRenderer.invoke('search', query),

  execute: (result: SearchResult, query?: string, actionId?: string): Promise<void> =>
    ipcRenderer.invoke('execute', result, query, actionId),

  openConfig: (): Promise<void> =>
    ipcRenderer.invoke('open-config'),

  hideWindow: (): void => {
    ipcRenderer.invoke('hide-window')
  },

  getConfig: (): Promise<AppConfig> =>
    ipcRenderer.invoke('get-config'),

  saveConfig: (config: Partial<AppConfig>): Promise<AppConfig> =>
    ipcRenderer.invoke('save-config', config),

  reloadConfig: (): Promise<AppConfig> =>
    ipcRenderer.invoke('reload-config'),

  getQuickAccess: (): Promise<SearchResult[]> =>
    ipcRenderer.invoke('get-quick-access'),

  getAccessibilityStatus: (): Promise<{ granted: boolean; platform: string }> =>
    ipcRenderer.invoke('get-accessibility-status'),

  shouldShowOnboarding: (): Promise<boolean> =>
    ipcRenderer.invoke('should-show-onboarding'),

  dismissOnboarding: (): Promise<void> =>
    ipcRenderer.invoke('dismiss-onboarding'),

  getAppIcon: (path: string): Promise<string | null> =>
    ipcRenderer.invoke('get-app-icon', path),

  toggleTheme: (): Promise<'dark' | 'light'> =>
    ipcRenderer.invoke('toggle-theme'),

  setTheme: (theme: 'dark' | 'light'): Promise<void> =>
    ipcRenderer.invoke('set-theme', theme),

  onThemeChanged: (callback: (theme: 'dark' | 'light') => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: 'dark' | 'light') => callback(theme)
    ipcRenderer.on('theme-changed', handler)
    return () => ipcRenderer.removeListener('theme-changed', handler)
  },

  onWindowShown: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('window-shown', handler)
    return () => ipcRenderer.removeListener('window-shown', handler)
  },

  onWindowHidden: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('window-hidden', handler)
    return () => ipcRenderer.removeListener('window-hidden', handler)
  },

  onOpenSettings: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('open-settings', handler)
    return () => ipcRenderer.removeListener('open-settings', handler)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
ipcRenderer.send('ready')
