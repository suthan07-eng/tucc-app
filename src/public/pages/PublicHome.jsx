import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const STATS = [
  { label: 'Est.', value: '2010', suffix: '' },
  { label: 'Seasons', value: '14', suffix: '+' },
  { label: 'BTCL Registered', value: '30', suffix: '+' },
  { label: 'Matches Played', value: '200', suffix: '+' },
]

function useCountUp(target, duration = 2000, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const num = parseInt(target.replace(/\D/g, '')) || 0
    if (num === 0) { setCount(target); return }
    let start = 0
    const steps = 60
    const inc = num / steps
    const interval = duration / steps
    const timer = setInterval(() => {
      start += inc
      if (start >= num) { setCount(num); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, interval)
    return () => clearInterval(timer)
  }, [active, target, duration])
  return count
}

function StatCounter({ stat }) {
  const [active, setActive] = useState(false)
  const ref = useRef(null)
  const count = useCountUp(stat.value, 1800, active)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const isText = isNaN(parseInt(stat.value))
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '24px 32px' }}>
      <div style={{ fontSize: 52, fontWeight: 900, color: SITE.colors.gold, lineHeight: 1, letterSpacing: '-2px', fontFamily: "'Outfit', sans-serif" }}>
        {isText ? stat.value : `${count}${stat.suffix}`}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
        {stat.label}
      </div>
    </div>
  )
}

const fadeUp = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }

