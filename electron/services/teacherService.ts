import { getDatabase, saveDatabase } from '../database'
import { queryAll, queryOne, execute, now } from '../database/helpers'

export interface Teacher {
  id: number
  nombres: string
  apellidos: string
  identificacion: string
  telefono?: string
  correo?: string
  especialidad?: string
  direccion?: string
  estado: 'activo' | 'inactivo'
  created_at: string
  updated_at: string
}

export type CreateTeacherDto = Omit<Teacher, 'id' | 'created_at' | 'updated_at'>
export type UpdateTeacherDto = Partial<Omit<Teacher, 'id' | 'created_at' | 'updated_at'>>

export interface TeacherWithCourses extends Teacher {
  total_cursos: number
  cursos?: string
}

export const teacherService = {
  findAll(): Teacher[] {
    const db = getDatabase()
    return queryAll(db, 'SELECT * FROM teachers ORDER BY nombres ASC') as unknown as Teacher[]
  },

  findAllWithCourses(): TeacherWithCourses[] {
    const db = getDatabase()
    return queryAll(db, `
      SELECT t.*,
        COUNT(c.id) as total_cursos,
        GROUP_CONCAT(c.nombre, ', ') as cursos
      FROM teachers t
      LEFT JOIN courses c ON c.teacher_id = t.id AND c.estado != 'finalizado'
      GROUP BY t.id
      ORDER BY t.nombres ASC
    `) as unknown as TeacherWithCourses[]
  },

  findById(id: number): Teacher | undefined {
    const db = getDatabase()
    return queryOne(db, 'SELECT * FROM teachers WHERE id = ?', [id]) as unknown as Teacher | undefined
  },

  findByIdentificacion(identificacion: string): Teacher | undefined {
    const db = getDatabase()
    return queryOne(db, 'SELECT * FROM teachers WHERE identificacion = ?', [identificacion]) as unknown as Teacher | undefined
  },

  search(query: string): Teacher[] {
    const db = getDatabase()
    const like = `%${query}%`
    return queryAll(db, `
      SELECT * FROM teachers 
      WHERE nombres LIKE ? OR apellidos LIKE ? OR identificacion LIKE ? OR especialidad LIKE ?
      ORDER BY nombres ASC
    `, [like, like, like, like]) as unknown as Teacher[]
  },

  create(data: CreateTeacherDto): Teacher {
    const db = getDatabase()
    const result = execute(db, `
      INSERT INTO teachers (nombres, apellidos, identificacion, telefono, correo, especialidad, direccion, estado, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.nombres, data.apellidos, data.identificacion, data.telefono || null,
      data.correo || null, data.especialidad || null, data.direccion || null,
      data.estado || 'activo', now(), now()
    ])
    saveDatabase()
    return this.findById(result.lastInsertRowid)!
  },

  update(id: number, data: UpdateTeacherDto): Teacher | undefined {
    const db = getDatabase()
    const fields = Object.keys(data)
    if (!fields.length) return this.findById(id)

    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => (data as Record<string, unknown>)[f])
    
    execute(db, `UPDATE teachers SET ${setClause}, updated_at = ? WHERE id = ?`, 
      [...values, now(), id])
    saveDatabase()
    return this.findById(id)
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const coursesCount = queryOne(db, 
      "SELECT COUNT(*) as count FROM courses WHERE teacher_id = ? AND estado != 'finalizado'", [id])
    
    if ((coursesCount?.count as number) > 0) {
      throw new Error('No se puede eliminar un docente con cursos activos asignados')
    }

    const result = execute(db, 'DELETE FROM teachers WHERE id = ?', [id])
    saveDatabase()
    return result.changes > 0
  },

  count(): number {
    const db = getDatabase()
    const row = queryOne(db, 'SELECT COUNT(*) as count FROM teachers')
    return (row?.count as number) || 0
  },

  countActive(): number {
    const db = getDatabase()
    const row = queryOne(db, "SELECT COUNT(*) as count FROM teachers WHERE estado = 'activo'")
    return (row?.count as number) || 0
  },

  getCoursesForTeacher(teacherId: number) {
    const db = getDatabase()
    return queryAll(db, `
      SELECT c.*, COUNT(e.id) as estudiantes_inscritos
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.estado = 'activa'
      WHERE c.teacher_id = ?
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `, [teacherId])
  },
}
