import React, { useState, useId } from 'react'

export interface TradingDataPoint {
  label: string
  value: number
  date?: string
  count?: number
}

interface TradingLineChartProps {
  data: TradingDataPoint[]
  title?: string
  subtitle?: string
  totalAmount?: number
  trendPercent?: string
  onViewAll?: () => void
}

/**
 * Gráfica de Evolución de Ingresos (Últimos 6 Meses)
 * Réplica exacta del estilo solicitado:
 * - Título y subtítulo limpios a la izquierda
 * - Leyenda "● Ingresos" en verde a la derecha
 * - Eje Y con valores monetarios ($0, $250, $500, $930) y líneas punteadas
 * - Eje X con los 6 meses (ej. Abr 2026, May 2026, ...)
 * - Curva suave en verde esmeralda con área sombreada difuminada
 * - Sin cifras fijas de recaudación: visualización de ingresos interactiva al pasar el mouse (tooltip)
 */
export function TradingLineChart({
  data,
  title = 'Evolución de Ingresos (Últimos 6 Meses)',
  subtitle = 'Histórico de recaudación mensual de cursos',
}: TradingLineChartProps) {
  const gradientId = useId()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // 6 meses por defecto si no vienen datos o están vacíos
  const defaultMonths = ['Abr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Ago 2026', 'Sep 2026']

  const pointsData: TradingDataPoint[] =
    data && data.length >= 2
      ? data
      : defaultMonths.map((m) => ({ label: m, value: 0, count: 0 }))

  // Dimensiones del lienzo SVG
  const width = 720
  const height = 270
  const padLeft = 65
  const padRight = 50
  const padTop = 30
  const padBottom = 45

  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom
  const baseY = padTop + chartH

  // Valor máximo para la escala del eje Y
  const rawMax = Math.max(...pointsData.map((d) => Number(d.value) || 0), 0)
  // Si no hay valores registrados aún, usamos 1000 como escala de referencia
  const maxVal = rawMax > 0 ? (rawMax < 100 ? 100 : rawMax) : 1000

  // 4 niveles del eje Y ($0, nivel bajo, nivel medio, nivel alto)
  const yTicks = [
    { val: 0, y: baseY, label: '$0' },
    {
      val: Math.round(maxVal * 0.27),
      y: baseY - chartH * 0.27,
      label: `$${Math.round(maxVal * 0.27).toLocaleString('es-EC')}`,
    },
    {
      val: Math.round(maxVal * 0.54),
      y: baseY - chartH * 0.54,
      label: `$${Math.round(maxVal * 0.54).toLocaleString('es-EC')}`,
    },
    {
      val: Math.round(maxVal),
      y: padTop,
      label: `$${Math.round(maxVal).toLocaleString('es-EC')}`,
    },
  ]

  // Mapear cada punto a sus coordenadas (x, y) en el SVG
  const coords = pointsData.map((d, i) => {
    const x = padLeft + (i / (pointsData.length - 1)) * chartW
    const normalizedVal = Math.max(0, Math.min(d.value, maxVal))
    const y = baseY - (normalizedVal / maxVal) * chartH
    return { x, y, point: d }
  })

  // Generador de curva Spline cúbica monótona suave (evita rebotes por debajo de cero)
  const buildMonotonePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`

    const n = pts.length
    const dx: number[] = []
    const dy: number[] = []
    const slopes: number[] = []

    for (let i = 0; i < n - 1; i++) {
      dx.push(pts[i + 1].x - pts[i].x)
      dy.push(pts[i + 1].y - pts[i].y)
      slopes.push(dy[i] / (dx[i] || 1))
    }

    const m: number[] = [slopes[0]]
    for (let i = 1; i < n - 1; i++) {
      if (slopes[i - 1] * slopes[i] <= 0) {
        m.push(0)
      } else {
        m.push((slopes[i - 1] + slopes[i]) / 2)
      }
    }
    m.push(slopes[n - 2])

    // Condición de monotonicidad de Fritsch-Carlson
    for (let i = 0; i < n - 1; i++) {
      if (dy[i] === 0) {
        m[i] = 0
        m[i + 1] = 0
      } else {
        const alpha = m[i] / slopes[i]
        const beta = m[i + 1] / slopes[i]
        if (alpha < 0) m[i] = 0
        if (beta < 0) m[i + 1] = 0
        const dist = alpha * alpha + beta * beta
        if (dist > 9) {
          const tau = 3 / Math.sqrt(dist)
          m[i] = tau * alpha * slopes[i]
          m[i + 1] = tau * beta * slopes[i]
        }
      }
    }

    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    for (let i = 0; i < n - 1; i++) {
      const cp1x = pts[i].x + dx[i] / 3
      const cp1y = Math.min(baseY, pts[i].y + (m[i] * dx[i]) / 3)
      const cp2x = pts[i + 1].x - dx[i] / 3
      const cp2y = Math.min(baseY, pts[i + 1].y - (m[i + 1] * dx[i]) / 3)
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`
    }
    return path
  }

  const linePath = buildMonotonePath(coords)
  const lastCoord = coords[coords.length - 1]

  // Área sombreada verde bajo la curva
  const areaPath = `
    ${linePath}
    L ${lastCoord.x} ${baseY}
    L ${coords[0].x} ${baseY}
    Z
  `

  const activeCoord = hoveredIdx !== null ? coords[hoveredIdx] : null

  return (
    <div className="flex flex-col h-full select-none bg-white">
      {/* ── Encabezado idéntico al diseño de referencia ── */}
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-400 font-normal mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Leyenda interactiva Ingresos con punto verde */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-400/40"></span>
          <span className="text-xs font-semibold text-slate-600">Ingresos</span>
        </div>
      </div>

      {/* ── Gráfico SVG interactivo con animación y tooltips ── */}
      <div className="relative w-full flex-1 px-4 pb-4 pt-1 min-h-[260px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradiente verde esmeralda suave */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="65%" stopColor="#10b981" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Animación del trazado dibujándose */}
            <style>{`
              @keyframes drawEvolPath {
                0% {
                  stroke-dashoffset: 2000;
                }
                100% {
                  stroke-dashoffset: 0;
                }
              }
              @keyframes fadeInEvolArea {
                0% {
                  opacity: 0;
                }
                100% {
                  opacity: 1;
                }
              }
              .evol-draw-line {
                stroke-dasharray: 2000;
                stroke-dashoffset: 2000;
                animation: drawEvolPath 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              .evol-fade-area {
                opacity: 0;
                animation: fadeInEvolArea 1.4s ease-in 0.3s forwards;
              }
            `}</style>
          </defs>

          {/* Líneas horizontales punteadas del Eje Y */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              {/* Etiqueta de valor monetario a la izquierda */}
              <text
                x={padLeft - 10}
                y={t.y + 4}
                textAnchor="end"
                className="text-[11px] font-medium fill-slate-400"
              >
                {t.label}
              </text>

              {/* Línea horizontal de rejilla */}
              <line
                x1={padLeft}
                y1={t.y}
                x2={width - padRight}
                y2={t.y}
                stroke={t.val === 0 ? '#cbd5e1' : '#e2e8f0'}
                strokeDasharray={t.val === 0 ? undefined : '3 3'}
                strokeWidth={t.val === 0 ? '1.2' : '1'}
              />
            </g>
          ))}

          {/* Línea vertical del eje Y */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={baseY}
            stroke="#94a3b8"
            strokeWidth="1.2"
          />

          {/* Área verde sombreada bajo la curva */}
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
            className="evol-fade-area"
          />

          {/* Línea de la curva verde de ingresos */}
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="evol-draw-line"
          />

          {/* Línea vertical guía al hacer hover */}
          {activeCoord && (
            <line
              x1={activeCoord.x}
              y1={padTop}
              x2={activeCoord.x}
              y2={baseY}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Puntos y zonas de detección de cursor para cada mes */}
          {coords.map((c, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Zona sensible amplia para hover fácil */}
              <rect
                x={c.x - chartW / (coords.length * 2)}
                y={padTop}
                width={chartW / coords.length}
                height={chartH + padBottom}
                fill="transparent"
              />

              {/* Punto en el eje base cuando el valor es 0 */}
              {c.point.value === 0 && (
                <circle
                  cx={c.x}
                  cy={baseY}
                  r="2.5"
                  fill="#94a3b8"
                />
              )}

              {/* Punto circular en la curva */}
              <circle
                cx={c.x}
                cy={c.y}
                r={hoveredIdx === i ? '6.5' : '4.5'}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth={hoveredIdx === i ? '2.5' : '2'}
                className="transition-all duration-150 shadow-sm"
              />

              {/* Etiqueta del mes en el eje X */}
              <text
                x={c.x}
                y={baseY + 22}
                textAnchor="middle"
                className={`text-[11px] transition-colors ${
                  hoveredIdx === i
                    ? 'font-bold fill-emerald-700'
                    : 'font-medium fill-slate-500'
                }`}
              >
                {c.point.label}
              </text>
            </g>
          ))}
        </svg>

        {/* ── Tooltip flotante interactivo al pasar el mouse ── */}
        {activeCoord && (() => {
          const xPercent = (activeCoord.x / width) * 100
          const yPercent = (activeCoord.y / height) * 100
          const isRightEdge = xPercent > 70
          const isLeftEdge = xPercent < 30
          const isNearTop = yPercent < 28

          // Desplazamiento inteligente para que jamás se corte en bordes derecho, izquierdo o superior
          const translateX = isRightEdge ? '-88%' : isLeftEdge ? '-12%' : '-50%'
          const translateY = isNearTop ? '14px' : 'calc(-100% - 10px)'

          return (
            <div
              className="absolute z-30 pointer-events-none"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: `translate(${translateX}, ${translateY})`,
              }}
            >
              <div className="bg-slate-900/95 text-white px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-xs text-center whitespace-nowrap min-w-[125px] animate-fade-in">
                <p className="text-[11px] font-medium text-slate-300">
                  {activeCoord.point.label}
                </p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  ${activeCoord.point.value.toLocaleString('es-EC', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {activeCoord.point.count !== undefined && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {activeCoord.point.count} {activeCoord.point.count === 1 ? 'cobro registrado' : 'cobros registrados'}
                  </p>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
