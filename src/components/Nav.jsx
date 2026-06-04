import { useNavigate, useLocation } from 'react-router-dom'
import { C, FONT, MAX_WIDTH } from '../constants'

export default function Nav() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const isAdmin  = pathname.startsWith('/admin')
  const isLeague = pathname === '/league'
  const isStats  = pathname === '/stats'

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
        <button
          onClick={() => nav('/')}
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
          <img
            src="/logo.png"
            alt="DTU Cricket Club"
            style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4 }}
          />
          <div>
            <div style={{ color: C.gold, fontFamily: FONT, fontWeight: 800, fontSize: 14, letterSpacing: 0.2 }}>
              Tamil United CC
            </div>
            <div style={{ color: 'rgba(255,255,255,.45)', fontFamily: FONT, fontSize: 10, lineHeight: 1 }}>
              formerly known as DTU CC
            </div>
          </div>
        </button>

        {!isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => nav('/league')}
              style={{
                color: isLeague ? C.gold : 'rgba(255,255,255,.75)',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isLeague ? C.gold : 'transparent'}`,
                padding: '4px 4px 2px',
                cursor: 'pointer',
                fontFamily: FONT,
                fontWeight: isLeague ? 700 : 500,
                fontSize: 13,
              }}
            >
              🏆 League
            </button>
            <button
              onClick={() => nav('/stats')}
              style={{
                color: isStats ? C.gold : 'rgba(255,255,255,.75)',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isStats ? C.gold : 'transparent'}`,
                padding: '4px 4px 2px',
                cursor: 'pointer',
                fontFamily: FONT,
                fontWeight: isStats ? 700 : 500,
                fontSize: 13,
              }}
            >
              📊 Stats
            </button>
            <button
              onClick={() => nav('/admin/login')}
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
                marginLeft: 4,
              }}
            >
              Admin
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
