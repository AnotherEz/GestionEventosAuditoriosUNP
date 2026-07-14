import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, KeyRound, CheckCircle, X } from 'lucide-react'
import { cambiarPassword } from '../lib/auth'

/* ─── Input de contraseña con etiqueta flotante (mismo lenguaje visual del login) ─── */
function PasswordInput({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const lifted = focused || value.length > 0

  return (
    <div style={{ position: 'relative', width: '100%', height: 56 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 8,
        border: `${focused ? 2 : 1}px solid ${focused ? '#1565c0' : '#aaaaaa'}`,
        background: focused ? '#e8f0fe' : '#ffffff',
        transition: 'border-color 150ms, background 150ms', pointerEvents: 'none',
      }} />
      <label htmlFor={id} style={{
        position: 'absolute', left: 16, pointerEvents: 'none', userSelect: 'none',
        transformOrigin: 'left top', transition: 'transform 150ms ease, color 150ms ease',
        transform: lifted ? 'translateY(8px) scale(0.72)' : 'translateY(18px) scale(1)',
        fontSize: 15, lineHeight: 1, color: '#1565c0', fontWeight: lifted ? 500 : 400,
      }}>{label}</label>
      <input id={id} type={show ? 'text' : 'password'} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          background: 'transparent', border: 'none', outline: 'none',
          borderRadius: 8, fontSize: 15, color: '#111827',
          paddingLeft: 16, paddingRight: 44, paddingTop: 22, paddingBottom: 4,
          boxSizing: 'border-box', fontFamily: 'inherit',
        }} />
      <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', padding: 4, cursor: 'pointer',
        color: '#1565c0', display: 'flex', alignItems: 'center',
      }}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

/* ─── Formulario de cambio de contraseña (compartido: forzado y voluntario) ─── */
export function CambiarPasswordForm({ onSuccess, labelActual = 'Contraseña actual' }: {
  onSuccess: () => void
  labelActual?: string
}) {
  const [actual,    setActual]    = useState('')
  const [nueva,     setNueva]     = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!actual || !nueva || !confirmar) { setError('Completa todos los campos.'); return }
    if (nueva.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return }
    if (nueva === actual) { setError('La nueva contraseña debe ser diferente a la actual.'); return }
    if (nueva !== confirmar) { setError('La confirmación no coincide con la nueva contraseña.'); return }

    setLoading(true)
    try {
      await cambiarPassword(actual, nueva)
      setDone(true)
      setTimeout(onSuccess, 1400)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0', textAlign: 'center' }}>
        <CheckCircle size={44} color="#2e7d32" />
        <p style={{ color: '#2e7d32', fontWeight: 700, fontSize: 16, margin: 0 }}>¡Contraseña actualizada!</p>
        <p style={{ color: '#555', fontSize: 13, margin: 0 }}>Ya puedes seguir usando el sistema.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PasswordInput id="cp-actual" label={labelActual} value={actual} onChange={setActual} />
      <PasswordInput id="cp-nueva" label="Nueva contraseña (mín. 8 caracteres)" value={nueva} onChange={setNueva} />
      <PasswordInput id="cp-conf" label="Confirmar nueva contraseña" value={confirmar} onChange={setConfirmar} />

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ color: '#d32f2f', fontSize: 12, textAlign: 'center', margin: 0 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '13px 0', background: loading ? '#90caf9' : '#1565c0', color: '#fff',
        border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <KeyRound size={17} /> {loading ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}

/* ─── Modal para el cambio VOLUNTARIO desde "Mi cuenta" (menú lateral) ─── */
// Nota: sin AnimatePresence a propósito. Con framer-motion 12 + React 19,
// los fragmentos dentro de AnimatePresence no se desmontan al terminar el
// exit y el modal invisible queda bloqueando los clics de toda la página.
export function CambiarPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          background: '#fff', borderRadius: 16, padding: 28, width: '90%', maxWidth: 420, zIndex: 101,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a237e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={19} /> Cambiar contraseña
          </h2>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563' }}>
            <X size={20} />
          </button>
        </div>
        <CambiarPasswordForm onSuccess={onClose} />
      </motion.div>
    </>
  )
}
