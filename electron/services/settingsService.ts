import { getDatabase, saveDatabase } from '../database'
import { queryAll, queryOne, execute } from '../database/helpers'

function ensureSettingsTable() {
  const db = getDatabase()
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

export const settingsService = {
  get(key: string): string | null {
    ensureSettingsTable()
    const db = getDatabase()
    const row = queryOne(db, 'SELECT value FROM settings WHERE key = ?', [key])
    return row ? (row.value as string) : null
  },

  set(key: string, value: string): void {
    ensureSettingsTable()
    const db = getDatabase()
    execute(
      db,
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    )
    saveDatabase()
  },

  getAll(): Record<string, string> {
    ensureSettingsTable()
    const db = getDatabase()
    const rows = queryAll(db, 'SELECT key, value FROM settings')
    const result: Record<string, string> = {}
    for (const r of rows) {
      result[r.key as string] = r.value as string
    }
    return result
  },

  delete(key: string): void {
    ensureSettingsTable()
    const db = getDatabase()
    execute(db, 'DELETE FROM settings WHERE key = ?', [key])
    saveDatabase()
  }
}
