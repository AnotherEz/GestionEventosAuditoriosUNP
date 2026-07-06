import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser } from './auth'
import type { Usuario } from './types'

interface AuthCtx {
  user: Usuario | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const u = await getCurrentUser()
    setUser(u)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
