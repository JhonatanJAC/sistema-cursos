import { create } from 'zustand'
import { settingsAPI } from '../services/api'

export interface AppUser {
  id: string
  username: string
  password: string
  name: string // Nombre o título que saldrá en el recibo (ej: "Secretaria Rocio Lamilla", "Secretaria Carmen Ortiz")
  role: string // "Secretaria" | "Administrador"
  createdAt?: string
}

interface SettingsState {
  isInitialized: boolean
  isAuthenticated: boolean
  hasUser: boolean
  users: AppUser[]
  currentUser: AppUser | null
  savedUsername: string
  savedPassword: string
  customLogo: string | null
  systemName: string
  receiptSignature: string | null
  receiptCounter: number
  receiptSecretary: string

  init: () => Promise<void>
  login: (username?: string, password?: string) => { success: boolean; message?: string }
  logout: () => void
  addUser: (userData: Omit<AppUser, 'id'>) => Promise<void>
  updateUser: (id: string, updates: Partial<Omit<AppUser, 'id'>>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  getActiveSecretaryName: () => string

  setCredentials: (username: string, password: string) => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  changeUsername: (newUsername: string) => Promise<void>
  removeCredentials: () => Promise<void>
  setCustomLogo: (logoBase64: string | null) => Promise<void>
  setSystemName: (name: string) => Promise<void>
  resetSystemName: () => Promise<void>
  setReceiptSignature: (signatureBase64: string | null) => Promise<void>
  setReceiptCounter: (counter: number) => Promise<void>
  getNextReceiptNumber: () => Promise<string>
  setReceiptSecretary: (name: string) => Promise<void>
  resetReceiptSecretary: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isInitialized: false,
  isAuthenticated: false,
  hasUser: false,
  users: [],
  currentUser: null,
  savedUsername: '',
  savedPassword: '',
  customLogo: null,
  systemName: 'FECIP',
  receiptSignature: null,
  receiptCounter: 0,
  receiptSecretary: 'Secretaria Rocio Lamilla',

  init: async () => {
    try {
      const [user, pass, logo, name, signature, counterStr, secretary, usersJson] = await Promise.all([
        settingsAPI.get('auth_username'),
        settingsAPI.get('auth_password'),
        settingsAPI.get('custom_logo'),
        settingsAPI.get('system_name'),
        settingsAPI.get('receipt_signature'),
        settingsAPI.get('receipt_counter'),
        settingsAPI.get('receipt_secretary'),
        settingsAPI.get('auth_users'),
      ])

      let loadedUsers: AppUser[] = []
      if (usersJson) {
        try {
          loadedUsers = JSON.parse(usersJson)
        } catch (e) {
          console.error('Error parsing auth_users JSON:', e)
        }
      }

      // Si no existen usuarios guardados en la BD, inicializar SIEMPRE el usuario Administrador por defecto: admin / 123456
      if (loadedUsers.length === 0) {
        const adminUser = user && user.trim().length > 0 ? user.trim() : 'admin'
        const adminPass = pass && pass.trim().length > 0 ? pass : '123456'
        loadedUsers = [
          {
            id: '1',
            username: adminUser,
            password: adminPass,
            name: 'Administrador',
            role: 'Administrador',
            createdAt: new Date().toISOString(),
          },
        ]
        await settingsAPI.set('auth_users', JSON.stringify(loadedUsers))
        await settingsAPI.set('auth_username', adminUser)
        await settingsAPI.set('auth_password', adminPass)
      } else {
        // Asegurar que exista al menos una cuenta con rol 'Administrador' para gestión del sistema
        const hasAdmin = loadedUsers.some((u) => u.role === 'Administrador')
        if (!hasAdmin) {
          const adminIdx = loadedUsers.findIndex(
            (u) => u.username.toLowerCase() === 'admin' || u.username.toLowerCase() === 'administrador'
          )
          if (adminIdx !== -1) {
            loadedUsers[adminIdx].role = 'Administrador'
          } else {
            loadedUsers[0].role = 'Administrador'
          }
          await settingsAPI.set('auth_users', JSON.stringify(loadedUsers))
        }
      }

      const parsedCounter = counterStr ? parseInt(counterStr, 10) : 0

      set({
        isInitialized: true,
        hasUser: true,
        users: loadedUsers,
        currentUser: null,
        savedUsername: user || (loadedUsers[0]?.username ?? 'admin'),
        savedPassword: pass || (loadedUsers[0]?.password ?? '123456'),
        customLogo: logo || null,
        systemName: name && name.trim().length > 0 ? name : 'FECIP',
        receiptSignature: signature || null,
        receiptCounter: isNaN(parsedCounter) ? 0 : parsedCounter,
        receiptSecretary: secretary && secretary.trim().length > 0 ? secretary : 'Secretaria Rocio Lamilla',
        isAuthenticated: false,
      })
    } catch (err) {
      console.error('Error initializing settings:', err)
      set({ isInitialized: true, isAuthenticated: false, hasUser: true })
    }
  },

  login: (username?: string, password?: string) => {
    const { users, savedUsername, savedPassword, receiptSecretary } = get()
    const cleanUser = username?.trim().toLowerCase() || ''
    const cleanPass = password || ''

    if (!cleanUser || !cleanPass) {
      return {
        success: false,
        message: 'Ingresa tu usuario y contraseña',
      }
    }

    // 1. Buscar en la lista de usuarios registrados
    const foundUser = users.find(
      (u) => u.username.trim().toLowerCase() === cleanUser && u.password === cleanPass
    )

    if (foundUser) {
      set({ isAuthenticated: true, currentUser: foundUser })
      return { success: true }
    }

    // 2. Compatibilidad con credenciales guardadas únicas
    if (
      savedUsername &&
      savedUsername.trim().toLowerCase() === cleanUser &&
      savedPassword === cleanPass
    ) {
      const fallbackUser: AppUser = {
        id: '1',
        username: savedUsername,
        password: savedPassword,
        name: cleanUser === 'admin' ? 'Administrador' : (receiptSecretary || 'Administrador'),
        role: cleanUser === 'admin' ? 'Administrador' : 'Secretaria',
      }
      set({ isAuthenticated: true, currentUser: fallbackUser })
      return { success: true }
    }

    // 3. Fallback directo para usuario admin por defecto: admin / 123456
    if (cleanUser === 'admin' && cleanPass === '123456') {
      const defaultAdmin: AppUser = {
        id: '1',
        username: 'admin',
        password: '123456',
        name: 'Administrador',
        role: 'Administrador',
        createdAt: new Date().toISOString(),
      }
      set({ isAuthenticated: true, currentUser: defaultAdmin })
      return { success: true }
    }

    return {
      success: false,
      message: 'Usuario o contraseña incorrectos',
    }
  },

  logout: () => {
    set({ isAuthenticated: false, currentUser: null })
  },

  addUser: async (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    const updatedUsers = [...get().users, newUser]
    await settingsAPI.set('auth_users', JSON.stringify(updatedUsers))

    // Si es el primer usuario, sincronizar con credenciales legacy
    if (updatedUsers.length === 1) {
      await settingsAPI.set('auth_username', newUser.username)
      await settingsAPI.set('auth_password', newUser.password)
      await settingsAPI.set('receipt_secretary', newUser.name)
    }

    set({
      users: updatedUsers,
      hasUser: true,
      savedUsername: updatedUsers[0]?.username ?? '',
      savedPassword: updatedUsers[0]?.password ?? '',
    })
  },

  updateUser: async (id: string, updates: Partial<Omit<AppUser, 'id'>>) => {
    const updatedUsers = get().users.map((u) => (u.id === id ? { ...u, ...updates } : u))
    await settingsAPI.set('auth_users', JSON.stringify(updatedUsers))

    const current = get().currentUser
    const updatedCurrent = current && current.id === id ? { ...current, ...updates } : current

    set({
      users: updatedUsers,
      currentUser: updatedCurrent,
    })
  },

  deleteUser: async (id: string) => {
    const updatedUsers = get().users.filter((u) => u.id !== id)
    await settingsAPI.set('auth_users', JSON.stringify(updatedUsers))

    if (updatedUsers.length === 0) {
      await settingsAPI.delete('auth_username')
      await settingsAPI.delete('auth_password')
    }

    const current = get().currentUser
    const updatedCurrent = current && current.id === id ? null : current

    set({
      users: updatedUsers,
      hasUser: updatedUsers.length > 0,
      currentUser: updatedCurrent,
      savedUsername: updatedUsers[0]?.username ?? '',
      savedPassword: updatedUsers[0]?.password ?? '',
    })
  },

  getActiveSecretaryName: () => {
    const { currentUser, receiptSecretary } = get()
    return currentUser?.name?.trim() || receiptSecretary?.trim() || 'Secretaria Rocio Lamilla'
  },

  setCredentials: async (username: string, password: string) => {
    await settingsAPI.set('auth_username', username)
    await settingsAPI.set('auth_password', password)

    const existingUsers = get().users
    let updatedUsers: AppUser[]
    if (existingUsers.length > 0) {
      updatedUsers = existingUsers.map((u, i) =>
        i === 0 ? { ...u, username, password } : u
      )
    } else {
      updatedUsers = [
        {
          id: '1',
          username,
          password,
          name: get().receiptSecretary || 'Secretaria Rocio Lamilla',
          role: 'Secretaria',
          createdAt: new Date().toISOString(),
        },
      ]
    }

    await settingsAPI.set('auth_users', JSON.stringify(updatedUsers))

    set({
      savedUsername: username,
      savedPassword: password,
      users: updatedUsers,
      hasUser: true,
    })
  },

  changePassword: async (newPassword: string) => {
    await settingsAPI.set('auth_password', newPassword)
    const current = get().currentUser
    const updatedUsers = get().users.map((u) => {
      if (current && u.id === current.id) {
        return { ...u, password: newPassword }
      }
      return u
    })
    await settingsAPI.set('auth_users', JSON.stringify(updatedUsers))
    set({
      savedPassword: newPassword,
      users: updatedUsers,
      currentUser: current ? { ...current, password: newPassword } : null,
    })
  },

  changeUsername: async (newUsername: string) => {
    await settingsAPI.set('auth_username', newUsername)
    const current = get().currentUser
    const updatedUsers = get().users.map((u) => {
      if (current && u.id === current.id) {
        return { ...u, username: newUsername }
      }
      return u
    })
    await settingsAPI.set('auth_users', JSON.stringify(updatedUsers))
    set({
      savedUsername: newUsername,
      users: updatedUsers,
      currentUser: current ? { ...current, username: newUsername } : null,
    })
  },

  removeCredentials: async () => {
    await settingsAPI.delete('auth_username')
    await settingsAPI.delete('auth_password')
    await settingsAPI.delete('auth_users')
    set({
      savedUsername: '',
      savedPassword: '',
      users: [],
      currentUser: null,
      hasUser: false,
    })
  },

  setCustomLogo: async (logoBase64: string | null) => {
    if (logoBase64) {
      await settingsAPI.set('custom_logo', logoBase64)
    } else {
      await settingsAPI.delete('custom_logo')
    }
    set({ customLogo: logoBase64 })
  },

  setSystemName: async (name: string) => {
    const clean = name.trim() || 'Sistema Educativo'
    await settingsAPI.set('system_name', clean)
    set({ systemName: clean })
  },

  resetSystemName: async () => {
    await settingsAPI.delete('system_name')
    set({ systemName: 'Sistema Educativo' })
  },

  setReceiptSignature: async (signatureBase64: string | null) => {
    if (signatureBase64) {
      await settingsAPI.set('receipt_signature', signatureBase64)
    } else {
      await settingsAPI.delete('receipt_signature')
    }
    set({ receiptSignature: signatureBase64 })
  },

  setReceiptCounter: async (counter: number) => {
    const val = Math.max(0, counter)
    await settingsAPI.set('receipt_counter', String(val))
    set({ receiptCounter: val })
  },

  getNextReceiptNumber: async () => {
    const { receiptCounter } = get()
    const currentVal = receiptCounter ?? 0
    const nextVal = currentVal + 1
    await settingsAPI.set('receipt_counter', String(nextVal))
    set({ receiptCounter: nextVal })
    return String(currentVal).padStart(20, '0')
  },

  setReceiptSecretary: async (name: string) => {
    const clean = name.trim() || 'Secretaria Rocio Lamilla'
    const current = get().currentUser
    let updatedUsers = get().users

    if (current) {
      // Modificar EXCLUSIVAMENTE el nombre de la cuenta activa (NO se comparte con otras secretarias)
      updatedUsers = get().users.map((u) =>
        u.id === current.id ? { ...u, name: clean } : u
      )
      await settingsAPI.set('auth_users', JSON.stringify(updatedUsers))
      set({
        currentUser: { ...current, name: clean },
        users: updatedUsers,
        receiptSecretary: clean,
      })
    } else {
      await settingsAPI.set('receipt_secretary', clean)
      set({ receiptSecretary: clean })
    }
  },

  resetReceiptSecretary: async () => {
    const current = get().currentUser
    const defaultName = current?.role === 'Administrador' ? 'Administrador' : `Secretaria ${current?.username || 'Rocio Lamilla'}`
    if (current) {
      const updatedUsers = get().users.map((u) =>
        u.id === current.id ? { ...u, name: defaultName } : u
      )
      await settingsAPI.set('auth_users', JSON.stringify(updatedUsers))
      set({
        currentUser: { ...current, name: defaultName },
        users: updatedUsers,
        receiptSecretary: defaultName,
      })
    } else {
      await settingsAPI.set('receipt_secretary', 'Secretaria Rocio Lamilla')
      set({ receiptSecretary: 'Secretaria Rocio Lamilla' })
    }
  },
}))
