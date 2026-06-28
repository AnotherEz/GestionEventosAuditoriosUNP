# Sistema de Gestión de Eventos y Auditorios — UNP
## Documento de contexto para continuación de sesión

> **Última actualización:** 28/06/2026  
> **Estado general:** En desarrollo activo — Login + Auth completados, Dashboard base creado, BD diseñada.

---

## 1. ¿De qué trata el proyecto?

Sistema web para la **Universidad Nacional de Piura (UNP)** que permite:

- **Gestionar la reserva de auditorios** universitarios para la realización de eventos académicos (charlas, conferencias, seminarios, talleres).
- **Publicar eventos** para que la comunidad universitaria pueda reservar su cupo de asistencia.
- **Recomendar eventos** a estudiantes según la afinidad temática con su carrera (sin restringir el acceso — es orientativo).
- **Controlar el flujo de solicitudes**: los docentes solicitan el auditorio, el admin aprueba, y luego el docente puede gestionar su evento.

> Este sistema simula una **futura integración** al Campus Virtual UNP existente. No usa autenticación real del campus — tiene su propio sistema de auth con una UI visualmente idéntica al Campus Virtual.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React | 19.2.7 |
| Lenguaje | TypeScript | 6.0.2 |
| Bundler | Vite | 8.1.0 |
| Estilos | Tailwind CSS v4 + inline styles | 4.3.1 |
| Animaciones | Framer Motion | 12.42.0 |
| Iconos | Lucide React | 1.21.0 |
| Routing | React Router DOM | 7.18.0 |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS) | 2.108.2 |

### Credenciales Supabase
- **Project URL:** `https://fikxhigssllvmqgezstl.supabase.co`
- **Anon Key:** `sb_publishable_3QLlGroGCz6ld1Iw69MCWA_vP9KUaDg`
- Guardadas en `.env` (no commiteado a git)
- Cliente instanciado en `src/lib/supabase.ts`

### Comandos de desarrollo
```bash
npm run dev      # servidor en localhost:5173
npm run build    # build de producción
```

> **IMPORTANTE:** Si el servidor crashea por `EBUSY` en archivos `.md`, está corregido en `vite.config.ts` — excluye `**/*.md` y `supabase/**` del file watcher.

---

## 3. Estructura de archivos actual

```
GestionEventosAuditoriosUNP/
├── src/
│   ├── App.tsx                    ✅ Router + AuthProvider + guards de ruta
│   ├── main.tsx                   ✅ Entry point
│   ├── index.css                  ✅ Tailwind import + reset
│   ├── lib/
│   │   ├── supabase.ts            ✅ Cliente Supabase
│   │   ├── auth.ts                ✅ signIn, signOut, signUp, getCurrentUser, detectarRolPorEmail
│   │   ├── AuthContext.tsx        ✅ Contexto global de autenticación con hook useAuth()
│   │   └── types.ts               ✅ Interfaces TypeScript: Usuario, Evento, Auditorio, SolicitudReserva, Reserva
│   ├── pages/
│   │   ├── LoginPage.tsx          ✅ Login + Registro, responsive, conectado a Supabase
│   │   └── DashboardPage.tsx      ⚠️  Estructura base (KPIs placeholder, sidebar básica)
│   └── assets/
│       ├── unp-shield.png         ✅ Descargado de campusvirtual.unp.edu.pe
│       └── campus-bg.png          ✅ Imagen de fondo del login original
├── supabase/
│   ├── schema.sql                 ✅ Esquema completo (PENDIENTE ejecutar en Supabase)
│   └── seed.sql                   ✅ Data real UNP (PENDIENTE ejecutar en Supabase)
├── PRODUCT.md                     ✅ Documento de producto para skill impeccable
├── CONTEXTO_PROYECTO.md           ✅ Este archivo
├── .env                           ✅ Credenciales Supabase (no en git)
├── .gitignore                     ✅ Incluye .env
└── vite.config.ts                 ✅ Con watcher fix
```

---

## 4. Roles de usuario — Definición completa

