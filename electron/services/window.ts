import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { loadConfig } from './config'

let mainWindow: BrowserWindow | null = null
let isVisible = false
let suppressBlurHide = false

export function createMainWindow(): BrowserWindow {
  const config = loadConfig()
  const { width, height } = config.window

  const display = screen.getPrimaryDisplay()
  const { width: screenW, height: screenH } = display.workAreaSize

  mainWindow = new BrowserWindow({
    width,
    height,
    x: Math.round((screenW - width) / 2),
    y: Math.round(screenH * 0.25),
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Only hide on explicit actions (Esc, execute, hotkey toggle) — not on blur
  mainWindow.on('closed', () => {
    mainWindow = null
    isVisible = false
  })

  return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function toggleWindow(): void {
  if (isVisible) {
    hideWindow()
  } else {
    showWindow()
  }
}

export function showWindow(): void {
  if (!mainWindow) return
  isVisible = true
  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.send('window-shown')
}

export function hideWindow(): void {
  if (!mainWindow || !isVisible) return
  isVisible = false
  mainWindow.hide()
  mainWindow.webContents.send('window-hidden')
}

export function isWindowVisible(): boolean {
  return isVisible
}

export async function runWithoutBlurHide<T>(fn: () => Promise<T>): Promise<T> {
  suppressBlurHide = true
  try {
    return await fn()
  } finally {
    setTimeout(() => {
      suppressBlurHide = false
    }, 300)
  }
}
