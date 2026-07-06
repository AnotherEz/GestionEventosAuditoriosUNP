import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, X, Download, CalendarDays, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react'
import QRCode from 'react-qr-code'
import html2canvas from 'html2canvas'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
// Asegúrate de que estas funciones existan en tu backend PHP/DB
import { getMisReservas, cancelarReserva } from '../lib/db'
import type { Reserva, Evento } from '../lib/types'

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { 
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  })
}

const ESTADO_RESERVA: Record<string, { label: string; color: string; bg: string }> = {
  confirmada: { label: 'Confirmada', color: '#16a34a', bg: '#dcfce7' },
  cancelada:  { label: 'Cancelada',  color: '#64748b', bg: '#f1f5f9' },
  asistio:    { label: 'Asistió',    color: '#1565c0', bg: '#e0f2fe' },
}

export default function MisReservasPage() {
  const { user } = useAuth()
  const [reservas, setReservas] = useState<(Reserva & { evento?: Evento })[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'confirmada' | 'todas'>('confirmada')
  
  // Estados para la Fricción Positiva de Cancelación
  const [reservaACancelar, setReservaACancelar] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)

  const load = () => {
    if (!user) return
    setLoading(true)
    getMisReservas(user.id)
      .then(setReservas)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user])

  const handleCancelar = async () => {
    if (!reservaACancelar) return
    setProcesando(true)
    try {
      await cancelarReserva(reservaACancelar)
      load() // Recargar para actualizar estados
    } catch (e) {
      console.error(e)
      alert("No se pudo cancelar la reserva.")
    } finally {
      setProcesando(false)
      setReservaACancelar(null)
    }
  }

  const handleDescargarTicket = async (reservaId: string, tituloEvento: string) => {
    const ticketElement = document.getElementById(`ticket-${reservaId}`)
    if (!ticketElement) return

    setDescargando(reservaId)
    try {
      // Configuramos html2canvas para una captura limpia
      const canvas = await html2canvas(ticketElement, {
        scale: 2, // Mejor resolución
        backgroundColor: '#ffffff',
        logging: false
      })
      
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `Ticket_${tituloEvento.replace(/\s+/g, '_')}.png`
      link.click()
    } catch (error) {
      console.error('Error al descargar el ticket:', error)
      alert('Hubo un problema al generar la imagen del ticket.')
    } finally {
      setDescargando(null)
    }
  }

  const filtradas = filtro === 'todas' ? reservas : reservas.filter(r => r.estado === filtro)

  if (!user) return null

  return (
    <Layout title="Mis Reservas">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>Mis Entradas</h1>
        <p style={{ color: '#6b7280', fontSize: 15, marginTop: 4 }}>
          Gestiona tus reservas y descarga tus códigos de acceso.
        </p>
      </div>

      {/* Filtro Tipo Píldora */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {(['confirmada', 'todas'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '8px 18px', borderRadius: 20, 
            border: `1px solid ${filtro === f ? '#1565c0' : '#e5e7eb'}`,
            background: filtro === f ? '#eff6ff' : '#fff', 
            color: filtro === f ? '#1565c0' : '#4b5563',
            fontSize: 14, fontWeight: filtro === f ? 600 : 500, 
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
          }}>
            {f === 'confirmada' ? 'Activas' : 'Historial completo'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', background: '#fff', borderRadius: 16, border: '1px dashed #d1d5db' }}>
          <Ticket size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ fontSize: 16, fontWeight: 500 }}>
            {filtro === 'confirmada' ? 'No tienes eventos próximos. ¡Ve al catálogo!' : 'Aún no tienes historial de reservas.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {filtradas.map((r, i) => {
            const cfg = ESTADO_RESERVA[r.estado] ?? ESTADO_RESERVA.confirmada
            const e = r.evento
            const pasado = e ? new Date(e.fecha_inicio) < new Date() : false
            const isConfirmada = r.estado === 'confirmada'

            return (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ opacity: isConfirmada ? 1 : 0.65, transition: 'opacity 0.3s' }}
              >
                {/* EL TICKET VISUAL 
                  Le asignamos un ID para que html2canvas pueda capturar este div específico
                */}
                <div id={`ticket-${r.id}`} style={{ 
                  background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', 
                  overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  position: 'relative'
                }}>
                  {/* Acento superior de color */}
                  <div style={{ height: 6, background: e?.categoria_color ?? '#1565c0' }} />

                  {/* Sección Info Evento */}
                  <div style={{ padding: '24px 24px 20px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: e?.categoria_color ?? '#1565c0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {e?.categoria_nombre || 'UNP Eventos'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 12, background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', margin: '0 0 16px 0', lineHeight: 1.3 }}>
                      {e?.titulo ?? 'Evento Desconocido'}
                    </h3>
                    
                    {e && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#4b5563' }}>
                          <CalendarDays size={16} color="#64748b" />
                          <span style={{ textTransform: 'capitalize' }}>{fmtFecha(e.fecha_inicio)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#4b5563' }}>
                          <MapPin size={16} color="#64748b" />
                          <span>{e.auditorio_nombre}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Separador Perforado (Efecto Ticket) */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 16, height: 16, background: '#f8fafc', borderRadius: '50%', marginLeft: -8, borderRight: '1px solid #e5e7eb' }} />
                    <div style={{ flex: 1, borderTop: '2px dashed #cbd5e1', margin: '0 8px' }} />
                    <div style={{ width: 16, height: 16, background: '#f8fafc', borderRadius: '50%', marginRight: -8, borderLeft: '1px solid #e5e7eb' }} />
                  </div>

                  {/* Sección Código QR */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc' }}>
                    {isConfirmada ? (
                      <>
                        <div style={{ padding: 12, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', marginBottom: 12 }}>
                          {/* El componente Real QRCode */}
                          <QRCode value={r.codigo_qr || r.id} size={140} level="M" fgColor="#1e293b" />
                        </div>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>CÓDIGO DE ENTRADA</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                          {r.codigo_qr || 'TICKET-UNP'}
                        </p>
                      </>
                    ) : (
                      <div style={{ padding: '20px 0', opacity: 0.5, textAlign: 'center' }}>
                        <X size={40} color="#64748b" style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', margin: 0 }}>Ticket Invalidado</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones (Fuera del contenedor del ticket para que no salgan en la descarga) */}
                {isConfirmada && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      onClick={() => handleDescargarTicket(r.id, e?.titulo || 'Evento')}
                      disabled={descargando === r.id}
                      style={{
                        flex: 1, padding: '10px', border: '1px solid #bfdbfe', borderRadius: 10,
                        background: '#eff6ff', color: '#1565c0', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s'
                      }}
                    >
                      <Download size={16} />
                      {descargando === r.id ? 'Guardando...' : 'Descargar'}
                    </button>
                    
                    {!pasado && (
                      <button
                        onClick={() => setReservaACancelar(r.id)}
                        style={{
                          flex: 1, padding: '10px', border: '1px solid #fecaca', borderRadius: 10,
                          background: '#fff', color: '#dc2626', cursor: 'pointer',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s'
                        }}
                      >
                        <X size={16} /> Cancelar
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal de Cancelación (Fricción Positiva) */}
      <AnimatePresence>
        {reservaACancelar && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !procesando && setReservaACancelar(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 999, backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                background: '#fff', borderRadius: 20, padding: '24px', width: '90%', maxWidth: 400,
                zIndex: 1000, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={24} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', margin: '0 0 4px 0' }}>Cancelar reserva</h3>
                  <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    ¿Estás seguro de que deseas cancelar tu asistencia? Liberarás este cupo para otro compañero.
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => setReservaACancelar(null)}
                  disabled={procesando}
                  style={{
                    flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: 10,
                    background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  No, mantener
                </button>
                <button 
                  onClick={handleCancelar}
                  disabled={procesando}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                    background: procesando ? '#fca5a5' : '#dc2626', color: '#fff', 
                    fontSize: 14, fontWeight: 600, cursor: procesando ? 'not-allowed' : 'pointer'
                  }}
                >
                  {procesando ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  )
}