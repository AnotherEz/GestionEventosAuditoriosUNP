import { supabase } from './supabase'
import type { Auditorio, Evento, SolicitudReserva, Reserva, Usuario } from './types'

// ── Auditorios ──────────────────────────────────────────────────────────────

export async function getAuditorios(): Promise<Auditorio[]> {
  const { data, error } = await supabase
    .from('auditorios')
    .select('*')
    .order('nombre')
  if (error) throw error
  return data as Auditorio[]
}

export async function upsertAuditorio(a: Partial<Auditorio> & { nombre: string; capacidad: number }) {
  const { data, error } = await supabase
    .from('auditorios')
    .upsert(a)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleAuditorio(id: string, activo: boolean) {
  const { error } = await supabase.from('auditorios').update({ activo }).eq('id', id)
  if (error) throw error
}

// ── Eventos ─────────────────────────────────────────────────────────────────

export async function getEventosPublicados(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('eventos')
    .select(`
      *,
      auditorios(nombre),
      categorias(nombre, color),
      usuarios(nombres, apellidos)
    `)
    .eq('estado', 'publicado')
    .order('fecha_inicio')
  if (error) throw error
  return (data ?? []).map(mapEvento)
}

export async function getEventosAdmin(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('eventos')
    .select(`
      *,
      auditorios(nombre),
      categorias(nombre, color),
      usuarios(nombres, apellidos)
    `)
    .neq('estado', 'cancelado')
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapEvento)
}

export async function getMisEventos(docenteId: string): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('eventos')
    .select(`*, auditorios(nombre), categorias(nombre, color)`)
    .eq('organizador_id', docenteId)
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapEvento)
}

