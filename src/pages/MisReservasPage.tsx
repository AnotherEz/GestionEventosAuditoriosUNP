import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TicketCheck, X, QrCode } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { getMisReservas, cancelarReserva } from '../lib/db'
import type { Reserva, Evento } from '../lib/types'

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ESTADO_RESERVA: Record<string, { label: string; color: string; bg: string }> = {
  confirmada: { label: 'Confirmada', color: '#2e7d32', bg: '#e8f5e9' },
  cancelada:  { label: 'Cancelada',  color: '#9e9e9e', bg: '#f5f5f5' },
  asistio:    { label: 'Asistió',    color: '#1565c0', bg: '#e3f2fd' },
}

export default function MisReservasPage() {
  const { user } = useAuth()
  const [reservas, setReservas] = useState<(Reserva & { evento?: Evento })[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'confirmada' | 'todas'>('confirmada')

  const load = () => {
    if (!user) return
    setLoading(true)
    getMisReservas(user.id).then(setReservas).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user])

  const handleCancelar = async (id: string) => {
    if (!confirm('¿Cancelar tu reserva para este evento?')) return
    setCancelando(id)
    try {
      await cancelarReserva(id)
      load()
    } catch (e) { console.error(e) }
    setCancelando(null)
  }

  const filtradas = filtro === 'todas' ? reservas : reservas.filter(r => r.estado === filtro)

  return (
    <Layout title="Mis Reservas" subtitle="Tus inscripciones a eventos">
      {/* Filtro */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['confirmada', 'todas'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '7px 16px', borderRadius: 20, border: `1px solid ${filtro === f ? '#1565c0' : '#e0e0e0'}`,
            background: filtro === f ? '#e8f0fe' : '#fff', color: filtro === f ? '#1565c0' : '#555',
            fontSize: 13, fontWeight: filtro === f ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {f === 'confirmada' ? 'Activas' : 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#bdbdbd' }}>
          <TicketCheck size={48} />
          <p style={{ marginTop: 12, fontSize: 14 }}>
            {filtro === 'confirmada' ? 'No tienes reservas activas. ¡Explora el catálogo de eventos!' : 'No tienes reservas registradas'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtradas.map((r, i) => {
            const cfg = ESTADO_RESERVA[r.estado] ?? ESTADO_RESERVA.confirmada
            const e = r.evento
            const pasado = e ? new Date(e.fecha_inicio) < new Date() : false

            return (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{
                  background: '#fff', borderRadius: 14, border: '1px solid #e8eaed',
                  overflow: 'hidden', opacity: r.estado === 'cancelada' ? 0.65 : 1,
                }}
              >
                {/* Accent */}
                <div style={{ height: 4, background: e?.categoria_color ?? '#1565c0' }} />

                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      {e?.categoria_nombre && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: e.categoria_color ?? '#1565c0', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                          {e.categoria_nombre}
                        </span>
                      )}
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a237e', margin: 0 }}>{e?.titulo ?? 'Evento'}</h3>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 10, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {cfg.label}
                    </span>
                  </div>

                  {e && (
                    <div style={{ fontSize: 13, color: '#555', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
                      <span>📅 {fmtFecha(e.fecha_inicio)}</span>
                      <span>📍 {e.auditorio_nombre}</span>
                      {e.ponente && <span>🎤 {e.ponente}</span>}
                    </div>
                  )}

                  {/* Código QR placeholder */}
                  {r.estado === 'confirmada' && (
                    <div style={{
                      border: '1px dashed #e0e0e0', borderRadius: 10, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, background: '#fafafa',
                    }}>
                      <QrCode size={28} color="#1565c0" />
                      <div>
                        <p style={{ fontSize: 11, color: '#9e9e9e', margin: 0 }}>Código de entrada</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#212121', margin: 0, fontFamily: 'monospace' }}>{r.codigo_qr}</p>
                      </div>
                    </div>
                  )}

                  {r.estado === 'confirmada' && !pasado && (
                    <button
                      onClick={() => handleCancelar(r.id)}
                      disabled={cancelando === r.id}
                      style={{
                        width: '100%', padding: '9px', border: '1px solid #ffcdd2', borderRadius: 10,
                        background: '#fff', color: '#d32f2f', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <X size={14} />
                      {cancelando === r.id ? 'Cancelando...' : 'Cancelar reserva'}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
