import initSqlJs, { type Database as SqlDatabase } from 'sql.js/dist/sql-asm.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { getDatabasePath } from '../utils/paths'
import type { UsageRecord } from '../../src/types'

let db: SqlDatabase | null = null
let initPromise: Promise<SqlDatabase> | null = null
let persistTimer: ReturnType<typeof setTimeout> | null = null

function persist(): void {
  if (!db) return
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const path = getDatabasePath()
    const dir = dirname(path)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(path, Buffer.from(db!.export()))
  }, 200)
}

function runSchema(database: SqlDatabase): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS usage (
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      last_used INTEGER NOT NULL,
      PRIMARY KEY (item_id, item_type)
    );

    CREATE TABLE IF NOT EXISTS clipboard (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plugin_data (
      plugin_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (plugin_id, key)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_last_used ON usage(last_used DESC);
    CREATE INDEX IF NOT EXISTS idx_clipboard_timestamp ON clipboard(timestamp DESC);
  `)
}

export async function initDatabase(): Promise<SqlDatabase> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = (async () => {
    const SQL = await initSqlJs()
    const path = getDatabasePath()

    if (existsSync(path)) {
      db = new SQL.Database(readFileSync(path))
    } else {
      db = new SQL.Database()
    }

    runSchema(db)
    persist()
    return db
  })()

  return initPromise
}

function getDb(): SqlDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function getUsage(itemId: string, itemType: string): UsageRecord | null {
  const database = getDb()
  const stmt = database.prepare(
    'SELECT item_id, item_type, count, last_used FROM usage WHERE item_id = ? AND item_type = ?',
  )
  stmt.bind([itemId, itemType])
  if (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>
    stmt.free()
    return {
      itemId: row.item_id as string,
      itemType: row.item_type as string,
      count: row.count as number,
      lastUsed: row.last_used as number,
    }
  }
  stmt.free()
  return null
}

export function recordUsage(itemId: string, itemType: string): void {
  const now = Date.now()
  getDb().run(
    `INSERT INTO usage (item_id, item_type, count, last_used)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(item_id, item_type) DO UPDATE SET
       count = count + 1,
       last_used = excluded.last_used`,
    [itemId, itemType, now],
  )
  persist()
}

export function getUsageBoost(itemId: string, itemType: string): number {
  const usage = getUsage(itemId, itemType)
  if (!usage) return 0
  const recencyBonus = Math.max(0, 1 - (Date.now() - usage.lastUsed) / (7 * 24 * 60 * 60 * 1000))
  return Math.log1p(usage.count) * 10 + recencyBonus * 5
}

export function saveClipboardItem(id: string, text: string): void {
  getDb().run(
    'INSERT OR REPLACE INTO clipboard (id, text, timestamp) VALUES (?, ?, ?)',
    [id, text, Date.now()],
  )
  persist()
}

export function getClipboardHistory(limit: number): Array<{ id: string; text: string; timestamp: number }> {
  const database = getDb()
  const stmt = database.prepare('SELECT id, text, timestamp FROM clipboard ORDER BY timestamp DESC LIMIT ?')
  stmt.bind([limit])
  const rows: Array<{ id: string; text: string; timestamp: number }> = []
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>
    rows.push({
      id: row.id as string,
      text: row.text as string,
      timestamp: row.timestamp as number,
    })
  }
  stmt.free()
  return rows
}

export function trimClipboardHistory(maxSize: number): void {
  getDb().run(
    `DELETE FROM clipboard WHERE id NOT IN (
      SELECT id FROM clipboard ORDER BY timestamp DESC LIMIT ?
    )`,
    [maxSize],
  )
  persist()
}

export function getPluginData(pluginId: string, key: string): string | null {
  const database = getDb()
  const stmt = database.prepare('SELECT value FROM plugin_data WHERE plugin_id = ? AND key = ?')
  stmt.bind([pluginId, key])
  if (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>
    stmt.free()
    return row.value as string
  }
  stmt.free()
  return null
}

export function setPluginData(pluginId: string, key: string, value: string): void {
  getDb().run(
    'INSERT OR REPLACE INTO plugin_data (plugin_id, key, value) VALUES (?, ?, ?)',
    [pluginId, key, value],
  )
  persist()
}

export function getRecentUsage(limit: number): Array<{
  item_id: string
  item_type: string
  count: number
  last_used: number
}> {
  const database = getDb()
  const stmt = database.prepare(
    'SELECT item_id, item_type, count, last_used FROM usage ORDER BY last_used DESC LIMIT ?',
  )
  stmt.bind([limit])
  const rows: Array<{ item_id: string; item_type: string; count: number; last_used: number }> = []
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>
    rows.push({
      item_id: row.item_id as string,
      item_type: row.item_type as string,
      count: row.count as number,
      last_used: row.last_used as number,
    })
  }
  stmt.free()
  return rows
}

export function closeDatabase(): void {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  if (db) {
    const path = getDatabasePath()
    writeFileSync(path, Buffer.from(db.export()))
    db.close()
    db = null
    initPromise = null
  }
}
