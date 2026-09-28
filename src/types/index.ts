// ============================================================
// Tipos de la aplicación - Sistema de Gestión Educativa
// ============================================================

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
  // joined
  curso?: string
}

export type CreateStudentDto = Omit<Student, 'id' | 'created_at' | 'updated_at' | 'curso'>
export type UpdateStudentDto = Partial<CreateStudentDto>

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
  // joined
  total_cursos?: number
  cursos?: string
}

export type CreateTeacherDto = Omit<Teacher, 'id' | 'created_at' | 'updated_at' | 'total_cursos' | 'cursos'>
export type UpdateTeacherDto = Partial<CreateTeacherDto>

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
  // joined
  docente?: string
  docente_nombres?: string
  docente_apellidos?: string
  estudiantes_inscritos?: number
  cupos_disponibles?: number
}

export type CreateCourseDto = Omit<Course, 'id' | 'created_at' | 'updated_at' | 'docente' | 'docente_nombres' | 'docente_apellidos' | 'estudiantes_inscritos' | 'cupos_disponibles'>
export type UpdateCourseDto = Partial<CreateCourseDto>

export interface Enrollment {
  id: number
  student_id: number
  course_id: number
  fecha_inscripcion: string
  estado: 'activa' | 'finalizada' | 'cancelada'
  created_at: string
  updated_at: string
  // joined
  estudiante_nombres?: string
  estudiante_apellidos?: string
  estudiante_identificacion?: string
  curso_nombre?: string
  curso_codigo?: string
  curso_horario?: string
  docente?: string
}

export type CreateEnrollmentDto = {
  student_id: number
  course_id: number
  fecha_inscripcion?: string
  estado?: 'activa' | 'finalizada' | 'cancelada'
}

export interface Payment {
  id: number
  fecha: string
  tipo_pago: string
  banco_remitente: string
  banco_beneficiario: string
  student_id?: number
  apellidos_nombres: string
  horario?: string
  valor: number
  concepto?: string
  comprobante?: string
  secretaria?: string
  created_at: string
  updated_at: string
}

export type CreatePaymentDto = Omit<Payment, 'id' | 'created_at' | 'updated_at'>
export type UpdatePaymentDto = Partial<CreatePaymentDto>

export interface PaymentStats {
  totalRecaudado: number
  totalPagos: number
  pagosMesActual: number
  promedioPago: number
}

export interface DashboardStats {
  students: number
  activeStudents: number
  enrolledStudents: number
  teachers: number
  courses: number
  activeCourses: number
  activeEnrollments: number
}

// Navigation
export type PageId = 'dashboard' | 'students' | 'enrollments' | 'courses' | 'teachers' | 'payments' | 'cashflow' | 'income' | 'settings'

export interface AppSettings {
  auth_username?: string
  auth_password?: string
  custom_logo?: string
}

export interface NavItem {
  id: PageId
  label: string
  icon: string
}

// UI State
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Backups
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
    students: unknown[]
    teachers: unknown[]
    courses: unknown[]
    enrollments: unknown[]
    settings: unknown[]
  }
}

export interface BackupHistoryItem {
  id: number
  tipo: 'export' | 'import'
  filename?: string
  detalles: string
  created_at: string
}
