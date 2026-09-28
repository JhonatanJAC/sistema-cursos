# Sistema de Gestión Educativa

Aplicación de escritorio para Windows desarrollada con **React + Electron + TypeScript + Vite + Tailwind CSS + SQLite**.

---

## 🚀 Características Principales

1. **Dashboard Principal:**
   - Tarjetas estadísticas con métricas en tiempo real (Total de Estudiantes, Estudiantes Inscritos, Total de Cursos, Cursos Activos, Total de Docentes).
   - Tabla de estudiantes recientemente registrados.
   - Listado de cursos con docente, cupos y porcentaje de ocupación visual.
   - Accesos directos a todos los módulos.

2. **Módulo de Estudiantes:**
   - Registro completo organizado en secciones (Información personal, Información de contacto/representante y Sistema).
   - Validaciones de formulario (identificación única, formato de correo, campos requeridos).
   - Búsqueda en tiempo real por nombre, identificación, ciudad o teléfono.
   - Modos de visualización detallada, edición y eliminación con confirmación.

3. **Módulo de Inscripciones (Wizard en 3 Pasos):**
   - **Paso 1:** Búsqueda y selección interactiva de estudiante con avatar y validación.
   - **Paso 2:** Selección de curso disponible con control de cupos y prevención de duplicados (cursos ya inscritos deshabilitados con badge "Ya inscrito").
   - **Paso 3:** Confirmación con resumen completo del estudiante y curso, fecha y estado.
   - Historial completo de inscripciones con filtros, cambio de estado (activa, finalizada, cancelada) y eliminación.

4. **Gestión de Cursos:**
   - Alta, edición y eliminación de cursos.
   - Asignación dinámica de docentes activos.
   - Control de capacidad máxima y cálculo automático de cupos disponibles.
   - Alternancia entre vista en Tarjetas (Cards con barras de progreso) y vista en Tabla.
   - Filtros por estado (Todos, Activos, Inactivos, Finalizados).

5. **Gestión de Docentes:**
   - Registro y edición de docentes con especialidad y datos de contacto.
   - Modal para visualizar qué cursos tiene asignados cada docente y sus estudiantes inscritos.
   - Control de integridad: prevención de eliminación de docentes con cursos activos asignados.

6. **Diseño y Experiencia de Usuario:**
   - **Sidebar vertical en el lado izquierdo** con navegación fluida y sin recargas.
   - Bordes redondeados modernos, paleta de colores limpia y consistente.
   - Sistema de notificaciones Toast contextuales (éxito, error, advertencia, info).
   - Modales de confirmación antes de eliminar o cambiar estados críticos.
   - 100% autónomo y funcional localmente sin conexión a Internet requerida.

---

## 📁 Estructura del Proyecto

```text
sistema-cursos/
├── electron/
│   ├── database/
│   │   ├── index.ts        # Inicialización de SQLite y persistencia en %APPDATA%
│   │   ├── helpers.ts      # Utilidades de consulta, binds y transacciones
│   │   └── schema.sql      # Definición de tablas, índices y restricciones
│   ├── ipc/                # Handlers IPC seguros para cada entidad
│   │   ├── students.ts
│   │   ├── teachers.ts
│   │   ├── courses.ts
│   │   └── enrollments.ts
│   ├── main/
│   │   └── index.ts        # Proceso principal de Electron, ventana y ciclo de vida
│   ├── preload/
│   │   └── index.ts        # ContextBridge seguro (contextIsolation: true)
│   └── services/           # Lógica de negocio y persistencia SQLite
│       ├── studentService.ts
│       ├── teacherService.ts
│       ├── courseService.ts
│       └── enrollmentService.ts
├── src/
│   ├── components/
│   │   ├── layout/         # Sidebar derecho, Header dinámico y MainLayout
│   │   └── ui/             # Componentes reutilizables (Button, Input, Select, Modal, DataTable, etc.)
│   ├── pages/              # Vistas completas de cada módulo
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── Enrollments.tsx
│   │   ├── Courses.tsx
│   │   └── Teachers.tsx
│   ├── services/
│   │   └── api.ts          # Capa tipada de comunicación con window.electronAPI
│   ├── store/
│   │   └── useUIStore.ts   # Zustand para navegación activa y sistema Toast
│   ├── types/              # Definiciones TypeScript de entidades y contratos
│   └── utils/              # Formateadores y validadores
├── electron-builder.yml    # Configuración de empaquetado para instalador Windows NSIS
├── vite.config.ts
└── package.json
```

---

## 🛠️ Comandos de Ejecución

### Modo Desarrollo
Inicia el servidor Vite y la ventana de Electron en paralelo:
```bash
npm run dev
```

### Compilar y Generar el Instalador Windows (.exe)
Compila el frontend y los procesos de Electron, generando el instalador NSIS en la carpeta `release/`:
```bash
npm run build
```

El instalador generado se ubicará en:
`release/Sistema Gestión Educativa Setup 1.0.0.exe`
