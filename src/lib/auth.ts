import { api, setToken, clearToken, getToken } from './api'
import type { Rol, Usuario } from './types'

interface AuthResp { token: string; user: Usuario }

export async function signIn(email: string, password: string): Promise<Usuario> {
  const data = await api.post<AuthResp>('/auth/login', { email: email.trim(), password })
  setToken(data.token)
  return data.user
}

export async function signOut() {
  // El JWT es stateless: basta con eliminar el token del cliente.
  clearToken()
}

export async function signUpAlumno(params: {
  email: string
  password: string
  nombres: string
  apellidos: string
  codigo_universitario: string
  carrera_id: string
  facultad_id?: string
  telefono?: string
}): Promise<Usuario> {
  if (!params.email.endsWith('@alumnos.unp.edu.pe'))
    throw new Error('El correo debe terminar en @alumnos.unp.edu.pe')
  const data = await api.post<AuthResp>('/auth/register', params)
  // No auto-iniciamos sesión: el usuario vuelve al login tras registrarse.
  return data.user
}

export async function signUpDocente(params: {
  email: string
  password: string
  nombres: string
  apellidos: string
  dni: string
  facultad_id?: string
  telefono?: string
}): Promise<Usuario> {
  if (!params.email.endsWith('@unp.edu.pe') || params.email === 'admin@unp.edu.pe')
    throw new Error('El correo debe terminar en @unp.edu.pe')
  const data = await api.post<AuthResp>('/auth/register', params)
  return data.user
}

export async function getCurrentUser(): Promise<Usuario | null> {
  if (!getToken()) return null
  try {
    const data = await api.get<{ user: Usuario }>('/auth/me')
    return data.user
  } catch {
    return null
  }
}

export function detectarRolPorEmail(email: string): Rol | null {
  const e = email.trim().toLowerCase()
  if (e === 'admin@unp.edu.pe') return 'admin'
  if (e.endsWith('@unp.edu.pe')) return 'docente'
  if (e.endsWith('@alumnos.unp.edu.pe')) return 'alumno'
  return null
}
