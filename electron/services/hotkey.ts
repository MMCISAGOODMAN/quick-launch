import { globalShortcut } from 'electron'
import { loadConfig } from './config'
import { toggleWindow } from './window'
import { showTrayBalloon } from './tray'
import { formatHotkey, formatHotkeyLog } from '../utils/formatHotkey'

let registeredHotkey: string | null = null

export function registerHotkey(): boolean {
  const config = loadConfig()
  const hotkey = config.hotkey || 'Alt+Shift+Space'

  if (registeredHotkey) {
    globalShortcut.unregister(registeredHotkey)
  }

  const success = globalShortcut.register(hotkey, () => {
    toggleWindow()
  })

  if (success) {
    registeredHotkey = hotkey
    console.log(`Hotkey registered: ${formatHotkeyLog(hotkey)}`)
  } else {
    console.error(`Failed to register hotkey: ${formatHotkeyLog(hotkey)}`)
    showTrayBalloon(
      'Quick Launch',
      `热键 ${formatHotkey(hotkey)} 注册失败。请在系统设置 > 隐私与安全性 > 辅助功能中授权本应用。`,
    )
  }

  return success
}

export function unregisterHotkey(): void {
  if (registeredHotkey) {
    globalShortcut.unregister(registeredHotkey)
    registeredHotkey = null
  }
}

export function reregisterHotkey(): boolean {
  unregisterHotkey()
  return registerHotkey()
}

export function getRegisteredHotkey(): string | null {
  return registeredHotkey
}
