import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Wallet,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Plus,
  Receipt,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Printer,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { PaymentReceiptModal, ReceiptData } from '../components/ui/PaymentReceiptModal'
import { paymentsAPI, studentsAPI, coursesAPI, enrollmentsAPI, settingsAPI } from '../services/api'
import { useUIStore } from '../store/useUIStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { formatDate } from '../utils/formatters'
import type { Payment, CreatePaymentDto, Student, Course, Enrollment } from '../types'

interface StudentBalance {
  studentId: number
  studentName: string
  identificacion: string
  courseId?: number
  courseName: string
  courseSchedule: string
  coursePrice: number
  totalPaid: number
  balancePending: number
  paymentStatus: 'paid' | 'partial' | 'pending' | 'free'
  paymentCount: number
  lastPaymentDate?: string
  monthKey?: string
  monthDetail?: string
}

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

export default function Cashflow() {
  const { setCurrentPage, addToast } = useUIStore()

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courseGrids, setCourseGrids] = useState<Record<number, Record<string, any>>>({})

  // Two Tabs: 'pagos' and 'pendientes'
  const [activeTab, setActiveTab] = useState<'pagos' | 'pendientes'>('pagos')

  // Filters for Tab "Pagos"
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('todos')

  // Filters for Tab "Valores Pendientes"
  const [pendingSearch, setPendingSearch] = useState('')
  const [pendingCourseFilter, setPendingCourseFilter] = useState('all')

  // Modal: Quick Payment
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<StudentBalance | null>(null)
  const [payCourseId, setPayCourseId] = useState<number | ''>('')
  const [payStudentId, setPayStudentId] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(null)

  const [formData, setFormData] = useState<CreatePaymentDto>({
    fecha: new Date().toISOString().split('T')[0],
    tipo_pago: 'TRANSFERENCIA',
    banco_remitente: 'BANCO GUAYAQUIL',
    banco_beneficiario: 'BANCO GUAYAQUIL',
    student_id: undefined,
    apellidos_nombres: '',
    horario: '',
    valor: 35,
    concepto: 'CUOTA CURSO',
    comprobante: '',
  })

  // Load all required data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [paymentsList, studentsList, coursesList, enrollmentsList] = await Promise.all([
        paymentsAPI.findAll(),
        studentsAPI.findAll(),
        coursesAPI.findAll(),
        enrollmentsAPI.findAll(),
      ])

      // Cargar matrices de pago de todos los cursos
      const grids: Record<number, Record<string, any>> = {}
      await Promise.all(
        (coursesList || []).map(async (c) => {
          try {
            const data = await settingsAPI.get(`course_payments_grid_${c.id}`)
            if (data) {
              grids[c.id] = JSON.parse(data)
            }
          } catch {
            // ignore
          }
        })
      )

      setPayments(paymentsList || [])
      setStudents(studentsList || [])
      setCourses(coursesList || [])
      setEnrollments(enrollmentsList || [])
      setCourseGrids(grids)
    } catch (err) {
      console.error('Error al cargar datos de caja e ingresos:', err)
      addToast({
        type: 'error',
        title: 'Error de carga',
        message: 'No se pudieron sincronizar los datos de caja e ingresos.',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Build Student Balances (Lo que cobré vs lo que falta por cobrar por estudiante)
  const studentBalances = useMemo<StudentBalance[]>(() => {
    const list: StudentBalance[] = []
    const trackedKeys = new Set<string>()

    // 1. Procesar todos los ABONOS mensuales de la matriz de Cursos (courseGrids)
    courses.forEach((c) => {
      const grid = courseGrids[c.id] || {}
      const cPrice = Number(c.precio || 0)

      Object.entries(grid).forEach(([cellKey, cell]: [string, any]) => {
        if (!cell || cell.status !== 'ABONO') return

        const [stIdStr, monthKey] = cellKey.split('_')
        const stId = parseInt(stIdStr, 10)
        const st = students.find((s) => s.id === stId)
        if (!st) return

        const fullName = `${st.apellidos} ${st.nombres}`.trim()
        const paidMonto = Math.round(Number(cell.monto || 0) * 100) / 100
        const pendingMonto = Math.max(0, Math.round((cPrice - paidMonto) * 100) / 100)

        // Solo mostrar si el pendiente es significativo (mayor a 1 centavo)
        if (pendingMonto > 0.01) {
          const parts = (monthKey || '').split('-')
          const mIdx = parts.length > 1 ? parseInt(parts[1], 10) - 1 : -1
          const monthNames = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
          ]
          const mLabel = mIdx >= 0 && mIdx < 12 ? monthNames[mIdx] : monthKey
          const uniqueKey = `${st.id}-${c.id}-${monthKey}`
          trackedKeys.add(uniqueKey)

          list.push({
            studentId: st.id,
            studentName: fullName.toUpperCase(),
            identificacion: st.identificacion,
            courseId: c.id,
            courseName: `${c.nombre} (Cuota ${mLabel})`,
            courseSchedule: c.horario || 'Horario regular',
            coursePrice: cPrice,
            totalPaid: paidMonto,
            balancePending: pendingMonto,
            paymentStatus: 'partial',
            paymentCount: 1,
            lastPaymentDate: cell.fecha,
            monthKey,
            monthDetail: mLabel,
          })
        }
      })
    })

    // 2. Procesar abonos independientes registrados en la tabla de pagos (payments)
    // EXCLUIR: pagos que son "Cobro saldo:..." porque esos ya están registrados en la grilla (sección 1)
    // y solo representan el pago del saldo pendiente de un abono existente.
    payments.forEach((p) => {
      const conceptoLower = (p.concepto || '').toLowerCase()
      // Solo procesar si el concepto contiene "abono" pero NO si es un cobro de saldo de grilla
      if (!conceptoLower.includes('abono')) return
      // Si el concepto empieza con "cobro saldo" o "cobro de saldo", ya está manejado por la grilla → ignorar
      if (conceptoLower.startsWith('cobro saldo') || conceptoLower.startsWith('cobro de saldo')) return

      const stId = p.student_id
      const st = stId
        ? students.find((s) => s.id === stId)
        : students.find(
            (s) =>
              `${s.apellidos} ${s.nombres}`.trim().toLowerCase() ===
                (p.apellidos_nombres || '').trim().toLowerCase() ||
              `${s.nombres} ${s.apellidos}`.trim().toLowerCase() ===
                (p.apellidos_nombres || '').trim().toLowerCase()
          )

      if (!st) return

      // Si el estudiante ya tiene una entrada en la grilla para el mismo curso, omitir
      // (el abono ya está en la grilla y lo procesa la sección 1)
      const matchedCourse =
        courses.find(
          (c) =>
            (p.horario && c.nombre.toLowerCase().includes(p.horario.toLowerCase())) ||
            (p.concepto && p.concepto.toLowerCase().includes(c.nombre.toLowerCase()))
        ) ||
        courses.find((c) => st.curso && c.nombre.toLowerCase() === st.curso.toLowerCase()) ||
        courses[0]

      // Si el estudiante tiene una entrada en la grilla para este curso, ya está en sección 1 → omitir
      if (matchedCourse) {
        const grid = courseGrids[matchedCourse.id] || {}
        const hasGridEntry = Object.keys(grid).some((k) => k.startsWith(`${st.id}_`))
        if (hasGridEntry) return
      }

      const cPrice = Number(matchedCourse?.precio || 0)
      const paidMonto = Math.round(Number(p.valor || 0) * 100) / 100
      const pendingMonto = Math.max(0, Math.round((cPrice - paidMonto) * 100) / 100)

      const pKey = `${st.id}-${matchedCourse?.id || 0}-${p.fecha}-${paidMonto}`
      if (!trackedKeys.has(pKey) && pendingMonto > 0.01) {
        const alreadyInList = list.some(
          (item) => item.studentId === st.id && item.totalPaid === paidMonto && item.coursePrice === cPrice
        )
        if (!alreadyInList) {
          trackedKeys.add(pKey)
          const fullName = `${st.apellidos} ${st.nombres}`.trim()
          list.push({
            studentId: st.id,
            studentName: fullName.toUpperCase(),
            identificacion: st.identificacion,
            courseId: matchedCourse?.id,
            courseName: `${matchedCourse?.nombre || 'Curso'} (${p.concepto || 'Abono'})`,
            courseSchedule: p.horario || matchedCourse?.horario || 'Por definir',
            coursePrice: cPrice > 0 ? cPrice : paidMonto + pendingMonto,
            totalPaid: paidMonto,
            balancePending: pendingMonto,
            paymentStatus: 'partial',
            paymentCount: 1,
            lastPaymentDate: p.fecha,
          })
        }
      }
    })

    // 3. Estudiantes inscritos que no han realizado ningún pago (ni tienen registro en la grilla)
    // Un estudiante tiene "pago efectivo" si tiene algún pago en la tabla de payments
    const studentsWithPayments = new Set<number>()
    payments.forEach((p) => {
      if (p.student_id) studentsWithPayments.add(p.student_id)
    })

    students.forEach((st) => {
      const fullName = `${st.apellidos} ${st.nombres}`.trim()
      const stEnrollments = enrollments.filter((e) => e.student_id === st.id && e.estado !== 'cancelada')

      stEnrollments.forEach((enr) => {
        const course = courses.find((c) => c.id === enr.course_id)
        if (!course) return
        const coursePrice = Number(course.precio || 0)

        // Verificar si tiene entradas en la grilla que NO estén CANCELADAS
        // Si todas las entradas del estudiante en este curso están CANCELADAS, no tiene deuda
        const grid = courseGrids[course.id] || {}
        const studentGridKeys = Object.keys(grid).filter((k) => k.startsWith(`${st.id}_`))
        const hasPendingGridEntries = studentGridKeys.some((k) => {
          const cell = grid[k]
          return cell && cell.status !== 'CANCELADO'
        })

        const alreadyListed = list.some(
          (item) => item.studentId === st.id && item.courseId === course.id
        )

        // Solo agregar si:
        // - No tiene entradas pendientes en la grilla
        // - No está ya en la lista (sección 1 lo capturó como ABONO)
        // - No tiene ningún pago registrado en payments
        // - El curso tiene precio mayor a 0
        if (!hasPendingGridEntries && !alreadyListed && !studentsWithPayments.has(st.id) && coursePrice > 0) {
          list.push({
            studentId: st.id,
            studentName: fullName.toUpperCase(),
            identificacion: st.identificacion,
            courseId: course.id,
            courseName: enr.curso_nombre || course.nombre,
            courseSchedule: enr.curso_horario || course.horario || 'Por definir',
            coursePrice,
            totalPaid: 0,
            balancePending: coursePrice,
            paymentStatus: 'pending',
            paymentCount: 0,
          })
        }
      })
    })

    return list
  }, [students, enrollments, courses, payments, courseGrids])

  // Financial Metrics
  const totalCobrado = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.valor) || 0), 0)
  }, [payments])

  const totalPorCobrar = useMemo(() => {
    return studentBalances.reduce((sum, sb) => sum + sb.balancePending, 0)
  }, [studentBalances])

  const totalProyectado = totalCobrado + totalPorCobrar
  const porcentajeRecaudado = totalProyectado > 0 ? (totalCobrado / totalProyectado) * 100 : 0

  const countConDeuda = studentBalances.filter((sb) => sb.balancePending > 0).length
  const countAlDia = studentBalances.filter((sb) => sb.balancePending === 0 && sb.coursePrice > 0).length

  // Breakdown by Bank / Cash
  const bankBreakdown = useMemo(() => {
    const map: Record<string, number> = {
      'EFECTIVO / CAJA': 0,
      'BANCO GUAYAQUIL': 0,
      'BANCO PICHINCHA': 0,
      'OTROS BANCOS': 0,
    }

    payments.forEach((p) => {
      const val = Number(p.valor) || 0
      const bRem = (p.banco_remitente || '').toUpperCase()
      const bBen = (p.banco_beneficiario || '').toUpperCase()
      const tipo = (p.tipo_pago || '').toUpperCase()

      if (tipo === 'EFECTIVO' || bRem.includes('EFECTIVO') || bBen.includes('EFECTIVO')) {
        map['EFECTIVO / CAJA'] += val
      } else if (bRem.includes('GUAYAQUIL') || bBen.includes('GUAYAQUIL')) {
        map['BANCO GUAYAQUIL'] += val
      } else if (bRem.includes('PICHINCHA') || bBen.includes('PICHINCHA')) {
        map['BANCO PICHINCHA'] += val
      } else {
        map['OTROS BANCOS'] += val
      }
    })

    return map
  }, [payments])

  // ── 1. Filtro de Pagos (Tab "Pagos") ──
  const filteredPaymentsList = useMemo(() => {
    return payments.filter((p) => {
      const q = paymentSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (p.apellidos_nombres && p.apellidos_nombres.toLowerCase().includes(q)) ||
        (p.concepto && p.concepto.toLowerCase().includes(q)) ||
        (p.comprobante && p.comprobante.toLowerCase().includes(q)) ||
        (p.fecha && p.fecha.includes(q)) ||
        (p.banco_remitente && p.banco_remitente.toLowerCase().includes(q)) ||
        (p.banco_beneficiario && p.banco_beneficiario.toLowerCase().includes(q))

      const matchesTipo =
        paymentTypeFilter === 'todos' ||
        (p.tipo_pago && p.tipo_pago.toUpperCase() === paymentTypeFilter.toUpperCase())

      return matchesSearch && matchesTipo
    })
  }, [payments, paymentSearch, paymentTypeFilter])

  // Total pagado en la lista filtrada de Pagos
  const totalFilteredPayments = useMemo(() => {
    return filteredPaymentsList.reduce((sum, p) => sum + (Number(p.valor) || 0), 0)
  }, [filteredPaymentsList])

  // ── 2. Valores Pendientes (Tab "Valores Pendientes") ──
  const pendingBalances = useMemo(() => {
    return studentBalances.filter((sb) => sb.balancePending > 0)
  }, [studentBalances])

  const filteredPendingList = useMemo(() => {
    return pendingBalances.filter((sb) => {
      const q = pendingSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        sb.studentName.toLowerCase().includes(q) ||
        sb.identificacion.toLowerCase().includes(q) ||
        sb.courseName.toLowerCase().includes(q) ||
        sb.courseSchedule.toLowerCase().includes(q)

      const matchesCourse =
        pendingCourseFilter === 'all' ||
        (sb.courseId !== undefined && String(sb.courseId) === pendingCourseFilter) ||
        sb.courseName === pendingCourseFilter

      return matchesSearch && matchesCourse
    })
  }, [pendingBalances, pendingSearch, pendingCourseFilter])

  // Total pendiente en la lista filtrada
  const totalFilteredPending = useMemo(() => {
    return filteredPendingList.reduce((sum, sb) => sum + sb.balancePending, 0)
  }, [filteredPendingList])

  const getPaymentTypeBadgeStyle = (tipo?: string) => {
    switch (tipo?.toUpperCase()) {
      case 'EFECTIVO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'TRANSFERENCIA':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'DEPÓSITO':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'TARJETA':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  // Open modal for fast payment
  const handleOpenPayModal = (item: StudentBalance) => {
    setSelectedStudentForPay(item)
    setPayCourseId(item.courseId || '')
    setPayStudentId(item.studentId)
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      tipo_pago: 'TRANSFERENCIA',
      banco_remitente: 'BANCO GUAYAQUIL',
      banco_beneficiario: 'BANCO GUAYAQUIL',
      student_id: item.studentId,
      apellidos_nombres: item.studentName,
      horario: item.courseSchedule || item.courseName,
      valor: item.balancePending > 0 ? item.balancePending : (item.coursePrice || 35),
      concepto: item.balancePending > 0
        ? `Cobro saldo: ${item.courseName}${item.monthDetail ? ` (${item.monthDetail})` : ''}`
        : `Cuota: ${item.courseName}${item.monthDetail ? ` (${item.monthDetail})` : ''}`,
      comprobante: '',
    })
    setIsPayModalOpen(true)
  }

  // Cambio de curso en el modal de cobro
  const handleSelectCourseForPay = (courseId: number | '') => {
    setPayCourseId(courseId)
    setPayStudentId('')
    setSelectedStudentForPay(null)
    const c = courses.find((x) => x.id === courseId)
    setFormData((prev) => ({
      ...prev,
      student_id: undefined,
      apellidos_nombres: '',
      horario: c?.horario || '',
      valor: c?.precio ? Number(c.precio) : 35,
      concepto: c ? `Cuota: ${c.nombre}` : 'CUOTA CURSO',
    }))
  }

  // Cambio de estudiante en el modal de cobro
  const handleSelectStudentForPay = (studentId: number | '') => {
    setPayStudentId(studentId)
    if (!studentId) {
      setSelectedStudentForPay(null)
      setFormData((prev) => ({
        ...prev,
        student_id: undefined,
        apellidos_nombres: '',
      }))
      return
    }

    const st = students.find((x) => x.id === studentId)
    const stName = st ? `${st.apellidos} ${st.nombres}`.trim().toUpperCase() : ''
    const currentCourse = courses.find((x) => x.id === payCourseId)

    // Buscar si existe balance previo para este estudiante en este curso
    const balance = studentBalances.find(
      (b) => b.studentId === studentId && (payCourseId ? b.courseId === payCourseId : true)
    )

    if (balance) {
      setSelectedStudentForPay(balance)
      if (!payCourseId) {
        setPayCourseId(balance.courseId || '')
      }
      setFormData((prev) => ({
        ...prev,
        student_id: studentId,
        apellidos_nombres: stName,
        horario: balance.courseSchedule || currentCourse?.horario || '',
        valor: balance.balancePending > 0 ? balance.balancePending : (balance.coursePrice || 35),
        concepto: balance.balancePending > 0
          ? `Cobro saldo: ${balance.courseName}${balance.monthDetail ? ` (${balance.monthDetail})` : ''}`
          : `Cuota: ${balance.courseName}${balance.monthDetail ? ` (${balance.monthDetail})` : ''}`,
      }))
    } else {
      setSelectedStudentForPay(null)
      setFormData((prev) => ({
        ...prev,
        student_id: studentId,
        apellidos_nombres: stName,
        horario: currentCourse?.horario || '',
        valor: currentCourse?.precio ? Number(currentCourse.precio) : 35,
        concepto: currentCourse ? `Cuota: ${currentCourse.nombre}` : 'CUOTA CURSO',
      }))
    }
  }

  // Estudiantes disponibles para el curso seleccionado en el modal
  const availableStudentsForCourse = useMemo(() => {
    if (!payCourseId) return students
    const enrolledIds = new Set(
      enrollments
        .filter((e) => e.course_id === payCourseId && e.estado !== 'cancelada')
        .map((e) => e.student_id)
    )
    const enrolled = students.filter((s) => enrolledIds.has(s.id))
    return enrolled.length > 0 ? enrolled : students
  }, [students, enrollments, payCourseId])

  // Submit fast payment
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payStudentId || !formData.apellidos_nombres.trim()) {
      addToast({
        type: 'warning',
        title: 'Estudiante requerido',
        message: 'Por favor selecciona un estudiante para registrar el cobro.',
      })
      return
    }

    if (Number(formData.valor) <= 0) {
      addToast({
        type: 'warning',
        title: 'Monto inválido',
        message: 'Por favor ingresa un monto válido mayor a 0.',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const activeSecretary = useSettingsStore.getState().getActiveSecretaryName()
      const dataToSave: CreatePaymentDto = {
        ...formData,
        valor: Number(formData.valor) || 0,
        banco_remitente: formData.tipo_pago === 'EFECTIVO' ? 'EFECTIVO / CAJA' : (formData.banco_remitente || 'BANCO GUAYAQUIL'),
        banco_beneficiario: formData.tipo_pago === 'EFECTIVO' ? 'EFECTIVO / CAJA' : (formData.banco_beneficiario || 'BANCO GUAYAQUIL'),
        secretaria: activeSecretary,
      }
      const createdPayment = await paymentsAPI.create(dataToSave)

      // Si se está cobrando el saldo de un abono de la matriz de Cursos, actualizar la celda a CANCELADO o ABONO
      if (selectedStudentForPay?.courseId && selectedStudentForPay?.monthKey) {
        const cId = selectedStudentForPay.courseId
        const key = `${selectedStudentForPay.studentId}_${selectedStudentForPay.monthKey}`
        const grid = courseGrids[cId] || {}
        const prevCell = grid[key]
        if (prevCell) {
          // Usar Math.round para evitar problemas de precisión floating point
          const prevMonto = Math.round(Number(prevCell.monto || 0) * 100) / 100
          const cobradoAhora = Math.round(Number(formData.valor) * 100) / 100
          const newMonto = Math.round((prevMonto + cobradoAhora) * 100) / 100
          const cPrice = Math.round(Number(selectedStudentForPay.coursePrice || newMonto) * 100) / 100
          // Si el monto acumulado cubre el precio del curso (con tolerancia de 1 centavo), marcar CANCELADO
          const newStatus = newMonto >= cPrice - 0.01 ? 'CANCELADO' : 'ABONO'
          const updatedGrid = {
            ...grid,
            [key]: {
              ...prevCell,
              status: newStatus,
              monto: newMonto,
              fecha: formData.fecha,
              tipo_pago: formData.tipo_pago,
              banco_remitente: dataToSave.banco_remitente,
              banco_beneficiario: dataToSave.banco_beneficiario,
              comprobante: formData.comprobante || prevCell.comprobante,
              secretaria: prevCell.secretaria || activeSecretary,
            },
          }
          await settingsAPI.set(`course_payments_grid_${cId}`, JSON.stringify(updatedGrid))
        }
      }

      // Preparar recibo digital para previsualización e impresión
      try {
        const receiptNo = await useSettingsStore.getState().getNextReceiptNumber()
        setReceiptModalData({
          receiptNumber: receiptNo,
          fecha: formData.fecha,
          studentName: formData.apellidos_nombres,
          courseName: formData.horario || selectedStudentForPay?.courseName || 'CURSO FECIP',
          conceptText: formData.concepto || 'COBRO DE SALDO / CUOTA',
          quotaIndicator: '(1/1)',
          monto: Number(formData.valor || 0),
          tipoPago: formData.tipo_pago === 'EFECTIVO' ? 'Efectivo' : (formData.tipo_pago || 'Transferencia'),
          banco: formData.tipo_pago === 'EFECTIVO' ? undefined : (dataToSave.banco_remitente || dataToSave.banco_beneficiario),
          estado: 'Pagado',
          observaciones: formData.comprobante ? `Ref/Comp: ${formData.comprobante}` : undefined,
          comprobante: formData.comprobante || undefined,
          secretaria: activeSecretary,
        })
      } catch (receiptErr) {
        console.warn('No se pudo generar el comprobante de recibo:', receiptErr)
      }

      addToast({
        type: 'success',
        title: 'Cobro registrado',
        message: `Se registró el cobro de $${Number(formData.valor).toFixed(2)} para ${formData.apellidos_nombres} exitosamente.`,
      })
      setIsPayModalOpen(false)
      await loadData()
    } catch (err: any) {
      console.error('Error al registrar pago en caja:', err)
      addToast({
        type: 'error',
        title: 'Error',
        message: err?.message ? `No se pudo guardar el cobro: ${err.message}` : 'No se pudo guardar el cobro.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export report to CSV
  const handleExportCSV = () => {
    const todayStr = new Date().toISOString().split('T')[0]

    if (activeTab === 'pagos') {
      if (filteredPaymentsList.length === 0) {
        addToast({
          type: 'info',
          title: 'Sin datos',
          message: 'No hay pagos registrados para exportar.',
        })
        return
      }

      const headers = [
        'FECHA',
        'ESTUDIANTE',
        'TIPO DE PAGO',
        'BANCO REMITENTE',
        'BANCO BENEFICIARIO',
        'HORARIO',
        'CONCEPTO',
        'COMPROBANTE',
        'VALOR ($)',
      ]

      const csvRows = [
        headers.join(';'),
        ...filteredPaymentsList.map((p) => [
          `"${p.fecha || ''}"`,
          `"${(p.apellidos_nombres || '').replace(/"/g, '""')}"`,
          `"${p.tipo_pago || ''}"`,
          `"${p.banco_remitente || ''}"`,
          `"${p.banco_beneficiario || ''}"`,
          `"${(p.horario || '').replace(/"/g, '""')}"`,
          `"${(p.concepto || '').replace(/"/g, '""')}"`,
          `"${p.comprobante || ''}"`,
          `"${Number(p.valor || 0).toFixed(2)}"`,
        ].join(';')),
      ]

      const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Caja_Pagos_Registrados_${todayStr}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'Reporte descargado',
        message: `Se exportaron ${filteredPaymentsList.length} pagos exitosamente.`,
      })
    } else {
      if (filteredPendingList.length === 0) {
        addToast({
          type: 'info',
          title: 'Sin datos',
          message: 'No hay registros de saldos pendientes para exportar.',
        })
        return
      }

      const headers = [
        'ESTUDIANTE',
        'IDENTIFICACIÓN',
        'CURSO',
        'HORARIO',
        'COSTO CURSO',
        'TOTAL COBRADO',
        'FALTA POR COBRAR',
        'ESTADO',
      ]

      const csvRows = [
        headers.join(';'),
        ...filteredPendingList.map((sb) => [
          `"${sb.studentName.replace(/"/g, '""')}"`,
          `"${sb.identificacion}"`,
          `"${sb.courseName.replace(/"/g, '""')}"`,
          `"${sb.courseSchedule.replace(/"/g, '""')}"`,
          `"${sb.coursePrice.toFixed(2)}"`,
          `"${sb.totalPaid.toFixed(2)}"`,
          `"${sb.balancePending.toFixed(2)}"`,
          `"${sb.paymentStatus.toUpperCase()}"`,
        ].join(';')),
      ]

      const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Caja_Valores_Pendientes_${todayStr}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'Reporte descargado',
        message: `Se exportó el balance pendiente de ${filteredPendingList.length} estudiantes exitosamente.`,
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Encabezado Principal Unificado ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Caja</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                Balance general de caja: todo lo cobrado y lo que falta por cobrar a estudiantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Exportar Reporte</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => setCurrentPage('payments')}
              className="flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>Ver Rol de Pagos</span>
            </Button>
          </div>
        </div>
      </div>


      {/* ── Desglose de Caja por Método y Banco ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Efectivo en Caja</span>
          <p className="text-lg font-bold text-slate-800 mt-1">
            ${bankBreakdown['EFECTIVO / CAJA'].toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-pink-600 uppercase tracking-wider block">Banco Guayaquil</span>
          <p className="text-lg font-bold text-slate-800 mt-1">
            ${bankBreakdown['BANCO GUAYAQUIL'].toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Banco Pichincha</span>
          <p className="text-lg font-bold text-slate-800 mt-1">
            ${bankBreakdown['BANCO PICHINCHA'].toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Otros / Transferencias</span>
          <p className="text-lg font-bold text-slate-800 mt-1">
            ${bankBreakdown['OTROS BANCOS'].toFixed(2)}
          </p>
        </div>
      </div>

      {/* ── Selector de Pestañas (Tabs) ── */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pagos')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px cursor-pointer ${
            activeTab === 'pagos'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Pagos</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'pagos'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {payments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px cursor-pointer ${
            activeTab === 'pendientes'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Valores Pendientes</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'pendientes'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {pendingBalances.length}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PESTAÑA 1: PAGOS REALIZADOS (HISTORIAL DE COBROS DE CAJA)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pagos' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
          {/* Cabecera y Filtros de Pagos */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar pago por estudiante, concepto, comprobante..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              >
                <option value="todos">Todos los métodos de pago</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="DEPÓSITO">Depósito</option>
                <option value="TARJETA">Tarjeta</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setSelectedStudentForPay(null)
                  const initialCourseId = courses.length > 0 ? courses[0].id : ''
                  setPayCourseId(initialCourseId)
                  setPayStudentId('')
                  const c = courses.find((x) => x.id === initialCourseId)
                  setFormData({
                    fecha: new Date().toISOString().split('T')[0],
                    tipo_pago: 'TRANSFERENCIA',
                    banco_remitente: 'BANCO GUAYAQUIL',
                    banco_beneficiario: 'BANCO GUAYAQUIL',
                    student_id: undefined,
                    apellidos_nombres: '',
                    horario: c?.horario || '',
                    valor: c?.precio ? Number(c.precio) : 35,
                    concepto: c ? `Cuota: ${c.nombre}` : 'CUOTA CURSO',
                    comprobante: '',
                  })
                  setIsPayModalOpen(true)
                }}
              >
                Registrar Cobro
              </Button>
            </div>
          </div>

          {/* Tabla de Pagos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 tracking-wider uppercase">
                  <th className="py-3 px-4 whitespace-nowrap">FECHA</th>
                  <th className="py-3 px-4 whitespace-nowrap">ESTUDIANTE</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">TIPO DE PAGO</th>
                  <th className="py-3 px-4 whitespace-nowrap">BANCO REMITENTE</th>
                  <th className="py-3 px-4 whitespace-nowrap">BANCO BENEFICIARIO</th>
                  <th className="py-3 px-4 whitespace-nowrap">CONCEPTO / HORARIO</th>
                  <th className="py-3 px-4 whitespace-nowrap">COMPROBANTE</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">VALOR COBRADO</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">RECIBO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Cargando historial de pagos...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPaymentsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12">
                      <EmptyState
                        icon={<Receipt className="w-10 h-10 text-slate-300" />}
                        title="No se encontraron pagos registrados"
                        description={
                          paymentSearch || paymentTypeFilter !== 'todos'
                            ? 'No hay pagos que coincidan con la búsqueda o filtro aplicado.'
                            : 'Aún no hay cobros registrados en caja.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredPaymentsList.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/30 transition-colors text-slate-700"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {formatDate(p.fecha)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 uppercase whitespace-nowrap">
                        {p.apellidos_nombres || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPaymentTypeBadgeStyle(
                            p.tipo_pago
                          )}`}
                        >
                          {p.tipo_pago || 'TRANSFERENCIA'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {p.banco_remitente || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {p.banco_beneficiario || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{p.concepto || '—'}</span>
                          {p.horario && (
                            <span className="text-[10px] text-slate-400">{p.horario}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.comprobante ? (
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                            {p.comprobante}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-extrabold text-sm text-emerald-700 font-mono">
                        ${Number(p.valor || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptModalData({
                              receiptNumber: `REC-${String(p.id).padStart(5, '0')}`,
                              fecha: p.fecha,
                              studentName: p.apellidos_nombres,
                              courseName: p.horario || 'CURSO FECIP',
                              conceptText: p.concepto || 'PAGO POR CONCEPTO DE: MENSUALIDAD',
                              quotaIndicator: '(1/1)',
                              monto: Number(p.valor || 0),
                              tipoPago: p.tipo_pago === 'EFECTIVO' ? 'Efectivo' : (p.tipo_pago || 'Transferencia'),
                              banco: p.tipo_pago === 'EFECTIVO' ? undefined : (p.banco_remitente || p.banco_beneficiario),
                              estado: 'Pagado',
                              observaciones: p.comprobante ? `Ref/Comp: ${p.comprobante}` : undefined,
                              comprobante: p.comprobante || undefined,
                              secretaria: p.secretaria || 'Secretaria Rocio Lamilla',
                            })
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors cursor-pointer"
                          title="Ver / Imprimir Recibo"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Recibo</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer info bar de Pagos */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Mostrando <b>{filteredPaymentsList.length}</b> de <b>{payments.length}</b> pagos registrados
            </span>
            <div className="flex items-center gap-4">
              <span className="text-emerald-700 font-bold text-sm">
                Total Cobrado: ${totalFilteredPayments.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PESTAÑA 2: VALORES PENDIENTES (ESTUDIANTES CON SALDO POR COBRAR)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pendientes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
          {/* Cabecera y Filtros de Valores Pendientes */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar estudiante con saldo pendiente por nombre, cédula o curso..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pendingCourseFilter}
                onChange={(e) => setPendingCourseFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
              >
                <option value="all">Todos los cursos</option>
                {courses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl">
                {countConDeuda} con saldo pendiente
              </span>
            </div>
          </div>

          {/* Tabla de Valores Pendientes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 tracking-wider uppercase">
                  <th className="py-3 px-4 whitespace-nowrap">ESTUDIANTE</th>
                  <th className="py-3 px-4 whitespace-nowrap">CURSO / HORARIO</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">COSTO TOTAL</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">TOTAL PAGADO</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">FALTA POR COBRAR</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">ESTADO</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        <span>Calculando valores pendientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPendingList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <EmptyState
                        icon={<CheckCircle2 className="w-10 h-10 text-emerald-400" />}
                        title="¡Excelente! No hay valores pendientes"
                        description={
                          pendingSearch || pendingCourseFilter !== 'all'
                            ? 'No hay estudiantes pendientes con los filtros aplicados.'
                            : 'Todos los estudiantes matriculados están al día con sus pagos.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredPendingList.map((sb) => {
                    const isPartial = sb.totalPaid > 0 && sb.balancePending > 0

                    return (
                      <tr
                        key={`${sb.studentId}-${sb.courseId || sb.courseName}`}
                        className="hover:bg-amber-50/30 transition-colors text-slate-700"
                      >
                        {/* ESTUDIANTE */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 uppercase">
                              {sb.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              C.I: {sb.identificacion}
                            </span>
                          </div>
                        </td>

                        {/* CURSO / HORARIO */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">
                              {sb.courseName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {sb.courseSchedule}
                            </span>
                          </div>
                        </td>

                        {/* COSTO CURSO */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-medium text-slate-600">
                          ${sb.coursePrice.toFixed(2)}
                        </td>

                        {/* TOTAL PAGADO */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-emerald-700">
                          ${sb.totalPaid.toFixed(2)}
                        </td>

                        {/* FALTA POR COBRAR */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <span className="font-extrabold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                            ${sb.balancePending.toFixed(2)}
                          </span>
                        </td>

                        {/* ESTADO */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          {isPartial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Abono Parcial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Por Cobrar
                            </span>
                          )}
                        </td>

                        {/* ACCIONES: BOTÓN COBRAR */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(sb)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                            title={`Cobrar saldo de $${sb.balancePending.toFixed(2)} a ${sb.studentName}`}
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Cobrar</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer info bar de Pendientes */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Mostrando <b>{filteredPendingList.length}</b> de <b>{pendingBalances.length}</b> estudiantes con saldo pendiente
            </span>
            <div className="flex items-center gap-4">
              <span className="text-amber-700 font-bold text-sm">
                Total Falta por Cobrar: ${totalFilteredPending.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Registrar Cobro Rápido ── */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={
          selectedStudentForPay
            ? `Registrar Cobro - ${selectedStudentForPay.studentName}`
            : formData.apellidos_nombres
            ? `Registrar Cobro - ${formData.apellidos_nombres}`
            : 'Registrar Cobro'
        }
        size="md"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          {/* ── Selección de Curso y Estudiante ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Curso *
              </label>
              <select
                required
                value={payCourseId}
                onChange={(e) => handleSelectCourseForPay(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="">-- Seleccionar Curso --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (${Number(c.precio || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estudiante *
              </label>
              <select
                required
                value={payStudentId}
                onChange={(e) => handleSelectStudentForPay(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="">-- Seleccionar Estudiante --</option>
                {availableStudentsForCourse.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.apellidos} {s.nombres} {s.identificacion ? `(${s.identificacion})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedStudentForPay && (
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Curso matriculado:</span>
                <span className="font-bold text-slate-800">{selectedStudentForPay.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Costo total del curso:</span>
                <span className="font-bold text-slate-800">${selectedStudentForPay.coursePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Total ya cobrado:</span>
                <span className="font-bold text-emerald-600">${selectedStudentForPay.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200/80 pt-1.5 mt-1 font-bold">
                <span className="text-slate-800">Saldo pendiente por cobrar:</span>
                <span className={selectedStudentForPay.balancePending > 0 ? 'text-amber-700 font-extrabold text-sm' : 'text-emerald-700 font-bold'}>
                  ${selectedStudentForPay.balancePending.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Pago *</label>
              <select
                value={formData.tipo_pago}
                onChange={(e) => setFormData({ ...formData, tipo_pago: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {PAYMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {['TRANSFERENCIA', 'DEPÓSITO'].includes(formData.tipo_pago) && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Banco Remitente (Origen) *</label>
                  <select
                    value={formData.banco_remitente}
                    onChange={(e) => setFormData({ ...formData, banco_remitente: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {BANK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Banco Beneficiario (Destino) *</label>
                  <select
                    value={formData.banco_beneficiario}
                    onChange={(e) => setFormData({ ...formData, banco_beneficiario: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {BANK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Valor a Cobrar ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Concepto</label>
              <input
                type="text"
                value={formData.concepto || ''}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value.toUpperCase() })}
                placeholder="EJ: 1RA CUOTA, SALDO"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. Comprobante / Referencia</label>
              <input
                type="text"
                value={formData.comprobante || ''}
                onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })}
                placeholder="EJ: TR-998231"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPayModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {isSubmitting ? 'Guardando...' : 'Registrar Cobro'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Comprobante / Recibo de Pago Digital */}
      <PaymentReceiptModal
        isOpen={Boolean(receiptModalData)}
        onClose={() => setReceiptModalData(null)}
        data={receiptModalData}
      />
    </div>
  )
}
