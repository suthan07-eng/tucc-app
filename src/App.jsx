import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './components/LandingPage'
import Home from './components/Home'
import Register from './components/Register'
import Availability from './components/Availability'
import Success from './components/Success'
import League from './components/League'
import Stats from './components/Stats'
import ResultsPage from './components/ResultsPage'
import FixturesPage from './components/FixturesPage'
import PlayersPage from './components/PlayersPage'
import AdminLogin from './components/admin/AdminLogin'
import AdminDashboard from './components/admin/AdminDashboard'

// Protects all player-facing routes — redirects to /login if not signed in
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null // wait for session to resolve
  return user ? children : <Navigate to="/login" replace />
}

// Admin-only protection (separate from player auth)
function RequireAdmin({ children }) {
  const isAdmin = sessionStorage.getItem('tucc_admin')
  return isAdmin ? children : <Navigate to="/admin/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public — landing / login */}
      <Route path="/login" element={<LandingPage />} />

      {/* Protected player routes */}
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/register" element={<RequireAuth><Register /></RequireAuth>} />
      <Route path="/availability" element={<RequireAuth><Availability /></RequireAuth>} />
      <Route path="/success" element={<RequireAuth><Success /></RequireAuth>} />
      <Route path="/league" element={<RequireAuth><League /></RequireAuth>} />
      <Route path="/stats" element={<RequireAuth><Stats /></RequireAuth>} />
      <Route path="/results" element={<RequireAuth><ResultsPage /></RequireAuth>} />
      <Route path="/fixtures" element={<RequireAuth><FixturesPage /></RequireAuth>} />
      <Route path="/players" element={<RequireAuth><PlayersPage /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Fixed full-screen texture layer — sits behind all page content
function TextureBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      backgroundColor: '#f8fafc',
      backgroundImage: `
        linear-gradient(rgba(99,126,184,0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,126,184,0.12) 1px, transparent 1px),
        linear-gradient(rgba(99,126,184,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,126,184,0.06) 1px, transparent 1px)
      `,
      backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px',
      backgroundPosition: '-1px -1px, -1px -1px, -1px -1px, -1px -1px',
    }} />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <TextureBackground />
      <AppRoutes />
    </AuthProvider>
  )
}
