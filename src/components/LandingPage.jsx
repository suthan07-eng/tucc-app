import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { FONT } from '../constants'
import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronRight, MapPin, Clock, Calendar, Home, Plane, ExternalLink } from 'lucide-react'

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

function useCountdown(target) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    if (!target) return
    const tick = () => { const d = target - Date.now(); setDiff(d > 0 ? d : 0) }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [target])
  if (diff === null || diff <= 0) return null
  const s = Math.floor(diff / 1000)
  return { days: Math.floor(s/86400), hours: Math.floor((s%86400)/3600), mins: Math.floor((s%3600)/60), secs: s%60 }
}

const WMO = [
  { max:0,  icon:'☀️', label:'Clear' },
  { max:1,  icon:'🌤️', label:'Mostly Clear' },
  { max:2,  icon:'⛅', label:'Part Cloudy' },
  { max:3,  icon:'☁️', label:'Overcast' },
  { max:48, icon:'🌫️', label:'Foggy' },
  { max:57, icon:'🌦️', label:'Drizzle' },
  { max:67, icon:'🌧️', label:'Rain' },
  { max:77, icon:'❄️', label:'Snow' },
  { max:82, icon:'🌦️', label:'Showers' },
  { max:99, icon:'⛈️', label:'Storm' },
]
const getWmo = code => WMO.find(w => code <= w.max) || WMO[WMO.length-1]

