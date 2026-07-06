import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Shield, GraduationCap, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react'
import Layout from '../components/Layout'
import { getUsuarios, updateUsuarioRol, toggleUsuario } from '../lib/db'
import type { Usuario } from '../lib/types'

const ROL_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  admin:   { label: 'Admin',   color: '#6a1b9a', bg: '#f3e5f5', icon: Shield },
  docente: { label: 'Docente', color: '#1565c0', bg: '#e3f2fd', icon: BookOpen },
  alumno:  { label: 'Alumno',  color: '#2e7d32', bg: '#e8f5e9', icon: GraduationCap },
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<(Usuario & { carrera_nombre?: string; facultad_nombre?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroRol, setFiltroRol] = useState<'todos' | 'admin' | 'docente' | 'alumno'>('todos')
  const [cambiando, setCambiando] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getUsuarios().then(u => setUsuarios(u as typeof usuarios)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggleActivo = async (u: Usuario) => {
    setCambiando(u.id + '_activo')
    try { await toggleUsuario(u.id, !u.activo); load() }
    catch (e) { console.error(e) }
    finally { setCambiando(null) }
  }

  const handleCambiarRol = async (u: Usuario, nuevoRol: 'alumno' | 'docente') => {
    if (u.rol === 'admin') return
    if (!confirm(`¿Cambiar rol de ${u.nombres} a ${nuevoRol}?`)) return
    setCambiando(u.id + '_rol')
    try { await updateUsuarioRol(u.id, nuevoRol); load() }
    catch (e) { console.error(e) }
    finally { setCambiando(null) }
  }

  const filtrados = usuarios.filter(u => {
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    const matchSearch = !search || (
      `${u.nombres} ${u.apellidos} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    )
    return matchRol && matchSearch
  })

  return (
    <Layout title="Gestión de Usuarios">
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['todos', 'admin', 'docente', 'alumno'] as const).map(r => (
            <button key={r} onClick={() => setFiltroRol(r)} style={{
              padding: '7px 14px', borderRadius: 20, border: `1px solid ${filtroRol === r ? '#1565c0' : '#e0e0e0'}`,
              background: filtroRol === r ? '#e8f0fe' : '#fff', color: filtroRol === r ? '#1565c0' : '#555',
              fontSize: 12, fontWeight: filtroRol === r ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
            }}>
              {r === 'todos' ? 'Todos' : ROL_CFG[r].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: usuarios.length, color: '#1565c0' },
          { label: 'Docentes', value: usuarios.filter(u => u.rol === 'docente').length, color: '#1565c0' },
          { label: 'Alumnos', value: usuarios.filter(u => u.rol === 'alumno').length, color: '#2e7d32' },
          { label: 'Inactivos', value: usuarios.filter(u => !u.activo).length, color: '#d32f2f' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 13, color: '#555' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#bdbdbd' }}>
          <Users size={48} />
          <p style={{ marginTop: 12 }}>No se encontraron usuarios</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8eaed', overflow: 'hidden' }}>
         <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Usuario', 'Rol', 'Facultad / Carrera', 'Registro', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e8eaed' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u, i) => {
                const rol = ROL_CFG[u.rol] ?? ROL_CFG.alumno
                const RolIcon = rol.icon
                const isCambiandoRol = cambiando === u.id + '_rol'
                const isCambiandoActivo = cambiando === u.id + '_activo'

                return (
                  <motion.tr key={u.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid #f5f5f5', opacity: u.activo ? 1 : 0.6 }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: rol.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rol.color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {(u.nombres?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#212121', margin: 0 }}>{u.nombres} {u.apellidos}</p>
                          <p style={{ fontSize: 12, color: '#9e9e9e', margin: 0 }}>{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 10, background: rol.bg, color: rol.color, fontSize: 12, fontWeight: 600 }}>
                        <RolIcon size={11} /> {rol.label}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>
                      {u.facultad_nombre ?? u.carrera_nombre ?? '—'}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#9e9e9e' }}>
                      {fmtFecha(u.created_at)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 10,
                        background: u.activo ? '#e8f5e9' : '#f5f5f5',
                        color: u.activo ? '#2e7d32' : '#9e9e9e',
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {u.rol !== 'admin' && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {/* Cambiar rol */}
                          {u.rol === 'alumno' && (
                            <button
                              onClick={() => handleCambiarRol(u, 'docente')}
                              disabled={!!isCambiandoRol}
                              style={{ padding: '5px 10px', border: '1px solid #bbdefb', borderRadius: 7, background: '#fff', color: '#1565c0', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                            >
                              → Docente
                            </button>
                          )}
                          {u.rol === 'docente' && (
                            <button
                              onClick={() => handleCambiarRol(u, 'alumno')}
                              disabled={!!isCambiandoRol}
                              style={{ padding: '5px 10px', border: '1px solid #c8e6c9', borderRadius: 7, background: '#fff', color: '#2e7d32', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                            >
                              → Alumno
                            </button>
                          )}
                          {/* Toggle activo */}
                          <button
                            onClick={() => handleToggleActivo(u)}
                            disabled={!!isCambiandoActivo}
                            style={{
                              padding: '5px 10px', border: `1px solid ${u.activo ? '#ffcdd2' : '#c8e6c9'}`, borderRadius: 7,
                              background: '#fff', color: u.activo ? '#d32f2f' : '#2e7d32',
                              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {u.activo ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      )}
                      {u.rol === 'admin' && <span style={{ fontSize: 12, color: '#bdbdbd' }}>—</span>}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
         </div>
        </div>
      )}
    </Layout>
  )
}
