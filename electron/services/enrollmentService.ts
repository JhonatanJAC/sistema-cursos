import { getDatabase, saveDatabase } from '../database'
import { queryAll, queryOne, execute, now, today } from '../database/helpers'

export interface Enrollment {
  id: number
  student_id: number
  course_id: number
  fecha_inscripcion: string
  estado: 'activa' | 'finalizada' | 'cancelada'
  created_at: string
  updated_at: string
}

export type CreateEnrollmentDto = {
  student_id: number
  course_id: number
  fecha_inscripcion?: string
  estado?: 'activa' | 'finalizada' | 'cancelada'
}

export interface EnrollmentWithDetails extends Enrollment {
  estudiante_nombres: string
  estudiante_apellidos: string
  estudiante_identificacion: string
  curso_nombre: string
  curso_codigo: string
  curso_horario?: string
  docente?: string
}

const DETAIL_SELECT = `
  SELECT e.*,
    s.nombres as estudiante_nombres,
    s.apellidos as estudiante_apellidos,
    s.identificacion as estudiante_identificacion,
    c.nombre as curso_nombre,
    c.codigo as curso_codigo,
    c.horario as curso_horario,
    (t.nombres || ' ' || t.apellidos) as docente
  FROM enrollments e
  INNER JOIN students s ON s.id = e.student_id
  INNER JOIN courses c ON c.id = e.course_id
  LEFT JOIN teachers t ON t.id = c.teacher_id
`

export const enrollmentService = {
  findAll(): EnrollmentWithDetails[] {
    const db = getDatabase()
    return queryAll(db, `${DETAIL_SELECT} ORDER BY e.created_at DESC`) as unknown as EnrollmentWithDetails[]
  },

  findById(id: number): EnrollmentWithDetails | undefined {
    const db = getDatabase()
    return queryOne(db, `${DETAIL_SELECT} WHERE e.id = ?`, [id]) as unknown as EnrollmentWithDetails | undefined
  },

  findByStudent(studentId: number): EnrollmentWithDetails[] {
    const db = getDatabase()
    return queryAll(db, `${DETAIL_SELECT} WHERE e.student_id = ? ORDER BY e.created_at DESC`, [studentId]) as unknown as EnrollmentWithDetails[]
  },

  findByCourse(courseId: number): EnrollmentWithDetails[] {
    const db = getDatabase()
    return queryAll(db, `${DETAIL_SELECT} WHERE e.course_id = ? ORDER BY s.nombres ASC`, [courseId]) as unknown as EnrollmentWithDetails[]
  },

  checkDuplicate(studentId: number, courseId: number): boolean {
    const db = getDatabase()
    const row = queryOne(db, 
      'SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND course_id = ?', 
      [studentId, courseId])
    return ((row?.count as number) || 0) > 0
  },

  checkCapacity(courseId: number): { hasSpace: boolean; available: number; capacity: number } {
    const db = getDatabase()
    const course = queryOne(db, 'SELECT capacidad FROM courses WHERE id = ?', [courseId])
    if (!course) return { hasSpace: false, available: 0, capacity: 0 }

    const enrolled = queryOne(db, 
      "SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND estado = 'activa'", 
      [courseId])

    const capacity = course.capacidad as number
    const count = (enrolled?.count as number) || 0
    const available = capacity - count
    return { hasSpace: available > 0, available, capacity }
  },

  create(data: CreateEnrollmentDto): EnrollmentWithDetails {
    const db = getDatabase()

    if (this.checkDuplicate(data.student_id, data.course_id)) {
      throw new Error('El estudiante ya está inscrito en este curso')
    }

    const course = queryOne(db, 'SELECT estado FROM courses WHERE id = ?', [data.course_id])
    if (!course || course.estado !== 'activo') {
      throw new Error('El curso no está disponible para inscripciones')
    }

    const result = execute(db, `
      INSERT INTO enrollments (student_id, course_id, fecha_inscripcion, estado, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.student_id, data.course_id,
      data.fecha_inscripcion || today(),
      data.estado || 'activa',
      now(), now()
    ])
    saveDatabase()
    return this.findById(result.lastInsertRowid)!
  },

  updateStatus(id: number, estado: 'activa' | 'finalizada' | 'cancelada'): EnrollmentWithDetails | undefined {
    const db = getDatabase()
    execute(db, "UPDATE enrollments SET estado = ?, updated_at = ? WHERE id = ?", [estado, now(), id])
    saveDatabase()
    return this.findById(id)
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const result = execute(db, 'DELETE FROM enrollments WHERE id = ?', [id])
    saveDatabase()
    return result.changes > 0
  },

  count(): number {
    const db = getDatabase()
    const row = queryOne(db, 'SELECT COUNT(*) as count FROM enrollments')
    return (row?.count as number) || 0
  },

  countActive(): number {
    const db = getDatabase()
    const row = queryOne(db, "SELECT COUNT(*) as count FROM enrollments WHERE estado = 'activa'")
    return (row?.count as number) || 0
  },
}
