import { ipcMain } from 'electron'
import { paymentService } from '../services/paymentService'

export function registerPaymentHandlers() {
  ipcMain.handle('payments:findAll', (_event, filters) => {
    return paymentService.findAll(filters)
  })

  ipcMain.handle('payments:findById', (_event, id: number) => {
    return paymentService.findById(id)
  })

  ipcMain.handle('payments:findByStudent', (_event, studentId: number) => {
    return paymentService.findByStudent(studentId)
  })

  ipcMain.handle('payments:create', (_event, data) => {
    return paymentService.create(data)
  })

  ipcMain.handle('payments:update', (_event, id: number, data) => {
    return paymentService.update(id, data)
  })

  ipcMain.handle('payments:delete', (_event, id: number) => {
    return paymentService.delete(id)
  })

  ipcMain.handle('payments:getStats', () => {
    return paymentService.getStats()
  })
}
