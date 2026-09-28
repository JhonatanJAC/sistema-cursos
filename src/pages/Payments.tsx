import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  Receipt,
  FileSpreadsheet,
  CheckCircle,
  Building2,
  Clock,
  User,
  Filter,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { SearchInput } from '../components/ui/SearchInput'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { EmptyState } from '../components/ui/EmptyState'
import { paymentsAPI, studentsAPI, coursesAPI } from '../services/api'
import { useUIStore } from '../store/useUIStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { PaymentReceiptModal, ReceiptData } from '../components/ui/PaymentReceiptModal'
import type { Payment, CreatePaymentDto, Student, Course, PaymentStats } from '../types'

// Bank badge styling according to FECIP palette and user's Excel screenshot
export function getBankBadge(banco: string) {
  const b = banco ? banco.trim().toUpperCase() : ''
  if (b.includes('GUAYAQUIL')) {
    return 'bg-pink-100 text-pink-700 border-pink-200'
  }
  if (b.includes('PICHINCHA')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
  if (b.includes('PACIFICO') || b.includes('PACÍFICO')) {
    return 'bg-sky-100 text-sky-800 border-sky-200'
  }
  if (b.includes('BOLIVARIANO')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
  if (b.includes('PRODUBANCO') || b.includes('INTERNACIONAL')) {
    return 'bg-purple-100 text-purple-800 border-purple-200'
  }
  if (b.includes('JEP') || b.includes('COOP')) {
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

export function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '-'
  try {
    // If YYYY-MM-DD convert to DD/MM/YYYY
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    return dateStr
  } catch {
    return dateStr
  }
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

export default function Payments() {
  const { addToast } = useUIStore()

  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRecaudado: 0,
    totalPagos: 0,
    pagosMesActual: 0,
    promedioPago: 0,
  })
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterBanco, setFilterBanco] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreatePaymentDto>({
    fecha: new Date().toISOString().split('T')[0],
    tipo_pago: 'TRANSFERENCIA',
    banco_remitente: 'BANCO GUAYAQUIL',
    banco_beneficiario: 'BANCO GUAYAQUIL',
    student_id: undefined,
    apellidos_nombres: '',
    horario: '',
    valor: 35,
    concepto: '1RA CUOTA',
    comprobante: '',
  })

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [paymentsList, statsData, studentsList, coursesList] = await Promise.all([
        paymentsAPI.findAll(),
        paymentsAPI.getStats(),
        studentsAPI.findAll(),
        coursesAPI.findAll(),
      ])
      setPayments(paymentsList || [])
      setStats(statsData || { totalRecaudado: 0, totalPagos: 0, pagosMesActual: 0, promedioPago: 0 })
      setStudents(studentsList || [])
      setCourses(coursesList || [])
    } catch (error) {
      console.error('Error al cargar rol de pagos:', error)
      addToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error de carga',
        message: 'No se pudieron cargar los datos de pagos',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search text
      if (search) {
        const q = search.toLowerCase()
        const matchesName = p.apellidos_nombres?.toLowerCase().includes(q)
        const matchesHorario = p.horario?.toLowerCase().includes(q)
        const matchesConcepto = p.concepto?.toLowerCase().includes(q)
        const matchesBancoR = p.banco_remitente?.toLowerCase().includes(q)
        const matchesBancoB = p.banco_beneficiario?.toLowerCase().includes(q)
        const matchesComprobante = p.comprobante?.toLowerCase().includes(q)
        if (!matchesName && !matchesHorario && !matchesConcepto && !matchesBancoR && !matchesBancoB && !matchesComprobante) {
          return false
        }
      }

      // Filter by bank
      if (filterBanco !== 'todos') {
        const matchesBank = p.banco_remitente === filterBanco || p.banco_beneficiario === filterBanco
        if (!matchesBank) return false
      }

      // Filter by payment type
      if (filterTipo !== 'todos') {
        if (p.tipo_pago !== filterTipo) return false
      }

      return true
    })
  }, [payments, search, filterBanco, filterTipo])

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPayment(null)
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      tipo_pago: 'TRANSFERENCIA',
      banco_remitente: 'BANCO GUAYAQUIL',
      banco_beneficiario: 'BANCO GUAYAQUIL',
      student_id: undefined,
      apellidos_nombres: '',
      horario: '',
      valor: 35,
      concepto: '1RA CUOTA',
      comprobante: '',
    })
    setIsModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({
      fecha: payment.fecha || new Date().toISOString().split('T')[0],
      tipo_pago: payment.tipo_pago || 'TRANSFERENCIA',
      banco_remitente: payment.banco_remitente || 'BANCO GUAYAQUIL',
      banco_beneficiario: payment.banco_beneficiario || 'BANCO GUAYAQUIL',
      student_id: payment.student_id,
      apellidos_nombres: payment.apellidos_nombres || '',
      horario: payment.horario || '',
      valor: payment.valor || 0,
      concepto: payment.concepto || '',
      comprobante: payment.comprobante || '',
    })
    setIsModalOpen(true)
  }

  // Auto-fill student details on student select
  const handleStudentSelect = (studentIdStr: string) => {
    if (!studentIdStr) {
      setFormData((prev) => ({ ...prev, student_id: undefined }))
      return
    }
    const sId = Number(studentIdStr)
    const selected = students.find((s) => s.id === sId)
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        student_id: sId,
        apellidos_nombres: `${selected.apellidos} ${selected.nombres}`.toUpperCase(),
        horario: selected.curso || prev.horario,
      }))
    }
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.apellidos_nombres.trim()) {
      addToast({
        id: Date.now().toString(),
        type: 'warning',
        title: 'Campo requerido',
        message: 'Debe ingresar los apellidos y nombres del estudiante',
      })
      return
    }

    try {
      setIsSubmitting(true)
      if (editingPayment) {
        await paymentsAPI.update(editingPayment.id, formData)
        addToast({
          id: Date.now().toString(),
          type: 'success',
          title: 'Pago actualizado',
          message: 'El registro de pago ha sido modificado exitosamente.',
        })
      } else {
        const activeSec = useSettingsStore.getState().getActiveSecretaryName()
        const created = await paymentsAPI.create({
          ...formData,
          secretaria: activeSec,
        })
        addToast({
          id: Date.now().toString(),
          type: 'success',
          title: 'Pago registrado',
          message: 'El pago ha sido registrado en el sistema correctamente.',
        })

        const receiptNo = await useSettingsStore.getState().getNextReceiptNumber()
        setReceiptModalData({
          receiptNumber: receiptNo,
          fecha: formData.fecha,
          studentName: formData.apellidos_nombres,
          courseName: formData.horario || 'CURSO FECIP',
          conceptText: formData.concepto || 'PAGO POR CONCEPTO DE: MENSUALIDAD',
          quotaIndicator: '(1/1)',
          monto: Number(formData.valor || 0),
          tipoPago: formData.tipo_pago === 'EFECTIVO' ? 'Efectivo' : (formData.tipo_pago || 'Transferencia'),
          banco: formData.tipo_pago === 'EFECTIVO' ? undefined : (formData.banco_remitente || formData.banco_beneficiario),
          estado: 'Pagado',
          observaciones: formData.comprobante ? `Comprobante: ${formData.comprobante}` : undefined,
          comprobante: formData.comprobante,
          secretaria: activeSec,
        })
      }
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error('Error al guardar pago:', error)
      addToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el registro de pago.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingPayment) return
    try {
      await paymentsAPI.delete(deletingPayment.id)
      addToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Pago eliminado',
        message: 'El registro de pago ha sido eliminado.',
      })
      setDeletingPayment(null)
      loadData()
    } catch (error) {
      console.error('Error al eliminar pago:', error)
      addToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el registro de pago.',
      })
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      addToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Sin datos',
        message: 'No hay pagos disponibles para exportar con los filtros actuales.',
      })
      return
    }

    const headers = [
      'FECHA',
      'TIPO DE PAGO',
      'BANCO REMITENTE',
      'BANCO BENEFICIARIO',
      'APELLIDOS Y NOMBRES',
      'HORARIO',
      'VALOR',
      'CONCEPTO',
      'COMPROBANTE',
    ]

    const csvRows = [
      headers.join(';'),
      ...filteredPayments.map((p) => [
        `"${formatDisplayDate(p.fecha)}"`,
        `"${p.tipo_pago || ''}"`,
        `"${p.banco_remitente || ''}"`,
        `"${p.banco_beneficiario || ''}"`,
        `"${(p.apellidos_nombres || '').replace(/"/g, '""')}"`,
        `"${(p.horario || '').replace(/"/g, '""')}"`,
        `"${Number(p.valor || 0).toFixed(2)}"`,
        `"${(p.concepto || '').replace(/"/g, '""')}"`,
        `"${(p.comprobante || '').replace(/"/g, '""')}"`,
      ].join(';')),
    ]

    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Rol_de_Pagos_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    addToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Exportación completada',
      message: `Se han exportado ${filteredPayments.length} registros exitosamente.`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Encabezado Principal ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Rol de Pagos</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                Control y registro contable de pagos, transferencias y depósitos de estudiantes
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
              <span>Exportar CSV</span>
            </Button>

            <Button
              variant="primary"
              onClick={handleOpenCreate}
              icon={<Plus className="w-4 h-4" />}
            >
              Registrar Pago
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Recaudado</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              ${Number(stats?.totalRecaudado || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Ingresos registrados
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registros de Pago</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats?.totalPagos || 0}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Transacciones totales</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1d68d8] shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pagos Este Mes</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats?.pagosMesActual || 0}</h3>
            <p className="text-xs text-indigo-600 font-medium mt-1">Mes actual en curso</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ticket Promedio</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              ${Number(stats?.promedioPago || 0).toFixed(2)}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Por transacción</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por estudiante, horario, concepto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8] transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Banco:</span>
              <select
                value={filterBanco}
                onChange={(e) => setFilterBanco(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8] shadow-2xs"
              >
                <option value="todos">Todos los bancos</option>
                <option value="BANCO GUAYAQUIL">Banco Guayaquil</option>
                <option value="BANCO PICHINCHA">Banco Pichincha</option>
                <option value="BANCO PACIFICO">Banco Pacífico</option>
                <option value="BANCO BOLIVARIANO">Banco Bolivariano</option>
                <option value="EFECTIVO / CAJA">Efectivo / Caja</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Tipo:</span>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8] shadow-2xs"
              >
                <option value="todos">Todos los tipos</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="DEPÓSITO">Depósito</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table matching exact format */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 tracking-wider uppercase">
                <th className="py-3 px-4 whitespace-nowrap">FECHA</th>
                <th className="py-3 px-4 whitespace-nowrap">TIPO DE PAGO</th>
                <th className="py-3 px-4 whitespace-nowrap">BANCO REMITENTE</th>
                <th className="py-3 px-4 whitespace-nowrap">BANCO BENEFICIARIO</th>
                <th className="py-3 px-4 whitespace-nowrap">APELLIDOS Y NOMBRES</th>
                <th className="py-3 px-4 whitespace-nowrap">HORARIO</th>
                <th className="py-3 px-4 whitespace-nowrap text-right">VALOR</th>
                <th className="py-3 px-4 whitespace-nowrap">CONCEPTO</th>
                <th className="py-3 px-4 whitespace-nowrap text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#1d68d8] border-t-transparent rounded-full animate-spin" />
                      <span>Cargando rol de pagos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12">
                    <EmptyState
                      icon={<Receipt className="w-10 h-10 text-slate-300" />}
                      title="No se encontraron registros de pagos"
                      description={
                        search || filterBanco !== 'todos' || filterTipo !== 'todos'
                          ? 'No hay resultados para los filtros seleccionados.'
                          : 'Comienza registrando el primer pago recibido.'
                      }
                      action={
                        search || filterBanco !== 'todos' || filterTipo !== 'todos' ? undefined : (
                          <Button
                            onClick={handleOpenCreate}
                            className="bg-[#1d68d8] hover:bg-[#1553b0] text-white text-xs mt-2"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Registrar Primer Pago
                          </Button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const remBadge = getBankBadge(p.banco_remitente)
                  const benBadge = getBankBadge(p.banco_beneficiario)

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/30 transition-colors group text-slate-700"
                    >
                      {/* FECHA */}
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {formatDisplayDate(p.fecha)}
                      </td>

                      {/* TIPO DE PAGO */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                          {p.tipo_pago || 'TRANSFERENCIA'}
                        </span>
                      </td>

                      {/* BANCO REMITENTE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-[11px] border tracking-tight ${remBadge}`}
                        >
                          {p.banco_remitente || 'BANCO GUAYAQUIL'}
                        </span>
                      </td>

                      {/* BANCO BENEFICIARIO */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-[11px] border tracking-tight ${benBadge}`}
                        >
                          {p.banco_beneficiario || 'BANCO GUAYAQUIL'}
                        </span>
                      </td>

                      {/* APELLIDOS Y NOMBRES */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 uppercase tracking-tight">
                        <div className="flex flex-col">
                          <span>{p.apellidos_nombres}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.comprobante && (
                              <span className="text-[10px] font-normal text-slate-400 lowercase">
                                ref: {p.comprobante}
                              </span>
                            )}
                            {p.secretaria && (
                              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60 lowercase">
                                {p.secretaria}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* HORARIO */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.horario ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {p.horario}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* VALOR */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-black text-sm text-slate-800">
                        ${Number(p.valor || 0).toFixed(2)}
                      </td>

                      {/* CONCEPTO */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">
                        {p.concepto || '-'}
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setReceiptModalData({
                                receiptNumber: String(p.id).padStart(6, '0'),
                                fecha: p.fecha,
                                studentName: p.apellidos_nombres,
                                courseName: p.horario || 'CURSO FECIP',
                                conceptText: p.concepto || 'PAGO POR CONCEPTO DE: MENSUALIDAD',
                                quotaIndicator: '',
                                monto: Number(p.valor || 0),
                                tipoPago: p.tipo_pago === 'EFECTIVO' ? 'Efectivo' : (p.tipo_pago || 'Transferencia'),
                                banco: p.banco_remitente || p.banco_beneficiario,
                                estado: 'Pagado',
                                observaciones: p.comprobante ? `Comprobante: ${p.comprobante}` : undefined,
                                comprobante: p.comprobante,
                                secretaria: p.secretaria || undefined,
                              })
                            }}
                            title="Ver e Imprimir Recibo"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Editar Pago"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPayment(p)}
                            title="Eliminar Pago"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Mostrando <b>{filteredPayments.length}</b> de <b>{payments.length}</b> pagos registrados
          </span>
          <span className="font-semibold text-slate-700">
            Subtotal filtrado: $
            {filteredPayments
              .reduce((sum, p) => sum + (Number(p.valor) || 0), 0)
              .toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Modal: Registrar / Editar Pago */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPayment ? 'Editar Registro de Pago' : 'Registrar Nuevo Pago'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick select student if available */}
          {!editingPayment && students.length > 0 && (
            <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 mb-2">
              <label className="block text-xs font-bold text-blue-900 mb-1">
                Seleccionar Estudiante Existente (Opcional)
              </label>
              <select
                value={formData.student_id || ''}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full bg-white border border-blue-200 text-xs rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              >
                <option value="">-- Ingreso manual o seleccionar de la lista --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.apellidos} {st.nombres} ({st.identificacion}) {st.curso ? `- ${st.curso}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-blue-600/80 mt-1">
                Al seleccionar un estudiante, sus apellidos y su curso/horario se completarán automáticamente.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FECHA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Pago *
              </label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              />
            </div>

            {/* TIPO DE PAGO */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Pago *
              </label>
              <select
                value={formData.tipo_pago}
                onChange={(e) => setFormData({ ...formData, tipo_pago: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              >
                {PAYMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* BANCO REMITENTE */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banco Remitente *
              </label>
              <select
                value={formData.banco_remitente}
                onChange={(e) => setFormData({ ...formData, banco_remitente: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              >
                {BANK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* BANCO BENEFICIARIO */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banco Beneficiario *
              </label>
              <select
                value={formData.banco_beneficiario}
                onChange={(e) => setFormData({ ...formData, banco_beneficiario: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              >
                {BANK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* APELLIDOS Y NOMBRES */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Apellidos y Nombres del Estudiante *
              </label>
              <input
                type="text"
                required
                placeholder="EJ: VACA QUINCHIGUANGO MELANY BELEN"
                value={formData.apellidos_nombres}
                onChange={(e) => setFormData({ ...formData, apellidos_nombres: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              />
            </div>

            {/* HORARIO / CURSO */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horario / Curso
              </label>
              <input
                type="text"
                placeholder="EJ: ENF. SABADOS 2, FARMACIA SAB Y DOM"
                value={formData.horario || ''}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              />
            </div>

            {/* VALOR ($) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  placeholder="35.00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
                />
              </div>
            </div>

            {/* CONCEPTO */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Concepto del Pago
              </label>
              <input
                type="text"
                placeholder="EJ: 1RA CUOTA, MATRÍCULA, CERTIFICACIÓN"
                value={formData.concepto || ''}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              />
            </div>

            {/* COMPROBANTE / REFERENCIA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Comprobante / Referencia (Opcional)
              </label>
              <input
                type="text"
                placeholder="EJ: TR-98231 / 0019283"
                value={formData.comprobante || ''}
                onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d68d8]/20 focus:border-[#1d68d8]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1d68d8] hover:bg-[#1553b0] text-white text-xs"
            >
              {isSubmitting
                ? 'Guardando...'
                : editingPayment
                ? 'Actualizar Registro'
                : 'Guardar Pago'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingPayment)}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Registro de Pago"
        message={`¿Estás seguro de que deseas eliminar el registro de pago de "${deletingPayment?.apellidos_nombres}" por el valor de $${Number(deletingPayment?.valor || 0).toFixed(2)}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Pago"
        cancelText="Cancelar"
        variant="danger"
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
