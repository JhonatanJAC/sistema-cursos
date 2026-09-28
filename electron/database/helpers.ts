/**
 * Helpers para trabajar con sql.js de forma más cómoda
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Database } from 'sql.js'

export type Row = Record<string, unknown>

function sanitizeParams(params: any[]): any[] {
  return params.map(p => (p === undefined ? null : p))
}

/**
 * Ejecuta una query SELECT y retorna array de objetos
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function queryAll(db: Database, sql: string, params: any[] = []): Row[] {
  try {
    const stmt = db.prepare(sql)
    const cleanParams = sanitizeParams(params)
    if (cleanParams.length > 0) stmt.bind(cleanParams)
    const rows: Row[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as Row)
    }
    stmt.free()
    return rows
  } catch (error) {
    console.error('Error en queryAll:', sql, error)
    throw error
  }
}

/**
 * Ejecuta una query SELECT y retorna el primer resultado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function queryOne(db: Database, sql: string, params: any[] = []): Row | undefined {
  const rows = queryAll(db, sql, params)
  return rows[0]
}

/**
 * Ejecuta INSERT/UPDATE/DELETE y retorna lastInsertRowid y changes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function execute(db: Database, sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  try {
    const stmt = db.prepare(sql)
    const cleanParams = sanitizeParams(params)
    if (cleanParams.length > 0) stmt.bind(cleanParams)
    stmt.step()
    stmt.free()
    const lastInsertRowid = (db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] as number) || 0
    const changes = (db.exec('SELECT changes()')[0]?.values[0]?.[0] as number) || 0
    return { lastInsertRowid, changes }
  } catch (error) {
    console.error('Error en execute:', sql, error)
    throw error
  }
}

/**
 * Ejecuta un script SQL completo (múltiples statements)
 */
export function runScript(db: Database, sql: string): void {
  try {
    db.run(sql)
  } catch (error) {
    console.error('Error en runScript:', error)
    throw error
  }
}

/**
 * Obtiene el timestamp actual en formato ISO
 */
export function now(): string {
  return new Date().toISOString().replace('T', ' ').split('.')[0]
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export function today(): string {
  return new Date().toISOString().split('T')[0]
}
