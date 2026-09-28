/**
 * API service - Wrapper tipado para window.electronAPI
 * Proporciona una interfaz segura entre el renderer y Electron IPC
 */

import type {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  Teacher,
  CreateTeacherDto,
  UpdateTeacherDto,
  Course,
  CreateCourseDto,
  UpdateCourseDto,
  Enrollment,
  CreateEnrollmentDto,
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentStats,
  DashboardStats,
} from '../types'

// Referencia al API expuesto por preload
const electron = (window as Window & { electronAPI?: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI

function getAPI() {
  const api = (window as Window & { electronAPI?: unknown }).electronAPI
  if (!api) {
    throw new Error('electronAPI no está disponible. ¿Está corriendo en Electron?')
  }
  return api as typeof electron
}

// ============================================================
// STUDENTS
// ============================================================
export const studentsAPI = {
  findAll: (): Promise<Student[]> =>
    getAPI()!.students.findAll() as Promise<Student[]>,

  findAllWithCourse: (): Promise<Student[]> =>
    getAPI()!.students.findAllWithCourse() as Promise<Student[]>,

  findById: (id: number): Promise<Student | undefined> =>
    getAPI()!.students.findById(id) as Promise<Student | undefined>,

  search: (query: string): Promise<Student[]> =>
    getAPI()!.students.search(query) as Promise<Student[]>,

  create: (data: CreateStudentDto): Promise<Student> =>
    getAPI()!.students.create(data) as Promise<Student>,

  update: (id: number, data: UpdateStudentDto): Promise<Student> =>
    getAPI()!.students.update(id, data) as Promise<Student>,

  delete: (id: number): Promise<boolean> =>
    getAPI()!.students.delete(id) as Promise<boolean>,

  count: (): Promise<{ total: number; active: number; enrolled: number }> =>
    getAPI()!.students.count() as Promise<{ total: number; active: number; enrolled: number }>,

  getAll: (): Promise<Student[]> =>
    getAPI()!.students.findAllWithCourse() as Promise<Student[]>,
}

// ============================================================
// TEACHERS
// ============================================================
export const teachersAPI = {
  findAll: (): Promise<Teacher[]> =>
    getAPI()!.teachers.findAll() as Promise<Teacher[]>,

  findAllWithCourses: (): Promise<Teacher[]> =>
    getAPI()!.teachers.findAllWithCourses() as Promise<Teacher[]>,

  getAll: (): Promise<Teacher[]> =>
    getAPI()!.teachers.findAllWithCourses() as Promise<Teacher[]>,

  findById: (id: number): Promise<Teacher | undefined> =>
    getAPI()!.teachers.findById(id) as Promise<Teacher | undefined>,

  search: (query: string): Promise<Teacher[]> =>
    getAPI()!.teachers.search(query) as Promise<Teacher[]>,

  create: (data: CreateTeacherDto): Promise<Teacher> =>
    getAPI()!.teachers.create(data) as Promise<Teacher>,

  update: (id: number, data: UpdateTeacherDto): Promise<Teacher> =>
    getAPI()!.teachers.update(id, data) as Promise<Teacher>,

  delete: (id: number): Promise<boolean> =>
    getAPI()!.teachers.delete(id) as Promise<boolean>,

  getCoursesForTeacher: (teacherId: number): Promise<Course[]> =>
    getAPI()!.teachers.getCoursesForTeacher(teacherId) as Promise<Course[]>,

  count: (): Promise<{ total: number; active: number }> =>
    getAPI()!.teachers.count() as Promise<{ total: number; active: number }>,
}

// ============================================================
// COURSES
// ============================================================
export const coursesAPI = {
  findAll: (): Promise<Course[]> =>
    getAPI()!.courses.findAll() as Promise<Course[]>,

  findAllWithDetails: (): Promise<Course[]> =>
    getAPI()!.courses.findAllWithDetails() as Promise<Course[]>,

  findById: (id: number): Promise<Course | undefined> =>
    getAPI()!.courses.findById(id) as Promise<Course | undefined>,

  findByIdWithDetails: (id: number): Promise<Course | undefined> =>
    getAPI()!.courses.findByIdWithDetails(id) as Promise<Course | undefined>,

  search: (query: string, estado?: string): Promise<Course[]> =>
    getAPI()!.courses.search(query, estado) as Promise<Course[]>,

  getAvailable: (): Promise<Course[]> =>
    getAPI()!.courses.getAvailable() as Promise<Course[]>,

  create: (data: CreateCourseDto): Promise<Course> =>
    getAPI()!.courses.create(data) as Promise<Course>,

  update: (id: number, data: UpdateCourseDto): Promise<Course> =>
    getAPI()!.courses.update(id, data) as Promise<Course>,

  delete: (id: number): Promise<boolean> =>
    getAPI()!.courses.delete(id) as Promise<boolean>,

  remove: (id: number): Promise<boolean> =>
    getAPI()!.courses.delete(id) as Promise<boolean>,

  count: (): Promise<{ total: number; active: number }> =>
    getAPI()!.courses.count() as Promise<{ total: number; active: number }>,

  getAll: (): Promise<Course[]> =>
    getAPI()!.courses.findAllWithDetails() as Promise<Course[]>,
}

// ============================================================
// ENROLLMENTS
// ============================================================
export const enrollmentsAPI = {
  findAll: (): Promise<Enrollment[]> =>
    getAPI()!.enrollments.findAll() as Promise<Enrollment[]>,

  getAll: (): Promise<Enrollment[]> =>
    getAPI()!.enrollments.findAll() as Promise<Enrollment[]>,

  findById: (id: number): Promise<Enrollment | undefined> =>
    getAPI()!.enrollments.findById(id) as Promise<Enrollment | undefined>,

  findByStudent: (studentId: number): Promise<Enrollment[]> =>
    getAPI()!.enrollments.findByStudent(studentId) as Promise<Enrollment[]>,

  findByCourse: (courseId: number): Promise<Enrollment[]> =>
    getAPI()!.enrollments.findByCourse(courseId) as Promise<Enrollment[]>,

  checkDuplicate: (studentId: number, courseId: number): Promise<boolean> =>
    getAPI()!.enrollments.checkDuplicate(studentId, courseId) as Promise<boolean>,

  checkCapacity: (courseId: number): Promise<{ hasSpace: boolean; available: number; capacity: number }> =>
    getAPI()!.enrollments.checkCapacity(courseId) as Promise<{ hasSpace: boolean; available: number; capacity: number }>,

  create: (data: CreateEnrollmentDto): Promise<Enrollment> =>
    getAPI()!.enrollments.create(data) as Promise<Enrollment>,

  updateStatus: (id: number, estado: 'activa' | 'finalizada' | 'cancelada'): Promise<Enrollment> =>
    getAPI()!.enrollments.updateStatus(id, estado) as Promise<Enrollment>,

  delete: (id: number): Promise<boolean> =>
    getAPI()!.enrollments.delete(id) as Promise<boolean>,

  count: (): Promise<{ total: number; active: number }> =>
    getAPI()!.enrollments.count() as Promise<{ total: number; active: number }>,
}

// ============================================================
// DASHBOARD
// ============================================================
export const dashboardAPI = {
  getStats: (): Promise<DashboardStats> =>
    getAPI()!.dashboard.getStats() as Promise<DashboardStats>,
}

// ============================================================
// PAYMENTS (ROL DE PAGOS)
// ============================================================
const DEMO_PAYMENTS: Payment[] = [
  {
    id: 1,
    fecha: '2026-03-16',
    tipo_pago: 'TRANSFERENCIA',
    banco_remitente: 'BANCO GUAYAQUIL',
    banco_beneficiario: 'BANCO GUAYAQUIL',
    apellidos_nombres: 'VACA QUINCHIGUANGO MELANY BELEN',
    horario: 'ENF. SABADOS 2',
    valor: 35,
    concepto: '1RA CUOTA MENSUALIDAD',
    comprobante: 'TR-98231',
    created_at: '2026-03-16 10:30:00',
    updated_at: '2026-03-16 10:30:00',
  },
  {
    id: 2,
    fecha: '2026-03-16',
    tipo_pago: 'TRANSFERENCIA',
    banco_remitente: 'BANCO PICHINCHA',
    banco_beneficiario: 'BANCO PICHINCHA',
    apellidos_nombres: 'LOPEZ MORALES CARLOS DANIEL',
    horario: 'FARMACIA SAB Y DOM',
    valor: 30,
    concepto: 'MATRICULA Y REGISTRO',
    comprobante: 'TR-77123',
    created_at: '2026-03-16 11:15:00',
    updated_at: '2026-03-16 11:15:00',
  },
  {
    id: 3,
    fecha: '2026-03-16',
    tipo_pago: 'TRANSFERENCIA',
    banco_remitente: 'BANCO PACIFICO',
    banco_beneficiario: 'BANCO GUAYAQUIL',
    apellidos_nombres: 'SANCHEZ TORRES ANA LUCIA',
    horario: 'SABADOS INTENSIVOS',
    valor: 20,
    concepto: 'DERECHOS DE CERTIFICACION',
    comprobante: 'DP-44021',
    created_at: '2026-03-16 14:00:00',
    updated_at: '2026-03-16 14:00:00',
  },
  {
    id: 4,
    fecha: '2026-03-15',
    tipo_pago: 'EFECTIVO',
    banco_remitente: 'BANCO PICHINCHA',
    banco_beneficiario: 'BANCO PICHINCHA',
    apellidos_nombres: 'RAMIREZ GOMEZ PEDRO LUIS',
    horario: 'ASISTENCIA MEDICA NOCHE',
    valor: 35,
    concepto: 'CUOTA 1',
    comprobante: 'REC-001',
    created_at: '2026-03-15 09:20:00',
    updated_at: '2026-03-15 09:20:00',
  },
]

export const paymentsAPI = {
  findAll: async (filters?: { search?: string; banco?: string; tipo_pago?: string }): Promise<Payment[]> => {
    try {
      const api = (window as Window & { electronAPI?: { payments?: { findAll: (f?: any) => Promise<Payment[]> } } }).electronAPI
      if (api?.payments?.findAll) {
        return await api.payments.findAll(filters)
      }
    } catch {
      // fallback demo data
    }
    let list = [...DEMO_PAYMENTS]
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(p =>
        p.apellidos_nombres.toLowerCase().includes(q) ||
        (p.horario && p.horario.toLowerCase().includes(q)) ||
        (p.concepto && p.concepto.toLowerCase().includes(q))
      )
    }
    if (filters?.banco) {
      list = list.filter(p => p.banco_remitente === filters.banco || p.banco_beneficiario === filters.banco)
    }
    if (filters?.tipo_pago) {
      list = list.filter(p => p.tipo_pago === filters.tipo_pago)
    }
    return list
  },

  findById: async (id: number): Promise<Payment | undefined> => {
    try {
      const api = (window as Window & { electronAPI?: { payments?: { findById: (i: number) => Promise<Payment | undefined> } } }).electronAPI
      if (api?.payments?.findById) {
        return await api.payments.findById(id)
      }
    } catch {
      // fallback
    }
    return DEMO_PAYMENTS.find(p => p.id === id)
  },

  findByStudent: async (studentId: number): Promise<Payment[]> => {
    try {
      const api = (window as Window & { electronAPI?: { payments?: { findByStudent: (s: number) => Promise<Payment[]> } } }).electronAPI
      if (api?.payments?.findByStudent) {
        return await api.payments.findByStudent(studentId)
      }
    } catch {
      // fallback
    }
    return DEMO_PAYMENTS.filter(p => p.student_id === studentId)
  },

  create: async (data: CreatePaymentDto): Promise<Payment> => {
    try {
      const api = (window as Window & { electronAPI?: { payments?: { create: (d: any) => Promise<Payment> } } }).electronAPI
      if (api?.payments?.create) {
        return await api.payments.create(data)
      }
    } catch {
      // fallback
    }
    const newPayment: Payment = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    DEMO_PAYMENTS.unshift(newPayment)
    return newPayment
  },

  update: async (id: number, data: UpdatePaymentDto): Promise<Payment> => {
    try {
      const api = (window as Window & { electronAPI?: { payments?: { update: (i: number, d: any) => Promise<Payment> } } }).electronAPI
      if (api?.payments?.update) {
        return await api.payments.update(id, data)
      }
    } catch {
      // fallback
    }
    const idx = DEMO_PAYMENTS.findIndex(p => p.id === id)
    if (idx !== -1) {
      DEMO_PAYMENTS[idx] = { ...DEMO_PAYMENTS[idx], ...data, updated_at: new Date().toISOString() }
      return DEMO_PAYMENTS[idx]
    }
    return { ...data, id, updated_at: new Date().toISOString() } as Payment
  },

  delete: async (id: number): Promise<boolean> => {
    try {
      const api = (window as Window & { electronAPI?: { payments?: { delete: (i: number) => Promise<boolean> } } }).electronAPI
      if (api?.payments?.delete) {
        return await api.payments.delete(id)
      }
    } catch {
      // fallback
    }
    const idx = DEMO_PAYMENTS.findIndex(p => p.id === id)
    if (idx !== -1) {
      DEMO_PAYMENTS.splice(idx, 1)
      return true
    }
    return true
  },

  getStats: async (): Promise<PaymentStats> => {
    try {
      const api = (window as Window & { electronAPI?: { payments?: { getStats: () => Promise<PaymentStats> } } }).electronAPI
      if (api?.payments?.getStats) {
        return await api.payments.getStats()
      }
    } catch {
      // fallback
    }
    const total = DEMO_PAYMENTS.reduce((sum, p) => sum + (Number(p.valor) || 0), 0)
    return {
      totalRecaudado: total,
      totalPagos: DEMO_PAYMENTS.length,
      pagosMesActual: DEMO_PAYMENTS.length,
      promedioPago: DEMO_PAYMENTS.length > 0 ? Math.round((total / DEMO_PAYMENTS.length) * 100) / 100 : 0,
    }
  },
}


// ============================================================
// SETTINGS
// ============================================================
export const settingsAPI = {
  get: async (key: string): Promise<string | null> => {
    try {
      const api = (window as Window & { electronAPI?: { settings?: { get: (k: string) => Promise<string | null> } } }).electronAPI
      if (api?.settings?.get) {
        return await api.settings.get(key)
      }
    } catch {
      // fallback
    }
    return localStorage.getItem(`app_setting_${key}`)
  },

  set: async (key: string, value: string): Promise<boolean> => {
    try {
      const api = (window as Window & { electronAPI?: { settings?: { set: (k: string, v: string) => Promise<boolean> } } }).electronAPI
      if (api?.settings?.set) {
        await api.settings.set(key, value)
      }
    } catch {
      // fallback
    }
    localStorage.setItem(`app_setting_${key}`, value)
    return true
  },

  getAll: async (): Promise<Record<string, string>> => {
    try {
      const api = (window as Window & { electronAPI?: { settings?: { getAll: () => Promise<Record<string, string>> } } }).electronAPI
      if (api?.settings?.getAll) {
        return await api.settings.getAll()
      }
    } catch {
      // fallback
    }
    const result: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('app_setting_')) {
        result[k.replace('app_setting_', '')] = localStorage.getItem(k) || ''
      }
    }
    return result
  },

  delete: async (key: string): Promise<boolean> => {
    try {
      const api = (window as Window & { electronAPI?: { settings?: { delete: (k: string) => Promise<boolean> } } }).electronAPI
      if (api?.settings?.delete) {
        await api.settings.delete(key)
      }
    } catch {
      // fallback
    }
    localStorage.removeItem(`app_setting_${key}`)
    return true
  },
}

