import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import Avatar from './ui/Avatar'
import Card from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'
import { Skeleton } from './ui/Loader'
import LeagueTable from './LeagueTable'
import PlayerDashboard from './PlayerDashboard'

import { ClipboardList, ChevronRight, TrendingUp, Target, BarChart2, Trophy, Users, Zap, MapPin, Clock, Home as HomeIcon, Plane, CalendarDays } from 'lucide-react'

// ── Weather helpers ────────────────────────────────────────
const WMO_MAP = [
  { max: 0,  icon: '☀️',  label: 'Clear',        hi: '#fde68a', lo: '#f59e0b' },
  { max: 1,  icon: '🌤️', label: 'Mostly Clear',  hi: '#fde68a', lo: '#f59e0b' },
  { max: 2,  icon: '⛅',  label: 'Part Cloudy',  hi: '#e2e8f0', lo: '#94a3b8' },
  { max: 3,  icon: '☁️',  label: 'Overcast',     hi: '#cbd5e1', lo: '#64748b' },
  { max: 48, icon: '🌫️', label: 'Foggy',        hi: '#e2e8f0', lo: '#94a3b8' },
  { max: 57, icon: '🌦️', label: 'Drizzle',      hi: '#bfdbfe', lo: '#3b82f6' },
  { max: 67, icon: '🌧️', label: 'Rain',         hi: '#93c5fd', lo: '#1d4ed8' },
  { max: 77, icon: '❄️',  label: 'Snow',         hi: '#e0f2fe', lo: '#0369a1' },
  { max: 82, icon: '🌦️', label: 'Showers',      hi: '#bfdbfe', lo: '#3b82f6' },
  { max: 86, icon: '🌨️', label: 'Snow shower',  hi: '#e0f2fe', lo: '#0369a1' },
  { max: 99, icon: '⛈️',  label: 'Thunderstorm', hi: '#ddd6fe', lo: '#7c3aed' },
]
function getWmo(code) {
  return WMO_MAP.find(w => code <= w.max) || WMO_MAP[WMO_MAP.length - 1]
}
function toYMD(d) {
  if (!d) return null
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${dd}`
}
function useMatchWeather(venue) {
  const [weather, setWeather] = useState(null)
  const [wLoad, setWLoad]     = useState(false)
  useEffect(() => {
    if (!venue) return
    setWLoad(true)
    fetch(`/api/weather?venue=${encodeURIComponent(venue)}`)
      .then(r => r.json())
      .then(d => { setWeather(d); setWLoad(false) })
      .catch(() => setWLoad(false))
  }, [venue])
  return { weather, wLoad }
}

// ── Next Fixture Card ──────────────────────────────────────
const OUR_NAMES_FIX = ['Tamil United', 'TUCC', 'Dollishill Tamil United', 'DTU']
const isOursFix = (name = '') => OUR_NAMES_FIX.some(t => name.toLowerCase().includes(t.toLowerCase()))
const shortenFix = n =>
  n.replace('Dollishill Tamil United CC - Knights', 'Tamil United CC')
   .replace('Sports & Social Club', '').replace('- 1st XI', '')
   .replace(/\s*-\s*[AB]$/, '').trim()

function parseFixDate(str) {
  if (!str) return null
  const m = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (!m) return null
  return new Date(`${m[2]} ${m[1]}, ${m[3]}`)
}

function useFixCountdown(targetMs) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    if (!targetMs) return
    const tick = () => { const d = targetMs - Date.now(); setDiff(d > 0 ? d : 0) }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs])
  if (!diff || diff <= 0) return null
  const s = Math.floor(diff / 1000)
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60 }
}

function FixLogoSmall({ logo, name, size = 52 }) {
  const [err, setErr] = useState(false)
  const initials = (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const PALETTE = ['#1a5c38','#7c3aed','#0369a1','#b45309','#0891b2','#be185d']
  let h = 0; for (const c of (name||'')) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]
  if (!logo || err) return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: `linear-gradient(135deg,${bg},${bg}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * 0.28), color: '#fff', flexShrink: 0, boxShadow: `0 4px 14px ${bg}44` }}>
      {initials}
    </div>
  )
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,.12)', border: '2px solid rgba(255,255,255,.7)' }}>
      <img src={logo} alt={name} style={{ width: '88%', height: '88%', objectFit: 'contain' }} onError={() => setErr(true)} />
    </div>
  )
}

