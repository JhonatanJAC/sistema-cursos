import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Receipt,
  Wallet,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { Badge, getEstadoBadgeVariant, getEstadoLabel } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PieChart as PieChartComponent, PieChartItem } from '../components/ui/PieChart'
import { TradingLineChart, TradingDataPoint } from '../components/ui/TradingLineChart'
import { dashboardAPI, studentsAPI, coursesAPI, paymentsAPI } from '../services/api'
import { useUIStore } from '../store/useUIStore'
import type { Student, Course, DashboardStats, Payment } from '../types'

// ============================================================
// Datos de ejemplo para entorno no-Electron
// ============================================================
const DEMO_STATS: DashboardStats = {
  students: 48,
  activeStudents: 42,
  enrolledStudents: 35,
  teachers: 8,
  courses: 12,
  activeCourses: 9,
  activeEnrollments: 35,
}

const DEMO_STUDENTS: Student[] = [
  {
    id: 1,
    nombres: 'Ana Sofía',
    apellidos: 'García López',
    identificacion: '1001234567',
    estado: 'activo',
    fecha_registro: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    curso: 'Matemáticas Avanzadas',
  },
  {
    id: 2,
    nombres: 'Carlos Eduardo',
    apellidos: 'Martínez Ruiz',
    identificacion: '1007654321',
    estado: 'activo',
    fecha_registro: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    curso: 'Física General',
  },
  {
    id: 3,
    nombres: 'Valentina',
    apellidos: 'Torres Sánchez',
    identificacion: '1009988776',
    estado: 'activo',
    fecha_registro: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    curso: 'Literatura Española',
  },
  {
    id: 4,
    nombres: 'Miguel Ángel',
    apellidos: 'Herrera Jiménez',
    identificacion: '1003344556',
    estado: 'inactivo',
    fecha_registro: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    curso: undefined,
  },
  {
    id: 5,
    nombres: 'Isabella',
    apellidos: 'Ramírez Castro',
    identificacion: '1008877665',
    estado: 'activo',
    fecha_registro: new Date(Date.now() - 345600000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    curso: 'Química Orgánica',
  },
]

const DEMO_COURSES: Course[] = [
  {
    id: 1,
    nombre: 'Matemáticas Avanzadas',
    codigo: 'MAT-101',
    capacidad: 30,
    estado: 'activo',
    docente: 'Prof. Juan Pérez',
    estudiantes_inscritos: 25,
    cupos_disponibles: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    nombre: 'Física General',
    codigo: 'FIS-201',
    capacidad: 25,
    estado: 'activo',
    docente: 'Prof. María González',
    estudiantes_inscritos: 20,
    cupos_disponibles: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    nombre: 'Literatura Española',
    codigo: 'LIT-301',
    capacidad: 20,
    estado: 'activo',
    docente: 'Prof. Carlos Díaz',
    estudiantes_inscritos: 18,
    cupos_disponibles: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    nombre: 'Química Orgánica',
    codigo: 'QUI-401',
    capacidad: 20,
    estado: 'inactivo',
    docente: 'Sin asignar',
    estudiantes_inscritos: 0,
    cupos_disponibles: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const DEMO_PAYMENTS: Payment[] = [
  {
    id: 1,
    fecha: new Date().toISOString(),
    tipo_pago: 'Transferencia',
    banco_remitente: 'Banco Pichincha',
    banco_beneficiario: 'Banco Pichincha',
    apellidos_nombres: 'García López Ana Sofía',
    valor: 45.0,
    concepto: 'Matrícula Matemáticas Avanzadas',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    fecha: new Date(Date.now() - 86400000).toISOString(),
    tipo_pago: 'Efectivo',
    banco_remitente: 'Caja Efectivo',
    banco_beneficiario: 'Caja FECIP',
    apellidos_nombres: 'Martínez Ruiz Carlos Eduardo',
    valor: 50.0,
    concepto: 'Curso Física General',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    fecha: new Date(Date.now() - 172800000).toISOString(),
    tipo_pago: 'Depósito',
    banco_remitente: 'Banco Guayaquil',
    banco_beneficiario: 'Banco Guayaquil',
    apellidos_nombres: 'Torres Sánchez Valentina',
    valor: 40.0,
    concepto: 'Abono Literatura',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    fecha: new Date(Date.now() - 259200000).toISOString(),
    tipo_pago: 'Transferencia',
    banco_remitente: 'Produbanco',
    banco_beneficiario: 'Banco Pichincha',
    apellidos_nombres: 'Ramírez Castro Isabella',
    valor: 60.0,
    concepto: 'Mensualidad Química',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// ============================================================
// Helpers
// ============================================================
function isElectronAvailable(): boolean {
  return !!(window as Window & { electronAPI?: unknown }).electronAPI
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

// ============================================================
// Sub-components
// ============================================================
function LoadingSpinner({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <svg
        className="animate-spin w-8 h-8 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  action?: React.ReactNode
}

function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ============================================================
// Main Dashboard Component
// ============================================================
export default function Dashboard() {
  const { setCurrentPage } = useUIStore()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [errorStats, setErrorStats] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // Carga de estadísticas
  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    setErrorStats(null)
    try {
      if (!isElectronAvailable()) {
        await new Promise((r) => setTimeout(r, 600))
        setStats(DEMO_STATS)
        setIsDemo(true)
      } else {
        const data = await dashboardAPI.getStats()
        setStats(data)
        setIsDemo(false)
      }
    } catch (err) {
      console.error('Error al cargar stats:', err)
      setErrorStats('No se pudieron cargar las estadísticas.')
      setStats(DEMO_STATS)
      setIsDemo(true)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // Carga de estudiantes recientes
  const loadStudents = useCallback(async () => {
    setLoadingStudents(true)
    try {
      if (!isElectronAvailable()) {
        await new Promise((r) => setTimeout(r, 800))
        setRecentStudents(DEMO_STUDENTS)
      } else {
        const data = await studentsAPI.findAllWithCourse()
        // Ordenar por fecha_registro descendente y tomar los últimos 6
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
        )
        setRecentStudents(sorted.slice(0, 6))
      }
    } catch (err) {
      console.error('Error al cargar estudiantes:', err)
      setRecentStudents(DEMO_STUDENTS)
    } finally {
      setLoadingStudents(false)
    }
  }, [])

  // Carga de pagos / ingresos recientes
  const loadPayments = useCallback(async () => {
    setLoadingPayments(true)
    try {
      if (!isElectronAvailable()) {
        await new Promise((r) => setTimeout(r, 700))
        setRecentPayments(DEMO_PAYMENTS)
        setAllPayments(DEMO_PAYMENTS)
      } else {
        const data = await paymentsAPI.findAll()
        setAllPayments(data || [])
        // Ordenar por fecha descendente y tomar los últimos 6
        const sorted = [...(data || [])].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
        setRecentPayments(sorted.slice(0, 6))
      }
    } catch (err) {
      console.error('Error al cargar pagos recientes:', err)
      setRecentPayments(DEMO_PAYMENTS)
      setAllPayments(DEMO_PAYMENTS)
    } finally {
      setLoadingPayments(false)
    }
  }, [])

  // Carga de cursos
  const loadCourses = useCallback(async () => {
    setLoadingCourses(true)
    try {
      if (!isElectronAvailable()) {
        await new Promise((r) => setTimeout(r, 700))
        setCourses(DEMO_COURSES)
      } else {
        const data = await coursesAPI.findAllWithDetails()
        // Mostrar activos primero, luego el resto, máximo 5
        const sorted = [...data].sort((a, b) => {
          if (a.estado === 'activo' && b.estado !== 'activo') return -1
          if (a.estado !== 'activo' && b.estado === 'activo') return 1
          return 0
        })
        setCourses(sorted.slice(0, 5))
      }
    } catch (err) {
      console.error('Error al cargar cursos:', err)
      setCourses(DEMO_COURSES)
    } finally {
      setLoadingCourses(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    setLastRefreshed(new Date())
    loadStats()
    loadStudents()
    loadPayments()
    loadCourses()
  }, [loadStats, loadStudents, loadPayments, loadCourses])

  useEffect(() => {
    loadStats()
    loadStudents()
    loadPayments()
    loadCourses()
  }, [loadStats, loadStudents, loadPayments, loadCourses])

  // Generar los últimos 6 meses para la gráfica de evolución de ingresos (réplica exacta del diseño solicitado)
  const monthlyTradingPoints = useMemo<TradingDataPoint[]>(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const now = new Date()
    const points: { label: string; key: string; value: number; count: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mIdx = d.getMonth()
      const year = d.getFullYear()
      const label = `${monthNames[mIdx]} ${year}`
      const key = `${year}-${String(mIdx + 1).padStart(2, '0')}`
      points.push({ label, key, value: 0, count: 0 })
    }

    allPayments.forEach((p) => {
      if (!p.fecha) return
      const pDate = new Date(p.fecha)
      if (isNaN(pDate.getTime())) return
      const pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`
      const target = points.find((pt) => pt.key === pKey)
      if (target) {
        target.value += Number(p.valor) || 0
        target.count += 1
      }
    })

    return points.map((pt) => ({
      label: pt.label,
      value: pt.value,
      count: pt.count,
      date: pt.label,
    }))
  }, [allPayments])

  const pieData: PieChartItem[] = [
    { label: 'Estudiantes', value: stats?.students ?? 0, color: '#1d68d8' }, // FECIP Royal Blue
    { label: 'Inscritos', value: stats?.activeEnrollments ?? 0, color: '#0ea5e9' }, // FECIP Cerulean
    { label: 'Cursos Act.', value: stats?.activeCourses ?? 0, color: '#0284c7' }, // FECIP Ocean
    { label: 'Docentes', value: stats?.teachers ?? 0, color: '#38bdf8' }, // FECIP Sky Cyan
  ]

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Panel de control y gestión académica FECIP
              </p>
            </div>
          </div>
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Modo demo
            </span>
          )}
        </div>
      </div>
        {/* ── Error Banner ── */}
        {errorStats && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{errorStats} Mostrando datos de ejemplo.</span>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <section>
          {loadingStats ? (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-100 rounded-2xl p-5 h-28 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 animate-fade-in">
              {/* Total Estudiantes */}
              <StatCard
                title="Total Estudiantes"
                value={stats?.students ?? 0}
                icon={<Users className="w-5 h-5" />}
                color="blue"
                subtitle={`${stats?.activeStudents ?? 0} activos`}
              />
              {/* Estudiantes Inscritos */}
              <StatCard
                title="Estudiantes Inscritos"
                value={stats?.enrolledStudents ?? 0}
                icon={<CheckCircle2 className="w-5 h-5" />}
                color="green"
                subtitle="En cursos activos"
              />
              {/* Total Cursos */}
              <StatCard
                title="Total Cursos"
                value={stats?.courses ?? 0}
                icon={<BookOpen className="w-5 h-5" />}
                color="purple"
                subtitle={`${stats?.activeCourses ?? 0} en curso`}
              />
              {/* Cursos Activos */}
              <StatCard
                title="Cursos Activos"
                value={stats?.activeCourses ?? 0}
                icon={<ClipboardList className="w-5 h-5" />}
                color="orange"
                subtitle="Disponibles ahora"
              />
              {/* Total Docentes */}
              <StatCard
                title="Total Docentes"
                value={stats?.teachers ?? 0}
                icon={<GraduationCap className="w-5 h-5" />}
                color="cyan"
                subtitle="Planta docente"
              />
            </div>
          )}
        </section>

        {/* ── Accesos Rápidos (Fila Horizontal sin card contenedora) ── */}
        <section className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Estudiantes */}
            <button
              onClick={() => setCurrentPage('students')}
              className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-150 group text-left bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 truncate">
                  Estudiantes
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  Gestionar alumnos y registros
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Cursos e Inscripciones */}
            <button
              onClick={() => setCurrentPage('courses')}
              className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all duration-150 group text-left bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                  Cursos e Inscripciones
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  Gestionar cursos y alumnos matriculados
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </section>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Gráfica de Ingresos (2/3 del ancho) ── */}
          <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            {loadingPayments ? (
              <LoadingSpinner text="Cargando evolución de ingresos..." />
            ) : (
              <TradingLineChart
                data={monthlyTradingPoints}
                title="Evolución de Ingresos (Últimos 6 Meses)"
                subtitle="Histórico de recaudación mensual de cursos"
              />
            )}
          </section>

          {/* ── Gráfico de Pastel: Distribución General (1/3 del ancho) ── */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 flex flex-col justify-between">
            <SectionHeader
              title="Resumen General"
              subtitle="Distribución académica"
              icon={<PieChartIcon className="w-4 h-4 text-blue-600" />}
            />
            <div className="flex-1 flex flex-col justify-center">
              <PieChartComponent data={pieData} centerLabel="Total" />
            </div>
          </section>
        </div>

        {/* ── Cursos ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHeader
              title="Cursos"
              subtitle="Estado actual de los cursos"
              icon={<BookOpen className="w-4 h-4 text-blue-600" />}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => setCurrentPage('courses')}
                >
                  Ver todos
                </Button>
              }
            />
          </div>

          {loadingCourses ? (
            <LoadingSpinner text="Cargando cursos..." />
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <BookOpen className="w-10 h-10 opacity-30" />
              <p className="text-sm">No hay cursos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nombre del Curso
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      Docente
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                      Inscritos
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => {
                    const enrolled = course.estudiantes_inscritos ?? 0

                    return (
                      <tr
                        key={course.id}
                        className="hover:bg-slate-50 transition-colors duration-100"
                      >
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-medium text-slate-800">{course.nombre}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-slate-600 hidden md:table-cell">
                          {course.docente ? (
                            <span>{course.docente}</span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-semibold text-base text-slate-800">
                            {enrolled}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge
                            variant={getEstadoBadgeVariant(course.estado)}
                            dot
                          >
                            {getEstadoLabel(course.estado)}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <footer className="text-center py-2">
          <p className="text-xs text-slate-400">
            Sistema de Gestión Educativa
            {isDemo && ' · Modo demo activo'}
          </p>
        </footer>
      </div>
    )
  }
