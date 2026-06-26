<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { AppConfig } from '@/types'
import { formatHotkey, hotkeyConfigHint } from '@/utils/formatHotkey'

const emit = defineEmits<{
  close: []
}>()

const config = ref<AppConfig | null>(null)
const hotkey = ref('')
const theme = ref<'dark' | 'light'>('dark')
const fileSearchEnabled = ref(true)
const fileSearchPaths = ref('')
const quickAccess = ref('')
const saving = ref(false)
const message = ref('')

const hotkeyPreview = computed(() => formatHotkey(hotkey.value || 'Alt+Shift+Space'))
const hotkeyHint = computed(() => hotkeyConfigHint())

onMounted(async () => {
  if (!window.electronAPI) return
  config.value = await window.electronAPI.getConfig()
  hotkey.value = config.value.hotkey
  theme.value = config.value.theme === 'light' ? 'light' : 'dark'
  fileSearchEnabled.value = config.value.fileSearch?.enabled ?? true
  fileSearchPaths.value = (config.value.fileSearch?.searchPaths ?? []).join('\n')
  quickAccess.value = (config.value.quickAccess ?? []).join(', ')
})

async function save() {
  if (!window.electronAPI) return
  saving.value = true
  message.value = ''
  try {
    await window.electronAPI.saveConfig({
      hotkey: hotkey.value.trim(),
      theme: theme.value,
      fileSearch: {
        enabled: fileSearchEnabled.value,
        maxResults: config.value?.fileSearch?.maxResults ?? 15,
        searchPaths: fileSearchPaths.value.split('\n').map((s) => s.trim()).filter(Boolean),
        excludePatterns: config.value?.fileSearch?.excludePatterns ?? ['node_modules', '.git'],
      },
      quickAccess: quickAccess.value.split(',').map((s) => s.trim()).filter(Boolean),
    })
    await window.electronAPI.setTheme(theme.value)
    message.value = '已保存，热键已重新注册'
    setTimeout(() => { message.value = '' }, 2500)
  } finally {
    saving.value = false
  }
}

async function openConfigFile() {
  if (window.electronAPI) {
    await window.electronAPI.openConfig()
  }
}
</script>

<template>
  <div class="settings-overlay window-no-drag" @click.self="emit('close')">
    <div class="settings-panel">
      <div class="header">
        <h2>设置</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="form">
        <label>
          <span>全局热键</span>
          <input v-model="hotkey" type="text" placeholder="Alt+Shift+Space" />
          <span class="field-hint">当前：{{ hotkeyPreview }} · {{ hotkeyHint }}</span>
        </label>

        <label>
          <span>主题</span>
          <select v-model="theme">
            <option value="dark">暗色</option>
            <option value="light">亮色</option>
          </select>
        </label>

        <label class="checkbox-row">
          <input v-model="fileSearchEnabled" type="checkbox" />
          <span>启用文件搜索</span>
        </label>

        <label>
          <span>文件搜索路径（每行一个，留空 = 整个磁盘）</span>
          <textarea v-model="fileSearchPaths" rows="3" placeholder="留空表示搜索整个磁盘&#10;~/Projects 可限定目录" />
        </label>

        <label>
          <span>快捷访问应用（逗号分隔）</span>
          <input v-model="quickAccess" type="text" placeholder="Google Chrome, Cursor" />
        </label>
      </div>

      <div class="actions">
        <button class="secondary-btn" @click="openConfigFile">打开配置文件</button>
        <button class="primary-btn" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>

      <p v-if="message" class="message">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 16px;
}

.settings-panel {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: calc(100% - 32px);
  max-width: 480px;
  max-height: calc(100% - 32px);
  overflow-y: auto;
  padding: 20px;
  box-shadow: var(--shadow);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

h2 {
  font-size: 18px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.checkbox-row {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

input[type="text"],
select,
textarea {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
}

.field-hint {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}

textarea {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.primary-btn,
.secondary-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--border-color);
}

.primary-btn {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.primary-btn:disabled {
  opacity: 0.6;
}

.secondary-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.message {
  margin-top: 12px;
  font-size: 12px;
  color: var(--accent);
  text-align: center;
}
</style>
