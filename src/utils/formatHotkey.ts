/**
 * Format Electron accelerator strings for display.
 * On macOS, "Alt" in config maps to the Option (⌥) key — not a separate "Alt" key.
 */
export function formatHotkey(hotkey: string, platform?: string): string {
  const isMac = platform
    ? platform === 'darwin'
    : typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

  if (!isMac) {
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

export function hotkeyConfigHint(platform?: string): string {
  const isMac = platform
    ? platform === 'darwin'
    : typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

  if (isMac) {
    return '配置文件写 Alt+Shift+Space，即键盘上的 ⌥ Option + ⇧ Shift + 空格'
  }
  return '例如 Alt+Shift+Space'
}

export const DEFAULT_HOTKEY_DISPLAY = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  ? '⌥ + ⇧ + 空格'
  : 'Alt + Shift + Space'
