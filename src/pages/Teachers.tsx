import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { GraduationCap, Pencil, Trash2, BookOpen, Save, X, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { DataTable, Column } from '../components/ui/DataTable'
import { SearchInput } from '../components/ui/SearchInput'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Badge, getEstadoBadgeVariant, getEstadoLabel } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { teachersAPI } from '../services/api'
import { useUIStore } from '../store/useUIStore'
import type { Teacher, Course, CreateTeacherDto } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type FormValues = {
  nombres: string
  apellidos: string
  identificacion: string
  telefono: string
  correo: string
  especialidad: string
  direccion: string
  estado: 'activo' | 'inactivo'
}

// ---------------------------------------------------------------------------
// Teachers Page
// ---------------------------------------------------------------------------
const Teachers: React.FC = () => {
  // ── store ──────────────────────────────────────────────────────────────
  const { addToast } = useUIStore()

  // ── state ──────────────────────────────────────────────────────────────
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // form
  const [showForm, setShowForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [saving, setSaving] = useState(false)

  // delete confirm
  const [confirmDelete, setConfirmDelete] = useState<Teacher | null>(null)
  const [deleting, setDeleting] = useState(false)

  // courses modal
  const [coursesModal, setCoursesModal] = useState<Teacher | null>(null)
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  // ── form ───────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nombres: '',
      apellidos: '',
      identificacion: '',
      telefono: '',
      correo: '',
      especialidad: '',
      direccion: '',
      estado: 'activo',
    },
  })

  // ── fetch teachers ─────────────────────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await teachersAPI.findAllWithCourses()
      setTeachers(data)
      setFilteredTeachers(data)
    } catch (err) {
      console.error(err)
      addToast({ type: 'error', message: 'Error al cargar los docentes.' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  // ── search filter ──────────────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) {
      setFilteredTeachers(teachers)
      return
    }
    setFilteredTeachers(
      teachers.filter(
        (t) =>
          `${t.nombres} ${t.apellidos}`.toLowerCase().includes(q) ||
          t.identificacion?.toLowerCase().includes(q) ||
          t.especialidad?.toLowerCase().includes(q) ||
          t.correo?.toLowerCase().includes(q),
      ),
    )
  }, [searchQuery, teachers])

  // ── open form ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingTeacher(null)
    reset({
      nombres: '',
      apellidos: '',
      identificacion: '',
      telefono: '',
      correo: '',
      especialidad: '',
      direccion: '',
      estado: 'activo',
    })
    setShowForm(true)
  }

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    reset({
      nombres: teacher.nombres ?? '',
      apellidos: teacher.apellidos ?? '',
      identificacion: teacher.identificacion ?? '',
      telefono: teacher.telefono ?? '',
      correo: teacher.correo ?? '',
      especialidad: teacher.especialidad ?? '',
      direccion: teacher.direccion ?? '',
      estado: (teacher.estado as 'activo' | 'inactivo') ?? 'activo',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingTeacher(null)
    reset()
  }

  // ── submit ─────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true)
      const payload: CreateTeacherDto = {
        nombres: values.nombres,
        apellidos: values.apellidos,
        identificacion: values.identificacion,
        telefono: values.telefono || undefined,
        correo: values.correo || undefined,
        especialidad: values.especialidad || undefined,
        direccion: values.direccion || undefined,
        estado: values.estado,
      }

      if (editingTeacher) {
        await teachersAPI.update(editingTeacher.id, payload)
        addToast({ type: 'success', message: 'Docente actualizado correctamente.' })
      } else {
        await teachersAPI.create(payload)
        addToast({ type: 'success', message: 'Docente registrado correctamente.' })
      }

      closeForm()
      fetchTeachers()
    } catch (err: any) {
      console.error(err)
      addToast({
        type: 'error',
        message: err?.response?.data?.message ?? 'Error al guardar el docente.',
      })
    } finally {
      setSaving(false)
    }
  }

  // ── delete ─────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      await teachersAPI.delete(confirmDelete.id)
      addToast({ type: 'success', message: 'Docente eliminado correctamente.' })
      setConfirmDelete(null)
      fetchTeachers()
    } catch (err: any) {
      console.error(err)
      addToast({
        type: 'error',
        message: err?.response?.data?.message ?? 'Error al eliminar el docente.',
      })
    } finally {
      setDeleting(false)
    }
  }

  // ── courses modal ──────────────────────────────────────────────────────
  const openCoursesModal = async (teacher: Teacher) => {
    setCoursesModal(teacher)
    setTeacherCourses([])
    setLoadingCourses(true)
    try {
      const data = await teachersAPI.getCoursesForTeacher(teacher.id)
      setTeacherCourses(data)
    } catch (err) {
      console.error(err)
      addToast({ type: 'error', message: 'Error al cargar los cursos del docente.' })
    } finally {
      setLoadingCourses(false)
    }
  }

  const closeCoursesModal = () => {
    setCoursesModal(null)
    setTeacherCourses([])
  }

  // ── table columns ──────────────────────────────────────────────────────
  const columns: Column<Teacher>[] = [
    {
      key: 'nombre_completo',
      header: 'Nombre completo',
      render: (t) => (
        <span className="font-medium text-slate-800">
          {t.nombres} {t.apellidos}
        </span>
      ),
    },
    {
      key: 'identificacion',
      header: 'Identificación',
      render: (t) => <span className="text-slate-600">{t.identificacion ?? '—'}</span>,
    },
    {
      key: 'especialidad',
      header: 'Especialidad',
      render: (t) => <span className="text-slate-600">{t.especialidad ?? '—'}</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (t) => <span className="text-slate-600">{t.telefono ?? '—'}</span>,
    },
    {
      key: 'correo',
      header: 'Correo',
      render: (t) => (
        <span className="text-slate-600 text-sm">{t.correo ?? '—'}</span>
      ),
    },
    {
      key: 'cursos',
      header: 'Cursos asignados',
      render: (t) => (
        <button
          onClick={() => openCoursesModal(t)}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          title="Ver cursos"
        >
          <BookOpen size={14} />
          {t.total_cursos !== undefined ? `${t.total_cursos} curso${t.total_cursos !== 1 ? 's' : ''}` : 'Ver cursos'}
        </button>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (t) => (
        <Badge variant={getEstadoBadgeVariant(t.estado ?? 'activo')}>
          {getEstadoLabel(t.estado ?? 'activo')}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (t) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openCoursesModal(t)}
            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Ver cursos"
          >
            <BookOpen size={16} />
          </button>
          <button
            onClick={() => openEdit(t)}
            className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(t)}
            className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  // ── courses table columns ──────────────────────────────────────────────
  const courseColumns: Column<Course>[] = [
    {
      key: 'nombre',
      header: 'Curso',
      render: (c) => <span className="font-medium text-slate-800">{c.nombre}</span>,
    },
    {
      key: 'codigo',
      header: 'Código',
      render: (c) => <span className="text-slate-600 text-sm">{c.codigo ?? '—'}</span>,
    },
    {
      key: 'nivel',
      header: 'Nivel / Modalidad',
      render: (c) => (
        <span className="text-slate-600 text-sm">
          {[c.nivel, c.modalidad].filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => (
        <Badge variant={getEstadoBadgeVariant(c.estado ?? 'activo')}>
          {getEstadoLabel(c.estado ?? 'activo')}
        </Badge>
      ),
    },
  ]

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Encabezado Principal ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Docentes</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                Administración, consulta y registro de docentes del sistema
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={openCreate}
          >
            Registrar nuevo docente
          </Button>
        </div>
      </div>

      {/* ── Sección de la Lista de Docentes ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra superior de la tabla */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Lista de docentes
            </h2>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {filteredTeachers.length}
            </span>
          </div>

          <div className="w-full sm:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por nombre, identificación, especialidad…"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="p-6">
          <DataTable<Teacher>
            columns={columns}
            data={filteredTeachers}
            loading={loading}
            emptyState={
              <EmptyState
                icon={<GraduationCap size={40} className="text-slate-300" />}
                title="No hay docentes registrados"
                description={
                  searchQuery
                    ? 'No se encontraron docentes con esa búsqueda.'
                    : 'Registra el primer docente haciendo clic en el botón superior.'
                }
                action={
                  !searchQuery ? (
                    <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
                      Registrar docente
                    </Button>
                  ) : undefined
                }
              />
            }
          />
        </div>
      </section>

      {/* ── Form Modal ────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingTeacher ? 'Editar docente' : 'Registrar docente'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nombres / Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombres
              </label>
              <Input
                {...register('nombres', { required: 'Los nombres son requeridos.' })}
                placeholder="Ej. Juan Carlos"
                error={errors.nombres?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Apellidos
              </label>
              <Input
                {...register('apellidos', { required: 'Los apellidos son requeridos.' })}
                placeholder="Ej. Pérez López"
                error={errors.apellidos?.message}
              />
            </div>
          </div>

          {/* Identificación */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Identificación
            </label>
            <Input
              {...register('identificacion', { required: 'La identificación es requerida.' })}
              placeholder="Ej. 1234567890"
              error={errors.identificacion?.message}
            />
          </div>

          {/* Teléfono / Correo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <Input
                {...register('telefono')}
                placeholder="Ej. 0991234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <Input
                {...register('correo', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Ingresa un correo válido.',
                  },
                })}
                type="email"
                placeholder="Ej. juan@correo.com"
                error={errors.correo?.message}
              />
            </div>
          </div>

          {/* Especialidad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Especialidad</label>
            <Input
              {...register('especialidad')}
              placeholder="Ej. Matemáticas, Inglés, Programación…"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <Input
              {...register('direccion')}
              placeholder="Ej. Av. Principal 123, Ciudad"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <Select {...register('estado')}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} disabled={saving}>
              <Save size={16} className="mr-1" />
              {editingTeacher ? 'Guardar cambios' : 'Registrar docente'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Courses Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!coursesModal}
        onClose={closeCoursesModal}
        title={
          coursesModal
            ? `Cursos de ${coursesModal.nombres} ${coursesModal.apellidos}`
            : 'Cursos del docente'
        }
        size="xl"
      >
        {loadingCourses ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : teacherCourses.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={36} className="text-slate-300" />}
            title="Sin cursos asignados"
            description="Este docente no tiene cursos asignados actualmente."
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-500 mb-3">
              {teacherCourses.length} curso{teacherCourses.length !== 1 ? 's' : ''} asignado{teacherCourses.length !== 1 ? 's' : ''}
            </p>
            <DataTable<Course>
              columns={courseColumns}
              data={teacherCourses}
              loading={false}
            />
          </div>
        )}
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <Button variant="outline" onClick={closeCoursesModal}>
            Cerrar
          </Button>
        </div>
      </Modal>

      {/* ── Confirm Delete ────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Eliminar docente"
        description={
          confirmDelete
            ? `¿Estás seguro de que deseas eliminar a ${confirmDelete.nombres} ${confirmDelete.apellidos}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
    </div>
  )
}

export default Teachers