// ── Team Logo ──────────────────────────────────────────────────
function TeamLogo({ logo, name, size = 60 }) {
  const [err, setErr] = useState(false)
  const ini = (name||'??').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const PALETTE = ['#1a5c38','#7c3aed','#0369a1','#b45309','#0891b2','#be185d','#15803d','#9d174d']
  let h=0; for (const c of (name||'')) h=(h*31+c.charCodeAt(0))&0xffffff
  const bg = PALETTE[Math.abs(h)%PALETTE.length]
  if (!logo||err) return (
    <div style={{ width:size, height:size, borderRadius:size*0.22, background:`linear-gradient(145deg,${bg}dd,${bg}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, fontWeight:900, fontSize:Math.round(size*0.3), color:'#fff', boxShadow:`0 4px 16px ${bg}44`, flexShrink:0 }}>{ini}</div>
  )
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.22, background:'rgba(255,255,255,.95)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 18px rgba(0,0,0,.2)', flexShrink:0, border:'2px solid rgba(255,255,255,.3)' }}>
      <img src={logo} alt={name} style={{ width:'88%', height:'88%', objectFit:'contain' }} onError={()=>setErr(true)}/>
    </div>
  )
}

// ── Floating cricket ball ──────────────────────────────────────
function Ball({ style, delay=0 }) {
  return (
    <motion.div
      animate={{ y:[0,-22,0], rotate:[0,360] }}
      transition={{ duration:5+delay, repeat:Infinity, ease:'easeInOut', delay }}
      style={{ width:10, height:10, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,#e63946,#9b1d20)', boxShadow:'0 2px 8px rgba(0,0,0,.3)', position:'absolute', opacity:.5, ...style }}
    />
  )
}

// ── Next Match Card ────────────────────────────────────────────
function NextMatchCard({ nav }) {
  const [fixture, setFixture] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loadingFix, setLoadingFix] = useState(true)

  useEffect(() => {
    fetch('/api/fixtures').then(r=>r.json()).then(data => {
      const today = new Date(); today.setHours(0,0,0,0)
      const list = (data.fixtures||[])
      const next = list.find(f => {
        const d = parseDate(f.date)
        return d && d >= today && (isOurs(f.team1)||isOurs(f.team2))
      })
      setFixture(next||null)
      setLoadingFix(false)
      if (next?.venue) {
        fetch(`/api/weather?venue=${encodeURIComponent(next.venue)}`)
          .then(r=>r.json()).then(setWeather).catch(()=>{})
      }
    }).catch(()=>setLoadingFix(false))
  }, [])

  const countdown = useCountdown((() => {
    if (!fixture) return null
    const d = parseDate(fixture.date); if (!d) return null
    const [h,m] = (fixture.time||'13:00').split(':').map(Number)
    d.setHours(h,m,0,0); return d.getTime()
  })())

  if (loadingFix) return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ width:'100%', height:200, borderRadius:24, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <motion.div animate={{ rotate:360 }} transition={{ duration:1.2, repeat:Infinity, ease:'linear' }}
        style={{ width:28, height:28, border:'2px solid rgba(255,255,255,.1)', borderTopColor:'rgba(255,255,255,.4)', borderRadius:'50%' }}/>
    </motion.div>
  )
  if (!fixture) return null

  const isHome = isOurs(fixture.team1)
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(fixture.venue)}`

  // Weather
  const d = parseDate(fixture.date)
  const matchYMD = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : null
  const days = weather?.daily?.time || []
  const matchIdx = matchYMD ? days.indexOf(matchYMD) : -1
  const matchWmo = matchIdx>=0 ? getWmo(weather.daily.weathercode[matchIdx]) : null
  const matchMax = matchIdx>=0 ? Math.round(weather.daily.temperature_2m_max[matchIdx]) : null
  const matchMin = matchIdx>=0 ? Math.round(weather.daily.temperature_2m_min[matchIdx]) : null
  const matchRain = matchIdx>=0 ? weather.daily.precipitation_probability_max[matchIdx] : null
  const matchWind = matchIdx>=0 ? Math.round(weather.daily.windspeed_10m_max?.[matchIdx]||0) : null
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <motion.div
      initial={{ opacity:0, y:20, scale:.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:.5, duration:.6, ease:EASE }}
      style={{
        width:'100%', borderRadius:24, overflow:'hidden', marginBottom:12,
        background:'linear-gradient(145deg,#1a0308 0%,#7f1d1d 45%,#991b1b 75%,#b91c1c 100%)',
        boxShadow:'0 20px 60px rgba(127,29,29,.55), 0 0 0 1px rgba(255,255,255,.08)',
        position:'relative',
      }}
    >
      {/* Animated orbs */}
      <motion.div animate={{ scale:[1,1.3,1], opacity:[.18,.05,.18] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
        style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(220,38,38,.25)', pointerEvents:'none' }}/>
      <motion.div animate={{ scale:[1,1.2,1], opacity:[.12,.03,.12] }} transition={{ duration:8, repeat:Infinity, ease:'easeInOut', delay:2 }}
        style={{ position:'absolute', bottom:-30, left:-30, width:140, height:140, borderRadius:'50%', background:'rgba(233,160,32,.18)', pointerEvents:'none' }}/>

      {/* Gold bar */}
      <div style={{ height:3, background:'linear-gradient(90deg,transparent,#e9a020,#f59e0b,transparent)' }}/>

      <div style={{ padding:'16px 18px 0', position:'relative', zIndex:1 }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <motion.div animate={{ opacity:[1,.3,1] }} transition={{ duration:2, repeat:Infinity }}
              style={{ width:7, height:7, borderRadius:'50%', background:'#86efac', boxShadow:'0 0 8px #86efac' }}/>
            <span style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'rgba(255,255,255,.75)', letterSpacing:1.2, textTransform:'uppercase' }}>Next Match</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, background: isHome?'rgba(74,222,128,.15)':'rgba(251,191,36,.15)', border:`1px solid ${isHome?'rgba(74,222,128,.3)':'rgba(251,191,36,.3)'}`, borderRadius:20, padding:'4px 12px' }}>
            {isHome ? <Home size={10} color="#4ade80" strokeWidth={2.5}/> : <Plane size={10} color="#fbbf24" strokeWidth={2.5}/>}
            <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color: isHome?'#4ade80':'#fbbf24' }}>{isHome?'Home':'Away'}</span>
          </div>
        </div>

        {/* Teams */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:14 }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:9 }}>
            <TeamLogo logo={fixture.logo1} name={fixture.team1} size={64}/>
            <div style={{ fontFamily:FONT, fontSize:13, fontWeight:800, color:'#fff', textAlign:'center', lineHeight:1.25 }}>{shorten(fixture.team1)}</div>
          </div>
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ fontFamily:FONT, fontSize:11, fontWeight:900, color:'rgba(255,255,255,.3)', letterSpacing:3 }}>VS</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:'5px 10px' }}>
              <Clock size={11} color="rgba(255,255,255,.7)" strokeWidth={2}/>
              <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:'#fff' }}>{fixture.time}</span>
            </div>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:9 }}>
            <TeamLogo logo={fixture.logo2} name={fixture.team2} size={64}/>
            <div style={{ fontFamily:FONT, fontSize:13, fontWeight:800, color:'#fff', textAlign:'center', lineHeight:1.25 }}>{shorten(fixture.team2)}</div>
          </div>
        </div>

        {/* Date pill */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:20, padding:'5px 14px' }}>
            <Calendar size={11} color="rgba(255,255,255,.6)" strokeWidth={2}/>
            <span style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:'rgba(255,255,255,.8)' }}>{fixture.date}</span>
          </div>
        </div>

        {/* Countdown */}
        {countdown && (
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', gap:6, marginBottom:14 }}>
            {[{v:countdown.days,l:'Days'},{v:countdown.hours,l:'Hrs'},{v:countdown.mins,l:'Min'},{v:countdown.secs,l:'Sec'}].map(({v,l},i)=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div style={{ background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'7px 10px', minWidth:44, textAlign:'center' }}>
                    <div style={{ fontFamily:FONT, fontSize:22, fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{String(v).padStart(2,'0')}</div>
                  </div>
                  <div style={{ fontFamily:FONT, fontSize:9, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>{l}</div>
                </div>
                {i<3 && <div style={{ width:2, height:42, background:'rgba(255,255,255,.1)', borderRadius:2, marginBottom:16 }}/>}
              </div>
            ))}
          </div>
        )}

        {/* Venue */}
        <div style={{ background:'rgba(0,0,0,.2)', borderRadius:16, padding:'11px 14px', display:'flex', alignItems:'center', gap:10, marginBottom: weather ? 0 : 18 }}>
          <div style={{ width:28, height:28, borderRadius:9, background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <MapPin size={13} color="#86efac" strokeWidth={2}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:FONT, fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:.8, marginBottom:2 }}>Venue</div>
            <div style={{ fontFamily:FONT, fontSize:12, fontWeight:600, color:'rgba(255,255,255,.8)', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fixture.venue}</div>
          </div>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:4, background:'rgba(134,239,172,.12)', border:'1px solid rgba(134,239,172,.25)', borderRadius:9, padding:'6px 11px', fontFamily:FONT, fontSize:11, fontWeight:800, color:'#86efac', textDecoration:'none' }}>
            Map <ExternalLink size={10} strokeWidth={2.5}/>
          </a>
        </div>
      </div>

      {/* Weather section */}
      {weather && days.length > 0 && (
        <div style={{ margin:'14px 0 0', background:'rgba(0,0,0,.2)', padding:'14px 18px 18px', borderTop:'1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:14 }}>🌤️</span>
              <span style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'rgba(255,255,255,.6)', letterSpacing:1, textTransform:'uppercase' }}>7-Day Forecast</span>
            </div>
            <span style={{ fontFamily:FONT, fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:600 }}>
              {fixture.venue.match(/\b[A-Z]{2,4}\s*\d[A-Z0-9]{2}\b/i)?.[0] || ''}
            </span>
          </div>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
            {days.slice(0,7).map((dateStr, i) => {
              const dt = new Date(dateStr+'T12:00:00')
              const isMatch = dateStr === matchYMD
              const wmo = getWmo(weather.daily.weathercode[i])
              const maxT = Math.round(weather.daily.temperature_2m_max[i])
              const minT = Math.round(weather.daily.temperature_2m_min[i])
              const rain = weather.daily.precipitation_probability_max[i]
              return (
                <div key={dateStr} style={{
                  flexShrink:0, minWidth:60, borderRadius:14,
                  background: isMatch ? 'rgba(233,160,32,.15)' : 'rgba(255,255,255,.06)',
                  border: isMatch ? '1.5px solid rgba(233,160,32,.5)' : '1px solid rgba(255,255,255,.08)',
                  padding:'10px 6px 10px',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                }}>
                  {isMatch && <div style={{ fontFamily:FONT, fontSize:8, fontWeight:900, color:'#e9a020', letterSpacing:.8, textTransform:'uppercase' }}>MATCH</div>}
                  <div style={{ fontFamily:FONT, fontSize:9, fontWeight:700, color: isMatch?'#fbbf24':'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.5 }}>
                    {DAYS[dt.getDay()]}
                  </div>
                  <div style={{ fontSize:20 }}>{wmo.icon}</div>
                  <div style={{ fontFamily:FONT, fontSize:13, fontWeight:900, color:'#fff' }}>{maxT}°</div>
                  <div style={{ fontFamily:FONT, fontSize:10, color:'rgba(255,255,255,.35)' }}>{minT}°</div>
                  <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                    <span style={{ fontSize:9 }}>💧</span>
                    <span style={{ fontFamily:FONT, fontSize:9, color: rain>60?'#93c5fd':rain>30?'rgba(255,255,255,.5)':'rgba(255,255,255,.3)', fontWeight:700 }}>{rain}%</span>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Match day summary */}
          {matchWmo && (
            <div style={{ marginTop:12, background:'rgba(233,160,32,.08)', border:'1px solid rgba(233,160,32,.2)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>{matchWmo.icon}</span>
              <div>
                <div style={{ fontFamily:FONT, fontSize:12, fontWeight:800, color:'#fbbf24' }}>Match Day — {matchWmo.label}</div>
                <div style={{ fontFamily:FONT, fontSize:11, color:'rgba(255,255,255,.45)', marginTop:2 }}>
                  {matchWind!=null&&`Wind ${matchWind} km/h · `}{matchRain!=null&&`${matchRain}% chance of rain · `}{matchMax!=null&&`${matchMax}°C high`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Input Field ────────────────────────────────────────────────
function Field({ icon: Icon, type, placeholder, value, onChange, rightEl, autoComplete }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:14, padding:'14px 16px' }}>
      <Icon size={16} color="rgba(255,255,255,.45)" strokeWidth={2}/>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoComplete={autoComplete}
        style={{ flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontSize:14, fontFamily:FONT }}/>
      {rightEl}
    </div>
  )
}

// ── Main Landing Page ──────────────────────────────────────────
export default function LandingPage() {
  const nav = useNavigate()
  const { signIn, signUp, user, loading } = useAuth()
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const [err, setErr]           = useState('')
  const [busy, setBusy]         = useState(false)

  useEffect(() => { if (!loading && user) nav('/', { replace: true }) }, [user, loading])

  async function handleSubmit(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        nav('/', { replace: true })
      } else {
        if (!fullName.trim()) { setErr('Please enter your full name.'); setBusy(false); return }
        const r = await fetch('/api/auth-signup', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password, full_name: fullName, phone }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error||'Signup failed')
        await signIn(email, password)
        nav('/', { replace: true })
      }
    } catch(e) { setErr(e.message||'Something went wrong.') }
    setBusy(false)
  }

  return (
    <div style={{
      minHeight:'100vh', width:'100%',
      background:'linear-gradient(160deg, #020a05 0%, #071a0d 30%, #0c2e18 65%, #0f1f16 100%)',
      display:'flex', flexDirection:'column', alignItems:'center',
      position:'relative', overflow:'hidden', fontFamily:FONT,
    }}>
      {/* Animated blobs */}
      {[
        { w:340,h:340,top:'-90px',left:'-90px',color:'rgba(26,92,56,.5)' },
        { w:260,h:260,bottom:'80px',right:'-60px',color:'rgba(34,116,74,.4)' },
        { w:180,h:180,top:'45%',left:'65%',color:'rgba(233,160,32,.14)' },
      ].map((b,i)=>(
        <motion.div key={i}
          animate={{ scale:[1,1.14,1], rotate:[0,10,0] }}
          transition={{ duration:9+i*2, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', width:b.w, height:b.h, borderRadius:'50%', background:b.color, filter:'blur(70px)', top:b.top, left:b.left, bottom:b.bottom, right:b.right, pointerEvents:'none' }}
        />
      ))}

      {/* Floating cricket balls */}
      <Ball style={{ top:'12%', left:'7%' }} delay={0}/>
      <Ball style={{ top:'38%', right:'5%' }} delay={1.5}/>
      <Ball style={{ bottom:'22%', left:'10%' }} delay={3}/>
      <Ball style={{ top:'65%', right:'12%' }} delay={0.8}/>
      <Ball style={{ top:'22%', right:'20%' }} delay={2.2}/>

      {/* Grid overlay */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize:'40px 40px' }}/>

      {/* Premium radial spotlight from top */}
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:700, height:500, borderRadius:'50%', background:'radial-gradient(ellipse at 50% 0%, rgba(26,92,56,.35) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Gold vignette bottom */}
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:500, height:300, borderRadius:'50%', background:'radial-gradient(ellipse at 50% 100%, rgba(233,160,32,.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Content */}
      <div style={{ width:'100%', maxWidth:440, padding:'44px 20px 48px', position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center' }}>

        {/* ── Logo & Club Name ── */}
        <motion.div
          initial={{ opacity:0, y:-28 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.7, ease:'easeOut' }}
          style={{ textAlign:'center', marginBottom:20 }}
        >
          {/* Real logo with white background */}
          <div style={{
            width:100, height:100, borderRadius:'50%', margin:'0 auto 16px',
            background:'#fff',
            boxShadow:'0 0 0 4px rgba(233,160,32,.5), 0 0 0 8px rgba(233,160,32,.13), 0 24px 60px rgba(0,0,0,.6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            overflow:'hidden',
          }}>
            <img src="/logo.png" alt="TUCC Logo" style={{ width:86, height:86, objectFit:'contain' }}/>
          </div>

          <motion.h1 initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
            style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:'-.5px', margin:0, lineHeight:1.1 }}>
            Tamil United CC
          </motion.h1>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.4 }}
            style={{ fontSize:12, color:'rgba(255,255,255,.4)', margin:'5px 0 0', letterSpacing:2, textTransform:'uppercase' }}>
            Members Portal · BTCL 2026
          </motion.p>

          {/* Gold divider */}
          <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:.5, duration:.6 }}
            style={{ height:2, width:70, margin:'14px auto 0', background:'linear-gradient(90deg,transparent,#e9a020,transparent)', borderRadius:99 }}/>
        </motion.div>

        {/* ── Auth Card ── */}
        <motion.div
          initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:.65, duration:.6, ease:EASE }}
          style={{
            width:'100%', marginTop:4,
            background:'rgba(255,255,255,.055)',
            backdropFilter:'blur(28px)',
            border:'1px solid rgba(255,255,255,.11)',
            borderRadius:26, padding:'26px 22px',
            boxShadow:'0 40px 80px rgba(0,0,0,.45)',
          }}
        >
          {/* Tab */}
          <div style={{ display:'flex', background:'rgba(0,0,0,.3)', borderRadius:13, padding:4, marginBottom:22 }}>
            {['login','signup'].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr('')}}
                style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer', fontFamily:FONT, fontSize:13, fontWeight:700, transition:'all .25s', background: mode===m?'linear-gradient(135deg,#1a5c38,#22744a)':'transparent', color: mode===m?'#fff':'rgba(255,255,255,.38)', boxShadow: mode===m?'0 4px 16px rgba(26,92,56,.45)':'none' }}>
                {m==='login'?'🔐 Login':'✨ Join Club'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:11 }}>
            <AnimatePresence mode="wait">
              {mode==='signup' && (
                <motion.div key="su" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                  style={{ overflow:'hidden', display:'flex', flexDirection:'column', gap:11 }}>
                  <Field icon={User} type="text" placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name"/>
                  <Field icon={Phone} type="tel" placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel"/>
                </motion.div>
              )}
            </AnimatePresence>

            <Field icon={Mail} type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
            <Field icon={Lock} type={showPass?'text':'password'} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
              autoComplete={mode==='login'?'current-password':'new-password'}
              rightEl={
                <button type="button" onClick={()=>setShowPass(s=>!s)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                  {showPass?<EyeOff size={15} color="rgba(255,255,255,.35)"/>:<Eye size={15} color="rgba(255,255,255,.35)"/>}
                </button>
              }
            />

            <AnimatePresence>
              {err && (
                <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ background:'rgba(200,48,42,.15)', border:'1px solid rgba(200,48,42,.3)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#f87171', fontFamily:FONT }}>
                  {err}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={busy} whileTap={{ scale:.97 }} whileHover={{ scale:1.01 }}
              style={{ marginTop:6, padding:'16px 0', borderRadius:14, border:'none', cursor: busy?'not-allowed':'pointer', background: busy?'rgba(255,255,255,.1)':'linear-gradient(135deg,#1a5c38 0%,#22744a 50%,#1a5c38 100%)', color:'#fff', fontFamily:FONT, fontSize:15, fontWeight:800, boxShadow: busy?'none':'0 8px 28px rgba(26,92,56,.55)', transition:'all .25s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {busy
                ? <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }} style={{ width:18, height:18, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%' }}/>
                : <>{mode==='login'?'🚀 Login to Club Portal':'🏏 Create My Account'}<ChevronRight size={16}/></>
              }
            </motion.button>
          </form>
        </motion.div>

        {/* ── Admin + members note (between auth and next match) ── */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.9 }}
          style={{ marginTop:18, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <button onClick={()=>nav('/admin/login')}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'rgba(255,255,255,.16)', fontFamily:FONT, display:'flex', alignItems:'center', gap:5, transition:'color .2s' }}
            onMouseEnter={e=>e.currentTarget.style.color='rgba(233,160,32,.65)'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.16)'}>
            🛡 Admin login
          </button>
        </motion.div>

        {/* ── Next Match Card (below auth + admin link) ── */}
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:1, duration:.6, ease:EASE }}
          style={{ width:'100%', marginTop:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.1))' }}/>
            <span style={{ fontFamily:FONT, fontSize:10, fontWeight:700, color:'rgba(255,255,255,.22)', letterSpacing:1.5, textTransform:'uppercase' }}>Next Match</span>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(255,255,255,.1),transparent)' }}/>
          </div>
          <NextMatchCard nav={nav}/>
        </motion.div>

        {/* ── Footer copyright ── */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.2, duration:.8 }}
          style={{ width:'100%', paddingTop:28, paddingBottom:24, textAlign:'center' }}
        >
          <div style={{ fontFamily:FONT, fontSize:12, color:'rgba(255,255,255,.22)', fontWeight:600, letterSpacing:.4 }}>
            🏏 Members only · Tamil United CC 2026
          </div>
          <div style={{ fontFamily:FONT, fontSize:11, color:'rgba(255,255,255,.12)', fontWeight:500, marginTop:5, letterSpacing:.3 }}>
            © {new Date().getFullYear()} Tamil United Cricket Club. All rights reserved.
          </div>
        </motion.div>
      </div>
    </div>
  )
}
