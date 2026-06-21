import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, BarChart2, ShieldCheck, ClipboardList,
  Menu, X, Home, Calendar, ChevronRight, CalendarDays, Users, LogOut, Image, Search, Globe,
} from 'lucide-react'
import { C, FONT, MAX_WIDTH } from '../constants'
import { useAuth } from '../context/AuthContext'
import { SpatialBackground } from './ui/spatial'

const EASE = [0.23, 1, 0.32, 1]

// Per-page cinematic cricket backdrop (portal only) — a unique scene per page
// Pages with an animated video backdrop (poster falls back to the matching image)
const HERO_VIDEO = {
  '/app': '/portal-bg/hero.mp4',
}
// Lighter readability scrim on pages where the backdrop should read more strongly
const LIGHT_SCRIM = 'linear-gradient(to bottom, rgba(10,18,40,0.10) 0%, rgba(10,18,40,0.16) 50%, rgba(10,18,40,0.42) 100%)'
const HERO_SCRIM = {
  '/results':  LIGHT_SCRIM,
  '/fixtures': LIGHT_SCRIM,
  '/players':  LIGHT_SCRIM,
  '/stats':    LIGHT_SCRIM,
}
const HERO_BG = {
  '/app':          '/portal-bg/hero-poster.webp',
  '/availability': '/portal-bg/huddle.webp',
  '/league':       '/portal-bg/pitch.webp',
  '/fixtures':     '/portal-bg/bowler.webp',
  '/results':      '/portal-bg/stumps.webp',
  '/players':      '/portal-bg/batsman.webp',
  '/stats':        '/portal-bg/scoreboard.webp',
  '/gallery':      '/portal-bg/trophy.webp',
  '/analyse':      '/portal-bg/ball.webp',
  '/register':     '/portal-bg/gear.webp',
  '/success':      '/portal-bg/trophy.webp',
  _default:        '/portal-bg/stadium.webp',
}

const MENU_LINKS = [
  { path: '/app',          label: 'Home',         Icon: Home,          color: '#1d4ed8', bg: 'rgba(59,130,246,0.12)' },
  { path: '/league',       label: 'League Table', Icon: Trophy,        color: '#b45309', bg: 'rgba(233,160,32,0.12)' },
  { path: '/fixtures',     label: 'Fixtures',     Icon: CalendarDays,  color: '#1d4ed8', bg: 'rgba(59,130,246,0.12)' },
  { path: '/results',      label: 'Last Results', Icon: ClipboardList, color: '#0369a1', bg: 'rgba(59,130,246,0.14)' },
  { path: '/players',      label: 'Players',      Icon: Users,         color: '#7c3aed', bg: 'rgba(168,85,247,0.14)' },
  { path: '/stats',        label: 'Statistics',   Icon: BarChart2,     color: '#6d28d9', bg: 'rgba(168,85,247,0.12)' },
  { path: '/availability', label: 'Availability', Icon: Calendar,      color: '#0891b2', bg: 'rgba(6,182,212,0.12)' },
  { path: '/gallery',      label: 'Gallery',      Icon: Image,         color: '#db2777', bg: 'rgba(236,72,153,0.12)' },
  { path: '/analyse',      label: 'Analyse',      Icon: Search,        color: '#0891b2', bg: 'rgba(6,182,212,0.12)' },
]

const TOP_LINKS = [
  { path: '/league',   label: 'League',   Icon: Trophy },
  { path: '/fixtures', label: 'Fixtures', Icon: CalendarDays },
  { path: '/results',  label: 'Results',  Icon: ClipboardList },
  { path: '/players',  label: 'Players',  Icon: Users },
  { path: '/gallery',  label: 'Gallery',  Icon: Image },
  { path: '/stats',    label: 'Stats',    Icon: BarChart2 },
  { path: '/analyse',  label: 'Analyse',  Icon: Search },
]

