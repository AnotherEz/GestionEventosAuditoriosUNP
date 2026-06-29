import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays, Building2, Users, TicketCheck,
  ClipboardList, TrendingUp, Clock, CheckCircle, XCircle,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import {
  getStatsAdmin, getStatsDocente, getProximosEventos,
  getMisReservas, getMisSolicitudes,
} from '../lib/db'
import type { Evento, SolicitudReservaExt, Reserva } from '../lib/types'

const ESTADO_COLOR: Record<string, string> = {
  publicado: '#2e7d32', borrador: '#e65100', en_curso: '#1565c0',
  finalizado: '#757575', cancelado: '#d32f2f',
}

const ESTADO_SOL_COLOR: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  pendiente: { color: '#e65100', bg: '#fff3e0', icon: Clock },
  aprobado:  { color: '#2e7d32', bg: '#e8f5e9', icon: CheckCircle },
  rechazado: { color: '#d32f2f', bg: '#ffebee', icon: XCircle },
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function KPICard({ label, value, icon: Icon, color, bg, delay = 0 }: {
  label: string; value: number | string; icon: React.ElementType; color: string; bg: string; delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', border: '1px solid #e8eaed', display: 'flex', alignItems: 'center', gap: 16 }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: '#9e9e9e', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#1a237e', margin: 0, lineHeight: 1 }}>{value}</p>
      </div>
    </motion.div>
  )
}

// ── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ eventosActivos: 0, reservasTotales: 0, usuariosActivos: 0, solicitudesPendientes: 0 })
  const [proximos, setProximos] = useState<Evento[]>([])

  useEffect(() => {
    getStatsAdmin().then(setStats).catch(() => {})
    getProximosEventos(5).then(setProximos).catch(() => {})
  }, [])

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Eventos Activos"    value={stats.eventosActivos}        icon={CalendarDays} color="#1565c0" bg="#e3f2fd" delay={0} />
        <KPICard label="Reservas Totales"   value={stats.reservasTotales}       icon={TicketCheck}  color="#e65100" bg="#fff3e0" delay={0.05} />
        <KPICard label="Usuarios Activos"   value={stats.usuariosActivos}       icon={Users}        color="#6a1b9a" bg="#f3e5f5" delay={0.1} />
        <KPICard label="Solicitudes Pend."  value={stats.solicitudesPendientes} icon={ClipboardList} color="#d32f2f" bg="#ffebee" delay={0.15} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Próximos eventos */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a237e', margin: 0 }}>Próximos Eventos</h2>
            <button onClick={() => navigate('/eventos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13 }}>Ver todos</button>
          </div>
          {proximos.length === 0 ? (
            <EmptyState icon={CalendarDays} text="No hay eventos próximos" />
          ) : proximos.map(e => (
            <EventoRow key={e.id} evento={e} onClick={() => navigate('/eventos')} />
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: 20 }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a237e', margin: '0 0 16px' }}>Acciones Rápidas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Revisar solicitudes pendientes', icon: ClipboardList, path: '/solicitudes', color: '#d32f2f', badge: stats.solicitudesPendientes },
              { label: 'Crear nuevo evento',             icon: CalendarDays,  path: '/eventos',     color: '#1565c0' },
              { label: 'Gestionar usuarios',             icon: Users,         path: '/usuarios',    color: '#6a1b9a' },
              { label: 'Ver auditorios',                 icon: Building2,     path: '/auditorios',  color: '#2e7d32' },
            ].map(action => {
              const Icon = action.icon
              return (
                <button key={action.path} onClick={() => navigate(action.path)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  border: '1px solid #e8eaed', borderRadius: 10, cursor: 'pointer',
                  background: '#fff', textAlign: 'left', fontSize: 14, color: '#212121', fontFamily: 'inherit',
                  transition: 'border-color 150ms, background 150ms',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = '#fafafa' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eaed'; e.currentTarget.style.background = '#fff' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={action.color} />
                  </div>
                  <span style={{ flex: 1 }}>{action.label}</span>
                  {(action.badge ?? 0) > 0 && (
                    <span style={{ background: '#d32f2f', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '2px 7px' }}>
                      {action.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ── Docente Dashboard ────────────────────────────────────────────────────────

function DocenteDashboard({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ misEventos: 0, solicitudesPendientes: 0 })
  const [solicitudes, setSolicitudes] = useState<SolicitudReservaExt[]>([])
  const [proximos, setProximos] = useState<Evento[]>([])

  useEffect(() => {
    getStatsDocente(userId).then(setStats).catch(() => {})
    getMisSolicitudes(userId).then(s => setSolicitudes(s.slice(0, 3) as SolicitudReservaExt[])).catch(() => {})
    getProximosEventos(4).then(setProximos).catch(() => {})
  }, [userId])

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Mis Eventos"         value={stats.misEventos}            icon={CalendarDays}  color="#1565c0" bg="#e3f2fd" delay={0} />
        <KPICard label="Solicitudes Pend."   value={stats.solicitudesPendientes} icon={ClipboardList} color="#e65100" bg="#fff3e0" delay={0.05} />
        <KPICard label="Eventos Disponibles" value={proximos.length}             icon={TrendingUp}    color="#2e7d32" bg="#e8f5e9" delay={0.1} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a237e', margin: 0 }}>Mis Solicitudes</h2>
            <button onClick={() => navigate('/solicitudes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13 }}>Ver todas</button>
          </div>
          {solicitudes.length === 0 ? (
            <EmptyState icon={ClipboardList} text="No tienes solicitudes aún" />
          ) : solicitudes.map(s => <SolicitudRow key={s.id} sol={s} />)}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a237e', margin: 0 }}>Próximos Eventos</h2>
            <button onClick={() => navigate('/auditorios')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13 }}>Auditorios</button>
          </div>
          {proximos.length === 0 ? (
            <EmptyState icon={CalendarDays} text="No hay eventos próximos" />
          ) : proximos.map(e => <EventoRow key={e.id} evento={e} />)}
        </motion.div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/nueva-solicitud')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#1565c0', color: '#fff', border: 'none', borderRadius: 10,
          padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <ClipboardList size={18} /> Solicitar Auditorio
        </button>
      </div>
    </>
  )
}

// ── Alumno Dashboard ─────────────────────────────────────────────────────────

function AlumnoDashboard({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [proximos, setProximos] = useState<Evento[]>([])
  const [misReservas, setMisReservas] = useState<(Reserva & { evento?: Evento })[]>([])

  useEffect(() => {
    getProximosEventos(6).then(setProximos).catch(() => {})
    getMisReservas(userId).then(r => setMisReservas(r.filter(x => x.estado === 'confirmada').slice(0, 3))).catch(() => {})
  }, [userId])

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Eventos Disponibles" value={proximos.length} icon={CalendarDays} color="#1565c0" bg="#e3f2fd" delay={0} />
        <KPICard label="Mis Reservas"        value={misReservas.length} icon={TicketCheck} color="#2e7d32" bg="#e8f5e9" delay={0.05} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a237e', margin: 0 }}>Eventos Disponibles</h2>
            <button onClick={() => navigate('/catalogo')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13 }}>Ver todos</button>
          </div>
          {proximos.length === 0 ? (
            <EmptyState icon={CalendarDays} text="No hay eventos disponibles" />
          ) : proximos.slice(0, 4).map(e => <EventoRow key={e.id} evento={e} onClick={() => navigate('/catalogo')} />)}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a237e', margin: 0 }}>Mis Reservas</h2>
            <button onClick={() => navigate('/mis-reservas')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13 }}>Ver todas</button>
          </div>
          {misReservas.length === 0 ? (
            <EmptyState icon={TicketCheck} text="No tienes reservas aún" />
          ) : misReservas.map(r => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#212121', margin: '0 0 2px' }}>{r.evento?.titulo ?? 'Evento'}</p>
              <p style={{ fontSize: 12, color: '#9e9e9e', margin: 0 }}>{r.evento ? fmtFecha(r.evento.fecha_inicio) : ''}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', color: '#bdbdbd' }}>
      <Icon size={32} />
      <p style={{ margin: '8px 0 0', fontSize: 13 }}>{text}</p>
    </div>
  )
}

function EventoRow({ evento, onClick }: { evento: Evento; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ESTADO_COLOR[evento.estado] ?? '#757575', marginTop: 5, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#212121', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evento.titulo}</p>
        <p style={{ fontSize: 11, color: '#9e9e9e', margin: 0 }}>{fmtFecha(evento.fecha_inicio)} · {evento.auditorio_nombre}</p>
      </div>
    </div>
  )
}

function SolicitudRow({ sol }: { sol: SolicitudReservaExt }) {
  const cfg = ESTADO_SOL_COLOR[sol.estado] ?? ESTADO_SOL_COLOR.pendiente
  const Icon = cfg.icon
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={cfg.color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#212121', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sol.titulo_evento}</p>
        <p style={{ fontSize: 11, color: '#9e9e9e', margin: 0 }}>{sol.auditorio_nombre ?? ''} · {fmtFecha(sol.fecha_inicio)}</p>
      </div>
    </div>
  )
}

// ── Setup banner ─────────────────────────────────────────────────────────────

function SetupBanner() {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 12,
        padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12,
      }}
    >
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#e65100', margin: '0 0 4px' }}>
          Base de datos no configurada
        </p>
        <p style={{ fontSize: 13, color: '#795548', margin: 0, lineHeight: 1.6 }}>
          Las tablas de la base de datos aún no existen en Supabase. Para que el sistema funcione debes ejecutar los scripts SQL en este orden:
        </p>
        <ol style={{ fontSize: 13, color: '#795548', margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Ir a <strong>Supabase Dashboard → SQL Editor</strong></li>
          <li>Ejecutar el contenido de <code style={{ background: '#fff3e0', padding: '1px 5px', borderRadius: 4 }}>supabase/schema.sql</code></li>
          <li>Luego ejecutar <code style={{ background: '#fff3e0', padding: '1px 5px', borderRadius: 4 }}>supabase/seed.sql</code></li>
          <li>Volver a iniciar sesión</li>
        </ol>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [pendingSolicitudes, setPendingSolicitudes] = useState(0)
  const [sinBD, setSinBD] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/')
    if (user?.rol === 'admin') {
      import('../lib/db').then(({ getStatsAdmin }) =>
        getStatsAdmin()
          .then(s => setPendingSolicitudes(s.solicitudesPendientes))
          .catch(() => setSinBD(true))
      )
    }
  }, [user, loading, navigate])

  if (loading || !user) return <Spinner />

  const greeting = user.nombres ? `Bienvenido, ${user.nombres}` : 'Bienvenido'

  return (
    <Layout title="Dashboard" subtitle={greeting} pendingSolicitudes={pendingSolicitudes}>
      {sinBD && <SetupBanner />}
      {!sinBD && user.rol === 'admin'   && <AdminDashboard />}
      {!sinBD && user.rol === 'docente' && <DocenteDashboard userId={user.id} />}
      {!sinBD && user.rol === 'alumno'  && <AlumnoDashboard userId={user.id} />}
      {sinBD && (
        <div style={{ textAlign: 'center', padding: 40, color: '#bdbdbd' }}>
          <TrendingUp size={48} />
          <p style={{ marginTop: 12, fontSize: 14 }}>El dashboard cargará cuando la base de datos esté configurada.</p>
        </div>
      )}
    </Layout>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span style={{ width: 36, height: 36, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
