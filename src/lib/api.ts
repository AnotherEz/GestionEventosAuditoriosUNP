// ── Cliente HTTP hacia la API PHP ────────────────────────────────────────────
// La URL base se configura en .env (VITE_API_URL). Por defecto apunta al
// proyecto PHP servido por Apache/XAMPP en htdocs.

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  ?? 'http://localhost/api-eventos-unp'

const TOKEN_KEY = 'unp_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que Apache y MySQL estén activos en XAMPP.')
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    // Sesión inválida → limpiar token
    if (res.status === 401) clearToken()
    throw new Error((data && data.error) || `Error ${res.status}`)
  }
  return data as T
}

export const api = {
  get:   <T>(path: string) => request<T>('GET', path),
  post:  <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del:   <T>(path: string) => request<T>('DELETE', path),
}
