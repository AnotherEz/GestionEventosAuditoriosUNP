import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Clock, CheckCircle, XCircle, X, Plus } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { getAllSolicitudes, getMisSolicitudes, revisarSolicitud, crearSolicitud, getAuditorios } from '../lib/db'
import type { SolicitudReservaExt, Auditorio } from '../lib/types'

const ESTADO_CFG = {
  pendiente: { label: 'Pendiente', color: '#e65100', bg: '#fff3e0', icon: Clock },
  aprobado:  { label: 'Aprobado',  color: '#2e7d32', bg: '#e8f5e9', icon: CheckCircle },
  rechazado: { label: 'Rechazado', color: '#d32f2f', bg: '#ffebee', icon: XCircle },
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function EstadoBadge({ estado }: { estado: 'pendiente' | 'aprobado' | 'rechazado' }) {
  const cfg = ESTADO_CFG[estado]
  const Icon = cfg.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 10, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600 }}>
      <Icon size={12} /> {cfg.label}
    </span>
  )
}

// ── Admin: bandeja de solicitudes ────────────────────────────────────────────

function AdminSolicitudes({ userId }: { userId: string }) {
  const [solicitudes, setSolicitudes] = useState<SolicitudReservaExt[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SolicitudReservaExt | null>(null)
  const [obs, setObs] = useState('')
  const [processing, setProcessing] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('pendiente')

  const load = () => {
    setLoading(true)
    getAllSolicitudes().then(d => setSolicitudes(d as SolicitudReservaExt[])).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRevisar = async (estado: 'aprobado' | 'rechazado') => {
    if (!selected) return
    setProcessing(true)
    try {
      await revisarSolicitud(selected.id, estado, obs || undefined, userId)
      setSelected(null)
      setObs('')
      load()
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(false)
    }
  }

  const filtradas = solicitudes.filter(s => filtro === 'todos' || s.estado === filtro)

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['todos', 'pendiente', 'aprobado', 'rechazado'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '7px 16px', borderRadius: 20, border: `1px solid ${filtro === f ? '#1565c0' : '#e0e0e0'}`,
            background: filtro === f ? '#e8f0fe' : '#fff', color: filtro === f ? '#1565c0' : '#555',
            fontSize: 13, fontWeight: filtro === f ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
            textTransform: 'capitalize',
          }}>
            {f === 'todos' ? 'Todas' : ESTADO_CFG[f].label}
            {f === 'pendiente' && (
              <span style={{ marginLeft: 6, background: '#d32f2f', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 5px' }}>
                {solicitudes.filter(s => s.estado === 'pendiente').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtradas.length === 0 ? (
        <EmptyState icon={ClipboardList} text="No hay solicitudes en esta categoría" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtradas.map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: '16px 20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a237e', margin: 0 }}>{s.titulo_evento}</h3>
                    <EstadoBadge estado={s.estado} />
                  </div>
                  <p style={{ fontSize: 13, color: '#555', margin: '0 0 4px' }}>
                    <strong>Docente:</strong> {s.docente_nombre ?? s.docente_id}
                  </p>
                  <p style={{ fontSize: 13, color: '#555', margin: '0 0 4px' }}>
                    <strong>Auditorio:</strong> {s.auditorio_nombre ?? s.auditorio_id}
                  </p>
                  <p style={{ fontSize: 13, color: '#555', margin: '0 0 4px' }}>
                    <strong>Fecha:</strong> {fmtFecha(s.fecha_inicio)} — {fmtFecha(s.fecha_fin)}
                  </p>
                  {s.asistentes_est && (
                    <p style={{ fontSize: 13, color: '#555', margin: '0 0 4px' }}>
                      <strong>Asistentes estimados:</strong> {s.asistentes_est}
                    </p>
                  )}
                  {s.descripcion && (
                    <p style={{ fontSize: 13, color: '#757575', margin: '4px 0 0', fontStyle: 'italic' }}>{s.descripcion}</p>
                  )}
                  {s.observaciones && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#555' }}>
                      <strong>Observaciones:</strong> {s.observaciones}
                    </div>
                  )}
                </div>
                {s.estado === 'pendiente' && (
                  <button onClick={() => { setSelected(s); setObs('') }} style={{
                    padding: '8px 16px', background: '#1565c0', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}>
                    Revisar
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal revisión - AHORA SÍ CON LA CURA DE FRAMER */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 100, backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              // LA MAGIA DE FRAMER AQUÍ
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                background: '#fff', borderRadius: 16, padding: 28, width: '90%', maxWidth: 480, zIndex: 101,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a237e', margin: 0 }}>Revisar Solicitud</h2>
                <button onClick={() => setSelected(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563', transition: 'background 0.2s' }}><X size={20} /></button>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{selected.titulo_evento}</p>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  {(selected as SolicitudReservaExt).auditorio_nombre} · {fmtFecha(selected.fecha_inicio)}
                </p>
                <p style={{ fontSize: 13, color: '#475569', margin: '8px 0 0' }}>
                  <strong>Docente:</strong> {selected.docente_nombre}
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Observaciones (opcional)
                </label>
                <textarea
                  rows={3} value={obs} onChange={e => setObs(e.target.value)}
                  placeholder="Indica el motivo del rechazo o añade notas para el docente..."
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#1565c0'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => handleRevisar('rechazado')} disabled={processing} style={{
                  flex: 1, padding: '12px', background: '#fff', border: '1px solid #fecaca',
                  color: '#dc2626', borderRadius: 10, cursor: processing ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <XCircle size={18} /> Rechazar
                </button>
                <button onClick={() => handleRevisar('aprobado')} disabled={processing} style={{
                  flex: 1, padding: '12px', background: processing ? '#86efac' : '#16a34a', color: '#fff',
                  border: 'none', borderRadius: 10, cursor: processing ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <CheckCircle size={18} /> Aprobar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Docente: mis solicitudes ─────────────────────────────────────────────────

function DocenteSolicitudes({ userId }: { userId: string }) {
  const [solicitudes, setSolicitudes] = useState<SolicitudReservaExt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMisSolicitudes(userId).then(d => setSolicitudes(d as SolicitudReservaExt[])).catch(console.error).finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spinner />

  return solicitudes.length === 0 ? (
    <EmptyState icon={ClipboardList} text="No tienes solicitudes registradas. Usa 'Nueva Solicitud' para solicitar un auditorio." />
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {solicitudes.map((s, i) => (
        <motion.div key={s.id}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a237e', margin: 0 }}>{s.titulo_evento}</h3>
                <EstadoBadge estado={s.estado} />
              </div>
              <p style={{ fontSize: 13, color: '#555', margin: '0 0 2px' }}>
                <strong>Auditorio:</strong> {s.auditorio_nombre ?? s.auditorio_id}
              </p>
              <p style={{ fontSize: 13, color: '#555', margin: '0 0 2px' }}>
                <strong>Fecha:</strong> {fmtFecha(s.fecha_inicio)} — {fmtFecha(s.fecha_fin)}
              </p>
              {s.observaciones && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#555' }}>
                  <strong>Observación admin:</strong> {s.observaciones}
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#bdbdbd', margin: 0 }}>{fmtFecha(s.created_at)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Nueva Solicitud form ─────────────────────────────────────────────────────

function NuevaSolicitudForm({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [auditorios, setAuditorios] = useState<Auditorio[]>([])
  const [form, setForm] = useState({ auditorio_id: '', titulo_evento: '', descripcion: '', fecha_inicio: '', fecha_fin: '', asistentes_est: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => { getAuditorios().then(a => setAuditorios(a.filter(x => x.activo))).catch(console.error) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.auditorio_id || !form.titulo_evento.trim() || !form.fecha_inicio || !form.fecha_fin) {
      setError('Completa todos los campos obligatorios')
      return
    }
    setSaving(true)
    setError('')
    try {
      await crearSolicitud({
        docente_id: userId,
        auditorio_id: form.auditorio_id,
        titulo_evento: form.titulo_evento.trim(),
        descripcion: form.descripcion || undefined,
        fecha_inicio: new Date(form.fecha_inicio).toISOString(),
        fecha_fin: new Date(form.fecha_fin).toISOString(),
        asistentes_est: form.asistentes_est ? Number(form.asistentes_est) : undefined,
      })
      setSuccess(true)
      setTimeout(onCreated, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar la solicitud')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <CheckCircle size={48} color="#2e7d32" />
        <h2 style={{ color: '#2e7d32', marginTop: 12 }}>¡Solicitud enviada!</h2>
        <p style={{ color: '#555' }}>El administrador revisará tu solicitud y te notificará.</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8eaed', padding: 28, maxWidth: 600 }}
    >
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a237e', margin: '0 0 20px' }}>Solicitar Reserva de Auditorio</h2>

      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Auditorio *</label>
          <select value={form.auditorio_id} onChange={e => setForm(f => ({ ...f, auditorio_id: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' }}
          >
            <option value="">Seleccionar auditorio...</option>
            {auditorios.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.capacidad} personas)</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Título del evento *</label>
          <input type="text" value={form.titulo_evento} onChange={e => setForm(f => ({ ...f, titulo_evento: e.target.value }))}
            placeholder="Ej: Seminario de Inteligencia Artificial"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Descripción</label>
          <textarea rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Breve descripción del evento..."
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Fecha inicio *</label>
            <input type="datetime-local" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Fecha fin *</label>
            <input type="datetime-local" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Asistentes estimados</label>
          <input type="number" min="1" value={form.asistentes_est} onChange={e => setForm(f => ({ ...f, asistentes_est: e.target.value }))}
            placeholder="Número aproximado de asistentes"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" disabled={saving} style={{
          padding: '12px 20px', background: saving ? '#90caf9' : '#1565c0', color: '#fff',
          border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 600, fontFamily: 'inherit', marginTop: 4,
          display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
        }}>
          <Plus size={18} /> {saving ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </form>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SolicitudesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'lista' | 'nueva'>('lista')

  if (!user) return null
  const isAdmin = user.rol === 'admin'

  return (
    <Layout title={isAdmin ? 'Solicitudes de Reserva' : 'Mis Solicitudes'}>
      {!isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['lista', 'nueva'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 20, border: `1px solid ${tab === t ? '#1565c0' : '#e0e0e0'}`,
              background: tab === t ? '#e8f0fe' : '#fff', color: tab === t ? '#1565c0' : '#555',
              fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {t === 'lista' ? 'Mis Solicitudes' : 'Nueva Solicitud'}
            </button>
          ))}
        </div>
      )}

      {isAdmin && <AdminSolicitudes userId={user.id} />}
      {!isAdmin && tab === 'lista' && <DocenteSolicitudes userId={user.id} />}
      {!isAdmin && tab === 'nueva' && <NuevaSolicitudForm userId={user.id} onCreated={() => setTab('lista')} />}
    </Layout>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <span style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', color: '#bdbdbd' }}>
      <Icon size={40} />
      <p style={{ marginTop: 12, fontSize: 14, textAlign: 'center', maxWidth: 360, color: '#9e9e9e' }}>{text}</p>
    </div>
  )
}