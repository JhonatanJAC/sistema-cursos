import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import type { ToastMessage } from '../../types'

const iconMap = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
}

const bgMap = {
  success: 'bg-emerald-50 border-emerald-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
}

function Toast({ toast }: { toast: ToastMessage }) {
  const { removeToast } = useUIStore()

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg min-w-72 max-w-sm
        animate-slide-up ${bgMap[toast.type]}
      `}
    >
      <div className="shrink-0 mt-0.5">{iconMap[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
