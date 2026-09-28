import React, { useRef } from 'react'
import {
  FileText,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  MessageSquare,
  DollarSign,
  Printer,
  X,
} from 'lucide-react'
import fecipLogo from '../../assets/fecip-logo.png'
import { useSettingsStore } from '../../store/useSettingsStore'

export interface ReceiptData {
  receiptNumber?: string | number
  fecha?: string
  studentName: string
  courseName: string
  conceptText?: string
  quotaIndicator?: string // e.g. "(1/6)"
  monto: number
  tipoPago: string
  banco?: string
  estado?: 'Pagado' | 'Abono' | string
  observaciones?: string
  comprobante?: string
  secretaria?: string
}

export interface PaymentReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  data: ReceiptData | null
}

function formatReceiptDate(dateStr?: string): string {
  if (!dateStr) dateStr = new Date().toISOString().split('T')[0]
  try {
    const parts = dateStr.includes('-')
      ? dateStr.split('-').map(Number)
      : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]
    const y = parts[0]
    const m = parts[1]
    const d = parts[2]

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${d} de ${monthNames[(m || 1) - 1]} del ${y}`
  } catch {
    return dateStr
  }
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null)
  const { receiptSignature, receiptSecretary, currentUser } = useSettingsStore()

  if (!isOpen || !data) return null

  const handlePrint = () => {
    window.print()
  }

  // Format receipt number to 20 digits padded with zeros, starting from 00000000000000000000
  const rawNum =
    data.receiptNumber !== undefined && data.receiptNumber !== null && String(data.receiptNumber) !== ''
      ? String(data.receiptNumber)
      : '0'
  const formattedReceiptNo = rawNum.padStart(20, '0')

  const formattedDate = formatReceiptDate(data.fecha)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Styles for direct clean printing of the receipt in horizontal orientation */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          #fecip-printable-receipt, #fecip-printable-receipt * {
            visibility: visible !important;
          }
          #fecip-printable-receipt {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 240mm !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px 32px !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 16px !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* HORIZONTAL / LANDSCAPE MODAL CONTAINER */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[880px] overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar (Screen Only) */}
        <div className="no-print flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-slate-800 text-sm">Recibo de Pago Oficial FECIP (Horizontal)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Recibo
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── PRINTABLE HORIZONTAL RECEIPT ── */}
        <div
          id="fecip-printable-receipt"
          ref={receiptRef}
          className="relative p-6 sm:p-8 bg-white text-slate-800 font-sans selection:bg-blue-100 flex flex-col justify-between"
        >
          {/* Top Row: FECIP Logo & Header Ribbon */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="pt-0.5">
              <img
                src={fecipLogo}
                alt="FECIP - Fundación Ecuatoriana de Capacitación Integral y Profesional"
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </div>

            {/* Angled Ribbon "Recibo de Pago" */}
            <div className="flex items-center">
              {/* Cyan diagonal stripes */}
              <div className="flex items-center gap-1.5 mr-2">
                <div className="w-2.5 sm:w-3 h-5 sm:h-6 bg-cyan-400 -skew-x-[25deg] rounded-xs" />
                <div className="w-2.5 sm:w-3 h-5 sm:h-6 bg-cyan-400 -skew-x-[25deg] rounded-xs" />
                <div className="w-2.5 sm:w-3 h-5 sm:h-6 bg-cyan-400 -skew-x-[25deg] rounded-xs" />
                <div className="w-2.5 sm:w-3 h-5 sm:h-6 bg-cyan-400 -skew-x-[25deg] rounded-xs" />
              </div>

              {/* Navy blue badge */}
              <div
                className="bg-[#0b2b5c] text-white px-5 sm:px-6 py-1.5 sm:py-2 font-extrabold text-sm sm:text-base tracking-wide shadow-xs"
                style={{
                  clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)',
                }}
              >
                Recibo de Pago
              </div>
            </div>
          </div>

          {/* Row 2: Recibo No. & Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 py-1 px-1">
            {/* Recibo No. */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-[#0b2b5c] shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block font-bold text-xs text-[#0b2b5c]">Recibo No.</span>
                <span className="block font-mono text-[11px] text-slate-700 tracking-wider font-semibold">
                  {formattedReceiptNo}
                </span>
              </div>
            </div>

            {/* Fecha */}
            <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-200 sm:pl-5">
              <div className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-[#0b2b5c] shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block font-bold text-xs text-[#0b2b5c]">Fecha</span>
                <span className="block text-xs text-slate-700 font-medium">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Card 1: Recibí de (Light Blue) */}
          <div className="mb-2.5 bg-sky-50/70 border border-sky-200/90 rounded-xl p-2.5 sm:p-3 flex items-start gap-3 shadow-2xs">
            <div className="w-6 h-6 rounded-full border border-sky-300 flex items-center justify-center text-[#0b2b5c] shrink-0 mt-0.5">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block font-bold text-xs text-slate-900 leading-none mb-1">
                Recibí de
              </span>
              <p className="font-bold text-xs sm:text-sm text-slate-800 tracking-wide uppercase truncate">
                {data.studentName}
              </p>
            </div>
          </div>

          {/* Card 2: Concepto (Light Cream/Green) */}
          <div className="mb-2.5 bg-[#f8faf4] border border-[#d9ecd0] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-lg border border-slate-300 flex items-center justify-center text-[#0b2b5c] shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block font-bold text-xs text-slate-900 leading-none mb-1">
                  Concepto
                </span>
                <p className="text-xs font-semibold text-slate-700 uppercase leading-snug">
                  {data.conceptText || 'PAGO POR CONCEPTO DE: MENSUALIDAD'}
                </p>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {data.courseName}
                </p>
              </div>
            </div>

            {/* Right badge: (1/6) */}
            {data.quotaIndicator && (
              <div className="font-extrabold text-base sm:text-lg text-slate-800 shrink-0 px-2">
                {data.quotaIndicator}
              </div>
            )}
          </div>

          {/* Card 3: 3 Columns: Valor | Metodo de pago | Estado (Light Cream/Green) */}
          <div className="mb-2.5 bg-[#f8faf4] border border-[#d9ecd0] rounded-xl p-2.5 sm:p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 shadow-2xs">
            {/* Valor */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-[#0b2b5c] shrink-0">
                <DollarSign className="w-4 h-4 font-bold" />
              </div>
              <div>
                <span className="block font-bold text-xs text-slate-900 leading-none mb-1">
                  Valor
                </span>
                <span className="font-bold text-sm sm:text-base text-slate-800">
                  {Number(data.monto).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Metodo de pago */}
            <div className="flex items-center gap-2.5 sm:pl-3 pt-1 sm:pt-0">
              <div className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-[#0b2b5c] shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs text-slate-900 leading-none mb-1">
                  Metodo de pago
                </span>
                <span className="font-semibold text-xs sm:text-sm text-slate-800 block truncate">
                  {data.tipoPago}
                  {data.banco && data.tipoPago !== 'Efectivo' && data.tipoPago !== 'EFECTIVO'
                    ? ` (${data.banco})`
                    : ''}
                </span>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-2.5 sm:pl-3 pt-1 sm:pt-0">
              <div className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-xs text-slate-900 leading-none mb-1">
                  Estado
                </span>
                <span className="font-bold text-xs sm:text-sm text-emerald-700">
                  {data.estado || 'Pagado'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Observaciones Card */}
          <div className="mb-1 bg-[#f0f6ff] border border-[#d6e5fb] rounded-xl p-2.5 sm:p-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg border border-sky-300 flex items-center justify-center text-[#0b2b5c] shrink-0 mt-0.5 bg-white">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-xs text-slate-900 leading-none mb-1">
                  Observaciones
                </span>
                <p className="text-xs text-slate-700 leading-snug">
                  {(() => {
                    // 1. Si el pago/recibo ya tiene su secretaria emisora registrada, USAR ESA INMUTABLEMENTE
                    let sec = data.secretaria?.trim()

                    // 2. Si no vino en data.secretaria pero observaciones ya tiene "Recibido: [Nombre]", extraer y respetar ese nombre histórico
                    if (!sec && data.observaciones) {
                      const match = data.observaciones.match(/Recibido:\s*([^·\n\r]+)/i)
                      if (match && match[1]?.trim()) {
                        sec = match[1].trim()
                      }
                    }

                    // 3. Solo si es una emisión completamente nueva sin secretaria previa, tomar la secretaria activa
                    if (!sec) {
                      sec = currentUser?.name?.trim() || receiptSecretary?.trim() || 'Secretaria Rocio Lamilla'
                    }

                    const defaultRec = sec.toLowerCase().startsWith('recibido') ? sec : `Recibido: ${sec}`

                    // Si observaciones ya incluye el texto de Recibido con su secretaria histórica, mostrarlo tal cual
                    if (!data.observaciones || !data.observaciones.trim() || data.observaciones.toLowerCase().startsWith('recibido:')) {
                      return defaultRec
                    }
                    if (!data.observaciones.toLowerCase().includes('recibido')) {
                      return `${defaultRec} · ${data.observaciones}`
                    }
                    return data.observaciones
                  })()}
                  {data.comprobante ? ` · Ref: ${data.comprobante}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Debajo de la card: ¡GRACIAS POR SU PAGO! */}
          <div className="text-right py-1 px-1 mb-2">
            <span className="font-extrabold text-xs sm:text-sm text-[#0b2b5c] tracking-wider uppercase">
              ¡GRACIAS POR SU PAGO!
            </span>
          </div>

          {/* Bottom Section: Centered Signature */}
          <div className="relative pt-1 pb-2">
            {/* Bottom-left decorative fold (matching user's screenshot) */}
            <div className="absolute -bottom-1 -left-1 w-16 h-16 overflow-hidden pointer-events-none rounded-bl-2xl">
              <div className="absolute bottom-0 left-0 w-14 h-14 bg-[#0b2b5c] -rotate-45 -translate-x-7 translate-y-7" />
              <div className="absolute bottom-0 left-0 w-9 h-9 bg-sky-600 -rotate-45 -translate-x-5 translate-y-8 opacity-80" />
            </div>

            {/* Signature Box */}
            <div className="text-center flex flex-col items-center justify-center mx-auto max-w-[260px]">
              <div className="h-11 flex items-center justify-center mb-1">
                {receiptSignature ? (
                  <img
                    src={receiptSignature}
                    alt="Firma Autorizada"
                    className="max-h-11 w-auto max-w-[190px] object-contain"
                  />
                ) : (
                  <svg
                    className="w-36 h-10"
                    viewBox="0 0 160 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 36 C24 18, 30 6, 40 10 C50 14, 38 40, 46 32 C53 25, 60 18, 68 26 C74 32, 80 20, 86 13 C90 8, 93 30, 97 24 C102 18, 110 16, 118 20 M28 40 C58 38, 108 36, 132 39"
                      stroke="#0b2b5c"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="border-t border-slate-700 pt-1 w-48 sm:w-56 mx-auto">
                <span className="block font-bold text-xs text-slate-800 leading-snug">
                  Firma autorizada
                </span>
                <span className="block text-[11px] text-slate-500 leading-none">
                  Coordinación Académica
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Screen Only) */}
        <div className="no-print flex items-center justify-between px-6 py-2.5 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Formato horizontal (landscape) optimizado para impresión física o PDF.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
