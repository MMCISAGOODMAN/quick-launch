import { describe, it, expect } from 'vitest'
import {
  parseSearchQuery,
  isClipboardModeQuery,
  isSnippetModeQuery,
  isSettingsModeQuery,
} from '../electron/services/query-mode'

describe('parseSearchQuery', () => {
  it('detects clipboard mode without trailing space', () => {
    expect(parseSearchQuery('clip').mode).toBe('clipboard')
    expect(parseSearchQuery('clip').term).toBe('')
    expect(parseSearchQuery('剪贴板').mode).toBe('clipboard')
  })

  it('detects clipboard mode with filter term', () => {
    const parsed = parseSearchQuery('clip hello')
    expect(parsed.mode).toBe('clipboard')
    expect(parsed.term).toBe('hello')
  })

  it('detects snippet mode without trailing space', () => {
    expect(parseSearchQuery('snip').mode).toBe('snippet')
    expect(parseSearchQuery('片段').mode).toBe('snippet')
  })

  it('detects snippet mode with filter term', () => {
    const parsed = parseSearchQuery('snip email')
    expect(parsed.mode).toBe('snippet')
    expect(parsed.term).toBe('email')
  })

  it('detects settings mode for 设置', () => {
    expect(parseSearchQuery('设置').mode).toBe('settings')
  })

  it('detects settings mode for partial 设', () => {
    expect(parseSearchQuery('设').mode).toBe('settings')
  })

  it('defaults for normal app search', () => {
    expect(parseSearchQuery('chrome').mode).toBe('default')
  })
})

describe('mode query helpers', () => {
  it('isClipboardModeQuery accepts clip without space', () => {
    expect(isClipboardModeQuery('clip')).toBe(true)
    expect(isClipboardModeQuery('chrome')).toBe(false)
  })

  it('isSnippetModeQuery accepts snip without space', () => {
    expect(isSnippetModeQuery('snip')).toBe(true)
  })

  it('isSettingsModeQuery accepts 设置 and 设', () => {
    expect(isSettingsModeQuery('设置')).toBe(true)
    expect(isSettingsModeQuery('设')).toBe(true)
  })
})
