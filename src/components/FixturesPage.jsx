import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, Calendar, ArrowLeft, ExternalLink, RotateCw, Home, Plane } from 'lucide-react'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'

const EASE = [0.23, 1, 0.32, 1]
const OUR_NAMES = ['Tamil United', 'TUCC', 'Dollishill Tamil United', 'DTU']
const isOurs = (name = '') => OUR_NAMES.some(t => name.toLowerCase().includes(t.toLowerCase()))
const shorten = n =>
  n.replace('Dollishill Tamil United CC - Knights', 'Tamil United CC')
   .replace('Sports & Social Club', '').replace('- 1st XI', '')
   .replace(/\s*-\s*[AB]$/, '').trim()

// Parse "Sunday 07 June 2026" → Date object
function parseDate(str) {
  if (!str) return null
  const m = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (!m) return null
  return new Date(`${m[2]} ${m[1]}, ${m[3]}`)
}

// Countdown hook
function useCountdown(targetDate) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    if (!targetDate) return
    const tick = () => {
      const now = Date.now()
      const d   = targetDate - now
      setDiff(d > 0 ? d : 0)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  if (diff === null || diff <= 0) return null
  const totalSec = Math.floor(diff / 1000)
  const days     = Math.floor(totalSec / 86400)
  const hours    = Math.floor((totalSec % 86400) / 3600)
  const mins     = Math.floor((totalSec % 3600) / 60)
  const secs     = totalSec % 60
  return { days, hours, mins, secs }
}

