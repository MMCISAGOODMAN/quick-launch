import { loadConfig } from './config'
import { matchScore } from '../utils/fuzzy'
import type { SearchResult, Snippet } from '../../src/types'
import { clipboard } from 'electron'
import { simulatePaste } from './clipboard'

export function getSnippets(): Snippet[] {
  const config = loadConfig()
  return config.snippets ?? []
}

/** @param term filter term (empty = show all snippets) */
export function searchSnippets(term = ''): SearchResult[] {
  const snippets = getSnippets()

  if (snippets.length === 0) {
    return [{
      id: 'snippet:empty',
      type: 'snippet',
      title: '暂无文本片段',
      subtitle: '在 config.json 的 snippets 字段中添加',
      score: 100,
      payload: { snippetId: '', text: '', hint: true },
    }]
  }

  if (!term) {
    return snippets.map((s, i) => toResult(s, 100 - i))
  }

  return snippets
    .map((s) => ({
      snippet: s,
      score: Math.max(matchScore(term, [s.name, s.trigger]), matchScore(term, [s.text])),
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
    subtitle: `${snippet.trigger ? `#${snippet.trigger} · ` : ''}${preview}`,
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
