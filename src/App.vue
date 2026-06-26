<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import SearchBar from './components/SearchBar.vue'
import ResultList from './components/ResultList.vue'
import QuickAccess from './components/QuickAccess.vue'
import HelloTagline from './components/HelloTagline.vue'
import Onboarding from './components/Onboarding.vue'
import Settings from './views/Settings.vue'
import UsageFooter from './components/UsageFooter.vue'
import { useSearch } from './composables/useSearch'
import { useTheme } from './composables/useTheme'
import type { SearchResult } from './types'

const searchBarRef = ref<InstanceType<typeof SearchBar> | null>(null)
const {
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
} = useSearch()
const { theme, toggleTheme } = useTheme()

const showOnboarding = ref(false)
const showSettings = ref(false)

const showIdleView = computed(() => !query.value.trim() && !loading.value)
const showHelloTagline = computed(() => !query.value.trim() && !loading.value)

function handleEscape() {
  if (showSettings.value) {
    showSettings.value = false
    return
  }
  if (window.electronAPI) {
    window.electronAPI.hideWindow()
  }
}

function handleSelect(index: number) {
  selectedIndex.value = index
}

async function handleExecute(index: number) {
  await executeAt(index)
}

async function handleSubmit() {
  const result = await executeSelected()
  if (result === 'open-settings') {
    showSettings.value = true
  }
}

async function handleQuickAccess(result: SearchResult) {
  await executeQuickAccess(result)
}

onMounted(async () => {
  if (!window.electronAPI) return

  const shouldShow = await window.electronAPI.shouldShowOnboarding()
  showOnboarding.value = shouldShow

  window.electronAPI.onWindowShown(() => {
    reset()
    searchBarRef.value?.focus()
    if (!query.value.trim()) {
      doSearch('')
    }
  })

  window.electronAPI.onWindowHidden(() => {
    reset()
    showSettings.value = false
  })

  window.electronAPI.onOpenSettings(() => {
    showSettings.value = true
  })
})
</script>

<template>
  <div class="launcher" :data-theme="theme">
    <div class="launcher-panel">
      <div class="window-drag-bar window-drag" title="拖动窗口">
        <span class="drag-grip" aria-hidden="true" />
      </div>
      <SearchBar
        ref="searchBarRef"
        v-model="query"
        @submit="handleSubmit"
        @escape="handleEscape"
        @arrow-up="moveSelection(-1)"
        @arrow-down="moveSelection(1)"
        @toggle-theme="toggleTheme"
        @cycle-action="cycleAction"
      />
      <div class="content-area">
        <QuickAccess
          :visible="showIdleView"
          @execute="handleQuickAccess"
        />
        <ResultList
          :results="results"
          :selected-index="selectedIndex"
          :loading="loading"
          :files-loading="filesLoading"
          :selected-action-index="selectedActionIndex"
          :actions-expanded="actionsExpanded"
          :idle="showIdleView"
          @select="handleSelect"
          @execute="handleExecute"
        />
        <div v-if="showHelloTagline" class="hello-center window-no-drag">
          <HelloTagline :visible="showHelloTagline" />
        </div>
      </div>
      <UsageFooter :theme="theme" @toggle-theme="toggleTheme" />
    </div>

    <Onboarding v-if="showOnboarding" @dismiss="showOnboarding = false" />
    <Settings v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<style scoped>
.launcher {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0;
  position: relative;
}

.launcher-panel {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.window-drag-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12px;
  flex-shrink: 0;
  cursor: grab;
}

.window-drag-bar:active {
  cursor: grabbing;
}

.drag-grip {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--text-muted);
  opacity: 0.45;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.hello-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
  padding-bottom: 24px;
}
</style>
