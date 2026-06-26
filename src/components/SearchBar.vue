<script setup lang="ts">
import { ref, nextTick } from 'vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  escape: []
  arrowUp: []
  arrowDown: []
  toggleTheme: []
  cycleAction: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      emit('submit')
      break
    case 'Escape':
      e.preventDefault()
      emit('escape')
      break
    case 'ArrowUp':
      e.preventDefault()
      emit('arrowUp')
      break
    case 'ArrowDown':
      e.preventDefault()
      emit('arrowDown')
      break
    case 'Tab':
      e.preventDefault()
      emit('cycleAction')
      break
    case 'k':
    case 'K':
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        emit('cycleAction')
      }
      break
    case 't':
    case 'T':
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        emit('toggleTheme')
      }
      break
  }
}

defineExpose({
  focus: () => nextTick(() => inputRef.value?.focus()),
})
</script>

<template>
  <div class="search-bar window-drag">
    <span class="search-icon window-no-drag" aria-hidden="true" />
    <input
      ref="inputRef"
      class="search-input window-no-drag"
      type="text"
      placeholder="搜索应用、文件、网页、命令..."
      spellcheck="false"
      autocomplete="off"
      :value="modelValue"
      @input="onInput"
      @keydown="onKeydown"
    />
    <span class="cursor-blink" />
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  padding: 12px 20px 16px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  cursor: grab;
}

.search-bar:active {
  cursor: grabbing;
}

.search-icon {
  width: 14px;
  height: 14px;
  margin-right: 14px;
  flex-shrink: 0;
  border: 2px solid var(--text-muted);
  border-radius: 50%;
  position: relative;
  opacity: 0.5;
}

.search-icon::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 7px;
  background: var(--text-muted);
  bottom: -5px;
  right: -2px;
  transform: rotate(-45deg);
  border-radius: 1px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 22px;
  font-weight: 400;
  color: var(--text-primary);
  caret-color: var(--accent);
  letter-spacing: -0.02em;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.cursor-blink {
  display: none;
}
</style>
