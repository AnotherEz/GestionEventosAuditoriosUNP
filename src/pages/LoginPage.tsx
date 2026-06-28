import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, signUpAlumno, signUpDocente, detectarRolPorEmail } from '../lib/auth'
import { supabase } from '../lib/supabase'
import {
  Eye, EyeOff, UserCircle, Monitor, GraduationCap, BookOpen,
  Users, Globe, FileText, Award, Search, Building2, BookMarked, Heart,
} from 'lucide-react'
import unpShield from '../assets/unp-shield.png'
import campusBg  from '../assets/campus-bg.png'

/* ─── Data ───────────────────────────────────────────────────────────────────── */
const SERVICES = {
  'Pregrado': [
    { label: 'Admisión',                             icon: UserCircle },
    { label: 'Matrícula',                            icon: Monitor    },
    { label: 'Intranet',                             icon: UserCircle },
    { label: 'Aula Virtual',                         icon: Monitor    },
    { label: 'Gestión de Tutoría',                   icon: BookOpen   },
    { label: 'Gestión y Programación',               icon: Users      },
    { label: 'Gestión de Biblioteca',                icon: BookMarked },
    { label: 'Responsabilidad Social',               icon: Heart      },
    { label: 'Seguimiento al egresado',              icon: GraduationCap },
    { label: 'Cooperación Nacional e Internacional', icon: Globe      },
    { label: 'Gestión de Tesis',                     icon: FileText   },
    { label: 'Grados y Títulos',                     icon: Award      },
    { label: 'Investigación Docente',                icon: Search     },
    { label: 'Incubadora de Empresas',               icon: Building2  },
  ],
  'Posgrado y Extensión': [
    { label: 'Admisión Posgrado',       icon: UserCircle },
    { label: 'Matrícula Posgrado',      icon: Monitor    },
    { label: 'Aula Virtual',            icon: Monitor    },
    { label: 'Gestión de Tutoría',      icon: BookOpen   },
    { label: 'Investigación',           icon: Search     },
    { label: 'Gestión de Tesis',        icon: FileText   },
    { label: 'Grados y Títulos',        icon: Award      },
    { label: 'Extensión Universitaria', icon: Globe      },
  ],
  'Gestión Administrativa': [
    { label: 'Gestión de Tutoría',        icon: BookOpen   },
    { label: 'Gestión y Programación',    icon: Users      },
    { label: 'Gestión de Biblioteca',     icon: BookMarked },
    { label: 'Responsabilidad Social',    icon: Heart      },
    { label: 'Cooperación Internacional', icon: Globe      },
    { label: 'Gestión de Tesis',          icon: FileText   },
    { label: 'Grados y Títulos',          icon: Award      },
    { label: 'Investigación Docente',     icon: Search     },
  ],
  'Centros de Producción': [
    { label: 'Investigación Docente',     icon: Search    },
    { label: 'Incubadora de Empresas',    icon: Building2 },
    { label: 'Gestión y Programación',    icon: Users     },
    { label: 'Cooperación Internacional', icon: Globe     },
  ],
}
type Tab = keyof typeof SERVICES
const TABS = Object.keys(SERVICES) as Tab[]

/* ─── FloatingInput ──────────────────────────────────────────────────────────── */
function FloatingInput({ id, label, value, onChange, isPassword = false, mobile = false, type = 'text' }: {
  id: string; label: string; value: string; onChange: (v: string) => void
  isPassword?: boolean; mobile?: boolean; type?: string
}) {
  const [focused,  setFocused]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)
  const lifted = focused || value.length > 0
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type

  return (
    <div style={{ position: 'relative', width: '100%', height: 56 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: mobile ? 14 : 8,
        border: `${focused ? 2 : 1}px solid ${focused ? '#1565c0' : (mobile ? '#bbdefb' : '#aaaaaa')}`,
        background: focused ? '#e8f0fe' : (mobile ? '#f0f8ff' : '#ffffff'),
        transition: 'border-color 150ms, background 150ms', pointerEvents: 'none',
      }} />
      <label htmlFor={id} style={{
        position: 'absolute', left: 16, pointerEvents: 'none', userSelect: 'none',
        transformOrigin: 'left top', transition: 'transform 150ms ease, color 150ms ease',
        transform: lifted ? 'translateY(8px) scale(0.72)' : 'translateY(18px) scale(1)',
        fontSize: 15, lineHeight: 1,
        color: focused ? '#1565c0' : '#1565c0', fontWeight: lifted ? 500 : 400,
      }}>{label}</label>
      <input id={id} type={inputType} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          background: 'transparent', border: 'none', outline: 'none',
          borderRadius: mobile ? 14 : 8, fontSize: 15, color: '#111827',
          paddingLeft: 16, paddingRight: isPassword ? 44 : 16,
          paddingTop: 22, paddingBottom: 4, boxSizing: 'border-box', fontFamily: 'inherit',
        }} />
      {isPassword && (
        <button type="button" tabIndex={-1} onClick={() => setShowPwd(p => !p)} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', padding: 4, cursor: 'pointer',
          color: '#1565c0', display: 'flex', alignItems: 'center',
        }}>
          {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  )
}

