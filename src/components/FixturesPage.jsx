import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, ArrowLeft, ExternalLink, RotateCw, Home, Plane, Calendar, Zap, ChevronRight } from 'lucide-react'
import { FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'

const EASE = [0.32, 0.72, 0, 1]
const OUR_NAMES = ['Tamil United', 'TUCC', 'Dollishill Tamil United', 'DTU']
const isOursLeague = (name = '') => OUR_NAMES.some(t => name.toLowerCase().includes(t.toLowerCase()))

// ── Season stat pill (matches Results page style) ─────────
function SeasonPill({ label, value, grad, shadow, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: EASE }}
      style={{
        background: grad, borderRadius: 18,
        padding: '14px 10px', textAlign: 'center',
        boxShadow: shadow, flex: 1,
        position: 'relative', overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* Decorative circle highlight */}
      <div style={{ position:'absolute', top:-14, right:-14, width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,.13)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-10, left:-10, width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,.07)', pointerEvents:'none' }}/>
      <div style={{ fontFamily:FONT, fontSize:26, fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums', position:'relative', zIndex:1 }}>{value}</div>
      <div style={{ fontFamily:FONT, fontSize:9, fontWeight:800, color:'rgba(255,255,255,.75)', marginTop:5, textTransform:'uppercase', letterSpacing:1, position:'relative', zIndex:1 }}>{label}</div>
    </motion.div>
  )
}
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

// ── Team Logo — always circular ───────────────────────────────
function TeamLogo({ logo, name, size = 68, ring = 'rgba(255,255,255,.2)', glow = false }) {
  const [error, setError] = useState(false)
  const initials = (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const PALETTE = ['#2563eb','#7c3aed','#0369a1','#b45309','#0891b2','#be185d','#15803d','#9d174d']
  let h = 0; for (const c of (name||'')) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Glow ring for "our team" */}
      {glow && (
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.1, 0.45] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(233,160,32,.5) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Outer ring shell */}
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(255,255,255,.06)',
        border: `2px solid ${ring}`,
        boxShadow: glow
          ? '0 0 0 3px rgba(233,160,32,.18), 0 8px 28px rgba(0,0,0,.4)'
          : '0 4px 20px rgba(0,0,0,.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 3,
      }}>
        {/* Inner circle */}
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: (!logo || error) ? `linear-gradient(145deg, ${bg}dd, ${bg}88)` : '#fff',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,.15)',
        }}>
          {(!logo || error)
            ? <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * 0.28), color: '#fff' }}>{initials}</span>
            : <img src={logo} alt={name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} onError={() => setError(true)} />
          }
        </div>
      </div>
    </div>
  )
}

// ── Countdown Unit ────────────────────────────────────────────
function CountUnit({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        background: 'rgba(255,255,255,.1)',
        border: '1px solid rgba(255,255,255,.14)',
        borderRadius: 14, padding: '10px 14px', minWidth: 58, textAlign: 'center',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,.08)',
      }}>
        <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 6 }}>
        {label}
      </div>
    </div>
  )
}

