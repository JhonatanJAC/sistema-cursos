import { ipcMain } from 'electron'
import { courseService } from '../services/courseService'

export function registerCourseHandlers() {
  ipcMain.handle('courses:findAll', () => {
    return courseService.findAll()
  })

  ipcMain.handle('courses:findAllWithDetails', () => {
    return courseService.findAllWithDetails()
  })

  ipcMain.handle('courses:findById', (_event, id: number) => {
    return courseService.findById(id)
  })

  ipcMain.handle('courses:findByIdWithDetails', (_event, id: number) => {
    return courseService.findByIdWithDetails(id)
  })

  ipcMain.handle('courses:search', (_event, query: string, estado?: string) => {
    return courseService.search(query, estado)
  })

  ipcMain.handle('courses:getAvailable', () => {
    return courseService.getAvailableCourses()
  })

  ipcMain.handle('courses:create', (_event, data) => {
    if (data.codigo) {
      const existing = courseService.findByCodigo(data.codigo)
      if (existing) {
        throw new Error('Ya existe un curso con ese código')
      }
    }
    return courseService.create(data)
  })

  ipcMain.handle('courses:update', (_event, id: number, data) => {
    if (data.codigo) {
      const existing = courseService.findByCodigo(data.codigo)
      if (existing && existing.id !== id) {
        throw new Error('Ya existe otro curso con ese código')
      }
    }
    return courseService.update(id, data)
  })

  ipcMain.handle('courses:delete', (_event, id: number) => {
    return courseService.delete(id)
  })

  ipcMain.handle('courses:count', () => {
    return {
      total: courseService.count(),
      active: courseService.countActive(),
    }
  })
}