/* ─── Select Field ───────────────────────────────────────────────────────────── */
function SelectField({ id, label, value, onChange, options, mobile = false }: {
  id: string; label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; mobile?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const active = value !== ''
  return (
    <div style={{ position: 'relative', width: '100%', height: 56 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: mobile ? 14 : 8,
        border: `${focused ? 2 : 1}px solid ${focused ? '#1565c0' : (mobile ? '#bbdefb' : '#aaaaaa')}`,
        background: focused ? '#e8f0fe' : (mobile ? '#f0f8ff' : '#ffffff'),
        transition: 'border-color 150ms, background 150ms', pointerEvents: 'none',
      }} />
      <label htmlFor={id} style={{
        position: 'absolute', left: 16, pointerEvents: 'none', userSelect: 'none',
        transformOrigin: 'left top', transition: 'transform 150ms ease',
        transform: active ? 'translateY(8px) scale(0.72)' : 'translateY(18px) scale(1)',
        fontSize: 15, lineHeight: 1, color: focused ? '#1565c0' : '#1565c0', fontWeight: active ? 500 : 400,
      }}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          background: 'transparent', border: 'none', outline: 'none',
          borderRadius: mobile ? 14 : 8, fontSize: 15, color: '#111827',
          paddingLeft: 16, paddingRight: 16, paddingTop: 22, paddingBottom: 4,
          boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer',
          appearance: 'none',
        }}>
        <option value="" disabled />
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

/* ─── Shield ─────────────────────────────────────────────────────────────────── */
function Shield({ size = 112 }: { size?: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) return (
    <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, margin: '0 auto', display: 'block' }}>
      <path d="M60 5 L110 25 L110 75 C110 105 60 135 60 135 C60 135 10 105 10 75 L10 25 Z"
        fill="#003087" stroke="#c8a951" strokeWidth="3" />
      <path d="M60 15 L100 30 L100 75 C100 100 60 125 60 125 C60 125 20 100 20 75 L20 30 Z" fill="#0047ab" />
      <text x="60" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="serif">UNP</text>
    </svg>
  )
  return <img src={unpShield} alt="Escudo UNP" onError={() => setFailed(true)}
    style={{ width: size, height: size, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
}

/* ─── Services Grid ──────────────────────────────────────────────────────────── */
function ServicesGrid({ mobile = false }: { mobile?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>('Pregrado')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', flexWrap: mobile ? 'wrap' : 'nowrap', gap: mobile ? '0 24px' : 28,
        borderBottom: `1px solid ${mobile ? '#e0e0e0' : 'rgba(255,255,255,0.25)'}`,
        marginBottom: mobile ? 16 : 20, flexShrink: 0, padding: mobile ? '0 4px' : undefined,
      }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            paddingBottom: 10, paddingTop: mobile ? 4 : 0,
            fontSize: mobile ? 15 : 13, fontWeight: activeTab === tab ? 700 : 400,
            background: 'none', border: 'none', cursor: 'pointer',
            color: mobile ? (activeTab === tab ? '#1565c0' : '#9e9e9e') : (activeTab === tab ? '#fff' : 'rgba(144,202,249,0.9)'),
            position: 'relative', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'color 150ms',
          }}>
            {tab}
            {activeTab === tab && <motion.div layoutId={mobile ? 'tab-m' : 'tab-d'} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: mobile ? '#1565c0' : '#fff', borderRadius: 2 }} />}
          </button>
        ))}
      </div>
      <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(130px,1fr))', gap: mobile ? 12 : 10, overflowY: 'auto', flex: 1, paddingRight: 4, paddingBottom: 8 }}>
        {SERVICES[activeTab].map((svc, i) => {
          const Icon = svc.icon
          return (
            <motion.div key={svc.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              whileHover={!mobile ? { scale: 1.03 } : {}}
              style={{ background: mobile ? '#fff' : 'rgba(255,255,255,0.92)', borderRadius: mobile ? 16 : 12, border: mobile ? '1.5px solid #90caf9' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: mobile ? 14 : 8, padding: mobile ? '24px 12px' : '18px 12px', cursor: 'pointer', minHeight: mobile ? 130 : 100 }}>
              <Icon size={mobile ? 36 : 28} color="#1565c0" strokeWidth={1.5} />
              <span style={{ color: mobile ? '#1565c0' : '#1a237e', fontSize: mobile ? 13 : 11, textAlign: 'center', lineHeight: 1.35, fontWeight: 500 }}>{svc.label}</span>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

/* ─── Register Form ──────────────────────────────────────────────────────────── */
function RegisterForm({ mobile, onBack }: { mobile: boolean; onBack: () => void }) {
  const [email,    setEmail]    = useState('')
  const [nombres,  setNombres]  = useState('')
  const [apellidos,setApellidos]= useState('')
  const [password, setPassword] = useState('')
  const [campo1,   setCampo1]   = useState('')   // código (alumno) | DNI (docente)
  const [campo2,   setCampo2]   = useState('')   // carrera_id (alumno) | facultad_id (docente)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [carreras, setCarreras] = useState<{value:string;label:string}[]>([])
  const [facultades,setFacultades]=useState<{value:string;label:string}[]>([])

  const rol = detectarRolPorEmail(email)
  const esAlumno  = rol === 'alumno'
  const esDocente = rol === 'docente'

  useEffect(() => {
    supabase.from('carreras').select('id,nombre').then(({ data }) => {
      if (data) setCarreras(data.map(c => ({ value: c.id, label: c.nombre })))
    })
    supabase.from('facultades').select('id,nombre').then(({ data }) => {
      if (data) setFacultades(data.map(f => ({ value: f.id, label: f.nombre })))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!rol) { setError('Correo no válido. Usa @alumnos.unp.edu.pe o @unp.edu.pe'); return }
    if (email === 'admin@unp.edu.pe') { setError('No puedes registrarte con ese correo.'); return }
    if (!nombres || !apellidos || !password || !campo1 || !campo2) { setError('Completa todos los campos.'); return }
    setLoading(true)
    try {
      if (esAlumno) {
        await signUpAlumno({ email, password, nombres, apellidos, codigo_universitario: campo1, carrera_id: campo2 })
      } else {
        await signUpDocente({ email, password, nombres, apellidos, dni: campo1, facultad_id: campo2 })
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 28 }}>✓</span>
      </div>
      <p style={{ color: mobile ? '#fff' : '#1a237e', fontWeight: 700, fontSize: 16, margin: 0 }}>¡Registro exitoso!</p>
      <p style={{ color: mobile ? 'rgba(255,255,255,0.8)' : '#555', fontSize: 13, margin: 0 }}>
        Revisa tu correo institucional para confirmar tu cuenta.
      </p>
      <button onClick={onBack} style={{ background: '#1565c0', color: '#fff', border: 'none', borderRadius: mobile ? 14 : 8, padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        Ir al inicio de sesión
      </button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FloatingInput id={`${mobile?'m':'d'}-reg-email`}    label="Correo institucional" value={email}     onChange={setEmail}     mobile={mobile} type="email" />

      <AnimatePresence>
      {(esAlumno || esDocente) && (
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
          style={{ display:'flex', flexDirection:'column', gap:12, overflow:'hidden' }}>
          <div style={{ display:'flex', gap:12 }}>
            <FloatingInput id={`${mobile?'m':'d'}-reg-nom`}  label="Nombres"   value={nombres}   onChange={setNombres}   mobile={mobile} />
            <FloatingInput id={`${mobile?'m':'d'}-reg-ape`}  label="Apellidos" value={apellidos} onChange={setApellidos} mobile={mobile} />
          </div>
          {esAlumno
            ? <FloatingInput id={`${mobile?'m':'d'}-reg-cod`} label="Código universitario" value={campo1} onChange={setCampo1} mobile={mobile} />
            : <FloatingInput id={`${mobile?'m':'d'}-reg-dni`} label="DNI" value={campo1} onChange={setCampo1} mobile={mobile} type="number" />
          }
          {esAlumno
            ? <SelectField id={`${mobile?'m':'d'}-reg-car`} label="Carrera"  value={campo2} onChange={setCampo2} options={carreras}   mobile={mobile} />
            : <SelectField id={`${mobile?'m':'d'}-reg-fac`} label="Facultad" value={campo2} onChange={setCampo2} options={facultades} mobile={mobile} />
          }
          <FloatingInput id={`${mobile?'m':'d'}-reg-pwd`} label="Contraseña" value={password} onChange={setPassword} isPassword mobile={mobile} />
          <p style={{ fontSize: 11, color: mobile ? 'rgba(255,255,255,0.6)' : '#9e9e9e', margin: '-4px 0 0', textAlign: 'center' }}>
            {esAlumno ? 'Registrándote como Alumno' : 'Registrándote como Docente'}
          </p>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {error && <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ color: mobile ? '#ffcdd2' : '#d32f2f', fontSize: 12, textAlign: 'center', margin: 0 }}>{error}</motion.p>}
      </AnimatePresence>

      <button type="submit" disabled={loading || (!esAlumno && !esDocente)} style={{
        width: '100%', padding: '13px 0', background: '#1565c0', color: '#fff',
        border: 'none', borderRadius: mobile ? 14 : 8, fontSize: 15, fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        opacity: loading || (!esAlumno && !esDocente) ? 0.65 : 1,
      }}>
        {loading ? 'Registrando...' : 'Crear cuenta'}
      </button>
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: mobile ? 'rgba(255,255,255,0.8)' : '#1565c0', fontSize: 13 }}>
        ← Volver al inicio de sesión
      </button>
    </form>
  )
}

/* ─── Login Form ─────────────────────────────────────────────────────────────── */
function LoginForm({ mobile, onRegister }: { mobile: boolean; onRegister: () => void }) {
  const navigate = useNavigate()
  const [email,      setEmail]      = useState('')
  const [contrasena, setContrasena] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !contrasena) { setError('Ingrese su usuario y contraseña.'); return }
    setError(''); setLoading(true)
    try {
      await signIn(email, contrasena)
      navigate('/dashboard')
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FloatingInput id={mobile?'m-email':'d-email'} label="Correo institucional" value={email} onChange={setEmail} mobile={mobile} type="email" />
      <FloatingInput id={mobile?'m-pwd':'d-pwd'}     label="Contraseña"           value={contrasena} onChange={setContrasena} isPassword mobile={mobile} />

      <AnimatePresence>
        {error && <motion.p initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          style={{ color: mobile ? '#ffcdd2' : '#d32f2f', fontSize: 12, textAlign: 'center', marginTop: -4 }}>{error}</motion.p>}
      </AnimatePresence>

      <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }} style={{
        width: '100%', padding: '14px 0', marginTop: 4,
        background: '#1565c0', color: '#fff', border: 'none',
        borderRadius: mobile ? 14 : 8, fontSize: 16, fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.75 : 1,
      }}>
        {loading
          ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
              Ingresando...
            </span>
          : 'Ingresar'}
      </motion.button>

      <button type="button" style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', color: mobile ? 'rgba(255,255,255,0.85)' : '#1565c0', fontSize:14, marginTop:-4 }}>
        ¿Olvidaste tu contraseña?
      </button>

      {mobile && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'4px 0' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.3)' }} />
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>o</span>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.3)' }} />
          </div>
          <button type="button" onClick={onRegister} style={{ width:'100%', padding:'13px 0', background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:14, fontSize:15, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
            Crear cuenta
          </button>
        </>
      )}

      {!mobile && (
        <p style={{ textAlign:'center', fontSize:13, color:'#777', marginTop:4 }}>
          ¿No tienes cuenta?{' '}
          <button type="button" onClick={onRegister} style={{ background:'none', border:'none', color:'#1565c0', fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
            Regístrate aquí
          </button>
        </p>
      )}
    </form>
  )
}

/* ─── Panel izquierdo compartido ─────────────────────────────────────────────── */
function LeftPanel({ mode, onToggle }: { mode: 'login'|'register'; onToggle: () => void }) {
  return (
    <div className="left-panel">
      <Shield size={112} />
      <h1 style={{ marginTop:16, textAlign:'center', color:'#1a237e', fontWeight:700, fontSize:18, lineHeight:1.4, letterSpacing:'0.02em' }}>
        UNIVERSIDAD<br />NACIONAL<br />DE PIURA
      </h1>
      <AnimatePresence mode="wait">
        <motion.p key={mode} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
          style={{ marginTop:4, marginBottom:24, color:'#9e9e9e', fontSize:15 }}>
          {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
        </motion.p>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {mode === 'login'
          ? <motion.div key="login" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ width:'100%' }}>
              <LoginForm mobile={false} onRegister={onToggle} />
            </motion.div>
          : <motion.div key="register" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ width:'100%' }}>
              <RegisterForm mobile={false} onBack={onToggle} />
            </motion.div>
        }
      </AnimatePresence>
      <div style={{ marginTop:32, width:40, height:4, background:'#e0e0e0', borderRadius:2 }} />
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'register'>('login')

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-root { display:flex; height:100vh; width:100vw; overflow:hidden; font-family:'Segoe UI',system-ui,sans-serif; }
        .left-panel  { width:320px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#fff; padding:32px 36px; box-shadow:2px 0 12px rgba(0,0,0,0.08); z-index:10; overflow-y:auto; }
        .right-panel { flex:1; position:relative; display:flex; flex-direction:column; overflow:hidden; }
        .mobile-section { display:none; }
        @media (max-width:767px) {
          .login-root  { flex-direction:column; height:auto; min-height:100vh; overflow-y:auto; }
          .left-panel  { display:none; }
          .right-panel { display:none; }
          .mobile-section { display:flex; flex-direction:column; }
        }
      `}</style>

      <div className="login-root">
        {/* Desktop left */}
        <LeftPanel mode={mode} onToggle={() => setMode(m => m === 'login' ? 'register' : 'login')} />

        {/* Desktop right */}
        <div className="right-panel">
          <div style={{ position:'absolute', inset:0 }}>
            <img src={campusBg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <div style={{ position:'absolute', inset:0, background:'rgba(13,71,161,0.78)' }} />
          </div>
          <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100%', padding:'20px 24px 16px' }}>
            <ServicesGrid mobile={false} />
            <p style={{ paddingTop:12, flexShrink:0, color:'rgba(255,255,255,0.4)', fontSize:36, fontWeight:700, lineHeight:1 }}>Bienvenido a</p>
          </div>
        </div>

        {/* Mobile: login/register con fondo campus */}
        <div className="mobile-section" style={{ minHeight:'100vh', position:'relative', alignItems:'center' }}>
          <div style={{ position:'fixed', inset:0, zIndex:0 }}>
            <img src={campusBg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <div style={{ position:'absolute', inset:0, background:'rgba(13,71,161,0.82)' }} />
          </div>
          <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', width:'100%', padding:'48px 28px 40px' }}>
            <Shield size={120} />
            <h1 style={{ marginTop:20, textAlign:'center', color:'#fff', fontWeight:700, fontSize:26, lineHeight:1.25 }}>
              UNIVERSIDAD<br />NACIONAL<br />DE PIURA
            </h1>
            <AnimatePresence mode="wait">
              <motion.p key={mode} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ marginTop:8, marginBottom:28, color:'rgba(255,255,255,0.85)', fontSize:18 }}>
                {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
              </motion.p>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {mode === 'login'
                ? <motion.div key="m-login" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ width:'100%' }}>
                    <LoginForm mobile onRegister={() => setMode('register')} />
                  </motion.div>
                : <motion.div key="m-register" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ width:'100%' }}>
                    <RegisterForm mobile onBack={() => setMode('login')} />
                  </motion.div>
              }
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: services */}
        <div className="mobile-section" style={{ background:'#fff', padding:'20px 16px 32px', minHeight:'100vh' }}>
          <ServicesGrid mobile />
        </div>
      </div>
    </>
  )
}
