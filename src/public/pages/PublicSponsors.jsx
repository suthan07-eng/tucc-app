import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const FONT = "'Outfit', sans-serif"

// Tier visual config — colourful, consistent with the rest of the site
const TIER = {
  Platinum: {
    label: 'Platinum Partner',
    blurb: 'Our headline partner — the backbone of Tamil United CC.',
    color: '#e2e8f0', accent: '#cbd5e1',
    glow: 'rgba(226,232,240,0.22)', border: 'rgba(226,232,240,0.3)',
    bg: 'linear-gradient(150deg, rgba(226,232,240,0.1) 0%, rgba(148,163,184,0.04) 100%)',
    badge: 'linear-gradient(135deg, #94a3b8, #e2e8f0)', badgeText: '#0f172a',
  },
  Gold: {
    label: 'Gold Partner',
    blurb: 'Premier partners who go above and beyond for the club.',
    color: '#f59e0b', accent: '#fbbf24',
    glow: 'rgba(245,158,11,0.22)', border: 'rgba(245,158,11,0.35)',
    bg: 'linear-gradient(150deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.04) 100%)',
    badge: 'linear-gradient(135deg, #f59e0b, #d97706)', badgeText: '#1a0a00',
  },
  Silver: {
    label: 'Silver Partner',
    blurb: 'Valued supporters making a real difference every season.',
    color: '#93c5fd', accent: '#60a5fa',
    glow: 'rgba(96,165,250,0.2)', border: 'rgba(96,165,250,0.3)',
    bg: 'linear-gradient(150deg, rgba(96,165,250,0.09) 0%, rgba(59,130,246,0.03) 100%)',
    badge: 'linear-gradient(135deg, #60a5fa, #3b82f6)', badgeText: '#fff',
  },
  Bronze: {
    label: 'Bronze Partner',
    blurb: 'Trusted community partners who believe in our mission.',
    color: '#fb923c', accent: '#f97316',
    glow: 'rgba(251,146,60,0.2)', border: 'rgba(251,146,60,0.3)',
    bg: 'linear-gradient(150deg, rgba(251,146,60,0.09) 0%, rgba(234,88,12,0.03) 100%)',
    badge: 'linear-gradient(135deg, #fb923c, #ea580c)', badgeText: '#fff',
  },
}

const TIERS = ['Platinum', 'Gold', 'Silver', 'Bronze']

function LogoImg({ s, size }) {
  return (
    <div style={{
      width: size, height: size, background: '#fff', borderRadius: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: size * 0.16, boxSizing: 'border-box',
      boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
    }}>
      <img src={s.logo} alt={s.name}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
      <span style={{ display: 'none', fontSize: 12, fontWeight: 800, color: '#1e3a8a', textAlign: 'center' }}>{s.name}</span>
    </div>
  )
}

// Big spotlight card for the headline (Platinum) sponsor
function FeaturedCard({ s, index }) {
  const t = TIER[s.tier]
  return (
    <motion.a
      href={s.url} target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 28, alignItems: 'center',
        textDecoration: 'none', background: t.bg, border: `1px solid ${t.border}`,
        borderRadius: 28, padding: '32px 36px', position: 'relative', overflow: 'hidden',
        boxShadow: `0 16px 50px ${t.glow}, 0 4px 16px rgba(0,0,0,0.3)`,
        transition: 'box-shadow 0.3s',
      }}
    >
      <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <LogoImg s={s} size={130} />
      <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
        <span style={{
          display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase',
          background: t.badge, color: t.badgeText, borderRadius: 20, padding: '4px 14px', marginBottom: 14,
        }}>★ {t.label}</span>
        <h3 style={{ fontFamily: FONT, fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.5px' }}>{s.name}</h3>
        <p style={{ fontFamily: FONT, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 16px', lineHeight: 1.6, maxWidth: 420 }}>{t.blurb}</p>
        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: t.accent, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Visit website →
        </span>
      </div>
    </motion.a>
  )
}

// Compact card for the rest
function SponsorCard({ s, index }) {
  const t = TIER[s.tier]
  return (
    <motion.a
      href={s.url} target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: (index % 4) * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        textDecoration: 'none', background: t.bg, border: `1px solid ${t.border}`,
        borderRadius: 22, padding: '24px 20px 20px', position: 'relative', overflow: 'hidden',
        boxShadow: `0 10px 34px ${t.glow}, 0 2px 8px rgba(0,0,0,0.28)`,
        transition: 'box-shadow 0.3s',
      }}
    >
      <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <LogoImg s={s} size={104} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase',
          background: t.badge, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 5,
        }}>{s.tier}</div>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{s.name}</div>
      </div>
    </motion.a>
  )
}

export default function PublicSponsors() {
  const grouped = {}
  TIERS.forEach(t => { grouped[t] = SITE.sponsors.filter(s => s.tier === t) })
  let gi = 0

  return (
    <div style={{ fontFamily: FONT, background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      {/* Hero */}
      <section style={{
        padding: '140px 24px 80px', textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(233,160,32,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '15%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(233,160,32,0.1)', border: '1px solid rgba(233,160,32,0.25)', borderRadius: 20, padding: '5px 16px', marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>🤝</span>
            <span style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Our Partners</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>Proud Sponsors</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            The businesses and partners who make Tamil United CC possible — season after season.
          </p>
        </motion.div>
      </section>

      {/* Tier groups */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px 70px' }}>
        {TIERS.map(tier => {
          const sponsors = grouped[tier]
          if (!sponsors.length) return null
          const t = TIER[tier]
          const featured = tier === 'Platinum'

          return (
            <div key={tier} style={{ marginBottom: 64 }}>
              {/* Tier divider */}
              <motion.div
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}
              >
                <span style={{
                  fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase',
                  background: t.badge, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>{tier} {sponsors.length > 1 ? 'Partners' : 'Partner'}</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${t.border}, transparent)`, borderRadius: 1 }} />
              </motion.div>

              {featured ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {sponsors.map(s => <FeaturedCard key={s.name} s={s} index={gi++} />)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 20 }}>
                  {sponsors.map(s => <SponsorCard key={s.name} s={s} index={gi++} />)}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* Become a sponsor CTA */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '80px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(233,160,32,0.08) 0%, rgba(30,58,138,0.16) 100%)',
            border: '1px solid rgba(233,160,32,0.18)', borderRadius: 28, padding: '60px 48px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,160,32,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 52, marginBottom: 20, position: 'relative' }}>🤝</div>
            <h2 style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 16, position: 'relative' }}>Become a Sponsor</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 460, margin: '0 auto 36px', position: 'relative' }}>
              Support the Tamil cricket community in North West London. Put your brand in front of our players, families, and supporters throughout the season.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
              <Link to="/contact" style={{
                background: SITE.colors.gold, color: '#000',
                textDecoration: 'none', fontWeight: 800, fontSize: 15,
                padding: '14px 36px', borderRadius: 12,
              }}>
                Get in Touch →
              </Link>
              <a href={`mailto:${SITE.email}?subject=Sponsorship%20Enquiry`} style={{
                background: 'rgba(255,255,255,0.06)', color: '#fff',
                textDecoration: 'none', fontWeight: 600, fontSize: 15,
                padding: '14px 32px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                Email Us
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  )
}
