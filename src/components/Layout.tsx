import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CalendarDays, Building2, ClipboardList,
  Users, TicketCheck, PlusCircle, LogOut, Bell, Menu, X,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { signOut } from '../lib/auth'
import unpShield from '../assets/unp-shield.png'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  badge?: number
  roles: ('admin' | 'docente' | 'alumno')[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/dashboard',         roles: ['admin', 'docente', 'alumno'] },
  { label: 'Eventos',           icon: CalendarDays,    path: '/eventos',            roles: ['admin', 'docente'] },
  { label: 'Catálogo de Eventos', icon: CalendarDays,  path: '/catalogo',           roles: ['alumno'] },
  { label: 'Auditorios',        icon: Building2,       path: '/auditorios',         roles: ['admin', 'docente'] },
  { label: 'Solicitudes',       icon: ClipboardList,   path: '/solicitudes',        roles: ['admin', 'docente'] },
  { label: 'Mis Reservas',      icon: TicketCheck,     path: '/mis-reservas',       roles: ['alumno', 'docente'] },
  { label: 'Nueva Solicitud',   icon: PlusCircle,      path: '/nueva-solicitud',    roles: ['docente'] },
  { label: 'Usuarios',          icon: Users,           path: '/usuarios',           roles: ['admin'] },
]

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  alumno: 'Alumno',
}

interface LayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  pendingSolicitudes?: number
}

export default function Layout({ children, title, subtitle, pendingSolicitudes = 0 }: LayoutProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const rol = user?.rol ?? 'alumno'
  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(rol))
    .map(n => n.path === '/solicitudes' ? { ...n, badge: rol === 'admin' ? pendingSolicitudes : 0 } : n)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={unpShield} alt="UNP" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 10, color: '#9e9e9e', margin: 0, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1a237e', margin: 0 }}>Auditorios UNP</p>
        </div>
      </div>

      {/* User chip */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#1565c0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>
          {(user?.nombres?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#212121', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.nombres ? `${user.nombres} ${user.apellidos ?? ''}` : user?.email}
          </p>
          <p style={{ fontSize: 11, color: '#9e9e9e', margin: 0 }}>{ROL_LABEL[rol]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {visibleNav.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <button key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: active ? '#e8f0fe' : 'transparent',
                color: active ? '#1565c0' : '#555',
                fontSize: 14, fontWeight: active ? 600 : 400,
                fontFamily: 'inherit', textAlign: 'left', width: '100%',
                transition: 'background 150ms', position: 'relative',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f5f5f5' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span style={{
                  background: '#d32f2f', color: '#fff', borderRadius: 10,
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
            </button>
          )
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '10px 10px', borderTop: '1px solid #e8eaed' }}>
        <button onClick={handleSignOut} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: '#d32f2f',
          fontSize: 14, fontFamily: 'inherit', width: '100%', textAlign: 'left',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ffebee')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={17} /> Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f0f2f5' }}>

      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}
        style={{ width: 240, background: '#fff', borderRight: '1px solid #e8eaed', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        className="hide-on-mobile"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column' }}
            >
              <button onClick={() => setSidebarOpen(false)} style={{
                position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#555',
              }}>
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 60, background: '#fff', borderBottom: '1px solid #e8eaed',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'none', padding: 4 }}
              className="show-on-mobile"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1a237e', margin: 0 }}>{title}</h1>
              {subtitle && <p style={{ fontSize: 12, color: '#9e9e9e', margin: 0 }}>{subtitle}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {pendingSolicitudes > 0 && rol === 'admin' && (
              <button
                onClick={() => navigate('/solicitudes')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 8, borderRadius: 8, display: 'flex', position: 'relative' }}
              >
                <Bell size={20} />
                <span style={{
                  position: 'absolute', top: 4, right: 4, width: 8, height: 8,
                  background: '#d32f2f', borderRadius: '50%',
                }} />
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
