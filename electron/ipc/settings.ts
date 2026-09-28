import { ipcMain } from 'electron'
import { settingsService } from '../services/settingsService'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', (_event, key: string) => {
    return settingsService.get(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    settingsService.set(key, value)
    return true
  })

  ipcMain.handle('settings:getAll', () => {
    return settingsService.getAll()
  })

  ipcMain.handle('settings:delete', (_event, key: string) => {
    settingsService.delete(key)
    return true
  })
}
