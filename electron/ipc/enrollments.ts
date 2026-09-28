import { ipcMain } from 'electron'
import { enrollmentService } from '../services/enrollmentService'
import { studentService } from '../services/studentService'
import { courseService } from '../services/courseService'
import { teacherService } from '../services/teacherService'

export function registerEnrollmentHandlers() {
  ipcMain.handle('enrollments:findAll', () => {
    return enrollmentService.findAll()
  })

  ipcMain.handle('enrollments:findById', (_event, id: number) => {
    return enrollmentService.findById(id)
  })

  ipcMain.handle('enrollments:findByStudent', (_event, studentId: number) => {
    return enrollmentService.findByStudent(studentId)
  })

  ipcMain.handle('enrollments:findByCourse', (_event, courseId: number) => {
    return enrollmentService.findByCourse(courseId)
  })

  ipcMain.handle('enrollments:checkDuplicate', (_event, studentId: number, courseId: number) => {
    return enrollmentService.checkDuplicate(studentId, courseId)
  })

  ipcMain.handle('enrollments:checkCapacity', (_event, courseId: number) => {
    return enrollmentService.checkCapacity(courseId)
  })

  ipcMain.handle('enrollments:create', (_event, data) => {
    return enrollmentService.create(data)
  })

  ipcMain.handle('enrollments:updateStatus', (_event, id: number, estado: 'activa' | 'finalizada' | 'cancelada') => {
    return enrollmentService.updateStatus(id, estado)
  })

  ipcMain.handle('enrollments:delete', (_event, id: number) => {
    return enrollmentService.delete(id)
  })

  ipcMain.handle('enrollments:count', () => {
    return {
      total: enrollmentService.count(),
      active: enrollmentService.countActive(),
    }
  })

  // Dashboard aggregated stats
  ipcMain.handle('dashboard:getStats', () => {
    return {
      students: studentService.count(),
      activeStudents: studentService.countActive(),
      enrolledStudents: studentService.countEnrolled(),
      teachers: teacherService.count(),
      courses: courseService.count(),
      activeCourses: courseService.countActive(),
      activeEnrollments: enrollmentService.countActive(),
    }
  })
}
