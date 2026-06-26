<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { formatHotkey } from '@/utils/formatHotkey'

const emit = defineEmits<{
  dismiss: []
}>()

const granted = ref(true)
const platform = ref('')

const defaultHotkey = computed(() => formatHotkey('Alt+Shift+Space', platform.value || undefined))

onMounted(async () => {
  if (!window.electronAPI) return
  const status = await window.electronAPI.getAccessibilityStatus()
  granted.value = status.granted
  platform.value = status.platform
})

async function handleDismiss() {
  if (window.electronAPI) {
    await window.electronAPI.dismissOnboarding()
  }
  emit('dismiss')
}
</script>

<template>
  <div class="onboarding-overlay window-no-drag">
    <div class="onboarding-card">
      <h2>欢迎使用 Quick Launch</h2>
      <p class="intro">Quick Launch 在后台运行，通过全局热键唤出搜索框。</p>

      <div v-if="platform === 'darwin' && !granted" class="permission-block">
        <h3>需要辅助功能权限</h3>
        <p>macOS 需要授权才能使用全局热键（默认 <kbd>{{ defaultHotkey }}</kbd>）。</p>
        <ol>
          <li>打开 <strong>系统设置 → 隐私与安全性 → 辅助功能</strong></li>
          <li>点击 <strong>+</strong>，添加 <strong>Quick Launch</strong></li>
          <li>确保开关已打开，然后重启应用</li>
        </ol>
      </div>

      <div v-else class="tips">
        <ul>
          <li>按 <kbd>{{ defaultHotkey }}</kbd> 打开搜索</li>
          <li>菜单栏图标可打开搜索、切换主题、退出</li>
          <li>输入 <kbd>设置</kbd> 打开可视化设置</li>
        </ul>
      </div>

      <button class="primary-btn" @click="handleDismiss">开始使用</button>
    </div>
  </div>
</template>

<style scoped>
.onboarding-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 16px;
}

.onboarding-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  margin: 16px;
  box-shadow: var(--shadow);
}

h2 {
  font-size: 18px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

h3 {
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.intro {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.permission-block,
.tips {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

ol, ul {
  padding-left: 20px;
  margin-top: 8px;
}

li {
  margin-bottom: 4px;
}

kbd {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  font-family: inherit;
  font-size: 11px;
}

.primary-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.primary-btn:hover {
  opacity: 0.9;
}
</style>