### 👑 Admin
- **Solo existe uno:** `admin@unp.edu.pe` / contraseña: `admin` (creado manualmente en Supabase Dashboard)
- **Capacidades:**
  - Registrar eventos directamente (sin solicitud previa)
  - Aprobar o rechazar solicitudes de reserva de auditorios de docentes
  - Gestionar todos los eventos del sistema
  - **Gestionar usuarios:** cambiar rol (ej: alumno → docente para casos especiales como alumnos de alto rendimiento), activar/desactivar usuarios
  - **NO puede eliminar usuarios** — solo desactivar
  - Ver reportes y estadísticas globales
- **Detección:** email exacto `admin@unp.edu.pe`

### 👨‍🏫 Docente / Decano
- **Registro:** DNI + correo `@unp.edu.pe` + facultad
- **Flujo para crear evento:**
  1. Envía solicitud de reserva de auditorio (título, descripción, fecha, auditorio, estimado de asistentes)
  2. El admin revisa y aprueba o rechaza (puede agregar observaciones)
  3. Si aprobado → **se crea automáticamente un evento en estado `borrador`** via trigger SQL
  4. El docente completa los detalles del evento y lo publica
- **También puede:** reservar cupo de asistencia en eventos de otros como cualquier usuario
- **Email:** termina en `@unp.edu.pe`

### 🎓 Alumno
- **Registro:** Código universitario + correo `@alumnos.unp.edu.pe` + carrera
- **Solo puede:** ver eventos publicados, reservar su cupo de asistencia, cancelar su reserva
- **Recibe recomendaciones** de eventos según su carrera
- **Email:** termina en `@alumnos.unp.edu.pe`

### Detección automática de rol por dominio
```typescript
// En src/lib/auth.ts
if (email === 'admin@unp.edu.pe')          → 'admin'
if (email.endsWith('@unp.edu.pe'))          → 'docente'
if (email.endsWith('@alumnos.unp.edu.pe')) → 'alumno'
```
> El trigger SQL `handle_new_user()` también asigna el rol automáticamente al crear el perfil.

---

## 5. Base de datos — Tablas diseñadas

### Tablas principales

| Tabla | Descripción |
|---|---|
| `usuarios` | Extiende `auth.users`. Campos: rol, codigo_universitario, dni, carrera_id, facultad_id, **activo** |
| `facultades` | 13 facultades reales de la UNP con siglas y color |
| `carreras` | 24 carreras reales distribuidas por facultad |
| `auditorios` | 7 auditorios (1 central + 6 de facultades) con capacidad y equipamiento |
| `categorias` | 9 categorías temáticas (Tecnología, Derecho, Salud, etc.) |
| `categoria_carreras` | Mapeo muchos-a-muchos: qué carreras son afines a cada categoría (para recomendaciones) |
| `solicitudes_reserva` | Solicitudes de docentes al admin: auditorio, fecha, estado (pendiente/aprobado/rechazado) |
| `eventos` | Eventos publicados. Pueden venir de admin directamente o de solicitud aprobada |
| `reservas` | Cupos reservados por usuarios (alumnos/docentes como asistentes) |

### Triggers automáticos
- `handle_new_user()` → crea perfil en `usuarios` al registrarse en Supabase Auth
- `crear_evento_desde_solicitud()` → cuando admin aprueba solicitud, **crea evento automáticamente** en estado `borrador`
- `actualizar_cupos()` → mantiene `cupos_reservados` actualizado en tiempo real
- `verificar_cupo()` → impide reservar si no hay cupos
- `set_updated_at()` → actualiza `updated_at` automáticamente

### RLS (Row Level Security)
- Alumno: solo ve sus propias reservas, eventos publicados
- Docente: ve sus solicitudes, puede crear solicitudes, editar sus propios eventos
- Admin: acceso total a través de función `mi_rol()`

### ⚠️ PENDIENTE CRÍTICO
Los archivos `supabase/schema.sql` y `supabase/seed.sql` están listos pero **AÚN NO SE HAN EJECUTADO** en Supabase. Deben correrse en orden:
1. `schema.sql` primero
2. `seed.sql` después

Hasta que se ejecuten, el registro de usuarios fallará porque no existen las tablas `facultades`, `carreras`, `usuarios`, etc.

---

## 6. Lo que está completamente terminado ✅

