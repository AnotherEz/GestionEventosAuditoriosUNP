export type Rol = 'admin' | 'docente' | 'alumno' | 'externo'

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
  institucion?: string
  ruc?: string
  direccion?: string
  activo: boolean
  /** true = cuenta creada/reseteada por el admin (contraseña = DNI): debe cambiarla al entrar */
  debe_cambiar_password?: boolean
  avatar_url?: string
  created_at: string
}

export type ReglaCobro = 'por_tiempo' | 'plana_dia' | 'plana_evento'

export interface Auditorio {
  id: string
  nombre: string
  descripcion?: string
  capacidad: number
  ubicacion?: string
  facultad_id?: string
  equipamiento?: string[]
  precio_interno: number
  precio_externo: number
  regla_cobro: ReglaCobro
  foto_url?: string
  activo: boolean
}

export interface BloqueOcupado {
  fecha_inicio: string
  fecha_fin: string
  estado: 'pendiente' | 'confirmado'
  titulo?: string
}

export interface DisponibilidadSemana {
  semana_inicio: string   // lunes de la semana (YYYY-MM-DD)
  bloques: BloqueOcupado[]
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
  duracion?: 'completo' | 'medio'
  tipo_evento?: 'academico' | 'pago'
  monto?: number
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  revisado_por?: string
  observaciones?: string
  created_at: string
}

export interface SolicitudReservaExt extends SolicitudReserva {
  auditorio_nombre?: string
  docente_nombre?: string          // nombre del solicitante (docente, alumno o externo)
  solicitante_rol?: Rol
  solicitante_institucion?: string
  solicitante_dni?: string
  solicitante_ruc?: string
}

export interface Reserva {
  id: string
  evento_id: string
  usuario_id: string
  estado: 'confirmada' | 'cancelada' | 'asistio'
  codigo_qr: string
  created_at: string
}
