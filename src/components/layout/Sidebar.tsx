import React, { useState } from 'react'
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Receipt,
  Wallet,
  TrendingUp,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { ClassroomLogo } from '../ui/ClassroomLogo'
import { ConfirmModal } from '../ui/ConfirmModal'
import fecipLogo from '../../assets/fecip-logo.png'
import type { PageId } from '../../types'

interface NavItem {
  id: PageId
  label: string
  icon: React.ReactNode
}

interface NavGroup {
  category: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    category: 'PRINCIPAL',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
    ],
  },
  {
    category: 'ACADÉMICO',
    items: [
      {
        id: 'students',
        label: 'Estudiantes',
        icon: <UserPlus className="w-5 h-5" />,
      },
      {
        id: 'courses',
        label: 'Cursos',
        icon: <BookOpen className="w-5 h-5" />,
      },
    ],
  },
  {
    category: 'PERSONAL',
    items: [
      {
        id: 'teachers',
        label: 'Docentes',
        icon: <GraduationCap className="w-5 h-5" />,
      },
    ],
  },
  {
    category: 'FINANZAS',
    items: [
      {
        id: 'cashflow',
        label: 'Caja',
        icon: <Wallet className="w-5 h-5" />,
      },
      {
        id: 'income',
        label: 'Ingresos',
        icon: <TrendingUp className="w-5 h-5" />,
      },
      {
        id: 'payments',
        label: 'Rol de Pagos',
        icon: <Receipt className="w-5 h-5" />,
      },
    ],
  },
  {
    category: 'SISTEMA',
    items: [
      {
        id: 'settings',
        label: 'Configuración',
        icon: <Settings className="w-5 h-5" />,
      },
    ],
  },
]

export function Sidebar() {
  const { currentPage, setCurrentPage } = useUIStore()
  const { customLogo, systemName, logout, currentUser } = useSettingsStore()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(false)
    logout()
  }

  return (
    <aside className="w-64 h-screen bg-white flex flex-col shrink-0 rounded-r-3xl border-r border-y border-slate-200 shadow-sm overflow-hidden z-10">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {customLogo ? (
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-0.5">
              <img src={customLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1">
              <img src={fecipLogo} alt="FECIP" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-800 leading-tight truncate">{systemName || 'FECIP'}</h1>
            <p className="text-[10px] font-medium text-slate-400 truncate">Capacitación Integral</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3.5">
        {navGroups.map((group, groupIdx) => (
          <div key={group.category || groupIdx}>
            <p className="px-3.5 mb-1 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              {group.category}
            </p>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = currentPage === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentPage(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left
                        transition-all duration-150 group
                        ${isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }
                      `}
                    >
                      <span
                        className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                          }`}
                      >
                        {item.icon}
                      </span>
                      <span className={`flex-1 text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer - Usuario activo y Cerrar sesión */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        {currentUser && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                {currentUser.name || currentUser.username}
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {currentUser.role || 'Secretaria'} · {currentUser.role === 'Administrador' ? 'En línea' : 'Conectada'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-150 group text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors shrink-0" />
          <span className="text-xs font-semibold truncate flex-1">
            Cerrar sesión
          </span>
        </button>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Cerrar sesión"
        description="¿Deseas cerrar la sesión actual y volver a la pantalla de ingreso?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </aside>
  )
}
