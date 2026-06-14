import { Link } from 'react-router-dom'
import { SITE } from './siteConfig'

const QUICK_LINKS = [
  { label: 'About Us',   to: '/about' },
  { label: 'Committee',  to: '/committee' },
  { label: 'Membership', to: '/membership' },
  { label: 'Gallery',    to: '/photos' },
  { label: 'Sponsors',   to: '/sponsors' },
  { label: 'Contact',    to: '/contact' },
]

const MEMBER_LINKS = [
  { label: 'Player Login',   to: '/login' },
  { label: 'Admin Login',    to: '/admin/login' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Use',   to: '/terms' },
  { label: 'Cookie Policy',  to: '/cookies' },
]

const TIER_COLOR = { Platinum: '#e5e4e2', Gold: '#e9a020', Silver: '#aab0b8', Bronze: '#cd7f32' }

export default function PublicFooter() {
  const year = new Date().getFullYear()
  return (
    <footer style={{ background: '#060d1f', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif" }}>
      {/* Sponsors strip */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '24px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 48, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', padding: '0 32px' }}>
          {SITE.sponsors.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', opacity: 0.75, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.75}
            >
              <img src={s.logo} alt={s.name} style={{ height: 36, maxWidth: 100, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
              <span style={{ display: 'none', color: '#fff', fontSize: 12, fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: 10, color: TIER_COLOR[s.tier] || '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>{s.tier}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Main footer columns */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 32px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
        {/* Club brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img src={SITE.logo} alt={SITE.clubShortName} style={{ height: 44, width: 'auto' }} onError={e => { e.target.style.display='none' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>Tamil United</div>
              <div style={{ color: SITE.colors.gold, fontWeight: 600, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase' }}>Cricket Club</div>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
            {SITE.tagline}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            {SITE.tagline2}
          </p>
          {/* Social icons placeholder */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {[
              { key: 'twitter',   icon: '𝕏' },
              { key: 'facebook',  icon: 'f' },
              { key: 'instagram', icon: '▣' },
              { key: 'youtube',   icon: '▶' },
            ].map(({ key, icon }) => (
              SITE.socials[key]
                ? <a key={key} href={SITE.socials[key]} target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', transition: 'all 0.2s' }}>{icon}</a>
                : <div key={key} title={`${key} — URL not configured`} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14, cursor: 'not-allowed' }}>{icon}</div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid rgba(233,160,32,0.3)` }}>
            Quick Links
          </h4>
          {QUICK_LINKS.map(l => (
            <Link key={l.to} to={l.to} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, marginBottom: 10, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = SITE.colors.gold}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >
              → {l.label}
            </Link>
          ))}
        </div>

        {/* Member Area */}
        <div>
          <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid rgba(233,160,32,0.3)` }}>
            Member Area
          </h4>
          {MEMBER_LINKS.map(l => (
            <Link key={l.to} to={l.to} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, marginBottom: 10, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = SITE.colors.gold}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >
              → {l.label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid rgba(233,160,32,0.3)` }}>
            Get In Touch
          </h4>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 12 }}>📍 {SITE.address}</p>
            <p style={{ marginBottom: 12 }}>
              📞 <a href={`tel:${SITE.phone}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{SITE.phone}</a>
            </p>
            <p style={{ marginBottom: 12 }}>
              ✉️ <a href={`mailto:${SITE.email}`} style={{ color: SITE.colors.gold, textDecoration: 'none' }}>{SITE.email}</a>
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{SITE.hours}</p>
          </div>
          <Link to="/join" style={{
            display: 'inline-block', marginTop: 20,
            background: SITE.colors.gold, color: '#000',
            textDecoration: 'none', fontWeight: 700, fontSize: 13,
            padding: '10px 22px', borderRadius: 8, letterSpacing: '0.5px',
          }}>
            Join the Club
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, maxWidth: 1280, margin: '0 auto' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          © {year} {SITE.legalName}. All rights reserved. · Competing in the {SITE.league}.
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          Built with pride for the Tamil cricket community
        </p>
      </div>
    </footer>
  )
}
