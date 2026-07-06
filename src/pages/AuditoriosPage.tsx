import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Plus, Edit2, ToggleLeft, ToggleRight, X, Check, Users } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { getAuditorios, upsertAuditorio, toggleAuditorio } from '../lib/db'
import type { Auditorio } from '../lib/types'

const EQUIPAMIENTO_OPTIONS = ['Proyector', 'Ecran', 'Micrófono', 'Aire acondicionado', 'WiFi', 'Sonido profesional', 'Cámaras', 'Iluminación escénica']

function Badge({ text, color = '#1565c0' }: { text: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 10, background: `${color}18`, color,
    }}>{text}</span>
  )
}

interface FormData {
  id?: string
  nombre: string
  descripcion: string
  capacidad: number
  ubicacion: string
  equipamiento: string[]
  activo: boolean
}

const EMPTY_FORM: FormData = { nombre: '', descripcion: '', capacidad: 0, ubicacion: '', equipamiento: [], activo: true }

export default function AuditoriosPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'admin'

  const [auditorios, setAuditorios] = useState<Auditorio[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    getAuditorios().then(setAuditorios).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setShowForm(true) }
  const openEdit = (a: Auditorio) => {
    setForm({
      id: a.id, nombre: a.nombre, descripcion: a.descripcion ?? '',
      capacidad: a.capacidad, ubicacion: a.ubicacion ?? '',
      equipamiento: a.equipamiento ?? [], activo: a.activo,
    })
    setError('')
    setShowForm(true)
  }

  const handleToggle = async (a: Auditorio) => {
    try { await toggleAuditorio(a.id, !a.activo); load() } catch { /* ignore */ }
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (form.capacidad <= 0) { setError('La capacidad debe ser mayor a 0'); return }
    setSaving(true)
    try {
      await upsertAuditorio({ ...form, nombre: form.nombre.trim() })
      setShowForm(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleEquip = (eq: string) => {
    setForm(f => ({
      ...f,
      equipamiento: f.equipamiento.includes(eq)
        ? f.equipamiento.filter(x => x !== eq)
        : [...f.equipamiento, eq],
    }))
  }

  return (
    <Layout title="Auditorios" subtitle="Espacios disponibles para eventos">
      {/* Header action */}
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button onClick={openCreate} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#1565c0', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Plus size={17} /> Nuevo Auditorio
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : auditorios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#bdbdbd' }}>
          <Building2 size={48} />
          <p style={{ marginTop: 12 }}>No hay auditorios registrados</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {auditorios.map((a, i) => (
            <motion.div key={a.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{
                background: '#fff', borderRadius: 14, border: '1px solid #e8eaed',
                overflow: 'hidden', opacity: a.activo ? 1 : 0.6,
              }}
            >
              {/* Card header */}
              <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a237e', margin: 0 }}>{a.nombre}</h3>
                  {!a.activo && <Badge text="Inactivo" color="#9e9e9e" />}
                </div>
                {a.descripcion && (
                  <p style={{ fontSize: 13, color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>{a.descripcion}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="#1565c0" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1565c0' }}>{a.capacidad} personas</span>
                </div>
                {a.ubicacion && (
                  <p style={{ fontSize: 12, color: '#9e9e9e', margin: '4px 0 0' }}>📍 {a.ubicacion}</p>
                )}
              </div>

              {/* Equipamiento */}
              {(a.equipamiento?.length ?? 0) > 0 && (
                <div style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {a.equipamiento!.map(eq => <Badge key={eq} text={eq} color="#2e7d32" />)}
                </div>
              )}

              {/* Actions */}
              {isAdmin && (
                <div style={{ padding: '10px 18px', borderTop: '1px solid #f5f5f5', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => openEdit(a)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    border: '1px solid #e8eaed', borderRadius: 8, background: '#fff',
                    cursor: 'pointer', fontSize: 13, color: '#555', fontFamily: 'inherit',
                  }}>
                    <Edit2 size={14} /> Editar
                  </button>
                  <button onClick={() => handleToggle(a)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    border: `1px solid ${a.activo ? '#d32f2f' : '#2e7d32'}`,
                    borderRadius: 8, background: '#fff',
                    cursor: 'pointer', fontSize: 13, color: a.activo ? '#d32f2f' : '#2e7d32', fontFamily: 'inherit',
                  }}>
                    {a.activo ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                    {a.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal form CORREGIDO */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 999, backdropFilter: 'blur(2px)' }}
            />
            <motion.div
              // LA MAGIA: Forzamos el -50% desde Framer
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                background: '#fff', borderRadius: 16, padding: 32, width: '90%', maxWidth: 540,
                maxHeight: '90vh', overflowY: 'auto', zIndex: 1000,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a237e', margin: 0 }}>
                  {form.id ? 'Editar Auditorio' : 'Nuevo Auditorio'}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563', transition: 'background 0.2s' }}>
                  <X size={20} />
                </button>
              </div>

              {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Nombre *" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} />
                <Field label="Descripción" value={form.descripcion} onChange={v => setForm(f => ({ ...f, descripcion: v }))} multiline />
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <Field label="Capacidad (personas) *" value={String(form.capacidad)} onChange={v => setForm(f => ({ ...f, capacidad: Number(v) }))} type="number" />
                  <Field label="Ubicación" value={form.ubicacion} onChange={v => setForm(f => ({ ...f, ubicacion: v }))} />
                </div>

                <div>
                  <p style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: 600 }}>Equipamiento</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {EQUIPAMIENTO_OPTIONS.map(eq => {
                      const sel = form.equipamiento.includes(eq)
                      return (
                        <button key={eq} onClick={() => toggleEquip(eq)} style={{
                          padding: '6px 14px', borderRadius: 20, border: `1px solid ${sel ? '#1565c0' : '#d1d5db'}`,
                          background: sel ? '#e8f0fe' : '#fff', color: sel ? '#1565c0' : '#4b5563',
                          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                        }}>
                          {sel && <Check size={14} />} {eq}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: '10px 20px', border: '1px solid #e0e0e0', borderRadius: 10,
                  background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', color: '#555'
                }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} style={{
                  padding: '10px 24px', border: 'none', borderRadius: 10,
                  background: saving ? '#90caf9' : '#1565c0', color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                  transition: 'background 0.2s'
                }}>
                  {saving ? 'Guardando...' : 'Guardar Auditorio'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  )
}

function Field({ label, value, onChange, multiline, type }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string
}) {
  const style: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    resize: multiline ? 'vertical' : undefined, color: '#1f2937', transition: 'border-color 0.2s'
  }
  return (
    <div>
      <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label>
      {multiline
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} style={style} />
        : <input type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)} style={style} />
      }
    </div>
  )
}