import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
          }`}
        >
          <AlertTriangle
            className={`w-7 h-7 ${variant === 'danger' ? 'text-red-600' : 'text-amber-600'}`}
          />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message || description}</p>
        </div>
      </div>
    </Modal>
  )
}
