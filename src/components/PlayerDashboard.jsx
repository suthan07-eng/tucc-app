import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { FONT } from '../constants'

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to }) {
  const count  = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v))
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const unsub = rounded.on('change', v => setDisplay(v))
    const ctrl  = animate(count, to ?? 0, { duration: 1.2, ease: [0.16, 1, 0.3, 1] })
    return () => { ctrl.stop(); unsub() }
  }, [to])

  return <span>{display}</span>
}

// ── Floating orb ─────────────────────────────────────────────────────────────
function Orb({ size, color, style }) {
  return (
    <motion.div
      animate={{ y: [0, -12, 0], x: [0, 6, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 5 + Math.random() * 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute', width: size, height: size, borderRadius: '50%',
        background: color, filter: 'blur(40px)', pointerEvents: 'none', ...style,
      }}
    />
  )
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ photoUrl, name, photoPos }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Pulsing ring */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233,160,32,.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Gold ring */}
      <div style={{
        width: 76, height: 76, borderRadius: '50%', overflow: 'hidden',
        border: '3px solid rgba(233,160,32,.7)',
        boxShadow: '0 0 0 2px rgba(233,160,32,.2), 0 8px 28px rgba(0,0,0,.45)',
        background: 'rgba(255,255,255,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {photoUrl
          ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photoPos || 'center 35%' }} />
          : <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: FONT }}>{initials}</span>
        }
      </div>
    </div>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function Stat({ label, value, color, accentBg, delay }) {
  if (value === null || value === undefined) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        flex: 1, textAlign: 'center',
        padding: '12px 8px',
        background: 'rgba(255,255,255,.055)',
        border: '1px solid rgba(255,255,255,.09)',
        borderRadius: 16,
        backdropFilter: 'blur(12px)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Coloured top edge */}
      <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: color, borderRadius: '0 0 4px 4px', opacity: 0.85 }} />
      <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: FONT, lineHeight: 1, letterSpacing: '-0.5px' }}>
        <Counter to={value} />
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.38)', fontWeight: 800, marginTop: 5, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT }}>
        {label}
      </div>
    </motion.div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PlayerDashboard() {
  const { user, profile, signOut } = useAuth()
  const [myPlayer, setMyPlayer]   = useState(null)
  const [loaded, setLoaded]       = useState(false)
  const [greeting, setGreeting]   = useState('Welcome back')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  useEffect(() => {
    if (!user) return
    const displayName = profile?.display_name || user?.user_metadata?.full_name || ''
    if (!displayName) { setLoaded(true); return }
    const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const dn = norm(displayName)
    fetch('/api/players').then(r => r.json()).then(({ players = [] }) => {
      let hit = players.find(p => norm(p.name) === dn)
      if (!hit) {
        const parts = dn.split(' ').filter(w => w.length > 2)
        hit = players.find(p => parts.length && parts.every(w => norm(p.name).includes(w)))
      }
      if (!hit) {
        const parts = dn.split(' ').filter(w => w.length > 2)
        hit = players.find(p => parts.filter(w => norm(p.name).includes(w)).length >= Math.ceil(parts.length * 0.6))
      }
      setMyPlayer(hit || null)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [user, profile])

  if (!user) return null

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'
  const [first, ...rest] = displayName.split(' ')
  const stats = myPlayer?.stats

  const statItems = [
    { label: 'Matches', value: stats?.matches, color: '#60a5fa' },
    { label: 'Runs',    value: stats?.runs,    color: '#4ade80' },
    { label: 'Wickets', value: stats?.wickets, color: '#f87171' },
    { label: 'Catches', value: stats?.catches, color: '#c084fc' },
  ].filter(s => s.value !== null && s.value !== undefined)

  const hasStats = statItems.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: 28, overflow: 'hidden', marginBottom: 16,
        position: 'relative',
        background: 'linear-gradient(145deg, #050e09 0%, #0b2e17 40%, #103d21 75%, #1a5c38 100%)',
        boxShadow: '0 20px 60px rgba(5,20,10,.6), 0 0 0 1px rgba(255,255,255,.06)',
        padding: '22px 18px 20px',
      }}
    >
      {/* ── Background orbs ── */}
      <Orb size={180} color="rgba(34,116,74,.35)"  style={{ top: -60,  right: -40 }} />
      <Orb size={140} color="rgba(233,160,32,.12)" style={{ bottom: -50, left: -30 }} />
      <Orb size={100} color="rgba(96,165,250,.08)" style={{ top: '40%', right: '30%' }} />

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* ── Player identity row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
        <Avatar photoUrl={myPlayer?.photoUrl} name={displayName} photoPos={myPlayer?.photoPos} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }}
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontFamily: FONT, fontWeight: 600, letterSpacing: 0.3 }}>
              {greeting} 👋
            </span>
          </motion.div>

          {/* Name */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ fontSize: 19, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {first}{' '}
            <span style={{ color: 'rgba(255,255,255,.38)', fontWeight: 600 }}>{rest.join(' ')}</span>
          </motion.div>

          {/* Chips */}
          {myPlayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}
            >
              {myPlayer.batStyle && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, fontFamily: FONT,
                  background: 'rgba(233,160,32,.15)', border: '1px solid rgba(233,160,32,.3)', color: '#fbbf24',
                }}>
                  🏏 {myPlayer.batStyle.replace(' Hand', '')}
                </span>
              )}
              {myPlayer.bowlStyle && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, fontFamily: FONT,
                  background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.22)', color: '#fca5a5',
                }}>
                  🔴 {myPlayer.bowlStyle.replace('Right-arm ', 'RA ').replace('Left-arm ', 'LA ')}
                </span>
              )}
            </motion.div>
          )}
        </div>

        {/* Sign out */}
        <motion.button
          onClick={() => signOut()}
          whileHover={{ scale: 1.08, background: 'rgba(255,255,255,.13)' }}
          whileTap={{ scale: 0.92 }}
          title="Sign out"
          style={{
            width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.1)',
            background: 'rgba(255,255,255,.06)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 15, transition: 'background .2s',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </motion.button>
      </div>

      {/* ── Divider ── */}
      {hasStats && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent)', margin: '16px 0 14px', transformOrigin: 'left', position: 'relative', zIndex: 1 }}
        />
      )}

      {/* ── Stats ── */}
      {hasStats && (
        <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
          {statItems.map(({ label, value, color }, i) => (
            <Stat key={label} label={label} value={value} color={color} delay={0.45 + i * 0.07} />
          ))}
        </div>
      )}

      {/* No stats */}
      {loaded && !hasStats && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,.28)', fontFamily: FONT, textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          🏏 No match stats recorded yet this season
        </motion.div>
      )}

      {/* Not in squad */}
      {loaded && !myPlayer && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 12, padding: '9px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,.3)', fontFamily: FONT, position: 'relative', zIndex: 1 }}
        >
          Profile not yet linked to squad — contact admin
        </motion.div>
      )}
    </motion.div>
  )
}
