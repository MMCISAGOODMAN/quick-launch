import { app, Tray, Menu, nativeImage } from 'electron'
import { showWindow, toggleWindow } from './window'
import { openConfigInEditor, getTrayIconPath } from './config'

let tray: Tray | null = null

function getTrayIcon(): Electron.NativeImage {
  try {
    const img = nativeImage.createFromPath(getTrayIconPath())
    if (!img.isEmpty()) {
      return process.platform === 'darwin' ? img.resize({ width: 18, height: 18 }) : img
    }
  } catch { /* fallback */ }

  return nativeImage.createFromBuffer(
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
  )
}

export function createTray(onToggleTheme: () => void): Tray {
  if (tray) return tray

  tray = new Tray(getTrayIcon())
  tray.setToolTip('Quick Launch')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开搜索',
      click: () => showWindow(),
    },
    {
      label: '切换主题',
      click: () => onToggleTheme(),
    },
    {
      label: '打开配置',
      click: () => openConfigInEditor(),
    },
    { type: 'separator' },
    {
      label: '退出 Quick Launch',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => toggleWindow())

  return tray
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}

export function showTrayBalloon(title: string, body: string): void {
  if (!tray) return
  try {
    tray.displayBalloon({ title, content: body })
  } catch {
    console.warn(`Tray notification: ${title} - ${body}`)
  }
}

export function getTray(): Tray | null {
  return tray
}
