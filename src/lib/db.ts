import { api } from './api'
import type { Auditorio, Evento, SolicitudReservaExt, Reserva, Usuario } from './types'

// ── Auditorios ──────────────────────────────────────────────────────────────

export function getAuditorios(): Promise<Auditorio[]> {
  return api.get<Auditorio[]>('/auditorios')
}

export function upsertAuditorio(a: Partial<Auditorio> & { nombre: string; capacidad: number }) {
  return api.post('/auditorios', a)
}

export function toggleAuditorio(id: string, activo: boolean) {
  return api.patch(`/auditorios/${id}/estado`, { activo })
}

// ── Eventos ─────────────────────────────────────────────────────────────────

export function getEventosPublicados(): Promise<Evento[]> {
  return api.get<Evento[]>('/eventos/publicados')
}

export function getEventosAdmin(): Promise<Evento[]> {
  return api.get<Evento[]>('/eventos/admin')
}

export function getMisEventos(_docenteId?: string): Promise<Evento[]> {
  return api.get<Evento[]>('/eventos/mios')
}

export function upsertEvento(e: Partial<Evento>) {
  return api.post('/eventos', e)
}

export function updateEventoEstado(id: string, estado: Evento['estado']) {
  return api.patch(`/eventos/${id}/estado`, { estado })
}

export function deleteEvento(id: string) {
  return api.del(`/eventos/${id}`)
}

export function getProximosEventos(_limit = 5): Promise<Evento[]> {
  return api.get<Evento[]>('/eventos/proximos')
}

export function getAsistentesEvento(evento_id: string) {
  return api.get(`/eventos/${evento_id}/asistentes`)
}

// ── Solicitudes ─────────────────────────────────────────────────────────────

export async function getSolicitudesPendientes(): Promise<SolicitudReservaExt[]> {
  const todas = await api.get<SolicitudReservaExt[]>('/solicitudes')
  return todas.filter(s => s.estado === 'pendiente')
}

export function getMisSolicitudes(_docenteId?: string): Promise<SolicitudReservaExt[]> {
  return api.get<SolicitudReservaExt[]>('/solicitudes')
}

export function getAllSolicitudes(): Promise<SolicitudReservaExt[]> {
  return api.get<SolicitudReservaExt[]>('/solicitudes')
}

export function crearSolicitud(s: {
  docente_id: string
  auditorio_id: string
  titulo_evento: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin: string
  asistentes_est?: number
}) {
  return api.post('/solicitudes', s)
}

export function revisarSolicitud(
  id: string,
  estado: 'aprobado' | 'rechazado',
  observaciones?: string,
  _revisado_por?: string,
) {
  return api.patch(`/solicitudes/${id}/revisar`, { estado, observaciones })
}

// ── Reservas ─────────────────────────────────────────────────────────────────

interface ReservaRow extends Reserva {
  evento_titulo?: string
  fecha_inicio?: string
  fecha_fin?: string
  evento_estado?: Evento['estado']
  imagen_url?: string
  ponente?: string
  auditorio_nombre?: string
  categoria_nombre?: string
  categoria_color?: string
}

export async function getMisReservas(_usuarioId?: string): Promise<(Reserva & { evento?: Evento })[]> {
  const rows = await api.get<ReservaRow[]>('/reservas/mias')
  return rows.map(r => ({
    id: r.id,
    evento_id: r.evento_id,
    usuario_id: r.usuario_id,
    estado: r.estado,
    codigo_qr: r.codigo_qr,
    created_at: r.created_at,
    evento: {
      id: r.evento_id,
      titulo: r.evento_titulo ?? 'Evento',
      organizador_id: '',
      auditorio_id: '',
      fecha_inicio: r.fecha_inicio ?? '',
      fecha_fin: r.fecha_fin ?? '',
      cupo_maximo: 0,
      cupos_reservados: 0,
      estado: r.evento_estado ?? 'publicado',
      auditorio_nombre: r.auditorio_nombre ?? '',
      categoria_nombre: r.categoria_nombre ?? '',
      categoria_color: r.categoria_color ?? '#1565c0',
      imagen_url: r.imagen_url,
      ponente: r.ponente,
    } as Evento,
  }))
}

// AQUÍ ESTÁ EL CAMBIO: Se renombró de reservarCupo a reservarEvento
export function reservarEvento(evento_id: string, _usuario_id?: string) {
  return api.post('/reservas', { evento_id })
}

export function cancelarReserva(id: string) {
  return api.patch(`/reservas/${id}/cancelar`)
}

// ── Usuarios ─────────────────────────────────────────────────────────────────

export function getUsuarios(): Promise<(Usuario & { carrera_nombre?: string; facultad_nombre?: string })[]> {
  return api.get('/usuarios')
}

export function updateUsuarioRol(id: string, rol: 'alumno' | 'docente') {
  return api.patch(`/usuarios/${id}/rol`, { rol })
}

export function toggleUsuario(id: string, activo: boolean) {
  return api.patch(`/usuarios/${id}/estado`, { activo })
}

// ── Dashboard stats ──────────────────────────────────────────────────────────

export function getStatsAdmin() {
  return api.get<{
    eventosActivos: number; reservasTotales: number
    usuariosActivos: number; solicitudesPendientes: number; auditorios: number
  }>('/stats/admin')
}

export function getStatsDocente(_docenteId?: string) {
  return api.get<{ misEventos: number; solicitudesPendientes: number; misReservas: number }>('/stats/docente')
}

export function getStatsAlumno() {
  return api.get<{ misReservas: number; eventosActivos: number }>('/stats/alumno')
}

// ── Catalogos ────────────────────────────────────────────────────────────────

export function getFacultades() {
  return api.get<{ id: string; nombre: string; siglas: string; color: string }[]>('/catalogos/facultades')
}

export function getCarreras() {
  return api.get<{ id: string; nombre: string; facultad_id: string }[]>('/catalogos/carreras')
}

export function getCategorias() {
  return api.get<{ id: string; nombre: string; descripcion?: string; color: string }[]>('/catalogos/categorias')
}