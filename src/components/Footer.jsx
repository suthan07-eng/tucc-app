import { useNavigate } from 'react-router-dom'
import { C, FONT, MAX_WIDTH } from '../constants'

const LINKS = [
  { label: 'Home',         path: '/'             },
  { label: 'Players',      path: '/players'      },
  { label: 'Gallery',      path: '/gallery'      },
  { label: 'Availability', path: '/availability' },
  { label: 'Results',      path: '/results'      },
  { label: 'Fixtures',     path: '/fixtures'     },
  { label: 'League',       path: '/league'       },
  { label: 'Statistics',   path: '/stats'        },
  { label: 'Analyse',      path: '/analyse'      },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', path: '/privacy' },
  { label: 'Terms of Use',   path: '/terms'   },
  { label: 'Cookie Policy',  path: '/cookies' },
]

export default function Footer() {
  const nav  = useNavigate()
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        background: C.greenDark,
        borderTop: `1px solid rgba(255,255,255,.08)`,
        padding: '32px 20px 28px',
        marginTop: 40,
      }}
    >
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>

        {/* Logo + brand centred */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: C.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(15,56,37,.3)', overflow: 'hidden', marginBottom: 12,
          }}>
            <img src="/logo.png" alt="DTU Cricket Club" style={{ width: 46, height: 46, objectFit: 'contain' }} />
          </div>
          <div style={{ color: C.gold, fontFamily: FONT, fontWeight: 800, fontSize: 15, letterSpacing: -0.2 }}>
            Tamil United CC
          </div>
          <div style={{ color: 'rgba(255,255,255,.4)', fontFamily: FONT, fontSize: 11, marginTop: 3 }}>
            Harrow, Middlesex · Est. 1977
          </div>
        </div>

        {/* Nav links — centred, wrapping */}
        <nav aria-label="Footer navigation">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', marginBottom: 28 }}>
            {LINKS.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => nav(path)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,.5)',
                  fontFamily: FONT, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', padding: '2px 0',
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

        {/* Legal links + Contact */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 18, lineHeight: '20px' }}>
          {[
            { label: 'Privacy Policy', href: '/privacy',             external: false },
            { label: 'Terms of Use',   href: '/terms',               external: false },
            { label: 'Cookie Policy',  href: '/cookies',             external: false },
            { label: 'Contact',        href: 'mailto:info@tucc.club', external: true  },
          ].map(({ label, href, external }, i) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', lineHeight: '20px' }}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 11, margin: '0 8px', lineHeight: '20px' }}>·</span>}
              <a
                href={href}
                onClick={!external ? (e => { e.preventDefault(); nav(href) }) : undefined}
                style={{
                  color: 'rgba(255,255,255,.35)', fontFamily: FONT, fontSize: 11,
                  fontWeight: 500, textDecoration: 'none', lineHeight: '20px',
                  display: 'inline-block', verticalAlign: 'middle',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.35)'}
              >
                {label}
              </a>
            </span>
          ))}
        </div>

        {/* Copyright */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 18, textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,.25)', fontFamily: FONT, fontSize: 12 }}>
            © {year} Tamil United Cricket Club · BTCL UK League 137680
          </div>
        </div>

      </div>
    </footer>
  )
}
