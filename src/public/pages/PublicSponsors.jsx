import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const fadeUp = { initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } }

const TIER_INFO = {
  Platinum: { color: '#e5e4e2', bg: 'rgba(229,228,226,0.08)', border: 'rgba(229,228,226,0.25)', icon: '👑', desc: 'Our headline partner — the backbone of Tamil United CC.' },
  Gold:     { color: '#e9a020', bg: 'rgba(233,160,32,0.08)',  border: 'rgba(233,160,32,0.3)',   icon: '⭐', desc: 'Premier partners who go above and beyond for the club.' },
  Silver:   { color: '#aab0b8', bg: 'rgba(170,176,184,0.06)', border: 'rgba(170,176,184,0.2)',  icon: '🥈', desc: 'Valued supporters making a real difference every season.' },
  Bronze:   { color: '#cd7f32', bg: 'rgba(205,127,50,0.06)',  border: 'rgba(205,127,50,0.2)',   icon: '🥉', desc: 'Trusted community partners who believe in our mission.' },
}

const TIERS = ['Platinum', 'Gold', 'Silver', 'Bronze']

export default function PublicSponsors() {
  const grouped = {}
  TIERS.forEach(t => { grouped[t] = SITE.sponsors.filter(s => s.tier === t) })

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      {/* Hero */}
      <section style={{
        padding: '140px 24px 80px', textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Our Partners</div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>Our Sponsors</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Tamil United CC is proud to be supported by these outstanding businesses. Their generosity makes our club possible.
          </p>
        </motion.div>
      </section>

      {/* Tier sections */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 24px 80px' }}>
        {TIERS.map(tier => {
          const sponsors = grouped[tier]
          if (!sponsors.length) return null
          const info = TIER_INFO[tier]

          return (
            <motion.div key={tier} {...fadeUp} style={{ marginBottom: 80 }}>
              {/* Tier header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, paddingBottom: 20, borderBottom: `1px solid ${info.border}` }}>
                <div style={{ fontSize: 32 }}>{info.icon}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: info.color, letterSpacing: '-0.5px', margin: 0 }}>{tier}</h2>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: info.color, background: info.bg, border: `1px solid ${info.border}`, padding: '3px 10px', borderRadius: 100 }}>Partner</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>{info.desc}</p>
                </div>
              </div>

              {/* Sponsor cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                {sponsors.map((s, i) => (
                  <motion.a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      background: info.bg, border: `1px solid ${info.border}`,
                      borderRadius: 18, padding: '36px 32px', textDecoration: 'none',
                      transition: 'all 0.3s', gap: 16,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.4)` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {/* Logo */}
                    <div style={{ width: 120, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={s.logo} alt={s.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }}
                      />
                      <div style={{ display: 'none', fontSize: 14, fontWeight: 800, color: '#fff', textAlign: 'center' }}>{s.name}</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 6 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: info.color, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{tier} Partner</div>
                    </div>

                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Visit website →
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )
        })}
      </section>

      {/* Become a sponsor CTA */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '80px 24px' }}>
        <motion.div {...fadeUp} style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(233,160,32,0.1) 0%, rgba(30,58,138,0.2) 100%)',
            border: `1px solid rgba(233,160,32,0.2)`, borderRadius: 24, padding: '60px 48px',
          }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🤝</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 16 }}>Become a Sponsor</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Support the Tamil cricket community in North West London. Sponsoring TU CC puts your brand in front of our players, families, and the wider Tamil community throughout the season.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" style={{
                background: SITE.colors.gold, color: '#000',
                textDecoration: 'none', fontWeight: 800, fontSize: 15,
                padding: '14px 36px', borderRadius: 12,
              }}>
                Get in Touch
              </Link>
              <a href={`mailto:${SITE.email}?subject=Sponsorship%20Enquiry`} style={{
                background: 'rgba(255,255,255,0.06)', color: '#fff',
                textDecoration: 'none', fontWeight: 600, fontSize: 15,
                padding: '14px 32px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                Email Us Directly
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  )
}
