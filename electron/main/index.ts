import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import path from 'path'
import fs from 'fs'
import { initDatabase, closeDatabase, resetDatabaseToZero } from '../database'
import { registerStudentHandlers } from '../ipc/students'
import { registerTeacherHandlers } from '../ipc/teachers'
import { registerCourseHandlers } from '../ipc/courses'
import { registerEnrollmentHandlers } from '../ipc/enrollments'
import { registerSettingsHandlers } from '../ipc/settings'
import { registerBackupHandlers } from '../ipc/backups'
import { registerPaymentHandlers } from '../ipc/payments'

const isDev = !app.isPackaged && process.env.NODE_ENV === 'development'

// En producción / empaquetado, aislar los datos en la carpeta del producto para no mezclar con pruebas
if (app.isPackaged || !isDev) {
  try {
    const prodUserData = path.join(app.getPath('appData'), 'Sistema Gestión Educativa')
    app.setPath('userData', prodUserData)
  } catch (e) {
    console.error('Error setting userData path:', e)
  }
}

let mainWindow: BrowserWindow | null = null

function getWindowIcon(): string {
  const candidates = [
    path.join(__dirname, '../../public/icon.png'),
    path.join(__dirname, '../../build/icon.png'),
    path.join(__dirname, '../../public/icon.ico'),
    path.join(__dirname, '../../build/icon.ico'),
    path.join(process.resourcesPath || '', 'icon.ico'),
    path.join(process.resourcesPath || '', 'icon.png'),
    path.join(process.cwd(), 'public/icon.png'),
    path.join(process.cwd(), 'build/icon.ico'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return path.join(process.cwd(), 'public/icon.png')
}

function createWindow() {
  // Desactivar el menú global de Electron (File, Edit, View, Window, Help)
  Menu.setApplicationMenu(null)

  const iconPath = getWindowIcon()

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 920,
    minHeight: 600,
    title: 'Sistema de Gestión Educativa',
    icon: iconPath,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'default',
    show: false,
  })

  mainWindow.setMenuBarVisibility(false)
  mainWindow.removeMenu()

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerIpcHandlers() {
  registerStudentHandlers()
  registerTeacherHandlers()
  registerCourseHandlers()
  registerEnrollmentHandlers()
  registerSettingsHandlers()
  registerBackupHandlers()
  registerPaymentHandlers()
  ipcMain.handle('system:resetDatabase', async () => {
    try {
      resetDatabaseToZero()
      return { success: true }
    } catch (err: any) {
      console.error('Error resetting database:', err)
      return { success: false, error: err?.message || 'Error al restablecer' }
    }
  })
  ipcMain.handle('app:exit', () => {
    app.quit()
  })
}

// Manejar errores IPC no capturados globalmente
function setupGlobalErrorHandling() {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
  })
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason)
  })
}

app.whenReady().then(async () => {
  setupGlobalErrorHandling()
  
  try {
    // sql.js requiere inicialización async
    await initDatabase()
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error)
    app.quit()
    return
  }

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
