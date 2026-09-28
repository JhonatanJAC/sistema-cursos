import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TrendingUp,
  Search,
  Download,
  Plus,
  CheckCircle2,
  Filter,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { paymentsAPI, studentsAPI, coursesAPI } from '../services/api'
import { useUIStore } from '../store/useUIStore'
import { formatDisplayDate, getBankBadge } from './Payments'
import type { Payment, CreatePaymentDto, Student, Course } from '../types'

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

export default function Income() {
  const { addToast } = useUIStore()

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [filterBanco, setFilterBanco] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')

  // Modal: Registrar Nuevo Ingreso
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreatePaymentDto>({
    fecha: new Date().toISOString().split('T')[0],
    tipo_pago: 'TRANSFERENCIA',
    banco_remitente: 'BANCO GUAYAQUIL',
    banco_beneficiario: 'BANCO GUAYAQUIL',
    student_id: undefined,
    apellidos_nombres: '',
    horario: '',
    valor: 35,
    concepto: 'CUOTA / MATRÍCULA',
    comprobante: '',
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const paymentsList = await paymentsAPI.findAll()
      setPayments(paymentsList || [])
    } catch (err) {
      console.error('Error al cargar datos de ingresos:', err)
      addToast({
        type: 'error',
        title: 'Error de carga',
        message: 'No se pudieron sincronizar los datos de ingresos.',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Pagos filtrados
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
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

      if (filterBanco !== 'todos') {
        const matchesBank = p.banco_remitente === filterBanco || p.banco_beneficiario === filterBanco
        if (!matchesBank) return false
      }

      if (filterTipo !== 'todos') {
        if (p.tipo_pago !== filterTipo) return false
      }

      return true
    })
  }, [payments, search, filterBanco, filterTipo])

  // Submit nuevo ingreso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.apellidos_nombres.trim() || Number(formData.valor) <= 0) {
      addToast({
        type: 'warning',
        title: 'Campo requerido',
        message: 'Por favor ingresa un nombre y un valor válido.',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await paymentsAPI.create(formData)
      addToast({
        type: 'success',
        title: 'Ingreso registrado',
        message: `Se registró el ingreso de $${Number(formData.valor).toFixed(2)} exitosamente.`,
      })
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      console.error('Error al registrar ingreso:', err)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el registro de ingreso.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Exportar CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      addToast({
        type: 'info',
        title: 'Sin datos',
        message: 'No hay ingresos para exportar con los filtros seleccionados.',
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
    link.setAttribute('download', `Reporte_Ingresos_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    addToast({
      type: 'success',
      title: 'Reporte descargado',
      message: `Se han exportado ${filteredPayments.length} registros de ingresos exitosamente.`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Encabezado Principal Unificado ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Ingresos</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Reporte y arqueo de ingresos reales recaudados por concepto de matrículas y cuotas
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
              onClick={() => setIsModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Registrar Ingreso
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tabla de Movimientos de Ingresos ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por estudiante, concepto, comprobante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Banco:</span>
              <select
                value={filterBanco}
                onChange={(e) => setFilterBanco(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
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
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
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

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 tracking-wider uppercase">
                <th className="py-3 px-4 whitespace-nowrap">FECHA</th>
                <th className="py-3 px-4 whitespace-nowrap">ESTUDIANTE / PAGADOR</th>
                <th className="py-3 px-4 whitespace-nowrap">MÉTODO</th>
                <th className="py-3 px-4 whitespace-nowrap">BANCO</th>
                <th className="py-3 px-4 whitespace-nowrap">CONCEPTO</th>
                <th className="py-3 px-4 whitespace-nowrap">COMPROBANTE</th>
                <th className="py-3 px-4 whitespace-nowrap text-right">VALOR RECAUDADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Cargando movimientos de ingresos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      icon={<TrendingUp className="w-10 h-10 text-slate-300" />}
                      title="No se encontraron ingresos registrados"
                      description="No hay movimientos con los filtros seleccionados."
                    />
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const remBadge = getBankBadge(p.banco_remitente)

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/30 transition-colors text-slate-700"
                    >
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {formatDisplayDate(p.fecha)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                        {p.apellidos_nombres}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                          {p.tipo_pago || 'TRANSFERENCIA'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-[11px] border tracking-tight ${remBadge}`}
                        >
                          {p.banco_remitente || 'BANCO GUAYAQUIL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium max-w-xs truncate">
                        {p.concepto || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {p.comprobante || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-black text-sm text-emerald-700">
                        +${Number(p.valor || 0).toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Mostrando <b>{filteredPayments.length}</b> de <b>{payments.length}</b> ingresos registrados
          </span>
          <span className="font-semibold text-emerald-700">
            Total filtrado: $
            {filteredPayments
              .reduce((sum, p) => sum + (Number(p.valor) || 0), 0)
              .toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── Modal: Registrar Ingreso ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Ingreso"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Banco Remitente *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Banco Beneficiario *</label>
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos y Nombres / Pagador *</label>
              <input
                type="text"
                required
                value={formData.apellidos_nombres}
                onChange={(e) => setFormData({ ...formData, apellidos_nombres: e.target.value.toUpperCase() })}
                placeholder="EJ: PÉREZ LÓPEZ MARÍA"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Recaudado ($) *</label>
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
                placeholder="EJ: 1RA CUOTA, MATRÍCULA"
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
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {isSubmitting ? 'Guardando...' : 'Registrar Ingreso'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
