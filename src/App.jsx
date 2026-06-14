import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useActivityLog, useButtonTracking } from './hooks/useActivityLog'
import LandingPage from './components/LandingPage'
import Home from './components/Home'
import PublicHome from './public/pages/PublicHome'
import PublicAbout from './public/pages/PublicAbout'
import PublicCommittee from './public/pages/PublicCommittee'
import PublicMembership from './public/pages/PublicMembership'
import PublicJoin from './public/pages/PublicJoin'
import PublicGallery from './public/pages/PublicGallery'
import PublicContact from './public/pages/PublicContact'
import PublicSponsors from './public/pages/PublicSponsors'
import Register from './components/Register'
import Availability from './components/Availability'
import Success from './components/Success'
import League from './components/League'
import Stats from './components/Stats'
import ResultsPage from './components/ResultsPage'
import FixturesPage from './components/FixturesPage'
import PlayersPage from './components/PlayersPage'
import GalleryPage from './components/GalleryPage'
import AnalysePage from './components/AnalysePage'
import AdminLogin from './components/admin/AdminLogin'
import AdminDashboard from './components/admin/AdminDashboard'
import ResetPassword from './components/ResetPassword'
import NotFound from './components/NotFound'
import PrivacyPolicy from './components/legal/PrivacyPolicy'
import TermsOfUse from './components/legal/TermsOfUse'
import CookiePolicy from './components/legal/CookiePolicy'

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

function ActivityTracker() {
  const { user } = useAuth()
  useActivityLog(user)
  useButtonTracking(user)
  return null
}

function AppRoutes() {
  return (
    <>
    <ActivityTracker />
    <Routes>
      {/* Public marketing site */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/about" element={<PublicAbout />} />
      <Route path="/committee" element={<PublicCommittee />} />
      <Route path="/membership" element={<PublicMembership />} />
      <Route path="/join" element={<PublicJoin />} />
      <Route path="/photos" element={<PublicGallery />} />
      <Route path="/contact" element={<PublicContact />} />
      <Route path="/sponsors" element={<PublicSponsors />} />

      {/* Public — landing / login */}
      <Route path="/login" element={<LandingPage />} />

      {/* Member dashboard (moved from / to /app) */}
      <Route path="/app" element={<RequireAuth><Home /></RequireAuth>} />

      {/* Protected player routes */}
      <Route path="/register" element={<RequireAuth><Register /></RequireAuth>} />
      <Route path="/availability" element={<RequireAuth><Availability /></RequireAuth>} />
      <Route path="/success" element={<RequireAuth><Success /></RequireAuth>} />
      <Route path="/league" element={<RequireAuth><League /></RequireAuth>} />
      <Route path="/stats" element={<RequireAuth><Stats /></RequireAuth>} />
      <Route path="/results" element={<RequireAuth><ResultsPage /></RequireAuth>} />
      <Route path="/fixtures" element={<RequireAuth><FixturesPage /></RequireAuth>} />
      <Route path="/players" element={<RequireAuth><PlayersPage /></RequireAuth>} />
      <Route path="/gallery"  element={<RequireAuth><GalleryPage /></RequireAuth>} />
      <Route path="/analyse" element={<RequireAuth><AnalysePage /></RequireAuth>} />

      {/* Password reset (public — accessed via email link) */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Legal pages (public) */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms"   element={<TermsOfUse />} />
      <Route path="/cookies" element={<CookiePolicy />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

      {/* 404 */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}

// Fixed full-screen texture layer — sits behind all page content
function TextureBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      // Soft blue-tinted base — slightly warmer than pure white, cohesive with brand
      backgroundColor: '#eef2ff',
      backgroundImage: `
        radial-gradient(ellipse 80% 50% at 20% -10%, rgba(37,99,235,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99,102,241,0.06) 0%, transparent 55%),
        repeating-linear-gradient(
          -45deg,
          transparent 0px,
          transparent 18px,
          rgba(37,99,235,0.028) 18px,
          rgba(37,99,235,0.028) 19px
        )
      `,
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
