import { motion } from 'framer-motion'
import { ShieldAlert, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { signOut } from '../lib/auth'
import { CambiarPasswordForm } from '../components/CambiarPassword'
import unpShield from '../assets/unp-shield.png'
import campusBg from '../assets/campus-bg.png'

/**
 * Pantalla de cambio de contraseña OBLIGATORIO al primer ingreso.
 * Bloquea todo el sistema hasta que el usuario cambie la contraseña
 * inicial (su DNI) que le asignó el administrador. Mantiene el diseño
 * del login: fondo del campus + tarjeta blanca con el escudo UNP.
 */
export default function CambiarPasswordObligatorio() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    await refresh()
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 16, boxSizing: 'border-box',
    }}>
      {/* Fondo campus (igual que el login) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img src={campusBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,71,161,0.78)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{
          position: 'relative', zIndex: 1, background: '#fff', borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', padding: '32px 32px 24px',
          width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
        <img src={unpShield} alt="Escudo UNP" style={{ width: 88, height: 88, objectFit: 'contain' }} />
        <h1 style={{ marginTop: 12, textAlign: 'center', color: '#1a237e', fontWeight: 700, fontSize: 17, lineHeight: 1.4 }}>
          UNIVERSIDAD NACIONAL DE PIURA
        </h1>

        <div style={{
          marginTop: 14, marginBottom: 18, background: '#fff8e1', border: '1px solid #ffe082',
          borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <ShieldAlert size={18} color="#e65100" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: '#795548', margin: 0, lineHeight: 1.5 }}>
            <strong>Cambia tu contraseña para continuar.</strong><br />
            Tu cuenta fue creada con tu DNI como contraseña inicial. Por seguridad,
            debes definir una contraseña propia antes de usar el sistema.
          </p>
        </div>

        <p style={{ fontSize: 12, color: '#9e9e9e', margin: '0 0 14px', alignSelf: 'flex-start' }}>
          Sesión: <strong style={{ color: '#555' }}>{user?.email}</strong>
        </p>

        <CambiarPasswordForm labelActual="Contraseña actual (tu DNI)" onSuccess={refresh} />

        <button onClick={handleSignOut} style={{
          marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          color: '#d32f2f', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <LogOut size={14} /> Cerrar sesión
        </button>
      </motion.div>
    </div>
  )
}
