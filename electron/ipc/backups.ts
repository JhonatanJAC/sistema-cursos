import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { backupService, BackupData } from '../services/backupService'

export function registerBackupHandlers() {
  ipcMain.handle('backups:export', (_event, filename?: string) => {
    return backupService.exportData(filename)
  })

  ipcMain.handle('backups:import', (_event, backupData: BackupData, filename?: string) => {
    return backupService.importData(backupData, filename)
  })

  ipcMain.handle('backups:getHistory', () => {
    return backupService.getHistory()
  })

  ipcMain.handle('backups:saveToFile', async (_event, defaultFilename: string, jsonContent: string) => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win || undefined as any, {
      title: 'Guardar copia de seguridad (JSON)',
      defaultPath: defaultFilename || `backup_sistema_educativo_${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
    })

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, jsonContent, 'utf-8')
      const filename = path.basename(result.filePath)
      return { canceled: false, filePath: result.filePath, filename }
    }
    return { canceled: true }
  })

  ipcMain.handle('backups:loadFromFile', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win || undefined as any, {
      title: 'Seleccionar archivo de respaldo (JSON)',
      filters: [{ name: 'Archivos JSON', extensions: ['json'] }],
      properties: ['openFile'],
    })

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const content = fs.readFileSync(filePath, 'utf-8')
      const filename = path.basename(filePath)
      return { canceled: false, filePath, filename, content }
    }
    return { canceled: true }
  })
}
