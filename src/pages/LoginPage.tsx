import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from '../lib/auth'
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
function FloatingInput({
  id, label, value, onChange, isPassword = false, mobile = false,
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void; isPassword?: boolean; mobile?: boolean
}) {
  const [focused,  setFocused]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)
  const lifted = focused || value.length > 0

  const borderColor = mobile
    ? (focused ? '#1565c0' : '#bbdefb')
    : (focused ? '#1565c0' : '#aaaaaa')

  const bg = mobile
    ? (focused ? '#e3f2fd' : '#f0f8ff')
    : (focused ? '#e8f0fe' : '#ffffff')

  return (
    <div style={{ position: 'relative', width: '100%', height: 56 }}>
      {/* Border box */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: mobile ? 14 : 8,
        border: `${focused ? 2 : 1}px solid ${borderColor}`,
        background: bg,
        transition: 'border-color 150ms, background 150ms',
        pointerEvents: 'none',
      }} />

      {/* Floating label */}
      <label htmlFor={id} style={{
        position: 'absolute',
        left: 16,
        pointerEvents: 'none',
        userSelect: 'none',
        transformOrigin: 'left top',
        transition: 'transform 150ms ease, color 150ms ease',
        transform: lifted ? 'translateY(8px) scale(0.72)' : 'translateY(18px) scale(1)',
        fontSize: 15,
        lineHeight: 1,
        color: focused ? '#1565c0' : '#1565c0',
        fontWeight: lifted ? 500 : 400,
      }}>
        {label}
      </label>

      {/* Input */}
      <input
        id={id}
        type={isPassword && !showPwd ? 'password' : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={isPassword ? 'current-password' : 'username'}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          background: 'transparent', border: 'none', outline: 'none',
          borderRadius: mobile ? 14 : 8,
          fontSize: 15, color: '#111827',
          paddingLeft: 16,
          paddingRight: isPassword ? 44 : 16,
          paddingTop: 22,
          paddingBottom: 4,
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />

      {/* Eye toggle */}
      {isPassword && (
        <button type="button" tabIndex={-1} onClick={() => setShowPwd(p => !p)} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', padding: 4,
          cursor: 'pointer', color: '#1565c0', display: 'flex', alignItems: 'center',
        }}>
          {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
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
  return (
    <img src={unpShield} alt="Escudo UNP" onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
  )
}

/* ─── Services Grid ──────────────────────────────────────────────────────────── */
function ServicesGrid({ mobile = false }: { mobile?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>('Pregrado')
  const services = SERVICES[activeTab]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex', flexWrap: mobile ? 'wrap' : 'nowrap', gap: mobile ? '0 24px' : 28,
        borderBottom: `1px solid ${mobile ? '#e0e0e0' : 'rgba(255,255,255,0.25)'}`,
        marginBottom: mobile ? 16 : 20,
        flexShrink: 0,
        padding: mobile ? '0 4px' : undefined,
      }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            paddingBottom: 10,
            paddingTop: mobile ? 4 : 0,
            fontSize: mobile ? 15 : 13,
            fontWeight: activeTab === tab ? 700 : 400,
            background: 'none', border: 'none', cursor: 'pointer',
            color: mobile
              ? (activeTab === tab ? '#1565c0' : '#9e9e9e')
              : (activeTab === tab ? '#fff' : 'rgba(144,202,249,0.9)'),
            position: 'relative', whiteSpace: 'nowrap',
            fontFamily: 'inherit', transition: 'color 150ms',
          }}>
            {tab}
            {activeTab === tab && (
              <motion.div layoutId={mobile ? 'tab-m' : 'tab-d'} style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 2,
                background: mobile ? '#1565c0' : '#fff',
                borderRadius: 2,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: mobile ? 12 : 10,
          overflowY: 'auto',
          flex: 1,
          paddingRight: 4,
          paddingBottom: 8,
        }}
      >
        {services.map((svc, i) => {
          const Icon = svc.icon
          return (
            <motion.div
              key={svc.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={!mobile ? { scale: 1.03 } : {}}
              style={{
                background: mobile ? '#fff' : 'rgba(255,255,255,0.92)',
                borderRadius: mobile ? 16 : 12,
                border: mobile ? '1.5px solid #90caf9' : 'none',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: mobile ? 14 : 8,
                padding: mobile ? '24px 12px' : '18px 12px',
                cursor: 'pointer',
                minHeight: mobile ? 130 : 100,
                transition: 'background 150ms',
              }}
            >
              <Icon size={mobile ? 36 : 28} color="#1565c0" strokeWidth={1.5} />
              <span style={{
                color: mobile ? '#1565c0' : '#1a237e',
                fontSize: mobile ? 13 : 11,
                textAlign: 'center', lineHeight: 1.35, fontWeight: 500,
              }}>
                {svc.label}
              </span>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate     = useNavigate()
  const [usuario,    setUsuario]    = useState('')
  const [contrasena, setContrasena] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario || !contrasena) { setError('Ingrese su usuario y contraseña.'); return }
    setError(''); setLoading(true)
    try {
      await signIn(usuario, contrasena)
      navigate('/dashboard')
    } catch {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── MOBILE: stacked full-screen ── */
        .login-root { display: flex; height: 100vh; width: 100vw; overflow: hidden; font-family: 'Segoe UI', system-ui, sans-serif; }
        .left-panel  { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; padding: 32px 36px; box-shadow: 2px 0 12px rgba(0,0,0,0.08); z-index: 10; overflow-y: auto; }
        .right-panel { flex: 1; position: relative; display: flex; flex-direction: column; overflow: hidden; }
        .mobile-login { display: none; }
        .mobile-services { display: none; }

        @media (max-width: 767px) {
          .login-root    { flex-direction: column; height: auto; min-height: 100vh; overflow-y: auto; }
          .left-panel    { display: none; }
          .right-panel   { display: none; }
          .mobile-login  { display: flex; flex-direction: column; align-items: center; min-height: 100vh; position: relative; }
          .mobile-services { display: flex; flex-direction: column; background: #fff; padding: 20px 16px 32px; min-height: 100vh; }
        }
      `}</style>

      <div className="login-root">

        {/* ── DESKTOP LEFT ── */}
        <div className="left-panel">
          <Shield size={112} />
          <h1 style={{ marginTop: 16, textAlign: 'center', color: '#1a237e', fontWeight: 700, fontSize: 18, lineHeight: 1.4, letterSpacing: '0.02em' }}>
            UNIVERSIDAD<br />NACIONAL<br />DE PIURA
          </h1>
          <p style={{ marginTop: 4, marginBottom: 24, color: '#9e9e9e', fontSize: 15 }}>Bienvenido</p>
          <LoginForm usuario={usuario} setUsuario={setUsuario} contrasena={contrasena} setContrasena={setContrasena} loading={loading} error={error} onSubmit={handleSubmit} mobile={false} />
          <div style={{ marginTop: 32, width: 40, height: 4, background: '#e0e0e0', borderRadius: 2 }} />
        </div>

        {/* ── DESKTOP RIGHT ── */}
        <div className="right-panel">
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={campusBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,71,161,0.78)' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 24px 16px' }}>
            <ServicesGrid mobile={false} />
            <div style={{ paddingTop: 12, flexShrink: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>Bienvenido a</p>
            </div>
          </div>
        </div>

        {/* ── MOBILE LOGIN ── */}
        <div className="mobile-login">
          {/* bg */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
            <img src={campusBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,71,161,0.82)' }} />
          </div>
          {/* content */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '48px 28px 40px' }}>
            <Shield size={120} />
            <h1 style={{ marginTop: 20, textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 26, lineHeight: 1.25, letterSpacing: '0.02em' }}>
              UNIVERSIDAD<br />NACIONAL<br />DE PIURA
            </h1>
            <p style={{ marginTop: 8, marginBottom: 28, color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: 400 }}>Bienvenido</p>
            <LoginForm usuario={usuario} setUsuario={setUsuario} contrasena={contrasena} setContrasena={setContrasena} loading={loading} error={error} onSubmit={handleSubmit} mobile={true} />
          </div>
        </div>

        {/* ── MOBILE SERVICES ── */}
        <div className="mobile-services">
          <ServicesGrid mobile={true} />
        </div>

      </div>
    </>
  )
}

/* ─── LoginForm (shared between desktop & mobile) ────────────────────────────── */
function LoginForm({
  usuario, setUsuario, contrasena, setContrasena,
  loading, error, onSubmit, mobile,
}: {
  usuario: string; setUsuario: (v: string) => void
  contrasena: string; setContrasena: (v: string) => void
  loading: boolean; error: string
  onSubmit: (e: React.FormEvent) => void
  mobile: boolean
}) {
  return (
    <form onSubmit={onSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FloatingInput id={mobile ? 'm-usuario' : 'usuario'} label="Usuario"
        value={usuario} onChange={setUsuario} mobile={mobile} />
      <FloatingInput id={mobile ? 'm-contrasena' : 'contrasena'} label="Contraseña"
        value={contrasena} onChange={setContrasena} isPassword mobile={mobile} />

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ color: mobile ? '#ffcdd2' : '#d32f2f', fontSize: 12, textAlign: 'center', marginTop: -4 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', padding: '14px 0', marginTop: 4,
          background: '#1565c0', color: '#fff', border: 'none',
          borderRadius: mobile ? 14 : 8,
          fontSize: 16, fontWeight: 600, letterSpacing: '0.03em',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: loading ? 0.75 : 1,
        }}
      >
        {loading
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Ingresando...
            </span>
          : 'Ingresar'
        }
      </motion.button>

      <button type="button" style={{
        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        color: mobile ? 'rgba(255,255,255,0.85)' : '#1565c0', fontSize: 14, marginTop: -4,
      }}>
        ¿Olvidaste tu contraseña?
      </button>

      {mobile && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>o</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.3)' }} />
          </div>
          <button type="button" style={{
            width: '100%', padding: '13px 0',
            background: '#fff', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 600, color: '#444',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Iniciar sesión con Google
          </button>
        </>
      )}
    </form>
  )
}
