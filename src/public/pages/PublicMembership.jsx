import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const fadeUp = { initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7 } }

const FEATURES = [
  { label: 'BTCL Match Participation', family: true, adult: true, junior: true },
  { label: 'Club Events & Social Matches', family: true, adult: true, junior: true },
  { label: 'Training Sessions', family: true, adult: true, junior: true },
  { label: 'Access to Club Stats Portal', family: true, adult: true, junior: false },
  { label: 'Voting Rights (AGM)', family: true, adult: true, junior: false },
  { label: 'Youth-Specific Coaching', family: true, adult: false, junior: true },
  { label: 'Covers up to 2 Adults + Children', family: true, adult: false, junior: false },
]

const FAQS = [
  { q: 'When does the season run?', a: 'The BTCL season typically runs from April to September. Membership covers the full season including pre-season training.' },
  { q: 'Can I try out before committing?', a: 'Yes — we welcome trial sessions at training. Contact us at ' + SITE.email + ' to arrange your first session before signing up.' },
  { q: 'Is prior cricket experience required?', a: 'Not at all. We welcome players of all skill levels, from complete beginners to experienced cricketers. Our coaching sessions cater to all abilities.' },
  { q: 'How do I pay for membership?', a: 'Once you submit your enquiry via our Join page, the committee will contact you with payment details. We accept bank transfer.' },
]

function FAQ({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{item.q}</span>
        <span style={{ color: SITE.colors.gold, fontSize: 22, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s', display: 'inline-block' }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: 1.75, paddingRight: 40 }}>{item.a}</p>
      )}
    </div>
  )
}

const TIER_CONFIG = [
  { key: 'junior',  i: 2, highlight: false, label: 'Most Accessible' },
  { key: 'adult',   i: 1, highlight: true,  label: 'Most Popular' },
  { key: 'family',  i: 0, highlight: false, label: 'Best Value' },
]

export default function PublicMembership() {
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      {/* Hero */}
      <section style={{
        paddingTop: 140, paddingBottom: 80, textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '140px 24px 80px',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Join the Club</div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>Membership</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Become part of the Tamil United CC family. Choose the membership that's right for you.
          </p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24, alignItems: 'start' }}>
          {TIER_CONFIG.map(({ key, i, highlight, label }) => {
            const plan = SITE.membership[i]
            return (
              <motion.div
                key={key}
                {...fadeUp}
                transition={{ delay: i * 0.1, duration: 0.7 }}
                style={{
                  background: highlight
                    ? 'linear-gradient(135deg, rgba(30,58,138,0.6) 0%, rgba(37,99,235,0.25) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: highlight ? `2px solid ${SITE.colors.gold}` : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 24, padding: '40px 32px',
                  position: 'relative',
                  transform: highlight ? 'scale(1.03)' : 'none',
                }}
              >
                {/* Badge */}
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: highlight ? SITE.colors.gold : 'rgba(255,255,255,0.1)',
                  color: highlight ? '#000' : 'rgba(255,255,255,0.7)',
                  fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase',
                  padding: '5px 16px', borderRadius: 100,
                }}>
                  {label}
                </div>

                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16 }}>{plan.name}</h3>
                  <div style={{ fontSize: 60, fontWeight: 900, color: SITE.colors.gold, lineHeight: 1, letterSpacing: '-2px' }}>{plan.price}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>per season</div>
                </div>

                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, textAlign: 'center', marginBottom: 32 }}>
                  {plan.desc}
                </p>

                <Link
                  to={`/join?type=${encodeURIComponent(plan.name)}`}
                  style={{
                    display: 'block', textAlign: 'center',
                    background: highlight ? SITE.colors.gold : 'rgba(255,255,255,0.08)',
                    color: highlight ? '#000' : '#fff',
                    textDecoration: 'none', fontWeight: 800, fontSize: 15,
                    padding: '14px 24px', borderRadius: 12,
                    border: highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    transition: 'all 0.2s',
                  }}
                >
                  Join Now →
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Features comparison */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        <motion.div {...fadeUp}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 40 }}>What's Included</h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 100px)', background: 'rgba(255,255,255,0.04)', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Feature</div>
              {['Family', 'Adult', 'Junior'].map(h => (
                <div key={h} style={{ textAlign: 'center', fontSize: 13, color: '#fff', fontWeight: 700 }}>{h}</div>
              ))}
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 100px)', padding: '14px 24px', borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f.label}</div>
                {[f.family, f.adult, f.junior].map((v, j) => (
                  <div key={j} style={{ textAlign: 'center', fontSize: 18 }}>{v ? '✅' : '—'}</div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>FAQs</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>Common Questions</h2>
          </motion.div>
          {FAQS.map((faq, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.08 }}>
              <FAQ item={faq} />
            </motion.div>
          ))}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Still have questions?</p>
            <Link to="/contact" style={{ background: SITE.colors.gold, color: '#000', textDecoration: 'none', fontWeight: 700, fontSize: 14, padding: '12px 32px', borderRadius: 10 }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
