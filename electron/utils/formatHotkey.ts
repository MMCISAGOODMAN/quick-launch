import { platform } from 'os'

/**
 * Format Electron accelerator for human-readable display.
 * On macOS, config "Alt" = ⌥ Option key.
 */
export function formatHotkey(hotkey: string, os = platform()): string {
  if (os !== 'darwin') {
    return hotkey.replace(/\+/g, ' + ')
  }

  return hotkey
    .replace(/CommandOrControl/gi, '⌘')
    .replace(/Command/gi, '⌘')
    .replace(/Control/gi, '⌃')
    .replace(/Alt/gi, '⌥')
    .replace(/Shift/gi, '⇧')
    .replace(/\+/g, ' + ')
    .replace(/\bSpace\b/g, '空格')
}

export function formatHotkeyLog(hotkey: string, os = platform()): string {
  if (os !== 'darwin') return hotkey
  return `${formatHotkey(hotkey, os)}（配置项：${hotkey}）`
}