export default function Nav() {
  const nav           = useNavigate()
  const { pathname }  = useLocation()
  const isAdmin       = pathname.startsWith('/admin')
  const [open, setOpen] = useState(false)
  const { signOut }   = useAuth()

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [pathname])
  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Spatial depth layer + cinematic cricket backdrop (portal only) ── */}
      {!isAdmin && <SpatialBackground image={HERO_BG[pathname] || HERO_BG._default} video={HERO_VIDEO[pathname]} scrim={HERO_SCRIM[pathname]} />}

      {/* ── Top bar ── */}
      <nav
        aria-label="Main navigation"
        style={{
          position: 'sticky', top: 0, zIndex: 200,
          background: 'linear-gradient(180deg, rgba(12,22,48,0.74), rgba(10,18,40,0.55))',
          backdropFilter: 'blur(22px) saturate(170%)',
          WebkitBackdropFilter: 'blur(22px) saturate(170%)',
          borderBottom: '1px solid rgba(255,255,255,.10)',
          boxShadow: '0 8px 30px -8px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* gold hairline accent */}
        <div aria-hidden style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(233,160,32,0.55), rgba(96,165,250,0.4), transparent)' }} />
        <div style={{
          maxWidth: MAX_WIDTH, margin: '0 auto',
          padding: '0 16px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo + brand */}
          <motion.button
            onClick={() => nav('/app')}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.14, ease: EASE }}
            aria-label="Go to home"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
              minHeight: 44, flexShrink: 0,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,.3)',
            }}>
              <img src="/logo.png" alt="TUCC" width={36} height={36} style={{ objectFit: 'contain' }} />
            </div>
            <div className="tucc-nav-brand-text">
              <div style={{ color: C.gold, fontFamily: FONT, fontWeight: 800, fontSize: 13, letterSpacing: -0.2, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                Tamil United CC
              </div>
              <div style={{ color: 'rgba(255,255,255,.38)', fontFamily: FONT, fontSize: 10, marginTop: 1, whiteSpace: 'nowrap' }}>
                formerly known as DTU CC
              </div>
            </div>
          </motion.button>

          {/* Desktop nav links */}
          {!isAdmin && (
            <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {TOP_LINKS.map(({ path, label, Icon }) => {
                const isActive = pathname === path
                return (
                  <DesktopNavItem
                    key={path}
                    label={label}
                    Icon={Icon}
                    isActive={isActive}
                    onClick={() => nav(path)}
                  />
                )
              })}
              <motion.a
                href="/"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                title="Go to the public website"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'rgba(255,255,255,.7)', textDecoration: 'none',
                  background: 'rgba(255,255,255,.08)',
                  border: '1.5px solid rgba(255,255,255,.15)',
                  borderRadius: 10, padding: '8px 12px',
                  cursor: 'pointer',
                  fontFamily: FONT, fontWeight: 700, fontSize: 13,
                  marginLeft: 8, minHeight: 38,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)' }}
              >
                <Globe size={14} strokeWidth={2.5} />
                Site
              </motion.a>
              <motion.button
                onClick={() => signOut()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'rgba(255,255,255,.7)',
                  background: 'rgba(255,255,255,.08)',
                  border: '1.5px solid rgba(255,255,255,.15)',
                  borderRadius: 10, padding: '8px 14px',
                  cursor: 'pointer',
                  fontFamily: FONT, fontWeight: 700, fontSize: 13,
                  marginLeft: 6, minHeight: 38,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)' }}
              >
                <LogOut size={14} strokeWidth={2.5} />
                Logout
              </motion.button>
            </div>
          )}

          {/* Mobile hamburger */}
          {!isAdmin && (
            <motion.button
              className="nav-hamburger"
              onClick={() => setOpen(o => !o)}
              whileTap={{ scale: 0.92 }}
              aria-label={open ? 'Close menu' : 'Open menu'}
              style={{
                display: 'none',
                width: 44, height: 44, borderRadius: 12,
                background: open ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.1)',
                border: '1.5px solid rgba(255,255,255,.18)',
                cursor: 'pointer', color: '#fff',
                alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms ease',
                flexShrink: 0,
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={open ? 'x' : 'menu'}
                  initial={{ opacity: 0, rotate: open ? -90 : 90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: open ? 90 : -90, scale: 0.7 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {open ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          )}

          {/* Admin page — just brand, no links */}
          {isAdmin && (
            <div style={{
              background: 'rgba(233,160,32,.12)',
              border: '1px solid rgba(233,160,32,.3)',
              borderRadius: 8, padding: '4px 12px',
              fontFamily: FONT, fontSize: 11, fontWeight: 700,
              color: C.gold, letterSpacing: 0.5,
            }}>
              ADMIN
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile full-screen menu ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 190,
                background: 'rgba(0,0,0,.45)',
                backdropFilter: 'blur(4px)',
              }}
            />

            {/* Slide-in panel */}
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', duration: 0.45, bounce: 0.08 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(320px, 88vw)',
                zIndex: 210,
                background: C.white,
                display: 'flex', flexDirection: 'column',
                boxShadow: '-8px 0 40px rgba(0,0,0,.2)',
                overflowY: 'auto',
              }}
            >
              {/* Panel header */}
              <div style={{
                background: `linear-gradient(135deg, ${C.greenDark}, #1e3a8a)`,
                padding: '20px 20px 24px',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
                      <img src="/logo.png" alt="TUCC" width={36} height={36} style={{ objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.gold }}>Tamil United CC</div>
                      <div style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>Harrow, Middlesex</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Season badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(233,160,32,.18)', border: '1px solid rgba(233,160,32,.35)', borderRadius: 20, padding: '5px 12px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 6px #60a5fa', animation: 'pendingPulse 1.8s ease-in-out infinite' }} />
                    <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.gold }}>BTCL 2026 Season</span>
                  </div>
                </div>
              </div>

              {/* Nav links */}
              <div style={{ padding: '16px 16px', flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.gray3, letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 10, paddingLeft: 4 }}>
                  Navigation
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {MENU_LINKS.map(({ path, label, Icon, color, bg }, i) => {
                    const isActive = pathname === path
                    return (
                      <motion.button
                        key={path}
                        onClick={() => { nav(path); setOpen(false) }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.22, ease: EASE }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 16px',
                          borderRadius: 14,
                          border: `1.5px solid ${isActive ? color + '30' : C.gray2}`,
                          background: isActive ? bg : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: isActive ? color : bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isActive ? `0 4px 14px ${color}40` : 'none',
                          transition: 'all 200ms ease',
                        }}>
                          <Icon size={19} color={isActive ? '#fff' : color} strokeWidth={2.2} />
                        </div>
                        <span style={{
                          fontFamily: FONT, fontSize: 15, fontWeight: isActive ? 800 : 600,
                          color: isActive ? color : C.dark, flex: 1,
                        }}>
                          {label}
                        </span>
                        <ChevronRight size={16} color={isActive ? color : C.gray3} strokeWidth={2} />
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Public site + Logout at bottom */}
              <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <motion.a
                  href="/"
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 14, width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer', textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={19} color="#e9a020" strokeWidth={2.2} />
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: '#fff', flex: 1, textAlign: 'left' }}>Public Website</span>
                  <ChevronRight size={16} color="rgba(255,255,255,.4)" strokeWidth={2} />
                </motion.a>
                <motion.button
                  onClick={() => { signOut(); setOpen(false) }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 14, width: '100%',
                    background: 'rgba(200,48,42,.08)',
                    border: '1px solid rgba(200,48,42,.2)', cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(200,48,42,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={19} color="#c8302a" strokeWidth={2.2} />
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: '#c8302a', flex: 1, textAlign: 'left' }}>Sign Out</span>
                  <ChevronRight size={16} color="#c8302a" strokeWidth={2} />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Responsive CSS ── */}
      <style>{`
        /* ── Liquid-glass: frost any card using the translucent surface tokens ── */
        [style*="rgba(15,28,60,0.58)"], [style*="rgba(15, 28, 60, 0.58)"],
        [style*="rgba(22,36,80,0.52)"], [style*="rgba(22, 36, 80, 0.52)"] {
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          backdrop-filter: blur(16px) saturate(150%);
        }
        /* Hide subtitle & shrink brand at medium widths so nav links fit */
        @media (max-width: 860px) {
          .tucc-nav-brand-text div:last-child { display: none !important; }
          .tucc-nav-brand-text div:first-child { font-size: 12px !important; }
        }
        /* Compact nav item padding at medium widths */
        @media (max-width: 820px) {
          .nav-desktop-links button { padding: 6px 9px !important; font-size: 12px !important; gap: 4px !important; }
        }
        /* Switch to hamburger on small screens */
        @media (max-width: 640px) {
          .nav-desktop-links { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .tucc-nav-brand-text div:last-child { display: none; }
        }
      `}</style>
    </>
  )
}

function DesktopNavItem({ label, Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      style={{
        position: 'relative',
        background: isActive ? 'rgba(255,255,255,.1)' : 'none',
        border: 'none', cursor: 'pointer',
        padding: '8px 14px', borderRadius: 10,
        fontFamily: FONT, fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? '#fff' : 'rgba(255,255,255,.65)',
        transition: 'all 150ms ease',
        display: 'flex', alignItems: 'center', gap: 6,
        minHeight: 40,
      }}
      onMouseEnter={e => {
        if (!isActive) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,.08)' }
      }}
      onMouseLeave={e => {
        if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,.65)'; e.currentTarget.style.background = 'none' }
      }}
    >
      <Icon size={14} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
      <span>{label}</span>
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          style={{
            position: 'absolute', bottom: 4, left: 10, right: 10,
            height: 2.5, borderRadius: 99,
            background: `linear-gradient(90deg, ${C.gold}, #fbbf24)`,
            boxShadow: `0 0 8px ${C.gold}80`,
          }}
        />
      )}
    </button>
  )
}
