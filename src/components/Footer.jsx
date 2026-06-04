import { useNavigate } from 'react-router-dom'
import { C, FONT, MAX_WIDTH } from '../constants'

const LINKS = [
  { label: 'Home',               path: '/'             },
  { label: 'Submit Availability', path: '/availability' },
  { label: 'League',             path: '/league'       },
  { label: 'Statistics',         path: '/stats'        },
  { label: 'Register',           path: '/register'     },
]

export default function Footer() {
  const nav = useNavigate()
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        background: C.greenDark,
        borderTop: `2px solid rgba(255,255,255,.08)`,
        padding: '36px 20px 28px',
        marginTop: 40,
      }}
    >
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>🏏</span>
          <div>
            <div style={{ color: C.gold, fontFamily: FONT, fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>
              Tamil United CC
            </div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontFamily: FONT, fontSize: 11, marginTop: 1 }}>
              formerly known as DTU CC · Plymouth, Devon
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: 24 }}>
          {LINKS.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => nav(path)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,.55)',
                fontFamily: FONT,
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
                transition: 'color .15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Divider + copyright */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 20 }}>
          <div style={{ color: 'rgba(255,255,255,.3)', fontFamily: FONT, fontSize: 12, lineHeight: 1.7 }}>
            © {year} Tamil United Cricket Club. All rights reserved.
          </div>
          <div style={{ color: 'rgba(255,255,255,.18)', fontFamily: FONT, fontSize: 11, marginTop: 3 }}>
            British Tamil Cricket League (BTCL UK) · League 137680
          </div>
        </div>
      </div>
    </footer>
  )
}
