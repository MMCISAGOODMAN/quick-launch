import { ref, watch } from 'vue'
import type { SearchResult } from '@/types'

const CONFIG_QUERY = /^(open\s+config|open-config|config|配置文件|设置文件)$/i
const THEME_QUERY = /^(theme|toggle-theme|切换主题|主题|深色|浅色|暗色|亮色)$/i
const SETTINGS_QUERY = /^(settings|设置|open-settings|打开设置)$/i

export function useSearch() {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const selectedIndex = ref(0)
  const loading = ref(false)
  const selectedActionIndex = ref(0)
  const actionsExpanded = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function doSearch(q: string) {
    if (!window.electronAPI) return
    loading.value = true
    try {
      results.value = await window.electronAPI.search(q)
      selectedIndex.value = 0
      selectedActionIndex.value = 0
      actionsExpanded.value = false
    } finally {
      loading.value = false
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
    debounceTimer = setTimeout(() => doSearch(q), 50)
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

    if (SETTINGS_QUERY.test(trimmed)) {
      return 'open-settings' as const
    }

    await executeAt(selectedIndex.value)
  }

  async function executeQuickAccess(result: SearchResult) {
    if (!window.electronAPI) return
    await window.electronAPI.execute(result)
  }

  function reset() {
    query.value = ''
    results.value = []
    selectedIndex.value = 0
    selectedActionIndex.value = 0
    actionsExpanded.value = false
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