// ============================================================
// BACKUPS
// ============================================================
export const backupsAPI = {
  export: async (filename?: string): Promise<any> => {
    try {
      const api = (window as Window & { electronAPI?: { backups?: { export: (f?: string) => Promise<any> } } }).electronAPI
      if (api?.backups?.export) {
        return await api.backups.export(filename)
      }
    } catch {
      // fallback
    }
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      counts: { students: 0, teachers: 0, courses: 0, enrollments: 0, settings: 0 },
      data: { students: [], teachers: [], courses: [], enrollments: [], settings: [] },
    }
  },

  import: async (backupData: any, filename?: string): Promise<{ success: boolean; counts: any }> => {
    try {
      const api = (window as Window & { electronAPI?: { backups?: { import: (d: any, f?: string) => Promise<any> } } }).electronAPI
      if (api?.backups?.import) {
        return await api.backups.import(backupData, filename)
      }
    } catch {
      // fallback
    }
    return { success: true, counts: backupData?.counts || {} }
  },

  getHistory: async (): Promise<any[]> => {
    try {
      const api = (window as Window & { electronAPI?: { backups?: { getHistory: () => Promise<any[]> } } }).electronAPI
      if (api?.backups?.getHistory) {
        return await api.backups.getHistory()
      }
    } catch {
      // fallback
    }
    return []
  },

  saveToFile: async (defaultFilename: string, jsonContent: string): Promise<{ canceled: boolean; filePath?: string; filename?: string }> => {
    try {
      const api = (window as Window & { electronAPI?: { backups?: { saveToFile: (f: string, c: string) => Promise<any> } } }).electronAPI
      if (api?.backups?.saveToFile) {
        return await api.backups.saveToFile(defaultFilename, jsonContent)
      }
    } catch {
      // fallback
    }

    // Web fallback: download blob
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = defaultFilename
    a.click()
    URL.revokeObjectURL(url)
    return { canceled: false, filename: defaultFilename }
  },

  loadFromFile: async (): Promise<{ canceled: boolean; filePath?: string; filename?: string; content?: string }> => {
    try {
      const api = (window as Window & { electronAPI?: { backups?: { loadFromFile: () => Promise<any> } } }).electronAPI
      if (api?.backups?.loadFromFile) {
        return await api.backups.loadFromFile()
      }
    } catch {
      // fallback
    }
    return { canceled: true }
  },
}

// ============================================================
// SYSTEM
// ============================================================
export const systemAPI = {
  resetDatabase: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const api = (window as Window & { electronAPI?: { system?: { resetDatabase: () => Promise<{ success: boolean; error?: string }> } } }).electronAPI
      if (api?.system?.resetDatabase) {
        return await api.system.resetDatabase()
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Error al restablecer' }
    }
    return { success: false, error: 'No disponible' }
  },
}


