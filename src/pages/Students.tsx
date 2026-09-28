import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Eye,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { DataTable, Column } from '../components/ui/DataTable'
import { SearchInput } from '../components/ui/SearchInput'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Badge, getEstadoBadgeVariant, getEstadoLabel } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { studentsAPI, enrollmentsAPI } from '../services/api'
import { useUIStore } from '../store/useUIStore'
import { formatDate } from '../utils/formatters'
import type { Student, CreateStudentDto, Enrollment } from '../types'

const today = () => new Date().toISOString().split('T')[0]

type FormValues = CreateStudentDto

export default function StudentsPage() {
  const { showSuccess, showError, setCurrentPage } = useUIStore()

  // Data states
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Form modal states (create / edit)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState(false)

  // View modal state & student courses
  const [viewTarget, setViewTarget] = useState<Student | null>(null)
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)

  // Form hook
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      estado: 'activo',
      fecha_registro: today(),
    },
  })

  // ─── Load students ────────────────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true)
      const data = await studentsAPI.findAllWithCourse()
      setStudents(data)
      setFiltered(data)
    } catch (err) {
      showError('Error al cargar estudiantes', String(err))
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // ─── Search filter ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(students)
      return
    }
    const q = searchQuery.toLowerCase()
    setFiltered(
      students.filter(
        (s) =>
          `${s.nombres} ${s.apellidos}`.toLowerCase().includes(q) ||
          s.identificacion.toLowerCase().includes(q) ||
          (s.ciudad ?? '').toLowerCase().includes(q) ||
          (s.telefono ?? '').toLowerCase().includes(q) ||
          (s.correo ?? '').toLowerCase().includes(q) ||
          (s.curso ?? '').toLowerCase().includes(q),
      ),
    )
  }, [searchQuery, students])

  // ─── Open create modal ────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingStudent(null)
    reset({
      nombres: '',
      apellidos: '',
      identificacion: '',
      fecha_nacimiento: '',
      genero: '',
      telefono: '',
      correo: '',
      direccion: '',
      ciudad: '',
      representante: '',
      telefono_representante: '',
      parentesco: '',
      correo_representante: '',
      estado: 'activo',
      fecha_registro: today(),
    })
    setIsFormOpen(true)
  }

  // ─── Open edit modal ──────────────────────────────────────────────────────────
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student)
    const fields: (keyof FormValues)[] = [
      'nombres',
      'apellidos',
      'identificacion',
      'fecha_nacimiento',
      'genero',
      'telefono',
      'correo',
      'direccion',
      'ciudad',
      'representante',
      'telefono_representante',
      'parentesco',
      'correo_representante',
      'estado',
      'fecha_registro',
    ]
    fields.forEach((f) => {
      const val = student[f as keyof Student]
      setValue(f, (val as string) ?? '')
    })
    setIsFormOpen(true)
  }

  // ─── Submit form (Create / Update) ────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true)
      const payload: FormValues = {
        ...values,
        estado: values.estado || editingStudent?.estado || 'activo',
        fecha_registro: values.fecha_registro || editingStudent?.fecha_registro || today(),
      }
      if (editingStudent) {
        await studentsAPI.update(editingStudent.id, payload)
        showSuccess('Estudiante actualizado', `${values.nombres} ${values.apellidos} fue actualizado con éxito.`)
      } else {
        await studentsAPI.create(payload)
        showSuccess('Estudiante registrado', `${values.nombres} ${values.apellidos} fue registrado con éxito.`)
      }
      setIsFormOpen(false)
      setEditingStudent(null)
      await loadStudents()
    } catch (err) {
      showError(
        editingStudent ? 'Error al actualizar estudiante' : 'Error al registrar estudiante',
        String(err),
      )
    } finally {
      setSaving(false)
    }
  }

  // ─── Open view modal (and load student courses) ────────────────────────────────
  const handleOpenView = async (student: Student) => {
    setViewTarget(student)
    setLoadingEnrollments(true)
    try {
      const enrollments = await enrollmentsAPI.findByStudent(student.id)
      setStudentEnrollments(enrollments)
    } catch (err) {
      console.error('Error al cargar cursos del estudiante:', err)
      setStudentEnrollments([])
    } finally {
      setLoadingEnrollments(false)
    }
  }

  // ─── Delete student ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await studentsAPI.delete(deleteTarget.id)
      showSuccess('Estudiante eliminado', `El estudiante ${deleteTarget.nombres} ${deleteTarget.apellidos} ha sido eliminado.`)
      setDeleteTarget(null)
      await loadStudents()
    } catch (err) {
      showError('Error al eliminar estudiante', String(err))
    } finally {
      setDeleting(false)
    }
  }

  // ─── Table Columns ────────────────────────────────────────────────────────────
  const columns: Column<Student>[] = [
    {
      key: 'nombres',
      header: 'Estudiante',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
            {row.nombres.charAt(0).toUpperCase()}
            {row.apellidos.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">
              {row.nombres} {row.apellidos}
            </p>
            {row.correo ? (
              <p className="text-xs text-slate-400 truncate">{row.correo}</p>
            ) : (
              <p className="text-xs text-slate-400 font-mono truncate">C.I. {row.identificacion}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'identificacion',
      header: 'Identificación',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-700">
          {row.identificacion}
        </span>
      ),
    },
    {
      key: 'ciudad',
      header: 'Ciudad',
      sortable: true,
      render: (row) => <span className="text-sm text-slate-600">{row.ciudad || '—'}</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (row) => <span className="text-sm text-slate-600">{row.telefono || '—'}</span>,
    },
    {
      key: 'curso',
      header: 'Curso actual',
      render: (row) =>
        row.curso ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[140px]">{row.curso}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Sin inscripción</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      render: (row) => (
        <Badge variant={getEstadoBadgeVariant(row.estado)} dot>
          {getEstadoLabel(row.estado)}
        </Badge>
      ),
    },
    {
      key: 'fecha_registro',
      header: 'Fecha de registro',
      sortable: true,
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.fecha_registro)}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Encabezado Principal ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Estudiantes</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                Administración, consulta y registro de estudiantes del sistema
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Registrar nuevo estudiante
          </Button>
        </div>
      </div>

      {/* ── Sección de la Lista de Estudiantes ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra superior de la tabla */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Lista de estudiantes
            </h2>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {filtered.length}
            </span>
          </div>
          <div className="w-full sm:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por nombre, cédula, curso, ciudad..."
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="p-6">
          {!loading && students.length === 0 ? (
            <EmptyState
              icon={<Users className="w-10 h-10 text-slate-400" />}
              title="No hay estudiantes registrados"
              description="Comienza registrando al primer estudiante usando el botón superior."
              action={
                <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={handleOpenCreate}>
                  Registrar estudiante
                </Button>
              }
            />
          ) : (
            <DataTable<Student>
              data={filtered}
              columns={columns}
              loading={loading}
              emptyMessage="No se encontraron estudiantes que coincidan con la búsqueda."
              pageSize={10}
              actions={(row) => (
                <div className="flex items-center gap-1">
                  {/* Ver */}
                  <button
                    type="button"
                    onClick={() => handleOpenView(row)}
                    title="Ver detalle del estudiante y cursos inscritos"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(row)}
                    title="Editar estudiante"
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    title="Eliminar estudiante"
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            />
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: REGISTRAR / EDITAR ESTUDIANTE
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingStudent ? 'Editar estudiante' : 'Registrar nuevo estudiante'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bloque 1: Información Personal */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Información Personal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombres"
                placeholder="Ej. Juan Carlos"
                error={errors.nombres?.message}
                {...register('nombres', { required: 'Los nombres son requeridos' })}
              />
              <Input
                label="Apellidos"
                placeholder="Ej. Pérez López"
                error={errors.apellidos?.message}
                {...register('apellidos', { required: 'Los apellidos son requeridos' })}
              />
              <Input
                label="Identificación / Cédula"
                placeholder="Ej. 1712345678"
                error={errors.identificacion?.message}
                {...register('identificacion', { required: 'La identificación es requerida' })}
              />
              <Select label="Género" {...register('genero')}>
                <option value="">Seleccionar género...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </Select>
              <Input
                label="Teléfono"
                placeholder="Ej. 0998765432"
                {...register('telefono')}
              />
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="Ej. estudiante@correo.com"
                error={errors.correo?.message}
                {...register('correo', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Correo electrónico inválido',
                  },
                })}
              />
              <Input
                label="Ciudad"
                placeholder="Ej. Quito"
                {...register('ciudad')}
              />
              <Input
                label="Dirección"
                placeholder="Ej. Av. Amazonas y República"
                {...register('direccion')}
              />
            </div>
          </div>

          {/* Bloque 2: Información del Representante */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Información de Contacto / Representante
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre del representante"
                placeholder="Ej. Carmen López"
                {...register('representante')}
              />
              <Select label="Parentesco" {...register('parentesco')}>
                <option value="">Seleccionar parentesco...</option>
                <option value="madre">Madre</option>
                <option value="padre">Padre</option>
                <option value="tutor">Tutor / Representante legal</option>
                <option value="hermano">Hermano/a</option>
                <option value="abuelo">Abuelo/a</option>
                <option value="otro">Otro</option>
              </Select>
              <Input
                label="Teléfono representante"
                placeholder="Ej. 0987654321"
                {...register('telefono_representante')}
              />
              <Input
                label="Correo representante"
                type="email"
                placeholder="Ej. representante@correo.com"
                {...register('correo_representante')}
              />
            </div>
          </div>

          {/* Bloque 3: Fecha de Inscripción */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Fecha de Inscripción
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Fecha de inscripción"
                type="date"
                hint="Fecha en la que el estudiante formaliza su registro"
                {...register('fecha_registro')}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              icon={<Save className="w-4 h-4" />}
            >
              {editingStudent ? 'Guardar cambios' : 'Registrar estudiante'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: VER DETALLE DEL ESTUDIANTE Y CURSOS INSCRITOS
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Ficha del Estudiante"
        size="lg"
      >
        {viewTarget && (
          <div className="space-y-6">
            {/* Cabecera del perfil */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-slate-50 rounded-2xl border border-blue-100">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/25 shrink-0">
                {viewTarget.nombres.charAt(0).toUpperCase()}
                {viewTarget.apellidos.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {viewTarget.nombres} {viewTarget.apellidos}
                  </h3>
                  <Badge variant={getEstadoBadgeVariant(viewTarget.estado)} dot>
                    {getEstadoLabel(viewTarget.estado)}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Cédula / Identificación: <span className="text-slate-700 font-semibold">{viewTarget.identificacion}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fecha de registro en sistema: {formatDate(viewTarget.fecha_registro)}
                </p>
              </div>
            </div>

            {/* ── SECCIÓN DESTACADA: CURSO(S) EN LOS QUE ESTÁ INSCRITO ── */}
            <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Cursos en los que está inscrito
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {studentEnrollments.length} {studentEnrollments.length === 1 ? 'matrícula' : 'matrículas'}
                </span>
              </div>

              {loadingEnrollments ? (
                <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm">Consultando cursos matriculados...</span>
                </div>
              ) : studentEnrollments.length > 0 ? (
                <div className="space-y-3">
                  {studentEnrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {enr.curso_nombre}
                          </span>
                          {enr.curso_codigo && (
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                              {enr.curso_codigo}
                            </span>
                          )}
                          <Badge variant={getEstadoBadgeVariant(enr.estado)}>
                            {enr.estado.charAt(0).toUpperCase() + enr.estado.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          {enr.docente && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                              Docente: <strong className="text-slate-700">{enr.docente}</strong>
                            </span>
                          )}
                          {enr.curso_horario && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {enr.curso_horario}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Inscrito: {formatDate(enr.fecha_inscripcion)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-5 rounded-xl border border-dashed border-slate-300 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    El estudiante no está inscrito en ningún curso actualmente
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-3">
                    Puedes formalizar su matrícula desde el módulo de inscripciones en 3 sencillos pasos.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setViewTarget(null)
                      setCurrentPage('enrollments')
                    }}
                  >
                    Ir a Inscribir Estudiante
                  </Button>
                </div>
              )}
            </div>

            {/* Datos Personales y de Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Información de contacto */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Datos de contacto
                </p>
                <dl className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Teléfono:</dt>
                    <dd className="font-semibold text-slate-800">{viewTarget.telefono || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Correo:</dt>
                    <dd className="font-semibold text-slate-800">{viewTarget.correo || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Ciudad:</dt>
                    <dd className="font-semibold text-slate-800">{viewTarget.ciudad || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Dirección:</dt>
                    <dd className="font-semibold text-slate-800 truncate max-w-[180px]">{viewTarget.direccion || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Género:</dt>
                    <dd className="font-semibold text-slate-800 capitalize">{viewTarget.genero || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Fecha nacimiento:</dt>
                    <dd className="font-semibold text-slate-800">{formatDate(viewTarget.fecha_nacimiento)}</dd>
                  </div>
                </dl>
              </div>

              {/* Información del representante */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Representante o tutor
                </p>
                {viewTarget.representante ? (
                  <dl className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Nombre:</dt>
                      <dd className="font-semibold text-slate-800">{viewTarget.representante}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Parentesco:</dt>
                      <dd className="font-semibold text-slate-800 capitalize">{viewTarget.parentesco || '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Teléfono:</dt>
                      <dd className="font-semibold text-slate-800">{viewTarget.telefono_representante || '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Correo:</dt>
                      <dd className="font-semibold text-slate-800">{viewTarget.correo_representante || '—'}</dd>
                    </div>
                  </dl>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    Sin representante registrado
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                icon={<Pencil className="w-3.5 h-3.5" />}
                onClick={() => {
                  const student = viewTarget
                  setViewTarget(null)
                  handleOpenEdit(student)
                }}
              >
                Editar este estudiante
              </Button>
              <Button variant="primary" size="sm" onClick={() => setViewTarget(null)}>
                Cerrar ficha
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          CONFIRMAR ELIMINACIÓN
      ═══════════════════════════════════════════════════════════════════ */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar estudiante"
        message={
          deleteTarget
            ? `¿Estás seguro de que deseas eliminar permanentemente al estudiante ${deleteTarget.nombres} ${deleteTarget.apellidos} (${deleteTarget.identificacion})? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
