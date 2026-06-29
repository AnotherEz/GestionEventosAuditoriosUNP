import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Plus, Edit2, Trash2, X, Users, Eye,
  CheckCircle, Clock, PlayCircle, ArchiveX,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import {
  getEventosAdmin, getMisEventos, upsertEvento, updateEventoEstado, deleteEvento,
  getAuditorios, getCategorias, getAsistentesEvento,
} from '../lib/db'
import type { Evento, Auditorio } from '../lib/types'

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  borrador:   { label: 'Borrador',   color: '#e65100', bg: '#fff3e0', icon: Clock },
  publicado:  { label: 'Publicado',  color: '#2e7d32', bg: '#e8f5e9', icon: CheckCircle },
  en_curso:   { label: 'En curso',   color: '#1565c0', bg: '#e3f2fd', icon: PlayCircle },
  finalizado: { label: 'Finalizado', color: '#757575', bg: '#f5f5f5', icon: ArchiveX },
  cancelado:  { label: 'Cancelado',  color: '#d32f2f', bg: '#ffebee', icon: X },
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CFG[estado] ?? ESTADO_CFG.borrador
  const Icon = cfg.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 10, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600 }}>
      <Icon size={11} /> {cfg.label}
    </span>
  )
}

interface FormData {
  id?: string
  titulo: string
  descripcion: string
  auditorio_id: string
  categoria_id: string
  fecha_inicio: string
  fecha_fin: string
  cupo_maximo: number
  ponente: string
  estado: Evento['estado']
  organizador_id?: string
}

const EMPTY_FORM: FormData = {
  titulo: '', descripcion: '', auditorio_id: '', categoria_id: '',
  fecha_inicio: '', fecha_fin: '', cupo_maximo: 0, ponente: '', estado: 'borrador',
}

// ── Asistentes modal ────────────────────────────────────────────────────────

