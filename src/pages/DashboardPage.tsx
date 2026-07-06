import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays, Building2, Users, TicketCheck,
  ClipboardList, TrendingUp, Clock, CheckCircle, XCircle, ChevronRight, AlertCircle
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import {
  getStatsAdmin, getStatsDocente, getProximosEventos,
  getMisReservas, getMisSolicitudes, getMisEventos
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
      style={{ 
        background: '#fff', borderRadius: 16, padding: '24px', 
        border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)'
      }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={26} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>{value}</p>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        <KPICard label="Eventos Activos"    value={stats.eventosActivos}        icon={CalendarDays} color="#1565c0" bg="#eff6ff" delay={0} />
        <KPICard label="Reservas Totales"   value={stats.reservasTotales}       icon={TicketCheck}  color="#ea580c" bg="#fff7ed" delay={0.05} />
        <KPICard label="Usuarios Activos"   value={stats.usuariosActivos}       icon={Users}        color="#7e22ce" bg="#faf5ff" delay={0.1} />
        <KPICard label="Solicitudes Pend."  value={stats.solicitudesPendientes} icon={ClipboardList} color="#dc2626" bg="#fef2f2" delay={0.15} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Próximos eventos */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Próximos Eventos (Global)</h2>
            <button onClick={() => navigate('/eventos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13, fontWeight: 600 }}>Ver todos</button>
          </div>
          {proximos.length === 0 ? (
            <EmptyState icon={CalendarDays} text="No hay eventos próximos programados" />
          ) : proximos.map(e => (
            <EventoRow key={e.id} evento={e} onClick={() => navigate('/eventos')} />
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 20px' }}>Acciones Rápidas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Revisar solicitudes pendientes', icon: ClipboardList, path: '/solicitudes', color: '#dc2626', badge: stats.solicitudesPendientes },
              { label: 'Crear nuevo evento oficial',     icon: CalendarDays,  path: '/eventos',     color: '#1565c0' },
              { label: 'Gestionar roles de usuarios',    icon: Users,         path: '/usuarios',    color: '#7e22ce' },
              { label: 'Administrar auditorios',         icon: Building2,     path: '/auditorios',  color: '#16a34a' },
            ].map(action => {
              const Icon = action.icon
              return (
                <button key={action.path} onClick={() => navigate(action.path)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer',
                  background: '#fff', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#334155', fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={action.color} />
                  </div>
                  <span style={{ flex: 1 }}>{action.label}</span>
                  {(action.badge ?? 0) > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: 12, fontSize: 12, fontWeight: 700, padding: '3px 9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {action.badge}
                    </span>
                  )}
                  <ChevronRight size={18} color="#cbd5e1" />
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
  const [misEventos, setMisEventosLocal] = useState<Evento[]>([])

  useEffect(() => {
    getStatsDocente(userId).then(setStats).catch(() => {})
    getMisSolicitudes(userId).then(s => setSolicitudes(s.slice(0, 3) as SolicitudReservaExt[])).catch(() => {})
    // Mejora: El docente ve SUS eventos, no los globales
    getMisEventos(userId).then(e => setMisEventosLocal(e.slice(0, 4))).catch(() => {})
  }, [userId])

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        <KPICard label="Mis Eventos"         value={stats.misEventos}            icon={CalendarDays}  color="#1565c0" bg="#eff6ff" delay={0} />
        <KPICard label="Solicitudes Pend."   value={stats.solicitudesPendientes} icon={ClipboardList} color="#ea580c" bg="#fff7ed" delay={0.05} />
        <KPICard label="Eventos Disponibles" value="Catálogo"                    icon={TrendingUp}    color="#16a34a" bg="#dcfce7" delay={0.1} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Mis Solicitudes de Auditorio</h2>
            <button onClick={() => navigate('/solicitudes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13, fontWeight: 600 }}>Ver todas</button>
          </div>
          {solicitudes.length === 0 ? (
            <EmptyState icon={ClipboardList} text="No has enviado solicitudes recientes" />
          ) : solicitudes.map(s => <SolicitudRow key={s.id} sol={s} />)}
          
          <div style={{ marginTop: 24 }}>
            <button onClick={() => navigate('/nueva-solicitud')} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#1565c0', color: '#fff', border: 'none', borderRadius: 12,
              padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s'
            }}>
              <ClipboardList size={18} /> Solicitar Nuevo Auditorio
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Mis Próximos Eventos</h2>
            <button onClick={() => navigate('/eventos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13, fontWeight: 600 }}>Gestionar</button>
          </div>
          {misEventos.length === 0 ? (
            <EmptyState icon={CalendarDays} text="Aún no tienes eventos aprobados/creados" />
          ) : misEventos.map(e => <EventoRow key={e.id} evento={e} onClick={() => navigate('/eventos')} />)}
        </motion.div>
      </div>
    </>
  )
}

// ── Alumno Dashboard (Alta Precisión) ────────────────────────────────────────

function AlumnoDashboard({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [eventosDisponibles, setEventosDisponibles] = useState<Evento[]>([])
  const [misReservas, setMisReservas] = useState<(Reserva & { evento?: Evento })[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    // Obtenemos TODO en paralelo para hacer el cruce en memoria
    Promise.all([
      getProximosEventos(15), 
      getMisReservas(userId)
    ]).then(([prox, reservas]) => {
      
      const activas = reservas.filter(x => x.estado === 'confirmada')
      setMisReservas(activas.slice(0, 4))

      // Extraemos los IDs de los eventos donde el alumno YA está inscrito
      const idsInscritos = new Set(activas.map(r => r.evento_id))

      // Filtramos con precisión quirúrgica:
      // 1. No debe estar ya reservado por el alumno
      // 2. Debe tener cupo disponible
      // 3. Debe estar en estado publicado
      const realesDisponibles = prox.filter(e => 
        !idsInscritos.has(e.id) && 
        e.cupos_reservados < e.cupo_maximo &&
        e.estado === 'publicado'
      )
      
      setEventosDisponibles(realesDisponibles)
    }).catch(() => {})
    .finally(() => setLoadingData(false))

  }, [userId])

  if (loadingData) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Sincronizando disponibilidad...</div>

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        <KPICard label="Eventos Disponibles" value={eventosDisponibles.length} icon={CalendarDays} color="#1565c0" bg="#eff6ff" delay={0} />
        <KPICard label="Mis Entradas Activas" value={misReservas.length} icon={TicketCheck} color="#16a34a" bg="#dcfce7" delay={0.05} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Catálogo Exacto */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Cupos Disponibles para Ti</h2>
            <button onClick={() => navigate('/catalogo')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13, fontWeight: 600 }}>Ir al catálogo</button>
          </div>
          {eventosDisponibles.length === 0 ? (
            <EmptyState icon={CalendarDays} text="No hay eventos nuevos con cupo disponible por ahora" />
          ) : eventosDisponibles.slice(0, 4).map(e => <EventoRow key={e.id} evento={e} onClick={() => navigate('/catalogo')} />)}
        </motion.div>

        {/* Mis Reservas */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Tus Próximas Asistencias</h2>
            <button onClick={() => navigate('/mis-reservas')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', fontSize: 13, fontWeight: 600 }}>Ver tickets</button>
          </div>
          {misReservas.length === 0 ? (
            <EmptyState icon={TicketCheck} text="Aún no te has inscrito a ningún evento" />
          ) : misReservas.map(r => (
            <div key={r.id} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12, marginBottom: 10, border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{r.evento?.titulo ?? 'Evento'}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarDays size={12} /> {r.evento ? fmtFecha(r.evento.fecha_inicio) : ''}
                  </p>
                </div>
                <div style={{ padding: '4px 8px', background: '#dcfce7', borderRadius: 8, color: '#16a34a', fontSize: 11, fontWeight: 700 }}>
                  CONFIRMADA
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  )
}

// ── Shared sub-components (Mejorados UI) ─────────────────────────────────────

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0', color: '#94a3b8' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={24} color="#94a3b8" />
      </div>
      <p style={{ margin: 0, fontSize: 14, textAlign: 'center', maxWidth: 220 }}>{text}</p>
    </div>
  )
}

function EventoRow({ evento, onClick }: { evento: Evento; onClick?: () => void }) {
  const isAgotado = evento.cupos_reservados >= evento.cupo_maximo;
  const porcentaje = Math.min(100, (evento.cupos_reservados / evento.cupo_maximo) * 100);
  
  return (
    <div onClick={onClick} style={{ 
      display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0', 
      borderBottom: '1px solid #f1f5f9', cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.2s'
    }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = '#f8fafc' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ESTADO_COLOR[evento.estado] ?? '#757575', marginTop: 6, flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {evento.titulo}
          </p>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{fmtFecha(evento.fecha_inicio)} · {evento.auditorio_nombre}</p>
        </div>
        {isAgotado && (
          <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 6 }}>
            AGOTADO
          </span>
        )}
      </div>
      
      {/* Barra de capacidad visual */}
      <div style={{ marginLeft: 22, marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
          <span>Capacidad</span>
          <span style={{ fontWeight: 600, color: isAgotado ? '#dc2626' : '#64748b' }}>{evento.cupos_reservados} / {evento.cupo_maximo}</span>
        </div>
        <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            background: isAgotado ? '#ef4444' : porcentaje > 80 ? '#f59e0b' : '#1565c0',
            width: `${porcentaje}%`,
            transition: 'width 0.5s ease-out'
          }} />
        </div>
      </div>
    </div>
  )
}

function SolicitudRow({ sol }: { sol: SolicitudReservaExt }) {
  const cfg = ESTADO_SOL_COLOR[sol.estado] ?? ESTADO_SOL_COLOR.pendiente
  const Icon = cfg.icon
  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={cfg.color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sol.titulo_evento}</p>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{sol.auditorio_nombre ?? 'Sin asignar'} · {fmtFecha(sol.fecha_inicio)}</p>
      </div>
    </div>
  )
}

// ── Setup banner ─────────────────────────────────────────────────────────────

function SetupBanner() {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff8e1', border: '1px solid #fde047', borderRadius: 16,
        padding: '16px 24px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 16,
      }}
    >
      <AlertCircle size={28} color="#ca8a04" style={{ flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#854d0e', margin: '0 0 6px' }}>
          Base de datos no configurada
        </p>
        <p style={{ fontSize: 14, color: '#a16207', margin: 0, lineHeight: 1.6 }}>
          No se pudo conectar con la API o la base de datos aún no existe. Para que el sistema funcione:
        </p>
        <ol style={{ fontSize: 14, color: '#a16207', margin: '10px 0 0 0', paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Inicia <strong>Apache</strong> y <strong>MySQL</strong> en el panel de XAMPP</li>
          <li>En phpMyAdmin ejecuta <code style={{ background: '#fef9c3', padding: '2px 6px', borderRadius: 6 }}>api-eventos-unp/database/schema.sql</code></li>
          <li>Luego ejecuta <code style={{ background: '#fef9c3', padding: '2px 6px', borderRadius: 6 }}>api-eventos-unp/database/seed.sql</code></li>
          <li>Vuelve a iniciar sesión</li>
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
    <Layout title="Dashboard Principal" subtitle={greeting} pendingSolicitudes={pendingSolicitudes}>
      {sinBD && <SetupBanner />}
      {!sinBD && user.rol === 'admin'   && <AdminDashboard />}
      {!sinBD && user.rol === 'docente' && <DocenteDashboard userId={user.id} />}
      {!sinBD && user.rol === 'alumno'  && <AlumnoDashboard userId={user.id} />}
      {sinBD && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <TrendingUp size={56} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: 15 }}>El dashboard cargará cuando la base de datos esté configurada.</p>
        </div>
      )}
    </Layout>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span style={{ width: 40, height: 40, border: '4px solid #f1f5f9', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}