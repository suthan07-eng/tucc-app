import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { C, FONT, MAX_WIDTH } from '../constants'
import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronRight, MapPin, Calendar, Cloud } from 'lucide-react'

// ── Weather helpers ──────────────────────────────────────────────────────────
const WMO_MAP = [
  { max: 0,  icon: '☀️', label: 'Clear' },
  { max: 1,  icon: '🌤️', label: 'Mostly Clear' },
  { max: 2,  icon: '⛅', label: 'Part Cloudy' },
  { max: 3,  icon: '☁️', label: 'Overcast' },
  { max: 48, icon: '🌫️', label: 'Foggy' },
  { max: 57, icon: '🌦️', label: 'Drizzle' },
  { max: 67, icon: '🌧️', label: 'Rain' },
  { max: 77, icon: '❄️', label: 'Snow' },
  { max: 82, icon: '🌦️', label: 'Showers' },
  { max: 99, icon: '⛈️', label: 'Storm' },
]
function getWmo(code) { return WMO_MAP.find(w => code <= w.max) || WMO_MAP[WMO_MAP.length - 1] }

// ── Floating cricket ball animation ─────────────────────────────────────────
function FloatingBall({ style }) {
  return (
    <motion.div
      animate={{ y: [0, -18, 0], rotate: [0, 360] }}
      transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: 12, height: 12,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #e63946, #9b1d20)',
        boxShadow: '0 2px 8px rgba(0,0,0,.3)',
        position: 'absolute',
        opacity: 0.6,
        ...style,
      }}
    />
  )
}

// ── Next match mini card (for landing) ──────────────────────────────────────
function NextMatchPreview() {
  const [fixture, setFixture] = useState(null)
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    supabase.from('matches').select('*').eq('status', 'upcoming').order('match_date', { ascending: true }).limit(1)
      .single().then(({ data }) => {
        setFixture(data)
        if (data?.venue) {
          fetch(`/api/weather?venue=${encodeURIComponent(data.venue)}`)
            .then(r => r.json()).then(setWeather).catch(() => {})
        }
      })
  }, [])

  if (!fixture) return null

  const matchDate = new Date(fixture.match_date)
  const matchYMD = `${matchDate.getFullYear()}-${String(matchDate.getMonth()+1).padStart(2,'0')}-${String(matchDate.getDate()).padStart(2,'0')}`
  const matchIdx = weather?.daily?.time?.indexOf(matchYMD) ?? -1
  const wmo = matchIdx >= 0 ? getWmo(weather.daily.weathercode[matchIdx]) : null
  const maxT = matchIdx >= 0 ? Math.round(weather.daily.temperature_2m_max[matchIdx]) : null
  const rain = matchIdx >= 0 ? weather.daily.precipitation_probability_max[matchIdx] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: '16px 20px',
        marginTop: 24,
        maxWidth: 380,
        margin: '24px auto 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          background: 'linear-gradient(135deg, #e9a020, #f5c842)',
          borderRadius: 8, padding: '4px 10px',
          fontSize: 10, fontWeight: 800, color: '#000', letterSpacing: 1,
          fontFamily: FONT,
        }}>NEXT MATCH</div>
        {wmo && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 16 }}>{wmo.icon}</span>
            {maxT !== null && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontFamily: FONT }}>{maxT}°C</span>}
            {rain !== null && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontFamily: FONT }}>💧{rain}%</span>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: FONT }}>{fixture.home_team}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontFamily: FONT }}>vs</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: FONT }}>{fixture.away_team}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
            <Calendar size={10} color="rgba(255,255,255,.5)" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontFamily: FONT }}>
              {matchDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <MapPin size={10} color="rgba(255,255,255,.5)" />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontFamily: FONT, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fixture.venue}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Input field ──────────────────────────────────────────────────────────────
function Field({ icon: Icon, type, placeholder, value, onChange, rightEl, autoComplete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 14, padding: '14px 16px',
      transition: 'border-color .2s',
    }}>
      <Icon size={16} color="rgba(255,255,255,.5)" strokeWidth={2} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          color: '#fff', fontSize: 14, fontFamily: FONT,
        }}
      />
      {rightEl}
    </div>
  )
}

// ── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const nav = useNavigate()
  const { signIn, signUp, user, loading } = useAuth()
  const [mode, setMode]           = useState('login') // 'login' | 'signup'
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [fullName, setFullName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [err, setErr]             = useState('')
  const [info, setInfo]           = useState('')
  const [busy, setBusy]           = useState(false)

  // If already logged in, go to home
  useEffect(() => {
    if (!loading && user) nav('/', { replace: true })
  }, [user, loading])

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        nav('/', { replace: true })
      } else {
        if (!fullName.trim()) { setErr('Please enter your full name.'); setBusy(false); return }
        const data = await signUp(email, password, { full_name: fullName, phone })
        // If Supabase returns a session immediately (email confirm disabled), go straight in
        if (data?.session) {
          nav('/', { replace: true })
        } else {
          // Fallback: auto sign-in (works when email confirm is disabled in Supabase dashboard)
          try {
            await signIn(email, password)
            nav('/', { replace: true })
          } catch {
            setInfo('✅ Account created! You can now log in.')
            setMode('login')
          }
        }
      }
    } catch (e) {
      setErr(e.message || 'Something went wrong.')
    }
    setBusy(false)
  }

  // Particle blobs
  const blobs = [
    { w: 320, h: 320, top: '-80px', left: '-80px', color: 'rgba(26,92,56,.55)' },
    { w: 280, h: 280, bottom: '60px', right: '-60px', color: 'rgba(34,116,74,.45)' },
    { w: 200, h: 200, top: '40%', left: '60%', color: 'rgba(233,160,32,.18)' },
  ]

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'linear-gradient(145deg, #050f09 0%, #0f3825 40%, #0f1f19 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      fontFamily: FONT,
    }}>
      {/* ── Animated blobs ── */}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.12, 1], rotate: [0, 8, 0] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: b.w, height: b.h,
            borderRadius: '50%', background: b.color,
            filter: 'blur(60px)',
            top: b.top, left: b.left, bottom: b.bottom, right: b.right,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── Floating balls ── */}
      <FloatingBall style={{ top: '15%', left: '8%' }} />
      <FloatingBall style={{ top: '35%', right: '6%' }} />
      <FloatingBall style={{ bottom: '25%', left: '12%' }} />
      <FloatingBall style={{ top: '60%', right: '14%' }} />

      {/* ── Grid overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* ── Content ── */}
      <div style={{
        width: '100%', maxWidth: 420, padding: '48px 20px 40px',
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Logo + club name */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ textAlign: 'center', marginBottom: 8 }}
        >
          {/* Badge */}
          <div style={{
            width: 88, height: 88, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(145deg, #1a5c38, #22744a)',
            boxShadow: '0 0 0 3px rgba(233,160,32,.5), 0 0 0 6px rgba(233,160,32,.15), 0 20px 60px rgba(0,0,0,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 38,
            position: 'relative',
          }}>
            🏏
            <div style={{
              position: 'absolute', inset: -3, borderRadius: '50%',
              border: '2px solid transparent',
              background: 'linear-gradient(135deg, rgba(233,160,32,.6), rgba(233,160,32,0)) border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'destination-out',
            }} />
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 28, fontWeight: 900, color: '#fff',
              letterSpacing: '-0.5px', margin: 0, lineHeight: 1.1,
            }}
          >
            TUCC
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', margin: '4px 0 0', letterSpacing: 2, textTransform: 'uppercase' }}
          >
            Twickenham United CC
          </motion.p>

          {/* Gold divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{
              height: 2, width: 60, margin: '14px auto 0',
              background: 'linear-gradient(90deg, transparent, #e9a020, transparent)',
              borderRadius: 99,
            }}
          />
        </motion.div>

        {/* Next match preview */}
        <NextMatchPreview />

        {/* ── Auth card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            width: '100%', marginTop: 28,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 24,
            padding: '28px 24px',
            boxShadow: '0 40px 80px rgba(0,0,0,.4)',
          }}
        >
          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'rgba(0,0,0,.25)', borderRadius: 12,
            padding: 4, marginBottom: 24,
          }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setErr(''); setInfo('') }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 700,
                  transition: 'all .25s',
                  background: mode === m ? 'linear-gradient(135deg, #1a5c38, #22744a)' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,.4)',
                  boxShadow: mode === m ? '0 4px 16px rgba(26,92,56,.4)' : 'none',
                }}
              >
                {m === 'login' ? '🔐 Login' : '✨ Join Club'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <Field
                    icon={User} type="text" placeholder="Full Name"
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                  <Field
                    icon={Phone} type="tel" placeholder="Phone (optional)"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Field
              icon={Mail} type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Field
              icon={Lock}
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              rightEl={
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  {showPass
                    ? <EyeOff size={15} color="rgba(255,255,255,.4)" />
                    : <Eye size={15} color="rgba(255,255,255,.4)" />}
                </button>
              }
            />

            {/* Error / info */}
            <AnimatePresence>
              {err && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ background: 'rgba(200,48,42,.15)', border: '1px solid rgba(200,48,42,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', fontFamily: FONT }}
                >{err}</motion.div>
              )}
              {info && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ background: 'rgba(21,128,61,.15)', border: '1px solid rgba(21,128,61,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#86efac', fontFamily: FONT }}
                >{info}</motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={busy}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              style={{
                marginTop: 4,
                padding: '16px 0', borderRadius: 14, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                background: busy ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg, #1a5c38 0%, #22744a 50%, #1a5c38 100%)',
                backgroundSize: '200% 100%',
                color: '#fff', fontFamily: FONT, fontSize: 15, fontWeight: 800,
                boxShadow: busy ? 'none' : '0 8px 28px rgba(26,92,56,.5)',
                transition: 'all .25s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {busy ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                />
              ) : (
                <>
                  {mode === 'login' ? '🚀 Login to Club Portal' : '🏏 Create My Account'}
                  <ChevronRight size={16} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.3)', textAlign: 'center' }}
        >
          Members only portal · TUCC {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  )
}
