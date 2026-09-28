-- Schema para Sistema de Gestión Educativa
-- Versión 1.0.0

-- Estudiantes
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
  estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo')),
  fecha_registro TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Docentes
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  identificacion TEXT NOT NULL UNIQUE,
  telefono TEXT,
  correo TEXT,
  especialidad TEXT,
  direccion TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cursos
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
  estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'finalizado')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Inscripciones
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  fecha_inscripcion TEXT NOT NULL DEFAULT (date('now')),
  estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa', 'finalizada', 'cancelada')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, course_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_students_identificacion ON students(identificacion);
CREATE INDEX IF NOT EXISTS idx_students_estado ON students(estado);
CREATE INDEX IF NOT EXISTS idx_teachers_identificacion ON teachers(identificacion);
CREATE INDEX IF NOT EXISTS idx_courses_codigo ON courses(codigo);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Trigger para actualizar updated_at en students
CREATE TRIGGER IF NOT EXISTS students_updated_at
  AFTER UPDATE ON students
BEGIN
  UPDATE students SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en teachers
CREATE TRIGGER IF NOT EXISTS teachers_updated_at
  AFTER UPDATE ON teachers
BEGIN
  UPDATE teachers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en courses
CREATE TRIGGER IF NOT EXISTS courses_updated_at
  AFTER UPDATE ON courses
BEGIN
  UPDATE courses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en enrollments
CREATE TRIGGER IF NOT EXISTS enrollments_updated_at
  AFTER UPDATE ON enrollments
BEGIN
  UPDATE enrollments SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Configuración general (clave - valor)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Historial de respaldos / copias de seguridad
CREATE TABLE IF NOT EXISTS backups_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK(tipo IN ('export', 'import')),
  filename TEXT,
  detalles TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pagos / Rol de Pagos
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
  secretaria TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_fecha ON payments(fecha);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);

-- Trigger para actualizar updated_at en payments
CREATE TRIGGER IF NOT EXISTS payments_updated_at
  AFTER UPDATE ON payments
BEGIN
  UPDATE payments SET updated_at = datetime('now') WHERE id = NEW.id;
END;



