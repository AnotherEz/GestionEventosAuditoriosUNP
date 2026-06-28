import { supabase } from './supabase'
import type { Rol, Usuario } from './types'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function signUpAlumno(params: {
  email: string
  password: string
  nombres: string
  apellidos: string
  codigo_universitario: string
  carrera_id: string
}) {
  if (!params.email.endsWith('@alumnos.unp.edu.pe'))
    throw new Error('El correo debe terminar en @alumnos.unp.edu.pe')

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        nombres: params.nombres,
        apellidos: params.apellidos,
        codigo_universitario: params.codigo_universitario,
        carrera_id: params.carrera_id,
      },
    },
  })
  if (error) throw error
  return data
}

export async function signUpDocente(params: {
  email: string
  password: string
  nombres: string
  apellidos: string
  dni: string
  facultad_id: string
}) {
  if (!params.email.endsWith('@unp.edu.pe') || params.email === 'admin@unp.edu.pe')
    throw new Error('El correo debe terminar en @unp.edu.pe')

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        nombres: params.nombres,
        apellidos: params.apellidos,
        dni: params.dni,
        facultad_id: params.facultad_id,
      },
    },
  })
  if (error) throw error
  return data
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser(): Promise<Usuario | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error || !data) return null
  return data as Usuario
}

export function detectarRolPorEmail(email: string): Rol | null {
  if (email === 'admin@unp.edu.pe') return 'admin'
  if (email.endsWith('@unp.edu.pe')) return 'docente'
  if (email.endsWith('@alumnos.unp.edu.pe')) return 'alumno'
  return null
}
