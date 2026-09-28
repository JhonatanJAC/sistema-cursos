import initSqlJs, { Database } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

let db: Database | null = null

function getDatabasePath(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'sistema-cursos.db')
    }
  } catch {
    // fallback
  }
  return path.join(process.cwd(), 'sistema-cursos.db')
}

function getWasmPath(): string {
  const candidates = [
    path.join(process.resourcesPath || '', 'sql-wasm', 'sql-wasm.wasm'),
    path.join(process.resourcesPath || '', 'sql-wasm.wasm'),
    path.join(__dirname, 'sql-wasm.wasm'),
    path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
  ]
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      return c
    }
  }
  return path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm')
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('La base de datos no ha sido inicializada')
  }
  return db
}

export function saveDatabase(): void {
  if (!db) return
  try {
    const dbPath = getDatabasePath()
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  } catch (error) {
    console.error('Error al guardar la base de datos:', error)
  }
}

export async function initDatabase(): Promise<Database> {
  try {
    const dbPath = getDatabasePath()
    const dbDir = path.dirname(dbPath)

    // Crear directorio si no existe
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    const wasmPath = getWasmPath()

    // Inicializar sql.js con el WASM
    const SQL = await initSqlJs({
      locateFile: () => wasmPath,
    })

    const isNewDb = !fs.existsSync(dbPath)
    if (!isNewDb) {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(fileBuffer)
      console.log(`✅ Base de datos cargada desde: ${dbPath}`)
    } else {
      db = new SQL.Database()
      console.log(`✅ Nueva base de datos creada en: ${dbPath}`)
    }

    // Crear schema
    db.run(getSchema())

    // Migraciones automáticas de columnas nuevas
    try {
      db.run('ALTER TABLE courses ADD COLUMN precio REAL DEFAULT 0;')
    } catch {
      // Column already exists
    }

    try {
      db.run('ALTER TABLE payments ADD COLUMN secretaria TEXT;')
    } catch {
      // Column already exists
    }

    // Si es una base de datos nueva, inicializar únicamente con el usuario admin por defecto en cero
    if (isNewDb) {
      const defaultUsers = JSON.stringify([
        {
          id: '1',
          username: 'admin',
          password: '123456',
          name: 'Administrador',
          role: 'Administrador',
          createdAt: new Date().toISOString(),
        },
      ])
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_users', ?);", [defaultUsers])
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_username', 'admin');")
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_password', '123456');")
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('system_name', 'FECIP');")
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('receipt_counter', '0');")
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('receipt_secretary', 'Secretaria Rocio Lamilla');")
    }

    // Guardar inmediatamente para crear el archivo
    saveDatabase()

    console.log('✅ Base de datos lista')
    return db
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error)
    throw error
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

export function resetDatabaseToZero(): void {
  if (!db) return
  const tables = ['students', 'teachers', 'courses', 'enrollments', 'payments', 'backups_history', 'settings']
  for (const table of tables) {
    try {
      db.run(`DELETE FROM ${table};`)
    } catch (e) {
      console.error(`Error clearing table ${table}:`, e)
    }
  }

  const defaultUsers = JSON.stringify([
    {
      id: '1',
      username: 'admin',
      password: '123456',
      name: 'Administrador',
      role: 'Administrador',
      createdAt: new Date().toISOString(),
    },
  ])

  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_users', ?);", [defaultUsers])
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_username', 'admin');")
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_password', '123456');")
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('system_name', 'FECIP');")
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('receipt_counter', '0');")
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('receipt_secretary', 'Secretaria Rocio Lamilla');")

  try {
    db.run('DELETE FROM sqlite_sequence;')
  } catch {}

  try {
    db.run('VACUUM;')
  } catch {}

  saveDatabase()
  console.log('🧹 Base de datos restablecida a CERO con éxito')
}

function getSchema(): string {
  return `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      identificacion TEXT NOT NULL UNIQUE,
      fecha_nacimiento TEXT,
      genero TEXT,
      telefono TEXT,
      correo TEXT,
      direccion TEXT,
      ciudad TEXT,
      representante TEXT,
      telefono_representante TEXT,
      parentesco TEXT,
      correo_representante TEXT,
      estado TEXT NOT NULL DEFAULT 'activo',
      fecha_registro TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      identificacion TEXT NOT NULL UNIQUE,
      telefono TEXT,
      correo TEXT,
      especialidad TEXT,
      direccion TEXT,
      estado TEXT NOT NULL DEFAULT 'activo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      codigo TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      fecha_inicio TEXT,
      fecha_fin TEXT,
      horario TEXT,
      capacidad INTEGER NOT NULL DEFAULT 30,
      precio REAL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'activo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      fecha_inscripcion TEXT NOT NULL DEFAULT (date('now')),
      estado TEXT NOT NULL DEFAULT 'activa',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id, course_id)
    );

    CREATE INDEX IF NOT EXISTS idx_students_identificacion ON students(identificacion);
    CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS backups_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK(tipo IN ('export', 'import')),
      filename TEXT,
      detalles TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL DEFAULT (date('now')),
      tipo_pago TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
      banco_remitente TEXT NOT NULL,
      banco_beneficiario TEXT NOT NULL,
      student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
      apellidos_nombres TEXT NOT NULL,
      horario TEXT,
      valor REAL NOT NULL DEFAULT 0,
      concepto TEXT,
      comprobante TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_payments_fecha ON payments(fecha);
    CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);

    PRAGMA foreign_keys = ON;
  `
}
