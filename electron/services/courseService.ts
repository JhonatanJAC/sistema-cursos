import { getDatabase, saveDatabase } from '../database'
import { queryAll, queryOne, execute, now } from '../database/helpers'

export interface Course {
  id: number
  nombre: string
  codigo?: string
  descripcion?: string
  teacher_id?: number
  fecha_inicio?: string
  fecha_fin?: string
  horario?: string
  capacidad?: number
  precio?: number
  estado: 'activo' | 'inactivo' | 'finalizado'
  created_at: string
  updated_at: string
}

export type CreateCourseDto = Omit<Course, 'id' | 'created_at' | 'updated_at'>
export type UpdateCourseDto = Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>

export interface CourseWithDetails extends Course {
  docente?: string
  docente_nombres?: string
  docente_apellidos?: string
  estudiantes_inscritos: number
  cupos_disponibles: number
}

export const courseService = {
  findAll(): Course[] {
    const db = getDatabase()
    return queryAll(db, 'SELECT * FROM courses ORDER BY nombre ASC') as unknown as Course[]
  },

  findAllWithDetails(): CourseWithDetails[] {
    const db = getDatabase()
    return queryAll(db, `
      SELECT c.*,
        (t.nombres || ' ' || t.apellidos) as docente,
        t.nombres as docente_nombres,
        t.apellidos as docente_apellidos,
        COUNT(CASE WHEN e.estado = 'activa' THEN 1 END) as estudiantes_inscritos,
        (c.capacidad - COUNT(CASE WHEN e.estado = 'activa' THEN 1 END)) as cupos_disponibles
      FROM courses c
      LEFT JOIN teachers t ON t.id = c.teacher_id
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `) as unknown as CourseWithDetails[]
  },

  findById(id: number): Course | undefined {
    const db = getDatabase()
    return queryOne(db, 'SELECT * FROM courses WHERE id = ?', [id]) as unknown as Course | undefined
  },

  findByIdWithDetails(id: number): CourseWithDetails | undefined {
    const db = getDatabase()
    return queryOne(db, `
      SELECT c.*,
        (t.nombres || ' ' || t.apellidos) as docente,
        COUNT(CASE WHEN e.estado = 'activa' THEN 1 END) as estudiantes_inscritos,
        (c.capacidad - COUNT(CASE WHEN e.estado = 'activa' THEN 1 END)) as cupos_disponibles
      FROM courses c
      LEFT JOIN teachers t ON t.id = c.teacher_id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]) as unknown as CourseWithDetails | undefined
  },

  findByCodigo(codigo: string): Course | undefined {
    const db = getDatabase()
    return queryOne(db, 'SELECT * FROM courses WHERE codigo = ?', [codigo]) as unknown as Course | undefined
  },

  search(query: string, estado?: string): CourseWithDetails[] {
    const db = getDatabase()
    const like = `%${query}%`
    let sql = `
      SELECT c.*,
        (t.nombres || ' ' || t.apellidos) as docente,
        COUNT(CASE WHEN e.estado = 'activa' THEN 1 END) as estudiantes_inscritos,
        (c.capacidad - COUNT(CASE WHEN e.estado = 'activa' THEN 1 END)) as cupos_disponibles
      FROM courses c
      LEFT JOIN teachers t ON t.id = c.teacher_id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE (c.nombre LIKE ? OR c.codigo LIKE ? OR t.nombres LIKE ? OR t.apellidos LIKE ?)
    `
    const params: unknown[] = [like, like, like, like]

    if (estado) {
      sql += ' AND c.estado = ?'
      params.push(estado)
    }
    sql += ' GROUP BY c.id ORDER BY c.nombre ASC'

    return queryAll(db, sql, params) as unknown as CourseWithDetails[]
  },

  create(data: CreateCourseDto): Course {
    const db = getDatabase()
    const codigo = data.codigo || ('CRS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase())
    const capacidad = data.capacidad || 999
    const precio = Number(data.precio) || 0
    const result = execute(db, `
      INSERT INTO courses (nombre, codigo, descripcion, teacher_id, fecha_inicio, fecha_fin, horario, capacidad, precio, estado, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.nombre, codigo, data.descripcion || null, data.teacher_id || null,
      data.fecha_inicio || null, data.fecha_fin || null, data.horario || null,
      capacidad, precio, data.estado || 'activo', now(), now()
    ])
    saveDatabase()
    return this.findById(result.lastInsertRowid)!
  },

  update(id: number, data: UpdateCourseDto): Course | undefined {
    const db = getDatabase()
    const fields = Object.keys(data).filter(f => f !== 'id')
    if (!fields.length) return this.findById(id)

    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => {
      const val = (data as Record<string, unknown>)[f]
      return val === undefined ? null : val
    })
    
    execute(db, `UPDATE courses SET ${setClause}, updated_at = ? WHERE id = ?`, 
      [...values, now(), id])
    saveDatabase()
    return this.findById(id)
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const enrollCount = queryOne(db, 
      "SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND estado = 'activa'", [id])

    if ((enrollCount?.count as number) > 0) {
      throw new Error('No se puede eliminar un curso con estudiantes inscritos activos')
    }

    const result = execute(db, 'DELETE FROM courses WHERE id = ?', [id])
    saveDatabase()
    return result.changes > 0
  },

  count(): number {
    const db = getDatabase()
    const row = queryOne(db, 'SELECT COUNT(*) as count FROM courses')
    return (row?.count as number) || 0
  },

  countActive(): number {
    const db = getDatabase()
    const row = queryOne(db, "SELECT COUNT(*) as count FROM courses WHERE estado = 'activo'")
    return (row?.count as number) || 0
  },

  getAvailableCourses(): CourseWithDetails[] {
    const db = getDatabase()
    const all = queryAll(db, `
      SELECT c.*,
        (t.nombres || ' ' || t.apellidos) as docente,
        COUNT(CASE WHEN e.estado = 'activa' THEN 1 END) as estudiantes_inscritos,
        (c.capacidad - COUNT(CASE WHEN e.estado = 'activa' THEN 1 END)) as cupos_disponibles
      FROM courses c
      LEFT JOIN teachers t ON t.id = c.teacher_id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.estado = 'activo'
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `) as unknown as CourseWithDetails[]
    
    return all.filter(c => c.cupos_disponibles > 0)
  },
}
