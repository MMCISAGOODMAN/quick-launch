<script setup lang="ts">
import { computed } from 'vue'
import type { SearchResult } from '@/types'
import { getResultIconLetter } from '@/utils/resultIcon'

const props = defineProps<{
  result: SearchResult
  selected: boolean
  selectedActionIndex: number
  actionsExpanded: boolean
}>()

const typeLabel = computed(() => {
  const labels: Record<string, string> = {
    app: '应用',
    web: '网页',
    calc: '计算',
    command: '命令',
    clipboard: '剪贴板',
    plugin: '插件',
    file: '文件',
    snippet: '片段',
  }
  return labels[props.result.type] || ''
})

const iconLetter = computed(() =>
  getResultIconLetter(props.result.type, props.result.title),
)

const actions = computed(() => props.result.actions ?? [])

const activeAction = computed(() => {
  if (!actions.value.length) return null
  const idx = props.actionsExpanded
    ? props.selectedActionIndex % actions.value.length
    : 0
  return actions.value[idx]
})

const actionHint = computed(() => {
  if (activeAction.value) return activeAction.value.label
  if (props.result.type === 'calc') return '复制结果'
  if (props.result.type === 'clipboard' || props.result.type === 'snippet') return '粘贴'
  return '打开'
})
</script>

<template>
  <div class="result-item" :class="{ selected, 'has-actions': actions.length > 0 && actionsExpanded }">
    <div class="icon">
      <img v-if="result.iconUrl" :src="result.iconUrl" class="icon-img" alt="" />
      <span v-else>{{ iconLetter }}</span>
    </div>
    <div class="content">
      <div class="title-row">
        <span class="title">{{ result.title }}</span>
        <span class="type-badge">{{ typeLabel }}</span>
      </div>
      <div v-if="result.subtitle" class="subtitle">{{ result.subtitle }}</div>
      <div v-if="selected && actionsExpanded && actions.length > 1" class="action-panel">
        <button
          v-for="(action, idx) in actions"
          :key="action.id"
          class="action-btn"
          :class="{ active: idx === selectedActionIndex % actions.length }"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
    <div v-if="selected" class="action-hint">
      <template v-if="actions.length > 1">
        <kbd>Tab</kbd> 切换动作
      </template>
      <template v-else>
        <kbd>↵</kbd> {{ actionHint }}
      </template>
    </div>
  </div>
</template>

<style scoped>
.result-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s ease;
  gap: 12px;
}

.result-item:hover,
.result-item.selected {
  background: var(--bg-selected);
}

.icon {
  font-size: 13px;
  font-weight: 600;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-radius: 8px;
  color: var(--text-secondary);
  overflow: hidden;
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.content {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-muted);
  flex-shrink: 0;
}

.subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.action-panel {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.action-btn {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
}

.action-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.action-hint {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

kbd {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  font-family: inherit;
  font-size: 10px;
}
</style>
