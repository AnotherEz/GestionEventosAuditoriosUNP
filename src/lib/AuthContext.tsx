import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
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
    const u = await getCurrentUser()
    setUser(u)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load())
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
