import { app, nativeImage } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execFileSync } from 'child_process'
import { getUserDataPath } from '../utils/paths'

const iconCache = new Map<string, string>()

function getCacheDir(): string {
  const dir = join(getUserDataPath(), 'icons')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function cacheKey(appPath: string): string {
  return Buffer.from(appPath).toString('base64url').slice(0, 32)
}

function readCacheFile(cacheFile: string, key: string): string | null {
  if (!existsSync(cacheFile)) return null
  const dataUrl = `data:image/png;base64,${readFileSync(cacheFile).toString('base64')}`
  iconCache.set(key, dataUrl)
  return dataUrl
}

export async function getAppIconDataUrl(appPath: string): Promise<string | null> {
  const key = cacheKey(appPath)
  if (iconCache.has(key)) return iconCache.get(key)!

  const cacheFile = join(getCacheDir(), `${key}.png`)
  const cached = readCacheFile(cacheFile, key)
  if (cached) return cached

  if (process.platform === 'darwin' && appPath.endsWith('.app')) {
    try {
      const tmpPng = join(getCacheDir(), `${key}-tmp.png`)
      execFileSync('sips', ['-s', 'format', 'png', `${appPath}/Contents/Resources/AppIcon.icns`, '--out', tmpPng], {
        stdio: 'ignore',
      })
      if (existsSync(tmpPng)) {
        const img = nativeImage.createFromPath(tmpPng)
        const resized = img.resize({ width: 32, height: 32 })
        const buf = resized.toPNG()
        writeFileSync(cacheFile, buf)
        const dataUrl = `data:image/png;base64,${buf.toString('base64')}`
        iconCache.set(key, dataUrl)
        return dataUrl
      }
    } catch { /* fallback to letter icon */ }
  }

  if (process.platform === 'win32' || process.platform === 'linux') {
    try {
      const icon = await app.getFileIcon(appPath, { size: 'small' })
      const buf = icon.toPNG()
      writeFileSync(cacheFile, buf)
      const dataUrl = `data:image/png;base64,${buf.toString('base64')}`
      iconCache.set(key, dataUrl)
      return dataUrl
    } catch { /* fallback */ }
  }

  return null
}

export async function enrichResultWithIcon(
  result: { type: string; payload: Record<string, unknown> },
): Promise<string | null> {
  if (result.type === 'app' && result.payload.path) {
    return getAppIconDataUrl(result.payload.path as string)
  }
  return null
}
