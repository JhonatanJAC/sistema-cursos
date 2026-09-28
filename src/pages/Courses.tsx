import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  BookOpen,
  Pencil,
  Trash2,
  Plus,
  Users,
  Calendar,
  Clock,
  ChevronDown,
  Check,
  DollarSign,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  CheckCircle2,
  User,
  Search,
  Wallet,
  Receipt,
  AlertCircle,
  CreditCard,
  Download,
  CalendarRange,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { SearchInput } from '../components/ui/SearchInput'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Badge, getEstadoBadgeVariant, getEstadoLabel } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { coursesAPI, teachersAPI, enrollmentsAPI, studentsAPI, paymentsAPI, settingsAPI } from '../services/api'
import { useUIStore } from '../store/useUIStore'
import { formatDate } from '../utils/formatters'
import { PaymentReceiptModal, ReceiptData } from '../components/ui/PaymentReceiptModal'
import { useSettingsStore } from '../store/useSettingsStore'
import type { Course, Teacher, CreateCourseDto, Enrollment, Student, CreateEnrollmentDto } from '../types'

// ---------------------------------------------------------------------------
// Helpers para Registro de Pagos y Meses de Cobro
// ---------------------------------------------------------------------------
export interface PaymentMonth {
  key: string // Ej. '2026-05'
  label: string // Ej. 'MAYO'
  year: number
  month: number // 1-12
}

export function formatMatriculaDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const clean = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0]).trim()
  const parts = clean.split('-')
  if (parts.length < 3) return dateStr
  const day = parts[2]
  const monthIdx = parseInt(parts[1], 10) - 1
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthName = months[monthIdx] || parts[1]
  return `${day.padStart(2, '0')}-${monthName}`
}

export function calculatePaymentMonths(fechaInicio?: string, fechaFin?: string): PaymentMonth[] {
  if (!fechaInicio || !fechaFin) return []
  const startPart = fechaInicio.split('T')[0].trim()
  const endPart = fechaFin.split('T')[0].trim()
  const sParts = startPart.split('-').map(Number)
  const eParts = endPart.split('-').map(Number)

  if (sParts.length < 3 || eParts.length < 3) return []

  const sYear = sParts[0]
  const sMonth = sParts[1]
  const eYear = eParts[0]
  const eMonth = eParts[1]

  const monthNamesUpper = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]

  // "la fecha que se puso de inicio de esa fecha calcula el siguiente mes hasta el mes de finalización para que salgan los meses de cobros"
  let currYear = sYear
  let currMonth = sMonth + 1
  if (currMonth > 12) {
    currMonth = 1
    currYear += 1
  }

  const endTotal = eYear * 12 + eMonth
  let currTotal = currYear * 12 + currMonth

  // Si inicio + 1 supera la fecha fin (por ejemplo curso de 1 mes o misma fecha), incluir al menos el mes de inicio
  if (currTotal > endTotal) {
    return [{
      key: `${sYear}-${String(sMonth).padStart(2, '0')}`,
      label: monthNamesUpper[sMonth - 1] || 'MES 1',
      year: sYear,
      month: sMonth,
    }]
  }

  const months: PaymentMonth[] = []
  while (currTotal <= endTotal && months.length < 36) {
    months.push({
      key: `${currYear}-${String(currMonth).padStart(2, '0')}`,
      label: monthNamesUpper[currMonth - 1] || `MES ${currMonth}`,
      year: currYear,
      month: currMonth,
    })
    currMonth += 1
    if (currMonth > 12) {
      currMonth = 1
      currYear += 1
    }
    currTotal = currYear * 12 + currMonth
  }

  return months
}

const MONTHS_ES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

function parseDateParts(dateStr?: string) {
  if (!dateStr) {
    const now = new Date()
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      hasValue: false,
    }
  }
  const clean = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0]).trim()
  const parts = clean.split('-').map(Number)
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const now = new Date()
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      hasValue: false,
    }
  }
  return { day: parts[2], month: parts[1], year: parts[0], hasValue: true }
}

function formatDateFromParts(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDurationInfo(startDateStr?: string, endDateStr?: string) {
  if (!startDateStr || !endDateStr) return null
  const sParts = parseDateParts(startDateStr)
  const eParts = parseDateParts(endDateStr)
  if (!sParts.hasValue || !eParts.hasValue) return null

  const sTotalMonths = sParts.year * 12 + sParts.month
  const eTotalMonths = eParts.year * 12 + eParts.month

  if (eTotalMonths < sTotalMonths) {
    return {
      isInvalid: true,
      message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
      durationMonths: 0,
      formattedEnd: '',
      paymentMonths: [],
      paymentMonthsNames: '',
    }
  }

  const durationMonths = eTotalMonths - sTotalMonths
  const paymentMonths = calculatePaymentMonths(startDateStr, endDateStr)

  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]

  const formattedEnd = `${eParts.day} de ${monthNames[eParts.month - 1]} de ${eParts.year}`

  return {
    isInvalid: false,
    durationMonths: Math.max(1, durationMonths),
    formattedEnd,
    paymentMonths,
    paymentMonthsNames: paymentMonths.map((m) => m.label).join(', '),
  }
}

function formatCoursePeriodReadable(startDateStr?: string | null, endDateStr?: string | null): string {
  if (!startDateStr && !endDateStr) return 'Sin fechas definidas'

  const getMonthName = (mNum: number) => MONTHS_ES.find((m) => m.value === mNum)?.label || ''

  if (startDateStr && !endDateStr) {
    const s = parseDateParts(startDateStr)
    return `Desde ${s.day} de ${getMonthName(s.month)} ${s.year}`
  }

  const s = parseDateParts(startDateStr!)
  const e = parseDateParts(endDateStr!)

  if (!s.hasValue || !e.hasValue) {
    return `${startDateStr} — ${endDateStr}`
  }

  const sMonth = getMonthName(s.month)
  const eMonth = getMonthName(e.month)

  if (s.year === e.year) {
    return `${s.day} de ${sMonth} — ${e.day} de ${eMonth} ${s.year}`
  }

  return `${s.day} de ${sMonth} ${s.year} — ${e.day} de ${eMonth} ${e.year}`
}

interface CourseDateRangePickerProps {
  startDate: string
  endDate: string
  onChangeStart: (val: string) => void
  onChangeEnd: (val: string) => void
}

