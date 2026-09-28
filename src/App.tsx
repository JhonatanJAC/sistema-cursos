import React, { useEffect } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { LoginPage } from './pages/Login'
import { useSettingsStore } from './store/useSettingsStore'
import { ClassroomLogo } from './components/ui/ClassroomLogo'

function App() {
  const { isInitialized, isAuthenticated, init, customLogo } = useSettingsStore()

  useEffect(() => {
    init()
  }, [init])

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          {customLogo ? (
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-md p-1 flex items-center justify-center overflow-hidden">
              <img src={customLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ClassroomLogo className="w-8 h-8 text-white" />
            </div>
          )}
          <span className="text-sm font-semibold text-slate-500">Cargando sistema...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <MainLayout />
}

export default App