export default function PublicHome() {
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #060d1f 0%, #0d1b3e 40%, #1e3a8a 100%)',
        padding: '120px 24px 80px',
      }}>
        {/* Animated background orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
            top: '-200px', right: '-200px',
            animation: 'pulseOrb 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(233,160,32,0.08) 0%, transparent 70%)',
            bottom: '-100px', left: '-100px',
            animation: 'pulseOrb 10s ease-in-out infinite reverse',
          }} />
          {/* Cricket seam lines */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              repeating-linear-gradient(45deg, rgba(233,160,32,0.03) 0px, rgba(233,160,32,0.03) 1px, transparent 1px, transparent 60px),
              repeating-linear-gradient(-45deg, rgba(37,99,235,0.04) 0px, rgba(37,99,235,0.04) 1px, transparent 1px, transparent 80px)
            `,
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', maxWidth: 900, position: 'relative', zIndex: 1 }}
        >
          {/* League badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(233,160,32,0.12)', border: '1px solid rgba(233,160,32,0.3)',
              borderRadius: 100, padding: '6px 16px', marginBottom: 32,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: SITE.colors.gold, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: SITE.colors.gold, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
              {SITE.league}
            </span>
          </motion.div>

          <h1 style={{ fontSize: 'clamp(42px, 7vw, 90px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-3px', marginBottom: 24, color: '#fff' }}>
            Tamil United<br />
            <span style={{ color: SITE.colors.gold }}>Cricket Club</span>
          </h1>

          <p style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', color: 'rgba(255,255,255,0.8)', marginBottom: 12, fontWeight: 300, letterSpacing: '-0.5px' }}>
            {SITE.tagline}
          </p>
          <p style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', color: 'rgba(255,255,255,0.5)', marginBottom: 48, fontWeight: 400 }}>
            {SITE.tagline2}
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join" style={{
              background: SITE.colors.gold, color: '#000', textDecoration: 'none',
              fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 12,
              letterSpacing: '0.3px', transition: 'all 0.2s',
              boxShadow: '0 8px 32px rgba(233,160,32,0.35)',
            }}>
              Join the Club
            </Link>
            <Link to="/login" style={{
              background: 'rgba(255,255,255,0.07)', color: '#fff', textDecoration: 'none',
              fontWeight: 600, fontSize: 16, padding: '16px 40px', borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,0.2)', transition: 'all 0.2s',
            }}>
              Player Login →
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite' }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(233,160,32,0.6), transparent)' }} />
        </div>
      </section>

      {/* STAT COUNTERS */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', padding: '8px 24px' }}>
          {STATS.map((s, i) => <StatCounter key={i} stat={s} />)}
        </div>
      </section>

      {/* WELCOME */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <motion.div {...fadeUp}>
            <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Our Story</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 24, color: '#fff' }}>
              A Community Built<br />on Cricket
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 20 }}>
              Tamil United Cricket Club — competing as Dollishill Tamil United — is a proud member of the British Tamils Cricket League, representing the Tamil community in and around North West London.
            </p>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 32 }}>
              From our origins in 1986 as the Tamil United Club, through our merger with Dollishill CC in 2010, we've grown into one of the most respected clubs in the BTCL — built on unity, passion, and the love of the game.
            </p>
            <Link to="/about" style={{ color: SITE.colors.gold, textDecoration: 'none', fontWeight: 700, fontSize: 15, borderBottom: `1px solid ${SITE.colors.gold}`, paddingBottom: 2 }}>
              Read Our Full Story →
            </Link>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.7 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(30,58,138,0.4) 0%, rgba(37,99,235,0.15) 100%)',
              borderRadius: 24, padding: 48, border: '1px solid rgba(255,255,255,0.07)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
            }}>
              {[
                { icon: '🏏', title: 'Competitive Cricket', text: 'Representing our community in the BTCL with pride every season.' },
                { icon: '🤝', title: 'Community First', text: 'Events, fundraisers, and social matches that bring everyone together.' },
                { icon: '🌟', title: 'Youth Development', text: 'Nurturing the next generation of Tamil cricket talent.' },
                { icon: '🏆', title: 'Club Excellence', text: 'Professional management, transparent governance, and club-wide ambition.' },
              ].map((item, i) => (
                <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SPONSORS PREVIEW */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '70px 24px' }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Our Partners</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Proud Sponsors</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 48 }}>We are grateful to the businesses that make this club possible</p>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {SITE.sponsors.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textDecoration: 'none', opacity: 0.65, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.65}
              >
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 24px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <img src={s.logo} alt={s.name} style={{ height: 32, maxWidth: 90, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
                  <span style={{ display: 'none', color: '#fff', fontSize: 12, fontWeight: 700 }}>{s.name}</span>
                </div>
              </a>
            ))}
          </div>
          <Link to="/sponsors" style={{ display: 'inline-block', marginTop: 40, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14, border: '1px solid rgba(255,255,255,0.12)', padding: '10px 24px', borderRadius: 8 }}>
            View All Sponsors →
          </Link>
        </motion.div>
      </section>

      {/* QUICK LINKS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Explore</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>Everything TU CC</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { to: '/about',      icon: '📖', title: 'About Us',      text: 'Our history, values, and the community we serve' },
            { to: '/committee',  icon: '👥', title: 'Committee',     text: 'Meet the people who run the club' },
            { to: '/membership', icon: '🏏', title: 'Membership',    text: 'Join TU CC from just £100 per season' },
            { to: '/photos',     icon: '📸', title: 'Gallery',       text: 'Match photos, events, and club moments' },
            { to: '/contact',    icon: '✉️', title: 'Contact',       text: 'Get in touch with the club' },
            { to: '/join',       icon: '✅', title: 'Join Now',      text: 'Start your membership enquiry today' },
          ].map((card, i) => (
            <motion.div key={card.to} {...fadeUp} transition={{ delay: i * 0.07, duration: 0.6 }}>
              <Link to={card.to} style={{
                display: 'block', textDecoration: 'none',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '28px 28px', transition: 'all 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,160,32,0.4)'; e.currentTarget.style.background = 'rgba(233,160,32,0.05)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{card.text}</div>
                <div style={{ marginTop: 16, color: SITE.colors.gold, fontSize: 13, fontWeight: 600 }}>Learn more →</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <PublicFooter />

      <style>{`
        @keyframes pulseOrb { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } }
        @keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </div>
  )
}
