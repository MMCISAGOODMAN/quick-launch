import { ref, watch } from 'vue'
import type { SearchResult } from '@/types'

const CONFIG_QUERY = /^(open\s+config|open-config|config|配置文件|设置文件)$/i
const THEME_QUERY = /^(theme|toggle-theme|切换主题|主题|深色|浅色|暗色|亮色)$/i
const SETTINGS_QUERY = /^(settings|设置|open-settings|打开设置|偏好|preferences?|shezhi|sz)$/i
const SETTINGS_PREFIX = /^设{1,2}$/
const SEARCH_DEBOUNCE_MS = 120

function isSettingsIntent(q: string): boolean {
  const trimmed = q.trim()
  return SETTINGS_QUERY.test(trimmed) || SETTINGS_PREFIX.test(trimmed)
}

function shouldFetchFiles(query: string): boolean {
  const q = query.trim()
  if (!q) return false
  if (/^(clip|cb|剪贴板|clipboard|snip|snippet|片段|设置|设|settings)/i.test(q)) return false
  return true
}

function mergeWithFiles(fast: SearchResult[], files: SearchResult[], limit: number): SearchResult[] {
  if (files.length === 0) return fast

  const withoutFiles = fast.filter((r) => r.type !== 'file')
  let insertAt = 0
  for (const r of withoutFiles) {
    if (r.type === 'app' || r.type === 'calc') insertAt++
    else break
  }

  const sortedFiles = [...files].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.title.localeCompare(b.title, 'zh-CN')
  })

  const merged = [
    ...withoutFiles.slice(0, insertAt),
    ...sortedFiles,
    ...withoutFiles.slice(insertAt),
  ]

  const seen = new Set<string>()
  return merged.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  }).slice(0, limit)
}

function preserveSelection(
  prevResults: SearchResult[],
  prevIndex: number,
  nextResults: SearchResult[],
): number {
  const prevId = prevResults[prevIndex]?.id
  if (!prevId) return 0
  const idx = nextResults.findIndex((r) => r.id === prevId)
  return idx >= 0 ? idx : 0
}

export function useSearch() {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const selectedIndex = ref(0)
  const loading = ref(false)
  const filesLoading = ref(false)
  const selectedActionIndex = ref(0)
  const actionsExpanded = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let searchSeq = 0

  function applyResults(next: SearchResult[], seq: number) {
    if (seq !== searchSeq) return
    selectedIndex.value = preserveSelection(results.value, selectedIndex.value, next)
    results.value = next
    selectedActionIndex.value = 0
    actionsExpanded.value = false
  }

  async function doSearch(q: string) {
    if (!window.electronAPI) return

    const seq = ++searchSeq
    const hadResults = results.value.length > 0
    loading.value = !hadResults

    try {
      const fast = await window.electronAPI.search(q)
      if (seq !== searchSeq) return
      applyResults(fast, seq)
      loading.value = false

      if (!shouldFetchFiles(q)) {
        filesLoading.value = false
        return
      }

      filesLoading.value = true
      const files = await window.electronAPI.searchFiles(q)
      if (seq !== searchSeq) return

      const limit = fast.length >= 20 ? 20 : Math.max(fast.length, 20)
      const merged = mergeWithFiles(fast, files, limit)
      applyResults(merged, seq)
    } finally {
      if (seq === searchSeq) {
        loading.value = false
        filesLoading.value = false
      }
    }
  }

  async function flushSearch() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    await doSearch(query.value)
  }

  watch(query, (q) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => doSearch(q), SEARCH_DEBOUNCE_MS)
  })

  watch(selectedIndex, () => {
    selectedActionIndex.value = 0
    actionsExpanded.value = false
  })

  function moveSelection(delta: number) {
    if (results.value.length === 0) return
    selectedIndex.value = (selectedIndex.value + delta + results.value.length) % results.value.length
  }

  function cycleAction() {
    const result = results.value[selectedIndex.value]
    if (!result?.actions?.length) return
    actionsExpanded.value = true
    selectedActionIndex.value = (selectedActionIndex.value + 1) % result.actions.length
  }

  function getActiveActionId(result: SearchResult): string | undefined {
    if (!result.actions?.length) return undefined
    if (!actionsExpanded.value) return result.actions[0].id
    return result.actions[selectedActionIndex.value % result.actions.length].id
  }

  async function executeAt(index: number) {
    if (!window.electronAPI) return
    const result = results.value[index]
    if (!result) return
    selectedIndex.value = index
    const actionId = getActiveActionId(result)
    await window.electronAPI.execute(result, query.value, actionId)
  }

  async function executeSelected(): Promise<'open-settings' | void> {
    if (!window.electronAPI) return

    await flushSearch()

    const trimmed = query.value.trim()

    if (CONFIG_QUERY.test(trimmed)) {
      await window.electronAPI.openConfig()
      return
    }

    if (THEME_QUERY.test(trimmed)) {
      await window.electronAPI.toggleTheme()
      return
    }

    if (isSettingsIntent(trimmed)) {
      return 'open-settings' as const
    }

    await executeAt(selectedIndex.value)
  }

  async function executeQuickAccess(result: SearchResult) {
    if (!window.electronAPI) return
    await window.electronAPI.execute(result)
  }

  function reset() {
    searchSeq++
    query.value = ''
    results.value = []
    selectedIndex.value = 0
    selectedActionIndex.value = 0
    actionsExpanded.value = false
    loading.value = false
    filesLoading.value = false
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  return {
    query,
    results,
    selectedIndex,
    loading,
    filesLoading,
    selectedActionIndex,
    actionsExpanded,
    moveSelection,
    cycleAction,
    executeSelected,
    executeAt,
    executeQuickAccess,
    reset,
    doSearch,
  }
}
