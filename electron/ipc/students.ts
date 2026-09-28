import { ipcMain } from 'electron'
import { studentService } from '../services/studentService'

export function registerStudentHandlers() {
  ipcMain.handle('students:findAll', () => {
    return studentService.findAll()
  })

  ipcMain.handle('students:findAllWithCourse', () => {
    return studentService.findAllWithCourse()
  })

  ipcMain.handle('students:findById', (_event, id: number) => {
    return studentService.findById(id)
  })

  ipcMain.handle('students:search', (_event, query: string) => {
    return studentService.search(query)
  })

  ipcMain.handle('students:create', (_event, data) => {
    // Verificar identificación única
    const existing = studentService.findByIdentificacion(data.identificacion)
    if (existing) {
      throw new Error('Ya existe un estudiante con esa identificación')
    }
    return studentService.create(data)
  })

  ipcMain.handle('students:update', (_event, id: number, data) => {
    // Verificar identificación única (excluyendo el actual)
    if (data.identificacion) {
      const existing = studentService.findByIdentificacion(data.identificacion)
      if (existing && existing.id !== id) {
        throw new Error('Ya existe otro estudiante con esa identificación')
      }
    }
    return studentService.update(id, data)
  })

  ipcMain.handle('students:delete', (_event, id: number) => {
    return studentService.delete(id)
  })

  ipcMain.handle('students:count', () => {
    return {
      total: studentService.count(),
      active: studentService.countActive(),
      enrolled: studentService.countEnrolled(),
    }
  })
}
