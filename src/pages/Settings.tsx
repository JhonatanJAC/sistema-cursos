import React, { useState, useRef, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Image as ImageIcon,
  Shield,
  ShieldCheck,
  Upload,
  RotateCcw,
  KeyRound,
  User,
  UserPlus,
  Users,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Trash2,
  Info,
  Database,
  Download,
  UploadCloud,
  FileJson,
  History,
  RefreshCw,
  AlertTriangle,
  PenTool,
  Hash,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { useSettingsStore, type AppUser } from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import { ClassroomLogo } from '../components/ui/ClassroomLogo'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Modal } from '../components/ui/Modal'
import { backupsAPI, systemAPI } from '../services/api'
import type { BackupHistoryItem, BackupData } from '../types'

type SettingsTab = 'general' | 'users' | 'receipts' | 'security' | 'backups'

export function SettingsPage() {
  const {
    hasUser,
    users,
    currentUser,
    savedUsername,
    customLogo,
    systemName,
    receiptSignature,
    receiptCounter,
    receiptSecretary,
    setCredentials,
    changePassword,
    changeUsername,
    removeCredentials,
    addUser,
    updateUser,
    deleteUser,
    setCustomLogo,
    setSystemName,
    resetSystemName,
    setReceiptSignature,
    setReceiptCounter,
    setReceiptSecretary,
    resetReceiptSecretary,
  } = useSettingsStore()

  const { showSuccess, showError, showInfo } = useUIStore()

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // Form state for system name
  const [nameInput, setNameInput] = useState(systemName || 'Sistema Educativo')
  const [isSavingName, setIsSavingName] = useState(false)

  // Sync nameInput if systemName changes
  useEffect(() => {
    if (systemName) {
      setNameInput(systemName)
    }
  }, [systemName])

  // Form states for credentials (create mode)
  const [usernameInput, setUsernameInput] = useState(savedUsername || '')
  const [passwordInput, setPasswordInput] = useState('')
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSavingCreds, setIsSavingCreds] = useState(false)

  // Sync usernameInput when savedUsername changes
  useEffect(() => {
    if (savedUsername) {
      setUsernameInput(savedUsername)
    }
  }, [savedUsername])

  // Form states for password change (update mode)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)

  // Remove credentials modal
  const [showRemoveCredsModal, setShowRemoveCredsModal] = useState(false)

  // Reset logo modal
  const [showResetLogoModal, setShowResetLogoModal] = useState(false)

  // File input ref for logo
  const logoInputRef = useRef<HTMLInputElement>(null)

  // File input ref for signature
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const [showResetSignatureModal, setShowResetSignatureModal] = useState(false)
  const [counterInput, setCounterInput] = useState(String(receiptCounter ?? 0))
  const [isSavingCounter, setIsSavingCounter] = useState(false)

  const [secretaryInput, setSecretaryInput] = useState(currentUser?.name || receiptSecretary || 'Secretaria Rocio Lamilla')
  const [isSavingSecretary, setIsSavingSecretary] = useState(false)

  // Sync counterInput when receiptCounter updates
  useEffect(() => {
    if (receiptCounter !== undefined) {
      setCounterInput(String(receiptCounter))
    }
  }, [receiptCounter])

  // Sync secretaryInput when currentUser or receiptSecretary updates
  useEffect(() => {
    if (currentUser?.name) {
      setSecretaryInput(currentUser.name)
    } else if (receiptSecretary) {
      setSecretaryInput(receiptSecretary)
    }
  }, [currentUser, receiptSecretary])

  // User Management Modal (Add/Edit)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'Secretaria',
  })
  const [showUserPassword, setShowUserPassword] = useState(false)
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null)

  const handleOpenAddUser = () => {
    setEditingUser(null)
    setUserFormData({
      username: '',
      password: '',
      name: '',
      role: 'Secretaria',
    })
    setShowUserPassword(false)
    setIsUserModalOpen(true)
  }

  const handleOpenEditUser = (u: AppUser) => {
    setEditingUser(u)
    setUserFormData({
      username: u.username,
      password: u.password,
      name: u.name || '',
      role: u.role || 'Secretaria',
    })
    setShowUserPassword(false)
    setIsUserModalOpen(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUsername = userFormData.username.trim()
    const cleanPassword = userFormData.password.trim()
    const cleanName = userFormData.name.trim() || cleanUsername

    if (!cleanUsername || !cleanPassword) {
      showError('Campos requeridos', 'Debes ingresar un usuario y contraseña.')
      return
    }

    const duplicate = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername.toLowerCase() &&
        (!editingUser || u.id !== editingUser.id)
    )
    if (duplicate) {
      showError('Usuario existente', `Ya existe un usuario con el nombre "${cleanUsername}".`)
      return
    }

    try {
      setIsSavingUser(true)
      if (editingUser) {
        await updateUser(editingUser.id, {
          username: cleanUsername,
          password: cleanPassword,
          name: cleanName,
          role: editingUser.role || 'Secretaria',
        })
        showSuccess('Usuario actualizado', `Los datos de "${cleanUsername}" se guardaron exitosamente.`)
      } else {
        await addUser({
          username: cleanUsername,
          password: cleanPassword,
          name: cleanName,
          role: userFormData.role,
        })
        showSuccess('Usuario creado', `La cuenta de "${cleanUsername}" ha sido creada exitosamente.`)
      }
      setIsUserModalOpen(false)
    } catch {
      showError('Error', 'No se pudo guardar la información del usuario.')
    } finally {
      setIsSavingUser(false)
    }
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return
    try {
      await deleteUser(userToDelete.id)
      showSuccess('Usuario eliminado', `Se eliminó el usuario "${userToDelete.username}".`)
      setUserToDelete(null)
    } catch {
      showError('Error', 'No se pudo eliminar el usuario.')
    }
  }

  // File input ref for backup import
  const backupInputRef = useRef<HTMLInputElement>(null)

  // Backups states
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Pending import data to confirm
  const [pendingImportData, setPendingImportData] = useState<{
    data: BackupData
    filename: string
  } | null>(null)

  // Factory reset modal state
  const [showResetDbModal, setShowResetDbModal] = useState(false)
  const [isResettingDb, setIsResettingDb] = useState(false)

  const handleResetDatabase = async () => {
    setIsResettingDb(true)
    try {
      const res = await systemAPI.resetDatabase()
      if (res.success) {
        showSuccess('Base de datos restablecida', 'Se han eliminado todos los datos de prueba. El sistema ha quedado en ceros.')
        setShowResetDbModal(false)
        setTimeout(() => {
          window.location.reload()
        }, 1200)
      } else {
        showError('Error', res.error || 'No se pudo restablecer la base de datos')
      }
    } catch (e: any) {
      showError('Error', e?.message || 'Error al restablecer')
    } finally {
      setIsResettingDb(false)
    }
  }

  // Load backup history on mount
  const loadBackupHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const history = await backupsAPI.getHistory()
      setBackupHistory(history || [])
    } catch (err) {
      console.error('Error loading backup history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'backups') {
      loadBackupHistory()
    }
  }, [activeTab])

  // Handle System Name Save
  const handleSaveSystemName = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = nameInput.trim()
    if (!clean) {
      showError('Nombre requerido', 'Ingresa un nombre para el sistema.')
      return
    }
    setIsSavingName(true)
    try {
      await setSystemName(clean)
      showSuccess('Nombre actualizado', `El nombre del sistema ahora es "${clean}".`)
    } catch {
      showError('Error', 'No se pudo guardar el nombre del sistema.')
    } finally {
      setIsSavingName(false)
    }
  }

  const handleResetSystemName = async () => {
    try {
      await resetSystemName()
      setNameInput('Sistema Educativo')
      showInfo('Nombre restablecido', 'Se ha restablecido el nombre a "Sistema Educativo".')
    } catch {
      showError('Error', 'No se pudo restablecer el nombre.')
    }
  }

  // Handle Logo Upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('Formato inválido', 'Por favor selecciona un archivo de imagen (PNG, JPG, SVG, WebP).')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showError('Imagen muy pesada', 'La imagen seleccionada no debe superar los 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string
        await setCustomLogo(base64)
        showSuccess('Ícono actualizado', 'El logotipo del sidebar y del sistema se ha actualizado con éxito.')
      } catch (err) {
        console.error(err)
        showError('Error', 'No se pudo guardar la nueva imagen.')
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Logo Reset
  const handleResetLogo = async () => {
    setShowResetLogoModal(false)
    try {
      await setCustomLogo(null)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
      showInfo('Ícono restablecido', 'Se ha restablecido el ícono original del sistema.')
    } catch (err) {
      console.error(err)
      showError('Error', 'No se pudo restablecer el ícono.')
    }
  }

  // Handle Signature Upload
  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('Formato no válido', 'Por favor selecciona un archivo de imagen (PNG, JPG, SVG, WebP).')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showError('Imagen muy pesada', 'La imagen de la firma no debe superar los 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result as string
        await setReceiptSignature(base64)
        showSuccess('Firma actualizada', 'La firma autorizada ha sido guardada y aparecerá en todos los recibos.')
      } catch (err) {
        console.error(err)
        showError('Error', 'No se pudo guardar la firma.')
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Signature Reset
  const handleResetSignature = async () => {
    setShowResetSignatureModal(false)
    try {
      await setReceiptSignature(null)
      if (signatureInputRef.current) {
        signatureInputRef.current.value = ''
      }
      showInfo('Firma restablecida', 'Se ha restablecido la firma por defecto del sistema.')
    } catch (err) {
      console.error(err)
      showError('Error', 'No se pudo restablecer la firma.')
    }
  }

  // Handle Save Counter
  const handleSaveCounter = async () => {
    setIsSavingCounter(true)
    try {
      const val = parseInt(counterInput, 10)
      const safeVal = isNaN(val) || val < 0 ? 0 : val
      await setReceiptCounter(safeVal)
      setCounterInput(String(safeVal))
      showSuccess(
        'Numeración guardada',
        `El contador de recibos se ha establecido en ${String(safeVal).padStart(20, '0')}.`
      )
    } catch {
      showError('Error', 'No se pudo guardar el número de recibo.')
    } finally {
      setIsSavingCounter(false)
    }
  }

  // Handle Reset Counter to 0
  const handleResetCounter = async () => {
    setIsSavingCounter(true)
    try {
      await setReceiptCounter(0)
      setCounterInput('0')
      showSuccess('Contador reiniciado', 'El número de recibo empezará desde 00000000000000000000.')
    } catch {
      showError('Error', 'No se pudo reiniciar el contador.')
    } finally {
      setIsSavingCounter(false)
    }
  }

  // Handle Save Secretary (Personal por cuenta/rol)
  const handleSaveSecretary = async () => {
    const clean = secretaryInput.trim()
    if (!clean) {
      showError('Campo requerido', 'Ingresa el nombre o cargo de la secretaria / responsable.')
      return
    }
    setIsSavingSecretary(true)
    try {
      await setReceiptSecretary(clean)
      showSuccess(
        'Nombre guardado para tu cuenta',
        `El nombre para tus recibos se ha guardado como "${clean}". Es exclusivo de la cuenta "${currentUser?.username || 'activa'}" y no afecta a otras usuarias.`
      )
    } catch {
      showError('Error', 'No se pudo guardar el nombre de la secretaria.')
    } finally {
      setIsSavingSecretary(false)
    }
  }

  // Handle Reset Secretary
  const handleResetSecretary = async () => {
    setIsSavingSecretary(true)
    try {
      await resetReceiptSecretary()
      const defaultName = currentUser?.role === 'Administrador' ? 'Administrador' : `Secretaria ${currentUser?.username || 'Rocio Lamilla'}`
      setSecretaryInput(defaultName)
      showSuccess('Restablecido', `Se ha restablecido el nombre para tu cuenta a "${defaultName}".`)
    } catch {
      showError('Error', 'No se pudo restablecer el nombre.')
    } finally {
      setIsSavingSecretary(false)
    }
  }

  // Handle Save Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUser = usernameInput.trim()
    const cleanPass = passwordInput.trim()

    if (!cleanUser) {
      showError('Campo requerido', 'Ingresa un nombre de usuario.')
      return
    }

    if (!cleanPass) {
      showError('Campo requerido', 'Ingresa una contraseña.')
      return
    }

    if (cleanPass !== confirmPasswordInput.trim()) {
      showError('Contraseñas no coinciden', 'Verifica que la confirmación sea igual a la contraseña.')
      return
    }

    setIsSavingCreds(true)
    try {
      await setCredentials(cleanUser, cleanPass)
      setPasswordInput('')
      setConfirmPasswordInput('')
      showSuccess(
        'Seguridad actualizada',
        `El usuario "${cleanUser}" y su contraseña se han configurado correctamente.`
      )
    } catch (err) {
      console.error(err)
      showError('Error', 'No se pudieron guardar las credenciales.')
    } finally {
      setIsSavingCreds(false)
    }
  }

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPass = newPassword.trim()
    const cleanConfirm = confirmNewPassword.trim()

    if (!cleanPass) {
      showError('Campo requerido', 'Ingresa la nueva contraseña.')
      return
    }

    if (cleanPass !== cleanConfirm) {
      showError('Contraseñas no coinciden', 'La confirmación no coincide con la nueva contraseña.')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(cleanPass)
      setNewPassword('')
      setConfirmNewPassword('')
      showSuccess('Contraseña cambiada', 'Tu nueva contraseña ha sido guardada correctamente.')
    } catch {
      showError('Error', 'No se pudo actualizar la contraseña.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle Update Username
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUser = usernameInput.trim()
    if (!cleanUser) {
      showError('Campo requerido', 'Ingresa un nombre de usuario.')
      return
    }
    setIsUpdatingUser(true)
    try {
      await changeUsername(cleanUser)
      showSuccess('Usuario actualizado', `El nombre de usuario se cambió a "${cleanUser}".`)
    } catch {
      showError('Error', 'No se pudo actualizar el nombre de usuario.')
    } finally {
      setIsUpdatingUser(false)
    }
  }

  // Handle Remove Credentials
  const handleRemoveCredentials = async () => {
    setShowRemoveCredsModal(false)
    try {
      await removeCredentials()
      setUsernameInput('')
      setPasswordInput('')
      setConfirmPasswordInput('')
      showSuccess(
        'Acceso libre activado',
        'Se eliminó el usuario y contraseña. Ahora solo se requerirá presionar "Ingresar".'
      )
    } catch (err) {
      console.error(err)
      showError('Error', 'No se pudo desactivar la seguridad.')
    }
  }

  // Handle Export Backup
  const handleExportBackup = async () => {
    setIsExporting(true)
    try {
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const defaultFilename = `backup_sistema_educativo_${dateStr}.json`

      // Obtener datos exportados
      const backupData = await backupsAPI.export(defaultFilename)
      const jsonStr = JSON.stringify(backupData, null, 2)

      // Guardar a archivo
      const saveResult = await backupsAPI.saveToFile(defaultFilename, jsonStr)
      if (!saveResult.canceled) {
        showSuccess('Copia generada', `Copia de seguridad guardada exitosamente (${saveResult.filename || defaultFilename}).`)
        await loadBackupHistory()
      }
    } catch (err) {
      console.error(err)
      showError('Error al exportar', 'Ocurrió un inconveniente al generar la copia de seguridad.')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle Import File Selection
  const handleSelectImportFile = async () => {
    // Try native dialog first
    try {
      const fileRes = await backupsAPI.loadFromFile()
      if (!fileRes.canceled && fileRes.content) {
        processBackupContent(fileRes.content, fileRes.filename || 'archivo_backup.json')
        return
      }
    } catch {
      // fallback to input
    }
    backupInputRef.current?.click()
  }

  const handleBackupFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        processBackupContent(text, file.name)
      } catch (err) {
        console.error(err)
        showError('Archivo inválido', 'No se pudo leer el archivo seleccionado.')
      }
    }
    reader.readAsText(file)
    if (backupInputRef.current) {
      backupInputRef.current.value = ''
    }
  }

  const processBackupContent = (jsonContent: string, filename: string) => {
    try {
      const parsed = JSON.parse(jsonContent)
      if (!parsed || !parsed.data) {
        showError('Formato inválido', 'El archivo no contiene un respaldo válido de la aplicación.')
        return
      }
      setPendingImportData({ data: parsed, filename })
    } catch {
      showError('Error JSON', 'El archivo seleccionado no contiene un formato JSON válido.')
    }
  }

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!pendingImportData) return
    setIsImporting(true)
    try {
      const result = await backupsAPI.import(pendingImportData.data, pendingImportData.filename)
      if (result.success) {
        showSuccess('Restauración completada', 'La base de datos fue actualizada con la información del respaldo.')
        setPendingImportData(null)
        await loadBackupHistory()
      }
    } catch (err) {
      console.error(err)
      showError('Error al importar', 'Ocurrió un problema al restaurar los datos.')
    } finally {
      setIsImporting(false)
    }
  }

  const formatCounts = (detallesStr: string) => {
    try {
      const parsed = JSON.parse(detallesStr)
      const parts = []
      if (parsed.students !== undefined) parts.push(`${parsed.students} Estudiantes`)
      if (parsed.teachers !== undefined) parts.push(`${parsed.teachers} Docentes`)
      if (parsed.courses !== undefined) parts.push(`${parsed.courses} Cursos`)
      if (parsed.enrollments !== undefined) parts.push(`${parsed.enrollments} Inscripciones`)
      return parts.join(' · ') || 'Copia general'
    } catch {
      return detallesStr || 'Datos exportados'
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Configuración del Sistema</h1>
            <p className="text-sm text-slate-500">
              Personaliza el logotipo visual, administra la seguridad y gestiona copias de seguridad
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('general')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer
              ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }
            `}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Nombre & Logotipo</span>
          </button>

          {(!currentUser || currentUser.role === 'Administrador') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer
                ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              <Users className="w-4 h-4" />
              <span>Usuarios & Secretarias</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('receipts')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer
              ${
                activeTab === 'receipts'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }
            `}
          >
            <FileText className="w-4 h-4" />
            <span>Recibos & Firma</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer
              ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }
            `}
          >
            <Shield className="w-4 h-4" />
            <span>Contraseña & Acceso</span>
          </button>

          {(!currentUser || currentUser.role === 'Administrador') && (
            <button
              onClick={() => setActiveTab('backups')}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer
                ${
                  activeTab === 'backups'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              <Database className="w-4 h-4" />
              <span>Backups & Respaldo JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: IDENTIDAD (LOGOTIPO Y NOMBRE) ================= */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full animate-fade-in">
          {/* Card 1: Nombre del Sistema e Identidad */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Nombre del Sistema</h2>
                  <p className="text-xs text-slate-500">
                    Personaliza el título que aparece en la barra lateral y en el inicio
                  </p>
                </div>
              </div>

              {/* Vista Previa en tiempo real */}
              <div className="mt-6">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Vista previa en la barra lateral
                </span>
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-4 flex items-center gap-4">
                  {customLogo ? (
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1">
                      <img src={customLogo} alt="Logo actual" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                      <ClassroomLogo className="w-6 h-6 text-white" size={24} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">
                      {nameInput.trim() || systemName || 'Sistema Educativo'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {customLogo ? 'Logotipo personalizado activo' : 'Ícono predeterminado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario para cambiar el nombre */}
              <form onSubmit={handleSaveSystemName} className="mt-6 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Modificar Nombre
                  </label>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Ej. Sistema Educativo"
                      maxLength={40}
                      required
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/40 focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isSavingName || nameInput.trim() === systemName}
                      className="px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/25 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {isSavingName ? 'Guardando...' : 'Guardar Nombre'}
                    </button>
                  </div>
                </div>

                {systemName !== 'Sistema Educativo' && (
                  <button
                    type="button"
                    onClick={handleResetSystemName}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer nombre predeterminado ("Sistema Educativo")</span>
                  </button>
                )}
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                El nombre se actualizará en tiempo real en la barra lateral y en la pantalla de bienvenida.
              </span>
            </div>
          </div>

          {/* Card 2: Logotipo e Ícono */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Ícono y Logotipo del Sidebar</h2>
                  <p className="text-xs text-slate-500">
                    Sube una imagen personalizada para el icono de la institución
                  </p>
                </div>
              </div>

              {/* Vista del Logo */}
              <div className="mt-6">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Ícono actualmente activo
                </span>
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center">
                  {customLogo ? (
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden p-2 mb-3">
                      <img src={customLogo} alt="Logo actual" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
                      <ClassroomLogo className="w-10 h-10 text-white" size={40} />
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-700">
                    {customLogo ? 'Logotipo Personalizado' : 'Ícono Predeterminado del Sistema'}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    {customLogo ? 'Imagen guardada en la base de datos' : 'Aula escolar estándar'}
                  </span>
                </div>
              </div>

              {/* Acciones de Carga */}
              <div className="mt-6 space-y-3">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50/80 active:scale-[0.99] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>{customLogo ? 'Cambiar imagen del ícono' : 'Subir imagen para el ícono'}</span>
                </button>

                {customLogo && (
                  <button
                    type="button"
                    onClick={() => setShowResetLogoModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:scale-[0.99] font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer ícono original</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                Formatos soportados: PNG, JPG, SVG o WebP. Se recomienda una imagen cuadrada y nítida.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: GESTIÓN DE USUARIOS Y SECRETARIAS ================= */}
      {activeTab === 'users' && (
        <div className="space-y-6 w-full animate-fade-in">
          {/* Banner explicativo de Roles y Cuentas */}
          <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    Control de Usuarios: Administrador y Secretarias
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                    Roles del Sistema
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  El sistema cuenta con el rol de <b>Administrador</b> (gestión total de datos, respaldos y usuarios) y permite crear cuentas con el rol de <b>Secretaria</b> para el personal de ventanilla.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2 bg-white/80 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    <span><b>Rol Administrador:</b> Control total de configuración y usuarios.</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span><b>Rol Secretaria:</b> Registra pagos y emite recibos a su nombre.</span>
                  </div>
                </div>
                <p className="text-[11px] text-blue-900 font-semibold pt-0.5">
                  ✓ Ambas secretarias operan sobre la <b>misma computadora y base de datos</b>. La numeración contable consecutiva de recibos (20 dígitos) se comparte automáticamente en esta máquina y no se duplica.
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de Usuarios / Secretarias */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">Cuentas Registradas</h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                      {users.length} {users.length === 1 ? 'cuenta' : 'cuentas'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Cuentas de Administrador y Secretarias registradas en el sistema
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddUser}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-sm shadow-blue-500/25 text-xs cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nueva Secretaria / Usuario</span>
              </button>
            </div>

            {users.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600">No hay usuarios registrados</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  El sistema se encuentra en modo acceso libre. Crea una cuenta de Administrador o Secretaria para controlar el ingreso y el nombre responsable de los recibos.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear primera secretaria</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <table className="w-full min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-left uppercase tracking-wider font-extrabold text-[11px]">
                      <th className="px-4 py-3">Usuario (Login)</th>
                      <th className="px-4 py-3">Nombre en el Recibo</th>
                      <th className="px-3 py-3 text-center">Rol</th>
                      <th className="px-3 py-3 text-center">Estado Sesión</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isCurrent = currentUser?.id === u.id || (currentUser === null && users[0]?.id === u.id)
                      const isAdmin = u.role === 'Administrador'
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                                  isAdmin
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-xs">{u.username}</p>
                                <p className="text-[10px] text-slate-400 font-mono">••••••••</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800 text-xs">
                              {u.name || u.username}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                                isAdmin
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {u.role || 'Secretaria'}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-center">
                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                <span>{isAdmin ? 'En línea' : 'Conectada'}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Editar datos, rol y contraseña"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: CONTRASEÑA Y ACCESO DE SEGURIDAD ================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full animate-fade-in">
          {/* Card 1: Cambiar Contraseña del Usuario Actual */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Cambiar Contraseña</h2>
                  <p className="text-xs text-slate-500">
                    Actualiza la clave de acceso de tu cuenta activa
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/40 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repetir nueva contraseña"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/40 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !newPassword}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                Para gestionar o crear otras cuentas de secretarias o administradores, visita la pestaña "Usuarios & Secretarias".
              </span>
            </div>
          </div>

          {/* Card 2: Control de Protección de Acceso */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Seguridad Obligatoria del Sistema</h2>
                  <p className="text-xs text-slate-500">
                    Control de autenticación y autoría de recibos
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-900">
                      Autenticación Obligatoria Activa
                    </h3>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      El sistema siempre solicita usuario y contraseña para garantizar que cada recibo y pago emitido quede asociado de manera fidedigna a su responsable.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Datos de la Sesión Actual:</span>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60 text-slate-600">
                    <span>Usuario:</span>
                    <span className="font-mono font-bold text-slate-800">{currentUser?.username || 'admin'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60 text-slate-600">
                    <span>Rol Asignado:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${currentUser?.role === 'Administrador' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {currentUser?.role || 'Administrador'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-slate-600">
                    <span>Nombre en Recibos:</span>
                    <span className="font-semibold text-slate-800">{currentUser?.name || 'Administrador'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                Credenciales maestras por defecto: <b>admin / 123456</b> (puedes cambiar tu contraseña en el formulario de la izquierda).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BACKUPS (COPIAS DE SEGURIDAD) ================= */}
      {activeTab === 'backups' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tarjetas de Exportar e Importar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exportar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Exportar Información (JSON)</h3>
                    <p className="text-xs text-slate-500">
                      Descarga una copia completa de todos los módulos
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-slate-50 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-700">El respaldo incluye:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>Estudiantes registrados y fichas personales</li>
                    <li>Docentes y especialidades</li>
                    <li>Cursos y cupos de matriculación</li>
                    <li>Inscripciones realizadas</li>
                    <li>Configuraciones del sistema y logotipo</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generando respaldo...' : 'Exportar Copia de Seguridad'}</span>
                </button>
              </div>
            </div>

            {/* Importar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Importar / Restaurar (JSON)</h3>
                    <p className="text-xs text-slate-500">
                      Carga un archivo de respaldo previamente exportado
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Aviso de restauración</span>
                  </div>
                  <p className="text-amber-800/90 leading-relaxed">
                    Al importar un respaldo, los registros existentes se sincronizarán y actualizarán con los datos contenidos en el archivo JSON.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <input
                  ref={backupInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleBackupFileInputChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleSelectImportFile}
                  disabled={isImporting}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/80 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  <FileJson className="w-4 h-4" />
                  <span>Seleccionar Archivo JSON para Restaurar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Historial / Registro de Backups */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-slate-500" />
                <h3 className="text-base font-bold text-slate-800">Registro de Copias de Seguridad</h3>
              </div>
              <button
                type="button"
                onClick={loadBackupHistory}
                disabled={isLoadingHistory}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 p-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Actualizar registro</span>
              </button>
            </div>

            {backupHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Database className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No hay registros de copias de seguridad aún</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Genera una exportación o importa un archivo JSON para comenzar
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {backupHistory.map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 ${
                          item.tipo === 'export'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {item.tipo === 'export' ? (
                          <>
                            <Download className="w-3 h-3" />
                            <span>Exportación</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3" />
                            <span>Importación</span>
                          </>
                        )}
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.filename || 'Copia de seguridad'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCounts(item.detalles)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 font-medium">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Card: Restablecer Base de Datos a Cero (Modo Fábrica) */}
          {(!currentUser || currentUser?.role === 'Administrador') && (
            <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-950">Restablecer Sistema a Cero (Modo Fábrica)</h4>
                  <p className="text-xs text-red-800/80 mt-1 max-w-xl leading-relaxed">
                    Elimina completamente todos los alumnos, profesores, cursos, matrículas y pagos registrados. Conserva únicamente la cuenta de Administrador con usuario <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-red-900">admin</code> y contraseña <code className="bg-red-100 px-1 py-0.5 rounded font-mono text-red-900">123456</code>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetDbModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all shadow-sm shadow-red-500/20 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Restablecer a Cero</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: RECIBOS & FIRMA ================= */}
      {activeTab === 'receipts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full animate-fade-in">
          {/* Card 1: Firma Autorizada de Recibos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Firma Autorizada de Recibos</h2>
                  <p className="text-xs text-slate-500">
                    Sube la firma digitalizada que se imprimirá en todos los recibos de pago
                  </p>
                </div>
              </div>

              {/* Vista previa de la firma */}
              <div className="mt-6">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Vista previa en el recibo
                </span>

                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center min-h-[140px] text-center">
                  <div className="h-14 flex items-center justify-center mb-1">
                    {receiptSignature ? (
                      <img
                        src={receiptSignature}
                        alt="Firma Autorizada"
                        className="max-h-14 w-auto max-w-[220px] object-contain"
                      />
                    ) : (
                      <svg
                        className="w-40 h-12"
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
                  <div className="border-t border-slate-700 pt-1.5 w-56 mx-auto">
                    <span className="block font-bold text-xs text-slate-800 leading-snug">
                      Firma autorizada
                    </span>
                    <span className="block text-[11px] text-slate-500 leading-none">
                      Coordinación Académica
                    </span>
                  </div>

                  <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                    {receiptSignature ? 'Firma personalizada cargada' : 'Firma oficial por defecto'}
                  </span>
                </div>
              </div>

              {/* Input file oculto */}
              <input
                type="file"
                ref={signatureInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleSignatureChange}
              />
            </div>

            {/* Acciones */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              {receiptSignature && (
                <button
                  type="button"
                  onClick={() => setShowResetSignatureModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer por defecto</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => signatureInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{receiptSignature ? 'Cambiar Firma' : 'Subir Imagen de Firma'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Numeración Consecutiva de Recibos (20 Dígitos) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Numeración de Recibos</h2>
                  <p className="text-xs text-slate-500">
                    Configuración del número de recibo consecutivo de 20 caracteres
                  </p>
                </div>
              </div>

              {/* Explicación y Vista Previa */}
              <div className="mt-6 space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Formato de Recibo No. (20 caracteres)
                  </span>
                  <div className="p-3.5 bg-slate-900 rounded-xl text-center border border-slate-800 shadow-inner">
                    <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 tracking-[0.15em] block overflow-x-auto">
                      {String(counterInput || 0).padStart(20, '0')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Los números de recibo se formatean automáticamente con ceros a la izquierda para garantizar una numeración contable uniforme de 20 caracteres.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Contador Actual / Próximo Número a Emitir:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={counterInput}
                    onChange={(e) => setCounterInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Ingresa 0 para que la secuencia empiece desde <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">00000000000000000000</code>.
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={handleResetCounter}
                disabled={isSavingCounter}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar a 0</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCounter}
                disabled={isSavingCounter}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSavingCounter ? 'Guardando...' : 'Guardar Número'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Secretaria / Responsable de Emisión (Individual por Rol / Cuenta) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between col-span-1 lg:col-span-2">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800">Secretaria / Responsable de Emisión</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                        Individual por Cuenta
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Configura el nombre o cargo que figurará en el recuadro de "Observaciones" de los recibos de pago
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-right self-start sm:self-auto">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Cuenta Conectada</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {currentUser?.username || 'activa'} ({currentUser?.role || 'Secretaria'})
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nombre o Cargo en los Recibos (para {currentUser?.username || 'esta cuenta'}):
                  </label>
                  <input
                    type="text"
                    value={secretaryInput}
                    onChange={(e) => setSecretaryInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    placeholder="Ej. Secretaria Rocio Lamilla o Secretaria Carmen Ortiz"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1.5 leading-relaxed">
                    Puedes colocar el título y nombre que prefieras (ej. <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">Secretaria Rocio Lamilla</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">SECRETARIA HELO</code>, etc.).
                  </span>
                  <div className="mt-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>🔒</span>
                      <span>Configuración individual (NO se comparte):</span>
                    </p>
                    <p className="text-slate-600">
                      Este nombre es <b>exclusivo de tu cuenta actual</b> (<b className="text-slate-800">{currentUser?.username || 'activa'}</b>). Si otra persona inicia sesión con su propia cuenta de secretaria, sus recibos se emitirán con su propio nombre asignado de forma totalmente independiente.
                    </p>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Vista previa en el recibo de pago
                  </span>
                  <div className="bg-[#f0f6ff] border border-[#d6e5fb] rounded-xl p-3.5 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg border border-sky-300 flex items-center justify-center text-[#0b2b5c] shrink-0 mt-0.5 bg-white">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-xs text-slate-900 leading-none mb-1">
                          Observaciones
                        </span>
                        <p className="text-xs text-slate-700 font-medium leading-snug">
                          Recibido: <span className="font-bold text-slate-900">{secretaryInput || currentUser?.name || 'Secretaria'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    ✓ La numeración consecutiva contable de 20 dígitos sigue compartida en esta computadora para no duplicar folios.
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={handleResetSecretary}
                disabled={isSavingSecretary}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer por defecto</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSecretary}
                disabled={isSavingSecretary}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSavingSecretary ? 'Guardando...' : 'Guardar para esta cuenta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Secretaria o Usuario */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? `Editar Cuenta - ${editingUser.username}` : 'Nueva Secretaria / Usuario'}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de Usuario (para Iniciar Sesión) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                placeholder="Ej. rocio, carmen"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre o Cargo para el Recibo de Pago *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="Ej. Secretaria Rocio Lamilla o Secretaria Carmen Ortiz"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Este nombre figurará en el recuadro de observaciones como responsable cuando esta persona inicie sesión.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showUserPassword ? 'text' : 'password'}
                  required
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowUserPassword(!showUserPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rol del Usuario *
              </label>
              {editingUser ? (
                <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{editingUser.role || 'Secretaria'}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Rol fijo (no modificable)</span>
                </div>
              ) : (
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="Secretaria">Secretaria (Ventanilla y Recibos)</option>
                  <option value="Administrador">Administrador (Acceso y Gestión Total)</option>
                </select>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
            {userFormData.role === 'Administrador' ? (
              <p>
                <b className="text-purple-700">Rol Administrador:</b> Acceso total a todas las secciones del sistema, copias de seguridad y administración de usuarios/secretarias.
              </p>
            ) : (
              <p>
                <b className="text-emerald-700">Rol Secretaria:</b> Registra alumnos, matrículas, cursos y pagos. Cada recibo emitido llevará automáticamente su nombre en el campo responsable.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingUser}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSavingUser ? 'Guardando...' : editingUser ? 'Guardar Cambios' : 'Crear Cuenta'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal to Delete User */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Eliminar Cuenta de Usuario"
        description={`¿Estás seguro de que deseas eliminar la cuenta de "${userToDelete?.username}" (${userToDelete?.name})?`}
        confirmLabel="Eliminar usuario"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Confirmation Modal to Reset Logo */}
      <ConfirmModal
        isOpen={showResetLogoModal}
        onClose={() => setShowResetLogoModal(false)}
        onConfirm={handleResetLogo}
        title="Restablecer ícono"
        description="¿Deseas volver a utilizar el ícono predeterminado del sistema educativo?"
        confirmLabel="Restablecer"
        cancelLabel="Cancelar"
      />

      {/* Confirmation Modal to Reset Signature */}
      <ConfirmModal
        isOpen={showResetSignatureModal}
        onClose={() => setShowResetSignatureModal(false)}
        onConfirm={handleResetSignature}
        title="Restablecer firma autorizada"
        description="¿Deseas volver a utilizar la firma por defecto del sistema educativo?"
        confirmLabel="Restablecer"
        cancelLabel="Cancelar"
      />

      {/* Confirmation Modal to Remove Password */}
      <ConfirmModal
        isOpen={showRemoveCredsModal}
        onClose={() => setShowRemoveCredsModal(false)}
        onConfirm={handleRemoveCredentials}
        title="Quitar contraseña de acceso"
        description="¿Estás seguro de que deseas eliminar los usuarios y contraseñas? La pantalla de inicio mostrará únicamente el botón de ingresar directo."
        confirmLabel="Quitar contraseñas"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Confirmation Modal for JSON Import */}
      {pendingImportData && (
        <ConfirmModal
          isOpen={Boolean(pendingImportData)}
          onClose={() => setPendingImportData(null)}
          onConfirm={handleConfirmImport}
          title="Confirmar restauración de datos"
          description={`¿Deseas restaurar la información desde "${pendingImportData.filename}"? Se importarán: ${
            pendingImportData.data.counts
              ? `${pendingImportData.data.counts.students} estudiantes, ${pendingImportData.data.counts.teachers} docentes, ${pendingImportData.data.counts.courses} cursos, ${pendingImportData.data.counts.enrollments} inscripciones.`
              : 'todos los registros contenidos en el archivo.'
          }`}
          confirmLabel={isImporting ? 'Restaurando...' : 'Restaurar Base de Datos'}
          cancelLabel="Cancelar"
        />
      )}

      {/* Confirmation Modal to Reset Database to Zero (Modo Fábrica) */}
      <ConfirmModal
        isOpen={showResetDbModal}
        onClose={() => setShowResetDbModal(false)}
        onConfirm={handleResetDatabase}
        title="¿Restablecer sistema a cero (Modo Fábrica)?"
        description="Esta acción es irreversible. Se eliminarán permanentemente todos los alumnos, profesores, cursos, pagos e inscripciones. El sistema quedará completamente limpio con únicamente el usuario Administrador (admin / 123456)."
        confirmLabel={isResettingDb ? 'Restableciendo...' : 'Sí, borrar todo y restablecer'}
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default SettingsPage
