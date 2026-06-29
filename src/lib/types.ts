export type Rol = 'admin' | 'docente' | 'alumno'

export interface Usuario {
  id: string
  nombres: string
  apellidos: string
  email: string
  rol: Rol
  codigo_universitario?: string
  carrera_id?: string
  dni?: string
  facultad_id?: string
  telefono?: string
  activo: boolean
  avatar_url?: string
  created_at: string
}

export interface Auditorio {
  id: string
  nombre: string
  descripcion?: string
  capacidad: number
  ubicacion?: string
  facultad_id?: string
  equipamiento?: string[]
  foto_url?: string
  activo: boolean
}

export interface Evento {
  id: string
  titulo: string
  descripcion?: string
  organizador_id: string
  auditorio_id: string
  categoria_id?: string
  fecha_inicio: string
  fecha_fin: string
  cupo_maximo: number
  cupos_reservados: number
  estado: 'borrador' | 'publicado' | 'en_curso' | 'finalizado' | 'cancelado'
  imagen_url?: string
  ponente?: string
  // joins
  auditorio_nombre?: string
  categoria_nombre?: string
  categoria_color?: string
  organizador_nombre?: string
  cupos_disponibles?: number
}

export interface SolicitudReserva {
  id: string
  docente_id: string
  auditorio_id: string
  titulo_evento: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin: string
  asistentes_est?: number
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  revisado_por?: string
  observaciones?: string
  created_at: string
}

export interface SolicitudReservaExt extends SolicitudReserva {
  auditorio_nombre?: string
  docente_nombre?: string
}

export interface Reserva {
  id: string
  evento_id: string
  usuario_id: string
  estado: 'confirmada' | 'cancelada' | 'asistio'
  codigo_qr: string
  created_at: string
}
