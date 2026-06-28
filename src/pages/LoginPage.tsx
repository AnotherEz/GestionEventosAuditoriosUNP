import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, UserCircle, Monitor, GraduationCap, BookOpen,
  Users, Globe, FileText, Award, Search, Building2, BookMarked, Heart,
} from 'lucide-react'
import unpShield from '../assets/unp-shield.png'
import campusBg from '../assets/campus-bg.png'

/* ─── Servicios ─────────────────────────────────────────────────────────────── */
const SERVICES = {
  'Pregrado': [
    { label: 'Admisión',                          icon: UserCircle },
    { label: 'Matrícula',                          icon: Monitor },
    { label: 'Intranet',                           icon: UserCircle },
    { label: 'Aula Virtual',                       icon: Monitor },
    { label: 'Gestión de Tutoría',                 icon: BookOpen },
    { label: 'Gestión y Programación',             icon: Users },
    { label: 'Gestión de Biblioteca',              icon: BookMarked },
    { label: 'Responsabilidad Social',             icon: Heart },
    { label: 'Seguimiento al egresado',            icon: GraduationCap },
    { label: 'Cooperación Nacional e Internacional', icon: Globe },
    { label: 'Gestión de Tesis',                   icon: FileText },
    { label: 'Grados y Títulos',                   icon: Award },
    { label: 'Investigación Docente',              icon: Search },
    { label: 'Incubadora de Empresas',             icon: Building2 },
  ],
  'Posgrado y Extensión': [
    { label: 'Admisión Posgrado',      icon: UserCircle },
    { label: 'Matrícula Posgrado',     icon: Monitor },
    { label: 'Aula Virtual',           icon: Monitor },
    { label: 'Gestión de Tutoría',     icon: BookOpen },
    { label: 'Investigación',          icon: Search },
    { label: 'Gestión de Tesis',       icon: FileText },
    { label: 'Grados y Títulos',       icon: Award },
    { label: 'Extensión Universitaria',icon: Globe },
  ],
  'Gestión Administrativa': [
    { label: 'Gestión de Tutoría',       icon: BookOpen },
    { label: 'Gestión y Programación',   icon: Users },
    { label: 'Gestión de Biblioteca',    icon: BookMarked },
    { label: 'Responsabilidad Social',   icon: Heart },
    { label: 'Cooperación Internacional',icon: Globe },
    { label: 'Gestión de Tesis',         icon: FileText },
    { label: 'Grados y Títulos',         icon: Award },
    { label: 'Investigación Docente',    icon: Search },
  ],
  'Centros de Producción': [
    { label: 'Investigación Docente',    icon: Search },
    { label: 'Incubadora de Empresas',   icon: Building2 },
    { label: 'Gestión y Programación',   icon: Users },
    { label: 'Cooperación Internacional',icon: Globe },
  ],
}
type Tab = keyof typeof SERVICES
const TABS = Object.keys(SERVICES) as Tab[]

