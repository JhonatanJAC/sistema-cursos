import { ipcMain } from 'electron'
import { teacherService } from '../services/teacherService'

export function registerTeacherHandlers() {
  ipcMain.handle('teachers:findAll', () => {
    return teacherService.findAll()
  })

  ipcMain.handle('teachers:findAllWithCourses', () => {
    return teacherService.findAllWithCourses()
  })

  ipcMain.handle('teachers:findById', (_event, id: number) => {
    return teacherService.findById(id)
  })

  ipcMain.handle('teachers:search', (_event, query: string) => {
    return teacherService.search(query)
  })

  ipcMain.handle('teachers:create', (_event, data) => {
    const existing = teacherService.findByIdentificacion(data.identificacion)
    if (existing) {
      throw new Error('Ya existe un docente con esa identificación')
    }
    return teacherService.create(data)
  })

  ipcMain.handle('teachers:update', (_event, id: number, data) => {
    if (data.identificacion) {
      const existing = teacherService.findByIdentificacion(data.identificacion)
      if (existing && existing.id !== id) {
        throw new Error('Ya existe otro docente con esa identificación')
      }
    }
    return teacherService.update(id, data)
  })

  ipcMain.handle('teachers:delete', (_event, id: number) => {
    return teacherService.delete(id)
  })

  ipcMain.handle('teachers:getCoursesForTeacher', (_event, teacherId: number) => {
    return teacherService.getCoursesForTeacher(teacherId)
  })

  ipcMain.handle('teachers:count', () => {
    return {
      total: teacherService.count(),
      active: teacherService.countActive(),
    }
  })
}
