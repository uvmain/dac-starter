import type { Database as DatabaseType } from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { Config } from './config.js'
import { colourLog } from './logger.js'

let db: DatabaseType | undefined
let cleanupInterval: NodeJS.Timeout | undefined
let walCheckpointInterval: NodeJS.Timeout | undefined
const FIVE_MINUTES = 5 * 60 * 1000

interface Row {
  key: string
  value: string
  expireTime?: number
}

export function initialiseDatabase() {
  const dbPathString = Config.DB_PATH
  const dbPath = path.resolve(dbPathString)
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  const query = `CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value TEXT,
    expireTime INTEGER
  )`
  db.exec(query)

  startDbCleanupInterval(10 * 1000) // delete expired rows every 10 seconds
  startWalCheckpointInterval(10 * 60 * 1000) // check for checkpoint starvation every 10 minutes
}

export function closeDatabase() {
  if (cleanupInterval !== undefined) {
    clearInterval(cleanupInterval)
    cleanupInterval = undefined
  }
  if (walCheckpointInterval !== undefined) {
    clearInterval(walCheckpointInterval)
    walCheckpointInterval = undefined
  }
  if (db) {
    db.close()
    db = undefined
  }
}

function startDbCleanupInterval(intervalInMs: number) {
  deleteExpiredRows()
  cleanupInterval = setInterval(() => {
    deleteExpiredRows()
  }, intervalInMs)
}

function startWalCheckpointInterval(intervalInMs: number) {
  const walPath = path.resolve(`${Config.DB_PATH}-wal`)
  walCheckpointInterval = setInterval(() => {
    const walSize = fs.statSync(walPath).size
    if (walSize > 10 * 1024 * 1024) {
      // checkpoint if WAL file is larger than 10MB
      db?.pragma('wal_checkpoint(RESTART)')
      colourLog('purple', 'Performed WAL checkpoint restart due to WAL file size exceeding 10MB')
    }
  }, intervalInMs)
}

export function getRow(key: string): string | null {
  if (!db) {
    colourLog('red', `DB is undefined - cannot get row for key: ${key}`)
    return null
  }
  const stmt = db.prepare('SELECT value FROM cache WHERE key = ? AND (expireTime IS NULL OR expireTime > ?)')
  const row = stmt.get(key, Date.now()) as Row | undefined
  return row ? row.value : null
}

export function getAllRows(): Row[] {
  if (!db) {
    colourLog('red', 'DB is undefined - cannot get all rows')
    return []
  }
  const stmt = db.prepare('SELECT key, value, expireTime FROM cache WHERE expireTime IS NULL OR expireTime > ?')
  const rows = stmt.all(Date.now()) as Row[]
  return rows
}

export function putRow(key: string, value: string, ttl: number = FIVE_MINUTES): void {
  if (!db) {
    colourLog('red', `DB is undefined - cannot put row for key: ${key}`)
    return
  }
  const expireTime = Date.now() + ttl
  const stmt = db.prepare('INSERT OR REPLACE INTO cache (key, value, expireTime) VALUES (?, ?, ?)')
  stmt.run(key, value, expireTime)
}

export function deleteRow(key: string): void {
  if (!db) {
    colourLog('red', `DB is undefined - cannot delete row for key: ${key}`)
    return
  }
  const stmt = db.prepare('DELETE FROM cache WHERE key = ?')
  stmt.run(key)
}

export function deleteExpiredRows(): void {
  if (!db) {
    colourLog('red', 'DB is undefined - cannot delete expired rows')
    return
  }
  const stmt = db.prepare('DELETE FROM cache WHERE expireTime IS NOT NULL AND expireTime < ?')
  stmt.run(Date.now())
}

export function deleteAllRows(): void {
  if (!db) {
    colourLog('red', 'DB is undefined - cannot delete all rows')
    return
  }
  const stmt = db.prepare('DELETE FROM cache')
  stmt.run()
}
