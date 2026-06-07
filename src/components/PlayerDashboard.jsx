import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
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

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [newPw, setNewPw]   = useState('')
  const [confPw, setConfPw] = useState('')
  const [showNew, setShowNew]   = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [err, setErr]   = useState('')
  const [ok, setOk]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (newPw.length < 6)           { setErr('Password must be at least 6 characters'); return }
    if (newPw !== confPw)           { setErr('Passwords do not match'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setOk(true)
    setTimeout(onClose, 1600)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 40px 11px 14px',
    border: '1.5px solid rgba(255,255,255,.12)',
    borderRadius: 12, background: 'rgba(255,255,255,.06)',
    color: '#fff', fontSize: 14, fontFamily: FONT,
    outline: 'none', transition: 'border .2s',
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 380,
            background: 'linear-gradient(145deg,#0b2a16,#0f3825)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 24,
            padding: '28px 24px',
            boxShadow: '0 24px 80px rgba(0,0,0,.7)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: FONT }}>Change Password</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', fontFamily: FONT, marginTop: 2 }}>Set a new account password</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.08)', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          {ok ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ color: '#4ade80', fontWeight: 700, fontFamily: FONT, fontSize: 15 }}>Password updated!</div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* New password */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontFamily: FONT, fontWeight: 600, marginBottom: 6 }}>New Password</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); setErr('') }}
                    placeholder="Min. 6 characters"
                    style={inputStyle}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 14, padding: 0 }}>
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontFamily: FONT, fontWeight: 600, marginBottom: 6 }}>Confirm Password</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConf ? 'text' : 'password'}
                    value={confPw}
                    onChange={e => { setConfPw(e.target.value); setErr('') }}
                    placeholder="Repeat new password"
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowConf(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 14, padding: 0 }}>
                    {showConf ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Strength indicator */}
              {newPw.length > 0 && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[4,6,10].map((thresh, i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: newPw.length >= thresh ? (i === 0 ? '#f87171' : i === 1 ? '#fbbf24' : '#4ade80') : 'rgba(255,255,255,.1)', transition: 'background .3s' }} />
                  ))}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontFamily: FONT, marginLeft: 4 }}>
                    {newPw.length < 4 ? 'Weak' : newPw.length < 10 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              )}

              {err && (
                <div style={{ background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 10, padding: '9px 12px', color: '#fca5a5', fontSize: 12, fontFamily: FONT }}>
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !newPw || !confPw}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading || !newPw || !confPw ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#1a5c38,#22744a)',
                  color: loading || !newPw || !confPw ? 'rgba(255,255,255,.3)' : '#fff',
                  fontFamily: FONT, fontWeight: 700, fontSize: 14,
                  transition: 'all .2s', marginTop: 4,
                  boxShadow: loading || !newPw || !confPw ? 'none' : '0 4px 20px rgba(26,92,56,.5)',
                }}
              >
                {loading ? 'Updating…' : '🔒 Update Password'}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PlayerDashboard() {
  const { user, profile, signOut } = useAuth()
  const [myPlayer, setMyPlayer]       = useState(null)
  const [loaded, setLoaded]           = useState(false)
  const [greeting, setGreeting]       = useState('Welcome back')
  const [showChangePw, setShowChangePw] = useState(false)

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

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {/* Change password */}
          <motion.button
            onClick={() => setShowChangePw(true)}
            whileHover={{ scale: 1.08, background: 'rgba(255,255,255,.13)' }}
            whileTap={{ scale: 0.92 }}
            title="Change password"
            style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.1)',
              background: 'rgba(255,255,255,.06)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, transition: 'background .2s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </motion.button>

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
              fontSize: 15, transition: 'background .2s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </motion.button>
        </div>
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

      {/* Change password modal */}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </motion.div>
  )
}