const CourseDateRangePicker: React.FC<CourseDateRangePickerProps> = ({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
}) => {
  const s = parseDateParts(startDate)
  const e = parseDateParts(endDate)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 1 + i)

  const updateStart = (d: number, m: number, y: number) => {
    const maxDays = new Date(y, m, 0).getDate()
    const validDay = Math.min(d, maxDays)
    onChangeStart(formatDateFromParts(y, m, validDay))
  }

  const updateEnd = (d: number, m: number, y: number) => {
    const maxDays = new Date(y, m, 0).getDate()
    const validDay = Math.min(d, maxDays)
    onChangeEnd(formatDateFromParts(y, m, validDay))
  }

  const addMonthsToEnd = (monthsToAdd: number) => {
    const startObj = s.hasValue ? s : parseDateParts(new Date().toISOString().split('T')[0])
    let y = startObj.year
    let m = startObj.month + monthsToAdd
    while (m > 12) {
      m -= 12
      y += 1
    }
    const maxDays = new Date(y, m, 0).getDate()
    const d = Math.min(startObj.day, maxDays)
    if (!s.hasValue) {
      onChangeStart(formatDateFromParts(startObj.year, startObj.month, startObj.day))
    }
    onChangeEnd(formatDateFromParts(y, m, d))
  }

  const durationInfo = getDurationInfo(startDate, endDate)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha de Inicio */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Fecha de Inicio del Curso
          </label>
          <div className="grid grid-cols-[1fr_1.6fr_1.1fr] gap-1.5">
            {/* Día */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Día</span>
              <select
                value={s.day}
                onChange={(ev) => updateStart(Number(ev.target.value), s.month, s.year)}
                className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Mes */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Mes</span>
              <select
                value={s.month}
                onChange={(ev) => updateStart(s.day, Number(ev.target.value), s.year)}
                className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTHS_ES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Año</span>
              <select
                value={s.year}
                onChange={(ev) => updateStart(s.day, s.month, Number(ev.target.value))}
                className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fecha de Fin */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Fecha de Fin del Curso
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">Duración:</span>
              <button
                type="button"
                onClick={() => addMonthsToEnd(3)}
                className="text-[10px] bg-slate-100 hover:bg-blue-50 text-blue-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold transition-colors"
                title="Establecer duración en 3 meses"
              >
                +3m
              </button>
              <button
                type="button"
                onClick={() => addMonthsToEnd(6)}
                className="text-[10px] bg-slate-100 hover:bg-blue-50 text-blue-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold transition-colors"
                title="Establecer duración en 6 meses"
              >
                +6m
              </button>
              <button
                type="button"
                onClick={() => addMonthsToEnd(8)}
                className="text-[10px] bg-slate-100 hover:bg-blue-50 text-blue-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold transition-colors"
                title="Establecer duración en 8 meses"
              >
                +8m
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1.6fr_1.1fr] gap-1.5">
            {/* Día */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Día</span>
              <select
                value={e.day}
                onChange={(ev) => updateEnd(Number(ev.target.value), e.month, e.year)}
                className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Mes */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Mes</span>
              <select
                value={e.month}
                onChange={(ev) => updateEnd(e.day, Number(ev.target.value), e.year)}
                className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTHS_ES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-1">Año</span>
              <select
                value={e.year}
                onChange={(ev) => updateEnd(e.day, e.month, Number(ev.target.value))}
                className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen dinámico del tiempo y meses calculados */}
      {durationInfo && (
        <div
          className={`p-2.5 rounded-lg border text-xs ${
            durationInfo.isInvalid
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50/60 border-blue-100 text-blue-950'
          }`}
        >
          {durationInfo.isInvalid ? (
            <p className="font-semibold">{durationInfo.message}</p>
          ) : (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold flex items-center gap-1.5 text-xs text-blue-900">
                  Duración del curso:{' '}
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-extrabold text-[11px]">
                    {durationInfo.durationMonths} meses
                  </span>
                </span>
                <span className="text-slate-600 text-xs">
                  Finaliza el: <strong className="text-slate-800 font-bold">{durationInfo.formattedEnd}</strong>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong>Meses de cobros generados ({durationInfo.paymentMonths.length}):</strong>{' '}
                <span className="text-blue-800 font-bold">{durationInfo.paymentMonthsNames || 'Ninguno'}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------
const DAYS_OF_WEEK = [
  { id: 'Lun', label: 'Lunes' },
  { id: 'Mar', label: 'Martes' },
  { id: 'Mié', label: 'Miércoles' },
  { id: 'Jue', label: 'Jueves' },
  { id: 'Vie', label: 'Viernes' },
  { id: 'Sáb', label: 'Sábado' },
  { id: 'Dom', label: 'Domingo' },
]

const DIAS_OPTIONS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

const HORAS_OPTIONS = [
  '07:00 - 09:00',
  '08:00 - 10:00',
  '09:00 - 11:00',
  '10:00 - 12:00',
  '14:00 - 16:00',
  '15:00 - 17:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '08:00 - 12:00',
  '08:00 - 13:00',
]

type EstadoFilter = 'todos' | 'activo' | 'inactivo' | 'finalizado'

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

// ---------------------------------------------------------------------------
// CourseCard component
// ---------------------------------------------------------------------------
interface CourseCardProps {
  course: Course
  teachers: Teacher[]
  onEdit: (course: Course) => void
  onDelete: (course: Course) => void
  onEnroll: (course: Course) => void
  onSelect: (course: Course) => void
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  teachers,
  onEdit,
  onDelete,
  onEnroll,
  onSelect,
}) => {
  const teacher = teachers.find((t) => t.id === course.teacher_id)
  const teacherName = teacher
    ? `${teacher.nombres} ${teacher.apellidos}`
    : course.teacher_id
    ? 'Docente no encontrado'
    : 'Sin docente asignado'

  const enrolled = course.estudiantes_inscritos ?? 0

  return (
    <div
      onClick={() => onSelect(course)}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col cursor-pointer group relative overflow-hidden"
    >
      <div className="h-1 bg-transparent group-hover:bg-blue-600 transition-colors w-full" />

      {/* Header */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors truncate">
                  {course.nombre}
                </h3>
                {course.codigo && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {course.codigo}
                  </span>
                )}
              </div>
            </div>
            <Badge variant={getEstadoBadgeVariant(course.estado)} className="flex-shrink-0 text-xs">
              {getEstadoLabel(course.estado)}
            </Badge>
          </div>

          {course.descripcion && (
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{course.descripcion}</p>
          )}

          {/* Teacher */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{teacherName}</span>
          </div>

          {/* Schedule */}
          {course.horario && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{course.horario}</span>
            </div>
          )}
        </div>

        <div>
          {/* Estudiantes inscritos */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium text-slate-600">Estudiantes inscritos:</span>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
              {enrolled}
            </span>
          </div>

          {/* Precio y Ver Inscripciones */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              ${Number(course.precio || 0).toFixed(2)}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Ver inscripciones →
            </span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
        {/* Botón rápido con ícono para Inscribir estudiante */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEnroll(course)
          }}
          title="Inscribir estudiante en este curso"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Inscribir</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e?.stopPropagation()
              onEdit(course)
            }}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200/80 transition-colors"
            title="Editar curso"
            aria-label="Editar curso"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e?.stopPropagation()
              onDelete(course)
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200/80 transition-colors"
            title="Eliminar curso"
            aria-label="Eliminar curso"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Courses page
// ---------------------------------------------------------------------------
const Courses: React.FC = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)

  // Vista de Detalle de Curso e Inscripciones
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseEnrollments, setCourseEnrollments] = useState<Enrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [enrollmentSearch, setEnrollmentSearch] = useState('')

  // Acciones en la lista de inscritos
  const [statusTarget, setStatusTarget] = useState<{
    enrollment: Enrollment
    newStatus: 'activa' | 'finalizada' | 'cancelada'
  } | null>(null)
  const [deleteEnrollmentTarget, setDeleteEnrollmentTarget] = useState<Enrollment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal para Inscribir Estudiante
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<Student | null>(null)
  const [montoCancela, setMontoCancela] = useState<number>(0)
  const [tipoPago, setTipoPago] = useState('TRANSFERENCIA')
  const [bancoRemitente, setBancoRemitente] = useState('BANCO GUAYAQUIL')
  const [bancoBeneficiario, setBancoBeneficiario] = useState('BANCO GUAYAQUIL')
  const [comprobante, setComprobante] = useState('')
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false)
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<number[]>([])
  const [formDias, setFormDias] = useState('')
  const [formHora, setFormHora] = useState('')
  const [showDiasDropdown, setShowDiasDropdown] = useState(false)
  const [showHoraDropdown, setShowHoraDropdown] = useState(false)

  // ── Pestañas y Registro de Pagos ───────────────────────────────────────────
  const [activeDetailTab, setActiveDetailTab] = useState<'estudiantes' | 'pagos'>('estudiantes')
  const [paymentGrid, setPaymentGrid] = useState<
    Record<
      string,
      {
        status: 'CANCELADO' | 'ABONO' | 'PENDIENTE'
        monto?: number
        fecha?: string
        tipo_pago?: string
        banco_remitente?: string
        banco_beneficiario?: string
        comprobante?: string
        observacion?: string
      }
    >
  >({})
  const [loadingPaymentGrid, setLoadingPaymentGrid] = useState(false)
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentCellModal, setPaymentCellModal] = useState<{
    studentId: number
    studentName: string
    monthKey: string
    monthLabel: string
    matriculaDate?: string
    currentStatus: 'CANCELADO' | 'ABONO' | 'PENDIENTE'
    previousAbono: number
    monto: number | string
    tipoPago: string
    bancoRemitente: string
    bancoBeneficiario: string
    fecha: string
    comprobante: string
    observacion: string
    recordPayment: boolean
  } | null>(null)

  // Recibo de pago generado
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(null)

  // Modal para configurar fechas de inicio y fin rápidamente
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false)
  const [tempFechaInicio, setTempFechaInicio] = useState('')
  const [tempFechaFin, setTempFechaFin] = useState('')
  const [savingDates, setSavingDates] = useState(false)

  const { addToast } = useUIStore()

  // ── React Hook Form ────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCourseDto>({
    defaultValues: {
      estado: 'activo',
      fecha_inicio: '',
      fecha_fin: '',
    },
  })

  const formFechaInicio = watch('fecha_inicio') || ''
  const formFechaFin = watch('fecha_fin') || ''

  const handleScheduleChange = (diasVal: string, horaVal: string) => {
    setFormDias(diasVal)
    setFormHora(horaVal)
    const combined = [diasVal.trim(), horaVal.trim()].filter(Boolean).join(' ')
    setValue('horario', combined, { shouldDirty: true })
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    try {
      const data = await coursesAPI.findAllWithDetails()
      setCourses(data)
      setSelectedCourse((prev) => {
        if (!prev) return null
        return data.find((c) => c.id === prev.id) || prev
      })
    } catch {
      addToast({ type: 'error', message: 'Error al cargar los cursos.' })
    }
  }, [addToast])

  const fetchTeachers = useCallback(async () => {
    try {
      const data = await teachersAPI.findAll()
      setTeachers(data.filter((t: Teacher) => t.estado === 'activo'))
    } catch {
      // Non-critical
    }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const data = await studentsAPI.findAll()
      setAllStudents(data || [])
    } catch {
      // Non-critical
    }
  }, [])

  const fetchCourseEnrollments = useCallback(async (courseId: number) => {
    try {
      setLoadingEnrollments(true)
      const data = await enrollmentsAPI.findByCourse(courseId)
      setCourseEnrollments(data || [])
    } catch (err) {
      console.error(err)
      setCourseEnrollments([])
    } finally {
      setLoadingEnrollments(false)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchCourses(), fetchTeachers(), fetchStudents()])
      setLoading(false)
    }
    load()
  }, [fetchCourses, fetchTeachers, fetchStudents])

  const loadPaymentGrid = useCallback(async (courseId: number) => {
    try {
      setLoadingPaymentGrid(true)
      const data = await settingsAPI.get(`course_payments_grid_${courseId}`)
      if (data) {
        setPaymentGrid(JSON.parse(data))
      } else {
        setPaymentGrid({})
      }
    } catch {
      setPaymentGrid({})
    } finally {
      setLoadingPaymentGrid(false)
    }
  }, [])

  // Cargar inscripciones y matriz de pagos cuando se selecciona un curso
  useEffect(() => {
    if (selectedCourse) {
      fetchCourseEnrollments(selectedCourse.id)
      loadPaymentGrid(selectedCourse.id)
    }
  }, [selectedCourse, fetchCourseEnrollments, loadPaymentGrid])

  // ── Modal de Inscripción Rápida ───────────────────────────────────────────
  const handleOpenEnroll = async (course: Course) => {
    setEnrollingCourse(course)
    setSelectedStudentForEnroll(null)
    setStudentSearchQuery('')
    setMontoCancela(Number(course.precio || 0))
    setTipoPago('TRANSFERENCIA')
    setBancoRemitente('BANCO GUAYAQUIL')
    setBancoBeneficiario('BANCO GUAYAQUIL')
    setComprobante('')

    try {
      const enrs = await enrollmentsAPI.findByCourse(course.id)
      const ids = (enrs || [])
        .filter((e) => e.estado === 'activa')
        .map((e) => e.student_id)
      setEnrolledStudentIds(ids)
    } catch {
      setEnrolledStudentIds([])
    }

    setIsEnrollModalOpen(true)
  }

  const handleConfirmEnrollment = async () => {
    if (!selectedStudentForEnroll || !enrollingCourse) return

    try {
      setIsSubmittingEnroll(true)

      // Verificación de duplicado previa
      const isDuplicate = await enrollmentsAPI.checkDuplicate(
        selectedStudentForEnroll.id,
        enrollingCourse.id
      )
      if (isDuplicate) {
        addToast({
          type: 'error',
          message: `El estudiante ${selectedStudentForEnroll.nombres} ya está matriculado en este curso. No se permite doble inscripción.`,
        })
        return
      }

      // 1. Crear inscripción
      await enrollmentsAPI.create({
        student_id: selectedStudentForEnroll.id,
        course_id: enrollingCourse.id,
        fecha_inscripcion: new Date().toISOString().split('T')[0],
        estado: 'activa',
      })

      // 2. Si cancela algún valor, registrar pago en ingresos
      if (Number(montoCancela) > 0) {
        await paymentsAPI.create({
          fecha: new Date().toISOString().split('T')[0],
          tipo_pago: tipoPago,
          banco_remitente: bancoRemitente,
          banco_beneficiario: bancoBeneficiario,
          student_id: selectedStudentForEnroll.id,
          apellidos_nombres: `${selectedStudentForEnroll.apellidos} ${selectedStudentForEnroll.nombres}`.trim(),
          horario: enrollingCourse.horario,
          valor: Number(montoCancela),
          concepto: `Matrícula: ${enrollingCourse.nombre}`,
          comprobante: comprobante.trim() || undefined,
        })
      }

      addToast({
        type: 'success',
        message: `Estudiante ${selectedStudentForEnroll.nombres} inscrito exitosamente en ${enrollingCourse.nombre}.`,
      })

      setIsEnrollModalOpen(false)

      // Refrescar cursos con conteo de inscritos actualizado
      const updatedCourses = await coursesAPI.findAllWithDetails()
      setCourses(updatedCourses)

      if (selectedCourse?.id === enrollingCourse.id) {
        const found = updatedCourses.find((c) => c.id === selectedCourse.id)
        if (found) setSelectedCourse(found)
        await fetchCourseEnrollments(enrollingCourse.id)
      }
    } catch (err: any) {
      const msg = err?.message || 'Error al procesar la inscripción.'
      addToast({ type: 'error', message: msg })
    } finally {
      setIsSubmittingEnroll(false)
    }
  }

  // ── Cambiar estado de inscripción ──────────────────────────────────────────
  const handleUpdateEnrollmentStatus = async () => {
    if (!statusTarget || !selectedCourse) return
    try {
      setActionLoading(true)
      await enrollmentsAPI.updateStatus(statusTarget.enrollment.id, statusTarget.newStatus)
      addToast({
        type: 'success',
        message: `Inscripción marcada como ${statusTarget.newStatus}.`,
      })
      setStatusTarget(null)
      await fetchCourseEnrollments(selectedCourse.id)
      await fetchCourses()
    } catch {
      addToast({ type: 'error', message: 'No se pudo actualizar el estado de la inscripción.' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Eliminar inscripción ───────────────────────────────────────────────────
  const handleDeleteEnrollment = async () => {
    if (!deleteEnrollmentTarget || !selectedCourse) return
    try {
      setActionLoading(true)
      await enrollmentsAPI.delete(deleteEnrollmentTarget.id)
      addToast({
        type: 'success',
        message: 'Inscripción eliminada correctamente.',
      })
      setDeleteEnrollmentTarget(null)
      await fetchCourseEnrollments(selectedCourse.id)
      await fetchCourses()
    } catch {
      addToast({ type: 'error', message: 'No se pudo eliminar la inscripción.' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado =
      estadoFilter === 'todos' || c.estado === estadoFilter
    return matchesSearch && matchesEstado
  })

  // Estudiantes filtrados en el modal de inscripción
  const filteredStudentsForEnroll = useMemo(() => {
    if (!studentSearchQuery) return allStudents.slice(0, 10)
    const q = studentSearchQuery.toLowerCase()
    return allStudents.filter(
      (s) =>
        s.nombres.toLowerCase().includes(q) ||
        s.apellidos.toLowerCase().includes(q) ||
        s.identificacion.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [allStudents, studentSearchQuery])

  // Estudiantes inscritos filtrados en el curso seleccionado
  const filteredCourseEnrollments = useMemo(() => {
    if (!enrollmentSearch) return courseEnrollments
    const q = enrollmentSearch.toLowerCase()
    return courseEnrollments.filter(
      (e) =>
        e.estudiante_nombres?.toLowerCase().includes(q) ||
        e.estudiante_apellidos?.toLowerCase().includes(q) ||
        e.estudiante_identificacion?.toLowerCase().includes(q)
    )
  }, [courseEnrollments, enrollmentSearch])

  // Estudiantes filtrados en la pestaña de registro de pagos
  const filteredEnrollmentsForPayments = useMemo(() => {
    if (!paymentSearch) return courseEnrollments
    const q = paymentSearch.toLowerCase()
    return courseEnrollments.filter(
      (e) =>
        e.estudiante_nombres?.toLowerCase().includes(q) ||
        e.estudiante_apellidos?.toLowerCase().includes(q) ||
        e.estudiante_identificacion?.toLowerCase().includes(q)
    )
  }, [courseEnrollments, paymentSearch])

  // Meses de cobro calculados automáticamente:
  // "la fecha que se puso de inicio de esa fecha calcula el siguiente mes hasta el mes de finalización para que salgan los meses de cobros"
  const calculatedMonths = useMemo(() => {
    if (!selectedCourse) return []
    return calculatePaymentMonths(selectedCourse.fecha_inicio, selectedCourse.fecha_fin)
  }, [selectedCourse?.fecha_inicio, selectedCourse?.fecha_fin])

  // Métricas del registro de pagos para el curso
  const paymentStats = useMemo(() => {
    let cancelados = 0
    let abonos = 0
    const totalCeldas = courseEnrollments.length * calculatedMonths.length
    for (const enr of courseEnrollments) {
      for (const m of calculatedMonths) {
        const key = `${enr.student_id}_${m.key}`
        const status = paymentGrid[key]?.status
        if (status === 'CANCELADO') cancelados++
        else if (status === 'ABONO') abonos++
      }
    }
    const pendientes = Math.max(0, totalCeldas - cancelados - abonos)
    return { cancelados, abonos, pendientes, totalCeldas }
  }, [courseEnrollments, calculatedMonths, paymentGrid])

  // Guardar estado de una celda de pago
  const handleSavePaymentCell = async () => {
    if (!paymentCellModal || !selectedCourse) return
    const {
      studentId,
      monthKey,
      previousAbono,
      monto,
      tipoPago,
      bancoRemitente,
      bancoBeneficiario,
      fecha,
      comprobante,
      observacion,
      recordPayment,
      studentName,
    } = paymentCellModal

    const cellKey = `${studentId}_${monthKey}`
    const updated = { ...paymentGrid }
    const coursePrice = Number(selectedCourse.precio || 0)
    const prevAbono = Number(previousAbono || 0)
    const loRestante = Math.max(0, coursePrice - prevAbono)
    const maxAllowed = prevAbono > 0 ? loRestante : coursePrice
    const cobradoAhora = Number(monto) || 0

    if (cobradoAhora > maxAllowed) {
      addToast({
        type: 'warning',
        title: 'Monto no permitido',
        message: prevAbono > 0
          ? `No se puede registrar un cobro de $${cobradoAhora.toFixed(2)}. Lo restante a pagar es solo $${loRestante.toFixed(2)}.`
          : `No se puede registrar un cobro de $${cobradoAhora.toFixed(2)}. El valor total de la cuota es solo $${coursePrice.toFixed(2)}.`,
      })
      return
    }

    if (cobradoAhora < 0) {
      addToast({
        type: 'warning',
        title: 'Monto inválido',
        message: 'El valor cobrado no puede ser negativo.',
      })
      return
    }

    const nuevoTotal = prevAbono > 0 ? prevAbono + cobradoAhora : cobradoAhora

    let autoStatus: 'CANCELADO' | 'ABONO' | 'PENDIENTE' = 'PENDIENTE'
    if (nuevoTotal >= coursePrice && coursePrice > 0) {
      autoStatus = 'CANCELADO'
    } else if (nuevoTotal > 0) {
      autoStatus = 'ABONO'
    } else {
      autoStatus = 'PENDIENTE'
    }

    const finalMonto = autoStatus === 'CANCELADO' ? coursePrice : nuevoTotal

    const activeSecretary = useSettingsStore.getState().getActiveSecretaryName()
    const existingSecretary = paymentGrid[cellKey]?.secretaria
    const targetSecretary = existingSecretary || activeSecretary

    if (autoStatus === 'PENDIENTE' || finalMonto === 0) {
      delete updated[cellKey]
    } else {
      updated[cellKey] = {
        status: autoStatus,
        monto: finalMonto,
        fecha: fecha || new Date().toISOString().split('T')[0],
        tipo_pago: tipoPago || 'TRANSFERENCIA',
        banco_remitente: tipoPago === 'EFECTIVO' ? 'EFECTIVO / CAJA' : (bancoRemitente || 'BANCO GUAYAQUIL'),
        banco_beneficiario: tipoPago === 'EFECTIVO' ? 'EFECTIVO / CAJA' : (bancoBeneficiario || 'BANCO GUAYAQUIL'),
        comprobante: comprobante.trim() || undefined,
        observacion: observacion.trim() || undefined,
        secretaria: targetSecretary,
      }
    }

    setPaymentGrid(updated)
    setPaymentCellModal(null)

    try {
      await settingsAPI.set(`course_payments_grid_${selectedCourse.id}`, JSON.stringify(updated))
      addToast({
        type: 'success',
        title: 'Pago actualizado',
        message:
          autoStatus === 'PENDIENTE'
            ? `Se dejó la cuota de ${paymentCellModal.monthLabel} como pendiente.`
            : `Cobro guardado como "${autoStatus}" ($${finalMonto.toFixed(2)}) para ${paymentCellModal.monthLabel}.`,
      })

      if (recordPayment && cobradoAhora > 0) {
        await paymentsAPI.create({
          fecha: fecha || new Date().toISOString().split('T')[0],
          tipo_pago: tipoPago || 'TRANSFERENCIA',
          banco_remitente: tipoPago === 'EFECTIVO' ? 'EFECTIVO / CAJA' : (bancoRemitente || 'BANCO GUAYAQUIL'),
          banco_beneficiario: tipoPago === 'EFECTIVO' ? 'EFECTIVO / CAJA' : (bancoBeneficiario || 'BANCO GUAYAQUIL'),
          student_id: studentId,
          apellidos_nombres: studentName,
          horario: selectedCourse.horario,
          valor: Number(cobradoAhora),
          concepto:
            autoStatus === 'CANCELADO'
              ? `Liquidación Cuota ${paymentCellModal.monthLabel}: ${selectedCourse.nombre}`
              : `Abono Cuota ${paymentCellModal.monthLabel}: ${selectedCourse.nombre}`,
          comprobante: comprobante.trim() || undefined,
          secretaria: targetSecretary,
        })
      }

      if (cobradoAhora > 0) {
        const monthIdx = calculatedMonths.findIndex((m) => m.key === monthKey)
        const quotaStr = calculatedMonths.length > 0 && monthIdx >= 0 ? `(${monthIdx + 1}/${calculatedMonths.length})` : ''
        const receiptNo = await useSettingsStore.getState().getNextReceiptNumber()
        setReceiptModalData({
          receiptNumber: receiptNo,
          fecha: fecha || new Date().toISOString().split('T')[0],
          studentName: studentName,
          courseName: selectedCourse.nombre,
          conceptText: autoStatus === 'CANCELADO'
            ? `PAGO POR CONCEPTO DE: MENSUALIDAD - ${paymentCellModal.monthLabel.toUpperCase()}`
            : `ABONO POR CONCEPTO DE: MENSUALIDAD - ${paymentCellModal.monthLabel.toUpperCase()}`,
          quotaIndicator: quotaStr,
          monto: cobradoAhora,
          tipoPago: tipoPago === 'EFECTIVO' ? 'Efectivo' : (tipoPago || 'Transferencia'),
          banco: tipoPago === 'EFECTIVO' ? undefined : (bancoRemitente || 'BANCO GUAYAQUIL'),
          estado: autoStatus === 'CANCELADO' ? 'Pagado' : 'Abono',
          observaciones: observacion.trim() || undefined,
          comprobante: comprobante.trim() || undefined,
          secretaria: targetSecretary,
        })
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error de guardado',
        message: 'No se pudo guardar el registro de pago.',
      })
    }
  }

  // Abrir modal para registrar un nuevo pago desde el botón de la barra de herramientas
  const handleOpenNewPaymentModal = () => {
    if (!selectedCourse) return
    if (courseEnrollments.length === 0) {
      addToast({
        type: 'warning',
        message: 'No hay estudiantes matriculados en este curso para registrar pagos.',
      })
      return
    }
    if (calculatedMonths.length === 0) {
      addToast({
        type: 'warning',
        message: 'Configura las fechas de inicio y fin del curso para generar los meses de cobro.',
      })
      return
    }

    const firstStudent = courseEnrollments[0]
    const studentName = `${firstStudent.estudiante_nombres || ''} ${firstStudent.estudiante_apellidos || ''}`.trim()
    const firstMonth = calculatedMonths[0]
    const cellKey = `${firstStudent.student_id}_${firstMonth.key}`
    const existing = paymentGrid[cellKey]
    const coursePrice = Number(selectedCourse.precio || 0)
    const isExistingAbono = existing?.status === 'ABONO'
    const prevAbono = isExistingAbono ? Number(existing?.monto || 0) : 0
    const loRestante = Math.max(0, coursePrice - prevAbono)

    setPaymentCellModal({
      studentId: firstStudent.student_id,
      studentName,
      monthKey: firstMonth.key,
      monthLabel: firstMonth.label,
      matriculaDate: firstStudent.fecha_inscripcion,
      currentStatus: existing?.status || 'CANCELADO',
      previousAbono: prevAbono,
      monto: prevAbono > 0 ? loRestante : (existing?.monto ?? coursePrice),
      tipoPago: existing?.tipo_pago || 'TRANSFERENCIA',
      bancoRemitente: existing?.banco_remitente || 'BANCO GUAYAQUIL',
      bancoBeneficiario: existing?.banco_beneficiario || 'BANCO GUAYAQUIL',
      fecha: existing?.fecha || new Date().toISOString().split('T')[0],
      comprobante: existing?.comprobante || '',
      observacion: existing?.observacion || '',
      recordPayment: true,
    })
  }

  // Abrir directamente el recibo oficial de pago FECIP de una celda mensual
  const handleOpenReceiptForCell = async (
    studentName: string,
    monthKey: string,
    monthLabel: string,
    cell?: any,
    status: 'CANCELADO' | 'ABONO' | 'PENDIENTE' = 'CANCELADO'
  ) => {
    if (!selectedCourse) return
    const monthIdx = calculatedMonths.findIndex((m) => m.key === monthKey)
    const quotaStr =
      calculatedMonths.length > 0 && monthIdx >= 0
        ? `(${monthIdx + 1}/${calculatedMonths.length})`
        : ''

    const receiptNo = await useSettingsStore.getState().getNextReceiptNumber()

    setReceiptModalData({
      receiptNumber: receiptNo,
      fecha: cell?.fecha || new Date().toISOString().split('T')[0],
      studentName,
      courseName: selectedCourse.nombre,
      conceptText: `PAGO POR CONCEPTO DE: MENSUALIDAD - ${monthLabel.toUpperCase()}`,
      quotaIndicator: quotaStr,
      monto: Number(cell?.monto || selectedCourse.precio || 0),
      tipoPago: cell?.tipo_pago === 'EFECTIVO' ? 'Efectivo' : (cell?.tipo_pago || 'Transferencia'),
      banco: cell?.tipo_pago === 'EFECTIVO' ? undefined : cell?.banco_remitente,
      estado: status === 'CANCELADO' ? 'Pagado' : 'Abono',
      observaciones: cell?.observacion || undefined,
      comprobante: cell?.comprobante || undefined,
      secretaria: cell?.secretaria || undefined,
    })
  }

  // Guardar fechas de inicio y fin del curso desde la vista rápida
  const handleSaveCourseDates = async () => {
    if (!selectedCourse) return
    try {
      setSavingDates(true)
      await coursesAPI.update(selectedCourse.id, {
        fecha_inicio: tempFechaInicio || undefined,
        fecha_fin: tempFechaFin || undefined,
      })
      const updated = {
        ...selectedCourse,
        fecha_inicio: tempFechaInicio,
        fecha_fin: tempFechaFin,
      }
      setSelectedCourse(updated)
      setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setIsDatesModalOpen(false)
      addToast({
        type: 'success',
        message: 'Fechas del curso actualizadas correctamente.',
      })
    } catch {
      addToast({
        type: 'error',
        message: 'Error al actualizar las fechas del curso.',
      })
    } finally {
      setSavingDates(false)
    }
  }

  // Exportar matriz a Excel / CSV
  const handleExportPaymentsCSV = () => {
    if (!selectedCourse || calculatedMonths.length === 0) return
    const headers = ['ESTUDIANTE', 'IDENTIFICACIÓN', 'MATRICULA', ...calculatedMonths.map((m) => m.label)]

    const rows = filteredEnrollmentsForPayments.map((enr) => {
      const studentName = `${enr.estudiante_apellidos || ''} ${enr.estudiante_nombres || ''}`.trim()
      const id = enr.estudiante_identificacion || ''
      const matricula = formatMatriculaDate(enr.fecha_inscripcion)
      const monthCols = calculatedMonths.map((m) => {
        const cell = paymentGrid[`${enr.student_id}_${m.key}`]
        return cell?.status || ''
      })
      return [studentName, id, matricula, ...monthCols]
    })

    const csvContent = [
      headers.join(';'),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(';')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `Registro_Pagos_${selectedCourse.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Form helpers ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingCourse(null)
    setFormDias('')
    setFormHora('')
    setShowDiasDropdown(false)
    setShowHoraDropdown(false)
    reset({
      nombre: '',
      descripcion: '',
      teacher_id: undefined,
      precio: 0,
      fecha_inicio: '',
      fecha_fin: '',
      horario: '',
      estado: 'activo',
    })
    setIsFormOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditingCourse(course)
    setShowDiasDropdown(false)
    setShowHoraDropdown(false)
    const raw = (course.horario ?? '').trim()
    const timeMatch = raw.match(/\b([01]?\d|2[0-3]):[0-5]\d(\s*[-a]\s*([01]?\d|2[0-3]):[0-5]\d)?\b/i)
    if (timeMatch) {
      const horaStr = timeMatch[0]
      const diasStr = raw.replace(horaStr, '').trim()
      setFormDias(diasStr)
      setFormHora(horaStr)
    } else {
      setFormDias(raw)
      setFormHora('')
    }

    reset({
      nombre: course.nombre,
      descripcion: course.descripcion ?? '',
      teacher_id: course.teacher_id ?? undefined,
      precio: course.precio ?? 0,
      fecha_inicio: course.fecha_inicio
        ? course.fecha_inicio.substring(0, 10)
        : '',
      fecha_fin: course.fecha_fin
        ? course.fecha_fin.substring(0, 10)
        : '',
      horario: course.horario ?? '',
      estado: course.estado ?? 'activo',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingCourse(null)
    setShowDiasDropdown(false)
    setShowHoraDropdown(false)
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const onSubmit = async (data: CreateCourseDto) => {
    setSubmitting(true)
    try {
      const combinedHorario = [formDias.trim(), formHora.trim()].filter(Boolean).join(' ')
      const payload: any = {
        ...data,
        capacidad: editingCourse?.capacidad ?? 999,
        precio: typeof data.precio === 'number' ? data.precio : (Number(data.precio) || 0),
        teacher_id: data.teacher_id ? Number(data.teacher_id) : null,
        fecha_inicio: data.fecha_inicio || null,
        fecha_fin: data.fecha_fin || null,
        descripcion: data.descripcion || null,
        horario: combinedHorario || data.horario || null,
      }
      if (editingCourse?.codigo) {
        payload.codigo = editingCourse.codigo
      }

      if (editingCourse) {
        await coursesAPI.update(editingCourse.id, payload)
        addToast({ type: 'success', message: 'Curso actualizado correctamente.' })
      } else {
        await coursesAPI.create(payload)
        addToast({ type: 'success', message: 'Curso creado correctamente.' })
      }
      await fetchCourses()
      closeForm()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (editingCourse ? 'Error al actualizar el curso.' : 'Error al crear el curso.')
      addToast({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return
    try {
      await coursesAPI.delete(deletingCourse.id)
      addToast({ type: 'success', message: 'Curso eliminado correctamente.' })
      if (selectedCourse?.id === deletingCourse.id) {
        setSelectedCourse(null)
      }
      await fetchCourses()
    } catch {
      addToast({ type: 'error', message: 'Error al eliminar el curso.' })
    } finally {
      setDeletingCourse(null)
    }
  }

  // ── Filter buttons config ──────────────────────────────────────────────────
  const filterButtons: { label: string; value: EstadoFilter; count: number }[] = [
    { label: 'Todos', value: 'todos', count: courses.length },
    {
      label: 'Activos',
      value: 'activo',
      count: courses.filter((c) => c.estado === 'activo').length,
    },
    {
      label: 'Inactivos',
      value: 'inactivo',
      count: courses.filter((c) => c.estado === 'inactivo').length,
    },
    {
      label: 'Finalizados',
      value: 'finalizado',
      count: courses.filter((c) => c.estado === 'finalizado').length,
    },
  ]

  const teacherOptions = [
    { value: '', label: 'Sin docente asignado' },
    ...teachers.map((t) => ({
      value: String(t.id),
      label: `${t.nombres} ${t.apellidos}`,
    })),
  ]

  // Saldo pendiente calculado para el modal de inscripción
  const saldoPendienteEnroll = Math.max(
    0,
    Number(enrollingCourse?.precio || 0) - (Number(montoCancela) || 0)
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ══════════════════════════════════════════════════════════════════════
          VISTA 1: DETALLE DE CURSO Y LISTA DE ALUMNOS INSCRITOS
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedCourse ? (
        <div className="space-y-6 animate-fade-in">
          {/* Barra superior de navegación / Volver */}
          <div className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedCourse(null)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>Volver a todos los cursos</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(selectedCourse)}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors"
                title="Editar este curso"
                aria-label="Editar este curso"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeletingCourse(selectedCourse)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors"
                title="Eliminar este curso"
                aria-label="Eliminar este curso"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Button
                variant="primary"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => handleOpenEnroll(selectedCourse)}
              >
                Inscribir estudiante
              </Button>
            </div>
          </div>

          {/* Ficha resumen del curso */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">{selectedCourse.nombre}</h1>
                    {selectedCourse.codigo && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                        {selectedCourse.codigo}
                      </span>
                    )}
                    <Badge variant={getEstadoBadgeVariant(selectedCourse.estado)}>
                      {getEstadoLabel(selectedCourse.estado)}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedCourse.descripcion || 'Sin descripción adicional'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500">Precio del Curso:</span>
                <span className="text-base font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  ${Number(selectedCourse.precio || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Metadatos del curso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Docente asignado</span>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">
                  {teachers.find((t) => t.id === selectedCourse.teacher_id)
                    ? `${teachers.find((t) => t.id === selectedCourse.teacher_id)?.nombres} ${teachers.find((t) => t.id === selectedCourse.teacher_id)?.apellidos}`
                    : 'Sin asignar'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Horario de clases</span>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">
                  {selectedCourse.horario || 'Horario no definido'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium block">Período del curso</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempFechaInicio(selectedCourse.fecha_inicio?.substring(0, 10) || '')
                      setTempFechaFin(selectedCourse.fecha_fin?.substring(0, 10) || '')
                      setIsDatesModalOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold flex items-center gap-1"
                    title="Configurar fecha de inicio y fin"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                </div>
                <p className="font-semibold text-slate-800 mt-0.5 text-xs sm:text-[13px] leading-snug">
                  {formatCoursePeriodReadable(selectedCourse.fecha_inicio, selectedCourse.fecha_fin)}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Total Estudiantes</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {courseEnrollments.length} {courseEnrollments.length === 1 ? 'alumno matriculado' : 'alumnos matriculados'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Selector de Pestañas (Tabs) ── */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveDetailTab('estudiantes')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                activeDetailTab === 'estudiantes'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Lista de estudiantes</span>
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-bold ${
                  activeDetailTab === 'estudiantes'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 text-slate-700'
                }`}
              >
                {courseEnrollments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDetailTab('pagos')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                activeDetailTab === 'pagos'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Registro de pago</span>
              {calculatedMonths.length > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 text-xs rounded-full font-bold ${
                    activeDetailTab === 'pagos'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/70 text-slate-700'
                  }`}
                >
                  {calculatedMonths.length} meses
                </span>
              )}
            </button>
          </div>

          {/* ── CONTENIDO DE LAS PESTAÑAS ── */}
          {activeDetailTab === 'estudiantes' ? (
            /* ══════════════════════════════════════════════════════════════════
                PESTAÑA 1: LISTA DE ESTUDIANTES MATRICULADOS
            ══════════════════════════════════════════════════════════════════ */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Estudiantes Matriculados
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lista de inscripciones activas e historial de este curso
                  </p>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar estudiante o cédula..."
                    value={enrollmentSearch}
                    onChange={(e) => setEnrollmentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {loadingEnrollments ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Cargando inscritos...</p>
                </div>
              ) : filteredCourseEnrollments.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No hay estudiantes inscritos en este curso</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Registra la primera matrícula para comenzar a llevar el control de los alumnos de este curso.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<UserPlus className="w-4 h-4" />}
                      onClick={() => handleOpenEnroll(selectedCourse)}
                    >
                      Inscribir primer estudiante
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-xs text-slate-500 uppercase font-semibold">
                        <th className="px-5 py-3.5">Estudiante</th>
                        <th className="px-4 py-3.5">Identificación</th>
                        <th className="px-4 py-3.5">Fecha Inscripción</th>
                        <th className="px-4 py-3.5">Estado</th>
                        <th className="px-5 py-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCourseEnrollments.map((enr) => (
                        <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {enr.estudiante_nombres?.charAt(0) || 'E'}
                                {enr.estudiante_apellidos?.charAt(0) || ''}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 text-sm">
                                  {enr.estudiante_nombres} {enr.estudiante_apellidos}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                            {enr.estudiante_identificacion || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {formatDate(enr.fecha_inscripcion)}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={getEstadoBadgeVariant(enr.estado)} dot>
                              {getEstadoLabel(enr.estado)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {enr.estado === 'activa' && (
                                <button
                                  type="button"
                                  onClick={() => setStatusTarget({ enrollment: enr, newStatus: 'finalizada' })}
                                  title="Finalizar inscripción"
                                  className="p-1.5 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}

                              {enr.estado === 'activa' && (
                                <button
                                  type="button"
                                  onClick={() => setStatusTarget({ enrollment: enr, newStatus: 'cancelada' })}
                                  title="Cancelar inscripción"
                                  className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setDeleteEnrollmentTarget(enr)}
                                title="Eliminar inscripción"
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-0.5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════
                PESTAÑA 2: REGISTRO DE PAGO (MATRIZ MENSUAL COMPACTA ESTILO EXCEL)
            ══════════════════════════════════════════════════════════════════ */
            <div className="space-y-3">
              {/* Verificación de Fechas de Inicio y Fin */}
              {calculatedMonths.length === 0 ? (
                <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center shadow-sm">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200/60">
                    <CalendarRange className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Configura la Fecha de Inicio y Fecha de Fin del Curso
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                    Para calcular de forma automática los meses de cobros (desde el mes siguiente a la fecha de inicio hasta el mes de finalización), define el período del curso.
                  </p>
                  <Button
                    variant="primary"
                    icon={<Calendar className="w-4 h-4" />}
                    onClick={() => {
                      setTempFechaInicio(selectedCourse.fecha_inicio?.substring(0, 10) || '')
                      setTempFechaFin(selectedCourse.fecha_fin?.substring(0, 10) || '')
                      setIsDatesModalOpen(true)
                    }}
                  >
                    Establecer Fechas del Curso
                  </Button>
                </div>
              ) : courseEnrollments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No hay estudiantes inscritos en este curso</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Inscribe estudiantes en el curso para visualizar y controlar los pagos mensuales de cada uno.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<UserPlus className="w-4 h-4" />}
                      onClick={() => handleOpenEnroll(selectedCourse)}
                    >
                      Inscribir primer estudiante
                    </Button>
                  </div>
                </div>
              ) : (
                /* TABLA ESTILO EXCEL MODERNA Y ESPACIOSA */
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3.5">
                  {/* Barra de herramientas compacta con búsqueda y botón Registrar Pago */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="max-w-xs w-full">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar estudiante en pagos..."
                          value={paymentSearch}
                          onChange={(e) => setPaymentSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={handleOpenNewPaymentModal}
                    >
                      Registrar pago
                    </Button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
                    <table className="w-full min-w-full border-collapse text-xs select-none">
                      <thead>
                        <tr>
                          {/* Columna Estudiante */}
                          <th className="sticky left-0 z-20 bg-[#9fc5e8] text-slate-900 font-extrabold uppercase tracking-wider px-4 py-3 text-left border border-slate-300 min-w-[220px]">
                            ESTUDIANTE
                          </th>

                          {/* Columna MATRICULA */}
                          <th className="bg-[#9fc5e8] text-slate-900 font-extrabold uppercase tracking-wider px-3.5 py-3 text-center border border-slate-300 min-w-[115px]">
                            MATRICULA
                          </th>

                          {/* Columnas de los Meses */}
                          {calculatedMonths.map((m) => (
                            <th
                              key={m.key}
                              className="bg-[#9fc5e8] text-slate-900 font-extrabold uppercase tracking-wider px-3 py-3 text-center border border-slate-300 min-w-[140px]"
                            >
                              {m.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnrollmentsForPayments.map((enr) => {
                          const studentName = `${enr.estudiante_nombres || ''} ${enr.estudiante_apellidos || ''}`.trim()
                          const matriculaDateFormatted = formatMatriculaDate(enr.fecha_inscripcion)

                          return (
                            <tr key={enr.id} className="hover:bg-slate-50/60 transition-colors">
                              {/* Columna Estudiante (Sticky) */}
                              <td className="sticky left-0 z-10 bg-white font-medium text-slate-800 px-4 py-3 border border-slate-200/90 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[220px]">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                    {enr.estudiante_nombres?.charAt(0) || 'E'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate leading-tight">
                                      {studentName}
                                    </p>
                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                      C.I. {enr.estudiante_identificacion || '—'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Columna MATRICULA (ej: 04-abr, 22-mar) */}
                              <td className="px-3.5 py-3 text-center font-semibold text-slate-700 border border-slate-200/90 bg-emerald-50/30 min-w-[115px]">
                                <span className="font-mono text-xs font-bold text-slate-800 px-2 py-1 rounded bg-white/80 border border-emerald-200/60 shadow-2xs">
                                  {matriculaDateFormatted}
                                </span>
                              </td>

                              {/* Celdas de los Meses */}
                              {calculatedMonths.map((m) => {
                                const cellKey = `${enr.student_id}_${m.key}`
                                const cell = paymentGrid[cellKey]
                                const status = cell?.status

                                return (
                                  <td
                                    key={m.key}
                                    onClick={() => {
                                      const coursePrice = Number(selectedCourse.precio || 0)
                                      const isExistingAbono = status === 'ABONO'
                                      const prevAbono = isExistingAbono ? Number(cell?.monto || 0) : 0
                                      const loRestante = Math.max(0, coursePrice - prevAbono)

                                      if (status === 'CANCELADO') {
                                        handleOpenReceiptForCell(studentName, m.key, m.label, cell, 'CANCELADO')
                                        return
                                      }

                                      setPaymentCellModal({
                                        studentId: enr.student_id,
                                        studentName,
                                        monthKey: m.key,
                                        monthLabel: m.label,
                                        matriculaDate: enr.fecha_inscripcion,
                                        currentStatus: status || 'PENDIENTE',
                                        previousAbono: prevAbono,
                                        monto: prevAbono > 0 ? loRestante : (cell?.monto ?? coursePrice),
                                        tipoPago: cell?.tipo_pago || 'TRANSFERENCIA',
                                        bancoRemitente: cell?.banco_remitente || 'BANCO GUAYAQUIL',
                                        bancoBeneficiario: cell?.banco_beneficiario || 'BANCO GUAYAQUIL',
                                        fecha: new Date().toISOString().split('T')[0],
                                        comprobante: cell?.comprobante || '',
                                        observacion: cell?.observacion || '',
                                        recordPayment: true,
                                      })
                                    }}
                                    className={`px-3 py-2.5 text-center cursor-pointer border border-slate-200/90 transition-all min-w-[140px] group ${
                                      status === 'CANCELADO'
                                        ? 'bg-[#c6efce]/85 hover:bg-[#b7e1cd]'
                                        : status === 'ABONO'
                                        ? 'bg-[#ffeb9c]/85 hover:bg-[#fde047]'
                                        : 'bg-white hover:bg-blue-50/70 text-slate-400'
                                    }`}
                                    title={
                                      status === 'CANCELADO'
                                        ? `Clic para abrir directamente el Recibo Oficial de ${m.label} para ${studentName}`
                                        : `Clic para registrar pago de ${m.label} para ${studentName}`
                                    }
                                  >
                                    {status === 'CANCELADO' ? (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleOpenReceiptForCell(studentName, m.key, m.label, cell, 'CANCELADO')
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-[#006100] hover:text-[#004d00] border border-[#9ed4a8] shadow-2xs hover:shadow-xs transition-all font-bold text-[11px] tracking-wider uppercase group/btn"
                                          title="Clic aquí para ver e imprimir el Recibo Oficial FECIP"
                                        >
                                          <span>CANCELADO</span>
                                          <Receipt className="w-3.5 h-3.5 text-[#006100] group-hover/btn:scale-110 transition-transform shrink-0" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const coursePrice = Number(selectedCourse.precio || 0)
                                            setPaymentCellModal({
                                              studentId: enr.student_id,
                                              studentName,
                                              monthKey: m.key,
                                              monthLabel: m.label,
                                              matriculaDate: enr.fecha_inscripcion,
                                              currentStatus: 'CANCELADO',
                                              previousAbono: 0,
                                              monto: cell?.monto ?? coursePrice,
                                              tipoPago: cell?.tipo_pago || 'TRANSFERENCIA',
                                              bancoRemitente: cell?.banco_remitente || 'BANCO GUAYAQUIL',
                                              bancoBeneficiario: cell?.banco_beneficiario || 'BANCO GUAYAQUIL',
                                              fecha: cell?.fecha || new Date().toISOString().split('T')[0],
                                              comprobante: cell?.comprobante || '',
                                              observacion: cell?.observacion || '',
                                              recordPayment: true,
                                            })
                                          }}
                                          className="p-1 rounded-md hover:bg-black/10 text-[#006100] opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Editar datos de este pago"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : status === 'ABONO' ? (
                                      <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-lg bg-white/90 border border-amber-300/80 shadow-2xs">
                                        <span className="font-extrabold text-[11px] tracking-wider text-[#9c6500] uppercase block select-none">
                                          ABONO
                                        </span>
                                        {cell?.monto && cell.monto > 0 ? (
                                          <span className="text-[11px] font-mono font-black text-[#7a4800] leading-none mt-0.5">
                                            ${Number(cell.monto).toFixed(2)}
                                          </span>
                                        ) : null}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-300 font-mono select-none group-hover:text-blue-600 transition-colors">
                                        —
                                      </span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
            VISTA 2: LISTA GENERAL DE CURSOS (CARDS CLICABLES)
        ══════════════════════════════════════════════════════════════════ */
        <>
          {/* ── Encabezado Principal ── */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Cursos</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Administración de cursos, precios e inscripciones directas
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreate}
              >
                Registrar nuevo curso
              </Button>
            </div>
          </div>

          {/* ── Buscador y Filtros ── */}
          <div className="space-y-3">
            <div className="max-w-md">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre de curso..."
              />
            </div>

            {/* Filtros por estado */}
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((fb) => (
                <button
                  key={fb.value}
                  onClick={() => setEstadoFilter(fb.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    estadoFilter === fb.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {fb.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      estadoFilter === fb.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {fb.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Contenido de Tarjetas Clicables ── */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-10 h-10 text-slate-300" />}
              title="No se encontraron cursos"
              description={
                searchTerm || estadoFilter !== 'todos'
                  ? 'Intenta ajustar los filtros de búsqueda.'
                  : 'Crea el primer curso para comenzar.'
              }
              action={
                !searchTerm && estadoFilter === 'todos' ? (
                  <Button onClick={openCreate} variant="primary" icon={<Plus className="w-4 h-4" />}>
                    Registrar curso
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  teachers={teachers}
                  onEdit={openEdit}
                  onDelete={setDeletingCourse}
                  onEnroll={handleOpenEnroll}
                  onSelect={setSelectedCourse}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: INSCRIBIR ESTUDIANTE DIRECTO EN EL CURSO
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={
          enrollingCourse
            ? `Inscribir Estudiante en "${enrollingCourse.nombre}"`
            : 'Inscribir Estudiante'
        }
        size="lg"
      >
        <div className="space-y-4">
          {/* Resumen del curso seleccionado */}
          {enrollingCourse && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800">{enrollingCourse.nombre}</span>
                  {enrollingCourse.horario && (
                    <span className="block text-[11px] text-slate-500">{enrollingCourse.horario}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Precio</span>
                <span className="text-sm font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  ${Number(enrollingCourse.precio || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Paso 1: Seleccionar Estudiante */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. Seleccionar Estudiante *
            </label>
            {selectedStudentForEnroll ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedStudentForEnroll.nombres} {selectedStudentForEnroll.apellidos}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      C.I. {selectedStudentForEnroll.identificacion}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForEnroll(null)}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o identificación..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredStudentsForEnroll.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 text-center">No se encontraron estudiantes.</p>
                  ) : (
                    filteredStudentsForEnroll.map((st) => {
                      const isAlreadyEnrolled = enrolledStudentIds.includes(st.id)

                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            if (isAlreadyEnrolled) {
                              addToast({
                                type: 'warning',
                                message: `El estudiante ${st.nombres} ${st.apellidos} ya se encuentra inscrito en este curso.`,
                              })
                              return
                            }
                            setSelectedStudentForEnroll(st)
                          }}
                          className={`p-2.5 flex items-center justify-between transition-colors ${
                            isAlreadyEnrolled
                              ? 'bg-slate-50 opacity-70 cursor-not-allowed select-none'
                              : 'hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-xs font-semibold ${
                                  isAlreadyEnrolled ? 'text-slate-500' : 'text-slate-800'
                                }`}
                              >
                                {st.nombres} {st.apellidos}
                              </p>
                              {isAlreadyEnrolled && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded">
                                  Ya inscrito
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">C.I. {st.identificacion}</p>
                          </div>
                          {isAlreadyEnrolled ? (
                            <span className="text-[11px] font-semibold text-rose-500">Inscrito ✓</span>
                          ) : (
                            <span className="text-[11px] font-semibold text-blue-600">Seleccionar</span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Paso 2: Cobro y Pago Inicial */}
          {selectedStudentForEnroll && enrollingCourse && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">
                2. Pago de Matrícula / Cuota
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    ¿Cuánto cancela ahora? ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={montoCancela}
                      onChange={(e) => setMontoCancela(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {saldoPendienteEnroll > 0 ? (
                    <span className="text-[10px] text-amber-600 mt-1 block">
                      Saldo pendiente: ${saldoPendienteEnroll.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 mt-1 block font-medium">
                      ✓ Pago completo
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={tipoPago}
                    onChange={(e) => setTipoPago(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {Number(montoCancela) > 0 && (
                <div className="space-y-3 pt-1">
                  {['TRANSFERENCIA', 'DEPÓSITO'].includes(tipoPago) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Banco Remitente (Origen / Cliente)
                        </label>
                        <select
                          value={bancoRemitente}
                          onChange={(e) => setBancoRemitente(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {BANK_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Banco Beneficiario (Destino FECIP)
                        </label>
                        <select
                          value={bancoBeneficiario}
                          onChange={(e) => setBancoBeneficiario(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {BANK_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      N° Comprobante / Transacción (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. #098124 o DEP-0038"
                      value={comprobante}
                      onChange={(e) => setComprobante(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acciones Modal */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEnrollModalOpen(false)}
              disabled={isSubmittingEnroll}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!selectedStudentForEnroll || isSubmittingEnroll}
              loading={isSubmittingEnroll}
              onClick={handleConfirmEnrollment}
            >
              Confirmar Inscripción
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal de Creación / Edición de Curso ───────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Columna 1: Nombre del curso */}
            <Input
              label="Nombre del curso"
              placeholder="Ej. Matemáticas I"
              error={errors.nombre?.message}
              {...register('nombre', { required: 'El nombre es obligatorio.' })}
            />

            {/* Columna 2: Docente */}
            <Select
              label="Docente"
              options={teacherOptions}
              {...register('teacher_id')}
            />

            {/* Selector interactivo de Fecha de Inicio y Fecha de Fin con meses y cálculo de duración */}
            <div className="sm:col-span-2">
              <CourseDateRangePicker
                startDate={formFechaInicio}
                endDate={formFechaFin}
                onChangeStart={(val) => setValue('fecha_inicio', val, { shouldDirty: true })}
                onChangeEnd={(val) => setValue('fecha_fin', val, { shouldDirty: true })}
              />
            </div>

            {/* Columna 1: Horario */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-700 mb-1">Horario</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej. Lunes"
                  value={formDias}
                  onFocus={() => {
                    setShowDiasDropdown(true)
                    setShowHoraDropdown(false)
                  }}
                  onChange={(e) => {
                    handleScheduleChange(e.target.value, formHora)
                    setShowDiasDropdown(true)
                  }}
                  className="w-full px-3 py-2 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setShowDiasDropdown((prev) => !prev)
                    setShowHoraDropdown(false)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black p-1"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDiasDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showDiasDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDiasDropdown(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-52 overflow-y-auto">
                    {DIAS_OPTIONS.map((dia) => (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => {
                          handleScheduleChange(dia, formHora)
                          setShowDiasDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                          formDias === dia
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-black hover:bg-slate-100 hover:text-black'
                        }`}
                      >
                        <span className="text-black font-medium">{dia}</span>
                        {formDias === dia && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Columna 2: Hora */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-700 mb-1">Hora</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej. 08:00 - 10:00"
                  value={formHora}
                  onFocus={() => {
                    setShowHoraDropdown(true)
                    setShowDiasDropdown(false)
                  }}
                  onChange={(e) => {
                    handleScheduleChange(formDias, e.target.value)
                    setShowHoraDropdown(true)
                  }}
                  className="w-full px-3 py-2 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-medium text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setShowHoraDropdown((prev) => !prev)
                    setShowDiasDropdown(false)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black p-1"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHoraDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showHoraDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowHoraDropdown(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-52 overflow-y-auto">
                    {HORAS_OPTIONS.map((hora) => (
                      <button
                        key={hora}
                        type="button"
                        onClick={() => {
                          handleScheduleChange(formDias, hora)
                          setShowHoraDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                          formHora === hora
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-black hover:bg-slate-100 hover:text-black'
                        }`}
                      >
                        <span className="text-black font-medium">{hora}</span>
                        {formHora === hora && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Columna 1: Precio */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Precio ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={editingCourse?.precio ?? 0}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('precio', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Columna 2: Estado */}
            <Select
              label="Estado"
              options={[
                { value: 'activo', label: 'Activo' },
                { value: 'inactivo', label: 'Inactivo' },
                { value: 'finalizado', label: 'Finalizado' },
              ]}
              {...register('estado')}
            />

            {/* Fila completa: Descripción */}
            <div className="sm:col-span-2">
              <Input
                label="Descripción"
                placeholder="Detalles breves o requisitos..."
                {...register('descripcion')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={closeForm} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {editingCourse ? 'Guardar cambios' : 'Crear curso'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Confirmar Eliminar Curso ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar curso"
        description={
          deletingCourse
            ? `¿Estás seguro de que deseas eliminar el curso "${deletingCourse.nombre}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        variant="danger"
      />

      {/* ── Modal Confirmar Cambio de Estado de Inscripción ───────────────── */}
      <ConfirmModal
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleUpdateEnrollmentStatus}
        title={statusTarget?.newStatus === 'cancelada' ? 'Cancelar matrícula' : 'Finalizar matrícula'}
        description={
          statusTarget
            ? `¿Deseas marcar la inscripción de ${statusTarget.enrollment.estudiante_nombres} ${statusTarget.enrollment.estudiante_apellidos} como ${statusTarget.newStatus}?`
            : ''
        }
        confirmLabel={statusTarget?.newStatus === 'cancelada' ? 'Sí, cancelar matrícula' : 'Sí, finalizar'}
        loading={actionLoading}
        variant={statusTarget?.newStatus === 'cancelada' ? 'danger' : 'warning'}
      />

      {/* ── Modal Confirmar Eliminar Inscripción ───────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteEnrollmentTarget}
        onClose={() => setDeleteEnrollmentTarget(null)}
        onConfirm={handleDeleteEnrollment}
        title="Eliminar matrícula"
        description={
          deleteEnrollmentTarget
            ? `¿Estás seguro de eliminar el registro de matrícula de ${deleteEnrollmentTarget.estudiante_nombres} ${deleteEnrollmentTarget.estudiante_apellidos}?`
            : ''
        }
        confirmLabel="Eliminar"
        loading={actionLoading}
        variant="danger"
      />

      {/* ── Modal de Pago por Mes (Registro de Pago) ── */}
      <Modal
        isOpen={!!paymentCellModal}
        onClose={() => setPaymentCellModal(null)}
        title="Registrar Pago"
        size="md"
      >
        {paymentCellModal && (() => {
          const coursePrice = Number(selectedCourse?.precio || 0)
          const prevAbono = Number(paymentCellModal.previousAbono || 0)
          const isAbonoMode = prevAbono > 0
          const loRestante = Math.max(0, coursePrice - prevAbono)
          const maxAllowed = isAbonoMode ? loRestante : coursePrice
          const enteredValue = paymentCellModal.monto === '' ? 0 : Number(paymentCellModal.monto) || 0
          const isOverLimit = enteredValue > maxAllowed

          const totalCalculado = isAbonoMode ? prevAbono + enteredValue : enteredValue
          const saldoPendiente = Math.max(0, maxAllowed - enteredValue)
          const isFullPayment = enteredValue === maxAllowed && maxAllowed > 0 && !isOverLimit
          const isPartial = enteredValue > 0 && enteredValue < maxAllowed && !isOverLimit
          const isPending = enteredValue <= 0 && !isOverLimit

          return (
            <div className="space-y-4">
              {/* Selección y detalles del Estudiante y Mes */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Estudiante
                    </label>
                    <select
                      value={paymentCellModal.studentId}
                      onChange={(e) => {
                        const newId = Number(e.target.value)
                        const enr = courseEnrollments.find((x) => x.student_id === newId)
                        if (!enr) return
                        const sName = `${enr.estudiante_nombres || ''} ${enr.estudiante_apellidos || ''}`.trim()
                        const key = `${newId}_${paymentCellModal.monthKey}`
                        const cell = paymentGrid[key]
                        const isExistingAbono = cell?.status === 'ABONO'
                        const pAbono = isExistingAbono ? Number(cell?.monto || 0) : 0
                        const remaining = Math.max(0, coursePrice - pAbono)

                        setPaymentCellModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                studentId: newId,
                                studentName: sName,
                                matriculaDate: enr.fecha_inscripcion,
                                currentStatus: cell?.status || 'CANCELADO',
                                previousAbono: pAbono,
                                monto: pAbono > 0 ? remaining : (cell?.monto ?? coursePrice),
                                tipoPago: cell?.tipo_pago || prev.tipoPago || 'TRANSFERENCIA',
                                bancoRemitente: cell?.banco_remitente || prev.bancoRemitente || 'BANCO GUAYAQUIL',
                                bancoBeneficiario: cell?.banco_beneficiario || prev.bancoBeneficiario || 'BANCO GUAYAQUIL',
                                fecha: new Date().toISOString().split('T')[0],
                                comprobante: cell?.comprobante || '',
                                observacion: cell?.observacion || '',
                              }
                            : null
                        )
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      {courseEnrollments.map((enr) => (
                        <option key={enr.student_id} value={enr.student_id}>
                          {enr.estudiante_nombres} {enr.estudiante_apellidos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Mes a Cobrar
                    </label>
                    <select
                      value={paymentCellModal.monthKey}
                      onChange={(e) => {
                        const newMonthKey = e.target.value
                        const mObj = calculatedMonths.find((m) => m.key === newMonthKey)
                        if (!mObj) return
                        const key = `${paymentCellModal.studentId}_${newMonthKey}`
                        const cell = paymentGrid[key]
                        const isExistingAbono = cell?.status === 'ABONO'
                        const pAbono = isExistingAbono ? Number(cell?.monto || 0) : 0
                        const remaining = Math.max(0, coursePrice - pAbono)

                        setPaymentCellModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                monthKey: newMonthKey,
                                monthLabel: mObj.label,
                                currentStatus: cell?.status || 'CANCELADO',
                                previousAbono: pAbono,
                                monto: pAbono > 0 ? remaining : (cell?.monto ?? coursePrice),
                                tipoPago: cell?.tipo_pago || prev.tipoPago || 'TRANSFERENCIA',
                                bancoRemitente: cell?.banco_remitente || prev.bancoRemitente || 'BANCO GUAYAQUIL',
                                bancoBeneficiario: cell?.banco_beneficiario || prev.bancoBeneficiario || 'BANCO GUAYAQUIL',
                                fecha: new Date().toISOString().split('T')[0],
                                comprobante: cell?.comprobante || '',
                                observacion: cell?.observacion || '',
                              }
                            : null
                        )
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 uppercase"
                    >
                      {calculatedMonths.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {paymentCellModal.matriculaDate && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                    <span>Matrícula registrada:</span>
                    <span className="font-bold text-slate-700">{formatMatriculaDate(paymentCellModal.matriculaDate)}</span>
                  </div>
                )}
              </div>

              {/* ── Bloque de Cobro: Dos Inputs (Valor de Cuota / Abono Bloqueado y Valor Cobrado) ── */}
              <div className="space-y-4">
                {/* Dos inputs principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Input 1:
                      - Si ya tiene abono: "Valor del Abono ($)" con el monto del abono bloqueado
                      - Si no tiene abono: "Valor de la Cuota ($)" con el monto de la cuota bloqueado
                  */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isAbonoMode ? 'Valor del Abono ($)' : 'Valor de la Cuota ($)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="text"
                        readOnly
                        value={(isAbonoMode ? prevAbono : coursePrice).toFixed(2)}
                        className="w-full pl-7 pr-3 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed select-none shadow-2xs"
                        title={isAbonoMode ? 'Abono registrado previamente (bloqueado)' : 'Valor oficial de la cuota del curso (bloqueado)'}
                      />
                    </div>
                    {isAbonoMode && (
                      <p className="text-xs font-semibold text-amber-700 mt-1">
                        Lo restante: ${loRestante.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Input 2: Valor Cobrado ($) (lo que se cobra en esta transacción) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Valor Cobrado ($)
                      </label>
                      {isOverLimit && (
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentCellModal((prev) =>
                              prev ? { ...prev, monto: maxAllowed, currentStatus: 'CANCELADO' } : null
                            )
                          }
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          Ajustar a ${maxAllowed.toFixed(2)}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs ${
                          isOverLimit ? 'text-rose-500' : 'text-slate-500'
                        }`}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={maxAllowed}
                        placeholder="0.00"
                        value={paymentCellModal.monto === '' ? '' : paymentCellModal.monto}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault()
                          }
                        }}
                        onChange={(e) => {
                          const raw = e.target.value
                          const val = raw === '' ? 0 : parseFloat(raw) || 0
                          const currentTotal = isAbonoMode ? prevAbono + val : val
                          const newStatus: 'CANCELADO' | 'ABONO' | 'PENDIENTE' =
                            val > maxAllowed
                              ? (isAbonoMode ? 'ABONO' : 'PENDIENTE')
                              : currentTotal >= coursePrice && coursePrice > 0
                              ? 'CANCELADO'
                              : currentTotal > 0
                              ? 'ABONO'
                              : 'PENDIENTE'
                          setPaymentCellModal((prev) =>
                            prev ? { ...prev, monto: raw, currentStatus: newStatus } : null
                          )
                        }}
                        onBlur={() => {
                          if (enteredValue > maxAllowed) {
                            setPaymentCellModal((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    monto: maxAllowed,
                                    currentStatus: 'CANCELADO',
                                  }
                                : null
                            )
                          }
                        }}
                        className={`w-full pl-7 pr-3 py-2 border rounded-xl text-xs font-extrabold transition-all shadow-2xs ${
                          isOverLimit
                            ? 'bg-rose-50 border-rose-500 text-rose-900 focus:ring-2 focus:ring-rose-500'
                            : isFullPayment
                            ? 'bg-emerald-50/30 border-emerald-400 text-emerald-900 focus:ring-2 focus:ring-emerald-500'
                            : isPartial
                            ? 'bg-amber-50/30 border-amber-400 text-amber-900 focus:ring-2 focus:ring-amber-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    {/* Debajo del valor cobrado: solo en letras (sin íconos ni tarjetas) */}
                    <div className="mt-1">
                      {isOverLimit ? (
                        <p className="text-xs font-bold text-rose-600">
                          No puede cobrar más de ${maxAllowed.toFixed(2)} {isAbonoMode ? `(saldo restante: $${loRestante.toFixed(2)})` : `(valor total: $${coursePrice.toFixed(2)})`}
                        </p>
                      ) : isFullPayment ? (
                        <p className="text-xs font-semibold text-emerald-600">
                          Pago completo
                        </p>
                      ) : isPartial ? (
                        <p className="text-xs font-semibold text-amber-600">
                          Falta ${saldoPendiente.toFixed(2)} — Se registra como abono
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Sin cobro registrado (casilla en blanco)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Campos adicionales de método de pago, bancos, fecha y recibo cuando hay cobro */}
                {!isPending && !isOverLimit && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Método de Pago
                        </label>
                        <select
                          value={paymentCellModal.tipoPago}
                          onChange={(e) =>
                            setPaymentCellModal((prev) =>
                              prev ? { ...prev, tipoPago: e.target.value } : null
                            )
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs uppercase"
                        >
                          {PAYMENT_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Fecha de Pago
                        </label>
                        <input
                          type="date"
                          value={paymentCellModal.fecha}
                          onChange={(e) =>
                            setPaymentCellModal((prev) =>
                              prev ? { ...prev, fecha: e.target.value } : null
                            )
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Bancos cuando es Transferencia o Depósito */}
                    {['TRANSFERENCIA', 'DEPÓSITO'].includes(paymentCellModal.tipoPago) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Banco Remitente (Origen)
                          </label>
                          <select
                            value={paymentCellModal.bancoRemitente}
                            onChange={(e) =>
                              setPaymentCellModal((prev) =>
                                prev ? { ...prev, bancoRemitente: e.target.value } : null
                              )
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                          >
                            {BANK_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Banco Beneficiario (Destino)
                          </label>
                          <select
                            value={paymentCellModal.bancoBeneficiario}
                            onChange={(e) =>
                              setPaymentCellModal((prev) =>
                                prev ? { ...prev, bancoBeneficiario: e.target.value } : null
                              )
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                          >
                            {BANK_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        N° Comprobante / Recibo / Transacción (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. DEP-003848 o #4892"
                        value={paymentCellModal.comprobante}
                        onChange={(e) =>
                          setPaymentCellModal((prev) =>
                            prev ? { ...prev, comprobante: e.target.value } : null
                          )
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1 select-none">
                      <input
                        type="checkbox"
                        checked={paymentCellModal.recordPayment}
                        onChange={(e) =>
                          setPaymentCellModal((prev) =>
                            prev ? { ...prev, recordPayment: e.target.checked } : null
                          )
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Registrar también en el historial general contable (Rol de Pagos)</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div>
                  {(paymentCellModal.currentStatus === 'CANCELADO' || paymentCellModal.previousAbono > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Receipt className="w-3.5 h-3.5" />}
                      onClick={() => {
                        handleOpenReceiptForCell(
                          paymentCellModal.studentName,
                          paymentCellModal.monthKey,
                          paymentCellModal.monthLabel,
                          {
                            fecha: paymentCellModal.fecha,
                            monto:
                              paymentCellModal.previousAbono > 0
                                ? paymentCellModal.previousAbono
                                : paymentCellModal.monto,
                            tipo_pago: paymentCellModal.tipoPago,
                            banco_remitente: paymentCellModal.bancoRemitente,
                            observacion: paymentCellModal.observacion,
                            comprobante: paymentCellModal.comprobante,
                          },
                          paymentCellModal.currentStatus
                        )
                      }}
                    >
                      Ver Recibo
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPaymentCellModal(null)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSavePaymentCell}
                    disabled={isOverLimit || Number(paymentCellModal.monto) < 0}
                  >
                    Guardar Pago
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Modal Configurar Fechas del Curso (Inicio y Fin) ── */}
      <Modal
        isOpen={isDatesModalOpen}
        onClose={() => setIsDatesModalOpen(false)}
        title="Configurar Período del Curso"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Define la fecha de inicio y fin del curso. Los meses de cobros se calcularán automáticamente a partir del mes siguiente al inicio hasta el mes de finalización.
          </p>

          <CourseDateRangePicker
            startDate={tempFechaInicio}
            endDate={tempFechaFin}
            onChangeStart={setTempFechaInicio}
            onChangeEnd={setTempFechaFin}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDatesModalOpen(false)}
              disabled={savingDates}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCourseDates}
              loading={savingDates}
            >
              Guardar Fechas
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Recibo de Pago FECIP Oficial ── */}
      <PaymentReceiptModal
        isOpen={Boolean(receiptModalData)}
        onClose={() => setReceiptModalData(null)}
        data={receiptModalData}
      />
    </div>
  )
}

export default Courses
