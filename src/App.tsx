import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LoginPage       from './pages/LoginPage'
import DashboardPage   from './pages/DashboardPage'
import AuditoriosPage  from './pages/AuditoriosPage'
import EventosPage     from './pages/EventosPage'
import SolicitudesPage from './pages/SolicitudesPage'
import CatalogoPage    from './pages/CatalogoPage'
import MisReservasPage from './pages/MisReservasPage'
import UsuariosPage    from './pages/UsuariosPage'

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <span style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user || !user.activo) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user && user.activo) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />

      <Route path="/auditorios" element={
        <ProtectedRoute><AuditoriosPage /></ProtectedRoute>
      } />

      <Route path="/eventos" element={
        <ProtectedRoute roles={['admin', 'docente']}><EventosPage /></ProtectedRoute>
      } />

      <Route path="/solicitudes" element={
        <ProtectedRoute roles={['admin', 'docente']}><SolicitudesPage /></ProtectedRoute>
      } />

      <Route path="/nueva-solicitud" element={
        <ProtectedRoute roles={['docente']}><SolicitudesPage /></ProtectedRoute>
      } />

      <Route path="/catalogo" element={
        <ProtectedRoute roles={['alumno', 'docente']}><CatalogoPage /></ProtectedRoute>
      } />

      <Route path="/mis-reservas" element={
        <ProtectedRoute roles={['alumno', 'docente']}><MisReservasPage /></ProtectedRoute>
      } />

      <Route path="/usuarios" element={
        <ProtectedRoute roles={['admin']}><UsuariosPage /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
