import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { FONT } from '../constants'

const EASE = [0.32, 0.72, 0, 1]

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to }) {
  const count   = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v))
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const unsub = rounded.on('change', v => setDisplay(v))
    const ctrl  = animate(count, to ?? 0, { duration: 1.4, ease: EASE })
    return () => { ctrl.stop(); unsub() }
  }, [to])
  return <span>{display}</span>
}

// ── Info chip ─────────────────────────────────────────────────────────────────
function InfoChip({ label, value, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      style={{
        background: 'rgba(255,255,255,.055)',
        border: '1px solid rgba(255,255,255,.09)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: FONT, fontSize: 9, fontWeight: 800,
        color: 'rgba(233,160,32,.75)', textTransform: 'uppercase', letterSpacing: 1.2,
      }}>
        <span style={{ fontSize: 10 }}>{icon}</span>
        {label}
      </div>
      <div style={{
        fontFamily: FONT, fontSize: 13, fontWeight: 800, color: '#fff',
        lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {value || 'N/A'}
      </div>
    </motion.div>
  )
}

// ── Stat block ────────────────────────────────────────────────────────────────
function StatBlock({ label, value, delay, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: EASE }}
      style={{
        flex: 1, textAlign: 'center', padding: '12px 6px',
        borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,.07)',
        position: 'relative',
      }}
    >
      <div style={{
        fontFamily: FONT, fontSize: 30, fontWeight: 900,
        color: '#e9a020', lineHeight: 1, letterSpacing: '-1px',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value !== null && value !== undefined ? <Counter to={value} /> : '—'}
      </div>
      <div style={{
        fontFamily: FONT, fontSize: 9, fontWeight: 800,
        color: 'rgba(255,255,255,.35)', textTransform: 'uppercase',
        letterSpacing: 1.5, marginTop: 5,
      }}>
        {label}
      </div>
    </motion.div>
  )
}

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [newPw, setNewPw]       = useState('')
  const [confPw, setConfPw]     = useState('')
  const [showNew, setShowNew]   = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')
  const [ok, setOk]             = useState(false)

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault(); setErr('')
    if (newPw.length < 6) { setErr('Password must be at least 6 characters'); return }
    if (newPw !== confPw) { setErr('Passwords do not match'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setOk(true); setTimeout(onClose, 1600)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 40px 11px 14px',
    border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 12,
    background: 'rgba(255,255,255,.06)', color: '#fff',
    fontSize: 14, fontFamily: FONT, outline: 'none',
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
          transition={{ duration: 0.35, ease: EASE }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 380,
            background: 'linear-gradient(145deg,#060d2e,#1e3a8a)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 24, padding: '28px 24px',
            boxShadow: '0 24px 80px rgba(0,0,0,.7)',
          }}
        >
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
              <div style={{ color: '#60a5fa', fontWeight: 700, fontFamily: FONT, fontSize: 15 }}>Password updated!</div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontFamily: FONT, fontWeight: 600, marginBottom: 6 }}>New Password</div>
                <div style={{ position: 'relative' }}>
                  <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => { setNewPw(e.target.value); setErr('') }} placeholder="Min. 6 characters" style={inputStyle} autoFocus />
                  <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 14, padding: 0 }}>{showNew ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontFamily: FONT, fontWeight: 600, marginBottom: 6 }}>Confirm Password</div>
                <div style={{ position: 'relative' }}>
                  <input type={showConf ? 'text' : 'password'} value={confPw} onChange={e => { setConfPw(e.target.value); setErr('') }} placeholder="Repeat new password" style={inputStyle} />
                  <button type="button" onClick={() => setShowConf(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 14, padding: 0 }}>{showConf ? '🙈' : '👁️'}</button>
                </div>
              </div>
              {newPw.length > 0 && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[4,6,10].map((thresh, i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: newPw.length >= thresh ? (i === 0 ? '#f87171' : i === 1 ? '#fbbf24' : '#60a5fa') : 'rgba(255,255,255,.1)', transition: 'background .3s' }} />
                  ))}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontFamily: FONT, marginLeft: 4 }}>
                    {newPw.length < 4 ? 'Weak' : newPw.length < 10 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              )}
              {err && (
                <div style={{ background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 10, padding: '9px 12px', color: '#fca5a5', fontSize: 12, fontFamily: FONT }}>{err}</div>
              )}
              <button type="submit" disabled={loading || !newPw || !confPw}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading || !newPw || !confPw ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: loading || !newPw || !confPw ? 'rgba(255,255,255,.3)' : '#fff',
                  fontFamily: FONT, fontWeight: 700, fontSize: 14, marginTop: 4,
                  boxShadow: loading || !newPw || !confPw ? 'none' : '0 4px 20px rgba(37,99,235,.5)',
                }}>
                {loading ? 'Updating…' : '🔒 Update Password'}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function PlayerDashboard() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [myPlayer, setMyPlayer]         = useState(null)
  const [loaded, setLoaded]             = useState(false)
  const [greeting, setGreeting]         = useState('Welcome back')
  const [showChangePw, setShowChangePw]   = useState(false)
  const [imgOk, setImgOk]                 = useState(true)
  const [photoHover, setPhotoHover]       = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoMsg, setPhotoMsg]           = useState(null) // { type: 'ok'|'err', text }
  const fileInputRef = useRef(null)

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoMsg({ type:'err', text:'Please choose an image file (JPG, PNG, WebP).' })
      setTimeout(() => setPhotoMsg(null), 3500)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMsg({ type:'err', text:'Photo must be under 5 MB.' })
      setTimeout(() => setPhotoMsg(null), 3500)
      return
    }
    const ext = file.name.split('.').pop().toLowerCase() || 'jpg'
    const path = `player-photos/${user.id}/profile.${ext}`
    setPhotoUploading(true)
    setPhotoMsg(null)
    const { error: upErr } = await supabase.storage
      .from('team-media')
      .upload(path, file, { cacheControl: '60', upsert: true })
    if (upErr) {
      setPhotoUploading(false)
      setPhotoMsg({ type:'err', text: 'Upload failed — ' + upErr.message })
      setTimeout(() => setPhotoMsg(null), 4000)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('team-media').getPublicUrl(path)
    // Bust cache by appending a timestamp query param
    const bustedUrl = `${publicUrl}?t=${Date.now()}`
    try {
      await updateProfile({ avatar_url: bustedUrl })
      setImgOk(true)
      setPhotoMsg({ type:'ok', text:'Photo updated! 🎉' })
    } catch {
      setPhotoMsg({ type:'err', text:'Saved photo but could not update profile.' })
    }
    setPhotoUploading(false)
    setTimeout(() => setPhotoMsg(null), 3000)
  }

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
  const forename = myPlayer?.forename || displayName.split(' ')[0]
  const surname  = myPlayer?.surname  || displayName.split(' ').slice(1).join(' ')
  const stats    = myPlayer?.stats
  const hasStats = stats && (stats.matches != null || stats.runs != null || stats.wickets != null)

  const playCricketUrl = 'https://dtucc.play-cricket.com/Statistics'

  const infoItems = [
    { label: 'Batting',     value: myPlayer?.batStyle,   icon: '🏏' },
    { label: 'Bowling',     value: myPlayer?.bowlStyle,  icon: '🔴' },
    { label: 'Age Group',   value: myPlayer?.ageGroup,   icon: '👤' },
    { label: 'Player Type', value: myPlayer?.playerType, icon: '🏠' },
  ]

  const statItems = [
    { label: 'Matches', value: stats?.matches },
    { label: 'Runs',    value: stats?.runs    },
    { label: 'Wickets', value: stats?.wickets },
  ]

  return (
    <>
      {/* ── Outer shell (Double-Bezel) ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{
          borderRadius: 24,
          background: 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.1)',
          padding: 3,
          marginBottom: 16,
          boxShadow: '0 24px 64px rgba(15,23,42,.5), 0 0 0 1px rgba(255,255,255,.04)',
        }}
      >
        {/* ── Inner core ── */}
        <div style={{
          borderRadius: 22, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(145deg, #060d2e 0%, #0f1e5a 40%, #1a1060 70%, #0a0730 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,.08)',
        }}>

          {/* Ambient orbs */}
          <motion.div animate={{ scale:[1,1.2,1], opacity:[.15,.04,.15] }} transition={{ duration:7, repeat:Infinity, ease:'easeInOut' }}
            style={{ position:'absolute', top:-60, right:-40, width:220, height:220, borderRadius:'50%', background:'rgba(99,102,241,.3)', filter:'blur(50px)', pointerEvents:'none' }}/>
          <motion.div animate={{ scale:[1,1.15,1], opacity:[.12,.03,.12] }} transition={{ duration:9, repeat:Infinity, ease:'easeInOut', delay:2 }}
            style={{ position:'absolute', bottom:-50, left:-30, width:180, height:180, borderRadius:'50%', background:'rgba(233,160,32,.15)', filter:'blur(40px)', pointerEvents:'none' }}/>

          {/* Subtle grid overlay */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', opacity:.35,
            backgroundImage:'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)',
            backgroundSize:'32px 32px',
          }}/>

          {/* Gold top accent bar */}
          <div style={{ height:2, background:'linear-gradient(90deg,transparent,#e9a020 30%,#f59e0b 50%,#e9a020 70%,transparent)', position:'relative', zIndex:1 }}/>

          <div style={{ padding: '16px 18px 0', position:'relative', zIndex:1 }}>

            {/* ── Top row: club badge + actions ── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              {/* Club badge */}
              <div style={{
                display:'flex', alignItems:'center', gap:7,
                border:'1px solid rgba(233,160,32,.35)', borderRadius:8,
                padding:'5px 10px', background:'rgba(233,160,32,.06)',
              }}>
                <span style={{ fontSize:11 }}>🛡️</span>
                <span style={{ fontFamily:FONT, fontSize:10, fontWeight:900, color:'rgba(233,160,32,.85)', letterSpacing:1.5, textTransform:'uppercase' }}>
                  Tamil United CC
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:6 }}>
                {/* Greeting pill */}
                <div style={{
                  display:'flex', alignItems:'center', gap:5,
                  background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)',
                  borderRadius:20, padding:'5px 10px',
                }}>
                  <motion.span animate={{ opacity:[1,.3,1] }} transition={{ duration:2.2, repeat:Infinity }}
                    style={{ width:5, height:5, borderRadius:'50%', background:'#67e8f9', display:'inline-block', boxShadow:'0 0 6px #67e8f9' }}/>
                  <span style={{ fontFamily:FONT, fontSize:10, fontWeight:600, color:'rgba(255,255,255,.4)' }}>
                    {greeting}
                  </span>
                </div>
                {/* Change password */}
                <motion.button onClick={() => setShowChangePw(true)}
                  whileHover={{ scale:1.08, background:'rgba(255,255,255,.12)' }} whileTap={{ scale:0.92 }}
                  title="Change password"
                  style={{ width:32, height:32, borderRadius:'50%', border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </motion.button>
                {/* Sign out */}
                <motion.button onClick={() => signOut()}
                  whileHover={{ scale:1.08, background:'rgba(255,255,255,.12)' }} whileTap={{ scale:0.92 }}
                  title="Sign out"
                  style={{ width:32, height:32, borderRadius:'50%', border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* ── Main content: two-column layout ── */}
            <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>

              {/* LEFT — photo + name identity */}
              <motion.div
                initial={{ opacity:0, x:-16 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:.15, duration:.55, ease:EASE }}
                style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:12, minWidth:130 }}
              >
                {/* Photo */}
                <div style={{ position:'relative' }}>
                  {/* Ambient glow ring */}
                  <motion.div animate={{ scale:[1,1.1,1], opacity:[.4,.1,.4] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                    style={{ position:'absolute', inset:-8, borderRadius:'50%', background:'radial-gradient(circle, rgba(233,160,32,.4) 0%, transparent 70%)', pointerEvents:'none' }}/>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display:'none' }}
                    onChange={handlePhotoChange}
                  />

                  {/* Photo circle with hover overlay */}
                  <div
                    onMouseEnter={() => setPhotoHover(true)}
                    onMouseLeave={() => setPhotoHover(false)}
                    onClick={() => !photoUploading && fileInputRef.current?.click()}
                    title="Change profile photo"
                    style={{
                      width:100, height:100, borderRadius:'50%', overflow:'hidden',
                      border:`3px solid ${photoHover ? 'rgba(99,102,241,.9)' : 'rgba(233,160,32,.65)'}`,
                      boxShadow: photoHover
                        ? '0 0 0 4px rgba(99,102,241,.25), 0 12px 36px rgba(0,0,0,.5)'
                        : '0 0 0 2px rgba(233,160,32,.15), 0 12px 36px rgba(0,0,0,.5)',
                      background:'rgba(255,255,255,.06)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      position:'relative', zIndex:1,
                      cursor: photoUploading ? 'not-allowed' : 'pointer',
                      transition:'border-color .2s, box-shadow .2s',
                    }}
                  >
                    {/* Actual photo — profile.photo_url takes priority over BTCL photo */}
                    {(profile?.avatar_url || (myPlayer?.photoUrl && imgOk))
                      ? <img
                          src={profile?.avatar_url || myPlayer.photoUrl}
                          alt={displayName}
                          style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition: myPlayer?.photoPos || 'center 35%', transition:'filter .2s', filter: photoHover ? 'brightness(0.45)' : 'none' }}
                          onError={() => setImgOk(false)}
                        />
                      : <span style={{ fontSize:32, fontWeight:900, color:'#fff', fontFamily:FONT, filter: photoHover ? 'brightness(0.3)' : 'none', transition:'filter .2s' }}>
                          {(forename[0]||'?').toUpperCase()}{(surname[0]||'').toUpperCase()}
                        </span>
                    }

                    {/* Hover overlay */}
                    <AnimatePresence>
                      {(photoHover || photoUploading) && (
                        <motion.div
                          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                          transition={{ duration:0.18 }}
                          style={{
                            position:'absolute', inset:0, borderRadius:'50%',
                            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                            background: photoUploading ? 'rgba(0,0,0,.65)' : 'rgba(15,23,42,.6)',
                            backdropFilter:'blur(2px)',
                            pointerEvents:'none',
                          }}
                        >
                          {photoUploading
                            ? (
                              <motion.div
                                animate={{ rotate:360 }} transition={{ duration:0.9, repeat:Infinity, ease:'linear' }}
                                style={{ width:22, height:22, borderRadius:'50%', border:'2.5px solid rgba(255,255,255,.15)', borderTopColor:'#fff' }}
                              />
                            ) : (
                              <>
                                {/* Camera icon */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                  <circle cx="12" cy="13" r="4"/>
                                </svg>
                                <span style={{ fontFamily:FONT, fontSize:8, fontWeight:800, color:'rgba(255,255,255,.8)', letterSpacing:.5, textTransform:'uppercase' }}>Change</span>
                              </>
                            )
                          }
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Status message pill */}
                  <AnimatePresence>
                    {photoMsg && (
                      <motion.div
                        initial={{ opacity:0, y:6, scale:0.9 }}
                        animate={{ opacity:1, y:0, scale:1 }}
                        exit={{ opacity:0, y:4, scale:0.9 }}
                        transition={{ duration:0.22 }}
                        style={{
                          position:'absolute', bottom:-36, left:'50%', transform:'translateX(-50%)',
                          whiteSpace:'nowrap', zIndex:10,
                          background: photoMsg.type === 'ok' ? 'rgba(22,163,74,.92)' : 'rgba(220,38,38,.92)',
                          borderRadius:20, padding:'5px 12px',
                          fontFamily:FONT, fontSize:11, fontWeight:700, color:'#fff',
                          boxShadow:'0 4px 16px rgba(0,0,0,.3)',
                        }}
                      >
                        {photoMsg.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Name */}
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:FONT, fontSize:22, fontWeight:900, color:'#fff', lineHeight:1, letterSpacing:'-0.5px', textTransform:'uppercase' }}>
                    {forename}
                  </div>
                  {surname && (
                    <div style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:'rgba(255,255,255,.5)', letterSpacing:2, textTransform:'uppercase', marginTop:3 }}>
                      {surname}
                    </div>
                  )}
                </div>

                {/* ID chips */}
                {myPlayer?.id && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.09)', borderRadius:6, padding:'3px 8px' }}>
                      <span style={{ fontFamily:FONT, fontSize:9, fontWeight:700, color:'rgba(255,255,255,.35)', letterSpacing:.5 }}># ID:</span>
                      <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:'rgba(255,255,255,.6)' }}>{myPlayer.id}</span>
                    </div>
                  </div>
                )}

                {/* Play Cricket CTA */}
                {(
                  <motion.a
                    href={playCricketUrl} target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale:1.03, boxShadow:'0 6px 22px rgba(233,160,32,.45)' }}
                    whileTap={{ scale:0.97 }}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      background:'linear-gradient(135deg,#e9a020,#f59e0b)',
                      borderRadius:10, padding:'9px 14px',
                      fontFamily:FONT, fontSize:10, fontWeight:900,
                      color:'#0f172a', textDecoration:'none', letterSpacing:.8, textTransform:'uppercase',
                      boxShadow:'0 4px 16px rgba(233,160,32,.3)',
                      width:'100%', boxSizing:'border-box',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Play Cricket Profile
                  </motion.a>
                )}
              </motion.div>

              {/* RIGHT — info grid + stats */}
              <motion.div
                initial={{ opacity:0, x:16 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:.25, duration:.55, ease:EASE }}
                style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:10 }}
              >
                {/* Info chips 2×2 grid */}
                {myPlayer && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {infoItems.map((item, i) => (
                      <motion.div key={item.label}
                        initial={{ opacity:0, y:10 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay:.3 + i*.06, duration:.4, ease:EASE }}
                      >
                        <InfoChip label={item.label} value={item.value} icon={item.icon} />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* No profile yet */}
                {loaded && !myPlayer && (
                  <div style={{
                    padding:'16px', background:'rgba(255,255,255,.03)',
                    border:'1px solid rgba(255,255,255,.06)', borderRadius:14,
                    fontFamily:FONT, fontSize:12, color:'rgba(255,255,255,.28)', textAlign:'center',
                  }}>
                    Profile not yet linked to squad — contact admin
                  </div>
                )}

                {/* Stats row */}
                {hasStats && (
                  <div style={{
                    background:'rgba(255,255,255,.04)',
                    border:'1px solid rgba(255,255,255,.07)',
                    borderRadius:14, display:'flex', overflow:'hidden',
                  }}>
                    {statItems.map(({ label, value }, i) => (
                      <StatBlock
                        key={label} label={label} value={value}
                        delay={.45 + i*.07} isLast={i === statItems.length - 1}
                      />
                    ))}
                  </div>
                )}

                {/* No stats yet */}
                {loaded && myPlayer && !hasStats && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.5 }}
                    style={{ fontSize:11, color:'rgba(255,255,255,.22)', fontFamily:FONT, textAlign:'center', padding:'8px 0' }}>
                    🏏 No season stats recorded yet
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Bottom padding spacer */}
            <div style={{ height:18 }}/>
          </div>
        </div>
      </motion.div>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </>
  )
}
