import { getDatabase, saveDatabase } from '../database'
import { queryAll, queryOne, execute, now, today } from '../database/helpers'

export interface Student {
  id: number
  nombres: string
  apellidos: string
  identificacion: string
  fecha_nacimiento?: string
  genero?: string
  telefono?: string
  correo?: string
  direccion?: string
  ciudad?: string
  representante?: string
  telefono_representante?: string
  parentesco?: string
  correo_representante?: string
  estado: 'activo' | 'inactivo'
  fecha_registro: string
  created_at: string
  updated_at: string
}

export type CreateStudentDto = Omit<Student, 'id' | 'created_at' | 'updated_at'>
export type UpdateStudentDto = Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>

export interface StudentWithCourse extends Student {
  curso?: string
}

export const studentService = {
  findAll(): Student[] {
    const db = getDatabase()
    return queryAll(db, 'SELECT * FROM students ORDER BY created_at DESC') as unknown as Student[]
  },

  findAllWithCourse(): StudentWithCourse[] {
    const db = getDatabase()
    return queryAll(db, `
      SELECT s.*, 
        (SELECT c.nombre FROM courses c 
         INNER JOIN enrollments e ON e.course_id = c.id 
         WHERE e.student_id = s.id AND e.estado = 'activa' 
         LIMIT 1) as curso
      FROM students s
      ORDER BY s.created_at DESC
    `) as unknown as StudentWithCourse[]
  },

  findById(id: number): Student | undefined {
    const db = getDatabase()
    return queryOne(db, 'SELECT * FROM students WHERE id = ?', [id]) as unknown as Student | undefined
  },

  findByIdentificacion(identificacion: string): Student | undefined {
    const db = getDatabase()
    return queryOne(db, 'SELECT * FROM students WHERE identificacion = ?', [identificacion]) as unknown as Student | undefined
  },

  search(query: string): Student[] {
    const db = getDatabase()
    const like = `%${query}%`
    return queryAll(db, `
      SELECT * FROM students 
      WHERE nombres LIKE ? OR apellidos LIKE ? OR identificacion LIKE ?
      ORDER BY nombres ASC
    `, [like, like, like]) as unknown as Student[]
  },

  create(data: CreateStudentDto): Student {
    const db = getDatabase()
    const result = execute(db, `
      INSERT INTO students (
        nombres, apellidos, identificacion, fecha_nacimiento, genero,
        telefono, correo, direccion, ciudad, representante,
        telefono_representante, parentesco, correo_representante,
        estado, fecha_registro, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.nombres, data.apellidos, data.identificacion, data.fecha_nacimiento || null,
      data.genero || null, data.telefono || null, data.correo || null,
      data.direccion || null, data.ciudad || null, data.representante || null,
      data.telefono_representante || null, data.parentesco || null, data.correo_representante || null,
      data.estado || 'activo', data.fecha_registro || today(), now(), now()
    ])
    saveDatabase()
    return this.findById(result.lastInsertRowid)!
  },

  update(id: number, data: UpdateStudentDto): Student | undefined {
    const db = getDatabase()
    const fields = Object.keys(data)
    if (!fields.length) return this.findById(id)

    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => (data as Record<string, unknown>)[f])
    
    execute(db, `UPDATE students SET ${setClause}, updated_at = ? WHERE id = ?`, 
      [...values, now(), id])
    saveDatabase()
    return this.findById(id)
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const result = execute(db, 'DELETE FROM students WHERE id = ?', [id])
    saveDatabase()
    return result.changes > 0
  },

  count(): number {
    const db = getDatabase()
    const row = queryOne(db, 'SELECT COUNT(*) as count FROM students')
    return (row?.count as number) || 0
  },

  countActive(): number {
    const db = getDatabase()
    const row = queryOne(db, "SELECT COUNT(*) as count FROM students WHERE estado = 'activo'")
    return (row?.count as number) || 0
  },

  countEnrolled(): number {
    const db = getDatabase()
    const row = queryOne(db, `
      SELECT COUNT(DISTINCT student_id) as count 
      FROM enrollments 
      WHERE estado = 'activa'
    `)
    return (row?.count as number) || 0
  },
}
