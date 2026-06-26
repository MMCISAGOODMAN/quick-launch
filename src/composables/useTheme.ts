import { ref, onMounted } from 'vue'

export function useTheme() {
  const theme = ref<'dark' | 'light'>('dark')

  function applyTheme(value: 'dark' | 'light') {
    theme.value = value
    document.documentElement.setAttribute('data-theme', value)
  }

  onMounted(async () => {
    if (window.electronAPI) {
      const config = await window.electronAPI.getConfig()
      applyTheme(config.theme === 'light' ? 'light' : 'dark')

      window.electronAPI.onThemeChanged((nextTheme) => {
        applyTheme(nextTheme)
      })
    }
  })

  async function toggleTheme() {
    if (window.electronAPI) {
      const nextTheme = await window.electronAPI.toggleTheme()
      applyTheme(nextTheme)
      return
    }
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggleTheme }
}
