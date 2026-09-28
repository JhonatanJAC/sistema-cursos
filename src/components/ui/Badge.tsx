import React from 'react'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: React.ReactNode
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-slate-100 text-slate-600',
  primary: 'bg-blue-600 text-white',
}

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
  primary: 'bg-white',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ variant = 'neutral', size = 'md', children, dot = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant]}`} />
      )}
      {children}
    </span>
  )
}

// Utility para mapear estado a variante
export function getEstadoBadgeVariant(estado: string): BadgeVariant {
  switch (estado) {
    case 'activo':
    case 'activa':
      return 'success'
    case 'inactivo':
    case 'cancelada':
      return 'danger'
    case 'finalizado':
    case 'finalizada':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    activo: 'Activo',
    inactivo: 'Inactivo',
    activa: 'Activa',
    cancelada: 'Cancelada',
    finalizado: 'Finalizado',
    finalizada: 'Finalizada',
  }
  return labels[estado] || estado
}