export async function upsertEvento(e: Partial<Evento>) {
  const { data, error } = await supabase
    .from('eventos')
    .upsert(e)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEventoEstado(id: string, estado: Evento['estado']) {
  const { error } = await supabase.from('eventos').update({ estado }).eq('id', id)
  if (error) throw error
}

export async function deleteEvento(id: string) {
  const { error } = await supabase.from('eventos').update({ estado: 'cancelado' }).eq('id', id)
  if (error) throw error
}

function mapEvento(row: Record<string, unknown>): Evento {
  const aud = row.auditorios as { nombre: string } | null
  const cat = row.categorias as { nombre: string; color: string } | null
  const usr = row.usuarios as { nombres: string; apellidos: string } | null
  const cupoMax = Number(row.cupo_maximo ?? 0)
  const cuposRes = Number(row.cupos_reservados ?? 0)
  return {
    ...(row as unknown as Evento),
    auditorio_nombre: aud?.nombre ?? '',
    categoria_nombre: cat?.nombre ?? '',
    categoria_color: cat?.color ?? '#757575',
    organizador_nombre: usr ? `${usr.nombres} ${usr.apellidos}` : '',
    cupos_disponibles: cupoMax - cuposRes,
  }
}

// ── Solicitudes ─────────────────────────────────────────────────────────────

export async function getSolicitudesPendientes(): Promise<SolicitudReserva[]> {
  const { data, error } = await supabase
    .from('solicitudes_reserva')
    .select(`*, auditorios(nombre), usuarios(nombres, apellidos, email)`)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(s => ({
    ...(s as SolicitudReserva),
    auditorio_nombre: (s.auditorios as { nombre: string } | null)?.nombre ?? '',
    docente_nombre: (() => {
      const u = s.usuarios as { nombres: string; apellidos: string; email: string } | null
      return u ? `${u.nombres} ${u.apellidos}` : s.docente_id
    })(),
  }))
}

export async function getMisSolicitudes(docenteId: string): Promise<SolicitudReserva[]> {
  const { data, error } = await supabase
    .from('solicitudes_reserva')
    .select(`*, auditorios(nombre)`)
    .eq('docente_id', docenteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(s => ({
    ...(s as SolicitudReserva),
    auditorio_nombre: (s.auditorios as { nombre: string } | null)?.nombre ?? '',
  }))
}

export async function crearSolicitud(s: {
  docente_id: string
  auditorio_id: string
  titulo_evento: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin: string
  asistentes_est?: number
}) {
  const { data, error } = await supabase
    .from('solicitudes_reserva')
    .insert({ ...s, estado: 'pendiente' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function revisarSolicitud(id: string, estado: 'aprobado' | 'rechazado', observaciones?: string, revisado_por?: string) {
  const { error } = await supabase
    .from('solicitudes_reserva')
    .update({ estado, observaciones, revisado_por })
    .eq('id', id)
  if (error) throw error
}

export async function getAllSolicitudes(): Promise<SolicitudReserva[]> {
  const { data, error } = await supabase
    .from('solicitudes_reserva')
    .select(`*, auditorios(nombre), usuarios(nombres, apellidos, email)`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(s => ({
    ...(s as SolicitudReserva),
    auditorio_nombre: (s.auditorios as { nombre: string } | null)?.nombre ?? '',
    docente_nombre: (() => {
      const u = s.usuarios as { nombres: string; apellidos: string } | null
      return u ? `${u.nombres} ${u.apellidos}` : s.docente_id
    })(),
  }))
}

// ── Reservas ─────────────────────────────────────────────────────────────────

export async function getMisReservas(usuarioId: string): Promise<(Reserva & { evento?: Evento })[]> {
  const { data, error } = await supabase
    .from('reservas')
    .select(`*, eventos(*, auditorios(nombre), categorias(nombre, color))`)
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    ...(r as Reserva),
    evento: r.eventos ? mapEvento(r.eventos as Record<string, unknown>) : undefined,
  }))
}

export async function reservarCupo(evento_id: string, usuario_id: string) {
  const { data, error } = await supabase
    .from('reservas')
    .insert({ evento_id, usuario_id, estado: 'confirmada', codigo_qr: `QR-${Date.now()}` })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cancelarReserva(id: string) {
  const { error } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id)
  if (error) throw error
}

export async function getAsistentesEvento(evento_id: string) {
  const { data, error } = await supabase
    .from('reservas')
    .select(`*, usuarios(nombres, apellidos, email, rol)`)
    .eq('evento_id', evento_id)
    .eq('estado', 'confirmada')
  if (error) throw error
  return data ?? []
}

// ── Usuarios ─────────────────────────────────────────────────────────────────

export async function getUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`*, carreras(nombre), facultades(nombre, siglas)`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(u => ({
    ...(u as Usuario),
    carrera_nombre: (u.carreras as { nombre: string } | null)?.nombre,
    facultad_nombre: (() => {
      const f = u.facultades as { nombre: string; siglas: string } | null
      return f ? `${f.siglas} — ${f.nombre}` : undefined
    })(),
  }))
}

export async function updateUsuarioRol(id: string, rol: 'alumno' | 'docente') {
  const { error } = await supabase.from('usuarios').update({ rol }).eq('id', id)
  if (error) throw error
}

export async function toggleUsuario(id: string, activo: boolean) {
  const { error } = await supabase.from('usuarios').update({ activo }).eq('id', id)
  if (error) throw error
}

// ── Dashboard stats ──────────────────────────────────────────────────────────

export async function getStatsAdmin() {
  const [eventos, reservas, usuarios, solicitudes] = await Promise.all([
    supabase.from('eventos').select('id', { count: 'exact' }).eq('estado', 'publicado'),
    supabase.from('reservas').select('id', { count: 'exact' }).eq('estado', 'confirmada'),
    supabase.from('usuarios').select('id', { count: 'exact' }).eq('activo', true),
    supabase.from('solicitudes_reserva').select('id', { count: 'exact' }).eq('estado', 'pendiente'),
  ])
  return {
    eventosActivos: eventos.count ?? 0,
    reservasTotales: reservas.count ?? 0,
    usuariosActivos: usuarios.count ?? 0,
    solicitudesPendientes: solicitudes.count ?? 0,
  }
}

export async function getStatsDocente(docenteId: string) {
  const [misEventos, misSolicitudes] = await Promise.all([
    supabase.from('eventos').select('id', { count: 'exact' }).eq('organizador_id', docenteId),
    supabase.from('solicitudes_reserva').select('id', { count: 'exact' }).eq('docente_id', docenteId).eq('estado', 'pendiente'),
  ])
  return {
    misEventos: misEventos.count ?? 0,
    solicitudesPendientes: misSolicitudes.count ?? 0,
  }
}

export async function getProximosEventos(limit = 5): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('eventos')
    .select(`*, auditorios(nombre), categorias(nombre, color)`)
    .eq('estado', 'publicado')
    .gte('fecha_inicio', new Date().toISOString())
    .order('fecha_inicio')
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(mapEvento)
}

// ── Catalogos ────────────────────────────────────────────────────────────────

export async function getFacultades() {
  const { data, error } = await supabase.from('facultades').select('*').order('nombre')
  if (error) throw error
  return data ?? []
}

export async function getCarreras() {
  const { data, error } = await supabase.from('carreras').select('*').order('nombre')
  if (error) throw error
  return data ?? []
}

export async function getCategorias() {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre')
  if (error) throw error
  return data ?? []
}
