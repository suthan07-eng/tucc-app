import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, ArrowLeft, ExternalLink, RotateCw, Home, Plane, Calendar, Zap } from 'lucide-react'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'

const EASE = [0.16, 1, 0.3, 1]
const OUR_NAMES = ['Tamil United', 'TUCC', 'Dollishill Tamil United', 'DTU']
const isOurs = (name = '') => OUR_NAMES.some(t => name.toLowerCase().includes(t.toLowerCase()))
const shorten = n =>
  n.replace('Dollishill Tamil United CC - Knights', 'Tamil United CC')
   .replace('Sports & Social Club', '').replace('- 1st XI', '')
   .replace(/\s*-\s*[AB]$/, '').trim()

function parseDate(str) {
  if (!str) return null
  const m = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (!m) return null
  return new Date(`${m[2]} ${m[1]}, ${m[3]}`)
}

function useCountdown(targetDate) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    if (!targetDate) return
    const tick = () => { const d = targetDate - Date.now(); setDiff(d > 0 ? d : 0) }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  if (diff === null || diff <= 0) return null
  const totalSec = Math.floor(diff / 1000)
  return {
    days:  Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    mins:  Math.floor((totalSec % 3600) / 60),
    secs:  totalSec % 60,
  }
}

// ── Team Logo ─────────────────────────────────────────────────
function TeamLogo({ logo, name, size = 60 }) {
  const [error, setError] = useState(false)
  const initials = (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const PALETTE = ['#1a5c38','#7c3aed','#0369a1','#b45309','#0891b2','#be185d','#15803d','#9d174d']
  let h = 0; for (const c of (name||'')) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]

  if (!logo || error) return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.24, flexShrink: 0,
      background: `linear-gradient(145deg, ${bg}dd, ${bg}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * 0.3),
      color: '#fff', boxShadow: `0 4px 16px ${bg}44`,
    }}>{initials}</div>
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.24, flexShrink: 0,
      background: '#fff', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 18px rgba(0,0,0,.12)',
      border: '2px solid rgba(255,255,255,.9)',
    }}>
      <img src={logo} alt={name} style={{ width: '88%', height: '88%', objectFit: 'contain' }}
        onError={() => setError(true)} />
    </div>
  )
}

// ── Countdown Unit ────────────────────────────────────────────
function CountUnit({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
      <div style={{
        background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 12, padding: '8px 12px', minWidth: 52, textAlign: 'center',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 5 }}>
        {label}
      </div>
    </div>
  )
}

// ── Next Match Hero Banner ────────────────────────────────────
function NextMatchBanner({ fixture, countdown }) {
  const isHome = isOurs(fixture.team1)
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        borderRadius: 28, overflow: 'hidden', marginBottom: 8,
        background: 'linear-gradient(145deg, #0a2a14 0%, #1a5c38 55%, #22744a 100%)',
        boxShadow: '0 20px 60px rgba(10,42,20,.6), 0 0 0 1px rgba(255,255,255,.07)',
        position: 'relative',
      }}
    >
      {/* Animated orbs */}
      <motion.div animate={{ scale: [1,1.3,1], opacity:[.2,.06,.2] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
        style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.12)', pointerEvents:'none' }} />
      <motion.div animate={{ scale:[1,1.2,1], opacity:[.15,.04,.15] }} transition={{ duration:8, repeat:Infinity, ease:'easeInOut', delay:2 }}
        style={{ position:'absolute', bottom:-40, left:-40, width:140, height:140, borderRadius:'50%', background:'rgba(233,160,32,.15)', pointerEvents:'none' }} />

      {/* Gold shimmer bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #e9a020, #f59e0b, transparent)' }} />

      <div style={{ padding: '18px 20px 22px', position: 'relative', zIndex: 1 }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <motion.div animate={{ opacity:[1,.3,1] }} transition={{ duration:2, repeat:Infinity }}
              style={{ width:8, height:8, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 10px #4ade80' }} />
            <span style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'rgba(255,255,255,.7)', letterSpacing:1.2, textTransform:'uppercase' }}>Next Match</span>
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:5,
            background: isHome ? 'rgba(74,222,128,.15)' : 'rgba(251,191,36,.15)',
            border: `1px solid ${isHome ? 'rgba(74,222,128,.3)' : 'rgba(251,191,36,.3)'}`,
            borderRadius:20, padding:'4px 12px',
          }}>
            {isHome ? <Home size={11} color="#4ade80" strokeWidth={2.5}/> : <Plane size={11} color="#fbbf24" strokeWidth={2.5}/>}
            <span style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color: isHome ? '#4ade80' : '#fbbf24' }}>{isHome ? 'Home' : 'Away'}</span>
          </div>
        </div>

        {/* Teams */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:18 }}>
          {/* Team 1 */}
          <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.15, duration:.5, ease:EASE }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <TeamLogo logo={fixture.logo1} name={fixture.team1} size={72} />
            <div style={{ fontFamily:FONT, fontSize:13, fontWeight:800, color:'#fff', textAlign:'center', lineHeight:1.25 }}>
              {shorten(fixture.team1)}
            </div>
          </motion.div>

          {/* VS */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <div style={{ fontFamily:FONT, fontSize:11, fontWeight:900, color:'rgba(255,255,255,.3)', letterSpacing:3 }}>VS</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:'5px 11px' }}>
              <Clock size={11} color="rgba(255,255,255,.7)" strokeWidth={2}/>
              <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:'#fff' }}>{fixture.time}</span>
            </div>
          </div>

          {/* Team 2 */}
          <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.15, duration:.5, ease:EASE }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <TeamLogo logo={fixture.logo2} name={fixture.team2} size={72} />
            <div style={{ fontFamily:FONT, fontSize:13, fontWeight:800, color:'#fff', textAlign:'center', lineHeight:1.25 }}>
              {shorten(fixture.team2)}
            </div>
          </motion.div>
        </div>

        {/* Date pill */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:20, padding:'6px 14px' }}>
            <Calendar size={12} color="rgba(255,255,255,.6)" strokeWidth={2}/>
            <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:'rgba(255,255,255,.8)' }}>{fixture.date}</span>
          </div>
        </div>

        {/* Countdown */}
        {countdown && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }}
            style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', gap:8, marginBottom:18 }}>
            <CountUnit value={countdown.days}  label="Days"/>
            <div style={{ width:2, height:52, background:'rgba(255,255,255,.1)', borderRadius:2, marginTop:0 }}/>
            <CountUnit value={countdown.hours} label="Hrs"/>
            <div style={{ width:2, height:52, background:'rgba(255,255,255,.1)', borderRadius:2 }}/>
            <CountUnit value={countdown.mins}  label="Min"/>
            <div style={{ width:2, height:52, background:'rgba(255,255,255,.1)', borderRadius:2 }}/>
            <CountUnit value={countdown.secs}  label="Sec"/>
          </motion.div>
        )}

        {/* Venue */}
        <div style={{ background:'rgba(0,0,0,.25)', borderRadius:16, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <MapPin size={14} color="#4ade80" strokeWidth={2}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:FONT, fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:.8, marginBottom:2 }}>Venue</div>
            <div style={{ fontFamily:FONT, fontSize:12, fontWeight:600, color:'rgba(255,255,255,.8)', lineHeight:1.4 }}>{fixture.venue}</div>
          </div>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, background:'rgba(74,222,128,.15)', border:'1px solid rgba(74,222,128,.3)', borderRadius:10, padding:'7px 12px', fontFamily:FONT, fontSize:11, fontWeight:800, color:'#4ade80', textDecoration:'none' }}>
            Map <ExternalLink size={10} strokeWidth={2.5}/>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// ── Fixture Card ──────────────────────────────────────────────
function FixtureCard({ fixture, index }) {
  const tucc1 = isOurs(fixture.team1)
  const tucc2 = isOurs(fixture.team2)
  const isTucc = tucc1 || tucc2
  const isHome = tucc1
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`

  return (
    <motion.div
      initial={{ opacity:0, y:20, scale:.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ duration:.5, ease:EASE, delay: index * 0.06 }}
      whileHover={{ y:-2, transition:{ duration:.2 } }}
      style={{
        borderRadius:22, overflow:'hidden',
        background: isTucc ? '#fff' : '#fff',
        border: `1.5px solid ${isTucc ? 'rgba(26,92,56,.18)' : 'rgba(0,0,0,.07)'}`,
        boxShadow: isTucc
          ? '0 8px 32px rgba(26,92,56,.12), 0 2px 8px rgba(0,0,0,.04)'
          : '0 4px 20px rgba(0,0,0,.06)',
      }}
    >
      {/* Top accent stripe */}
      {isTucc && <div style={{ height:3, background:'linear-gradient(90deg, #1a5c38, #4ade80, #1a5c38)' }} />}

      {/* Header */}
      <div style={{
        padding:'11px 16px',
        background: isTucc
          ? 'linear-gradient(135deg, #0d3320 0%, #1a5c38 100%)'
          : 'linear-gradient(135deg, #1e2533 0%, #2d3748 100%)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-10, right:-10, width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:26, height:26, borderRadius:8, background:'rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Calendar size={12} color="rgba(255,255,255,.75)" strokeWidth={2}/>
          </div>
          <span style={{ fontFamily:FONT, fontSize:12, fontWeight:800, color:'#fff' }}>{fixture.date}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {isTucc && (
            <div style={{
              display:'flex', alignItems:'center', gap:5,
              background: isHome ? 'rgba(74,222,128,.18)' : 'rgba(251,191,36,.18)',
              border: `1px solid ${isHome ? 'rgba(74,222,128,.35)' : 'rgba(251,191,36,.35)'}`,
              borderRadius:8, padding:'3px 9px',
            }}>
              {isHome ? <Home size={10} color="#4ade80" strokeWidth={2.5}/> : <Plane size={10} color="#fbbf24" strokeWidth={2.5}/>}
              <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color: isHome ? '#4ade80' : '#fbbf24' }}>
                {isHome ? 'Home' : 'Away'}
              </span>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,.09)', borderRadius:7, padding:'3px 8px' }}>
            <Clock size={10} color="rgba(255,255,255,.6)" strokeWidth={2}/>
            <span style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:'rgba(255,255,255,.85)' }}>{fixture.time}</span>
          </div>
        </div>
      </div>

      {/* Teams row */}
      <div style={{ padding:'18px 16px 14px', display:'flex', alignItems:'center', gap:8 }}>
        {/* Team 1 */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:9 }}>
          <TeamLogo logo={fixture.logo1} name={fixture.team1} size={52} />
          <div style={{
            fontFamily:FONT, fontSize:12, lineHeight:1.3, textAlign:'center',
            fontWeight: tucc1 ? 800 : 600,
            color: tucc1 ? '#1a5c38' : '#1e293b',
          }}>
            {tucc1 && <span style={{ color:'#e9a020' }}>🏏 </span>}{shorten(fixture.team1)}
          </div>
        </div>

        {/* VS divider */}
        <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={{ width:1, height:20, background: isTucc ? 'rgba(26,92,56,.15)' : '#e2e8f0' }}/>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background: isTucc ? 'linear-gradient(135deg,#1a5c38,#22744a)' : '#f1f5f9',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: isTucc ? '0 3px 10px rgba(26,92,56,.3)' : 'none',
          }}>
            <span style={{ fontFamily:FONT, fontSize:9, fontWeight:900, color: isTucc ? '#fff' : '#94a3b8', letterSpacing:1.5 }}>VS</span>
          </div>
          <div style={{ width:1, height:20, background: isTucc ? 'rgba(26,92,56,.15)' : '#e2e8f0' }}/>
        </div>

        {/* Team 2 */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:9 }}>
          <TeamLogo logo={fixture.logo2} name={fixture.team2} size={52} />
          <div style={{
            fontFamily:FONT, fontSize:12, lineHeight:1.3, textAlign:'center',
            fontWeight: tucc2 ? 800 : 600,
            color: tucc2 ? '#1a5c38' : '#1e293b',
          }}>
            {tucc2 && <span style={{ color:'#e9a020' }}>🏏 </span>}{shorten(fixture.team2)}
          </div>
        </div>
      </div>

      {/* Venue row */}
      <div style={{ margin:'0 14px 14px', background: isTucc ? 'rgba(26,92,56,.05)' : '#f8fafc', borderRadius:12, padding:'9px 12px', display:'flex', alignItems:'center', gap:8 }}>
        <MapPin size={13} color={isTucc ? '#1a5c38' : '#94a3b8'} strokeWidth={2} style={{ flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0, fontFamily:FONT, fontSize:11, fontWeight:500, color: isTucc ? '#1a5c38' : '#64748b', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical' }}>
          {fixture.venue}
        </div>
        <a href={mapUrl} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink:0, display:'flex', alignItems:'center', gap:4, background: isTucc ? '#1a5c38' : '#334155', borderRadius:8, padding:'5px 10px', fontFamily:FONT, fontSize:10, fontWeight:800, color:'#fff', textDecoration:'none' }}>
          Map <ExternalLink size={9} strokeWidth={2.5}/>
        </a>
      </div>
    </motion.div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius:22, overflow:'hidden', border:'1.5px solid #e2e8f0', background:'#fff' }}>
      <div style={{ height:44, background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite linear' }}/>
      <div style={{ padding:'18px 16px', display:'flex', alignItems:'center', gap:10 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: i===1?0:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ width: i===1?34:52, height: i===1?34:52, borderRadius: i===1?'50%':12, background:'#e2e8f0' }}/>
            {i!==1 && <div style={{ height:11, width:'70%', borderRadius:6, background:'#e2e8f0' }}/>}
          </div>
        ))}
      </div>
      <div style={{ margin:'0 14px 14px', height:36, borderRadius:12, background:'#f1f5f9' }}/>
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
    const qs = bust ? `?t=${Date.now()}` : ''
    fetch(`/api/fixtures${qs}`).then(r => r.json()).then(fix => {
      setFixtures(fix.fixtures || [])
      setSource(fix.source)
      setLoading(false)
      setRefreshing(false)
    }).catch(() => { setError(true); setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { load() }, [])

  const today = new Date(); today.setHours(0,0,0,0)
  const tuccFixtures = fixtures.filter(f => isOurs(f.team1) || isOurs(f.team2))
  const nextTucc = tuccFixtures.find(f => { const d = parseDate(f.date); return d && d >= today })

  const countdownTarget = (() => {
    if (!nextTucc) return null
    const d = parseDate(nextTucc.date)
    if (!d) return null
    const [h, m] = (nextTucc.time || '13:00').split(':').map(Number)
    d.setHours(h, m, 0, 0)
    return d.getTime()
  })()
  const countdown = useCountdown(countdownTarget)
  const remaining = nextTucc ? fixtures.filter(f => f !== nextTucc) : fixtures

  const SEASON_TOTAL = 14
  const PLAYED_HOME  = 3
  const PLAYED_AWAY  = 2

  return (
    <div style={{ minHeight:'100dvh', background:'#f0f4f0', fontFamily:FONT, display:'flex', flexDirection:'column' }}>
      <Nav />

      {/* ── Hero Header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #071a0d 0%, #0d3320 40%, #1a5c38 100%)',
        padding:'24px 20px 36px', position:'relative', overflow:'hidden',
      }}>
        {/* Decorative elements */}
        <motion.div animate={{ rotate:[0,360] }} transition={{ duration:30, repeat:Infinity, ease:'linear' }}
          style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', border:'1px solid rgba(255,255,255,.04)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%', background:'rgba(233,160,32,.08)', pointerEvents:'none' }}/>

        <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', position:'relative' }}>
          <motion.button
            onClick={() => nav('/')}
            whileTap={{ scale:.95 }}
            style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,.4)', background:'none', border:'none', cursor:'pointer', fontFamily:FONT, fontSize:13, fontWeight:600, padding:0, marginBottom:22 }}
          >
            <ArrowLeft size={15} strokeWidth={2}/> Home
          </motion.button>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5, ease:EASE }}>
            {/* Title row */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'#fff', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 0 3px rgba(233,160,32,.4), 0 4px 16px rgba(0,0,0,.35)' }}>
                <img src="/logo.png" alt="TUCC" style={{ width:46, height:46, objectFit:'contain' }}/>
              </div>
              <div>
                <h1 style={{ color:'#fff', fontSize:26, fontWeight:900, margin:0, letterSpacing:-.5 }}>Fixtures</h1>
                <div style={{ color:'rgba(255,255,255,.4)', fontSize:12, marginTop:3, display:'flex', alignItems:'center', gap:8 }}>
                  <span>BTCL Premier League 2026</span>
                  {!loading && (
                    <span style={{ background:'rgba(74,222,128,.12)', border:'1px solid rgba(74,222,128,.25)', borderRadius:20, padding:'2px 8px', fontFamily:FONT, fontSize:10, fontWeight:700, color:'#4ade80' }}>
                      {fixtures.length} upcoming
                    </span>
                  )}
                  {source==='live' && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                      <motion.span animate={{ opacity:[1,.2,1] }} transition={{ duration:1.8, repeat:Infinity }}
                        style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px #4ade80', display:'inline-block' }}/>
                      <span style={{ color:'#86efac', fontWeight:700, fontSize:11 }}>Live</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats strip */}
            {!loading && fixtures.length > 0 && (
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { label:'Season',  value:SEASON_TOTAL, grad:'linear-gradient(135deg,#1e293b,#334155)', bar:'rgba(255,255,255,.3)' },
                  { label:'Played',  value:PLAYED_HOME+PLAYED_AWAY, grad:'linear-gradient(135deg,#0d3320,#1a5c38)', bar:'#4ade80' },
                  { label:'Home 🏠', value:PLAYED_HOME,   grad:'linear-gradient(135deg,#7c2d12,#ea580c)', bar:'#fdba74' },
                  { label:'Away ✈️', value:PLAYED_AWAY,   grad:'linear-gradient(135deg,#1e3a5f,#2563eb)', bar:'#93c5fd' },
                ].map(({ label, value, grad, bar }, i) => (
                  <motion.div key={label}
                    initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:.1+i*.07, duration:.4, ease:EASE }}
                    style={{ flex:1, background:grad, borderRadius:16, padding:'12px 8px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,.3)', position:'relative', overflow:'hidden' }}
                  >
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:bar, opacity:.7 }}/>
                    <div style={{ fontFamily:FONT, fontSize:22, fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{value}</div>
                    <div style={{ fontFamily:FONT, fontSize:9, fontWeight:700, color:'rgba(255,255,255,.6)', marginTop:5, textTransform:'uppercase', letterSpacing:.6 }}>{label}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, maxWidth:MAX_WIDTH, margin:'0 auto', padding:'22px 16px 64px', width:'100%' }}>

        {/* Toolbar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontFamily:FONT, fontSize:13, fontWeight:600, color:'#64748b' }}>
            {!loading && `${fixtures.length} upcoming fixtures`}
          </div>
          <motion.button
            onClick={() => load(true)} disabled={refreshing} whileTap={{ scale:.94 }}
            style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'8px 14px', cursor: refreshing?'default':'pointer', fontFamily:FONT, fontSize:12, fontWeight:700, color:'#475569', opacity: refreshing?.5:1, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}
          >
            <RotateCw size={13} strokeWidth={2.2} style={{ animation: refreshing?'tucc-spin .65s linear infinite':'none' }}/>
            Refresh
          </motion.button>
        </div>

        {error && (
          <div style={{ background:'#fff1f2', border:'1.5px solid #fecaca', borderRadius:16, padding:'16px 20px', marginBottom:20, textAlign:'center', color:'#be123c', fontSize:14, fontWeight:500 }}>
            Couldn't load fixtures.{' '}
            <button onClick={() => { setError(false); setLoading(true); load(true) }}
              style={{ color:'#1a5c38', background:'none', border:'none', cursor:'pointer', fontWeight:800, fontFamily:FONT, fontSize:14 }}>
              Try again →
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i}/>)}
          </div>
        ) : fixtures.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 20px', background:'#fff', borderRadius:24, border:'1.5px solid #e2e8f0', boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>📅</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1e293b' }}>No fixtures scheduled</div>
            <div style={{ fontSize:13, color:'#94a3b8', marginTop:6 }}>Check back when the next round is confirmed.</div>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Next TUCC hero */}
              {nextTucc && <NextMatchBanner fixture={nextTucc} countdown={countdown}/>}

              {/* Divider */}
              {nextTucc && remaining.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'6px 0' }}>
                  <div style={{ flex:1, height:1.5, background:'linear-gradient(90deg,transparent,#cbd5e1)' }}/>
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:FONT, fontSize:11, fontWeight:700, color:'#64748b', background:'#fff', borderRadius:20, padding:'4px 14px', border:'1.5px solid #e2e8f0', boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}>
                    <Zap size={10} strokeWidth={2.5} color="#e9a020"/> All Fixtures
                  </div>
                  <div style={{ flex:1, height:1.5, background:'linear-gradient(90deg,#cbd5e1,transparent)' }}/>
                </div>
              )}

              {/* All cards */}
              {remaining.map((f, i) => <FixtureCard key={i} fixture={f} index={i}/>)}

              {/* Footer CTA */}
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.4 }}
                style={{ background:'linear-gradient(145deg, #071a0d, #0d3320, #1a5c38)', borderRadius:22, padding:'20px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, boxShadow:'0 8px 32px rgba(7,26,13,.4)', marginTop:6, border:'1px solid rgba(255,255,255,.06)' }}
              >
                <div>
                  <div style={{ fontFamily:FONT, fontSize:14, fontWeight:800, color:'#fff' }}>Full season schedule</div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:'rgba(255,255,255,.35)', marginTop:3 }}>View on play-cricket.com</div>
                </div>
                <a href="https://dtucc.play-cricket.com/Matches?tab=Fixture" target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,.15)', border:'1px solid rgba(74,222,128,.3)', color:'#4ade80', borderRadius:12, padding:'10px 18px', fontFamily:FONT, fontSize:13, fontWeight:800, textDecoration:'none', flexShrink:0 }}>
                  Open <ExternalLink size={13} strokeWidth={2.5}/>
                </a>
              </motion.div>
            </div>
          </AnimatePresence>
        )}
      </div>

      <Footer/>
    </div>
  )
}
