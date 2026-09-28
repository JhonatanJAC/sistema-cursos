import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan'
  subtitle?: string
  trend?: {
    value: number
    label: string
  }
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-600 text-white',
    value: 'text-blue-700',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-600 text-white',
    value: 'text-emerald-700',
  },
  purple: {
    bg: 'bg-violet-50',
    icon: 'bg-violet-600 text-white',
    value: 'text-violet-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-500 text-white',
    value: 'text-orange-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-600 text-white',
    value: 'text-red-700',
  },
  cyan: {
    bg: 'bg-cyan-50',
    icon: 'bg-cyan-600 text-white',
    value: 'text-cyan-700',
  },
}

export function StatCard({ title, value, icon, color = 'blue', subtitle, trend }: StatCardProps) {
  const colors = colorClasses[color] || colorClasses.blue

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      {/* Título arriba */}
      <p className="text-xs sm:text-sm font-medium text-slate-500 mb-3 truncate">{title}</p>

      {/* Ícono a la izquierda y Cantidad (número) a la derecha */}
      <div className="flex items-center gap-3.5">
        <div className={`${colors.icon} w-11 h-11 rounded-xl flex items-center justify-center shadow-xs shrink-0`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight leading-none">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}
              </span>
              <span className="text-xs text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
