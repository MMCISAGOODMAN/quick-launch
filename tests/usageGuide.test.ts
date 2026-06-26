import { describe, it, expect } from 'vitest'
import { getUsageGuide } from '../src/utils/usageGuide'

describe('getUsageGuide', () => {
  it('shows Mac-friendly hotkey labels', () => {
    const guide = getUsageGuide('darwin', 'Alt+Shift+Space')
    expect(guide.osName).toBe('macOS')
    expect(guide.toggleHotkey).toContain('⌥')
    expect(guide.toggleHotkey).toContain('⇧')
    expect(guide.shortcuts.some((s) => s.key === '⌘T')).toBe(true)
    expect(guide.systemTip).toContain('拖动')
  })

  it('shows Windows hotkey labels', () => {
    const guide = getUsageGuide('win32', 'Alt+Shift+Space')
    expect(guide.osName).toBe('Windows')
    expect(guide.toggleHotkey).toBe('Alt + Shift + Space')
    expect(guide.shortcuts.some((s) => s.key === 'Ctrl+T')).toBe(true)
  })

  it('includes common search examples', () => {
    const guide = getUsageGuide('linux')
    expect(guide.examples.some((e) => e.input === '设置')).toBe(true)
    expect(guide.examples.some((e) => e.input === 'g 关键词')).toBe(true)
  })
})
