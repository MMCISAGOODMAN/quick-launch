import { app, ipcMain, nativeTheme } from 'electron'
import { createMainWindow, hideWindow, runWithoutBlurHide, getMainWindow, showWindow } from './services/window'
import { registerHotkey, unregisterHotkey, reregisterHotkey } from './services/hotkey'
import { initDatabase, closeDatabase } from './services/database'
import { initAppScanner } from './services/app-scanner'
import { startClipboardMonitor, stopClipboardMonitor } from './services/clipboard'
import { loadPlugins } from './services/plugin-loader'
import { performSearch, performSearchFiles, executeResult, getQuickAccessResults } from './services/search-engine'
import {
  loadConfig,
  saveConfig,
  reloadConfig,
  openConfigInEditor,
  isThemeQuery,
  shouldShowOnboarding,
  dismissOnboarding,
} from './services/config'
import { createTray, destroyTray } from './services/tray'
import { isAccessibilityGranted, promptAccessibility } from './services/accessibility'
import { getAppIconDataUrl } from './services/icon-extractor'
import type { SearchResult } from '../src/types'

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showWindow()
  })
}

function toggleThemeHandler(): void {
  const config = loadConfig()
  const nextTheme = config.theme === 'light' ? 'dark' : 'light'
  nativeTheme.themeSource = nextTheme
  saveConfig({ theme: nextTheme })
  getMainWindow()?.webContents.send('theme-changed', nextTheme)
}

app.whenReady().then(async () => {
  await initDatabase()
  loadConfig()
  loadPlugins()
  initAppScanner()
  startClipboardMonitor()

  createMainWindow()
  const hotkeyOk = registerHotkey()
  createTray(toggleThemeHandler)

  if (process.platform === 'darwin') {
    app.dock?.hide()
    if (!hotkeyOk && !isAccessibilityGranted()) {
      promptAccessibility()
    }
  }
})

app.on('window-all-closed', () => {
  // background app
})

app.on('will-quit', () => {
  unregisterHotkey()
  stopClipboardMonitor()
  destroyTray()
  closeDatabase()
})

ipcMain.handle('search', async (_event, query: string) => performSearch(query))

ipcMain.handle('search-files', async (_event, query: string) => performSearchFiles(query))

ipcMain.handle('execute', async (_event, result: SearchResult, query?: string, actionId?: string) => {
  const keepOpen = (query && isThemeQuery(query))
    || (result.type === 'command' && result.payload.commandId === 'toggle-theme')
    || (result.type === 'command' && result.payload.commandId === 'open-settings')

  await runWithoutBlurHide(async () => {
    await executeResult(result, query, actionId)
  })

  if (!keepOpen) hideWindow()
})

ipcMain.handle('open-config', async () => {
  await runWithoutBlurHide(async () => openConfigInEditor())
  hideWindow()
})

ipcMain.handle('hide-window', () => hideWindow())

ipcMain.handle('get-config', () => loadConfig())

ipcMain.handle('save-config', (_event, partial) => {
  const prevHotkey = loadConfig().hotkey
  const saved = saveConfig(partial)
  if (partial.hotkey && partial.hotkey !== prevHotkey) {
    reregisterHotkey()
  }
  return saved
})

ipcMain.handle('reload-config', () => {
  reloadConfig()
  reregisterHotkey()
  return loadConfig()
})

ipcMain.handle('get-quick-access', () => getQuickAccessResults())

ipcMain.handle('get-accessibility-status', () => ({
  granted: isAccessibilityGranted(),
  platform: process.platform,
}))

ipcMain.handle('should-show-onboarding', () => shouldShowOnboarding())

ipcMain.handle('dismiss-onboarding', () => {
  dismissOnboarding()
})

ipcMain.handle('get-app-icon', (_event, path: string) => getAppIconDataUrl(path))

ipcMain.handle('toggle-theme', () => {
  toggleThemeHandler()
  return loadConfig().theme as 'dark' | 'light'
})

ipcMain.handle('set-theme', (_event, theme: 'dark' | 'light') => {
  nativeTheme.themeSource = theme
  saveConfig({ theme })
  getMainWindow()?.webContents.send('theme-changed', theme)
})

ipcMain.on('ready', () => {
  const config = loadConfig()
  nativeTheme.themeSource = config.theme === 'system' ? 'system' : config.theme
})
