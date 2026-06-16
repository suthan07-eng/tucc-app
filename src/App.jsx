import { lazy, Suspense, Component } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useActivityLog, useButtonTracking } from './hooks/useActivityLog'

// Lazy import with one retry + reload-on-stale-chunk, so a transient/stale
// chunk fetch never leaves the user on a blank screen.
function lazyWithRetry(factory) {
  return lazy(() =>
    factory().catch(() =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          factory().then(resolve).catch((err) => {
            try {
              if (!sessionStorage.getItem('tucc_chunk_reload')) {
                sessionStorage.setItem('tucc_chunk_reload', '1')
                window.location.reload()
                return
              }
            } catch (e) {}
            reject(err)
          })
        }, 400)
      })
    )
  )
}

// Public marketing pages (code-split so each route loads on demand)
const PublicHome       = lazyWithRetry(() => import('./public/pages/PublicHome'))
const PublicAbout      = lazyWithRetry(() => import('./public/pages/PublicAbout'))
const PublicCommittee  = lazyWithRetry(() => import('./public/pages/PublicCommittee'))
const PublicMembership = lazyWithRetry(() => import('./public/pages/PublicMembership'))
const PublicJoin       = lazyWithRetry(() => import('./public/pages/PublicJoin'))
const PublicGallery    = lazyWithRetry(() => import('./public/pages/PublicGallery'))
const PublicContact    = lazyWithRetry(() => import('./public/pages/PublicContact'))
const PublicSponsors   = lazyWithRetry(() => import('./public/pages/PublicSponsors'))
const PublicPlayers    = lazyWithRetry(() => import('./public/pages/PublicPlayers'))

// Auth / member dashboard
const LandingPage  = lazyWithRetry(() => import('./components/LandingPage'))
const Home         = lazyWithRetry(() => import('./components/Home'))
const Register     = lazyWithRetry(() => import('./components/Register'))
const Availability = lazyWithRetry(() => import('./components/Availability'))
const Success      = lazyWithRetry(() => import('./components/Success'))
const League       = lazyWithRetry(() => import('./components/League'))
const Stats        = lazyWithRetry(() => import('./components/Stats'))
const ResultsPage  = lazyWithRetry(() => import('./components/ResultsPage'))
const FixturesPage = lazyWithRetry(() => import('./components/FixturesPage'))
const PlayersPage  = lazyWithRetry(() => import('./components/PlayersPage'))
const GalleryPage  = lazyWithRetry(() => import('./components/GalleryPage'))
const AnalysePage  = lazyWithRetry(() => import('./components/AnalysePage'))

// Admin (heavy — only loads when an admin visits)
const AdminLogin     = lazyWithRetry(() => import('./components/admin/AdminLogin'))
const AdminDashboard = lazyWithRetry(() => import('./components/admin/AdminDashboard'))

// Misc
const ResetPassword = lazyWithRetry(() => import('./components/ResetPassword'))
const NotFound      = lazyWithRetry(() => import('./components/NotFound'))
const PrivacyPolicy = lazyWithRetry(() => import('./components/legal/PrivacyPolicy'))
const TermsOfUse    = lazyWithRetry(() => import('./components/legal/TermsOfUse'))
const CookiePolicy  = lazyWithRetry(() => import('./components/legal/CookiePolicy'))

// Lightweight full-screen loader shown while a route chunk downloads
function RouteFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060d1f' }}>
      <div style={{ width: 44, height: 44, border: '4px solid rgba(233,160,32,0.2)', borderTopColor: '#e9a020', borderRadius: '50%', animation: 'appSpin 0.8s linear infinite' }} />
      <style>{`@keyframes appSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// Catches any render/chunk error so the user never sees a blank screen —
// offers a one-tap reload instead.
class RouteErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err) {
    const msg = (err && err.message) || ''
    // Stale chunk after a deploy → reload once to fetch the fresh build
    if (/dynamically imported module|module script failed|Failed to fetch|Importing a module/i.test(msg)) {
      try {
        if (!sessionStorage.getItem('tucc_chunk_reload')) {
          sessionStorage.setItem('tucc_chunk_reload', '1')
          window.location.reload()
        }
      } catch (e) {}
    }
  }
  render() {
    if (this.state.failed) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, background: '#060d1f', color: '#fff', fontFamily: "'Outfit', sans-serif", textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 40 }}>🏏</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Just a moment…</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 320, lineHeight: 1.5 }}>The page didn’t finish loading. Tap below to reload.</div>
          <button onClick={() => { try { sessionStorage.removeItem('tucc_chunk_reload') } catch (e) {} window.location.reload() }}
            style={{ background: '#e9a020', color: '#1a0a00', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
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
    <RouteErrorBoundary>
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
    </RouteErrorBoundary>
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
