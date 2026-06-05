import { useNavigate, useLocation } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import { Trophy, BarChart2, ShieldCheck, ClipboardList } from 'lucide-react'
import { C, FONT, MAX_WIDTH } from '../constants'

const NAV_LINKS = [
  { path: '/league',  label: 'League',  Icon: Trophy },
  { path: '/results', label: 'Results', Icon: ClipboardList },
  { path: '/stats',   label: 'Stats',   Icon: BarChart2 },
]

export default function Nav() {
  const nav           = useNavigate()
  const { pathname }  = useLocation()
  const isAdmin       = pathname.startsWith('/admin')

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: C.greenDark,
        borderBottom: `1px solid rgba(255,255,255,.08)`,
        boxShadow: `0 2px 16px ${C.shadowLg}`,
      }}
    >
      <div
        style={{
          maxWidth: MAX_WIDTH,
          margin: '0 auto',
          padding: '0 16px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo + brand */}
        <motion.button
          onClick={() => nav('/')}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
          aria-label="Go to home"
          style={{
            display: 'flex', alignItems: 'center', gap: 11,
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
            minHeight: 44,
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 6px rgba(0,0,0,.28)',
            overflow: 'hidden',
          }}>
            <img src="/logo.png" alt="Tamil United CC" width={38} height={38} style={{ objectFit: 'contain' }} />
          </div>
          <div className="tucc-nav-brand-text">
            <div style={{ color: C.gold, fontFamily: FONT, fontWeight: 800, fontSize: 14, letterSpacing: -0.1 }}>
              Tamil United CC
            </div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontFamily: FONT, fontSize: 10, lineHeight: 1.2, marginTop: 1 }}>
              formerly known as DTU CC
            </div>
          </div>
        </motion.button>

        {/* Nav links */}
        {!isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MotionConfig transition={{ type: 'spring', duration: 0.38, bounce: 0.15 }}>
              {NAV_LINKS.map(({ path, label, Icon }) => {
                const isActive = pathname === path
                return (
                  <NavItem key={path} label={label} Icon={Icon} isActive={isActive} onClick={() => nav(path)} />
                )
              })}
            </MotionConfig>

            <motion.button
              onClick={() => nav('/admin/login')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              aria-label="Admin login"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                color: C.gold,
                background: 'rgba(233,160,32,.1)',
                border: `1.5px solid rgba(233,160,32,.4)`,
                borderRadius: 8,
                padding: '7px 12px',
                cursor: 'pointer',
                fontFamily: FONT, fontWeight: 600, fontSize: 12,
                marginLeft: 6, minHeight: 36,
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,160,32,.18)'; e.currentTarget.style.borderColor = 'rgba(233,160,32,.7)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(233,160,32,.1)'; e.currentTarget.style.borderColor = 'rgba(233,160,32,.4)' }}
            >
              <ShieldCheck size={13} strokeWidth={2.5} />
              Admin
            </motion.button>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavItem({ label, Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      style={{
        position: 'relative',
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '8px 12px',
        fontFamily: FONT, fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? C.gold : 'rgba(255,255,255,.7)',
        borderRadius: 8,
        transition: 'color 150ms ease',
        display: 'flex', alignItems: 'center', gap: 5,
        minHeight: 44,
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.color = '#fff'
        e.currentTarget.querySelector('.nav-bg').style.opacity = '1'
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,.7)'
        if (!isActive) e.currentTarget.querySelector('.nav-bg').style.opacity = '0'
      }}
    >
      <span className="nav-bg" style={{
        position: 'absolute', inset: 0, borderRadius: 8,
        background: 'rgba(255,255,255,.08)',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 150ms ease', pointerEvents: 'none',
      }} />
      <Icon size={14} strokeWidth={isActive ? 2.5 : 2} style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          style={{
            position: 'absolute', bottom: 4, left: 10, right: 10,
            height: 2, borderRadius: 99, background: C.gold,
          }}
        />
      )}
    </button>
  )
}
