import React from 'react'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '../ui/Toast'
import { useUIStore } from '../../store/useUIStore'
import Dashboard from '../../pages/Dashboard'
import StudentsPage from '../../pages/Students'
import Enrollments from '../../pages/Enrollments'
import Courses from '../../pages/Courses'
import Teachers from '../../pages/Teachers'
import Payments from '../../pages/Payments'
import Cashflow from '../../pages/Cashflow'
import Income from '../../pages/Income'
import SettingsPage from '../../pages/Settings'

export function MainLayout() {
  const { currentPage } = useUIStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'students': return <StudentsPage />
      case 'enrollments': return <Enrollments />
      case 'courses': return <Courses />
      case 'teachers': return <Teachers />
      case 'payments': return <Payments />
      case 'cashflow': return <Cashflow />
      case 'income': return <Income />
      case 'settings': return <SettingsPage />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar vertical en el lado izquierdo */}
      <Sidebar />

      {/* Área principal de contenido */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-6 animate-fade-in">
          {renderPage()}
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}
