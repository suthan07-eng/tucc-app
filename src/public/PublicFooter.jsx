import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from './siteConfig'

const QUICK_LINKS = [
  { label: 'About Us',   to: '/about',      icon: '📖', color: '#6366f1' },
  { label: 'Committee',  to: '/committee',  icon: '👥', color: '#0ea5e9' },
  { label: 'Membership', to: '/membership', icon: '🏏', color: '#e9a020' },
  { label: 'Squad',      to: '/squad',      icon: '🏏', color: '#22c55e' },
  { label: 'Gallery',    to: '/photos',     icon: '📸', color: '#ec4899' },
  { label: 'Sponsors',   to: '/sponsors',   icon: '🤝', color: '#22c55e' },
  { label: 'Contact',    to: '/contact',    icon: '✉️', color: '#f97316' },
]

const MEMBER_LINKS = [
  { label: 'Player Login',   to: '/login',         icon: '🔐', color: '#2563eb' },
  { label: 'Admin Login',    to: '/admin/login',   icon: '⚙️', color: '#7c3aed' },
  { label: 'Privacy Policy', to: '/privacy',       icon: '🛡️', color: '#475569' },
  { label: 'Terms of Use',   to: '/terms',         icon: '📋', color: '#475569' },
  { label: 'Cookie Policy',  to: '/cookies',       icon: '🍪', color: '#475569' },
]

function SponsorLogo({ s }) {
  const [err, setErr] = useState(false)
  const tierCfg = {
    Platinum: { color: '#e2e8f0', border: 'rgba(226,232,240,0.3)', glow: 'rgba(226,232,240,0.1)'  },
    Gold:     { color: '#f59e0b', border: 'rgba(245,158,11,0.4)',  glow: 'rgba(245,158,11,0.12)' },
    Silver:   { color: '#93c5fd', border: 'rgba(147,197,253,0.3)', glow: 'rgba(147,197,253,0.08)' },
    Bronze:   { color: '#fb923c', border: 'rgba(251,146,60,0.3)',  glow: 'rgba(251,146,60,0.08)'  },
  }[s.tier] || { color: '#aaa', border: 'rgba(255,255,255,0.1)', glow: 'transparent' }
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, textDecoration: 'none', transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
    >
      <div style={{
        width: 72, height: 52,
        background: '#fff',
        border: `1px solid ${tierCfg.border}`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 10px', boxSizing: 'border-box',
        boxShadow: `0 4px 16px ${tierCfg.glow}, 0 2px 8px rgba(0,0,0,0.25)`,
      }}>
        {!err
          ? <img src={s.logo} alt={s.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={() => setErr(true)} />
          : <span style={{ color: '#1e3a8a', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{s.name}</span>
        }
      </div>
      <span style={{ fontSize: 8, color: tierCfg.color, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 800 }}>{s.tier}</span>
    </a>
  )
}

function NavLink({ item }) {
  const [hov, setHov] = useState(false)
  return (
    <Link to={item.to} style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.2s',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: hov ? item.color : 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, transition: 'background 0.2s',
        }}>{item.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: hov ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'color 0.2s', flex: 1 }}>{item.label}</span>
        <span style={{ fontSize: 10, color: hov ? item.color : 'rgba(255,255,255,0.15)', transition: 'color 0.2s', fontWeight: 700 }}>→</span>
      </div>
    </Link>
  )
}

export default function PublicFooter() {
  const year = new Date().getFullYear()
  return (
    <footer style={{ background: '#060d1f', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif" }}>
      {/* Sponsors strip */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)', padding: '32px 0' }}>
        <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 20 }}>Our Proud Sponsors</div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', padding: '0 32px' }}>
          {SITE.sponsors.map(s => <SponsorLogo key={s.name} s={s} />)}
        </div>
      </div>

      {/* Main footer columns */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 32px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 40 }}>

        {/* Club brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
              <img src={SITE.logo} alt={SITE.clubShortName} style={{ width: 44, height: 44, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>Tamil United</div>
              <div style={{ color: SITE.colors.gold, fontWeight: 600, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase' }}>Cricket Club</div>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{SITE.tagline}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 20 }}>{SITE.tagline2}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {[
              { key: 'twitter',   icon: '𝕏',  label: 'X' },
              { key: 'facebook',  icon: 'f',  label: 'Facebook' },
              { key: 'instagram', icon: '▣', label: 'Instagram' },
              { key: 'youtube',   icon: '▶', label: 'YouTube' },
            ].map(({ key, icon, label }) => (
              SITE.socials[key]
                ? <a key={key} href={SITE.socials[key]} target="_blank" rel="noopener noreferrer" title={label}
                    style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none', transition: 'all 0.2s', background: 'rgba(255,255,255,0.04)' }}>
                    {icon}
                  </a>
                : <div key={key} title={`${label} — not yet configured`}
                    style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 14, cursor: 'default' }}>
                    {icon}
                  </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
            Quick Links
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {QUICK_LINKS.map(l => <NavLink key={l.to} item={l} />)}
          </div>
        </div>

        {/* Member Area */}
        <div>
          <h4 style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
            Member Area
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {MEMBER_LINKS.map(l => <NavLink key={l.to} item={l} />)}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
            Get In Touch
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📍', text: SITE.address, href: null },
              { icon: '✉️', text: SITE.email, href: `mailto:${SITE.email}`, gold: true },
              { icon: '🕐', text: SITE.hours, href: null },
            ].filter(i => i.text).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 15, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                {item.href
                  ? <a href={item.href} style={{ fontSize: 13, color: item.gold ? SITE.colors.gold : 'rgba(255,255,255,0.6)', textDecoration: 'none', lineHeight: 1.5 }}>{item.text}</a>
                  : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{item.text}</span>
                }
              </div>
            ))}
          </div>
          <Link to="/join" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 22,
            background: SITE.colors.gold, color: '#000',
            textDecoration: 'none', fontWeight: 800, fontSize: 13,
            padding: '11px 22px', borderRadius: 9, letterSpacing: '0.3px',
            boxShadow: '0 4px 20px rgba(233,160,32,0.3)',
          }}>
            Join the Club →
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, maxWidth: 1280, margin: '0 auto' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          © {year} {SITE.legalName}. All rights reserved. · Competing in the {SITE.league}.
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', margin: 0 }}>
          Built with pride for the Tamil cricket community
        </p>
      </div>
    </footer>
  )
}
