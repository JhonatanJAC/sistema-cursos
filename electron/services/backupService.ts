import { getDatabase, saveDatabase } from '../database'
import { queryAll, execute } from '../database/helpers'

function ensureBackupTable() {
  const db = getDatabase()
  db.run(`
    CREATE TABLE IF NOT EXISTS backups_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK(tipo IN ('export', 'import')),
      filename TEXT,
      detalles TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

export interface BackupData {
  version: string
  exportedAt: string
  counts: {
    students: number
    teachers: number
    courses: number
    enrollments: number
    settings: number
  }
  data: {
    students: Record<string, unknown>[]
    teachers: Record<string, unknown>[]
    courses: Record<string, unknown>[]
    enrollments: Record<string, unknown>[]
    settings: Record<string, unknown>[]
  }
}

export interface BackupHistoryItem {
  id: number
  tipo: 'export' | 'import'
  filename?: string
  detalles: string
  created_at: string
}

export const backupService = {
  exportData(filename?: string): BackupData {
    ensureBackupTable()
    const db = getDatabase()

    const students = queryAll(db, 'SELECT * FROM students')
    const teachers = queryAll(db, 'SELECT * FROM teachers')
    const courses = queryAll(db, 'SELECT * FROM courses')
    const enrollments = queryAll(db, 'SELECT * FROM enrollments')
    const settings = queryAll(db, 'SELECT * FROM settings')

    const backupObj: BackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      counts: {
        students: students.length,
        teachers: teachers.length,
        courses: courses.length,
        enrollments: enrollments.length,
        settings: settings.length,
      },
      data: {
        students,
        teachers,
        courses,
        enrollments,
        settings,
      },
    }

    const defaultFilename = filename || `backup_${new Date().toISOString().slice(0, 10)}.json`
    execute(
      db,
      'INSERT INTO backups_history (tipo, filename, detalles) VALUES (?, ?, ?)',
      ['export', defaultFilename, JSON.stringify(backupObj.counts)]
    )
    saveDatabase()

    return backupObj
  },

  importData(backupData: BackupData, filename?: string): { success: boolean; counts: BackupData['counts'] } {
    ensureBackupTable()
    const db = getDatabase()

    if (!backupData || !backupData.data) {
      throw new Error('Estructura de archivo de respaldo no válida')
    }

    const { students = [], teachers = [], courses = [], enrollments = [], settings = [] } = backupData.data

    try {
      db.run('PRAGMA foreign_keys = OFF;')

      // Limpiar tablas para reemplazo limpio
      db.run('DELETE FROM enrollments;')
      db.run('DELETE FROM courses;')
      db.run('DELETE FROM teachers;')
      db.run('DELETE FROM students;')

      // Insertar estudiantes
      for (const s of students) {
        const keys = Object.keys(s)
        const placeholders = keys.map(() => '?').join(', ')
        const values = keys.map((k) => s[k])
        db.run(`INSERT INTO students (${keys.join(', ')}) VALUES (${placeholders})`, values as any[])
      }

      // Insertar docentes
      for (const t of teachers) {
        const keys = Object.keys(t)
        const placeholders = keys.map(() => '?').join(', ')
        const values = keys.map((k) => t[k])
        db.run(`INSERT INTO teachers (${keys.join(', ')}) VALUES (${placeholders})`, values as any[])
      }

      // Insertar cursos
      for (const c of courses) {
        const keys = Object.keys(c)
        const placeholders = keys.map(() => '?').join(', ')
        const values = keys.map((k) => c[k])
        db.run(`INSERT INTO courses (${keys.join(', ')}) VALUES (${placeholders})`, values as any[])
      }

      // Insertar inscripciones
      for (const e of enrollments) {
        const keys = Object.keys(e)
        const placeholders = keys.map(() => '?').join(', ')
        const values = keys.map((k) => e[k])
        db.run(`INSERT INTO enrollments (${keys.join(', ')}) VALUES (${placeholders})`, values as any[])
      }

      // Insertar / Actualizar configuraciones si vienen en el respaldo
      for (const set of settings) {
        if (set.key && set.value !== undefined) {
          db.run(
            'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            [set.key, set.value] as any[]
          )
        }
      }

      db.run('PRAGMA foreign_keys = ON;')

      const counts = {
        students: students.length,
        teachers: teachers.length,
        courses: courses.length,
        enrollments: enrollments.length,
        settings: settings.length,
      }

      const defaultFilename = filename || 'importado.json'
      execute(
        db,
        'INSERT INTO backups_history (tipo, filename, detalles) VALUES (?, ?, ?)',
        ['import', defaultFilename, JSON.stringify(counts)]
      )

      saveDatabase()

      return { success: true, counts }
    } catch (error) {
      db.run('PRAGMA foreign_keys = ON;')
      console.error('Error importing backup data:', error)
      throw error
    }
  },

  getHistory(): BackupHistoryItem[] {
    ensureBackupTable()
    const db = getDatabase()
    return queryAll(db, 'SELECT * FROM backups_history ORDER BY id DESC LIMIT 50') as unknown as BackupHistoryItem[]
  },
}