function AsistentesModal({ eventoId, titulo, onClose }: { eventoId: string; titulo: string; onClose: () => void }) {
  const [asistentes, setAsistentes] = useState<{ usuarios: { nombres: string; apellidos: string; email: string; rol: string } | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAsistentesEvento(eventoId)
      .then(data => setAsistentes(data as typeof asistentes))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [eventoId])

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: '#fff', borderRadius: 16, padding: 28, width: '90%', maxWidth: 520,
          maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 101,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a237e', margin: 0 }}>Asistentes</h2>
            <p style={{ fontSize: 12, color: '#9e9e9e', margin: 0 }}>{titulo}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <span style={{ width: 28, height: 28, border: '2px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : asistentes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#bdbdbd', padding: 32 }}>Sin asistentes inscritos</p>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>{asistentes.length} inscritos</p>
            {asistentes.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565c0', fontSize: 13, fontWeight: 700 }}>
                  {(a.usuarios?.nombres?.[0] ?? '?').toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#212121', margin: 0 }}>
                    {a.usuarios ? `${a.usuarios.nombres} ${a.usuarios.apellidos}` : 'Usuario'}
                  </p>
                  <p style={{ fontSize: 12, color: '#9e9e9e', margin: 0 }}>{a.usuarios?.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  )
}

// ── Event Form Modal ─────────────────────────────────────────────────────────

function EventoForm({ initial, organizadorId, auditorios, categorias, onSave, onClose }: {
  initial: FormData
  organizadorId: string
  auditorios: Auditorio[]
  categorias: { id: string; nombre: string }[]
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const f = <K extends keyof FormData>(k: K) => (v: FormData[K]) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.auditorio_id || !form.fecha_inicio || !form.fecha_fin) {
      setError('Completa los campos obligatorios: título, auditorio y fechas')
      return
    }
    setSaving(true)
    try {
      await upsertEvento({
        ...(form.id ? { id: form.id } : {}),
        titulo: form.titulo.trim(),
        descripcion: form.descripcion || undefined,
        auditorio_id: form.auditorio_id,
        categoria_id: form.categoria_id || undefined,
        fecha_inicio: new Date(form.fecha_inicio).toISOString(),
        fecha_fin: new Date(form.fecha_fin).toISOString(),
        cupo_maximo: Number(form.cupo_maximo),
        ponente: form.ponente || undefined,
        estado: form.estado,
        organizador_id: form.organizador_id ?? organizadorId,
      })
      onSave()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: '#fff', borderRadius: 16, padding: 28, width: '90%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto', zIndex: 101,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a237e', margin: 0 }}>
            {form.id ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FField label="Título *" value={form.titulo} onChange={f('titulo')} />
          <FField label="Descripción" value={form.descripcion} onChange={f('descripcion')} multiline />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Auditorio *</label>
              <select value={form.auditorio_id} onChange={e => f('auditorio_id')(e.target.value)} style={selectStyle}>
                <option value="">Seleccionar...</option>
                {auditorios.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select value={form.categoria_id} onChange={e => f('categoria_id')(e.target.value)} style={selectStyle}>
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FField label="Fecha inicio *" value={form.fecha_inicio} onChange={f('fecha_inicio')} type="datetime-local" />
            <FField label="Fecha fin *" value={form.fecha_fin} onChange={f('fecha_fin')} type="datetime-local" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FField label="Cupo máximo" value={String(form.cupo_maximo)} onChange={v => f('cupo_maximo')(Number(v) as unknown as FormData['cupo_maximo'])} type="number" />
            <FField label="Ponente" value={form.ponente} onChange={f('ponente')} />
          </div>

          <div>
            <label style={labelStyle}>Estado</label>
            <select value={form.estado} onChange={e => f('estado')(e.target.value as Evento['estado'])} style={selectStyle}>
              {Object.entries(ESTADO_CFG).filter(([k]) => k !== 'cancelado').map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', border: '1px solid #e0e0e0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 20px', border: 'none', borderRadius: 10,
            background: saving ? '#90caf9' : '#1565c0', color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
          }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }
const selectStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' }

function FField({ label, value, onChange, multiline, type }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string
}) {
  const s: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', resize: multiline ? 'vertical' : undefined }
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {multiline
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} style={s} />
        : <input type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)} style={s} />
      }
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EventosPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'admin'

  const [eventos, setEventos] = useState<Evento[]>([])
  const [auditorios, setAuditorios] = useState<Auditorio[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEvento, setEditEvento] = useState<FormData | null>(null)
  const [viewAsistentes, setViewAsistentes] = useState<{ id: string; titulo: string } | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const load = async () => {
    setLoading(true)
    try {
      const [evts, auds, cats] = await Promise.all([
        isAdmin ? getEventosAdmin() : getMisEventos(user!.id),
        getAuditorios(),
        getCategorias(),
      ])
      setEventos(evts)
      setAuditorios(auds.filter(a => a.activo))
      setCategorias(cats)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Cancelar este evento?')) return
    await deleteEvento(id)
    load()
  }

  const handleEstado = async (id: string, estado: Evento['estado']) => {
    await updateEventoEstado(id, estado)
    load()
  }

  const openCreate = () => {
    setEditEvento({ ...EMPTY_FORM })
    setShowForm(true)
  }

  const openEdit = (e: Evento) => {
    setEditEvento({
      id: e.id,
      titulo: e.titulo,
      descripcion: e.descripcion ?? '',
      auditorio_id: e.auditorio_id,
      categoria_id: e.categoria_id ?? '',
      fecha_inicio: e.fecha_inicio.slice(0, 16),
      fecha_fin: e.fecha_fin.slice(0, 16),
      cupo_maximo: e.cupo_maximo,
      ponente: e.ponente ?? '',
      estado: e.estado,
      organizador_id: e.organizador_id,
    })
    setShowForm(true)
  }

  const filtrados = filtroEstado === 'todos' ? eventos : eventos.filter(e => e.estado === filtroEstado)

  if (!user) return null

  return (
    <Layout title={isAdmin ? 'Gestión de Eventos' : 'Mis Eventos'}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['todos', 'borrador', 'publicado', 'en_curso', 'finalizado'].map(s => (
            <button key={s} onClick={() => setFiltroEstado(s)} style={{
              padding: '6px 14px', borderRadius: 20, border: `1px solid ${filtroEstado === s ? '#1565c0' : '#e0e0e0'}`,
              background: filtroEstado === s ? '#e8f0fe' : '#fff',
              color: filtroEstado === s ? '#1565c0' : '#555',
              fontSize: 12, fontWeight: filtroEstado === s ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
            }}>
              {s === 'todos' ? 'Todos' : ESTADO_CFG[s]?.label ?? s}
            </button>
          ))}
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: '#1565c0', color: '#fff',
          border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Plus size={17} /> Nuevo Evento
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#bdbdbd' }}>
          <CalendarDays size={48} />
          <p style={{ marginTop: 12 }}>No hay eventos en esta categoría</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtrados.map((e, i) => (
            <motion.div key={e.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', padding: '16px 20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    {e.categoria_color && (
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.categoria_color, flexShrink: 0 }} />
                    )}
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a237e', margin: 0 }}>{e.titulo}</h3>
                    <EstadoBadge estado={e.estado} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#555' }}>
                    <span>📍 {e.auditorio_nombre}</span>
                    <span>📅 {fmtFecha(e.fecha_inicio)}</span>
                    <span><Users size={13} style={{ verticalAlign: 'middle' }} /> {e.cupos_reservados}/{e.cupo_maximo}</span>
                    {e.ponente && <span>🎤 {e.ponente}</span>}
                    {isAdmin && e.organizador_nombre && <span>👤 {e.organizador_nombre}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  {e.estado === 'borrador' && (
                    <ActionBtn label="Publicar" color="#2e7d32" onClick={() => handleEstado(e.id, 'publicado')} />
                  )}
                  {e.estado === 'publicado' && (
                    <ActionBtn label="En curso" color="#1565c0" onClick={() => handleEstado(e.id, 'en_curso')} />
                  )}
                  {e.estado === 'en_curso' && (
                    <ActionBtn label="Finalizar" color="#757575" onClick={() => handleEstado(e.id, 'finalizado')} />
                  )}
                  <button onClick={() => setViewAsistentes({ id: e.id, titulo: e.titulo })}
                    style={{ ...btnStyle, color: '#555', borderColor: '#e0e0e0' }}>
                    <Eye size={14} />
                  </button>
                  <button onClick={() => openEdit(e)} style={{ ...btnStyle, color: '#1565c0', borderColor: '#bbdefb' }}>
                    <Edit2 size={14} />
                  </button>
                  {(isAdmin || e.estado === 'borrador') && (
                    <button onClick={() => handleDelete(e.id)} style={{ ...btnStyle, color: '#d32f2f', borderColor: '#ffcdd2' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showForm && editEvento && (
          <EventoForm
            initial={editEvento}
            organizadorId={user.id}
            auditorios={auditorios}
            categorias={categorias}
            onSave={() => { setShowForm(false); load() }}
            onClose={() => setShowForm(false)}
          />
        )}
        {viewAsistentes && (
          <AsistentesModal
            eventoId={viewAsistentes.id}
            titulo={viewAsistentes.titulo}
            onClose={() => setViewAsistentes(null)}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'inherit',
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', border: `1px solid ${color}`, borderRadius: 8,
      background: '#fff', color, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    }}>
      {label}
    </button>
  )
}
