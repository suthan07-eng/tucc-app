import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useActivityLog, useButtonTracking } from './hooks/useActivityLog'

// Public marketing pages (code-split so each route loads on demand)
const PublicHome       = lazy(() => import('./public/pages/PublicHome'))
const PublicAbout      = lazy(() => import('./public/pages/PublicAbout'))
const PublicCommittee  = lazy(() => import('./public/pages/PublicCommittee'))
const PublicMembership = lazy(() => import('./public/pages/PublicMembership'))
const PublicJoin       = lazy(() => import('./public/pages/PublicJoin'))
const PublicGallery    = lazy(() => import('./public/pages/PublicGallery'))
const PublicContact    = lazy(() => import('./public/pages/PublicContact'))
const PublicSponsors   = lazy(() => import('./public/pages/PublicSponsors'))
const PublicPlayers    = lazy(() => import('./public/pages/PublicPlayers'))

// Auth / member dashboard
const LandingPage  = lazy(() => import('./components/LandingPage'))
const Home         = lazy(() => import('./components/Home'))
const Register     = lazy(() => import('./components/Register'))
const Availability = lazy(() => import('./components/Availability'))
const Success      = lazy(() => import('./components/Success'))
const League       = lazy(() => import('./components/League'))
const Stats        = lazy(() => import('./components/Stats'))
const ResultsPage  = lazy(() => import('./components/ResultsPage'))
const FixturesPage = lazy(() => import('./components/FixturesPage'))
const PlayersPage  = lazy(() => import('./components/PlayersPage'))
const GalleryPage  = lazy(() => import('./components/GalleryPage'))
const AnalysePage  = lazy(() => import('./components/AnalysePage'))

// Admin (heavy — only loads when an admin visits)
const AdminLogin     = lazy(() => import('./components/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))

// Misc
const ResetPassword = lazy(() => import('./components/ResetPassword'))
const NotFound      = lazy(() => import('./components/NotFound'))
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'))
const TermsOfUse    = lazy(() => import('./components/legal/TermsOfUse'))
const CookiePolicy  = lazy(() => import('./components/legal/CookiePolicy'))

// Lightweight full-screen loader shown while a route chunk downloads
function RouteFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060d1f' }}>
      <div style={{ width: 44, height: 44, border: '4px solid rgba(233,160,32,0.2)', borderTopColor: '#e9a020', borderRadius: '50%', animation: 'appSpin 0.8s linear infinite' }} />
      <style>{`@keyframes appSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

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
    <Suspense fallback={<RouteFallback />}>
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
      <Route path="/squad"   element={<PublicPlayers />} />

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
    </Suspense>
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
      // Dark navy base — matches the public site (lighter-weight dark for the portal)
      backgroundColor: '#0a1228',
      backgroundImage: `
        radial-gradient(ellipse 80% 50% at 20% -10%, rgba(37,99,235,0.16) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 110%, rgba(233,160,32,0.07) 0%, transparent 55%),
        repeating-linear-gradient(
          -45deg,
          transparent 0px,
          transparent 18px,
          rgba(255,255,255,0.012) 18px,
          rgba(255,255,255,0.012) 19px
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
