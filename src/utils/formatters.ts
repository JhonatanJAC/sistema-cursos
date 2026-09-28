/**
 * Utilidades de formateo para la aplicación
 */

/**
 * Formatea una fecha ISO a formato local español
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Formatea fecha y hora
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalize(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Formatea un nombre completo
 */
export function fullName(nombres: string, apellidos: string): string {
  return `${capitalize(nombres)} ${capitalize(apellidos)}`
}

/**
 * Obtiene las iniciales de un nombre
 */
export function getInitials(nombres: string, apellidos: string): string {
  const n = nombres.trim().charAt(0).toUpperCase()
  const a = apellidos.trim().charAt(0).toUpperCase()
  return `${n}${a}`
}

/**
 * Formatea número con separadores de miles
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('es-ES')
}

/**
 * Trunca un string largo
 */
export function truncate(str: string, maxLength: number = 30): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}
