import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Clock, CheckCircle, XCircle, X, Plus, CalendarDays } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { getAllSolicitudes, getMisSolicitudes, revisarSolicitud, crearSolicitud, getAuditorios, getDisponibilidad } from '../lib/db'
import type { SolicitudReservaExt, Auditorio, DisponibilidadSemana } from '../lib/types'

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
                    <strong>Solicitante:</strong> {s.docente_nombre ?? s.docente_id}
                    {s.solicitante_rol && s.solicitante_rol !== 'admin' && (
                      <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: '#1565c0', background: '#e8f0fe', borderRadius: 8, padding: '2px 8px' }}>
                        {s.solicitante_rol === 'docente' ? 'Docente' : s.solicitante_rol === 'alumno' ? 'Alumno' : 'Externo'}
                      </span>
                    )}
                    {s.solicitante_rol !== 'externo' && s.estado === 'pendiente' && (
                      <span title="La comunidad UNP tiene prioridad de atención" style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: '#2e7d32', background: '#e8f5e9', borderRadius: 8, padding: '2px 8px' }}>
                        ★ Prioridad UNP
                      </span>
                    )}
                    {s.solicitante_rol === 'externo' && s.solicitante_institucion && (
                      <span style={{ marginLeft: 6, fontSize: 12, color: '#757575' }}>({s.solicitante_institucion})</span>
                    )}
                  </p>
                  {/* Documento de identidad: RUC para instituciones, DNI para el resto */}
                  {(s.solicitante_dni || s.solicitante_ruc) && (
                    <p style={{ fontSize: 13, color: '#555', margin: '0 0 4px' }}>
                      <strong>Documento:</strong>{' '}
                      {s.solicitante_rol === 'externo' && s.solicitante_institucion && s.solicitante_ruc
                        ? <>RUC {s.solicitante_ruc}</>
                        : <>DNI {s.solicitante_dni}</>}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: '#555', margin: '0 0 4px' }}>
                    <strong>Auditorio:</strong> {s.auditorio_nombre ?? s.auditorio_id}
                  </p>
                  <p style={{ fontSize: 13, color: '#555', margin: '0 0 4px' }}>
                    <strong>Fecha:</strong> {fmtFecha(s.fecha_inicio)} — {fmtFecha(s.fecha_fin)}
                  </p>
                  {typeof s.monto === 'number' && (
                    <p style={{ fontSize: 13, color: '#555', margin: '0 0 4px' }}>
                      <strong>Monto:</strong>{' '}
                      {s.tipo_evento === 'academico'
                        ? <span style={{ color: '#2e7d32', fontWeight: 600 }}>Exonerado (académico)</span>
                        : <span style={{ color: '#1565c0', fontWeight: 600 }}>S/ {s.monto.toFixed(2)}</span>}
                      {s.duracion === 'medio' ? ' · Medio día' : ' · Día completo'}
                    </p>
                  )}
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

      {/* Modal revisión. Sin AnimatePresence: con framer-motion 12 + React 19
          los fragmentos no se desmontan tras el exit y el modal invisible
          queda bloqueando los clics de toda la página. */}
      {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 100, backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
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
                  <strong>Solicitante:</strong> {selected.docente_nombre}
                  {selected.solicitante_rol === 'externo' && selected.solicitante_institucion && (
                    <span style={{ color: '#64748b' }}> — {selected.solicitante_institucion}</span>
                  )}
                </p>
                {(selected.solicitante_dni || selected.solicitante_ruc) && (
                  <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
                    <strong>Documento:</strong>{' '}
                    {selected.solicitante_rol === 'externo' && selected.solicitante_institucion && selected.solicitante_ruc
                      ? <>RUC {selected.solicitante_ruc}</>
                      : <>DNI {selected.solicitante_dni}</>}
                  </p>
                )}
                {typeof selected.monto === 'number' && (
                  <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
                    <strong>Monto:</strong>{' '}
                    {selected.tipo_evento === 'academico'
                      ? <span style={{ color: '#2e7d32', fontWeight: 700 }}>Exonerado (académico)</span>
                      : <span style={{ color: '#1565c0', fontWeight: 700 }}>S/ {selected.monto.toFixed(2)}</span>}
                    {selected.duracion === 'medio' ? ' · Medio día' : ' · Día completo'}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Observaciones (opcional)
                </label>
                <textarea
                  rows={3} value={obs} onChange={e => setObs(e.target.value)}
                  placeholder="Indica el motivo del rechazo o añade notas para el solicitante..."
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
              {typeof s.monto === 'number' && (
                <p style={{ fontSize: 13, color: '#555', margin: '0 0 2px' }}>
                  <strong>Monto:</strong>{' '}
                  {s.tipo_evento === 'academico'
                    ? <span style={{ color: '#2e7d32', fontWeight: 600 }}>Exonerado (académico)</span>
                    : <span style={{ color: '#1565c0', fontWeight: 600 }}>S/ {s.monto.toFixed(2)}</span>}
                </p>
              )}
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

// ── Nueva Solicitud form (con calendario semanal de disponibilidad) ──────────

const HORAS = Array.from({ length: 15 }, (_, i) => 7 + i)   // 07:00 … 21:00 (slots de 1 h)
const DIAS_LABEL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const pad2 = (n: number) => String(n).padStart(2, '0')

function NuevaSolicitudForm({ userId, esExterno, auditorioInicial = '', onCreated }: {
  userId: string; esExterno: boolean; auditorioInicial?: string; onCreated: () => void
}) {
  const [auditorios, setAuditorios] = useState<Auditorio[]>([])
  const [form, setForm] = useState({ auditorio_id: auditorioInicial, titulo_evento: '', descripcion: '', asistentes_est: '' })
  const [fecha, setFecha] = useState('')                 // día elegido (YYYY-MM-DD)
  const [horaInicio, setHoraInicio] = useState(9)
  const [horaFin, setHoraFin] = useState(11)
  const [tipoEvento, setTipoEvento] = useState<'academico' | 'pago'>('pago')
  const [disp, setDisp] = useState<DisponibilidadSemana | null>(null)
  const [loadingDisp, setLoadingDisp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [montoFinal, setMontoFinal] = useState<number | null>(null)

  useEffect(() => { getAuditorios().then(a => setAuditorios(a.filter(x => x.activo))).catch(console.error) }, [])

  const auditorio = auditorios.find(a => a.id === form.auditorio_id)

  // Cargar disponibilidad de la semana al elegir auditorio + día
  useEffect(() => {
    if (!form.auditorio_id || !fecha) { setDisp(null); return }
    setLoadingDisp(true)
    getDisponibilidad(form.auditorio_id, fecha)
      .then(setDisp)
      .catch(console.error)
      .finally(() => setLoadingDisp(false))
  }, [form.auditorio_id, fecha])

  // Días (lunes-domingo) de la semana cargada
  const diasSemana = useMemo(() => {
    if (!disp) return []
    const [y, m, d] = disp.semana_inicio.split('-').map(Number)
    return Array.from({ length: 7 }, (_, i) => new Date(y, m - 1, d + i))
  }, [disp])

  // Estado de una celda del calendario (día × hora)
  const estadoCelda = (dia: Date, h: number): 'libre' | 'pendiente' | 'confirmado' | 'pasado' => {
    const ini = new Date(dia); ini.setHours(h, 0, 0, 0)
    const fin = new Date(dia); fin.setHours(h + 1, 0, 0, 0)
    if (fin <= new Date()) return 'pasado'
    let estado: 'libre' | 'pendiente' | 'confirmado' = 'libre'
    for (const b of disp?.bloques ?? []) {
      const bi = new Date(b.fecha_inicio)
      const bf = new Date(b.fecha_fin)
      if (bi < fin && bf > ini) {
        if (b.estado === 'confirmado') return 'confirmado'
        estado = 'pendiente'
      }
    }
    return estado
  }

  const fmtDia = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  const esCeldaSeleccionada = (dia: Date, h: number) =>
    fmtDia(dia) === fecha && h >= horaInicio && h < horaFin

  const clickCelda = (dia: Date, h: number, estado: string) => {
    if (estado !== 'libre') return
    setFecha(fmtDia(dia))
    setHoraInicio(h)
    setHoraFin(Math.min(h + 2, 22))
  }

  // Duración derivada de las horas: hasta 5 h = medio día (igual que el backend)
  const horasUso  = horaFin - horaInicio
  const duracion: 'completo' | 'medio' = horasUso <= 5 ? 'medio' : 'completo'

  // Monto estimado según el tarifario (espejo del cálculo del backend)
  const montoEstimado = useMemo(() => {
    if (!auditorio) return null
    if (!esExterno && tipoEvento === 'academico') return 0
    const base = esExterno ? auditorio.precio_externo : auditorio.precio_interno
    return (duracion === 'medio' && auditorio.regla_cobro === 'por_tiempo') ? base / 2 : base
  }, [auditorio, tipoEvento, duracion, esExterno])

  const REGLA_LABEL: Record<string, string> = {
    por_tiempo: 'Medio día = 50% de la tarifa',
    plana_dia: 'Tarifa plana por día o fracción',
    plana_evento: 'Tarifa única por evento',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.auditorio_id || !form.titulo_evento.trim() || !fecha) {
      setError('Completa el auditorio, el título y la fecha del evento')
      return
    }
    if (horaFin <= horaInicio) { setError('La hora de fin debe ser mayor a la de inicio'); return }
    setSaving(true)
    setError('')
    try {
      const fi = new Date(`${fecha}T${pad2(horaInicio)}:00:00`)
      const ff = new Date(`${fecha}T${pad2(horaFin)}:00:00`)
      const creada = await crearSolicitud({
        docente_id: userId,
        auditorio_id: form.auditorio_id,
        titulo_evento: form.titulo_evento.trim(),
        descripcion: form.descripcion || undefined,
        fecha_inicio: fi.toISOString(),
        fecha_fin: ff.toISOString(),
        asistentes_est: form.asistentes_est ? Number(form.asistentes_est) : undefined,
        tipo_evento: esExterno ? 'pago' : tipoEvento,
      })
      // Monto REAL calculado y registrado por el backend según el tarifario TUSNE
      setMontoFinal(typeof creada.monto === 'number' ? creada.monto : montoEstimado)
      setSuccess(true)
      setTimeout(onCreated, 3500)
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
        <h2 style={{ color: '#2e7d32', marginTop: 12 }}>¡Solicitud enviada con éxito!</h2>
        <p style={{ color: '#555', maxWidth: 420, margin: '8px auto 0' }}>
          {montoFinal === 0
            ? 'Tu evento académico está exonerado de pago. Espera la aprobación del administrador.'
            : <>Monto a pagar: <strong>S/ {montoFinal?.toFixed(2)}</strong>. Espera la pre-aprobación del administrador antes de ir al banco.</>}
        </p>
      </div>
    )
  }

  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8eaed', padding: 28, maxWidth: 860 }}
    >
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a237e', margin: '0 0 20px' }}>Solicitar Reserva de Auditorio</h2>

      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 1. Auditorio */}
        <div>
          <label style={labelStyle}>1. Auditorio *</label>
          <select value={form.auditorio_id} onChange={e => setForm(f => ({ ...f, auditorio_id: e.target.value }))} style={selectStyle}>
            <option value="">Seleccionar auditorio...</option>
            {auditorios.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.capacidad} personas)</option>)}
          </select>
        </div>

        {/* Tarifa del ambiente elegido */}
        {auditorio && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tarifa interna (UNP)</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1565c0', margin: 0 }}>S/ {auditorio.precio_interno.toFixed(2)}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tarifa externa</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#e65100', margin: 0 }}>S/ {auditorio.precio_externo.toFixed(2)}</p>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, flex: 1, minWidth: 160 }}>{REGLA_LABEL[auditorio.regla_cobro]}</p>
          </div>
        )}

        {/* 2. Día */}
        <div>
          <label style={labelStyle}>2. Día del evento *</label>
          <input type="date" value={fecha} min={fmtDia(new Date())} onChange={e => setFecha(e.target.value)} style={selectStyle} />
        </div>

        {/* 3. Calendario semanal de disponibilidad */}
        {form.auditorio_id && fecha && (
          <div>
            <label style={labelStyle}>
              <CalendarDays size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
              Disponibilidad de la semana {disp ? `(desde el ${DIAS_LABEL[0]} ${disp.semana_inicio.split('-').reverse().join('/')})` : ''}
            </label>
            {loadingDisp ? (
              <p style={{ fontSize: 13, color: '#9e9e9e' }}>Cargando disponibilidad...</p>
            ) : disp && (
              <>
                <div style={{ overflowX: 'auto', border: '1px solid #e8eaed', borderRadius: 10 }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 8px', fontSize: 11, color: '#757575', background: '#f9fafb', border: '1px solid #f0f0f0', width: 52 }}>Hora</th>
                        {diasSemana.map((d, i) => (
                          <th key={i} style={{
                            padding: '6px 4px', fontSize: 11, background: fmtDia(d) === fecha ? '#e8f0fe' : '#f9fafb',
                            color: fmtDia(d) === fecha ? '#1565c0' : '#757575', border: '1px solid #f0f0f0', fontWeight: fmtDia(d) === fecha ? 700 : 600,
                          }}>
                            {DIAS_LABEL[i]}<br />{pad2(d.getDate())}/{pad2(d.getMonth() + 1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HORAS.map(h => (
                        <tr key={h}>
                          <td style={{ padding: '3px 8px', fontSize: 11, color: '#9e9e9e', border: '1px solid #f0f0f0', textAlign: 'right', whiteSpace: 'nowrap' }}>{pad2(h)}:00</td>
                          {diasSemana.map((d, i) => {
                            const est = estadoCelda(d, h)
                            const sel = esCeldaSeleccionada(d, h)
                            const bg = sel ? '#1565c0'
                              : est === 'confirmado' ? '#ef9a9a'
                              : est === 'pendiente' ? '#ffe082'
                              : est === 'pasado' ? '#f5f5f5'
                              : '#e8f5e9'
                            return (
                              <td key={i}
                                onClick={() => clickCelda(d, h, est)}
                                title={est === 'libre' ? `Disponible — clic para elegir ${pad2(h)}:00` : est === 'pendiente' ? 'Reserva pendiente' : est === 'confirmado' ? 'Ocupado' : ''}
                                style={{
                                  border: '1px solid #f0f0f0', height: 22, background: bg,
                                  cursor: est === 'libre' ? 'pointer' : 'default',
                                  transition: 'background 100ms',
                                }}
                              />
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                  {[
                    { c: '#e8f5e9', t: 'Disponible' },
                    { c: '#ffe082', t: 'Pendiente de aprobación' },
                    { c: '#ef9a9a', t: 'Ocupado' },
                    { c: '#1565c0', t: 'Tu selección' },
                  ].map(l => (
                    <span key={l.t} style={{ fontSize: 11, color: '#757575', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: l.c, display: 'inline-block', border: '1px solid #e0e0e0' }} />{l.t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. Horario */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Hora inicio *</label>
            <select value={horaInicio} onChange={e => setHoraInicio(Number(e.target.value))} style={selectStyle}>
              {HORAS.map(h => <option key={h} value={h}>{pad2(h)}:00</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Hora fin *</label>
            <select value={horaFin} onChange={e => setHoraFin(Number(e.target.value))} style={selectStyle}>
              {HORAS.map(h => <option key={h + 1} value={h + 1}>{pad2(h + 1)}:00</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duración (automática)</label>
            <div style={{
              padding: '10px 12px', border: '1px solid #bbdefb', borderRadius: 8,
              fontSize: 14, background: '#e8f0fe', color: '#1565c0', fontWeight: 600,
              boxSizing: 'border-box', whiteSpace: 'nowrap',
            }}>
              {horasUso > 0 ? `${horasUso} h → ${duracion === 'medio' ? 'Medio día' : 'Día completo'}` : '—'}
            </div>
          </div>
          {!esExterno && (
            <div>
              <label style={labelStyle}>Tipo de evento</label>
              <select value={tipoEvento} onChange={e => setTipoEvento(e.target.value as 'academico' | 'pago')} style={selectStyle}>
                <option value="pago">Evento de pago</option>
                <option value="academico">Académico gratuito</option>
              </select>
            </div>
          )}
        </div>
        <p style={{ fontSize: 11, color: '#9e9e9e', margin: '-8px 0 0' }}>
          Hasta 5 horas de uso se considera medio día; más de 5 horas, día completo.
          El 50% por medio día aplica solo en ambientes con cobro por tiempo.
        </p>

        {/* Monto a pagar según el tarifario oficial (TUSNE) */}
        {auditorio && (
          <div style={{
            background: montoEstimado === 0 ? '#e8f5e9' : '#e8f0fe',
            border: `1px solid ${montoEstimado === 0 ? '#c8e6c9' : '#bbdefb'}`,
            borderRadius: 10, padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#555' }}>
                Monto a pagar — tarifario oficial UNP ({esExterno ? 'tarifa externa' : 'tarifa interna UNP'}
                {duracion === 'medio' && auditorio.regla_cobro === 'por_tiempo' ? ', medio día' : ''}):
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: montoEstimado === 0 ? '#2e7d32' : '#1565c0' }}>
                {montoEstimado === 0 ? 'Exonerado (S/ 0.00)' : `S/ ${montoEstimado?.toFixed(2)}`}
              </span>
            </div>
            {!esExterno && montoEstimado !== 0 && auditorio.precio_externo > auditorio.precio_interno && (
              <p style={{ fontSize: 12, color: '#2e7d32', margin: '6px 0 0', fontWeight: 600 }}>
                ✓ Por ser de la comunidad UNP pagas la tarifa interna
                (ahorras S/ {(auditorio.precio_externo - auditorio.precio_interno).toFixed(2)} frente a la tarifa externa)
                y tu solicitud tiene prioridad de atención.
              </p>
            )}
          </div>
        )}

        {/* Datos del evento */}
        <div>
          <label style={labelStyle}>Título del evento *</label>
          <input type="text" value={form.titulo_evento} onChange={e => setForm(f => ({ ...f, titulo_evento: e.target.value }))}
            placeholder="Ej: Seminario de Inteligencia Artificial" style={selectStyle} />
        </div>

        <div>
          <label style={labelStyle}>Descripción</label>
          <textarea rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Breve descripción del evento..." style={{ ...selectStyle, resize: 'vertical' }} />
        </div>

        <div>
          <label style={labelStyle}>Asistentes estimados</label>
          <input type="number" min="1" value={form.asistentes_est} onChange={e => setForm(f => ({ ...f, asistentes_est: e.target.value }))}
            placeholder="Número aproximado de asistentes" style={selectStyle} />
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
  const location = useLocation()
  // Desde /nueva-solicitud o /nueva-solicitud?auditorio=<id> se abre directo el formulario
  const auditorioInicial = new URLSearchParams(location.search).get('auditorio') ?? ''
  const esRutaNueva = location.pathname === '/nueva-solicitud' || auditorioInicial !== ''
  const [tab, setTab] = useState<'lista' | 'nueva'>(esRutaNueva ? 'nueva' : 'lista')

  // /solicitudes y /nueva-solicitud comparten este componente: al navegar
  // entre ambas rutas NO se remonta, así que hay que sincronizar la pestaña.
  useEffect(() => {
    setTab(esRutaNueva ? 'nueva' : 'lista')
  }, [location.pathname, auditorioInicial])  // eslint-disable-line react-hooks/exhaustive-deps

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
      {!isAdmin && tab === 'nueva' && <NuevaSolicitudForm key={auditorioInicial} userId={user.id} esExterno={user.rol === 'externo'} auditorioInicial={auditorioInicial} onCreated={() => setTab('lista')} />}
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