import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Users, Search, Filter, TicketCheck } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { getEventosPublicados, reservarCupo, getMisReservas, getCategorias } from '../lib/db'
import type { Evento, Reserva } from '../lib/types'

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function CatalogoPage() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [misReservas, setMisReservas] = useState<Reserva[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nombre: string; color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [reservando, setReservando] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<{ text: string; ok: boolean } | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [evts, res, cats] = await Promise.all([
        getEventosPublicados(),
        getMisReservas(user.id),
        getCategorias(),
      ])
      setEventos(evts)
      setMisReservas(res as Reserva[])
      setCategorias(cats as typeof categorias)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const reservadosIds = new Set(misReservas.filter(r => r.estado === 'confirmada').map(r => r.evento_id))

  const filtrados = eventos.filter(e => {
    const matchSearch = !search || e.titulo.toLowerCase().includes(search.toLowerCase()) || (e.ponente ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoriaFiltro || e.categoria_id === categoriaFiltro
    return matchSearch && matchCat
  })

  const handleReservar = async (eventoId: string) => {
    if (!user) return
    setReservando(eventoId)
    try {
      await reservarCupo(eventoId, user.id)
      setMensaje({ text: '¡Reserva confirmada! Revisa "Mis Reservas" para ver tu entrada.', ok: true })
      load()
    } catch (e: unknown) {
      setMensaje({ text: e instanceof Error ? e.message : 'No se pudo reservar', ok: false })
    } finally {
      setReservando(null)
      setTimeout(() => setMensaje(null), 4000)
    }
  }

  return (
    <Layout title="Catálogo de Eventos" subtitle="Eventos disponibles para inscripción">
      {/* Toast */}
      {mensaje && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: 70, right: 20, zIndex: 200,
            background: mensaje.ok ? '#2e7d32' : '#c62828', color: '#fff',
            padding: '12px 20px', borderRadius: 10, fontSize: 14, maxWidth: 380,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {mensaje.text}
        </motion.div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar evento o ponente..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e' }} />
          <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
            style={{ padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', minWidth: 180 }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#bdbdbd' }}>
          <CalendarDays size={48} />
          <p style={{ marginTop: 12 }}>No se encontraron eventos</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtrados.map((e, i) => {
            const yaReservado = reservadosIds.has(e.id)
            const sinCupos = (e.cupos_disponibles ?? 0) <= 0
            const enCurso = reservando === e.id

            return (
              <motion.div key={e.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8eaed', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* Color accent bar */}
                <div style={{ height: 4, background: e.categoria_color ?? '#1565c0' }} />

                <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {e.categoria_nombre && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: e.categoria_color ?? '#1565c0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>
                      {e.categoria_nombre}
                    </span>
                  )}
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a237e', margin: '0 0 8px', lineHeight: 1.4 }}>{e.titulo}</h3>

                  {e.descripcion && (
                    <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.5, flex: 1 }}>
                      {e.descripcion.length > 120 ? e.descripcion.slice(0, 120) + '...' : e.descripcion}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#555', marginBottom: 14 }}>
                    <span>📅 {fmtFecha(e.fecha_inicio)}</span>
                    <span>📍 {e.auditorio_nombre}</span>
                    {e.ponente && <span>🎤 {e.ponente}</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={13} />
                      <span>{e.cupos_reservados}/{e.cupo_maximo} inscritos</span>
                      {sinCupos && (
                        <span style={{ background: '#ffebee', color: '#d32f2f', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>COMPLETO</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => !yaReservado && !sinCupos && handleReservar(e.id)}
                    disabled={yaReservado || sinCupos || enCurso}
                    style={{
                      width: '100%', padding: '11px', border: 'none', borderRadius: 10,
                      background: yaReservado ? '#e8f5e9' : sinCupos ? '#f5f5f5' : enCurso ? '#90caf9' : '#1565c0',
                      color: yaReservado ? '#2e7d32' : sinCupos ? '#9e9e9e' : '#fff',
                      cursor: yaReservado || sinCupos || enCurso ? 'not-allowed' : 'pointer',
                      fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <TicketCheck size={16} />
                    {yaReservado ? 'Ya estás inscrito' : sinCupos ? 'Sin cupos' : enCurso ? 'Reservando...' : 'Reservar cupo'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
