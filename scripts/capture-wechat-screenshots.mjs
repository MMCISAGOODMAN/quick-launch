/**
 * Capture real Quick Launch UI screenshots for WeChat article.
 * Run: node scripts/capture-wechat-screenshots.mjs
 * Requires: npm run dev (or script starts vite automatically)
 */
import { chromium } from 'playwright'
import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import { createInterface } from 'readline'
import http from 'http'

const OUT = new URL('../docs/wechat/images/', import.meta.url)
const PORT = 5173
const BASE = `http://127.0.0.1:${PORT}`

const mockConfig = {
  hotkey: 'Alt+Shift+Space',
  theme: 'dark',
  maxResults: 20,
  clipboardHistorySize: 50,
  window: { width: 680, height: 420 },
  searchEngines: [
    { id: 'google', name: 'Google', prefix: 'g', url: 'https://www.google.com/search?q={query}' },
    { id: 'baidu', name: 'Baidu', prefix: 'bd', url: 'https://www.baidu.com/s?wd={query}' },
  ],
  customCommands: [],
  fileSearch: { enabled: true, maxResults: 15, searchPaths: [], excludePatterns: ['node_modules'] },
  quickAccess: ['设置', 'config'],
}

const mockApps = [
  { id: 'app-chrome', type: 'app', title: 'Google Chrome', subtitle: '应用程序', score: 95, payload: { path: '/Applications/Google Chrome.app' } },
  { id: 'app-code', type: 'app', title: 'Visual Studio Code', subtitle: '应用程序', score: 88, payload: { path: '/Applications/Visual Studio Code.app' } },
  { id: 'app-terminal', type: 'app', title: 'Terminal', subtitle: '应用程序', score: 80, payload: { path: '/Applications/Utilities/Terminal.app' } },
]

const mockFiles = [
  { id: 'file-1', type: 'file', title: '年度报告.pdf', subtitle: '~/Documents/工作', score: 90, payload: { path: '/Users/me/Documents/工作/年度报告.pdf' } },
  { id: 'file-2', type: 'file', title: 'project-plan.md', subtitle: '~/Documents', score: 85, payload: { path: '/Users/me/Documents/project-plan.md' } },
]

const mockCalc = [
  { id: 'calc-1', type: 'calc', title: '408', subtitle: '12 × 34 = 408', score: 100, payload: { expression: '12*34', result: 408 } },
]

function mockElectronAPI() {
  window.electronAPI = {
    search: async (q) => {
      const query = q.trim().toLowerCase()
      if (!query) return mockApps.slice(0, 3)
      if (/^[\d+\-*/().\s]+$/.test(query)) return mockCalc
      if (query.startsWith('g ')) {
        return [{ id: 'web-1', type: 'web', title: `Google 搜索: ${query.slice(2)}`, subtitle: '按 Enter 在浏览器打开', score: 100, payload: { engine: 'google', query: query.slice(2) } }]
      }
      if (query.includes('report') || query.includes('文件')) return mockFiles
      return mockApps.filter((a) => a.title.toLowerCase().includes(query))
    },
    execute: async () => {},
    openConfig: async () => {},
    hideWindow: () => {},
    getConfig: async () => mockConfig,
    saveConfig: async (c) => ({ ...mockConfig, ...c }),
    reloadConfig: async () => mockConfig,
    getQuickAccess: async () => [
      { id: 'qa-settings', type: 'command', title: '设置', subtitle: '打开可视化设置', score: 100, payload: { action: 'open-settings' } },
      { id: 'qa-theme', type: 'command', title: '切换主题', subtitle: '暗色 / 亮色', score: 99, payload: { action: 'toggle-theme' } },
    ],
    getAccessibilityStatus: async () => ({ granted: true, platform: 'darwin' }),
    shouldShowOnboarding: async () => false,
    dismissOnboarding: async () => {},
    getAppIcon: async () => null,
    toggleTheme: async () => 'light',
    setTheme: async () => {},
    onThemeChanged: () => () => {},
    onWindowShown: (cb) => { setTimeout(cb, 50); return () => {} },
    onWindowHidden: () => () => {},
    onOpenSettings: () => () => {},
  }
}

async function waitForServer(timeout = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(BASE, (res) => { res.resume(); resolve(res.statusCode) })
        req.on('error', reject)
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')) })
      })
      return true
    } catch {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  throw new Error('Dev server did not start')
}

async function startDev() {
  const proc = spawn('npx', ['vite', '--config', 'vite.screenshot.config.ts', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })
  proc.stdout.on('data', (d) => process.stderr.write(d))
  proc.stderr.on('data', (d) => process.stderr.write(d))
  await waitForServer()
  return proc
}

async function capture(page, name, setup) {
  await page.goto(BASE)
  await page.addInitScript(mockElectronAPI)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  if (setup) await setup(page)
  await page.waitForTimeout(400)
  const el = page.locator('#app')
  await el.screenshot({ path: new URL(`${name}.png`, OUT).pathname.replace(/^\/([A-Za-z]:)/, '$1') })
  console.log('Saved', name)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  let devProc
  try {
    devProc = await startDev()
  } catch {
    console.log('Assuming dev server already running...')
  }

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 680, height: 520 }, deviceScaleFactor: 2 })
  await page.emulateMedia({ colorScheme: 'dark' })

  // Idle home
  await capture(page, '01-idle-dark', async (p) => {
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  })

  // App search
  await capture(page, '02-app-search', async (p) => {
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
    await p.locator('input').first().fill('chr')
    await p.waitForTimeout(600)
  })

  // Calculator
  await capture(page, '03-calculator', async (p) => {
    await p.locator('input').first().fill('12*34')
    await p.waitForTimeout(600)
  })

  // Web search
  await capture(page, '04-web-search', async (p) => {
    await p.locator('input').first().fill('g electron')
    await p.waitForTimeout(600)
  })

  // File search
  await capture(page, '05-file-search', async (p) => {
    await p.locator('input').first().fill('report')
    await p.waitForTimeout(600)
  })

  // Light theme
  await capture(page, '06-light-theme', async (p) => {
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
    await p.locator('input').first().fill('')
    await p.waitForTimeout(400)
  })

  // Settings
  await capture(page, '07-settings', async (p) => {
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
    await p.locator('input').first().fill('设置')
    await p.waitForTimeout(400)
    await p.keyboard.press('Enter')
    await p.waitForTimeout(800)
  })

  await browser.close()
  if (devProc) devProc.kill('SIGTERM')
  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
