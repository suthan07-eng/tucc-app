import { useNavigate, useLocation } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import { C, FONT, MAX_WIDTH } from '../constants'

const NAV_LINKS = [
  { path: '/league', label: '🏆 League' },
  { path: '/stats',  label: '📊 Stats'  },
]

export default function Nav() {
  const nav     = useNavigate()
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  const activePath = NAV_LINKS.find(l => l.path === pathname)?.path ?? null

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: C.greenDark,
        borderBottom: `2px solid ${C.greenLight}`,
      }}
    >
      <div
        style={{
          maxWidth: MAX_WIDTH,
          margin: '0 auto',
          padding: '0 16px',
          height: 56,
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,.25)',
            overflow: 'hidden',
          }}>
            <img
              src="/logo.png"
              alt="DTU Cricket Club"
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ color: C.gold, fontFamily: FONT, fontWeight: 800, fontSize: 14, letterSpacing: 0.2 }}>
              Tamil United CC
            </div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontFamily: FONT, fontSize: 10, lineHeight: 1 }}>
              formerly known as DTU CC
            </div>
          </div>
        </motion.button>

        {/* Nav links with sliding active indicator */}
        {!isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MotionConfig transition={{ type: 'spring', duration: 0.4, bounce: 0.18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {NAV_LINKS.map(({ path, label }) => {
                  const isActive = pathname === path
                  return (
                    <NavItem
                      key={path}
                      label={label}
                      isActive={isActive}
                      onClick={() => nav(path)}
                    />
                  )
                })}
              </div>
            </MotionConfig>

            {/* Admin button */}
            <motion.button
              onClick={() => nav('/admin/login')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              style={{
                color: C.gold,
                background: 'transparent',
                border: `1.5px solid ${C.gold}`,
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 12,
                marginLeft: 6,
              }}
            >
              Admin
            </motion.button>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavItem({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 12px',
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? C.gold : 'rgba(255,255,255,.75)',
        borderRadius: 8,
        transition: 'color 150ms ease',
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.color = '#fff'
        e.currentTarget.querySelector('.nav-bg').style.opacity = '1'
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,.75)'
        if (!isActive) e.currentTarget.querySelector('.nav-bg').style.opacity = '0'
      }}
    >
      {/* Hover background pill */}
      <span
        className="nav-bg"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 8,
          background: 'rgba(255,255,255,.08)',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 150ms ease',
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>

      {/* Sliding gold underline */}
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          style={{
            position: 'absolute',
            bottom: 2,
            left: 8,
            right: 8,
            height: 2,
            borderRadius: 99,
            background: C.gold,
          }}
        />
      )}
    </button>
  )
}