function NextFixtureCard() {
  const nav = useNavigate()
  const [fixture, setFixture] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fixtures')
      .then(r => r.json())
      .then(d => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const next = (d.fixtures || []).find(f => {
          if (!isOursFix(f.team1) && !isOursFix(f.team2)) return false
          const dt = parseFixDate(f.date)
          return dt && dt >= today
        })
        setFixture(next || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const targetMs = (() => {
    if (!fixture) return null
    const d = parseFixDate(fixture.date)
    if (!d) return null
    const [h, m] = (fixture.time || '13:00').split(':').map(Number)
    d.setHours(h, m, 0, 0)
    return d.getTime()
  })()
  const countdown   = useFixCountdown(targetMs)
  const isHome      = fixture && isOursFix(fixture.team1)
  const matchYMD    = fixture ? toYMD(parseFixDate(fixture.date)) : null
  const { weather, wLoad } = useMatchWeather(fixture?.venue)

  if (loading) return (
    <motion.div variants={staggerItem} style={{ marginTop: 16, height: 200, borderRadius: 20, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', opacity: 0.25 }} />
  )
  if (!fixture) return null

  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`
  const days   = weather?.daily?.time || []

  return (
    <motion.div
      variants={staggerItem}
      style={{ marginTop: 16, borderRadius: 22, overflow: 'hidden', boxShadow: '0 10px 40px rgba(29,78,216,.4)', position: 'relative', background: 'linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 45%, #2563eb 100%)' }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: -36, right: -36, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 60, left: -24, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#86efac', boxShadow: '0 0 8px #86efac', animation: 'pendingPulse 1.8s ease-in-out infinite' }} />
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.85)', textTransform: 'uppercase', letterSpacing: 1 }}>Next Match</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 8, padding: '4px 9px' }}>
            {isHome ? <HomeIcon size={10} color="#fff" strokeWidth={2.5} /> : <Plane size={10} color="#fff" strokeWidth={2.5} />}
            <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: '#fff' }}>{isHome ? 'Home' : 'Away'}</span>
          </div>
          <button onClick={() => nav('/fixtures')} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.22)', borderRadius: 8, padding: '4px 11px', fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            All fixtures →
          </button>
        </div>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 0', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <FixLogoSmall logo={fixture.logo1} name={fixture.team1} size={56} />
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{shortenFix(fixture.team1)}</div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.35)', letterSpacing: 3 }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.15)', borderRadius: 9, padding: '5px 10px' }}>
            <Clock size={10} color="rgba(255,255,255,.8)" strokeWidth={2} />
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: '#fff' }}>{fixture.time}</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <FixLogoSmall logo={fixture.logo2} name={fixture.team2} size={56} />
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{shortenFix(fixture.team2)}</div>
        </div>
      </div>

      {/* Date */}
      <div style={{ textAlign: 'center', padding: '10px 16px 0', fontFamily: FONT, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: 0.3 }}>{fixture.date}</div>

      {/* Countdown */}
      {countdown && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '10px 16px 0' }}>
          {[['days', countdown.days], ['hrs', countdown.hours], ['min', countdown.mins], ['sec', countdown.secs]].map(([label, val], i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {i > 0 && <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,.18)' }} />}
              <div style={{ textAlign: 'center', minWidth: 38 }}>
                <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(val).padStart(2, '0')}</div>
                <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Venue */}
      <div style={{ margin: '14px 16px 0', background: 'rgba(0,0,0,.2)', borderRadius: 13, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MapPin size={13} color="rgba(255,255,255,.5)" strokeWidth={2} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, fontFamily: FONT, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fixture.venue}</div>
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '4px 9px', fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
          Map <MapPin size={9} strokeWidth={2.5} />
        </a>
      </div>

      {/* ── 7-Day Weather Forecast ── */}
      <div style={{ margin: '12px 16px 16px', background: 'rgba(0,0,0,.22)', borderRadius: 16, padding: '12px 12px 10px', backdropFilter: 'blur(4px)' }}>
        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>🌤️</span>
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: 1 }}>7-Day Forecast</span>
          <span style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(255,255,255,.3)', marginLeft: 'auto' }}>
            {weather?.location?.name || (fixture.venue?.split(',')[0] || '')}
          </span>
        </div>

        {/* Loading skeleton */}
        {wLoad && !weather && (
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({length: 7}).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 72, borderRadius: 10, background: 'rgba(255,255,255,.08)', animation: 'pendingPulse 1.4s ease-in-out infinite', animationDelay: `${i*0.08}s` }} />
            ))}
          </div>
        )}

        {/* Forecast row */}
        {days.length > 0 && (
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
                  flexShrink: 0,
                  flex: '1 0 0',
                  minWidth: 44,
                  textAlign: 'center',
                  background: isMatch
                    ? 'linear-gradient(160deg, rgba(251,191,36,.22) 0%, rgba(255,255,255,.18) 100%)'
                    : 'rgba(255,255,255,.07)',
                  border: isMatch
                    ? '1.5px solid rgba(251,191,36,.6)'
                    : '1px solid rgba(255,255,255,.08)',
                  borderRadius: 12,
                  padding: isMatch ? '5px 4px 6px' : '7px 4px 6px',
                  boxShadow: isMatch ? '0 0 14px rgba(251,191,36,.2)' : 'none',
                }}>
                  {/* MATCH badge — inside card so it's never clipped */}
                  {isMatch && (
                    <div style={{ background: '#fbbf24', borderRadius: 6, padding: '2px 0', marginBottom: 4, fontFamily: FONT, fontSize: 7, fontWeight: 900, color: '#1e1b4b', letterSpacing: 0.5 }}>
                      MATCH
                    </div>
                  )}
                  <div style={{ fontFamily: FONT, fontSize: 8, fontWeight: 800, color: isMatch ? 'rgba(251,191,36,.9)' : 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{dayLabel}</div>
                  <div style={{ fontSize: 20, lineHeight: 1, margin: '4px 0 2px' }}>{wmo.icon}</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 900, color: '#fff' }}>{maxT}°</div>
                  <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,.38)' }}>{minT}°</div>
                  {rain > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, marginTop: 3 }}>
                      <span style={{ fontSize: 7 }}>💧</span>
                      <span style={{ fontFamily: FONT, fontSize: 8, fontWeight: 700, color: '#93c5fd' }}>{rain}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Wind note on match day */}
        {days.length > 0 && matchYMD && (() => {
          const mi = days.indexOf(matchYMD)
          if (mi < 0) return null
          const wind = Math.round(weather.daily.windspeed_10m_max[mi] || 0)
          const rain = weather.daily.precipitation_probability_max[mi] || 0
          const wmo  = getWmo(weather.daily.weathercode[mi])
          return (
            <div style={{ marginTop: 10, padding: '7px 10px', background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{wmo.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: 'rgba(251,191,36,.9)' }}>Match Day — {wmo.label}</div>
                <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 1 }}>
                  Wind {wind} km/h · {rain > 0 ? `${rain}% chance of rain` : 'No rain expected'} · {Math.round(weather.daily.temperature_2m_max[mi])}°C high
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </motion.div>
  )
}

// ── Season Snapshot ────────────────────────────────────────
function SeasonSnapshot() {
  const nav = useNavigate()
  const [row, setRow] = useState(null)

  useEffect(() => {
    fetch('/api/league-table')
      .then(r => r.json())
      .then(d => {
        const found = (d.rows || []).find(r =>
          r.team?.toLowerCase().includes('tamil') ||
          r.team?.toLowerCase().includes('dtu') ||
          r.team?.toLowerCase().includes('united')
        )
        setRow(found || null)
      })
      .catch(() => {})
  }, [])

  const stats = row
    ? [
        { label: 'Played',  value: row.p   ?? '—', color: '#2563eb', bg: '#eff6ff' },
        { label: 'Won',     value: row.w   ?? '—', color: '#15803d', bg: '#edfaf3' },
        { label: 'Lost',    value: row.l   ?? '—', color: '#be123c', bg: '#fff1f2' },
        { label: 'Points',  value: row.pts ?? '—', color: '#b45309', bg: '#fffbeb' },
        { label: 'NRR',     value: row.nrr ?? '—', color: '#6d28d9', bg: '#f5f3ff' },
        { label: 'Position',value: row.pos  ? `#${row.pos}` : '—', color: '#0891b2', bg: '#ecfeff' },
      ]
    : [
        { label: 'Played',  value: '5',    color: '#2563eb', bg: '#eff6ff' },
        { label: 'Won',     value: '0',    color: '#15803d', bg: '#edfaf3' },
        { label: 'Lost',    value: '5',    color: '#be123c', bg: '#fff1f2' },
        { label: 'Points',  value: '33',   color: '#b45309', bg: '#fffbeb' },
        { label: 'NRR',     value: '-2.85',color: '#6d28d9', bg: '#f5f3ff' },
        { label: 'Position',value: '#8',   color: '#0891b2', bg: '#ecfeff' },
      ]

  return (
    <motion.div variants={staggerItem} style={{ marginTop: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg, #1a5c38, #22744a)', borderRadius: 99 }} />
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: C.dark }}>2026 Season</span>
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray3, fontWeight: 500 }}>BTCL</span>
        </div>
        <button onClick={() => nav('/league')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.green, display: 'flex', alignItems: 'center', gap: 3 }}>
          Full table <ChevronRight size={12} />
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {stats.map(({ label, value, color, bg }) => (
          <div key={label} style={{
            background: bg, borderRadius: 18,
            padding: '18px 10px 14px', textAlign: 'center',
            border: `1.5px solid ${color}20`,
            boxShadow: `0 4px 16px ${color}12`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: -10, right: -10, width: 44, height: 44, borderRadius: '50%', background: `${color}10`, pointerEvents: 'none' }} />
            <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, color: `${color}99`, marginTop: 7, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Top Performers ─────────────────────────────────────────
function TopPerformers() {
  const nav = useNavigate()
  const [topBat, setTopBat]   = useState(null)
  const [topBowl, setTopBowl] = useState(null)
  const [squad, setSquad]     = useState([])

  useEffect(() => {
    // Fetch stats + squad photos in parallel
    Promise.all([
      fetch('/api/player-stats').then(r => r.json()).catch(() => ({})),
      fetch('/api/players').then(r => r.json()).catch(() => ({})),
    ]).then(([stats, sq]) => {
      const bat  = (stats.batting  || []).sort((a, b) => (b.runs    || 0) - (a.runs    || 0))[0]
      const bowl = (stats.bowling  || []).sort((a, b) => (b.wickets || 0) - (a.wickets || 0))[0]
      setTopBat(bat || null)
      setTopBowl(bowl || null)
      setSquad(sq.players || [])
    })
  }, [])

  if (!topBat && !topBowl) return null

  // Match stat name to BTCL squad player for photo
  function findPhoto(statName) {
    if (!statName || !squad.length) return null
    const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const sn = norm(statName)
    const hit = squad.find(p => norm(p.name) === sn) ||
      squad.find(p => { const parts = sn.split(' ').filter(w => w.length > 2); return parts.length && parts.every(w => norm(p.name).includes(w)) })
    return hit ? { url: hit.photoUrl, pos: hit.photoPos || 'center 35%' } : null
  }

  function initials(name = '') {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  }

  const performers = [
    topBat  && { name: topBat.name,   stat: topBat.runs,     label: 'Runs',    emoji: '🏏', bg: 'linear-gradient(145deg,#0a2e17,#1a5c38 60%,#22744a)', glow: 'rgba(26,92,56,.55)',  bar: '#4ade80' },
    topBowl && { name: topBowl.name,  stat: topBowl.wickets, label: 'Wickets', emoji: '🎯', bg: 'linear-gradient(145deg,#2d0814,#be123c 60%,#f43f5e)', glow: 'rgba(190,18,60,.5)',  bar: '#fda4af' },
  ].filter(Boolean)

  return (
    <motion.div variants={staggerItem} style={{ marginTop: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg,#f59e0b,#b45309)', borderRadius: 99 }} />
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: C.dark }}>Top Performers</span>
          <span style={{ fontSize: 14 }}>⭐</span>
        </div>
        <button onClick={() => nav('/stats')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.green, display: 'flex', alignItems: 'center', gap: 3 }}>
          Full stats <ChevronRight size={13} />
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {performers.map(({ name, stat, label, emoji, bg, glow, bar }, idx) => {
          const photo = findPhoto(name)
          const ini   = initials(name)
          const firstName = name.split(' ')[0]

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 28, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.13, duration: 0.6, ease: [0.16,1,0.3,1] }}
              onClick={() => nav('/stats')}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -4, transition: { duration: 0.22 } }}
              style={{
                background: bg,
                borderRadius: 24, overflow: 'hidden',
                cursor: 'pointer', position: 'relative',
                boxShadow: `0 14px 40px ${glow}, 0 0 0 1px rgba(255,255,255,.08)`,
              }}
            >
              {/* Animated background orbs */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.08, 0.25] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.15)', pointerEvents: 'none' }}
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.05, 0.15] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }}
              />

              {/* Coloured shimmer bar at top */}
              <div style={{ height: 3, background: `linear-gradient(90deg, transparent 0%, ${bar} 50%, transparent 100%)` }} />

              {/* Card content — centred column */}
              <div style={{ padding: '20px 14px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>

                {/* Emoji badge top-left absolute */}
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  width: 30, height: 30, borderRadius: 9,
                  background: 'rgba(255,255,255,.13)',
                  border: '1px solid rgba(255,255,255,.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                  {emoji}
                </div>

                {/* Large centred photo */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25 + idx * 0.13, duration: 0.5, ease: [0.16,1,0.3,1] }}
                  style={{
                    width: 80, height: 80, borderRadius: '50%',
                    overflow: 'hidden',
                    border: `3px solid ${bar}`,
                    boxShadow: `0 0 0 4px rgba(255,255,255,.1), 0 8px 24px rgba(0,0,0,.4)`,
                    background: 'rgba(255,255,255,.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  {photo?.url
                    ? <img src={photo.url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photo.pos }} />
                    : <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 22, color: '#fff' }}>{ini}</span>
                  }
                </motion.div>

                {/* Name */}
                <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>{firstName}</div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2, marginBottom: 16 }}>{name.split(' ').slice(1).join(' ')}</div>

                {/* Divider */}
                <div style={{ width: '60%', height: 1, background: 'rgba(255,255,255,.1)', marginBottom: 14 }} />

                {/* Stat */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.13, duration: 0.45, ease: [0.16,1,0.3,1] }}
                  style={{ fontFamily: FONT, fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums' }}
                >
                  {stat}
                </motion.div>
                <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: bar, marginTop: 5, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  {label}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function ResultsTeaser() {
  const nav = useNavigate()
  return (
    <motion.div
      variants={staggerItem}
      onClick={() => nav('/results')}
      style={{
        marginTop: 16, cursor: 'pointer',
        background: `linear-gradient(135deg, ${C.greenDark} 0%, #163d28 100%)`,
        borderRadius: 16, padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: `0 4px 16px ${C.shadowMd}`,
        border: `1px solid rgba(255,255,255,.08)`,
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'rgba(255,255,255,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <ClipboardList size={22} color={C.gold} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.white }}>
          Last 10 Results
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
          BTCL Premier League 2026 · with scorecards
        </div>
      </div>
      <ChevronRight size={18} color={C.gold} strokeWidth={2.5} />
    </motion.div>
  )
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtShort(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const ROLE_STYLE = {
  Batsman:         { bg: '#eff6ff', color: '#2563eb' },
  Bowler:          { bg: '#fef2f2', color: '#dc2626' },
  'All-Rounder':   { bg: '#f5f3ff', color: '#7c3aed' },
  'Wicket-Keeper': { bg: '#fffbeb', color: '#d97706' },
  Player:          { bg: '#f3f4f6', color: '#6b7280' },
}

function roleShort(pos) {
  if (pos === 'All-Rounder')   return 'AR'
  if (pos === 'Wicket-Keeper') return 'WK'
  if (pos === 'Batsman')       return 'BAT'
  if (pos === 'Bowler')        return 'BOWL'
  return 'PLR'
}

// ── Custom easing — stronger than built-in easings ─────────────────────────
const EASE_OUT  = [0.23, 1, 0.32, 1]   // snappy ease-out, feels instant
const EASE_SPRING = { type: 'spring', duration: 0.4, bounce: 0.18 }

// ── Shared animation variants ──────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
}

const staggerList = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
}

const staggerItem = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE_OUT } },
}

const chipItem = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: EASE_SPRING },
}

