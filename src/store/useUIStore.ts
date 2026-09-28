import { create } from 'zustand'
import type { PageId, ToastMessage } from '../types'

interface UIStore {
  // Navegación
  currentPage: PageId
  setCurrentPage: (page: PageId) => void

  // Toast notifications
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void

  // Helpers de toast
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2)}`
    const title = toast.title || (toast.type === 'error' ? 'Error' : toast.type === 'success' ? 'Éxito' : 'Aviso')
    set((state) => ({ toasts: [...state.toasts, { ...toast, title, id }] }))
    // Auto-remove after 4s
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  showSuccess: (title, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2)}`
    set((state) => ({ toasts: [...state.toasts, { id, type: 'success', title, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  showError: (title, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2)}`
    set((state) => ({ toasts: [...state.toasts, { id, type: 'error', title, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },
  showWarning: (title, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2)}`
    set((state) => ({ toasts: [...state.toasts, { id, type: 'warning', title, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  showInfo: (title, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2)}`
    set((state) => ({ toasts: [...state.toasts, { id, type: 'info', title, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
}))
