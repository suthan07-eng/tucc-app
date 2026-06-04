import { useNavigate } from 'react-router-dom'
import { C, FONT, MAX_WIDTH } from '../constants'

const LINKS = [
  { label: 'Home',               path: '/'             },
  { label: 'Availability',       path: '/availability' },
  { label: 'League',             path: '/league'       },
  { label: 'Statistics',         path: '/stats'        },
  { label: 'Register',           path: '/register'     },
]

export default function Footer() {
  const nav  = useNavigate()
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        background: C.greenDark,
        borderTop: `1px solid rgba(255,255,255,.07)`,
        padding: '40px 20px 32px',
        marginTop: 48,
      }}
    >
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>

        {/* Brand + links row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${C.shadowMd}`, overflow: 'hidden' }}>
              <img src="/logo.png" alt="DTU Cricket Club logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: C.gold, fontFamily: FONT, fontWeight: 800, fontSize: 15, letterSpacing: -0.2 }}>
                Tamil United CC
              </div>
              <div style={{ color: 'rgba(255,255,255,.38)', fontFamily: FONT, fontSize: 11, marginTop: 2, fontWeight: 400 }}>
                Plymouth, Devon · Est. 1977
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
              {LINKS.map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => nav(path)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,.5)',
                    fontFamily: FONT,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.9)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Divider + copyright */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ color: 'rgba(255,255,255,.28)', fontFamily: FONT, fontSize: 12, fontWeight: 400 }}>
            © {year} Tamil United Cricket Club
          </div>
          <div style={{ color: 'rgba(255,255,255,.18)', fontFamily: FONT, fontSize: 12 }}>
            BTCL UK · League 137680
          </div>
        </div>

      </div>
    </footer>
  )
}
