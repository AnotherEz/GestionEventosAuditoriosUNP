import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { signOut } from '../lib/auth'
import {
  CalendarDays, Building2, Users, TicketCheck,
  LogOut, Bell, ChevronRight, TrendingUp,
} from 'lucide-react'
import unpShield from '../assets/unp-shield.png'

interface KPI { label: string; value: string | number; icon: React.ElementType; color: string; bg: string }

export default function DashboardPage() {
  const navigate  = useNavigate()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate('/'); return }
      setUser(data.session.user)
      setLoading(false)
    })
  }, [navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f7fa' }}>
      <span style={{ width: 36, height: 36, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const kpis: KPI[] = [
    { label: 'Eventos Activos',    value: 0,  icon: CalendarDays,  color: '#1565c0', bg: '#e3f2fd' },
    { label: 'Auditorios',         value: 7,  icon: Building2,     color: '#2e7d32', bg: '#e8f5e9' },
    { label: 'Usuarios',           value: 0,  icon: Users,         color: '#6a1b9a', bg: '#f3e5f5' },
    { label: 'Reservas Totales',   value: 0,  icon: TicketCheck,   color: '#e65100', bg: '#fff3e0' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f0f2f5' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}
        style={{ width: 240, background: '#fff', borderRight: '1px solid #e8eaed', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={unpShield} alt="UNP" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <div>
            <p style={{ fontSize: 11, color: '#9e9e9e', margin: 0, lineHeight: 1 }}>Sistema de Gestión</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1a237e', margin: 0 }}>Auditorios UNP</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: 'Dashboard',   icon: TrendingUp,   active: true  },
            { label: 'Eventos',     icon: CalendarDays, active: false },
            { label: 'Auditorios',  icon: Building2,    active: false },
            { label: 'Reservas',    icon: TicketCheck,  active: false },
            { label: 'Usuarios',    icon: Users,        active: false },
          ].map(item => {
            const Icon = item.icon
            return (
              <button key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: item.active ? '#e8f0fe' : 'transparent',
                color: item.active ? '#1565c0' : '#555',
                fontSize: 14, fontWeight: item.active ? 600 : 400,
                fontFamily: 'inherit', textAlign: 'left', width: '100%',
                transition: 'background 150ms',
              }}>
                <Icon size={17} />
                {item.label}
                {item.active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #e8eaed' }}>
          <button onClick={handleSignOut} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#d32f2f',
            fontSize: 14, fontFamily: 'inherit', width: '100%', textAlign: 'left',
            transition: 'background 150ms',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#ffebee')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: 60, background: '#fff', borderBottom: '1px solid #e8eaed',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a237e', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: '#9e9e9e', margin: 0 }}>Bienvenido, {user?.email}</p>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 8, borderRadius: 8, display: 'flex' }}>
            <Bell size={20} />
          </button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {kpis.map((kpi, i) => {
              const Icon = kpi.icon
              return (
                <motion.div key={kpi.label}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    background: '#fff', borderRadius: 12, padding: '20px 22px',
                    border: '1px solid #e8eaed', display: 'flex', alignItems: 'center', gap: 16,
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color={kpi.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#9e9e9e', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: '#1a237e', margin: 0, lineHeight: 1 }}>{kpi.value}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Placeholder panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'Próximos Eventos', desc: 'No hay eventos programados aún.' },
              { title: 'Reservas Recientes', desc: 'No hay reservas registradas aún.' },
            ].map(panel => (
              <motion.div key={panel.title}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: 20 }}
              >
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a237e', margin: '0 0 16px' }}>{panel.title}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', color: '#bdbdbd' }}>
                  <CalendarDays size={36} />
                  <p style={{ margin: '8px 0 0', fontSize: 13 }}>{panel.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
