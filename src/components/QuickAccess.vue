<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { SearchResult } from '@/types'
import { getResultIconLetter } from '@/utils/resultIcon'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  execute: [result: SearchResult]
}>()

const items = ref<SearchResult[]>([])

async function loadQuickAccess() {
  if (!window.electronAPI) return
  items.value = await window.electronAPI.getQuickAccess()
}

onMounted(() => {
  if (props.visible) loadQuickAccess()
})

watch(() => props.visible, (v) => {
  if (v) loadQuickAccess()
})

function iconLetter(item: SearchResult): string {
  return getResultIconLetter(item.type, item.title)
}
</script>

<template>
  <div v-if="visible && items.length > 0" class="quick-access window-no-drag">
    <span class="label">快捷访问</span>
    <div class="chips">
      <button
        v-for="item in items"
        :key="item.id"
        class="chip"
        :title="item.subtitle"
        @click="emit('execute', item)"
      >
        <img v-if="item.iconUrl" :src="item.iconUrl" class="chip-icon" alt="" />
        <span v-else class="chip-letter">{{ iconLetter(item) }}</span>
        <span class="chip-name">{{ item.title }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.quick-access {
  padding: 10px 16px 4px;
  border-bottom: 1px solid var(--border-color);
}

.label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  cursor: pointer;
  font-size: 12px;
  color: var(--text-primary);
  transition: background 0.12s;
  max-width: 140px;
}

.chip:hover {
  background: var(--bg-hover);
}

.chip-icon {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
}

.chip-letter {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.chip-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
