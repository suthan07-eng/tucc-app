import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SITE } from './siteConfig'

const NAV_LINKS = [
  { label: 'Home',       to: '/' },
  { label: 'About',      to: '/about' },
  { label: 'Committee',  to: '/committee' },
  { label: 'Membership', to: '/membership' },
  { label: 'Gallery',    to: '/photos' },
  { label: 'Contact',    to: '/contact' },
  { label: 'Sponsors',   to: '/sponsors' },
]

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  const isActive = (to) => location.pathname === to

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.35)' : '0 1px 0 rgba(255,255,255,0.06)',
        transition: 'all 0.3s ease',
        borderBottom: scrolled ? '1px solid rgba(233,160,32,0.2)' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 68,
        }}>
          {/* Logo + wordmark */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={SITE.logo} alt={SITE.clubShortName} style={{ height: 42, width: 'auto' }} onError={e => { e.target.style.display='none' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px', lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
                Tamil United
              </div>
              <div style={{ color: SITE.colors.gold, fontWeight: 600, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Cricket Club
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, '@media(maxWidth:900px)': { display: 'none' } }} className="desktop-nav">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} style={{
                color: isActive(l.to) ? SITE.colors.gold : 'rgba(255,255,255,0.82)',
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                padding: '6px 12px', borderRadius: 6,
                background: isActive(l.to) ? 'rgba(233,160,32,0.1)' : 'transparent',
                transition: 'all 0.2s', letterSpacing: '0.2px',
                borderBottom: isActive(l.to) ? `2px solid ${SITE.colors.gold}` : '2px solid transparent',
              }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="desktop-ctas">
            <Link to="/login" style={{
              color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
              padding: '8px 18px', borderRadius: 8,
              border: `1.5px solid rgba(255,255,255,0.35)`,
              transition: 'all 0.2s',
              letterSpacing: '0.3px',
            }}>
              Player Login
            </Link>
            <Link to="/admin/login" style={{
              color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 12, fontWeight: 500,
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              letterSpacing: '0.2px',
            }}>
              Admin
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              display: 'none', background: 'none', border: 'none', cursor: 'pointer',
              padding: 8, color: '#fff',
            }}
            className="hamburger"
          >
            <div style={{ width: 24, height: 2, background: open ? SITE.colors.gold : '#fff', marginBottom: 5, borderRadius: 2, transition: 'all 0.3s', transform: open ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <div style={{ width: 24, height: 2, background: '#fff', marginBottom: 5, borderRadius: 2, transition: 'all 0.3s', opacity: open ? 0 : 1 }} />
            <div style={{ width: 24, height: 2, background: open ? SITE.colors.gold : '#fff', borderRadius: 2, transition: 'all 0.3s', transform: open ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(10,15,35,0.98)',
          backdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', gap: 8,
        }}>
          {NAV_LINKS.map((l, i) => (
            <Link key={l.to} to={l.to} style={{
              color: isActive(l.to) ? SITE.colors.gold : '#fff',
              textDecoration: 'none', fontSize: 28, fontWeight: 700,
              padding: '10px 0', letterSpacing: '-0.5px',
              opacity: 1,
              animation: `fadeSlideIn 0.3s ease ${i * 0.05}s both`,
            }}>
              {l.label}
            </Link>
          ))}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '10px 24px', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8 }}>
              Player Login
            </Link>
            <Link to="/admin/login" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14, padding: '10px 20px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}>
              Admin
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .desktop-ctas { display: none !important; }
          .hamburger { display: block !important; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        nav a:hover { opacity: 0.85; }
      `}</style>
    </>
  )
}
