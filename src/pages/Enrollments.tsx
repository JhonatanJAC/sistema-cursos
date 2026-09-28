import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  User,
  BookOpen,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Trash2,
  RefreshCw,
  Filter,
  Plus,
  Calendar,
  Clock,
  GraduationCap,
  X,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  DollarSign,
  Wallet,
  Receipt,
  XCircle,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { DataTable, Column } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Badge, getEstadoBadgeVariant, getEstadoLabel } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { studentsAPI, coursesAPI, enrollmentsAPI, paymentsAPI } from '../services/api'
import { useUIStore } from '../store/useUIStore'
import { formatDate } from '../utils/formatters'
import { PaymentReceiptModal, ReceiptData } from '../components/ui/PaymentReceiptModal'
import { useSettingsStore } from '../store/useSettingsStore'
import type { Student, Course, Enrollment, CreateEnrollmentDto } from '../types'

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getInitials(nombres: string, apellidos: string): string {
  const n = nombres.trim().charAt(0).toUpperCase()
  const a = apellidos.trim().charAt(0).toUpperCase()
  return `${n}${a}`
}

// ============================================================
// Step Indicator
// ============================================================
interface StepIndicatorProps {
  currentStep: number
}

const steps = [
  { number: 1, label: 'Estudiante', icon: User },
  { number: 2, label: 'Curso', icon: BookOpen },
  { number: 3, label: 'Confirmar', icon: CheckCircle },
]

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, idx) => {
        const Icon = step.icon
        const isCompleted = currentStep > step.number
        const isActive = currentStep === step.number
        return (
          <React.Fragment key={step.number}>
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                      : isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'bg-slate-100 text-slate-400'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-semibold ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={`
                  h-0.5 w-16 sm:w-24 mx-2 mb-5 rounded transition-all duration-300
                  ${currentStep > step.number ? 'bg-emerald-400' : 'bg-slate-200'}
                `}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ============================================================
// Step 1 – Student Selection
// ============================================================
interface Step1Props {
  selectedStudent: Student | null
  onSelectStudent: (student: Student) => void
  onNext: () => void
}

function Step1({ selectedStudent, onSelectStudent, onNext }: Step1Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Student[]>([])
  const [initialStudents, setInitialStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cargar lista inicial
  useEffect(() => {
    async function loadInitial() {
      try {
        const data = await studentsAPI.findAll()
        setInitialStudents(data.slice(0, 6))
      } catch {
        setInitialStudents([])
      }
    }
    loadInitial()
  }, [])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await studentsAPI.search(value.trim())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const displayList = query.trim() ? results : initialStudents

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-0.5">Paso 1: Seleccionar estudiante</h3>
        <p className="text-xs text-slate-500">Busca por nombre, apellido o número de cédula/identificación.</p>
      </div>

      <SearchInput
        value={query}
        onChange={handleSearch}
        placeholder="Buscar estudiante..."
      />

      {/* Estudiante seleccionado actualmente */}
      {selectedStudent && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {getInitials(selectedStudent.nombres, selectedStudent.apellidos)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {selectedStudent.nombres} {selectedStudent.apellidos}
            </p>
            <p className="text-xs text-slate-500">C.I. {selectedStudent.identificacion} · {selectedStudent.ciudad || 'Sin ciudad'}</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Seleccionado
          </span>
        </div>
      )}

      {/* Resultados de búsqueda o sugerencias */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {query.trim() ? 'Resultados de búsqueda' : 'Estudiantes registrados'}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs">Buscando estudiantes...</span>
          </div>
        ) : displayList.length > 0 ? (
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {displayList.map((student) => {
              const isSelected = selectedStudent?.id === student.id
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onSelectStudent(student)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50 bg-white'}
                  `}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                    {getInitials(student.nombres, student.apellidos)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {student.nombres} {student.apellidos}
                    </p>
                    <p className="text-xs text-slate-400">ID: {student.identificacion}</p>
                  </div>
                  {isSelected ? (
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <span className="text-xs text-slate-400 hover:text-blue-600">Seleccionar</span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No se encontraron estudiantes coincidentes.
          </div>
        )}
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-100">
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!selectedStudent}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Continuar al Curso
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Step 2 – Course Selection
// ============================================================
interface Step2Props {
  student: Student
  selectedCourse: Course | null
  onSelectCourse: (course: Course) => void
  onNext: () => void
  onBack: () => void
}

function Step2({ student, selectedCourse, onSelectCourse, onNext, onBack }: Step2Props) {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [availableCourses, studentEnrollments] = await Promise.all([
          coursesAPI.getAvailable(),
          enrollmentsAPI.findByStudent(student.id),
        ])
        setCourses(availableCourses)
        setEnrolledCourseIds(
          new Set(
            studentEnrollments
              .filter((e) => e.estado === 'activa')
              .map((e) => e.course_id)
          )
        )
      } catch {
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [student.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-xs">Cargando cursos disponibles...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-0.5">Paso 2: Seleccionar curso disponible</h3>
        <p className="text-xs text-slate-500">
          Matriculando a <strong className="text-slate-700">{student.nombres} {student.apellidos}</strong>.
        </p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-slate-400" />}
          title="Sin cursos disponibles"
          description="No hay cursos activos con cupos disponibles en este momento."
        />
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {courses.map((course) => {
            const alreadyEnrolled = enrolledCourseIds.has(course.id)
            const isSelected = selectedCourse?.id === course.id
            const cupos = course.cupos_disponibles ?? (course.capacidad - (course.estudiantes_inscritos ?? 0))
            const isDisabled = alreadyEnrolled

            return (
              <button
                key={course.id}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onSelectCourse(course)}
                className={`
                  w-full text-left rounded-xl border p-3.5 transition-all duration-150
                  ${
                    isDisabled
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{course.nombre}</p>
                        <span className="text-xs font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {course.codigo}
                        </span>
                      </div>
                      {course.docente && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          Docente: {course.docente}
                        </p>
                      )}
                      {course.horario && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {course.horario}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      ${Number(course.precio || 0).toFixed(2)}
                    </span>
                    {alreadyEnrolled ? (
                      <Badge variant="info" size="sm">Ya inscrito</Badge>
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        cupos > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cupos} cupos libres
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Elegido
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-between pt-3 border-t border-slate-100">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!selectedCourse}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Confirmar Datos
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Step 3 – Confirmation
// ============================================================
const BANK_OPTIONS = [
  { value: 'BANCO GUAYAQUIL', label: 'BANCO GUAYAQUIL' },
  { value: 'BANCO PICHINCHA', label: 'BANCO PICHINCHA' },
  { value: 'BANCO PACIFICO', label: 'BANCO PACIFICO' },
  { value: 'BANCO BOLIVARIANO', label: 'BANCO BOLIVARIANO' },
  { value: 'BANCO INTERNACIONAL', label: 'BANCO INTERNACIONAL' },
  { value: 'COOPERATIVA JEP', label: 'COOPERATIVA JEP' },
  { value: 'EFECTIVO / CAJA', label: 'EFECTIVO / CAJA' },
  { value: 'OTRO', label: 'OTRO' },
]

const PAYMENT_TYPE_OPTIONS = [
  { value: 'TRANSFERENCIA', label: 'TRANSFERENCIA' },
  { value: 'EFECTIVO', label: 'EFECTIVO' },
  { value: 'DEPÓSITO', label: 'DEPÓSITO' },
  { value: 'TARJETA', label: 'TARJETA' },
]

interface PaymentDetails {
  valor: number
  tipo_pago: string
  banco_remitente: string
  banco_beneficiario: string
  comprobante?: string
}

// ============================================================
// Step 3 – Confirmation
// ============================================================
interface Step3Props {
  student: Student
  course: Course
  onConfirm: (data: CreateEnrollmentDto, payment?: PaymentDetails) => void
  onBack: () => void
  loading: boolean
}

function Step3({ student, course, onConfirm, onBack, loading }: Step3Props) {
  const [fecha, setFecha] = useState(getTodayDate())
  const [estado, setEstado] = useState<'activa' | 'finalizada' | 'cancelada'>('activa')

  const coursePrice = Number(course.precio || 0)
  const [montoCancela, setMontoCancela] = useState<number>(coursePrice)
  const [tipoPago, setTipoPago] = useState('TRANSFERENCIA')
  const [bancoRemitente, setBancoRemitente] = useState('BANCO GUAYAQUIL')
  const [bancoBeneficiario, setBancoBeneficiario] = useState('BANCO GUAYAQUIL')
  const [comprobante, setComprobante] = useState('')

  const saldoPendiente = Math.max(0, coursePrice - (Number(montoCancela) || 0))
  const isOverLimit = Number(montoCancela) > coursePrice

  const handleConfirm = () => {
    if (isOverLimit || Number(montoCancela) < 0) {
      return
    }
    const payment: PaymentDetails | undefined =
      Number(montoCancela) > 0
        ? {
            valor: Number(montoCancela),
            tipo_pago: tipoPago,
            banco_remitente: bancoRemitente,
            banco_beneficiario: bancoBeneficiario,
            comprobante: comprobante.trim() || undefined,
          }
        : undefined

    onConfirm(
      {
        student_id: student.id,
        course_id: course.id,
        fecha_inscripcion: fecha,
        estado,
      },
      payment
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-0.5">Paso 3: Confirmar inscripción y pago</h3>
        <p className="text-xs text-slate-500">Revisa la información del estudiante, el costo del curso y cuánto cancela ahora.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Resumen Estudiante */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Estudiante
          </p>
          <div className="space-y-1">
            <p className="font-bold text-slate-900 text-sm">
              {student.nombres} {student.apellidos}
            </p>
            <p className="text-xs text-slate-500">Identificación: <span className="font-mono text-slate-700">{student.identificacion}</span></p>
            {student.correo && <p className="text-xs text-slate-500">Correo: {student.correo}</p>}
            {student.telefono && <p className="text-xs text-slate-500">Tel: {student.telefono}</p>}
          </div>
        </div>

        {/* Resumen Curso y Precio */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Curso a Matricular
          </p>
          <div className="space-y-1">
            <p className="font-bold text-slate-900 text-sm">{course.nombre}</p>
            <p className="text-xs text-slate-500">Código: <span className="font-mono text-slate-700">{course.codigo}</span></p>
            {course.docente && <p className="text-xs text-slate-500">Docente: {course.docente}</p>}
            {course.horario && <p className="text-xs text-slate-500">Horario: {course.horario}</p>}
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-1.5 mt-2">
              <span className="text-xs font-semibold text-slate-600">Precio del curso:</span>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                ${coursePrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sección de Cobro / Cancelación de Matrícula ── */}
      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Cobro de Matrícula / Abono
            </h4>
            <p className="text-[11px] text-slate-500">
              Registra el valor que cancela el estudiante al momento de inscribirse
            </p>
          </div>

          <div>
            {saldoPendiente === 0 && Number(montoCancela) > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Pago Completo ($0.00 saldo)
              </span>
            ) : saldoPendiente > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Saldo por cobrar: ${saldoPendiente.toFixed(2)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                Sin pago inicial
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ¿Cuánto cancela ahora? ($) *
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${
                isOverLimit ? 'text-rose-500' : 'text-slate-400'
              }`}>$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={coursePrice}
                placeholder="0.00"
                value={montoCancela}
                onChange={(e) => setMontoCancela(parseFloat(e.target.value) || 0)}
                className={`w-full pl-7 pr-3 py-2 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 ${
                  isOverLimit
                    ? 'bg-rose-50 border-rose-500 text-rose-900 focus:ring-rose-500'
                    : 'bg-white border-slate-300 text-slate-800 focus:ring-blue-500'
                }`}
              />
            </div>
            {isOverLimit && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                No puede registrar un pago mayor a ${coursePrice.toFixed(2)} (precio total del curso)
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Método de pago
            </label>
            <select
              disabled={Number(montoCancela) <= 0}
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {PAYMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {Number(montoCancela) > 0 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banco Remitente
                </label>
                <select
                  value={bancoRemitente}
                  onChange={(e) => setBancoRemitente(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BANK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banco Beneficiario (Receptor)
                </label>
                <select
                  value={bancoBeneficiario}
                  onChange={(e) => setBancoBeneficiario(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BANK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Comprobante / Referencia (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: TR-0091823"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Parámetros de la inscripción */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Fecha de inscripción
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Estado inicial
          </label>
          <Select
            value={estado}
            onChange={(e) => setEstado(e.target.value as typeof estado)}
            options={[
              { value: 'activa', label: 'Activa' },
              { value: 'finalizada', label: 'Finalizada' },
              { value: 'cancelada', label: 'Cancelada' },
            ]}
          />
        </div>
      </div>

      <div className="flex justify-between pt-3 border-t border-slate-100">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Volver
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          loading={loading}
          disabled={loading || isOverLimit || Number(montoCancela) < 0}
          icon={<CheckCircle className="w-4 h-4" />}
          iconPosition="left"
        >
          Confirmar Inscripción
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Main Page: Inscripciones
// ============================================================
export default function Enrollments() {
  const { showSuccess, showError, showWarning } = useUIStore()

  // Modal wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(null)

  // Enrollments table state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filtered, setFiltered] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Status change modal state
  const [statusTarget, setStatusTarget] = useState<{
    enrollment: Enrollment
    newStatus: 'finalizada' | 'cancelada'
  } | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  // Load enrollments
  const loadEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await enrollmentsAPI.findAll()
      setEnrollments(data)
      setFiltered(data)
    } catch {
      setEnrollments([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEnrollments()
  }, [loadEnrollments])

  // Filter
  useEffect(() => {
    let result = enrollments
    if (statusFilter) {
      result = result.filter((e) => e.estado === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          `${e.estudiante_nombres ?? ''} ${e.estudiante_apellidos ?? ''}`.toLowerCase().includes(q) ||
          (e.estudiante_identificacion ?? '').toLowerCase().includes(q) ||
          (e.curso_nombre ?? '').toLowerCase().includes(q) ||
          (e.curso_codigo ?? '').toLowerCase().includes(q) ||
          (e.docente ?? '').toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [enrollments, searchQuery, statusFilter])

  // Open Wizard
  const handleOpenWizard = () => {
    setCurrentStep(1)
    setSelectedStudent(null)
    setSelectedCourse(null)
    setIsWizardOpen(true)
  }

  // Confirm enrollment & process payment if entered
  const handleConfirmEnrollment = async (
    data: CreateEnrollmentDto,
    payment?: {
      valor: number
      tipo_pago: string
      banco_remitente: string
      banco_beneficiario: string
      comprobante?: string
    }
  ) => {
    setConfirmLoading(true)
    try {
      // Validate duplicate
      const isDuplicate = await enrollmentsAPI.checkDuplicate(data.student_id, data.course_id)
      if (isDuplicate) {
        showWarning(
          'Ya inscrito',
          'Este estudiante ya tiene una inscripción activa en este curso.'
        )
        setConfirmLoading(false)
        return
      }
      // Validate capacity
      const capacity = await enrollmentsAPI.checkCapacity(data.course_id)
      if (!capacity.hasSpace) {
        showWarning(
          'Sin cupos',
          'El curso seleccionado no tiene cupos disponibles.'
        )
        setConfirmLoading(false)
        return
      }

      await enrollmentsAPI.create(data)

      // Registrar cobro en pagos y caja si el estudiante canceló algún monto
      if (payment && payment.valor > 0) {
        try {
          const coursePrice = Number(selectedCourse?.precio || 0)
          const concepto =
            payment.valor >= coursePrice && coursePrice > 0
              ? `PAGO TOTAL MATRÍCULA - ${selectedCourse?.nombre}`
              : `ABONO MATRÍCULA - ${selectedCourse?.nombre}`

          const activeSecretary = useSettingsStore.getState().getActiveSecretaryName()
          await paymentsAPI.create({
            student_id: data.student_id,
            apellidos_nombres: `${selectedStudent?.apellidos} ${selectedStudent?.nombres}`.toUpperCase(),
            horario: selectedCourse?.horario || selectedCourse?.nombre,
            valor: payment.valor,
            tipo_pago: payment.tipo_pago,
            banco_remitente: payment.banco_remitente,
            banco_beneficiario: payment.banco_beneficiario,
            concepto,
            comprobante: payment.comprobante,
            fecha: data.fecha_inscripcion || getTodayDate(),
            secretaria: activeSecretary,
          })

          showSuccess(
            '¡Inscripción y Cobro Exitosos!',
            `${selectedStudent?.nombres} ${selectedStudent?.apellidos} fue inscrito en "${selectedCourse?.nombre}" y se registró el cobro de $${payment.valor.toFixed(2)} en caja.`
          )

          const isCancelado = payment.valor >= coursePrice && coursePrice > 0
          const receiptNo = await useSettingsStore.getState().getNextReceiptNumber()
          setReceiptModalData({
            receiptNumber: receiptNo,
            fecha: data.fecha_inscripcion || getTodayDate(),
            studentName: `${selectedStudent?.apellidos} ${selectedStudent?.nombres}`.toUpperCase(),
            courseName: selectedCourse?.nombre || '',
            conceptText: isCancelado
              ? 'PAGO POR CONCEPTO DE: MATRÍCULA'
              : 'ABONO POR CONCEPTO DE: MATRÍCULA',
            quotaIndicator: '(1/1)',
            monto: payment.valor,
            tipoPago: payment.tipo_pago === 'EFECTIVO' ? 'Efectivo' : (payment.tipo_pago || 'Transferencia'),
            banco: payment.tipo_pago === 'EFECTIVO' ? undefined : payment.banco_remitente,
            estado: isCancelado ? 'Pagado' : 'Abono',
            observaciones: payment.comprobante ? `Comprobante: ${payment.comprobante}` : undefined,
            comprobante: payment.comprobante,
            secretaria: activeSecretary,
          })
        } catch (payErr) {
          console.error('Error al registrar cobro de matrícula:', payErr)
          showSuccess(
            '¡Inscripción realizada!',
            `${selectedStudent?.nombres} ${selectedStudent?.apellidos} fue inscrito en "${selectedCourse?.nombre}".`
          )
        }
      } else {
        showSuccess(
          '¡Inscripción realizada!',
          `${selectedStudent?.nombres} ${selectedStudent?.apellidos} fue inscrito en "${selectedCourse?.nombre}" exitosamente.`
        )
      }

      setIsWizardOpen(false)
      await loadEnrollments()
    } catch {
      showError('Error al inscribir', 'No se pudo completar la inscripción.')
    } finally {
      setConfirmLoading(false)
    }
  }

  // Delete enrollment
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await enrollmentsAPI.delete(deleteTarget.id)
      showSuccess('Inscripción eliminada', 'La inscripción fue eliminada correctamente.')
      setDeleteTarget(null)
      await loadEnrollments()
    } catch {
      showError('Error al eliminar', 'No se pudo eliminar la inscripción.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Update status
  const handleUpdateStatus = async () => {
    if (!statusTarget) return
    setStatusLoading(true)
    try {
      await enrollmentsAPI.updateStatus(statusTarget.enrollment.id, statusTarget.newStatus)
      showSuccess(
        'Estado actualizado',
        `La inscripción fue marcada como ${statusTarget.newStatus}.`
      )
      setStatusTarget(null)
      await loadEnrollments()
    } catch {
      showError('Error al actualizar', 'No se pudo cambiar el estado de la inscripción.')
    } finally {
      setStatusLoading(false)
    }
  }

  // Table columns
  const columns: Column<Enrollment>[] = [
    {
      key: 'estudiante_nombres',
      header: 'Estudiante',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
            {row.estudiante_nombres ? row.estudiante_nombres.charAt(0).toUpperCase() : 'E'}
            {row.estudiante_apellidos ? row.estudiante_apellidos.charAt(0).toUpperCase() : ''}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-800 text-sm truncate">
              {row.estudiante_nombres} {row.estudiante_apellidos}
            </p>
            <p className="text-xs text-slate-400 font-mono">C.I. {row.estudiante_identificacion}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'curso_nombre',
      header: 'Curso',
      sortable: true,
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-medium text-slate-800 text-sm">{row.curso_nombre}</p>
          {row.curso_codigo && (
            <span className="font-mono text-xs text-slate-400">{row.curso_codigo}</span>
          )}
        </div>
      ),
    },
    {
      key: 'docente',
      header: 'Docente a cargo',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.docente || '—'}
        </span>
      ),
    },
    {
      key: 'fecha_inscripcion',
      header: 'Fecha de inscripción',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDate(row.fecha_inscripcion)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      render: (row) => (
        <Badge variant={getEstadoBadgeVariant(row.estado)} dot>
          {getEstadoLabel(row.estado)}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Encabezado Principal ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Inscripciones</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                Control y registro de matrículas de estudiantes en cursos
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenWizard}
          >
            Inscribir estudiante
          </Button>
        </div>
      </div>

      {/* ── Sección de la Lista de Inscripciones ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra de filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Historial de matrículas
            </h2>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Filtro por estado */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="activa">Activas</option>
              <option value="finalizada">Finalizadas</option>
              <option value="cancelada">Canceladas</option>
            </select>

            <div className="w-full sm:w-72">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar por estudiante, curso o docente..."
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="p-6">
          {!loading && enrollments.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-10 h-10 text-slate-400" />}
              title="No hay inscripciones registradas"
              description="Registra la primera matrícula usando el botón de Inscribir estudiante."
              action={
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenWizard}>
                  Inscribir estudiante
                </Button>
              }
            />
          ) : (
            <DataTable<Enrollment>
              data={filtered}
              columns={columns}
              loading={loading}
              emptyMessage="No se encontraron inscripciones que coincidan con la búsqueda."
              pageSize={10}
              actions={(row) => (
                <div className="flex items-center gap-1">
                  {/* Finalizar */}
                  {row.estado === 'activa' && (
                    <button
                      type="button"
                      onClick={() => setStatusTarget({ enrollment: row, newStatus: 'finalizada' })}
                      title="Marcar como finalizada"
                      className="p-1.5 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {/* Cancelar */}
                  {row.estado === 'activa' && (
                    <button
                      type="button"
                      onClick={() => setStatusTarget({ enrollment: row, newStatus: 'cancelada' })}
                      title="Cancelar inscripción"
                      className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    title="Eliminar registro de inscripción"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            />
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL WIZARD: INSCRIBIR ESTUDIANTE (3 PASOS)
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Inscripción de Estudiante a Curso"
        size="xl"
      >
        <div className="p-1">
          <StepIndicator currentStep={currentStep} />

          {/* Paso 1: Estudiante */}
          {currentStep === 1 && (
            <Step1
              selectedStudent={selectedStudent}
              onSelectStudent={(student) => {
                setSelectedStudent(student)
                setSelectedCourse(null)
              }}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {/* Paso 2: Curso */}
          {currentStep === 2 && selectedStudent && (
            <Step2
              student={selectedStudent}
              selectedCourse={selectedCourse}
              onSelectCourse={setSelectedCourse}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {/* Paso 3: Confirmación */}
          {currentStep === 3 && selectedStudent && selectedCourse && (
            <Step3
              student={selectedStudent}
              course={selectedCourse}
              onConfirm={handleConfirmEnrollment}
              onBack={() => setCurrentStep(2)}
              loading={confirmLoading}
            />
          )}
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL CONFIRMAR CAMBIO DE ESTADO
      ═══════════════════════════════════════════════════════════════════ */}
      <ConfirmModal
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleUpdateStatus}
        title={statusTarget?.newStatus === 'cancelada' ? 'Cancelar matrícula' : 'Finalizar matrícula'}
        message={
          statusTarget
            ? statusTarget.newStatus === 'cancelada'
              ? `¿Deseas cancelar la inscripción de ${statusTarget.enrollment.estudiante_nombres} ${statusTarget.enrollment.estudiante_apellidos} en "${statusTarget.enrollment.curso_nombre}"?`
              : `¿Deseas marcar como finalizada la inscripción de ${statusTarget.enrollment.estudiante_nombres} ${statusTarget.enrollment.estudiante_apellidos} en "${statusTarget.enrollment.curso_nombre}"?`
            : ''
        }
        confirmLabel={statusTarget?.newStatus === 'cancelada' ? 'Sí, cancelar matrícula' : 'Sí, finalizar'}
        variant={statusTarget?.newStatus === 'cancelada' ? 'danger' : 'warning'}
        loading={statusLoading}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL CONFIRMAR ELIMINACIÓN
      ═══════════════════════════════════════════════════════════════════ */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar matrícula"
        message={
          deleteTarget
            ? `¿Estás seguro de eliminar el registro de inscripción de ${deleteTarget.estudiante_nombres} ${deleteTarget.estudiante_apellidos} en el curso "${deleteTarget.curso_nombre}"?`
            : ''
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Modal Recibo de Pago FECIP Oficial */}
      <PaymentReceiptModal
        isOpen={Boolean(receiptModalData)}
        onClose={() => setReceiptModalData(null)}
        data={receiptModalData}
      />
    </div>
  )
}
