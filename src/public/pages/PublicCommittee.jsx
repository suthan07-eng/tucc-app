import { motion } from 'framer-motion'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const fadeUp = { initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }

function InitialsAvatar({ name }) {
  const parts = name.split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)
  const hue = name.charCodeAt(0) * 37 % 360
  return (
    <div style={{
      width: '100%', aspectRatio: '1 / 1', borderRadius: '50%',
      background: `linear-gradient(135deg, hsl(${hue},60%,25%) 0%, hsl(${hue + 30},70%,35%) 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '1px',
    }}>
      {initials.toUpperCase()}
    </div>
  )
}

function CommitteeCard({ member, i }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ delay: i * 0.06, duration: 0.6 }}
      style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, overflow: 'hidden', transition: 'all 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,160,32,0.35)'; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Photo area */}
      <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: `3px solid rgba(233,160,32,0.3)`, flexShrink: 0 }}>
          <img
            src={member.photo}
            alt={member.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <div style={{ display: 'none', width: '100%', height: '100%' }}>
            <InitialsAvatar name={member.name} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '20px 24px 28px', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{member.name}</div>
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
          textTransform: 'uppercase', color: SITE.colors.gold,
          background: 'rgba(233,160,32,0.1)', border: '1px solid rgba(233,160,32,0.2)',
          padding: '4px 12px', borderRadius: 100,
        }}>
          {member.role}
        </div>
      </div>
    </motion.div>
  )
}

export default function PublicCommittee() {
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      {/* Page header */}
      <section style={{
        paddingTop: 140, paddingBottom: 80, textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '140px 24px 80px',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Leadership</div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>Our Committee</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto 20px', lineHeight: 1.7 }}>
            The dedicated volunteers who run Tamil United Cricket Club — from the committee room to the pavilion.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)',
            borderRadius: 100, padding: '8px 20px', fontSize: 13, color: 'rgba(255,255,255,0.65)',
          }}>
            🔒 For data protection, personal contact details are not published. Contact us at&nbsp;
            <a href={`mailto:${SITE.email}`} style={{ color: SITE.colors.gold, fontWeight: 700 }}>{SITE.email}</a>
          </div>
        </motion.div>
      </section>

      {/* Committee grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 24,
        }}>
          {SITE.committee.map((member, i) => (
            <CommitteeCard key={member.name} member={member} i={i} />
          ))}
        </div>

        {/* Contact note */}
        <motion.div {...fadeUp} style={{ marginTop: 80, textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '32px 48px',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Get in Touch</h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 20, maxWidth: 400 }}>
              Want to contact a committee member? Reach us through the club email and your message will be directed appropriately.
            </p>
            <a href={`mailto:${SITE.email}`} style={{
              display: 'inline-block', background: SITE.colors.gold, color: '#000',
              textDecoration: 'none', fontWeight: 700, fontSize: 15, padding: '12px 32px', borderRadius: 10,
            }}>
              {SITE.email}
            </a>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  )
}
