import React from 'react'

interface ClassroomLogoProps {
  className?: string
  size?: number
}

/**
 * Logotipo representativo de un aula de clases (Classroom / Aula)
 * Incluye la pizarra escolar con contenido didáctico, soporte estructural
 * y el pupitre / escritorio de estudio al frente.
 */
export function ClassroomLogo({ className = 'w-5 h-5 text-white', size = 20 }: ClassroomLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Pizarra principal del aula */}
      <rect x="2" y="3" width="20" height="11" rx="2" />
      {/* Texto / fórmulas en la pizarra */}
      <line x1="6" y1="7" x2="10" y2="7" />
      <line x1="6" y1="10" x2="9" y2="10" />
      <polyline points="13 10 15 7 18 10" />
      {/* Marco y soporte de la pizarra */}
      <line x1="5" y1="14" x2="5" y2="21" />
      <line x1="19" y1="14" x2="19" y2="21" />
      {/* Pupitre escolar en primer plano del aula */}
      <line x1="9" y1="17" x2="15" y2="17" />
      <line x1="10" y1="17" x2="10" y2="21" />
      <line x1="14" y1="17" x2="14" y2="21" />
    </svg>
  )
}
