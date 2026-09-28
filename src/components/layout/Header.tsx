import React from 'react'
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Receipt,
  Settings,
  Wallet,
  DollarSign,
} from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import type { PageId } from '../../types'

const pageTitles: Record<PageId, { title: string; description: string; icon: React.ReactNode }> = {
  dashboard: {
    title: 'Dashboard',
    description: 'Resumen general del sistema educativo',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  students: {
    title: 'Estudiantes',
    description: 'Registrar y gestionar estudiantes',
    icon: <UserPlus className="w-5 h-5" />,
  },
  enrollments: {
    title: 'Inscripciones',
    description: 'Inscribir estudiantes en cursos',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  courses: {
    title: 'Gestión de Cursos',
    description: 'Administrar cursos y asignaciones',
    icon: <BookOpen className="w-5 h-5" />,
  },
  teachers: {
    title: 'Docentes',
    description: 'Gestionar docentes y especializaciones',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  payments: {
    title: 'Rol de Pagos',
    description: 'Control de pagos y transferencias bancarias',
    icon: <Receipt className="w-5 h-5" />,
  },
  cashflow: {
    title: 'Caja',
    description: 'Balance general de cobros y valores pendientes',
    icon: <Wallet className="w-5 h-5" />,
  },
  income: {
    title: 'Ingresos',
    description: 'Registro de cobros e ingresos institucionales',
    icon: <DollarSign className="w-5 h-5" />,
  },
  settings: {
    title: 'Configuración',
    description: 'Ajustes del sistema y copias de seguridad',
    icon: <Settings className="w-5 h-5" />,
  },
}

export function Header() {
  const { currentPage } = useUIStore()
  const page = pageTitles[currentPage]
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
          {page.icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">{page.title}</h2>
          <p className="text-xs text-slate-400">{page.description}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-400 capitalize">{dateStr}</p>
      </div>
    </header>
  )
}
