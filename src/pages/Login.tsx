import React, { useState } from 'react'
import { LogIn, User, Lock, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { ClassroomLogo } from '../components/ui/ClassroomLogo'
import fecipLogo from '../assets/fecip-logo.png'

export function LoginPage() {
  const { hasUser, customLogo, systemName, login } = useSettingsStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const result = login(username.trim(), password)
    if (!result.success) {
      setErrorMessage(result.message || 'Credenciales incorrectas')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 md:p-10 relative overflow-hidden animate-fade-in">
        {/* Subtle accent header bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-600 to-sky-400" />

        {/* Logo and System Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            {customLogo ? (
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-md p-1.5 flex items-center justify-center overflow-hidden">
                <img src={customLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="h-18 px-5 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center overflow-hidden">
                <img src={fecipLogo} alt="FECIP" className="h-14 w-auto object-contain" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{systemName || 'FECIP'}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setErrorMessage('')
                  }}
                  placeholder="Nombre de usuario"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/40 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrorMessage('')
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/40 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar</span>
            </button>
          </form>
      </div>
    </div>
  )
}

export default LoginPage