// ── Team logo ────────────────────────────────────────────────
function TeamLogo({ logo, name, size = 64 }) {
  const [error, setError] = useState(false)
  const initials = (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const PALETTE = ['#1a5c38','#7c3aed','#0369a1','#b45309','#0891b2','#be185d','#15803d','#9d174d']
  let h = 0; for (const c of (name||'')) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]

  if (!logo || error) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.22, flexShrink: 0,
        background: `linear-gradient(135deg, ${bg}, ${bg}bb)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * 0.28),
        color: '#fff', boxShadow: `0 6px 20px ${bg}55`,
      }}>
        {initials}
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22, flexShrink: 0,
      background: '#fff', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(0,0,0,.14)',
      border: '2px solid rgba(255,255,255,.8)',
    }}>
      <img src={logo} alt={name} style={{ width: '88%', height: '88%', objectFit: 'contain' }}
        onError={() => setError(true)} />
    </div>
  )
}

// ── Countdown unit ───────────────────────────────────────────
function CountUnit({ value, label }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{
        fontFamily: FONT, fontSize: 28, fontWeight: 900,
        color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        textShadow: '0 2px 8px rgba(0,0,0,.3)',
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 }}>
        {label}
      </div>
    </div>
  )
}

// ── Next Match Banner (hero card for the upcoming TUCC match) ──
function NextMatchBanner({ fixture, countdown }) {
  const isHome = isOurs(fixture.team1)
  const homeAwayLabel = isHome ? 'Home' : 'Away'
  const HomeAwayIcon  = isHome ? Home : Plane
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
        borderRadius: 24, overflow: 'hidden', marginBottom: 28,
        boxShadow: '0 12px 40px rgba(29,78,216,.4)',
        position: 'relative',
      }}
    >
      {/* decorative circles */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />

      {/* Header strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 0', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#86efac', boxShadow: '0 0 8px #86efac', animation: 'pendingPulse 1.8s ease-in-out infinite' }} />
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.8)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Next Match</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '4px 10px' }}>
          <HomeAwayIcon size={11} color="#fff" strokeWidth={2.5} />
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: '#fff' }}>{homeAwayLabel}</span>
        </div>
      </div>

      {/* Teams row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 0', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <TeamLogo logo={fixture.logo1} name={fixture.team1} size={68} />
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.25 }}>
            {shorten(fixture.team1)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.5)', letterSpacing: 2 }}>VS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: '5px 10px' }}>
            <Clock size={11} color="rgba(255,255,255,.8)" strokeWidth={2} />
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: '#fff' }}>{fixture.time}</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <TeamLogo logo={fixture.logo2} name={fixture.team2} size={68} />
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.25 }}>
            {shorten(fixture.team2)}
          </div>
        </div>
      </div>

      {/* Date */}
      <div style={{ textAlign: 'center', padding: '12px 18px 0', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.65)' }}>
        {fixture.date}
      </div>

      {/* Countdown */}
      {countdown && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 18px 0' }}>
          <CountUnit value={countdown.days}  label="Days" />
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.2)' }} />
          <CountUnit value={countdown.hours} label="Hrs" />
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.2)' }} />
          <CountUnit value={countdown.mins}  label="Min" />
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,.2)' }} />
          <CountUnit value={countdown.secs}  label="Sec" />
        </div>
      )}

      {/* Venue */}
      <div style={{ margin: '14px 18px 18px', background: 'rgba(0,0,0,.2)', borderRadius: 14, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <MapPin size={14} color="rgba(255,255,255,.6)" strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 4 }}>Venue</div>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.85)', lineHeight: 1.4 }}>{fixture.venue}</div>
          </div>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '5px 10px', fontFamily: FONT, fontSize: 11, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
            Map <ExternalLink size={10} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// ── Fixture Card ─────────────────────────────────────────────
function FixtureCard({ fixture, index, isNext }) {
  const tucc1  = isOurs(fixture.team1)
  const tucc2  = isOurs(fixture.team2)
  const tuccMatch = tucc1 || tucc2
  const isHome = tucc1
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE, delay: index * 0.07 }}
      style={{
        background: tuccMatch ? '#eff6ff' : C.white,
        borderRadius: 20,
        border: `1.5px solid ${tuccMatch ? '#bfdbfe' : C.gray2}`,
        overflow: 'hidden',
        boxShadow: tuccMatch ? '0 6px 24px rgba(37,99,235,.12)' : `0 4px 16px ${C.shadow}`,
      }}
    >
      {/* Top label bar */}
      <div style={{
        background: tuccMatch
          ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
          : 'linear-gradient(135deg, #334155, #64748b)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -14, right: -14, width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={13} color="rgba(255,255,255,.8)" strokeWidth={2} />
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: '#fff' }}>{fixture.date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {tuccMatch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 8, padding: '3px 8px' }}>
              {isHome ? <Home size={10} color="#fff" strokeWidth={2.5} /> : <Plane size={10} color="#fff" strokeWidth={2.5} />}
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: '#fff' }}>{isHome ? 'Home' : 'Away'}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} color="rgba(255,255,255,.7)" strokeWidth={2} />
            <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{fixture.time}</span>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div style={{ padding: '16px 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Team 1 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TeamLogo logo={fixture.logo1} name={fixture.team1} size={54} />
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: tucc1 ? 800 : 600, color: tucc1 ? '#1d4ed8' : C.dark, textAlign: 'center', lineHeight: 1.3 }}>
            {tucc1 && '🏏 '}{shorten(fixture.team1)}
          </div>
        </div>

        {/* VS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: tuccMatch ? '#dbeafe' : C.gray1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 900, color: tuccMatch ? '#1d4ed8' : C.gray4, letterSpacing: 1 }}>VS</span>
          </div>
          <div style={{ width: 1, height: 16, background: tuccMatch ? '#bfdbfe' : C.gray2 }} />
        </div>

        {/* Team 2 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TeamLogo logo={fixture.logo2} name={fixture.team2} size={54} />
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: tucc2 ? 800 : 600, color: tucc2 ? '#1d4ed8' : C.dark, textAlign: 'center', lineHeight: 1.3 }}>
            {tucc2 && '🏏 '}{shorten(fixture.team2)}
          </div>
        </div>
      </div>

      {/* Venue row */}
      <div style={{ margin: '0 14px 14px', background: tuccMatch ? 'rgba(29,78,216,.06)' : C.gray1, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <MapPin size={13} color={tuccMatch ? '#1d4ed8' : C.gray3} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, color: tuccMatch ? '#1d4ed8' : C.gray4, fontWeight: 600, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {fixture.venue}
          </div>
        </div>
        <a href={mapUrl} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, background: tuccMatch ? '#1d4ed8' : C.gray5, borderRadius: 8, padding: '5px 10px', fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
          Map <ExternalLink size={9} strokeWidth={2.5} />
        </a>
      </div>
    </motion.div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.gray2}`, background: C.white }}>
      <div style={{ height: 44, background: C.gray2, backgroundImage: `linear-gradient(90deg,${C.gray2} 25%,${C.gray1} 50%,${C.gray2} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite linear' }} />
      <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: i === 1 ? 0 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: i === 1 ? 36 : 54, height: i === 1 ? 36 : 54, borderRadius: i === 1 ? '50%' : 12, background: C.gray1 }} />
            {i !== 1 && <div style={{ height: 12, width: '70%', borderRadius: 6, background: C.gray1 }} />}
          </div>
        ))}
      </div>
      <div style={{ margin: '0 14px 14px', height: 38, borderRadius: 12, background: C.gray1 }} />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function FixturesPage() {
  const nav = useNavigate()
  const [fixtures, setFixtures]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(false)
  const [source, setSource]         = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = (bust = false) => {
    setRefreshing(true)
    fetch(bust ? `/api/fixtures?t=${Date.now()}` : '/api/fixtures')
      .then(r => r.json())
      .then(d => {
        setFixtures(d.fixtures || [])
        setSource(d.source)
        setLoading(false)
        setRefreshing(false)
      })
      .catch(() => { setError(true); setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { load() }, [])

  // Find the next TUCC fixture
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tuccFixtures = fixtures.filter(f => isOurs(f.team1) || isOurs(f.team2))
  const nextTucc = tuccFixtures.find(f => {
    const d = parseDate(f.date)
    return d && d >= today
  })

  // Countdown target: date + time of the next TUCC match
  const countdownTarget = (() => {
    if (!nextTucc) return null
    const d = parseDate(nextTucc.date)
    if (!d) return null
    const [h, m] = (nextTucc.time || '13:00').split(':').map(Number)
    d.setHours(h, m, 0, 0)
    return d.getTime()
  })()
  const countdown = useCountdown(countdownTarget)

  // Remaining fixtures (all except the next one shown in hero)
  const remaining = nextTucc ? fixtures.filter(f => f !== nextTucc) : fixtures

  const tuccCount = fixtures.filter(f => isOurs(f.team1) || isOurs(f.team2)).length

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* ── Hero ── */}
      <div style={{
        background: 'radial-gradient(ellipse at 80% -10%, rgba(59,130,246,.35) 0%, transparent 55%), linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%)',
        padding: '24px 20px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', position: 'relative' }}>
          <motion.button
            onClick={() => nav('/')}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 20 }}
          >
            <ArrowLeft size={14} strokeWidth={2} /> Home
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.3)', flexShrink: 0 }}>
                <img src="/logo.png" alt="TUCC" style={{ width: 47, height: 47, objectFit: 'contain' }} />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -0.4 }}>Fixtures</h1>
                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>BTCL Premier League 2026</span>
                  {!loading && (
                    <span style={{ background: 'rgba(59,130,246,.25)', border: '1px solid rgba(59,130,246,.4)', borderRadius: 20, padding: '2px 8px', fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#93c5fd' }}>
                      {fixtures.length} matches
                    </span>
                  )}
                  {source === 'live' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block', animation: 'pendingPulse 1.8s ease-in-out infinite' }} />
                      <span style={{ color: '#86efac', fontWeight: 600, fontSize: 11 }}>Live</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats strip */}
            {!loading && fixtures.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Total', value: fixtures.length, grad: 'linear-gradient(135deg,#475569,#64748b)', shadow: '0 4px 14px rgba(71,85,105,.3)' },
                  { label: 'Our Matches', value: tuccCount, grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', shadow: '0 4px 14px rgba(29,78,216,.4)' },
                  { label: 'Home', value: fixtures.filter(f => isOurs(f.team1)).length, grad: 'linear-gradient(135deg,#15803d,#22c55e)', shadow: '0 4px 14px rgba(21,128,61,.35)' },
                  { label: 'Away', value: fixtures.filter(f => isOurs(f.team2)).length, grad: 'linear-gradient(135deg,#b45309,#f59e0b)', shadow: '0 4px 14px rgba(180,83,9,.35)' },
                ].map(({ label, value, grad, shadow }) => (
                  <div key={label} style={{ flex: 1, background: grad, borderRadius: 14, padding: '10px 8px', textAlign: 'center', boxShadow: shadow, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -8, right: -8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />
                    <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                    <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '24px 16px 56px', width: '100%' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.gray4 }}>
            {!loading && `${fixtures.length} upcoming fixtures`}
          </div>
          <motion.button
            onClick={() => load(true)}
            disabled={refreshing}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.white, border: `1.5px solid ${C.gray2}`, borderRadius: 10,
              padding: '8px 14px', cursor: refreshing ? 'default' : 'pointer',
              fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.gray4,
              opacity: refreshing ? 0.5 : 1,
              boxShadow: `0 2px 8px ${C.shadow}`,
            }}
          >
            <RotateCw size={13} strokeWidth={2.2} style={{ animation: refreshing ? 'tucc-spin 0.65s linear infinite' : 'none' }} />
            Refresh
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fff1f2', border: `1.5px solid #fecaca`, borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'center', color: C.red, fontSize: 14, fontWeight: 500 }}>
            Couldn't load fixtures.{' '}
            <button onClick={() => { setError(false); setLoading(true); load(true) }} style={{ color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontFamily: FONT, fontSize: 14 }}>
              Try again →
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : fixtures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: C.white, borderRadius: 22, border: `1px solid ${C.gray2}`, boxShadow: `0 4px 20px ${C.shadow}` }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>No fixtures scheduled</div>
            <div style={{ fontSize: 13, color: C.gray3, marginTop: 6 }}>Check back when the next round is confirmed.</div>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Next TUCC match hero */}
              {nextTucc && <NextMatchBanner fixture={nextTucc} countdown={countdown} />}

              {/* All remaining fixtures */}
              {remaining.length > 0 && (
                <>
                  {nextTucc && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px' }}>
                      <div style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, transparent, ${C.gray2})` }} />
                      <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.gray3, background: C.gray1, borderRadius: 20, padding: '3px 12px' }}>All Fixtures</div>
                      <div style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, ${C.gray2}, transparent)` }} />
                    </div>
                  )}
                  {remaining.map((f, i) => (
                    <FixtureCard key={i} fixture={f} index={i} isNext={false} />
                  ))}
                </>
              )}

              {/* Footer CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                  borderRadius: 20, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  boxShadow: '0 6px 24px rgba(15,23,42,.4)',
                  marginTop: 8,
                }}
              >
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: '#fff' }}>Full season fixtures</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>View on play-cricket.com</div>
                </div>
                <a
                  href="https://dtucc.play-cricket.com/Matches?tab=Fixture"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#3b82f6', color: '#fff',
                    borderRadius: 12, padding: '10px 18px',
                    fontFamily: FONT, fontSize: 13, fontWeight: 800,
                    textDecoration: 'none', flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(59,130,246,.5)',
                  }}
                >
                  Open <ExternalLink size={13} strokeWidth={2.5} />
                </a>
              </motion.div>
            </div>
          </AnimatePresence>
        )}
      </div>

      <Footer />
    </div>
  )
}