/* ─── Floating Label Input ───────────────────────────────────────────────────── */
function FloatingInput({
  id, label, value, onChange, isPassword = false,
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void; isPassword?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const [showPwd, setShowPwd]   = useState(false)
  const lifted = focused || value.length > 0

  return (
    <div style={{ position: 'relative', width: '100%', height: '56px' }}>
      {/* Border wrapper */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '8px',
        border: `${focused ? '2px' : '1px'} solid ${focused ? '#1565c0' : '#aaaaaa'}`,
        background: focused ? '#e8f0fe' : '#ffffff',
        transition: 'border-color 150ms ease, border-width 150ms ease, background 150ms ease',
        pointerEvents: 'none',
      }} />

      {/* Floating label */}
      <label htmlFor={id} style={{
        position: 'absolute',
        left: '14px',
        pointerEvents: 'none',
        userSelect: 'none',
        transformOrigin: 'left center',
        transition: 'transform 150ms ease, color 150ms ease',
        transform: lifted
          ? 'translateY(8px) scale(0.72)'
          : 'translateY(18px) scale(1)',
        fontSize: '15px',
        lineHeight: 1,
        color: focused ? '#1565c0' : '#757575',
        fontWeight: lifted && focused ? 600 : 400,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </label>

      {/* Actual input */}
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
          background: 'transparent',
          border: 'none', outline: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          color: '#111827',
          paddingLeft: '14px',
          paddingRight: isPassword ? '44px' : '14px',
          paddingTop: '22px',
          paddingBottom: '4px',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />

      {/* Toggle password */}
      {isPassword && (
        <button
          type="button" tabIndex={-1}
          onClick={() => setShowPwd(p => !p)}
          style={{
            position: 'absolute', right: '12px',
            top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', padding: '4px',
            cursor: 'pointer', color: '#757575',
            display: 'flex', alignItems: 'center',
          }}
        >
          {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  )
}

/* ─── Shield ─────────────────────────────────────────────────────────────────── */
function Shield() {
  const [failed, setFailed] = useState(false)
  if (failed) return (
    <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"
      style={{ width: 112, height: 112, margin: '0 auto', display: 'block' }}>
      <path d="M60 5 L110 25 L110 75 C110 105 60 135 60 135 C60 135 10 105 10 75 L10 25 Z"
        fill="#003087" stroke="#c8a951" strokeWidth="3" />
      <path d="M60 15 L100 30 L100 75 C100 100 60 125 60 125 C60 125 20 100 20 75 L20 30 Z"
        fill="#0047ab" />
      <text x="60" y="75" textAnchor="middle" fill="white" fontSize="12"
        fontWeight="bold" fontFamily="serif">UNP</text>
    </svg>
  )
  return (
    <img src={unpShield} alt="Escudo UNP" onError={() => setFailed(true)}
      style={{ width: 112, height: 112, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
  )
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [usuario,   setUsuario]   = useState('')
  const [contrasena,setContrasena]= useState('')
  const [activeTab, setActiveTab] = useState<Tab>('Pregrado')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario || !contrasena) { setError('Ingrese su usuario y contraseña.'); return }
    setError(''); setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setError('Usuario o contraseña incorrectos.')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: 320, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#ffffff',
        padding: '32px 36px',
        boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
        zIndex: 10,
      }}>
        <Shield />

        <h1 style={{
          marginTop: 16, textAlign: 'center',
          color: '#1a237e', fontWeight: 700,
          fontSize: 18, lineHeight: 1.4,
          letterSpacing: '0.02em',
        }}>
          UNIVERSIDAD<br />NACIONAL<br />DE PIURA
        </h1>

        <p style={{ marginTop: 4, marginBottom: 24, color: '#9e9e9e', fontSize: 15, fontWeight: 400 }}>
          Bienvenido
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FloatingInput id="usuario"    label="Usuario"    value={usuario}    onChange={setUsuario} />
          <FloatingInput id="contrasena" label="Contraseña" value={contrasena} onChange={setContrasena} isPassword />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ color: '#d32f2f', fontSize: 12, textAlign: 'center', marginTop: -4 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit" disabled={loading}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '13px 0',
              background: loading ? '#5b8ed6' : '#1565c0',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: 15, fontWeight: 600, letterSpacing: '0.03em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#0d47a1' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#1565c0' }}
          >
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Ingresando...
                </span>
              : 'Ingresar'
            }
          </motion.button>
        </form>

        <button style={{
          marginTop: 12, background: 'none', border: 'none',
          color: '#1565c0', fontSize: 13, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          ¿Olvidaste tu contraseña?
        </button>

        <div style={{ marginTop: 32, width: 40, height: 4, background: '#e0e0e0', borderRadius: 2 }} />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src={campusBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(13, 71, 161, 0.78)' }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 24px 16px' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid rgba(255,255,255,0.25)', marginBottom: 20, flexShrink: 0 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                paddingBottom: 12, fontSize: 14, fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab ? '#fff' : 'rgba(144,202,249,0.9)',
                position: 'relative', whiteSpace: 'nowrap',
                fontFamily: 'inherit', transition: 'color 150ms',
              }}>
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tab-indicator" style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 2, background: '#fff', borderRadius: 2,
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Service cards grid */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 12,
              overflowY: 'auto',
              paddingRight: 4,
              flex: 1,
            }}
          >
            {SERVICES[activeTab].map((svc, i) => {
              const Icon = svc.icon
              return (
                <motion.div
                  key={svc.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    borderRadius: 12,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 10, padding: '20px 12px',
                    cursor: 'pointer',
                    transition: 'background 150ms, transform 150ms',
                    minHeight: 110,
                  }}
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,1)' }}
                >
                  <Icon size={30} color="#1565c0" strokeWidth={1.6} />
                  <span style={{
                    color: '#1a237e', fontSize: 11, textAlign: 'center',
                    lineHeight: 1.3, fontWeight: 500,
                  }}>
                    {svc.label}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Bottom watermark */}
          <div style={{ paddingTop: 12, flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
              Bienvenido a
            </p>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
