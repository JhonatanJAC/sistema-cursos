import { getDatabase, saveDatabase } from '../database'
import { queryAll, queryOne, execute, now, today } from '../database/helpers'

export interface Payment {
  id: number
  fecha: string
  tipo_pago: string
  banco_remitente: string
  banco_beneficiario: string
  student_id?: number
  apellidos_nombres: string
  horario?: string
  valor: number
  concepto?: string
  comprobante?: string
  secretaria?: string
  created_at: string
  updated_at: string
}

export type CreatePaymentDto = {
  fecha?: string
  tipo_pago: string
  banco_remitente: string
  banco_beneficiario: string
  student_id?: number
  apellidos_nombres: string
  horario?: string
  valor: number
  concepto?: string
  comprobante?: string
  secretaria?: string
}

export type UpdatePaymentDto = Partial<CreatePaymentDto>

export const paymentService = {
  findAll(filters?: { search?: string; banco?: string; tipo_pago?: string }): Payment[] {
    const db = getDatabase()
    let sql = 'SELECT * FROM payments WHERE 1=1'
    const params: unknown[] = []

    if (filters?.search) {
      const q = `%${filters.search}%`
      sql += ' AND (apellidos_nombres LIKE ? OR horario LIKE ? OR concepto LIKE ? OR banco_remitente LIKE ? OR banco_beneficiario LIKE ?)'
      params.push(q, q, q, q, q)
    }

    if (filters?.banco) {
      sql += ' AND (banco_remitente = ? OR banco_beneficiario = ?)'
      params.push(filters.banco, filters.banco)
    }

    if (filters?.tipo_pago) {
      sql += ' AND tipo_pago = ?'
      params.push(filters.tipo_pago)
    }

    sql += ' ORDER BY fecha DESC, id DESC'
    return queryAll(db, sql, params) as unknown as Payment[]
  },

  findById(id: number): Payment | undefined {
    const db = getDatabase()
    return queryOne(db, 'SELECT * FROM payments WHERE id = ?', [id]) as unknown as Payment | undefined
  },

  findByStudent(studentId: number): Payment[] {
    const db = getDatabase()
    return queryAll(db, 'SELECT * FROM payments WHERE student_id = ? ORDER BY fecha DESC', [studentId]) as unknown as Payment[]
  },

  create(data: CreatePaymentDto): Payment {
    const db = getDatabase()
    const fecha = data.fecha || today()
    const currentNow = now()

    const { lastInsertRowid } = execute(
      db,
      `INSERT INTO payments (
        fecha, tipo_pago, banco_remitente, banco_beneficiario,
        student_id, apellidos_nombres, horario, valor,
        concepto, comprobante, secretaria, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fecha,
        data.tipo_pago || 'TRANSFERENCIA',
        data.banco_remitente || 'BANCO GUAYAQUIL',
        data.banco_beneficiario || 'BANCO GUAYAQUIL',
        data.student_id ?? null,
        data.apellidos_nombres,
        data.horario ?? null,
        Number(data.valor) || 0,
        data.concepto ?? null,
        data.comprobante ?? null,
        data.secretaria ?? null,
        currentNow,
        currentNow,
      ]
    )

    saveDatabase()
    const created = this.findById(lastInsertRowid)
    if (!created) {
      throw new Error('Error al registrar el pago')
    }
    return created
  },

  update(id: number, data: UpdatePaymentDto): Payment {
    const db = getDatabase()
    const current = this.findById(id)
    if (!current) {
      throw new Error(`Pago con ID ${id} no encontrado`)
    }

    execute(
      db,
      `UPDATE payments SET
        fecha = ?,
        tipo_pago = ?,
        banco_remitente = ?,
        banco_beneficiario = ?,
        student_id = ?,
        apellidos_nombres = ?,
        horario = ?,
        valor = ?,
        concepto = ?,
        comprobante = ?,
        secretaria = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        data.fecha !== undefined ? data.fecha : current.fecha,
        data.tipo_pago !== undefined ? data.tipo_pago : current.tipo_pago,
        data.banco_remitente !== undefined ? data.banco_remitente : current.banco_remitente,
        data.banco_beneficiario !== undefined ? data.banco_beneficiario : current.banco_beneficiario,
        data.student_id !== undefined ? data.student_id : current.student_id ?? null,
        data.apellidos_nombres !== undefined ? data.apellidos_nombres : current.apellidos_nombres,
        data.horario !== undefined ? data.horario : current.horario ?? null,
        data.valor !== undefined ? Number(data.valor) : current.valor,
        data.concepto !== undefined ? data.concepto : current.concepto ?? null,
        data.comprobante !== undefined ? data.comprobante : current.comprobante ?? null,
        data.secretaria !== undefined ? data.secretaria : current.secretaria ?? null,
        now(),
        id,
      ]
    )

    saveDatabase()
    return this.findById(id)!
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const { changes } = execute(db, 'DELETE FROM payments WHERE id = ?', [id])
    if (changes > 0) {
      saveDatabase()
      return true
    }
    return false
  },

  getStats(): { totalRecaudado: number; totalPagos: number; pagosMesActual: number; promedioPago: number } {
    const db = getDatabase()
    const totalRow = queryOne(db, 'SELECT COUNT(*) as count, COALESCE(SUM(valor), 0) as total FROM payments') as { count: number; total: number } | undefined
    
    // Mes actual YYYY-MM
    const currentMonth = today().substring(0, 7)
    const monthRow = queryOne(db, `SELECT COUNT(*) as count, COALESCE(SUM(valor), 0) as total FROM payments WHERE fecha LIKE ?`, [`${currentMonth}%`]) as { count: number; total: number } | undefined

    const count = Number(totalRow?.count || 0)
    const total = Number(totalRow?.total || 0)
    const monthCount = Number(monthRow?.count || 0)
    const avg = count > 0 ? total / count : 0

    return {
      totalRecaudado: total,
      totalPagos: count,
      pagosMesActual: monthCount,
      promedioPago: Math.round(avg * 100) / 100,
    }
  },
}
