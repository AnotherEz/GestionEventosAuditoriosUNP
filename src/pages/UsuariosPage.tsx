import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Shield, GraduationCap, BookOpen, Globe,
  ToggleLeft, ToggleRight, UserPlus, KeyRound, X, IdCard,
} from 'lucide-react'
import Layout from '../components/Layout'
import {
  getUsuarios, updateUsuarioRol, toggleUsuario,
  crearUsuarioInterno, resetPasswordUsuario, getFacultades, getCarreras,
} from '../lib/db'
import type { Usuario } from '../lib/types'

const ROL_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  admin:   { label: 'Admin',   color: '#6a1b9a', bg: '#f3e5f5', icon: Shield },
  docente: { label: 'Docente', color: '#1565c0', bg: '#e3f2fd', icon: BookOpen },
  alumno:  { label: 'Alumno',  color: '#2e7d32', bg: '#e8f5e9', icon: GraduationCap },
  externo: { label: 'Externo', color: '#e65100', bg: '#fff3e0', icon: Globe },
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ─── Modal: el admin crea cuentas internas (docente / alumno) ─────────────── */
function CrearUsuarioModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (mensaje: string) => void
}) {
  const [rol,        setRol]        = useState<'docente' | 'alumno'>('docente')
  const [nombres,    setNombres]    = useState('')
  const [apellidos,  setApellidos]  = useState('')
  const [email,      setEmail]      = useState('')
  const [dni,        setDni]        = useState('')
  const [telefono,   setTelefono]   = useState('')
  const [codigo,     setCodigo]     = useState('')
  const [facultadId, setFacultadId] = useState('')
  const [carreraId,  setCarreraId]  = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const [facultades, setFacultades] = useState<{ id: string; nombre: string; siglas: string }[]>([])
  const [carreras,   setCarreras]   = useState<{ id: string; nombre: string; facultad_id: string }[]>([])

  useEffect(() => {
    if (!open) return
    getFacultades().then(setFacultades).catch(console.error)
    getCarreras().then(setCarreras).catch(console.error)
  }, [open])

  const carrerasFiltradas = facultadId ? carreras.filter(c => c.facultad_id === facultadId) : []
  const dominio = rol === 'alumno' ? '@alumnos.unp.edu.pe' : '@unp.edu.pe'

  const reset = () => {
    setRol('docente'); setNombres(''); setApellidos(''); setEmail(''); setDni('')
    setTelefono(''); setCodigo(''); setFacultadId(''); setCarreraId(''); setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const mail = email.trim().toLowerCase()
    if (!nombres.trim() || !apellidos.trim() || !mail || !dni) {
      setError('Completa todos los campos obligatorios.'); return
    }
    // Validación del dominio institucional según el rol
    if (rol === 'alumno' && !mail.endsWith('@alumnos.unp.edu.pe')) {
      setError('El correo de un alumno debe terminar en @alumnos.unp.edu.pe'); return
    }
    if (rol === 'docente' && (!mail.endsWith('@unp.edu.pe') || mail.endsWith('@alumnos.unp.edu.pe') || mail === 'admin@unp.edu.pe')) {
      setError('El correo de un docente debe terminar en @unp.edu.pe'); return
    }
    if (!/^\d{8}$/.test(dni)) { setError('El DNI debe tener 8 dígitos.'); return }
    if (telefono && !/^9\d{8}$/.test(telefono)) {
      setError('El teléfono debe tener 9 dígitos y empezar con 9.'); return
    }
    if (rol === 'alumno') {
      if (!codigo.trim()) { setError('Ingresa el código universitario.'); return }
      if (!facultadId)    { setError('Selecciona la facultad.'); return }
      if (!carreraId)     { setError('Selecciona la escuela/carrera.'); return }
    }

    setLoading(true)
    try {
      const resp = await crearUsuarioInterno({
        rol, nombres: nombres.trim(), apellidos: apellidos.trim(), email: mail, dni,
        telefono: telefono || undefined,
        codigo_universitario: rol === 'alumno' ? codigo.trim() : undefined,
        carrera_id: rol === 'alumno' ? carreraId : undefined,
        facultad_id: facultadId || undefined,
      })
      reset()
      onCreated(resp.mensaje)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', outline: 'none',
  }
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }

  // Sin AnimatePresence: con framer-motion 12 + React 19 los fragmentos no se
  // desmontan tras el exit y el modal invisible bloquea los clics de la página.
  if (!open) return null
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 100, backdropFilter: 'blur(3px)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          background: '#fff', borderRadius: 16, padding: 28, width: '92%', maxWidth: 520, zIndex: 101,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a237e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={19} /> Crear Usuario Interno
              </h2>
              <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#e8f0fe', border: '1px solid #bbdefb', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 12.5, color: '#1565c0', margin: 0, lineHeight: 1.5 }}>
                La <strong>contraseña inicial será el DNI</strong> del usuario. Al ingresar por
                primera vez, el sistema le exigirá cambiarla. Los usuarios externos no se crean
                aquí: ellos se auto-registran desde la página de inicio.
              </p>
            </div>

            {error && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Rol */}
              <div>
                <label style={labelStyle}>Tipo de usuario *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([
                    { value: 'docente', label: 'Docente', icon: BookOpen },
                    { value: 'alumno',  label: 'Alumno',  icon: GraduationCap },
                  ] as const).map(opt => {
                    const active = rol === opt.value
                    const Icon = opt.icon
                    return (
                      <button key={opt.value} type="button" onClick={() => setRol(opt.value)} style={{
                        flex: 1, padding: '10px 4px', borderRadius: 8,
                        border: `${active ? 2 : 1}px solid ${active ? '#1565c0' : '#e0e0e0'}`,
                        background: active ? '#e8f0fe' : '#fff', color: active ? '#1565c0' : '#757575',
                        fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 150ms',
                      }}>
                        <Icon size={15} /> {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nombres *</label>
                  <input value={nombres} onChange={e => setNombres(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Apellidos *</label>
                  <input value={apellidos} onChange={e => setApellidos(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Correo institucional * <span style={{ fontWeight: 400, color: '#9e9e9e' }}>(debe terminar en {dominio})</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={`usuario${dominio}`} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>DNI * <span style={{ fontWeight: 400, color: '#9e9e9e' }}>(contraseña inicial)</span></label>
                  <input value={dni} onChange={e => { if (/^\d{0,8}$/.test(e.target.value)) setDni(e.target.value) }}
                    placeholder="8 dígitos" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input value={telefono} onChange={e => { if (/^\d{0,9}$/.test(e.target.value)) setTelefono(e.target.value) }}
                    placeholder="9XXXXXXXX" style={inputStyle} />
                </div>
              </div>

              {rol === 'alumno' && (
                <>
                  <div>
                    <label style={labelStyle}>Código universitario *</label>
                    <input value={codigo} onChange={e => setCodigo(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Facultad *</label>
                      <select value={facultadId} onChange={e => { setFacultadId(e.target.value); setCarreraId('') }} style={inputStyle}>
                        <option value="">Seleccionar...</option>
                        {facultades.map(f => <option key={f.id} value={f.id}>{f.siglas} — {f.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Escuela / Carrera *</label>
                      <select value={carreraId} onChange={e => setCarreraId(e.target.value)} disabled={!facultadId} style={inputStyle}>
                        <option value="">{facultadId ? 'Seleccionar...' : 'Elige facultad primero'}</option>
                        {carrerasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {rol === 'docente' && (
                <div>
                  <label style={labelStyle}>Facultad (opcional)</label>
                  <select value={facultadId} onChange={e => setFacultadId(e.target.value)} style={inputStyle}>
                    <option value="">Sin facultad asignada</option>
                    {facultades.map(f => <option key={f.id} value={f.id}>{f.siglas} — {f.nombre}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                padding: '12px 20px', background: loading ? '#90caf9' : '#1565c0', color: '#fff',
                border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <UserPlus size={17} /> {loading ? 'Creando...' : 'Crear cuenta'}
              </button>
            </form>
      </motion.div>
    </>
  )
}

/* ─── Página ────────────────────────────────────────────────────────────────── */
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<(Usuario & { carrera_nombre?: string; facultad_nombre?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroRol, setFiltroRol] = useState<'todos' | 'admin' | 'docente' | 'alumno' | 'externo'>('todos')
  const [cambiando, setCambiando] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [aviso, setAviso] = useState('')

  const load = () => {
    setLoading(true)
    getUsuarios().then(u => setUsuarios(u as typeof usuarios)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const mostrarAviso = (msg: string) => {
    setAviso(msg)
    setTimeout(() => setAviso(''), 6000)
  }

  const handleToggleActivo = async (u: Usuario) => {
    setCambiando(u.id + '_activo')
    try { await toggleUsuario(u.id, !u.activo); load() }
    catch (e) { console.error(e) }
    finally { setCambiando(null) }
  }

  const handleCambiarRol = async (u: Usuario, nuevoRol: 'alumno' | 'docente' | 'externo') => {
    if (u.rol === 'admin') return
    if (!confirm(`¿Cambiar rol de ${u.nombres} a ${nuevoRol}?`)) return
    setCambiando(u.id + '_rol')
    try { await updateUsuarioRol(u.id, nuevoRol); load() }
    catch (e) { console.error(e) }
    finally { setCambiando(null) }
  }

  const handleResetPassword = async (u: Usuario) => {
    if (!confirm(`¿Resetear la contraseña de ${u.nombres} ${u.apellidos}?\n\nLa contraseña volverá a ser su DNI (${u.dni}) y deberá cambiarla en su próximo ingreso.`)) return
    setCambiando(u.id + '_pwd')
    try {
      const r = await resetPasswordUsuario(u.id)
      mostrarAviso(r.mensaje)
      load()
    } catch (e) {
      mostrarAviso(e instanceof Error ? e.message : 'No se pudo resetear la contraseña.')
    } finally {
      setCambiando(null)
    }
  }

  const filtrados = usuarios.filter(u => {
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    const matchSearch = !search || (
      `${u.nombres} ${u.apellidos} ${u.email} ${u.dni ?? ''} ${u.ruc ?? ''}`.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Buscar por nombre, email, DNI o RUC..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['todos', 'admin', 'docente', 'alumno', 'externo'] as const).map(r => (
            <button key={r} onClick={() => setFiltroRol(r)} style={{
              padding: '7px 14px', borderRadius: 20, border: `1px solid ${filtroRol === r ? '#1565c0' : '#e0e0e0'}`,
              background: filtroRol === r ? '#e8f0fe' : '#fff', color: filtroRol === r ? '#1565c0' : '#555',
              fontSize: 12, fontWeight: filtroRol === r ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
            }}>
              {r === 'todos' ? 'Todos' : ROL_CFG[r].label}
            </button>
          ))}
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          padding: '10px 18px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 10,
          cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <UserPlus size={16} /> Crear Usuario
        </button>
      </div>

      {/* Aviso (creación / reset) */}
      <AnimatePresence>
        {aviso && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2e7d32', padding: '10px 16px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {aviso}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: usuarios.length, color: '#1565c0' },
          { label: 'Docentes', value: usuarios.filter(u => u.rol === 'docente').length, color: '#1565c0' },
          { label: 'Alumnos', value: usuarios.filter(u => u.rol === 'alumno').length, color: '#2e7d32' },
          { label: 'Externos', value: usuarios.filter(u => u.rol === 'externo').length, color: '#e65100' },
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Usuario', 'Rol', 'Documento', 'Facultad / Institución', 'Registro', 'Estado', 'Acciones'].map(h => (
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
                const isCambiandoPwd = cambiando === u.id + '_pwd'
                // Externos que representan a una institución se identifican con RUC;
                // el resto (internos y personas naturales), con su DNI.
                const esInstitucion = u.rol === 'externo' && !!u.institucion

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
                      {u.debe_cambiar_password && (
                        <span title="Debe cambiar su contraseña en el próximo ingreso" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6, padding: '3px 8px', borderRadius: 10, background: '#fff8e1', color: '#e65100', fontSize: 11, fontWeight: 600 }}>
                          <KeyRound size={10} /> DNI
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <IdCard size={13} color="#9e9e9e" />
                        {esInstitucion
                          ? (u.ruc ? <span><strong style={{ fontSize: 11, color: '#e65100' }}>RUC</strong> {u.ruc}</span> : '—')
                          : (u.dni ? <span><strong style={{ fontSize: 11, color: '#1565c0' }}>DNI</strong> {u.dni}</span> : '—')}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>
                      {u.rol === 'externo'
                        ? (u.institucion ?? 'Persona natural')
                        : (u.facultad_nombre ?? u.carrera_nombre ?? '—')}
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
                          {/* Resetear contraseña al DNI */}
                          {u.dni && (
                            <button
                              onClick={() => handleResetPassword(u)}
                              disabled={!!isCambiandoPwd}
                              title="La contraseña volverá a ser el DNI y deberá cambiarla al entrar"
                              style={{
                                padding: '5px 10px', border: '1px solid #ffe082', borderRadius: 7,
                                background: '#fff', color: '#e65100', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <KeyRound size={12} /> {isCambiandoPwd ? 'Reseteando...' : 'Resetear contraseña'}
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

      <CrearUsuarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(mensaje) => { setModalOpen(false); mostrarAviso(mensaje); load() }}
      />
    </Layout>
  )
}
