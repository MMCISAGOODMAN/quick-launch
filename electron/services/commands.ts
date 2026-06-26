import { exec } from 'child_process'
import { nativeTheme } from 'electron'
import { loadConfig, openConfigInEditor, BUILTIN_COMMANDS, isConfigQuery, isThemeQuery, isSettingsQuery, saveConfig } from './config'
import { getMainWindow } from './window'
import { matchScore } from '../utils/fuzzy'
import { isSettingsModeQuery } from './query-mode'
import type { SearchResult, CustomCommand } from '../../src/types'

const SETTINGS_CMD_IDS = new Set(['open-settings', 'open-config', 'toggle-theme'])

function getAllCommands(): CustomCommand[] {
  const config = loadConfig()
  const userCommands = config.customCommands ?? []
  const userIds = new Set(userCommands.map((c) => c.id))
  const builtins = BUILTIN_COMMANDS.filter((c) => !userIds.has(c.id))
  return [...builtins, ...userCommands]
}

export function searchSettingsCommands(query: string): SearchResult[] {
  const commands = getAllCommands().filter((c) => SETTINGS_CMD_IDS.has(c.id))

  if (isConfigQuery(query)) {
    const cmd = commands.find((c) => c.id === 'open-config') ?? BUILTIN_COMMANDS[0]
    return [toResult(cmd, 999)]
  }

  if (isThemeQuery(query)) {
    const cmd = commands.find((c) => c.id === 'toggle-theme') ?? BUILTIN_COMMANDS[1]
    return [toResult(cmd, 998)]
  }

  if (isSettingsQuery(query) || isSettingsModeQuery(query)) {
    const settings = commands.find((c) => c.id === 'open-settings') ?? BUILTIN_COMMANDS[2]
    return [
      toResult(settings, 1000),
      ...commands.filter((c) => c.id !== 'open-settings').map((c) => toResult(c, 900)),
    ]
  }

  return commands
    .map((cmd) => ({
      cmd,
      score: Math.max(
        matchScore(query, [cmd.name, cmd.id]),
        cmd.description ? matchScore(query, [cmd.description]) : 0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ cmd, score }) => toResult(cmd, score))
}

export function searchCommands(query: string): SearchResult[] {
  const commands = getAllCommands()

  if (isConfigQuery(query)) {
    const cmd = commands.find((c) => c.id === 'open-config') ?? BUILTIN_COMMANDS[0]
    return [toResult(cmd, 999)]
  }

  if (isThemeQuery(query)) {
    const cmd = commands.find((c) => c.id === 'toggle-theme') ?? BUILTIN_COMMANDS[1]
    return [toResult(cmd, 999)]
  }

  if (isSettingsQuery(query)) {
    const cmd = commands.find((c) => c.id === 'open-settings') ?? BUILTIN_COMMANDS[2]
    return [toResult(cmd, 1000)]
  }

  if (!query.trim()) {
    return []
  }

  return commands
    .map((cmd) => ({
      cmd,
      score: Math.max(
        matchScore(query, [cmd.name, cmd.id]),
        cmd.description ? matchScore(query, [cmd.description]) : 0,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ cmd, score }) => toResult(cmd, score))
}

function toResult(cmd: CustomCommand, score: number): SearchResult {
  return {
    id: `cmd:${cmd.id}`,
    type: 'command',
    title: cmd.name,
    subtitle: cmd.description || cmd.command,
    score,
    payload: { commandId: cmd.id, command: cmd.command, shell: cmd.shell ?? true },
  }
}

export async function executeCommand(commandId: string): Promise<void> {
  if (commandId === 'open-config') {
    await openConfigInEditor()
    return
  }

  if (commandId === 'toggle-theme') {
    const config = loadConfig()
    const nextTheme = config.theme === 'light' ? 'dark' : 'light'
    saveConfig({ theme: nextTheme })
    nativeTheme.themeSource = nextTheme
    getMainWindow()?.webContents.send('theme-changed', nextTheme)
    return
  }

  if (commandId === 'open-settings') {
    getMainWindow()?.webContents.send('open-settings')
    return
  }

  const config = loadConfig()
  const userCommands = config.customCommands ?? []
  const cmd = userCommands.find((c) => c.id === commandId)
    ?? BUILTIN_COMMANDS.find((c) => c.id === commandId)
  if (!cmd) return

  if (cmd.command === 'open-config') {
    await openConfigInEditor()
    return
  }

  if (cmd.shell) {
    exec(cmd.command, (err) => {
      if (err) console.error('Command failed:', err)
    })
  }
}
