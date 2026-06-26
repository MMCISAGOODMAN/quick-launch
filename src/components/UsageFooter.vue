<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { detectPlatform, getUsageGuide, type UsageGuide } from '@/utils/usageGuide'

defineProps<{
  theme: 'dark' | 'light'
}>()

defineEmits<{
  toggleTheme: []
}>()

const guide = ref<UsageGuide | null>(null)

onMounted(async () => {
  let platform = detectPlatform()
  let hotkey = 'Alt+Shift+Space'

  if (window.electronAPI) {
    try {
      const [status, config] = await Promise.all([
        window.electronAPI.getAccessibilityStatus(),
        window.electronAPI.getConfig(),
      ])
      platform = detectPlatform(status.platform)
      hotkey = config.hotkey || hotkey
    } catch { /* use defaults */ }
  }

  guide.value = getUsageGuide(platform, hotkey)
})
</script>

<template>
  <footer v-if="guide" class="usage-footer window-drag">
    <div class="usage-main">
      <div class="usage-row">
        <span class="os-badge">{{ guide.osName }}</span>
        <span class="usage-item hotkey-item">
          <kbd>{{ guide.toggleHotkey }}</kbd>
          {{ guide.toggleDesc }}
        </span>
        <span class="divider">|</span>
        <span
          v-for="(ex, i) in guide.examples"
          :key="ex.input"
          class="usage-item example-item"
        >
          <kbd>{{ ex.input }}</kbd>{{ ex.desc }}<span v-if="i < guide.examples.length - 1" class="dot">·</span>
        </span>
      </div>

      <div class="usage-row secondary">
        <span
          v-for="(sc, i) in guide.shortcuts"
          :key="sc.key"
          class="usage-item"
        >
          <kbd>{{ sc.key }}</kbd>{{ sc.desc }}<span v-if="i < guide.shortcuts.length - 1" class="dot">·</span>
        </span>
        <template v-if="guide.systemTip">
          <span class="divider">|</span>
          <span class="system-tip">{{ guide.systemTip }}</span>
        </template>
      </div>
    </div>

    <button class="theme-toggle window-no-drag" title="切换暗色/亮色主题" @click="$emit('toggleTheme')">
      主题：{{ theme === 'dark' ? '暗色' : '亮色' }}
    </button>
  </footer>
</template>

<style scoped>
.usage-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
  cursor: grab;
}

.usage-footer:active {
  cursor: grabbing;
}

.usage-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.usage-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 0;
}

.usage-row.secondary {
  opacity: 0.9;
}

.os-badge {
  display: inline-block;
  padding: 1px 6px;
  margin-right: 8px;
  border-radius: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.usage-item {
  white-space: nowrap;
}

.hotkey-item {
  margin-right: 4px;
  color: var(--text-secondary);
  font-weight: 500;
}

.example-item {
  margin-right: 2px;
}

.divider {
  margin: 0 8px;
  opacity: 0.35;
  user-select: none;
}

.dot {
  margin: 0 6px;
  opacity: 0.35;
  user-select: none;
}

.system-tip {
  color: var(--text-secondary);
  font-size: 10px;
}

kbd {
  display: inline-block;
  padding: 1px 5px;
  margin-right: 3px;
  border-radius: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  font-family: inherit;
  font-size: 10px;
  color: var(--text-primary);
}

.theme-toggle {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  transition: background 0.15s;
  flex-shrink: 0;
  align-self: center;
}

.theme-toggle:hover {
  background: var(--bg-hover);
}
</style>
