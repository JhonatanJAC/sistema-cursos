import React from 'react'

export interface PieChartItem {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  title?: string
  subtitle?: string
  data: PieChartItem[]
  centerLabel?: string
}

export function PieChart({ title, subtitle, data, centerLabel = 'Total' }: PieChartProps) {
  const total = data.reduce((acc, curr) => acc + (curr.value > 0 ? curr.value : 0), 0)
  const radius = 46
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius

  let accumulatedPercent = 0

  return (
    <div className="flex flex-col h-full">
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      )}

      {/* Donut Chart Visual */}
      <div className="flex-1 flex flex-col items-center justify-center py-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox="0 0 120 120"
          >
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {total > 0 &&
              data.map((item, index) => {
                if (item.value <= 0) return null
                const percent = (item.value / total) * 100
                const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference)
                accumulatedPercent += percent

                return (
                  <circle
                    key={index}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700 ease-in-out hover:opacity-80"
                  />
                )
              })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
              {total}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {centerLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        {data.map((item) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <div
              key={item.label}
              className="p-2 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between gap-1.5"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 truncate text-[11px] font-medium" title={item.label}>
                  {item.label}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-slate-800">{item.value}</span>
                <span className="text-[10px] text-slate-400 ml-1">({percent}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
