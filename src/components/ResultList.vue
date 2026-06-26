<script setup lang="ts">
import type { SearchResult } from '@/types'
import ResultItem from './ResultItem.vue'

defineProps<{
  results: SearchResult[]
  selectedIndex: number
  loading: boolean
  selectedActionIndex: number
  actionsExpanded: boolean
  idle?: boolean
}>()

const emit = defineEmits<{
  select: [index: number]
  execute: [index: number]
}>()
</script>

<template>
  <div class="result-list window-no-drag">
    <div v-if="loading" class="loading-state">
      <span class="spinner" />
      <span>搜索中…</span>
    </div>
    <template v-else>
      <div v-if="results.length === 0 && !idle" class="empty-state">
        <p>未找到结果</p>
        <p class="hint">试试其他关键词</p>
      </div>
      <div v-if="idle && results.length > 0" class="section-label">最近使用</div>
      <template v-if="results.length > 0">
        <ResultItem
          v-for="(result, index) in results"
          :key="result.id"
          :result="result"
          :selected="index === selectedIndex"
          :selected-action-index="selectedActionIndex"
          :actions-expanded="actionsExpanded && index === selectedIndex"
          @click="emit('select', index); emit('execute', index)"
          @mouseenter="emit('select', index)"
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.result-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
  position: relative;
  z-index: 1;
}

.section-label {
  padding: 4px 12px 6px;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: var(--text-muted);
  gap: 8px;
}

.empty-state p {
  font-size: 14px;
}

.hint {
  font-size: 12px !important;
  opacity: 0.7;
}
</style>
