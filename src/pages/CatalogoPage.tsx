import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, MapPin, Users, AlertCircle, X, CheckCircle2, TicketCheck } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import { getEventosPublicados, reservarEvento, getMisReservas } from '../lib/db' 
import type { Evento, Reserva } from '../lib/types'

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { 
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
  })
}

export default function CatalogoPage() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>([])
  // Restauramos el estado de misReservas para saber en qué eventos ya estamos
  const [misReservas, setMisReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para nuestra nueva fricción positiva
  const [eventoAConfirmar, setEventoAConfirmar] = useState<Evento | null>(null)
  const [procesandoReserva, setProcesandoReserva] = useState(false)
  const [reservaExitosa, setReservaExitosa] = useState(false)

  const loadEventos = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Cargamos ambos datos en paralelo: Eventos y las reservas del alumno
      const [dataEventos, dataReservas] = await Promise.all([
        getEventosPublicados(),
        getMisReservas(user.id)
      ])
      setEventos(dataEventos)
      setMisReservas(dataReservas)
    } catch (e) {
      console.error("Error cargando el catálogo:", e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEventos()
  }, [user])

  const iniciarReserva = (evento: Evento) => {
    setEventoAConfirmar(evento)
    setReservaExitosa(false)
  }

  const confirmarReserva = async () => {
    if (!eventoAConfirmar || !user) return
    
    setProcesandoReserva(true)
    try {
      await reservarEvento(eventoAConfirmar.id, user.id) 
      setReservaExitosa(true)
      loadEventos() // Refrescamos para actualizar cupos y actualizar 'misReservas'
      
      setTimeout(() => {
        setEventoAConfirmar(null)
        setReservaExitosa(false)
      }, 2500)

    } catch (e) {
      console.error("Error al reservar:", e)
      alert("Hubo un problema al procesar tu reserva. Intenta nuevamente.")
    } finally {
      setProcesandoReserva(false)
    }
  }

  if (!user) return null

  return (
    <Layout title="Catálogo de Eventos">
      
      {/* Header del Catálogo */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>Eventos Disponibles</h1>
        <p style={{ color: '#6b7280', fontSize: 15, marginTop: 4 }}>
          Descubre y reserva tu lugar en los próximos eventos de la universidad.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : eventos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', background: '#fff', borderRadius: 16, border: '1px dashed #d1d5db' }}>
          <CalendarDays size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ fontSize: 16, fontWeight: 500 }}>No hay eventos programados por ahora</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {eventos.map((e, i) => {
            const agotado = e.cupos_reservados >= e.cupo_maximo
            // Restauramos la lógica que verifica si el usuario ya reservó este evento
            const yaReservado = misReservas.some(r => r.evento_id === e.id && r.estado === 'confirmada')

            return (
              <motion.div 
                key={e.id}
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                style={{ 
                  background: '#fff', 
                  borderRadius: 16, 
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: (agotado && !yaReservado) ? 0.65 : 1,
                  filter: (agotado && !yaReservado) ? 'grayscale(40%)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Cabecera de la tarjeta */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1565c0', background: '#e3f2fd', padding: '4px 10px', borderRadius: 12 }}>
                      {e.categoria_nombre || 'General'}
                    </span>
                    {agotado && !yaReservado && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '4px 10px', borderRadius: 12 }}>
                        Agotado
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                    {e.titulo}
                  </h3>
                  <p style={{ fontSize: 14, color: '#4b5563', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {e.descripcion}
                  </p>
                </div>

                {/* Detalles de la tarjeta */}
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    <CalendarDays size={16} color="#64748b" />
                    <span style={{ textTransform: 'capitalize' }}>{fmtFecha(e.fecha_inicio)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    <MapPin size={16} color="#64748b" />
                    <span>{e.auditorio_nombre}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    <Users size={16} color="#64748b" />
                    <span>{e.cupos_reservados} de {e.cupo_maximo} inscritos</span>
                  </div>
                </div>

                {/* Footer y Acción */}
                <div style={{ padding: '16px 20px', background: '#fff', borderTop: '1px solid #f3f4f6' }}>
                  <button 
                    onClick={() => iniciarReserva(e)}
                    disabled={agotado || yaReservado}
                    style={{
                      width: '100%', padding: '12px', border: 'none', borderRadius: 10,
                      // Actualizamos el color del botón según si ya reservó o está agotado
                      background: yaReservado ? '#e8f5e9' : agotado ? '#e5e7eb' : '#1565c0', 
                      color: yaReservado ? '#2e7d32' : agotado ? '#9ca3af' : '#fff',
                      fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                      cursor: (agotado || yaReservado) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'background 0.2s'
                    }}
                  >
                    {yaReservado && <TicketCheck size={18} />}
                    {yaReservado ? 'Ya estás inscrito' : agotado ? 'Sin cupos disponibles' : 'Reservar mi cupo'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal de Confirmación (Fricción Positiva) */}
      <AnimatePresence>
        {eventoAConfirmar && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !procesandoReserva && !reservaExitosa && setEventoAConfirmar(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 999, backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                background: '#fff', borderRadius: 20, padding: 0, width: '90%', maxWidth: 420,
                zIndex: 1000, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {reservaExitosa ? (
                // Estado de Éxito
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
                  >
                    <CheckCircle2 size={32} color="#16a34a" />
                  </motion.div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e1b4b', margin: '0 0 8px 0' }}>¡Reserva confirmada!</h3>
                  <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                    Tu lugar está asegurado. Puedes ver tu entrada en la sección "Mis Reservas".
                  </p>
                </div>
              ) : (
                // Estado de Confirmación
                <>
                  <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={24} color="#1565c0" />
                      </div>
                      <button onClick={() => setEventoAConfirmar(null)} disabled={procesandoReserva} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={20} />
                      </button>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e1b4b', margin: '0 0 8px 0' }}>
                      Confirmar inscripción
                    </h3>
                    <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                      Estás a punto de separar una vacante para el evento: <strong style={{ color: '#1e293b' }}>{eventoAConfirmar.titulo}</strong>.
                    </p>
                  </div>
                  
                  <div style={{ padding: '24px', display: 'flex', gap: 12, background: '#f8fafc' }}>
                    <button 
                      onClick={() => setEventoAConfirmar(null)}
                      disabled={procesandoReserva}
                      style={{
                        flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: 10,
                        background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={confirmarReserva}
                      disabled={procesandoReserva}
                      style={{
                        flex: 1, padding: '12px', border: 'none', borderRadius: 10,
                        background: procesandoReserva ? '#93c5fd' : '#1565c0', color: '#fff', 
                        fontSize: 14, fontWeight: 600, cursor: procesandoReserva ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {procesandoReserva ? 'Confirmando...' : 'Sí, reservar cupo'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  )
}