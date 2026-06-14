import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const fadeUp = { initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }

const TIMELINE = [
  { year: '1986', title: 'Tamil United Club Founded', desc: 'The Tamil United Club was established, creating the first organised Tamil cricket community in North West London.' },
  { year: '1991', title: 'Dollishill CC Established', desc: 'Dollishill Cricket Club was founded, growing in parallel as a strong local club with deep roots in the community.' },
  { year: '2010', title: 'The Merger', desc: 'Tamil United and Dollishill CC joined forces to create Dollishill Tamil United — combining two proud traditions into one powerful club.' },
  { year: 'Today', title: 'BTCL Competitors', desc: 'Competing with pride in the British Tamils Cricket League, TU CC continues to grow, develop players, and serve the community across North West London.' },
]

export default function PublicAbout() {
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      {/* Page Header */}
      <section style={{
        paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24,
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Our Story</div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>About Tamil United CC</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
            A proud club forged from two great traditions, competing in the British Tamils Cricket League and representing our community with distinction.
          </p>
        </motion.div>
      </section>

      {/* Main content */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <motion.div {...fadeUp}>
            <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Who We Are</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 28, color: '#fff' }}>
              More Than a Cricket Club
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, marginBottom: 20 }}>
              Tamil United Cricket Club — formally known as Dollishill Tamil United — is a proud member of the British Tamils Cricket League, representing the Tamil community in and around North West London.
            </p>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, marginBottom: 20 }}>
              The club was formed through the merger of two established clubs: Tamil United, founded in 1986 as a community organisation bringing Tamil cricket enthusiasts together, and Dollishill Cricket Club, established in 1991 with a strong local following.
            </p>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.85, marginBottom: 20 }}>
              When these two clubs came together in 2010, they didn't just merge their squads — they combined decades of experience, passion, and community commitment into a single club that has grown year on year.
            </p>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.85 }}>
              Today, TU CC is one of the most respected clubs in the BTCL. We welcome players of all abilities, run a professional committee structure, and remain deeply embedded in the Tamil community through fundraising events, cultural celebrations, and social cricket.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.7 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(30,58,138,0.3) 0%, rgba(6,13,31,0.8) 100%)',
              borderRadius: 24, padding: '40px 36px', border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Our Values</h3>
              {[
                { title: 'Unity', text: 'We compete together, celebrate together, and grow together — regardless of background.' },
                { title: 'Passion', text: 'Cricket is in our blood. Every match, every training session, every win and loss is felt deeply.' },
                { title: 'Precision', text: 'We hold ourselves to high standards — on the pitch, in our admin, and in our community work.' },
                { title: 'Pride', text: 'We represent not just ourselves but the entire Tamil community in North West London.' },
              ].map(v => (
                <div key={v.title} style={{ marginBottom: 20, paddingLeft: 16, borderLeft: `2px solid ${SITE.colors.gold}` }}>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{v.title}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{v.text}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/committee" style={{
                flex: 1, textAlign: 'center', background: SITE.colors.gold, color: '#000',
                textDecoration: 'none', fontWeight: 700, fontSize: 14, padding: '14px 20px', borderRadius: 10,
              }}>Meet the Committee</Link>
              <Link to="/join" style={{
                flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.06)', color: '#fff',
                textDecoration: 'none', fontWeight: 600, fontSize: 14, padding: '14px 20px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
              }}>Join the Club</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TIMELINE */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '100px 24px' }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 70 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Our Journey</div>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>Club Timeline</h2>
        </motion.div>

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.08)', transform: 'translateX(-50%)' }} />

          {TIMELINE.map((item, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 60,
                flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
              }}
            >
              <div style={{ flex: 1, textAlign: i % 2 === 0 ? 'right' : 'left' }}>
                <div style={{ fontWeight: 900, fontSize: 36, color: SITE.colors.gold, letterSpacing: '-1px', lineHeight: 1 }}>{item.year}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginTop: 6, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{item.desc}</div>
              </div>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: SITE.colors.gold, border: '3px solid #060d1f', flexShrink: 0, marginTop: 8, position: 'relative', zIndex: 1, boxShadow: `0 0 0 4px rgba(233,160,32,0.2)` }} />
              <div style={{ flex: 1 }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* LEAGUE INFO */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <motion.div {...fadeUp}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(30,58,138,0.3) 100%)',
            borderRadius: 24, padding: '48px 40px', border: '1px solid rgba(37,99,235,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>British Tamils Cricket League</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 28 }}>
              The BTCL is the premier cricket competition for Tamil clubs in the United Kingdom. TU CC has been a member since our formation in 2010, competing with pride in every season. The league brings together Tamil cricket clubs from across Britain in a professionally run competition.
            </p>
            <Link to="/membership" style={{
              display: 'inline-block', background: SITE.colors.gold, color: '#000',
              textDecoration: 'none', fontWeight: 700, fontSize: 15, padding: '14px 36px', borderRadius: 10,
            }}>
              Join Us This Season
            </Link>
          </div>
        </motion.div>
      </section>

      <PublicFooter />

      <style>{`
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 40px !important; }
          div[style*="flex-direction: row-reverse"] { flex-direction: column !important; }
          div[style*="flex-direction: row"][style*="alignItems: flex-start"] { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}
