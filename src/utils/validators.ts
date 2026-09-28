/**
 * Validadores reutilizables para formularios
 */

export const validators = {
  required: (msg = 'Este campo es requerido') => ({
    required: msg,
  }),

  email: {
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Ingresa un correo electrónico válido',
    },
  },

  phone: {
    pattern: {
      value: /^[\d\s\+\-\(\)]{7,15}$/,
      message: 'Ingresa un número de teléfono válido',
    },
  },

  minLength: (min: number) => ({
    minLength: {
      value: min,
      message: `Debe tener al menos ${min} caracteres`,
    },
  }),

  maxLength: (max: number) => ({
    maxLength: {
      value: max,
      message: `No puede superar ${max} caracteres`,
    },
  }),

  positiveNumber: {
    min: {
      value: 1,
      message: 'Debe ser un número mayor a 0',
    },
  },
}

/**
 * Valida formato de fecha YYYY-MM-DD
 */
export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

/**
 * Verifica si una fecha de inicio es anterior a la de fin
 */
export function isStartBeforeEnd(start?: string, end?: string): boolean {
  if (!start || !end) return true
  return new Date(start) <= new Date(end)
}