### Login / Autenticación
- [x] UI idéntica al Campus Virtual UNP (panel izquierdo blanco + panel derecho con imagen campus y servicios)
- [x] Escudo oficial de la UNP e imagen de campus descargadas directamente del sitio
- [x] **Responsivo:** en desktop = dos paneles, en mobile = fondo campus con overlay azul + texto blanco (idéntico a la app móvil del Campus Virtual)
- [x] **Formulario de login** conectado a Supabase Auth → redirige a `/dashboard`
- [x] **Formulario de registro** con detección automática de rol por dominio de email:
  - `@alumnos.unp.edu.pe` → muestra campos: código universitario + carrera (select)
  - `@unp.edu.pe` → muestra campos: DNI + facultad (select)
  - Animación de aparición de campos con Framer Motion
  - Mensaje de éxito con instrucción de confirmar email
- [x] FloatingInput con label flotante Material Design (height: 56px, border 2px en focus)
- [x] SelectField con label flotante (para carrera/facultad)
- [x] Guards de ruta: `ProtectedRoute` y `PublicRoute`
- [x] `AuthContext` global con `useAuth()` hook
- [x] Manejo de usuarios desactivados (redirige al login si `activo = false`)

### Dashboard (estructura base)
- [x] Layout con sidebar + topbar + área de contenido
- [x] KPIs placeholder (Eventos Activos, Auditorios, Usuarios, Reservas)
- [x] Botón de cerrar sesión funcional
- [x] Verificación de sesión activa al cargar

### Infraestructura
- [x] Proyecto React 19 + Vite 8 + TypeScript 6
- [x] Tailwind CSS v4 configurado con `@tailwindcss/vite`
- [x] Framer Motion instalado y en uso
- [x] Lucide React para iconos
- [x] React Router DOM v7
- [x] Supabase JS client configurado
- [x] Variables de entorno configuradas (`.env` con URL y anon key)
- [x] `.gitignore` actualizado para no commitear `.env`
- [x] `vite.config.ts` con watcher fix para archivos `.md` bloqueados
- [x] Types TypeScript completos: `Usuario`, `Evento`, `Auditorio`, `SolicitudReserva`, `Reserva`, `Rol`

---

## 7. Módulos pendientes por construir ❌

### Módulo 1: Layout compartido y navegación por rol (PRIORIDAD ALTA)
- Sidebar con navegación diferente según rol
  - **Admin:** Dashboard, Eventos, Auditorios, Solicitudes, Usuarios
  - **Docente:** Dashboard, Mis Eventos, Solicitar Auditorio, Eventos (como asistente)
  - **Alumno:** Eventos disponibles, Mis Reservas
- Avatar + nombre del usuario en el topbar
- Badge de notificaciones (solicitudes pendientes para admin)
- El `DashboardPage` actual es solo un esqueleto — necesita datos reales de Supabase

### Módulo 2: Auditorios (Admin)
- Listado de auditorios con foto, capacidad, equipamiento, facultad
- Ver disponibilidad (calendario visual por auditorio)
- Crear/editar auditorio (solo admin)
- Activar/desactivar auditorio

### Módulo 3: Solicitudes de Reserva (Docentes → Admin)
**Vista Docente:**
- Formulario de solicitud: elegir auditorio, fecha/hora, título del evento, descripción, estimado de asistentes
- Ver mis solicitudes con estado (pendiente 🟡 / aprobado 🟢 / rechazado 🔴)

**Vista Admin:**
- Bandeja de solicitudes pendientes (badge en sidebar)
- Aprobar con observaciones → trigger crea el evento automáticamente
- Rechazar con motivo

### Módulo 4: Gestión de Eventos
**Vista Admin:**
- CRUD completo de eventos (crear directamente sin solicitud)
- Cambiar estado: borrador → publicado → en_curso → finalizado
- Ver lista de asistentes por evento

**Vista Docente (evento propio aprobado):**
- Editar detalles del evento (título, descripción, ponente, imagen, cupo)
- Publicar su evento
- Ver lista de inscritos

### Módulo 5: Reserva de Cupos (Alumnos + Docentes como asistentes)
- Catálogo de eventos publicados con filtros (categoría, fecha, facultad)
- **Sistema de recomendaciones:** sección "Recomendados para ti" basada en la carrera del alumno y el mapeo `categoria_carreras`
- Botón "Reservar cupo" → genera entrada con código QR
- "Mis reservas" con opción de cancelar
- Badge "Completo" cuando no hay cupos

