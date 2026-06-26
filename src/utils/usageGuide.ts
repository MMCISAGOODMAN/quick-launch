import { formatHotkey } from './formatHotkey'

export type AppPlatform = 'darwin' | 'win32' | 'linux' | 'unknown'

export interface UsageExample {
  input: string
  desc: string
}

export interface UsageShortcut {
  key: string
  desc: string
}

export interface UsageGuide {
  osName: string
  toggleHotkey: string
  toggleDesc: string
  examples: UsageExample[]
  shortcuts: UsageShortcut[]
  systemTip: string
}

const EXAMPLES: UsageExample[] = [
  { input: 'chrome', desc: '打开应用' },
  { input: 'g 关键词', desc: 'Google 搜索' },
  { input: '12*34', desc: '计算器' },
  { input: 'clip', desc: '剪贴板' },
  { input: 'snip', desc: '文本片段' },
  { input: '设置', desc: '打开设置' },
]

export function detectPlatform(raw?: string): AppPlatform {
  if (raw === 'darwin' || raw === 'win32' || raw === 'linux') return raw
  if (typeof navigator !== 'undefined') {
    const p = navigator.platform.toLowerCase()
    if (p.includes('mac')) return 'darwin'
    if (p.includes('win')) return 'win32'
    if (p.includes('linux')) return 'linux'
  }
  return 'unknown'
}

export function getUsageGuide(platform: AppPlatform, hotkey = 'Alt+Shift+Space'): UsageGuide {
  const toggleHotkey = formatHotkey(hotkey, platform === 'unknown' ? undefined : platform)

  if (platform === 'darwin') {
    return {
      osName: 'macOS',
      toggleHotkey,
      toggleDesc: '唤出 / 关闭',
      examples: EXAMPLES,
      shortcuts: [
        { key: '↑↓', desc: '选择' },
        { key: '↵', desc: '执行' },
        { key: 'Tab', desc: '切换动作' },
        { key: 'esc', desc: '关闭' },
        { key: '⌘T', desc: '主题' },
      ],
      systemTip: '顶部/搜索栏空白处可拖动窗口 · 菜单栏图标可退出',
    }
  }

  if (platform === 'win32') {
    return {
      osName: 'Windows',
      toggleHotkey,
      toggleDesc: '唤出 / 关闭',
      examples: EXAMPLES,
      shortcuts: [
        { key: '↑↓', desc: '选择' },
        { key: '↵', desc: '执行' },
        { key: 'Tab', desc: '切换动作' },
        { key: 'Esc', desc: '关闭' },
        { key: 'Ctrl+T', desc: '主题' },
      ],
      systemTip: '系统托盘图标右键可退出应用',
    }
  }

  if (platform === 'linux') {
    return {
      osName: 'Linux',
      toggleHotkey,
      toggleDesc: '唤出 / 关闭',
      examples: EXAMPLES,
      shortcuts: [
        { key: '↑↓', desc: '选择' },
        { key: '↵', desc: '执行' },
        { key: 'Tab', desc: '切换动作' },
        { key: 'Esc', desc: '关闭' },
        { key: 'Ctrl+T', desc: '主题' },
      ],
      systemTip: '系统托盘图标可退出应用',
    }
  }

  return {
    osName: 'Quick Launch',
    toggleHotkey: formatHotkey(hotkey),
    toggleDesc: '唤出 / 关闭',
    examples: EXAMPLES,
    shortcuts: [
      { key: '↑↓', desc: '选择' },
      { key: '↵', desc: '执行' },
      { key: 'Tab', desc: '动作' },
      { key: 'Esc', desc: '关闭' },
    ],
    systemTip: '',
  }
}
