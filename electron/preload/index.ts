import { contextBridge, ipcRenderer } from 'electron'

// Tipos de las respuestas IPC
type IpcResponse<T> = Promise<T>

const api = {
  // === STUDENTS ===
  students: {
    findAll: (): IpcResponse<unknown[]> => ipcRenderer.invoke('students:findAll'),
    findAllWithCourse: (): IpcResponse<unknown[]> => ipcRenderer.invoke('students:findAllWithCourse'),
    findById: (id: number): IpcResponse<unknown> => ipcRenderer.invoke('students:findById', id),
    search: (query: string): IpcResponse<unknown[]> => ipcRenderer.invoke('students:search', query),
    create: (data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('students:create', data),
    update: (id: number, data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('students:update', id, data),
    delete: (id: number): IpcResponse<boolean> => ipcRenderer.invoke('students:delete', id),
    count: (): IpcResponse<{ total: number; active: number; enrolled: number }> =>
      ipcRenderer.invoke('students:count'),
  },

  // === TEACHERS ===
  teachers: {
    findAll: (): IpcResponse<unknown[]> => ipcRenderer.invoke('teachers:findAll'),
    findAllWithCourses: (): IpcResponse<unknown[]> => ipcRenderer.invoke('teachers:findAllWithCourses'),
    findById: (id: number): IpcResponse<unknown> => ipcRenderer.invoke('teachers:findById', id),
    search: (query: string): IpcResponse<unknown[]> => ipcRenderer.invoke('teachers:search', query),
    create: (data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('teachers:create', data),
    update: (id: number, data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('teachers:update', id, data),
    delete: (id: number): IpcResponse<boolean> => ipcRenderer.invoke('teachers:delete', id),
    getCoursesForTeacher: (teacherId: number): IpcResponse<unknown[]> =>
      ipcRenderer.invoke('teachers:getCoursesForTeacher', teacherId),
    count: (): IpcResponse<{ total: number; active: number }> => ipcRenderer.invoke('teachers:count'),
  },

  // === COURSES ===
  courses: {
    findAll: (): IpcResponse<unknown[]> => ipcRenderer.invoke('courses:findAll'),
    findAllWithDetails: (): IpcResponse<unknown[]> => ipcRenderer.invoke('courses:findAllWithDetails'),
    findById: (id: number): IpcResponse<unknown> => ipcRenderer.invoke('courses:findById', id),
    findByIdWithDetails: (id: number): IpcResponse<unknown> => ipcRenderer.invoke('courses:findByIdWithDetails', id),
    search: (query: string, estado?: string): IpcResponse<unknown[]> =>
      ipcRenderer.invoke('courses:search', query, estado),
    getAvailable: (): IpcResponse<unknown[]> => ipcRenderer.invoke('courses:getAvailable'),
    create: (data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('courses:create', data),
    update: (id: number, data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('courses:update', id, data),
    delete: (id: number): IpcResponse<boolean> => ipcRenderer.invoke('courses:delete', id),
    count: (): IpcResponse<{ total: number; active: number }> => ipcRenderer.invoke('courses:count'),
  },

  // === ENROLLMENTS ===
  enrollments: {
    findAll: (): IpcResponse<unknown[]> => ipcRenderer.invoke('enrollments:findAll'),
    findById: (id: number): IpcResponse<unknown> => ipcRenderer.invoke('enrollments:findById', id),
    findByStudent: (studentId: number): IpcResponse<unknown[]> =>
      ipcRenderer.invoke('enrollments:findByStudent', studentId),
    findByCourse: (courseId: number): IpcResponse<unknown[]> =>
      ipcRenderer.invoke('enrollments:findByCourse', courseId),
    checkDuplicate: (studentId: number, courseId: number): IpcResponse<boolean> =>
      ipcRenderer.invoke('enrollments:checkDuplicate', studentId, courseId),
    checkCapacity: (courseId: number): IpcResponse<{ hasSpace: boolean; available: number; capacity: number }> =>
      ipcRenderer.invoke('enrollments:checkCapacity', courseId),
    create: (data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('enrollments:create', data),
    updateStatus: (id: number, estado: string): IpcResponse<unknown> =>
      ipcRenderer.invoke('enrollments:updateStatus', id, estado),
    delete: (id: number): IpcResponse<boolean> => ipcRenderer.invoke('enrollments:delete', id),
    count: (): IpcResponse<{ total: number; active: number }> => ipcRenderer.invoke('enrollments:count'),
  },

  // === DASHBOARD ===
  dashboard: {
    getStats: (): IpcResponse<unknown> => ipcRenderer.invoke('dashboard:getStats'),
  },

  // === PAYMENTS ===
  payments: {
    findAll: (filters?: { search?: string; banco?: string; tipo_pago?: string }): IpcResponse<unknown[]> =>
      ipcRenderer.invoke('payments:findAll', filters),
    findById: (id: number): IpcResponse<unknown> => ipcRenderer.invoke('payments:findById', id),
    findByStudent: (studentId: number): IpcResponse<unknown[]> =>
      ipcRenderer.invoke('payments:findByStudent', studentId),
    create: (data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('payments:create', data),
    update: (id: number, data: unknown): IpcResponse<unknown> => ipcRenderer.invoke('payments:update', id, data),
    delete: (id: number): IpcResponse<boolean> => ipcRenderer.invoke('payments:delete', id),
    getStats: (): IpcResponse<{ totalRecaudado: number; totalPagos: number; pagosMesActual: number; promedioPago: number }> =>
      ipcRenderer.invoke('payments:getStats'),
  },

  // === SETTINGS ===
  settings: {
    get: (key: string): IpcResponse<string | null> => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string): IpcResponse<boolean> => ipcRenderer.invoke('settings:set', key, value),
    getAll: (): IpcResponse<Record<string, string>> => ipcRenderer.invoke('settings:getAll'),
    delete: (key: string): IpcResponse<boolean> => ipcRenderer.invoke('settings:delete', key),
  },

  // === BACKUPS ===
  backups: {
    export: (filename?: string): IpcResponse<unknown> => ipcRenderer.invoke('backups:export', filename),
    import: (backupData: unknown, filename?: string): IpcResponse<{ success: boolean; counts: unknown }> =>
      ipcRenderer.invoke('backups:import', backupData, filename),
    getHistory: (): IpcResponse<unknown[]> => ipcRenderer.invoke('backups:getHistory'),
    saveToFile: (
      defaultFilename: string,
      jsonContent: string
    ): IpcResponse<{ canceled: boolean; filePath?: string; filename?: string }> =>
      ipcRenderer.invoke('backups:saveToFile', defaultFilename, jsonContent),
    loadFromFile: (): IpcResponse<{ canceled: boolean; filePath?: string; filename?: string; content?: string }> =>
      ipcRenderer.invoke('backups:loadFromFile'),
  },

  // === SYSTEM ===
  system: {
    resetDatabase: (): IpcResponse<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('system:resetDatabase'),
  },

  // === APP ===
  app: {
    exit: (): IpcResponse<void> => ipcRenderer.invoke('app:exit'),
  },
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