// ── Next Match Hero Banner ────────────────────────────────────
function NextMatchBanner({ fixture, countdown }) {
  const isHome = isOurs(fixture.team1)
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`
  const tucc1  = isOurs(fixture.team1)
  const tucc2  = isOurs(fixture.team2)

  return (
    // Outer shell (double bezel)
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        borderRadius: 28, padding: 3, marginBottom: 8,
        background: 'rgba(255,255,255,.07)',
        border: '1px solid rgba(255,255,255,.12)',
        boxShadow: '0 28px 72px rgba(10,20,60,.65), 0 0 0 1px rgba(255,255,255,.04)',
        position: 'relative',
      }}
    >
      {/* Inner core */}
      <div style={{
        borderRadius: 26, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(145deg, #060d2e 0%, #0f1e5a 45%, #1a1060 75%, #0a0730 100%)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,.08)',
      }}>
        {/* Ambient orbs */}
        <motion.div animate={{ scale:[1,1.3,1], opacity:[.18,.05,.18] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(99,102,241,.3)', filter:'blur(50px)', pointerEvents:'none' }}/>
        <motion.div animate={{ scale:[1,1.2,1], opacity:[.14,.04,.14] }} transition={{ duration:8, repeat:Infinity, ease:'easeInOut', delay:2 }}
          style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'rgba(233,160,32,.2)', filter:'blur(40px)', pointerEvents:'none' }}/>

        {/* Gold shimmer bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, #e9a020 30%, #f59e0b 50%, #e9a020 70%, transparent)' }} />

        <div style={{ padding: '20px 22px 24px', position: 'relative', zIndex: 1 }}>
          {/* Top row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <motion.div animate={{ opacity:[1,.2,1] }} transition={{ duration:1.8, repeat:Infinity }}
                style={{ width:8, height:8, borderRadius:'50%', background:'#67e8f9', boxShadow:'0 0 10px #67e8f9' }}/>
              <span style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'rgba(255,255,255,.65)', letterSpacing:1.5, textTransform:'uppercase' }}>Next Match</span>
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:5,
              background: isHome ? 'rgba(96,165,250,.12)' : 'rgba(251,191,36,.12)',
              border:`1px solid ${isHome ? 'rgba(96,165,250,.28)' : 'rgba(251,191,36,.28)'}`,
              borderRadius:20, padding:'5px 13px',
            }}>
              {isHome ? <Home size={11} color="#60a5fa" strokeWidth={2.5}/> : <Plane size={11} color="#fbbf24" strokeWidth={2.5}/>}
              <span style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color: isHome?'#60a5fa':'#fbbf24' }}>{isHome?'Home':'Away'}</span>
            </div>
          </div>

          {/* Teams row — bigger logos */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:22 }}>
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:.15, duration:.55, ease:EASE }}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <TeamLogo logo={fixture.logo1} name={fixture.team1} size={88} ring={tucc1?'rgba(233,160,32,.6)':'rgba(255,255,255,.18)'} glow={tucc1}/>
              <div style={{ fontFamily:FONT, fontSize:13, fontWeight:800, color:'#fff', textAlign:'center', lineHeight:1.3 }}>
                {shorten(fixture.team1)}
              </div>
            </motion.div>

            {/* VS */}
            <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:FONT, fontSize:10, fontWeight:900, color:'rgba(255,255,255,.35)', letterSpacing:2 }}>VS</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'6px 12px' }}>
                <Clock size={11} color="rgba(255,255,255,.6)" strokeWidth={2}/>
                <span style={{ fontFamily:FONT, fontSize:13, fontWeight:700, color:'#fff' }}>{fixture.time}</span>
              </div>
            </div>

            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:.15, duration:.55, ease:EASE }}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <TeamLogo logo={fixture.logo2} name={fixture.team2} size={88} ring={tucc2?'rgba(233,160,32,.6)':'rgba(255,255,255,.18)'} glow={tucc2}/>
              <div style={{ fontFamily:FONT, fontSize:13, fontWeight:800, color:'#fff', textAlign:'center', lineHeight:1.3 }}>
                {shorten(fixture.team2)}
              </div>
            </motion.div>
          </div>

          {/* Date pill */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:20, padding:'7px 16px' }}>
              <Calendar size={12} color="rgba(255,255,255,.55)" strokeWidth={2}/>
              <span style={{ fontFamily:FONT, fontSize:13, fontWeight:700, color:'rgba(255,255,255,.8)' }}>{fixture.date}</span>
            </div>
          </div>

          {/* Countdown */}
          {countdown && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }}
              style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', gap:10, marginBottom:20 }}>
              {[
                { v:countdown.days, l:'Days' },
                { v:countdown.hours,l:'Hrs'  },
                { v:countdown.mins, l:'Min'  },
                { v:countdown.secs, l:'Sec'  },
              ].map(({v,l},i) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <CountUnit value={v} label={l}/>
                  {i<3 && <div style={{ width:2, height:48, background:'rgba(255,255,255,.08)', borderRadius:2, marginBottom:20 }}/>}
                </div>
              ))}
            </motion.div>
          )}

          {/* Venue */}
          <div style={{ background:'rgba(0,0,0,.22)', border:'1px solid rgba(255,255,255,.07)', borderRadius:18, padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:12, background:'rgba(99,102,241,.15)', border:'1px solid rgba(99,102,241,.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MapPin size={15} color="#a5b4fc" strokeWidth={2}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:FONT, fontSize:9, color:'rgba(255,255,255,.3)', fontWeight:800, textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Venue</div>
              <div style={{ fontFamily:FONT, fontSize:13, fontWeight:600, color:'rgba(255,255,255,.75)', lineHeight:1.4 }}>{fixture.venue}</div>
            </div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer"
              style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, background:'rgba(233,160,32,.12)', border:'1px solid rgba(233,160,32,.28)', borderRadius:12, padding:'8px 14px', fontFamily:FONT, fontSize:12, fontWeight:800, color:'#e9a020', textDecoration:'none' }}>
              Map <ExternalLink size={11} strokeWidth={2.5}/>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Fixture Card ──────────────────────────────────────────────
function FixtureCard({ fixture, index }) {
  const tucc1  = isOurs(fixture.team1)
  const tucc2  = isOurs(fixture.team2)
  const isTucc = tucc1 || tucc2
  const isHome = tucc1
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`

  return (
    // Outer shell (double bezel)
    <motion.div
      initial={{ opacity:0, y:18, scale:.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ duration:.5, ease:EASE, delay: index * 0.055 }}
      whileHover={{ y:-3, transition:{ duration:.2, ease:EASE } }}
      style={{
        borderRadius: 22, padding: 2,
        background: isTucc ? 'rgba(233,160,32,.12)' : 'rgba(255,255,255,.06)',
        border: `1px solid ${isTucc ? 'rgba(233,160,32,.25)' : 'rgba(255,255,255,.09)'}`,
        boxShadow: isTucc
          ? '0 12px 40px rgba(15,23,42,.45), 0 0 0 1px rgba(233,160,32,.08)'
          : '0 8px 28px rgba(15,23,42,.3)',
        cursor: 'default',
      }}
    >
      {/* Inner core */}
      <div style={{
        borderRadius: 21, overflow: 'hidden',
        background: isTucc
          ? 'linear-gradient(145deg, #060d2e 0%, #0f1e5a 50%, #1a1060 100%)'
          : 'linear-gradient(150deg, rgba(37,99,235,0.34), rgba(124,58,237,0.30) 60%, rgba(20,184,166,0.20))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.20)',
        backdropFilter: isTucc ? 'none' : 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: isTucc ? 'none' : 'blur(20px) saturate(160%)',
        position: 'relative',
      }}>
        {/* Subtle ambient */}
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background: isTucc?'rgba(233,160,32,.06)':'rgba(99,102,241,.06)', filter:'blur(30px)', pointerEvents:'none' }}/>

        {/* Top accent bar */}
        {isTucc
          ? <div style={{ height:2, background:'linear-gradient(90deg,transparent,#e9a020 30%,#f59e0b 50%,#e9a020 70%,transparent)' }}/>
          : <div style={{ height:1, background:'rgba(255,255,255,.05)' }}/>
        }

        {/* Header row */}
        <div style={{ padding:'13px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:1 }}>
          {/* Date */}
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:28, height:28, borderRadius:9, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Calendar size={12} color="rgba(255,255,255,.5)" strokeWidth={2}/>
            </div>
            <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:'rgba(255,255,255,.7)' }}>{fixture.date}</span>
          </div>

          {/* Badges */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {isTucc && (
              <div style={{
                display:'flex', alignItems:'center', gap:4,
                background: isHome?'rgba(96,165,250,.1)':'rgba(251,191,36,.1)',
                border:`1px solid ${isHome?'rgba(96,165,250,.25)':'rgba(251,191,36,.25)'}`,
                borderRadius:20, padding:'4px 10px',
              }}>
                {isHome?<Home size={10} color="#60a5fa" strokeWidth={2.5}/>:<Plane size={10} color="#fbbf24" strokeWidth={2.5}/>}
                <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:isHome?'#60a5fa':'#fbbf24' }}>
                  {isHome?'Home':'Away'}
                </span>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.09)', borderRadius:20, padding:'4px 10px' }}>
              <Clock size={10} color="rgba(255,255,255,.5)" strokeWidth={2}/>
              <span style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)' }}>{fixture.time}</span>
            </div>
          </div>
        </div>

        {/* Teams row — circular logos */}
        <div style={{ padding:'18px 20px 16px', display:'flex', alignItems:'center', gap:10, position:'relative', zIndex:1 }}>
          {/* Team 1 */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <TeamLogo
              logo={fixture.logo1} name={fixture.team1} size={68}
              ring={tucc1?'rgba(233,160,32,.55)':'rgba(255,255,255,.15)'}
              glow={tucc1}
            />
            <div style={{
              fontFamily:FONT, fontSize:12, lineHeight:1.3, textAlign:'center', fontWeight:700,
              color: tucc1?'#e9a020':'rgba(255,255,255,.75)',
            }}>
              {shorten(fixture.team1)}
            </div>
          </div>

          {/* VS divider */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ width:1, height:16, background:'rgba(255,255,255,.07)' }}/>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background: isTucc?'linear-gradient(135deg,#e9a020,#f59e0b)':'rgba(255,255,255,.07)',
              border:`1px solid ${isTucc?'rgba(233,160,32,.4)':'rgba(255,255,255,.1)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: isTucc?'0 4px 14px rgba(233,160,32,.3)':'none',
            }}>
              <span style={{ fontFamily:FONT, fontSize:9, fontWeight:900, color: isTucc?'#0f172a':'rgba(255,255,255,.3)', letterSpacing:1.5 }}>VS</span>
            </div>
            <div style={{ width:1, height:16, background:'rgba(255,255,255,.07)' }}/>
          </div>

          {/* Team 2 */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <TeamLogo
              logo={fixture.logo2} name={fixture.team2} size={68}
              ring={tucc2?'rgba(233,160,32,.55)':'rgba(255,255,255,.15)'}
              glow={tucc2}
            />
            <div style={{
              fontFamily:FONT, fontSize:12, lineHeight:1.3, textAlign:'center', fontWeight:700,
              color: tucc2?'#e9a020':'rgba(255,255,255,.75)',
            }}>
              {shorten(fixture.team2)}
            </div>
          </div>
        </div>

        {/* Venue row */}
        <div style={{ margin:'0 14px 14px', background:'rgba(0,0,0,.2)', border:'1px solid rgba(255,255,255,.06)', borderRadius:14, padding:'10px 13px', display:'flex', alignItems:'center', gap:9, position:'relative', zIndex:1 }}>
          <MapPin size={12} color={isTucc?'#a5b4fc':'rgba(255,255,255,.3)'} strokeWidth={2} style={{ flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:0, fontFamily:FONT, fontSize:11, fontWeight:500, color:'rgba(255,255,255,.45)', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {fixture.venue}
          </div>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:4, background:isTucc?'rgba(233,160,32,.12)':'rgba(255,255,255,.07)', border:`1px solid ${isTucc?'rgba(233,160,32,.25)':'rgba(255,255,255,.1)'}`, borderRadius:9, padding:'5px 11px', fontFamily:FONT, fontSize:10, fontWeight:800, color:isTucc?'#e9a020':'rgba(255,255,255,.5)', textDecoration:'none' }}>
            Map <ExternalLink size={9} strokeWidth={2.5}/>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius:22, overflow:'hidden', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)' }}>
      <div style={{ height:3, background:'rgba(255,255,255,.04)' }}/>
      <div style={{ padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ height:12, width:90, borderRadius:6, background:'rgba(255,255,255,.07)' }}/>
        <div style={{ height:12, width:60, borderRadius:6, background:'rgba(255,255,255,.07)' }}/>
      </div>
      <div style={{ padding:'18px 20px 16px', display:'flex', alignItems:'center', gap:10 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex:i===1?0:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ width:i===1?36:68, height:i===1?36:68, borderRadius:'50%', background:'rgba(255,255,255,.07)' }}/>
            {i!==1 && <div style={{ height:10, width:'70%', borderRadius:6, background:'rgba(255,255,255,.06)' }}/>}
          </div>
        ))}
      </div>
      <div style={{ margin:'0 14px 14px', height:38, borderRadius:14, background:'rgba(255,255,255,.05)' }}/>
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
  const [teamStats, setTeamStats]   = useState(null)

  useEffect(() => {
    fetch('/api/league-table')
      .then(r => r.json())
      .then(d => {
        const ourRow = (d.rows || d.teams || []).find(t => isOursLeague(t.team))
        if (ourRow) setTeamStats(ourRow)
      })
      .catch(() => {})
  }, [])

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

  return (
    <div style={{ minHeight:'100dvh', background:'transparent', fontFamily:FONT, display:'flex', flexDirection:'column' }}>
      <Nav />

      {/* ── Hero Header ── */}
      <div style={{
        background: 'transparent',
        padding:'24px 20px 40px', position:'relative', overflow:'hidden',
      }}>
        {/* Background orbs */}
        <motion.div animate={{ scale:[1,1.2,1], opacity:[.15,.04,.15] }} transition={{ duration:8, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(99,102,241,.3)', filter:'blur(60px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-30, left:-30, width:160, height:160, borderRadius:'50%', background:'rgba(233,160,32,.08)', filter:'blur(40px)', pointerEvents:'none' }}/>
        {/* Subtle grid */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)', backgroundSize:'40px 40px' }}/>

        <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', position:'relative', zIndex:1 }}>
          <motion.button
            onClick={() => nav('/app')}
            whileTap={{ scale:.95 }}
            style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,.38)', background:'none', border:'none', cursor:'pointer', fontFamily:FONT, fontSize:13, fontWeight:600, padding:0, marginBottom:24 }}
          >
            <ArrowLeft size={15} strokeWidth={2}/> Home
          </motion.button>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.55, ease:EASE }}>
            {/* Title row */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
              {/* Logo — bigger, circular with gold ring */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <motion.div animate={{ scale:[1,1.1,1], opacity:[.4,.1,.4] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                  style={{ position:'absolute', inset:-8, borderRadius:'50%', background:'radial-gradient(circle,rgba(233,160,32,.4) 0%,transparent 70%)', pointerEvents:'none' }}/>
                <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(255,255,255,.06)', border:'3px solid rgba(233,160,32,.6)', boxShadow:'0 0 0 2px rgba(233,160,32,.15), 0 8px 28px rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative', zIndex:1 }}>
                  <div style={{ width:58, height:58, borderRadius:'50%', background: '#fff', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <img src="/logo.png" alt="TUCC" style={{ width:50, height:50, objectFit:'contain' }}/>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ display:'inline-block', fontFamily:FONT, fontSize:10.5, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:'rgba(255,255,255,.6)', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.16)', borderRadius:20, padding:'3px 11px', marginBottom:8 }}>Match Schedule</span>
                <h1 style={{ color:'#fff', fontSize:28, fontWeight:900, margin:0, letterSpacing:'-0.5px', backgroundImage:'linear-gradient(92deg,#60a5fa,#c084fc 60%,#f472b6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Fixtures</h1>
                <div style={{ color:'rgba(255,255,255,.38)', fontSize:12, marginTop:4, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span>BTCL Premier League 2026</span>
                  {!loading && (
                    <span style={{ background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.25)', borderRadius:20, padding:'2px 9px', fontFamily:FONT, fontSize:10, fontWeight:700, color:'#a5b4fc' }}>
                      {fixtures.length} upcoming
                    </span>
                  )}
                  {source==='live' && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                      <motion.span animate={{ opacity:[1,.2,1] }} transition={{ duration:1.8, repeat:Infinity }}
                        style={{ width:6, height:6, borderRadius:'50%', background:'#67e8f9', boxShadow:'0 0 8px #67e8f9', display:'inline-block' }}/>
                      <span style={{ color:'#67e8f9', fontWeight:700, fontSize:11 }}>Live</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Season stats pills — live from league table */}
            {teamStats && (
              <div style={{ display:'flex', gap:10, marginTop: 4 }}>
                <SeasonPill delay={0.05} label="Played" value={teamStats.p   ?? '—'} grad="linear-gradient(135deg,#2563eb,#3b82f6)" shadow="0 6px 20px rgba(37,99,235,.4)" />
                <SeasonPill delay={0.10} label="Won"    value={teamStats.w   ?? '0'} grad="linear-gradient(135deg,#15803d,#22c55e)" shadow="0 6px 20px rgba(21,128,61,.4)" />
                <SeasonPill delay={0.15} label="Lost"   value={teamStats.l   ?? '—'} grad="linear-gradient(135deg,#be123c,#f43f5e)" shadow="0 6px 20px rgba(190,18,60,.35)" />
                <SeasonPill delay={0.20} label="Points" value={teamStats.pts ?? '—'} grad="linear-gradient(135deg,#b45309,#f59e0b)" shadow="0 6px 20px rgba(180,83,9,.4)" />
                <SeasonPill delay={0.25} label="NRR"    value={teamStats.nrr ?? '—'} grad={parseFloat(teamStats.nrr) >= 0 ? 'linear-gradient(135deg,#15803d,#22c55e)' : 'linear-gradient(135deg,#6d28d9,#8b5cf6)'} shadow="0 6px 20px rgba(109,40,217,.35)" />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, width:'100%', background:'transparent' }}>
      <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'22px 16px 64px', width:'100%' }}>

        {/* Toolbar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontFamily:FONT, fontSize:13, fontWeight:600, color:'rgba(255,255,255,.5)' }}>
            {!loading && `${fixtures.length} upcoming fixtures`}
          </div>
          <motion.button
            onClick={() => load(true)} disabled={refreshing} whileTap={{ scale:.94 }}
            whileHover={{ y:-1 }}
            style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(180deg,#818cf8,#6d28d9)', border:'1px solid rgba(255,255,255,.28)', borderRadius:12, padding:'9px 16px', cursor:refreshing?'default':'pointer', fontFamily:FONT, fontSize:12, fontWeight:700, color:'#fff', opacity:refreshing?.6:1, boxShadow:'0 12px 30px -8px rgba(124,58,237,.65), inset 0 1px 0 rgba(255,255,255,.4)', transition:'transform .2s ease' }}
          >
            <RotateCw size={13} strokeWidth={2.2} style={{ animation:refreshing?'tucc-spin .65s linear infinite':'none' }}/>
            Refresh
          </motion.button>
        </div>

        {error && (
          <div style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.2)', borderRadius:16, padding:'16px 20px', marginBottom:20, textAlign:'center', color:'#fca5a5', fontSize:14, fontWeight:500 }}>
            Couldn't load fixtures.{' '}
            <button onClick={() => { setError(false); setLoading(true); load(true) }}
              style={{ color:'#60a5fa', background:'none', border:'none', cursor:'pointer', fontWeight:800, fontFamily:FONT, fontSize:14 }}>
              Try again →
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i}/>)}
          </div>
        ) : fixtures.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 20px', background:'rgba(255,255,255,.05)', borderRadius:22, border:'1px solid rgba(255,255,255,.10)', backdropFilter:'blur(20px) saturate(160%)', WebkitBackdropFilter:'blur(20px) saturate(160%)' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>📅</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>No fixtures scheduled</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginTop:6 }}>Check back when the next round is confirmed.</div>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Next TUCC hero */}
              {nextTucc && <NextMatchBanner fixture={nextTucc} countdown={countdown}/>}

              {/* Section divider */}
              {nextTucc && remaining.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:12, margin:'8px 0' }}>
                  <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(192,132,252,.4))' }}/>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:FONT, fontSize:12, fontWeight:800, color:'#e0d6ff', background:'rgba(255,255,255,.05)', borderRadius:20, padding:'7px 16px', border:'1px solid rgba(255,255,255,.16)', letterSpacing:.5 }}>
                    <Zap size={11} strokeWidth={2.5} color="#c084fc"/> All Fixtures
                  </div>
                  <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(192,132,252,.4),transparent)' }}/>
                </div>
              )}

              {/* Cards */}
              {remaining.map((f, i) => <FixtureCard key={i} fixture={f} index={i}/>)}

              {/* Footer CTA */}
              <motion.div
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.4 }}
                style={{ borderRadius:22, padding:2, background:'rgba(233,160,32,.1)', border:'1px solid rgba(233,160,32,.2)', marginTop:6 }}
              >
                <div style={{ borderRadius:21, background:'linear-gradient(145deg,#060d2e,#0f1e5a)', padding:'20px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <div>
                    <div style={{ fontFamily:FONT, fontSize:14, fontWeight:800, color:'#fff' }}>Full season schedule</div>
                    <div style={{ fontFamily:FONT, fontSize:12, color:'rgba(255,255,255,.3)', marginTop:3 }}>View on play-cricket.com</div>
                  </div>
                  <a href="https://dtucc.play-cricket.com/Matches?tab=Fixture" target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(180deg,#818cf8,#6d28d9)', border:'1px solid rgba(255,255,255,.28)', color:'#fff', borderRadius:12, padding:'11px 20px', fontFamily:FONT, fontSize:13, fontWeight:800, textDecoration:'none', flexShrink:0, boxShadow:'0 12px 30px -8px rgba(124,58,237,.65), inset 0 1px 0 rgba(255,255,255,.4)' }}>
                    Open <ChevronRight size={14} strokeWidth={2.5}/>
                  </a>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>
        )}
      </div>
      </div>

      <Footer/>
    </div>
  )
}
