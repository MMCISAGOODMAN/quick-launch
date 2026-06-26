import { clipboard } from 'electron'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import { loadConfig } from './config'
import { saveClipboardItem, getClipboardHistory, trimClipboardHistory } from './database'
import { matchScore } from '../utils/fuzzy'
import type { SearchResult } from '../../src/types'

const execFileAsync = promisify(execFile)

let lastClipboardText = ''
let monitorInterval: ReturnType<typeof setInterval> | null = null

export async function simulatePaste(): Promise<void> {
  if (process.platform === 'darwin') {
    await execFileAsync('osascript', [
      '-e', 'tell application "System Events" to keystroke "v" using command down',
    ]).catch(() => { /* fallback: already copied */ })
    return
  }

  if (process.platform === 'win32') {
    await execFileAsync('powershell.exe', [
      '-Command',
      'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")',
    ]).catch(() => { /* ignore */ })
  }
}

export function startClipboardMonitor(): void {
  lastClipboardText = clipboard.readText()
  monitorInterval = setInterval(() => {
    try {
      const text = clipboard.readText()
      if (text && text !== lastClipboardText) {
        lastClipboardText = text
        const config = loadConfig()
        saveClipboardItem(randomUUID(), text)
        trimClipboardHistory(config.clipboardHistorySize)
      }
    } catch { /* ignore */ }
  }, 1000)
}

export function stopClipboardMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
  }
}

/** @param term filter term (empty = show recent history) */
export function searchClipboard(term = ''): SearchResult[] {
  const config = loadConfig()
  const items = getClipboardHistory(config.clipboardHistorySize)

  if (!term) {
    if (items.length === 0) {
      return [{
        id: 'clip:empty',
        type: 'clipboard',
        title: '暂无剪贴板历史',
        subtitle: '复制一些文字后会自动出现在这里',
        score: 100,
        payload: { text: '', hint: true },
      }]
    }
    return items.slice(0, 15).map((item, i) => toResult(item, 100 - i))
  }

  return items
    .map((item) => ({ item, score: matchScore(term, [item.text]) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(({ item, score }) => toResult(item, score))
}

function toResult(item: { id: string; text: string; timestamp: number }, score: number): SearchResult {
  const preview = item.text.length > 80 ? item.text.slice(0, 80) + '…' : item.text
  return {
    id: `clip:${item.id}`,
    type: 'clipboard',
    title: preview,
    subtitle: new Date(item.timestamp).toLocaleString(),
    score,
    payload: { text: item.text },
    actions: [
      { id: 'paste', label: '粘贴' },
      { id: 'copy', label: '复制' },
    ],
  }
}

export async function pasteClipboardText(text: string, actionId = 'paste'): Promise<void> {
  if (!text) return
  clipboard.writeText(text)
  if (actionId === 'paste') {
    await simulatePaste()
  }
}
