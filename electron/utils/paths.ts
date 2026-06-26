import { app } from 'electron'
import { join } from 'path'

export function getUserDataPath(): string {
  return app.getPath('userData')
}

export function getConfigPath(): string {
  return join(getUserDataPath(), 'config.json')
}

export function getDatabasePath(): string {
  return join(getUserDataPath(), 'quick-launch.db')
}

export function getPluginsPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'plugins')
  }
  return join(app.getAppPath(), 'plugins')
}

export function getDefaultConfigPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'config.example.json')
  }
  return join(app.getAppPath(), 'config', 'config.example.json')
}
