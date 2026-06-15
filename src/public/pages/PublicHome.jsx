import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabase'
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

// ── Next Match helpers ─────────────────────────────────────
const WMO_MAP = [
  { max: 0,  icon: '☀️',  label: 'Clear' },
  { max: 1,  icon: '🌤️', label: 'Mostly Clear' },
  { max: 2,  icon: '⛅',  label: 'Partly Cloudy' },
  { max: 3,  icon: '☁️',  label: 'Overcast' },
  { max: 48, icon: '🌫️', label: 'Foggy' },
  { max: 57, icon: '🌦️', label: 'Drizzle' },
  { max: 67, icon: '🌧️', label: 'Rain' },
  { max: 77, icon: '❄️',  label: 'Snow' },
  { max: 82, icon: '🌦️', label: 'Showers' },
  { max: 86, icon: '🌨️', label: 'Snow showers' },
  { max: 99, icon: '⛈️',  label: 'Thunderstorm' },
]
function getWmo(code) { return WMO_MAP.find(w => code <= w.max) || WMO_MAP[WMO_MAP.length - 1] }
function toYMD(d) {
  if (!d) return null
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function parseFixDate(str) {
  if (!str) return null
  const m = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  return m ? new Date(`${m[2]} ${m[1]}, ${m[3]}`) : null
}
const OUR_NAMES = ['Tamil United', 'TUCC', 'Dollishill Tamil United', 'DTU']
const isOurs = (n = '') => OUR_NAMES.some(t => n.toLowerCase().includes(t.toLowerCase()))
const shorten = n =>
  n.replace('Dollishill Tamil United CC - Knights', 'Tamil United CC')
   .replace('Sports & Social Club', '').replace('- 1st XI', '')
   .replace(/\s*-\s*[AB]$/, '').trim()

function useFixCountdown(targetMs) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    if (!targetMs) return
    const tick = () => { const d = targetMs - Date.now(); setDiff(d > 0 ? d : 0) }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [targetMs])
  if (!diff || diff <= 0) return null
  const s = Math.floor(diff / 1000)
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60 }
}
function useMatchWeather(venue) {
  const [weather, setWeather] = useState(null)
  useEffect(() => {
    if (!venue) return
    fetch(`/api/weather?venue=${encodeURIComponent(venue)}`)
      .then(r => r.json()).then(setWeather).catch(() => {})
  }, [venue])
  return weather
}

