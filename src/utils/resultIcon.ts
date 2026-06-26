import type { ResultType } from '@/types'

const TYPE_LETTERS: Record<ResultType, string> = {
  app: 'A',
  web: 'W',
  calc: '=',
  command: '$',
  clipboard: 'C',
  plugin: 'P',
  file: 'F',
  snippet: 'S',
}

export function getResultIconLetter(type: ResultType, title: string): string {
  if (type === 'app' || type === 'file') {
    const letter = title.trim().charAt(0)
    return letter ? letter.toUpperCase() : TYPE_LETTERS[type]
  }
  return TYPE_LETTERS[type] ?? '?'
}