export default function Home() {
  const nav = useNavigate()
  const [match, setMatch] = useState(null)
  const [nextFixture, setNextFixture] = useState(null)   // auto-fetched from BTCL
  const [allMatches, setAllMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [responses, setResponses] = useState([])
  const [teamSelection, setTeamSelection] = useState([])
  const [loading, setLoading] = useState(true)
  const [newResponseIds, setNewResponseIds] = useState(new Set())
  const prevCounts = useRef({ available: 0, unavailable: 0, pending: 0 })
  const matchIdRef = useRef(null)

  useEffect(() => { load() }, [])

  // ── Real-time subscription (Direction B) ──────────────
  useEffect(() => {
    if (!matchIdRef.current) return
    const channel = supabase
      .channel('home-availability-live')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'availability',
        filter: `match_id=eq.${matchIdRef.current}`,
      }, (payload) => {
        setResponses(prev => {
          const next = prev.filter(r => r.player_id !== payload.new?.player_id)
          if (payload.eventType !== 'DELETE') next.push(payload.new)
          // Mark newly arrived player id for chip spring-in
          if (payload.eventType === 'INSERT' && payload.new?.player_id) {
            setNewResponseIds(ids => new Set([...ids, payload.new.player_id]))
            setTimeout(() => {
              setNewResponseIds(ids => { const s = new Set(ids); s.delete(payload.new.player_id); return s })
            }, 1200)
          }
          return next
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [match?.id])

  async function load() {
    setLoading(true)
    const [{ data: ms }, { data: ps }] = await Promise.all([
      supabase.from('matches').select('*').order('date', { ascending: false }),
      supabase.from('players').select('*').order('name'),
    ])
    const matches = ms || []
    const active = matches.find((m) => m.is_active) || null
    setAllMatches(matches)
    setMatch(active)
    matchIdRef.current = active?.id ?? null

    // Also fetch next fixture from BTCL for automatic display
    try {
      const r = await fetch('/api/fixtures')
      const d = await r.json()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const next = (d.fixtures || []).filter(f => {
        if (!isOursFix(f.team1) && !isOursFix(f.team2)) return false
        const dt = parseFixDate(f.date); return dt && dt >= today
      }).sort((a, b) => (parseFixDate(a.date) || 0) - (parseFixDate(b.date) || 0))[0] || null
      setNextFixture(next)
    } catch { /* silent */ }
    setPlayers(ps || [])
    if (active) {
      const [{ data: rs }, { data: ts }] = await Promise.all([
        supabase.from('availability').select('*').eq('match_id', active.id),
        active.is_team_published
          ? supabase
              .from('team_selections')
              .select('*')
              .eq('match_id', active.id)
              .order('batting_order', { ascending: true })
          : Promise.resolve({ data: [] }),
      ])
      setResponses(rs || [])
      setTeamSelection(ts || [])
    }
    setLoading(false)
  }

  const countAvailable   = responses.filter((r) => r.available).length
  const countUnavailable = responses.filter((r) => !r.available).length
  const countPending     = players.length - responses.length

  // Detect count changes for flip animation
  const availChanged   = !loading && countAvailable   !== prevCounts.current.available
  const unavailChanged = !loading && countUnavailable !== prevCounts.current.unavailable
  const pendingChanged = !loading && countPending     !== prevCounts.current.pending
  useEffect(() => {
    if (!loading) prevCounts.current = { available: countAvailable, unavailable: countUnavailable, pending: countPending }
  })

  function statusOf(playerId) {
    const r = responses.find((r) => r.player_id === playerId)
    if (!r) return 'pending'
    return r.available ? 'available' : 'unavailable'
  }

  const chipColors = {
    available:   { bg: C.okBg,  border: '#bbf7d0', dot: C.ok },
    unavailable: { bg: C.redBg, border: '#fecaca', dot: C.red },
    pending:     { bg: C.gray1, border: C.gray2,   dot: C.gray3 },
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* Hero — scroll-driven parallax container (Direction C) */}
      <div
        className="hero-parallax"
        style={{
          background: `radial-gradient(ellipse at 70% 0%, ${C.greenLight}55 0%, transparent 60%), linear-gradient(160deg, ${C.greenDark} 0%, #163d28 100%)`,
          padding: '36px 20px 60px',
          position: 'relative',
        }}
      >
        {/* Subtle noise texture for depth — overflow hidden on this element only, not parent */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 0 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.6 }} />
        </div>
        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height={14} width={160} style={{ background: 'rgba(255,255,255,.2)' }} />
              <Skeleton height={30} width={280} style={{ background: 'rgba(255,255,255,.2)' }} />
              <Skeleton height={14} width={220} style={{ background: 'rgba(255,255,255,.15)' }} />
            </div>
          ) : (() => {
            // Use Supabase active match OR auto-fetched BTCL fixture
            const fx = nextFixture
            const displayOpponent = match?.opponent || (fx ? (isOursFix(fx.team1) ? shortenFix(fx.team2) : shortenFix(fx.team1)) : null)
            const displayDate     = match?.date    || (fx ? (() => { const p = (fx.date||'').match(/(\d{1,2})\s+(\w+)\s+(\d{4})/); return p ? new Date(`${p[2]} ${p[1]}, ${p[3]}`).toISOString().slice(0,10) : '' })() : '')
            const displayTime     = match?.time    || fx?.time || ''
            const displayVenue    = match?.venue   || fx?.venue || ''
            const displayAddress  = match?.address || fx?.address || ''
            const displayFormat   = match?.format  || 'ODI'
            const displayDeadline = match?.deadline || ''
            const displayNotes    = match?.notes   || ''
            if (!displayOpponent) return <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 15 }}>No upcoming matches found.</div>
            return (
              <motion.div variants={staggerList} initial="hidden" animate="visible">
                <motion.div variants={fadeUp} style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10, opacity: 0.9 }}>
                  🏏 {displayFormat} · {match ? 'Active Match' : 'Next Match'}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8, verticalAlign: 'middle' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 0 2px rgba(74,222,128,0.3)', animation: 'pendingPulse 1.8s ease-in-out infinite' }} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>live</span>
                  </span>
                </motion.div>
                <motion.h1 variants={fadeUp} style={{ color: C.white, fontSize: 30, fontWeight: 900, margin: 0, lineHeight: 1.15, letterSpacing: -0.5, textWrap: 'balance' }}>
                  Tamil United CC vs {displayOpponent}
                </motion.h1>
                <motion.div variants={fadeUp} style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                  <span>📅 {fmtDate(displayDate)}</span>
                  {displayTime && <span>🕐 {displayTime}</span>}
                </motion.div>
                {displayVenue && (
                  <motion.div variants={fadeUp} style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, marginTop: 4 }}>
                    📍 {displayVenue}{displayAddress ? `, ${displayAddress}` : ''}
                  </motion.div>
                )}
                {displayNotes && (
                  <motion.div variants={fadeUp} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '10px 14px', marginTop: 14, color: 'rgba(255,255,255,.9)', fontSize: 13, lineHeight: 1.5 }}>
                    📋 {displayNotes}
                  </motion.div>
                )}
                {displayDeadline && (
                  <motion.div variants={fadeUp} style={{ color: C.gold, fontSize: 12, fontWeight: 600, marginTop: 12 }}>
                    ⏰ Respond by: {displayDeadline}
                  </motion.div>
                )}
                <motion.div variants={fadeUp} style={{ marginTop: 16 }}>
                  <button onClick={() => nav('/league')} style={{ background: 'rgba(255,255,255,.15)', color: C.white, border: '1.5px solid rgba(255,255,255,.35)', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
                    🏆 BTCL League →
                  </button>
                </motion.div>
              </motion.div>
            )
          })()}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '0 16px 40px', width: '100%' }}>

        {/* ── Player Dashboard ── */}
        <div style={{ marginTop: 16 }}>
          <PlayerDashboard />
        </div>

        {/* ── CTA Button ── */}
        <motion.button
          onClick={() => nav('/availability')}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #1a5c38, #22744a)',
            color: '#fff', border: 'none', borderRadius: 16,
            padding: '16px 20px', fontFamily: FONT, fontSize: 15, fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,92,56,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 4,
          }}
        >
          🏏 Submit My Availability
        </motion.button>

        {/* ── Availability Cards Heading ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 2 }}>
          <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,#22c55e,#15803d)', borderRadius: 99 }} />
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: C.dark }}>Next Match Availability</span>
          <span style={{ fontSize: 13 }}>📋</span>
        </div>

        {/* ── Availability Cards ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}
        >
          {[
            { label: 'Available',   count: countAvailable,   changed: availChanged,
              grad: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
              shadow: '0 6px 20px rgba(21,128,61,.3)', icon: '✅' },
            { label: 'Unavailable', count: countUnavailable, changed: unavailChanged,
              grad: 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
              shadow: '0 6px 20px rgba(190,18,60,.28)', icon: '❌' },
            { label: 'Pending',     count: countPending,     changed: pendingChanged,
              grad: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)',
              shadow: '0 6px 20px rgba(71,85,105,.22)', icon: '⏳' },
          ].map(({ label, count, changed, grad, shadow, icon }) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.92 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
              }}
            >
              <div style={{
                background: grad, borderRadius: 18,
                padding: '16px 10px 14px', textAlign: 'center',
                boxShadow: shadow, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -14, right: -14, width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                    <Skeleton height={28} width={36} style={{ background: 'rgba(255,255,255,.3)' }} />
                    <Skeleton height={9} width={48} style={{ background: 'rgba(255,255,255,.2)' }} />
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, marginBottom: 5 }}>{icon}</div>
                    <motion.div
                      key={count}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className={`count-flip${changed ? ' changed' : ''}`}
                      style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
                    >{count}</motion.div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.75)', fontWeight: 700, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Season Snapshot + Top Performers ── */}
        <motion.div variants={staggerList} initial="hidden" animate="visible">
          <NextFixtureCard />
          <SeasonSnapshot />
          <TopPerformers />
        </motion.div>

        {/* ── Selected XI ── */}
        {!loading && match?.is_team_published && teamSelection.length > 0 && (
          <SelectedXICard match={match} teamSelection={teamSelection} />
        )}

        {/* Player chips */}
        <Card style={{ marginTop: 16, overflow: 'hidden', padding: 0 }}>
          <div style={{
            padding: '14px 16px 12px',
            background: `linear-gradient(135deg, ${C.greenDark}08, ${C.greenLight}10)`,
            borderBottom: `1px solid ${C.gray2}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg, #1a5c38, #22744a)', borderRadius: 99 }} />
              <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: C.dark }}>Squad</span>
              {!loading && (
                <span style={{ background: C.greenBg, color: C.green, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                  {players.length} players
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 600, color: C.gray3 }}>
              {!loading && <>
                <span style={{ color: '#15803d' }}>✓ {countAvailable}</span>
                <span style={{ color: C.red }}>✕ {countUnavailable}</span>
                <span style={{ color: C.gray4 }}>? {countPending}</span>
              </>}
            </div>
          </div>
          <div style={{ padding: '14px 16px 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} height={34} width={90 + (i % 3) * 20} borderRadius={99} />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div style={{ color: C.gray3, fontSize: 14, textAlign: 'center', padding: '12px 0' }}>
              No players yet.
            </div>
          ) : (
            <motion.div
              variants={staggerList}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
            >
              {players.map((p) => {
                const status = statusOf(p.id)
                const s = chipColors[status]
                const isNew = newResponseIds.has(p.id)
                return (
                  <motion.div
                    key={p.id}
                    variants={chipItem}
                    animate={isNew ? { scale: [1, 1.12, 1], transition: { duration: 0.45, ease: [0.23,1,0.32,1] } } : {}}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: s.bg,
                      border: `1px solid ${isNew ? s.dot : s.border}`,
                      borderRadius: 99,
                      padding: '3px 10px 3px 4px',
                      fontSize: 13, fontWeight: 500, color: C.gray5,
                      minHeight: 34,
                      boxShadow: isNew ? `0 0 0 3px ${s.dot}40` : 'none',
                      transition: 'box-shadow 400ms ease, border-color 400ms ease',
                    }}
                  >
                    <Avatar name={p.name} size={26} />
                    <span>{p.name.split(' ')[0]}</span>
                    <span
                      className={status === 'pending' ? 'chip-pending-dot' : ''}
                      style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }}
                    />
                  </motion.div>
                )
              })}
            </motion.div>
          )}
          </div>
        </Card>

        {/* Greeting / message from captain */}
        {!loading && match?.home_message && (
          <div
            style={{
              marginTop: 16,
              background: C.white,
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,.06)',
              borderLeft: `4px solid ${C.green}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
              📣 Message from the Captain
            </div>
            <div style={{ fontSize: 14, color: C.gray5, lineHeight: 1.65, fontStyle: 'italic' }}>
              "{match.home_message}"
            </div>
          </div>
        )}

        {/* ── Next Match Details card (auto from BTCL or Supabase) ── */}
        {!loading && (() => {
          const fx = nextFixture
          const opp      = match?.opponent || (fx ? (isOursFix(fx.team1) ? shortenFix(fx.team2) : shortenFix(fx.team1)) : null)
          const rawDate  = match?.date || (fx ? (() => { const p = (fx.date||'').match(/(\d{1,2})\s+(\w+)\s+(\d{4})/); return p ? new Date(`${p[2]} ${p[1]}, ${p[3]}`).toISOString().slice(0,10) : '' })() : '')
          const time     = match?.time    || fx?.time    || ''
          const venue    = match?.venue   || fx?.venue   || ''
          const address  = match?.address || fx?.address || ''
          const format   = match?.format  || 'ODI'
          const deadline = match?.deadline || ''
          const notes    = match?.notes   || ''
          if (!opp) return null
          const rows = [
            ['Date',     fmtDate(rawDate)],
            ['Time',     time],
            ['Venue',    venue],
            ['Address',  address],
            ['Opponent', opp],
            ['Format',   format],
            ['Notes',    notes],
            ['Deadline', deadline],
          ].filter(([, v]) => v)
          return (
            <div style={{ marginTop: 14, background: `linear-gradient(145deg, ${C.greenDark} 0%, #163d28 100%)`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(5,20,10,.35), 0 0 0 1px rgba(255,255,255,.06)' }}>
              {/* Gold top bar */}
              <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,#e9a020,#f59e0b,transparent)' }}/>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', display: 'inline-block' }}/>
                  <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.6)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {match ? 'Active Match' : 'Next Match'} · Match Details
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {rows.map(([k, v], i) => (
                    <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                      <div style={{ width: 72, flexShrink: 0, fontFamily: FONT, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: .5, paddingTop: 1 }}>{k}</div>
                      <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.45 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── League Table ── */}
        <LeagueTable />

        {/* ── Results teaser ── */}
        <ResultsTeaser />

        {/* ── Upcoming & Recent Matches ── */}
        {!loading && allMatches.length > 0 && (
          <div style={{ marginTop: 24 }} className="scroll-reveal">
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray5, marginBottom: 12 }}>
              Upcoming & Recent Matches
            </div>
            <motion.div
              variants={staggerList}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {allMatches.map((m) => (
                <motion.div
                  key={m.id}
                  variants={staggerItem}
                  style={{
                    background: C.white,
                    borderRadius: 12,
                    padding: '14px 16px',
                    boxShadow: '0 1px 6px rgba(0,0,0,.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: m.is_active ? `2px solid ${C.green}` : `1px solid ${C.gray2}`,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: m.is_active ? C.green : C.gray1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ color: m.is_active ? C.white : C.gray4, fontSize: 11, fontWeight: 800, lineHeight: 1 }}>
                      {m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric' }) : '—'}
                    </div>
                    <div style={{ color: m.is_active ? 'rgba(255,255,255,.75)' : C.gray3, fontSize: 10, lineHeight: 1.2 }}>
                      {m.date ? new Date(m.date).toLocaleDateString('en-GB', { month: 'short' }) : ''}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                      vs {m.opponent || 'TBC'}
                    </div>
                    <div style={{ fontSize: 12, color: C.gray3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.venue || 'Venue TBC'}{m.time ? ` · ${m.time}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {m.is_active && (
                      <Badge variant="available" style={{ fontSize: 11 }}>Active</Badge>
                    )}
                    <span style={{ fontSize: 11, color: C.gray3 }}>{m.format || 'T20'}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  )
}

function SelectedXICard({ match, teamSelection }) {
  const xi       = teamSelection.filter((s) => !s.is_reserve)
  const reserves = teamSelection.filter((s) =>  s.is_reserve)
  const lastUpdated = teamSelection[0]?.created_at

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 14,
        boxShadow: '0 2px 14px rgba(0,0,0,.07)',
        overflow: 'hidden',
        marginTop: 16,
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
          padding: '16px 20px',
        }}
      >
        <div style={{ color: C.gold, fontWeight: 800, fontSize: 16 }}>
          🏏 Selected XI — vs {match.opponent || 'TBC'}
        </div>
        <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, marginTop: 3 }}>
          {fmtDate(match.date)}{match.venue ? ` · ${match.venue}` : ''}
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Published badge */}
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              background: C.okBg,
              color: C.ok,
              padding: '3px 12px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✓ Published by captain
          </span>
        </div>

        {/* XI list */}
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {xi.map((s, i) => {
            const rs = ROLE_STYLE[s.position] || ROLE_STYLE.Player
            return (
              <motion.div
                key={s.player_id}
                variants={staggerItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 0',
                  borderBottom: i < xi.length - 1 ? `1px solid ${C.gray1}` : 'none',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: C.green,
                    color: C.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: C.dark, minWidth: 0 }}>
                  {s.player_name}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                  <span
                    style={{
                      background: rs.bg,
                      color: rs.color,
                      padding: '2px 7px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {roleShort(s.position)}
                  </span>
                  {s.is_captain && (
                    <span
                      style={{
                        background: C.greenBg,
                        color: C.greenDark,
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      C
                    </span>
                  )}
                  {s.is_vice_captain && (
                    <span
                      style={{
                        background: C.greenBg,
                        color: C.green,
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      VC
                    </span>
                  )}
                  {s.is_wicketkeeper && (
                    <span
                      style={{
                        background: '#fffbeb',
                        color: '#d97706',
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      WK
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Reserves */}
        {reserves.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.gray3,
                margin: '12px 0 8px',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Reserves
            </div>
            {reserves.map((s) => (
              <div
                key={s.player_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: `1px solid ${C.gray1}`,
                  opacity: 0.75,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: C.gray3,
                    color: C.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  R
                </div>
                <div style={{ flex: 1, fontWeight: 500, fontSize: 14, color: C.gray4 }}>
                  {s.player_name}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Last updated */}
        {lastUpdated && (
          <div style={{ fontSize: 11, color: C.gray3, marginTop: 12, textAlign: 'right' }}>
            Last updated:{' '}
            {new Date(lastUpdated).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  )
}
