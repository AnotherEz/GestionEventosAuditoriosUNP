import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, Users, MapPin, ClipboardList, Tag } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { getAuditorios, getFacultades } from '../lib/db'
import type { Auditorio } from '../lib/types'

const REGLA_LABEL: Record<string, string> = {
  por_tiempo: 'Medio día = 50% de la tarifa',
  plana_dia: 'Tarifa plana por día o fracción',
  plana_evento: 'Tarifa única por evento',
}

export default function AuditorioDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [auditorio, setAuditorio] = useState<Auditorio | null>(null)
  const [facultadNombre, setFacultadNombre] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAuditorios(), getFacultades()])
      .then(([auds, facs]) => {
        const a = auds.find(x => x.id === id) ?? null
        setAuditorio(a)
        if (a?.facultad_id) {
          const f = facs.find(x => x.id === a.facultad_id)
          if (f) setFacultadNombre(`${f.siglas} — ${f.nombre}`)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const puedeSolicitar = user && user.rol !== 'admin' && auditorio?.activo

  if (loading) {
    return (
      <Layout title="Auditorio">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </Layout>
    )
  }

  if (!auditorio) {
    return (
      <Layout title="Auditorio no encontrado">
        <div style={{ textAlign: 'center', padding: 60, color: '#bdbdbd' }}>
          <Building2 size={48} />
          <p style={{ marginTop: 12 }}>El auditorio no existe o fue eliminado.</p>
          <button onClick={() => navigate('/auditorios')} style={{
            marginTop: 16, padding: '10px 20px', background: '#1565c0', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
          }}>
            Volver a auditorios
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={auditorio.nombre} subtitle={facultadNombre || auditorio.ubicacion}>
      <button onClick={() => navigate('/auditorios')} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        color: '#1565c0', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        padding: 0, marginBottom: 20,
      }}>
        <ArrowLeft size={16} /> Volver a auditorios
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, maxWidth: 980 }}
      >
        {/* Columna principal: información */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8eaed', overflow: 'hidden' }}>
          {/* Cabecera visual */}
          <div style={{
            height: 160, background: 'linear-gradient(135deg, #1565c0 0%, #1a237e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <Building2 size={64} color="rgba(255,255,255,0.85)" strokeWidth={1.2} />
            {!auditorio.activo && (
              <span style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 12 }}>
                No disponible
              </span>
            )}
          </div>

          <div style={{ padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a237e', margin: '0 0 12px' }}>{auditorio.nombre}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#555', margin: 0 }}>
                <Users size={16} color="#1565c0" />
                <strong>{auditorio.capacidad}</strong>&nbsp;personas de capacidad
              </p>
              {auditorio.ubicacion && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#555', margin: 0 }}>
                  <MapPin size={16} color="#1565c0" /> {auditorio.ubicacion}
                </p>
              )}
              {facultadNombre && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#555', margin: 0 }}>
                  <Building2 size={16} color="#1565c0" /> {facultadNombre}
                </p>
              )}
            </div>

            {auditorio.descripcion && (
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: '0 0 16px' }}>{auditorio.descripcion}</p>
            )}

            {(auditorio.equipamiento?.length ?? 0) > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1a237e', margin: '0 0 8px' }}>Equipamiento incluido</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {auditorio.equipamiento!.map(eq => (
                    <span key={eq} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 12, background: '#e8f5e9', color: '#2e7d32' }}>
                      {eq}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Columna lateral: tarifas + acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8eaed', padding: 24 }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1a237e', margin: '0 0 16px' }}>
              <Tag size={16} /> Tarifas de alquiler (TUSNE)
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, background: '#e8f0fe', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#5f6368', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Comunidad UNP</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#1565c0', margin: 0 }}>S/ {auditorio.precio_interno.toFixed(2)}</p>
              </div>
              <div style={{ flex: 1, background: '#fff3e0', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#5f6368', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Público externo</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#e65100', margin: 0 }}>S/ {auditorio.precio_externo.toFixed(2)}</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#757575', margin: 0, textAlign: 'center' }}>
              {REGLA_LABEL[auditorio.regla_cobro]}
            </p>
          </div>

          {puedeSolicitar && (
            <button onClick={() => navigate(`/nueva-solicitud?auditorio=${auditorio.id}`)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#1565c0', color: '#fff', border: 'none', borderRadius: 14,
              padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(21,101,192,0.35)',
            }}>
              <ClipboardList size={20} /> Solicitar este auditorio
            </button>
          )}
          {user?.rol === 'admin' && (
            <p style={{ fontSize: 12, color: '#9e9e9e', textAlign: 'center', margin: 0 }}>
              Como administrador gestionas las solicitudes desde la bandeja de Solicitudes.
            </p>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