function TeamLogo({ logo, name, size = 60 }) {
  const [err, setErr] = useState(false)
  const initials = (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const PALETTE = ['#2563eb','#7c3aed','#0369a1','#b45309','#0891b2','#be185d']
  let h = 0; for (const c of (name||'')) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]
  if (!logo || err) return (
    <div style={{ width: size, height: size, borderRadius: size * 0.2, background: `linear-gradient(135deg,${bg},${bg}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: Math.round(size * 0.28), color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.2, background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
      <img src={logo} alt={name} style={{ width: '88%', height: '88%', objectFit: 'contain' }} onError={() => setErr(true)} />
    </div>
  )
}

function PublicNextMatch() {
  const [fixture, setFixture] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fixtures')
      .then(r => r.json())
      .then(d => {
        const today = new Date(); today.setHours(0,0,0,0)
        const next = (d.fixtures || []).find(f => {
          if (!isOurs(f.team1) && !isOurs(f.team2)) return false
          const dt = parseFixDate(f.date)
          return dt && dt >= today
        })
        setFixture(next || null); setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const targetMs = (() => {
    if (!fixture) return null
    const d = parseFixDate(fixture.date); if (!d) return null
    const [h, m] = (fixture.time || '13:00').split(':').map(Number)
    d.setHours(h, m, 0, 0); return d.getTime()
  })()

  const countdown = useFixCountdown(targetMs)
  const matchYMD  = fixture ? toYMD(parseFixDate(fixture.date)) : null
  const weather   = useMatchWeather(fixture?.venue)
  const days      = weather?.daily?.time || []

  if (loading || !fixture) return null

  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`

  return (
    <section style={{ background: 'linear-gradient(180deg, #060d1f 0%, #0a1222 100%)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 10 }}>Fixtures</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Next Match</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            borderRadius: 24, overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(150deg, #0d1b3e 0%, #111f45 50%, #0d1835 100%)',
            border: '1px solid rgba(233,160,32,0.18)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(233,160,32,0.08)',
          }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #e9a020, #f59e0b, transparent)' }} />
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(233,160,32,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(37,99,235,0.06)', pointerEvents: 'none' }} />

          <div style={{ padding: '28px 28px 0', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#86efac', boxShadow: '0 0 10px #86efac', animation: 'nmPulse 1.8s ease-in-out infinite' }} />
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Next Match</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '4px 10px', letterSpacing: '0.5px' }}>
                  {isOurs(fixture.team1) ? '🏠 Home' : '✈️ Away'}
                </div>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontWeight: 700, color: SITE.colors.gold, background: 'rgba(233,160,32,0.1)', border: '1px solid rgba(233,160,32,0.25)', borderRadius: 7, padding: '4px 10px', textDecoration: 'none', letterSpacing: '0.5px' }}>
                  Map →
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <TeamLogo logo={fixture.logo1} name={fixture.team1} size={64} />
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{shorten(fixture.team1)}</div>
              </div>

              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: 3 }}>VS</div>
                <div style={{ background: 'rgba(233,160,32,0.12)', border: '1px solid rgba(233,160,32,0.25)', borderRadius: 10, padding: '6px 14px', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, color: SITE.colors.gold }}>
                  {fixture.time}
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{fixture.date}</div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <TeamLogo logo={fixture.logo2} name={fixture.team2} size={64} />
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{shorten(fixture.team2)}</div>
              </div>
            </div>

            {countdown && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 0, margin: '28px 0 4px' }}>
                {[['Days', countdown.days], ['Hrs', countdown.hours], ['Min', countdown.mins], ['Sec', countdown.secs]].map(([label, val], i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'stretch' }}>
                    {i > 0 && <div style={{ width: 1, alignSelf: 'center', height: 28, background: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />}
                    <div style={{ textAlign: 'center', minWidth: 52 }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(val).padStart(2,'0')}</div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ margin: '20px 0 0', background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📍</span>
              <span style={{ flex: 1, fontFamily: "'Outfit',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fixture.venue}</span>
            </div>
          </div>

          {days.length > 0 && (
            <div style={{ margin: '16px 28px 28px', background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: '14px 14px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 13 }}>🌤️</span>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>7-Day Forecast</span>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>{weather?.location?.name || (fixture.venue?.split(',')[0] || '')}</span>
              </div>
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
                {days.map((dateStr, i) => {
                  const date     = new Date(dateStr + 'T12:00:00')
                  const dayLabel = date.toLocaleDateString('en-GB', { weekday: 'short' })
                  const isMatch  = dateStr === matchYMD
                  const wmo      = getWmo(weather.daily.weathercode[i])
                  const maxT     = Math.round(weather.daily.temperature_2m_max[i])
                  const minT     = Math.round(weather.daily.temperature_2m_min[i])
                  const rain     = weather.daily.precipitation_probability_max[i] || 0
                  return (
                    <div key={dateStr} style={{
                      flexShrink: 0, flex: '1 0 0', minWidth: 44, textAlign: 'center',
                      background: isMatch ? 'linear-gradient(160deg,rgba(233,160,32,0.2),rgba(255,255,255,0.12))' : 'rgba(255,255,255,0.06)',
                      border: isMatch ? '1.5px solid rgba(233,160,32,0.5)' : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: isMatch ? '5px 4px 6px' : '7px 4px 6px',
                      boxShadow: isMatch ? '0 0 16px rgba(233,160,32,0.15)' : 'none',
                    }}>
                      {isMatch && (
                        <div style={{ background: SITE.colors.gold, borderRadius: 5, padding: '2px 0', marginBottom: 4, fontFamily: "'Outfit',sans-serif", fontSize: 7, fontWeight: 900, color: '#000', letterSpacing: 0.5 }}>MATCH</div>
                      )}
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 8, fontWeight: 800, color: isMatch ? SITE.colors.gold : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{dayLabel}</div>
                      <div style={{ fontSize: 20, lineHeight: 1, margin: '4px 0 2px' }}>{wmo.icon}</div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 900, color: '#fff' }}>{maxT}°</div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{minT}°</div>
                      {rain > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, marginTop: 3 }}>
                          <span style={{ fontSize: 7 }}>💧</span>
                          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 8, fontWeight: 700, color: '#93c5fd' }}>{rain}%</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {matchYMD && (() => {
                const mi = days.indexOf(matchYMD)
                if (mi < 0) return null
                const wind = Math.round(weather.daily.windspeed_10m_max?.[mi] || 0)
                const rain = weather.daily.precipitation_probability_max[mi] || 0
                const wmo  = getWmo(weather.daily.weathercode[mi])
                return (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(233,160,32,0.08)', border: '1px solid rgba(233,160,32,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{wmo.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 800, color: SITE.colors.gold }}>Match Day — {wmo.label}</div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                        {Math.round(weather.daily.temperature_2m_max[mi])}°C high · Wind {wind} km/h · {rain > 0 ? `${rain}% rain chance` : 'No rain expected'}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </motion.div>
      </div>

      <style>{`@keyframes nmPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }`}</style>
    </section>
  )
}

function HeroSlideshow({ photos }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (photos.length < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % photos.length), 5000)
    return () => clearInterval(t)
  }, [photos.length])
  if (!photos.length) return null
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <AnimatePresence mode="sync">
        <motion.div
          key={photos[idx]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Blurred fill so there are no empty bars around the full photo */}
          <img
            src={photos[idx]} alt="" aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'blur(22px) brightness(0.55)', transform: 'scale(1.1)' }}
          />
          {/* Full photo — never cropped */}
          <img
            src={photos[idx]} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
          />
        </motion.div>
      </AnimatePresence>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(6,13,31,0.72) 0%, rgba(13,27,62,0.55) 60%, rgba(6,13,31,0.68) 100%)' }} />
    </div>
  )
}

const HERO_PHOTOS = [
  '/hero/hero-1.jpeg',
  '/hero/hero-2.jpeg',
  '/hero/hero-3.jpeg',
  '/hero/hero-4.jpeg',
  '/hero/hero-5.jpeg',
  '/hero/hero-6.jpeg',
  '/hero/hero-7.jpeg',
]

const HERO_WORDS = [
  { text: 'Tamil United', line: 1 },
  { text: 'Cricket', line: 2 },
  { text: 'Club', line: 2 },
]

// ─── League Table ────────────────────────────────────────────────────────────
// Embedded fallback so the table always renders (live API used when deployed on Vercel).
// Keep this in sync with the latest BTCL standings.
const LEAGUE_FALLBACK = [
  { pos: 1, team: 'Stanly CC - A',                                        p: '7', w: '7', l: '0', nrr: '3.22',  pts: '140' },
  { pos: 2, team: 'Lewisham CC - A',                                      p: '7', w: '5', l: '1', nrr: '1.97',  pts: '117' },
  { pos: 3, team: 'Northerns CC - A',                                     p: '7', w: '4', l: '3', nrr: '1.73',  pts: '98'  },
  { pos: 4, team: 'Northerns CC - B',                                     p: '7', w: '3', l: '3', nrr: '-0.17', pts: '90'  },
  { pos: 5, team: 'West 3 CC - 1st XI',                                   p: '7', w: '3', l: '4', nrr: '-1.28', pts: '87'  },
  { pos: 6, team: 'Redbridge Lankians Sports & Social Club CC - 1st XI',  p: '7', w: '2', l: '5', nrr: '-1.79', pts: '73'  },
  { pos: 7, team: 'Kent United CC - 1st XI',                              p: '7', w: '2', l: '4', nrr: '-1.09', pts: '69'  },
  { pos: 8, team: 'Dollishill Tamil United CC - Knights',                 p: '7', w: '0', l: '6', nrr: '-2.36', pts: '51'  },
]

const OUR_TEAM_KEYWORDS = ['dollishill', 'tamil united', 'tucc', 'dtu']
function isOurTeam(name = '') {
  return OUR_TEAM_KEYWORDS.some(k => name.toLowerCase().includes(k))
}

function FormDots({ w, l, p }) {
  const played = parseInt(p) || 0
  const wins   = parseInt(w) || 0
  const losses = parseInt(l) || 0
  const other  = Math.max(0, played - wins - losses)
  const dots   = [...Array(wins).fill('w'), ...Array(losses).fill('l'), ...Array(other).fill('d')].slice(0, 6)
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
      {dots.map((d, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: d === 'w' ? '#4ade80' : d === 'l' ? '#f87171' : 'rgba(255,255,255,0.2)',
        }} />
      ))}
    </div>
  )
}

function LeagueSection() {
  const [teams, setTeams] = useState(LEAGUE_FALLBACK)
  const [meta, setMeta]   = useState({})

  useEffect(() => {
    fetch('/api/league-table')
      .then(r => { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then(d => {
        if (d.teams && d.teams.length) {
          setTeams(d.teams)
          setMeta({ updatedAt: d.updatedAt, source: d.source })
        }
      })
      .catch(() => { /* keep embedded fallback */ })
  }, [])

  const loading = false

  const TUCC_POS = teams.find(t => isOurTeam(t.team))?.pos

  return (
    <section style={{ background: 'linear-gradient(180deg, #040a18 0%, #060d1f 100%)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '80px 24px' }}>
      {/* Glow orb */}
      <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,160,32,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(233,160,32,0.1)', border: '1px solid rgba(233,160,32,0.25)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
                <span style={{ fontSize: 13 }}>🏆</span>
                <span style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Live Standings</span>
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0 }}>BTCL Premier League 2026</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>British Tamils Cricket League</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              {meta.source === 'live' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
                  <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>Live</span>
                </div>
              )}
              {meta.updatedAt && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  Updated {new Date(meta.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
              {TUCC_POS && (
                <div style={{ background: 'rgba(233,160,32,0.12)', border: '1px solid rgba(233,160,32,0.3)', borderRadius: 10, padding: '4px 12px', fontSize: 12, color: SITE.colors.gold, fontWeight: 700 }}>
                  We're #{TUCC_POS} 🏏
                </div>
              )}
            </div>
          </div>

          {/* Table card */}
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 36px 36px 36px 56px 60px',
              padding: '10px 18px', background: 'rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              {['#', 'Team', 'P', 'W', 'L', 'NRR', 'Pts'].map((h, i) => (
                <div key={h} style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: i === 1 ? 'left' : 'center' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 36px 36px 36px 56px 60px', padding: '13px 18px', borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', gap: 0 }}>
                  <div style={{ height: 8, width: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
                  <div style={{ height: 8, width: `${50 + (i % 3) * 20}%`, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
                  {[1,2,3,4,5].map(j => <div key={j} style={{ height: 8, width: 22, background: 'rgba(255,255,255,0.08)', borderRadius: 4, margin: '0 auto' }} />)}
                </div>
              ))
            ) : (
              teams.map((t, i) => {
                const ours = isOurTeam(t.team)
                const nrr  = parseFloat(t.nrr)
                return (
                  <motion.div
                    key={t.pos || i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: 'grid', gridTemplateColumns: '36px 1fr 36px 36px 36px 56px 60px',
                      padding: '12px 18px',
                      borderBottom: i < teams.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      alignItems: 'center', gap: 0,
                      background: ours
                        ? 'linear-gradient(90deg, rgba(233,160,32,0.12) 0%, rgba(233,160,32,0.04) 100%)'
                        : 'transparent',
                      borderLeft: ours ? `3px solid ${SITE.colors.gold}` : '3px solid transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* Pos */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.pos === 1 ? '#fbbf24' : t.pos <= 3 ? '#a3e635' : 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                      {t.pos === 1 ? '🥇' : t.pos === 2 ? '🥈' : t.pos === 3 ? '🥉' : t.pos}
                    </div>
                    {/* Team */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: ours ? 800 : 500,
                        color: ours ? SITE.colors.gold : 'rgba(255,255,255,0.85)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {ours && <span style={{ marginRight: 5 }}>🏏</span>}{t.team}
                      </div>
                      <FormDots w={t.w} l={t.l} p={t.p} />
                    </div>
                    {/* P */}
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{t.p}</div>
                    {/* W */}
                    <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, textAlign: 'center' }}>{t.w}</div>
                    {/* L */}
                    <div style={{ fontSize: 12, color: parseInt(t.l) > 0 ? '#f87171' : 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{t.l}</div>
                    {/* NRR */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: nrr > 0 ? '#4ade80' : nrr < 0 ? '#f87171' : 'rgba(255,255,255,0.35)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                      {nrr > 0 ? '+' : ''}{t.nrr}
                    </div>
                    {/* Pts */}
                    <div style={{ fontSize: 15, fontWeight: 900, color: ours ? SITE.colors.gold : '#fff', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.pts}</div>
                  </motion.div>
                )
              })
            )}

            {/* Footer */}
            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>P=Played · W=Won · L=Lost · NRR=Net Run Rate · Pts=Points</span>
              <a href="https://dtucc.play-cricket.com/website/division/137680" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: SITE.colors.gold, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Full table →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default function PublicHome() {
  const [heroPhotos] = useState(HERO_PHOTOS)
  const [recentPhotos, setRecentPhotos] = useState([])
  const [topPlayers, setTopPlayers] = useState([])

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, media_url')
      .not('media_url', 'is', null)
      .not('media_url', 'like', '%.mp4')
      .not('media_url', 'like', '%.mov')
      .not('media_url', 'like', '%.webm')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setRecentPhotos((data || []).map(p => p.media_url))
      })
  }, [])

  useEffect(() => {
    supabase
      .from('tucc_player_scores')
      .select('*')
      .eq('season', 2026)
      .order('score', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setTopPlayers(data || [])
      })
  }, [])

  const galleryPhotos = recentPhotos.length > 0 ? recentPhotos : HERO_PHOTOS.slice(0, 6)

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
        <HeroSlideshow photos={heroPhotos} />

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          <div style={{
            position: 'absolute', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
            top: '-200px', right: '-200px',
          }} />
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(233,160,32,0.06) 0%, transparent 70%)',
            bottom: '-100px', left: '-100px',
          }} />
        </div>

        <div style={{ textAlign: 'center', maxWidth: 900, position: 'relative', zIndex: 2 }}>
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

          <h1 style={{ fontSize: 'clamp(42px, 7vw, 90px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-3px', marginBottom: 24, color: '#fff', overflow: 'hidden' }}>
            {/* Line 1 */}
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <motion.span
                style={{ display: 'inline-block' }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                Tamil United
              </motion.span>
            </span>
            {/* Line 2 */}
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <motion.span
                style={{ display: 'inline-block', color: SITE.colors.gold }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                Cricket
              </motion.span>
            </span>
            {/* Line 3 */}
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <motion.span
                style={{ display: 'inline-block' }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                Club
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', color: 'rgba(255,255,255,0.85)', marginBottom: 12, fontWeight: 300, letterSpacing: '-0.5px' }}
          >
            {SITE.tagline}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', color: 'rgba(255,255,255,0.55)', marginBottom: 48, fontWeight: 400 }}
          >
            {SITE.tagline2}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/join" style={{
              background: SITE.colors.gold, color: '#000', textDecoration: 'none',
              fontWeight: 800, fontSize: 16, padding: '16px 40px', borderRadius: 12,
              letterSpacing: '0.3px', transition: 'all 0.2s',
              boxShadow: '0 8px 32px rgba(233,160,32,0.4)',
            }}>
              Join the Club
            </Link>
            <Link to="/login" style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none',
              fontWeight: 600, fontSize: 16, padding: '16px 40px', borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,0.25)', transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}>
              Player Login →
            </Link>
          </motion.div>
        </div>

        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 2, animation: 'bounce 2s infinite' }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(233,160,32,0.6), transparent)' }} />
        </div>
      </section>

      {/* STAT COUNTERS */}
      <section style={{ background: 'linear-gradient(90deg, #0d1b3e 0%, #111827 100%)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
          {[
            { ...STATS[0], color: '#e9a020', bg: 'rgba(233,160,32,0.08)' },
            { ...STATS[1], color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { ...STATS[2], color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
            { ...STATS[3], color: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none', padding: '32px 24px', textAlign: 'center' }}>
              <StatCounter stat={s} />
            </div>
          ))}
        </div>
      </section>

      {/* ANNOUNCEMENT BAR */}
      <section style={{ background: 'linear-gradient(90deg, #0a1628 0%, #0d1b3e 50%, #0a1628 100%)', borderTop: '1px solid rgba(233,160,32,0.12)', borderBottom: '1px solid rgba(233,160,32,0.12)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac', boxShadow: '0 0 8px #86efac', animation: 'nmPulse 1.8s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: SITE.colors.gold, letterSpacing: '1px', textAlign: 'center' }}>
            🏏 2026 BTCL Season · Season is Live
          </span>
          <Link to="/fixtures" style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(233,160,32,0.15)', border: '1px solid rgba(233,160,32,0.3)', borderRadius: 6, padding: '4px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            View Fixtures →
          </Link>
        </div>
      </section>

      {/* CLUB STORY */}
      <section style={{ background: 'linear-gradient(180deg, #060d1f 0%, #08112a 100%)', padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background decorative elements */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'radial-gradient(ellipse at 80% 50%, rgba(233,160,32,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '30%', height: '60%', background: 'radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Our Heritage</div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 900, color: '#fff', letterSpacing: '-2px', margin: 0 }}>The Club Story</h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
            {/* Big year */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative' }}
            >
              <div style={{
                fontSize: 'clamp(80px, 12vw, 160px)', fontWeight: 900, color: 'transparent',
                backgroundImage: `linear-gradient(135deg, ${SITE.colors.gold} 0%, #f59e0b 50%, rgba(233,160,32,0.3) 100%)`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                lineHeight: 1, letterSpacing: '-6px', fontFamily: "'Outfit', sans-serif",
              }}>
                2010
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginTop: 8 }}>Year Founded</div>
              <div style={{ width: 60, height: 3, background: `linear-gradient(90deg, ${SITE.colors.gold}, transparent)`, marginTop: 16 }} />
            </motion.div>

            {/* Story + timeline */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              <p style={{ fontSize: 'clamp(16px, 1.8vw, 20px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 20, fontWeight: 300 }}>
                Tamil United Cricket Club was born from a simple but powerful idea — that cricket could unite the Tamil diaspora in North West London, giving our community a stage to compete, connect, and celebrate our culture.
              </p>
              <p style={{ fontSize: 'clamp(15px, 1.5vw, 17px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 48, fontWeight: 300 }}>
                From humble beginnings to one of the most respected Tamil clubs in the British Tamils Cricket League, our journey has been shaped by passion, resilience, and an unwavering love for the game.
              </p>

              {/* Timeline */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, rgba(233,160,32,0.6), rgba(233,160,32,0.1))', borderRadius: 1 }} />
                {[
                  { year: '2010', title: 'Founded', text: 'Tamil United CC established, entering the BTCL for the first time with a squad of committed pioneers.' },
                  { year: '2014', title: 'First Title Challenge', text: 'Our most competitive season to date — the squad pushed hard for the BTCL championship, announcing ourselves as genuine contenders.' },
                  { year: '2026', title: 'Best Ever Squad', text: '30+ registered players, a full digital club platform, and the strongest roster in our history. The best is yet to come.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ display: 'flex', gap: 28, marginBottom: 36, paddingLeft: 0 }}
                  >
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 3 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: i === 2 ? SITE.colors.gold : '#0d1b3e', border: `2px solid ${SITE.colors.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: i === 2 ? '#000' : SITE.colors.gold, flexShrink: 0, zIndex: 1 }}>
                        {i === 2 ? '★' : '●'}
                      </div>
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: SITE.colors.gold, letterSpacing: '-1px' }}>{item.year}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: 'rgba(233,160,32,0.1)', border: '1px solid rgba(233,160,32,0.2)', borderRadius: 6, padding: '2px 10px' }}>{item.title}</span>
                      </div>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <PublicNextMatch />

      {/* SQUAD SPOTLIGHT */}
      <section style={{ background: 'linear-gradient(180deg, #060d1f 0%, #0a1222 100%)', padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(233,160,32,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>2026 Season</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, color: '#fff', letterSpacing: '-2px', margin: '0 0 16px' }}>Squad Spotlight</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Our top performers this season</p>
          </motion.div>

          {topPlayers.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20, marginBottom: 48 }}>
              {topPlayers.map((player, i) => {
                const rankCfg = [
                  {
                    bg: 'linear-gradient(145deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%)',
                    headerBg: 'linear-gradient(135deg, #f59e0b 0%, #e9a020 50%, #d97706 100%)',
                    accentColor: '#f59e0b',
                    accentGlow: 'rgba(245,158,11,0.35)',
                    avatarBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    avatarText: '#1a0a00',
                    ringColor: '#f59e0b',
                    scoreColor: '#fbbf24',
                    border: '1px solid rgba(245,158,11,0.4)',
                    shadow: '0 24px 70px rgba(245,158,11,0.22), 0 8px 24px rgba(0,0,0,0.5)',
                    statBg: 'rgba(245,158,11,0.1)',
                    label: '🥇 #1 Performer',
                  },
                  {
                    bg: 'linear-gradient(145deg, #060d1f 0%, #0d1b3e 40%, #0a1428 100%)',
                    headerBg: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
                    accentColor: '#60a5fa',
                    accentGlow: 'rgba(96,165,250,0.3)',
                    avatarBg: 'linear-gradient(135deg, #60a5fa, #2563eb)',
                    avatarText: '#fff',
                    ringColor: '#60a5fa',
                    scoreColor: '#93c5fd',
                    border: '1px solid rgba(96,165,250,0.3)',
                    shadow: '0 20px 60px rgba(59,130,246,0.2), 0 8px 24px rgba(0,0,0,0.5)',
                    statBg: 'rgba(96,165,250,0.1)',
                    label: '🥈 #2 Performer',
                  },
                  {
                    bg: 'linear-gradient(145deg, #041a04 0%, #0a2a0a 40%, #041204 100%)',
                    headerBg: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
                    accentColor: '#4ade80',
                    accentGlow: 'rgba(74,222,128,0.3)',
                    avatarBg: 'linear-gradient(135deg, #4ade80, #16a34a)',
                    avatarText: '#041a04',
                    ringColor: '#4ade80',
                    scoreColor: '#86efac',
                    border: '1px solid rgba(74,222,128,0.3)',
                    shadow: '0 20px 60px rgba(34,197,94,0.18), 0 8px 24px rgba(0,0,0,0.5)',
                    statBg: 'rgba(74,222,128,0.1)',
                    label: '🥉 #3 Performer',
                  },
                ][i];
                const initials = (player.player_name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <motion.div
                    key={player.id || i}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      borderRadius: 24, overflow: 'hidden',
                      background: rankCfg.bg,
                      border: rankCfg.border,
                      boxShadow: rankCfg.shadow,
                      position: 'relative',
                      transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)' }}
                  >
                    {/* Coloured hero header band */}
                    <div style={{
                      height: 90,
                      background: rankCfg.headerBg,
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex', alignItems: 'flex-start',
                      padding: '14px 20px 0',
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, transparent 60%)',
                        pointerEvents: 'none',
                      }} />
                      <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                        color: 'rgba(0,0,0,0.6)', background: 'rgba(255,255,255,0.28)',
                        borderRadius: 20, padding: '4px 12px',
                        position: 'relative', zIndex: 1,
                      }}>{rankCfg.label}</span>
                    </div>

                    {/* Avatar overlapping header */}
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: rankCfg.avatarBg,
                      border: '4px solid rgba(6,13,31,0.95)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 900, color: rankCfg.avatarText,
                      letterSpacing: '-0.5px',
                      position: 'absolute', top: 54, left: 20,
                      boxShadow: `0 4px 16px ${rankCfg.accentGlow}`,
                    }}>{initials}</div>

                    <div style={{ padding: '46px 20px 24px' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 3, letterSpacing: '-0.4px' }}>{player.player_name || 'Player'}</div>
                      <div style={{ fontSize: 11, color: rankCfg.accentColor, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 18 }}>{player.role || 'All-Rounder'}</div>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: rankCfg.statBg, borderRadius: 14, padding: '14px 18px',
                        border: `1px solid ${rankCfg.accentColor}22`,
                      }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Season Score</div>
                          <div style={{ fontSize: 34, fontWeight: 900, color: rankCfg.scoreColor, letterSpacing: '-1.5px', lineHeight: 1 }}>{player.score ?? '—'}</div>
                        </div>
                        <svg width={54} height={54} style={{ flexShrink: 0 }}>
                          <circle cx={27} cy={27} r={22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5}/>
                          <circle cx={27} cy={27} r={22} fill="none" stroke={rankCfg.ringColor} strokeWidth={5}
                            strokeDasharray={`${(Math.min(player.score || 0, 100) / 100) * 138.2} 138.2`}
                            strokeLinecap="round"
                            transform="rotate(-90 27 27)"
                            style={{ filter: `drop-shadow(0 0 5px ${rankCfg.accentGlow})` }}
                          />
                          <text x={27} y={31} textAnchor="middle" fill="rgba(255,255,255,0.45)"
                            style={{ fontFamily:"'Outfit',sans-serif", fontSize: 9, fontWeight: 700 }}>
                            /100
                          </text>
                        </svg>
                      </div>

                      {player.headline && (
                        <div style={{
                          marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.55)',
                          lineHeight: 1.5, fontStyle: 'italic',
                          borderLeft: `3px solid ${rankCfg.accentColor}`,
                          paddingLeft: 10,
                        }}>{player.headline}</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
              Season stats coming soon...
            </div>
          )}

          <motion.div {...fadeUp} style={{ textAlign: 'center' }}>
            <Link to="/squad" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: SITE.colors.gold, textDecoration: 'none', fontWeight: 700, fontSize: 15,
              border: `1px solid ${SITE.colors.gold}`, padding: '13px 32px', borderRadius: 10,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = SITE.colors.gold; e.currentTarget.style.color = '#000' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = SITE.colors.gold }}
            >
              View All Players →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* LEAGUE TABLE */}
      <LeagueSection />

      {/* WELCOME */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <motion.div {...fadeUp}>
            <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Our Values</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 24, color: '#fff' }}>
              A Community Built<br />
              <span style={{ color: SITE.colors.gold }}>on Cricket</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 20 }}>
              Tamil United Cricket Club is a proud member of the British Tamils Cricket League, representing the Tamil community across North West London with dignity and passion.
            </p>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 32 }}>
              Built on unity, shared culture, and the love of the game — we've grown into one of the most respected clubs in the BTCL, with over 30 registered players and a vision for the future.
            </p>
            <Link to="/about" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: SITE.colors.gold, color: '#000', textDecoration: 'none', fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 10 }}>
              Read Our Full Story →
            </Link>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.7 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '🏏', title: 'Competitive Cricket', text: 'Representing our community in the BTCL with pride every season.', color: '#e9a020', bg: 'rgba(233,160,32,0.1)', border: 'rgba(233,160,32,0.25)' },
                { icon: '🤝', title: 'Community First', text: 'Events, fundraisers, and social matches that bring everyone together.', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)' },
                { icon: '🌟', title: 'Youth Development', text: 'Nurturing the next generation of Tamil cricket talent.', color: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)' },
                { icon: '🏆', title: 'Club Excellence', text: 'Professional management, transparent governance, club-wide ambition.', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                  style={{ padding: 22, background: item.bg, borderRadius: 16, border: `1px solid ${item.border}` }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: item.color, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{item.text}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section style={{ background: 'linear-gradient(180deg, #0a1628 0%, #060d1f 100%)', padding: '90px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>Explore</div>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>Everything TU CC</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
            {[
              { to: '/about',      icon: '📖', title: 'About Us',   text: 'Our history, values, and the community we serve', color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)' },
              { to: '/committee',  icon: '👥', title: 'Committee',  text: 'Meet the dedicated people who run the club',       color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)' },
              { to: '/membership', icon: '🏏', title: 'Membership', text: 'Join TU CC from just £100 per season',            color: '#e9a020', bg: 'rgba(233,160,32,0.1)',  border: 'rgba(233,160,32,0.25)' },
              { to: '/photos',     icon: '📸', title: 'Gallery',    text: 'Match photos, events, and club moments',          color: '#ec4899', bg: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.25)' },
              { to: '/contact',    icon: '✉️', title: 'Contact',    text: 'Get in touch with the club committee',            color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)' },
              { to: '/join',       icon: '✅', title: 'Join Now',   text: 'Start your membership enquiry today',             color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'  },
            ].map((card, i) => (
              <motion.div key={card.to} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                <Link to={card.to} style={{ display: 'block', textDecoration: 'none', background: card.bg, border: `1px solid ${card.border}`, borderRadius: 18, padding: '28px 24px', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)', height: '100%', boxSizing: 'border-box' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${card.color}25` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{card.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 8 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 16 }}>{card.text}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: card.color }}>Learn more →</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN THE FAMILY */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '120px 24px', background: 'linear-gradient(135deg, #060d1f 0%, #0d1b3e 40%, #060d1f 100%)' }}>
        {/* Dramatic background */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(233,160,32,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,160,32,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Large decorative cricket ball outline */}
        <div style={{ position: 'absolute', right: -120, top: '50%', transform: 'translateY(-50%)', width: 400, height: 400, borderRadius: '50%', border: '2px solid rgba(233,160,32,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)', width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(233,160,32,0.04)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 20 }}>Membership 2026</div>
            <h2 style={{ fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: 900, color: '#fff', letterSpacing: '-3px', lineHeight: 1, marginBottom: 16 }}>
              Ready to Play?
            </h2>
            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.6)', marginBottom: 52, fontWeight: 300, lineHeight: 1.7 }}>
              Become part of the Tamil United family. Train with the best, compete in the BTCL, and represent your community with pride.
            </p>

            {/* Membership tiers */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
              {[
                { label: 'Junior', price: '£100', desc: 'Under 18', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)' },
                { label: 'Adult', price: '£150', desc: 'Full membership', color: SITE.colors.gold, bg: 'rgba(233,160,32,0.12)', border: 'rgba(233,160,32,0.4)', featured: true },
                { label: 'Family', price: '£250', desc: '2 adults + juniors', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
              ].map((tier, i) => (
                <motion.div
                  key={tier.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: '20px 28px', borderRadius: 16,
                    background: tier.bg, border: `1px solid ${tier.border}`,
                    minWidth: 140, position: 'relative',
                    boxShadow: tier.featured ? `0 12px 40px rgba(233,160,32,0.15)` : 'none',
                    transform: tier.featured ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {tier.featured && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: SITE.colors.gold, color: '#000', fontSize: 9, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100 }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{tier.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: tier.color, letterSpacing: '-1px', lineHeight: 1 }}>{tier.price}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{tier.desc}</div>
                </motion.div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/join" style={{
                background: SITE.colors.gold, color: '#000', textDecoration: 'none',
                fontWeight: 800, fontSize: 17, padding: '18px 48px', borderRadius: 12,
                boxShadow: '0 12px 40px rgba(233,160,32,0.35)', letterSpacing: '0.3px',
                transition: 'all 0.2s',
              }}>
                Join Now
              </Link>
              <Link to="/contact" style={{
                background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none',
                fontWeight: 600, fontSize: 17, padding: '18px 48px', borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.2)', transition: 'all 0.2s',
                backdropFilter: 'blur(8px)',
              }}>
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SPONSORS PREVIEW */}
      <section style={{ background: 'linear-gradient(180deg, #060d1f 0%, #040a18 100%)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '90px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,160,32,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <motion.div {...fadeUp} style={{ textAlign: 'center', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(233,160,32,0.1)', border: '1px solid rgba(233,160,32,0.25)', borderRadius: 20, padding: '5px 16px', marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>🤝</span>
            <span style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase' }}>Our Partners</span>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-0.5px' }}>Proud Sponsors</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 60, maxWidth: 480, margin: '0 auto 60px' }}>The businesses that make Tamil United CC possible — thank you for your support</p>

          {/* All sponsors in one row */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', justifyContent: 'center', flexWrap: 'wrap' }}>
            {SITE.sponsors.map(s => {
              const tierCfg = {
                Platinum: { color: '#e2e8f0', glow: 'rgba(226,232,240,0.18)', border: 'rgba(226,232,240,0.25)', bg: 'linear-gradient(145deg, rgba(226,232,240,0.08), rgba(148,163,184,0.04))', badge: 'linear-gradient(135deg, #94a3b8, #e2e8f0)' },
                Gold:     { color: '#f59e0b', glow: 'rgba(245,158,11,0.22)',  border: 'rgba(245,158,11,0.35)',  bg: 'linear-gradient(145deg, rgba(245,158,11,0.1),  rgba(217,119,6,0.04))',   badge: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                Silver:   { color: '#93c5fd', glow: 'rgba(147,197,253,0.18)', border: 'rgba(147,197,253,0.25)', bg: 'linear-gradient(145deg, rgba(147,197,253,0.08), rgba(59,130,246,0.03))',  badge: 'linear-gradient(135deg, #60a5fa, #3b82f6)' },
                Bronze:   { color: '#fb923c', glow: 'rgba(251,146,60,0.18)',  border: 'rgba(251,146,60,0.25)',  bg: 'linear-gradient(145deg, rgba(251,146,60,0.08), rgba(234,88,12,0.03))',   badge: 'linear-gradient(135deg, #fb923c, #ea580c)' },
              }[s.tier] || {};
              return (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'none', transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px) scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                >
                  <div style={{
                    background: tierCfg.bg, border: `1px solid ${tierCfg.border}`,
                    borderRadius: 18, padding: '16px 16px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    boxShadow: `0 8px 30px ${tierCfg.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
                    width: 130,
                  }}>
                    <div style={{
                      width: 98, height: 98, background: '#fff', borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 12, boxSizing: 'border-box',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                    }}>
                      <img src={s.logo} alt={s.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                      <span style={{ display: 'none', color: '#1e3a8a', fontSize: 9, fontWeight: 700, textAlign: 'center' }}>{s.name}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase',
                        background: tierCfg.badge, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        marginBottom: 3,
                      }}>{s.tier}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>{s.name}</div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          <Link to="/sponsors" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20,
            color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700,
            background: 'linear-gradient(135deg, rgba(233,160,32,0.15), rgba(233,160,32,0.05))',
            border: '1px solid rgba(233,160,32,0.3)', padding: '12px 32px', borderRadius: 12,
            transition: 'all 0.25s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(233,160,32,0.25), rgba(233,160,32,0.1))'; e.currentTarget.style.borderColor = 'rgba(233,160,32,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(233,160,32,0.15), rgba(233,160,32,0.05))'; e.currentTarget.style.borderColor = 'rgba(233,160,32,0.3)'; }}
          >
            View All Sponsors →
          </Link>
        </motion.div>
      </section>

      {/* GALLERY — always shown */}
      <section style={{ background: '#040a18', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <motion.div {...fadeUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: SITE.colors.gold, fontWeight: 700, fontSize: 12, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 8 }}>Club Gallery</div>
              <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Recent Moments</h2>
            </div>
            <Link to="/photos" style={{ color: SITE.colors.gold, textDecoration: 'none', fontWeight: 700, fontSize: 14, border: `1px solid ${SITE.colors.gold}`, padding: '9px 20px', borderRadius: 8, whiteSpace: 'nowrap' }}>
              View All Photos →
            </Link>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {galleryPhotos.slice(0, 6).map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  borderRadius: 14, overflow: 'hidden',
                  aspectRatio: i === 0 ? '4/3' : i === 3 ? '4/3' : '4/3',
                  position: 'relative',
                  gridRow: i === 0 ? 'span 1' : 'span 1',
                }}
              >
                <Link to="/photos" style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}>
                  <img src={url} alt="" loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)', display: 'block' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)', pointerEvents: 'none', opacity: 0, transition: 'opacity 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
        @keyframes nmPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 40px !important; }
          section > div[style*="grid-template-columns: 1fr 2fr"] { grid-template-columns: 1fr !important; gap: 24px !important; }
          section > div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          section > div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
