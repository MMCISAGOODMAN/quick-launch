import { loadConfig } from './config'
import { combinedScore } from '../utils/fuzzy'
import type { SearchResult, Snippet } from '../../src/types'
import { clipboard } from 'electron'
import { simulatePaste } from './clipboard'

export function getSnippets(): Snippet[] {
  const config = loadConfig()
  return config.snippets ?? []
}

export function searchSnippets(query: string): SearchResult[] {
  const snippets = getSnippets()
  const trimmed = query.trim()

  if (trimmed.toLowerCase().startsWith('snip ') || trimmed.toLowerCase().startsWith('s ')) {
    const term = trimmed.replace(/^(snip|s)\s+/i, '')
    return snippets
      .filter((s) => !term || combinedScore(term, s.name) > 0 || combinedScore(term, s.trigger) > 0)
      .map((s) => toResult(s, 90))
  }

  if (!trimmed) return []

  return snippets
    .map((s) => ({
      snippet: s,
      score: Math.max(combinedScore(trimmed, s.name), combinedScore(trimmed, s.trigger)),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ snippet, score }) => toResult(snippet, score))
}

function toResult(snippet: Snippet, score: number): SearchResult {
  const preview = snippet.text.length > 60 ? snippet.text.slice(0, 60) + '…' : snippet.text
  return {
    id: `snippet:${snippet.id}`,
    type: 'snippet',
    title: snippet.name,
    subtitle: preview,
    score,
    payload: { snippetId: snippet.id, text: snippet.text, autoPaste: snippet.autoPaste ?? false },
    actions: [
      { id: 'paste', label: '粘贴' },
      { id: 'copy', label: '复制' },
    ],
  }
}

export async function executeSnippet(snippetId: string, actionId = 'paste'): Promise<void> {
  const snippet = getSnippets().find((s) => s.id === snippetId)
  if (!snippet) return

  clipboard.writeText(snippet.text)

  if (actionId === 'paste' && (snippet.autoPaste ?? true)) {
    await simulatePaste()
  }
}