### Módulo 6: Gestión de Usuarios (Admin)
- Tabla de todos los usuarios con búsqueda y filtro por rol
- Cambiar rol de un usuario (ej: alumno → docente)
- Desactivar/activar usuario (campo `activo`)
- Ver perfil detallado de usuario

### Módulo 7: Dashboard enriquecido con datos reales
- KPIs reales desde Supabase: conteo de eventos activos, reservas, auditorios ocupados
- Próximos eventos (los 5 más cercanos)
- Solicitudes pendientes para admin
- Mis próximos eventos/reservas para docentes y alumnos
- Gráfico simple de ocupación por auditorio o por mes

---

## 8. Decisiones de diseño tomadas

| Decisión | Detalle |
|---|---|
| Auth | Sistema propio (no integración real con Campus Virtual UNP) |
| Detección de rol | Por dominio de email al registrarse + trigger SQL |
| Solo un admin | Hardcodeado como `admin@unp.edu.pe`, no puede crearse otro desde el sistema |
| Eliminación de usuarios | NO permitida — solo desactivación (campo `activo`) |
| Flujo docente→evento | Solicitud → aprobación admin → trigger crea evento en borrador → docente publica |
| Recomendaciones | Tabla `categoria_carreras` mapea categorías temáticas con carreras afines. No restringe acceso, solo orienta |
| Estilos | Mezcla de inline styles (para componentes críticos sin dependencia de Tailwind) + Tailwind para utilidades |
| Imagen de fondo login | `https://campusvirtual.unp.edu.pe/images/themes/unp/login-campus.png` (descargada) |
| Escudo UNP | `https://campusvirtual.unp.edu.pe/images/themes/unp/logo-report.png` (descargado) |

---

## 9. Datos seed incluidos

### Facultades (13)
FII, FIM, FC, FCA, FDCS, FE, FA, FZ, FIP, FAU, FMH, FCS, FED — con colores institucionales por facultad.

### Carreras (24)
Distribuidas entre las 13 facultades. Incluye Ingeniería Informática, Derecho, Medicina, Arquitectura, Economía, etc.

### Auditorios (7)
- Auditorio Central UNP (500 personas)
- Auditorio FII (150), FC (120), FCA (200), FDCS (180), FE (130), FMH (250)

### Categorías (9)
Tecnología e Informática, Derecho y Legislación, Salud y Medicina, Ciencias Exactas, Administración y Negocios, Ingeniería, Medio Ambiente, Cultura y Arte, Economía y Finanzas.

---

## 10. Orden recomendado para la próxima sesión

1. **Ejecutar schema.sql + seed.sql en Supabase** (prerequisito para todo lo demás)
2. **Completar Dashboard** con datos reales + navegación por rol
3. **Módulo Auditorios** (listado + detalle + disponibilidad)
4. **Módulo Solicitudes** (docente solicita → admin aprueba)
5. **Módulo Eventos** (CRUD admin + gestión docente + publicación)
6. **Módulo Reservas** (catálogo público + reservar cupo + recomendaciones)
7. **Módulo Usuarios** (gestión admin)
8. **Dashboard final** con datos reales y gráficos

---

## 11. Notas técnicas importantes

- **FloatingInput** (`LoginPage.tsx`): componente de input con label flotante Material Design. Usa `transform: scale(0.72) translateY(8px)` para el label activo. Height fijo de 56px. Funciona en modo `mobile` (border-radius 14px, fondo azul claro) y modo desktop.
- **AuthContext** (`src/lib/AuthContext.tsx`): usa `supabase.auth.onAuthStateChange` para reaccionar a login/logout. Expone `{ user: Usuario | null, loading: boolean, refresh() }`.
- **RLS habilitado en todas las tablas**: la función `mi_rol()` es `SECURITY DEFINER` para evitar recursión.
- **Trigger `crear_evento_desde_solicitud`**: cuando admin cambia solicitud de `pendiente` → `aprobado`, se inserta automáticamente una fila en `eventos` con estado `borrador`.
- **campus-bg.png** pesa 9.6 MB — considerar optimizar con `vite-imagetools` o convertir a WebP en siguiente sesión.
