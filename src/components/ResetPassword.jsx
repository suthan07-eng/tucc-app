import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import { FONT } from '../constants'

const EASE = [0.32, 0.72, 0, 1]

export default function ResetPassword() {
  const nav = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [busy, setBusy]           = useState(false)
  const [err, setErr]             = useState('')
  const [done, setDone]           = useState(false)
  const [validSession, setValidSession] = useState(false)

  // Supabase sends the token in the URL hash — wait for auth state to pick it up
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setValidSession(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (password.length < 6) { setErr('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setErr('Passwords do not match.'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) { setErr(error.message || 'Failed to update password.'); return }
    setDone(true)
    setTimeout(() => nav('/login', { replace: true }), 2500)
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'linear-gradient(160deg, #020818 0%, #0f1f5c 28%, #1e1b4b 60%, #0d0a2e 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, padding: '20px',
    }}>
      {/* Background orbs */}
      {[
        { w:320,h:320,top:'-80px',left:'-80px',color:'rgba(37,99,235,.5)' },
        { w:250,h:250,bottom:'40px',right:'-60px',color:'rgba(109,40,217,.4)' },
      ].map((b,i) => (
        <motion.div key={i}
          animate={{ scale:[1,1.12,1] }} transition={{ duration:8+i*2, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'fixed', width:b.w, height:b.h, borderRadius:'50%', background:b.color, filter:'blur(70px)', top:b.top, left:b.left, bottom:b.bottom, right:b.right, pointerEvents:'none' }}
        />
      ))}

      <motion.div
        initial={{ opacity:0, y:24, scale:0.97 }}
        animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.55, ease:EASE }}
        style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}
      >
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background:'rgba(255,255,255,.06)', border:'3px solid rgba(233,160,32,.6)',
            boxShadow:'0 0 0 2px rgba(233,160,32,.2), 0 8px 32px rgba(0,0,0,.4)',
            display:'inline-flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
          }}>
            <img src="/logo.png" alt="TUCC" style={{ width:56, height:56, objectFit:'contain' }}/>
          </div>
          <div style={{ color:'#fff', fontSize:22, fontWeight:900, marginTop:14, letterSpacing:'-0.3px' }}>
            Reset Your Password
          </div>
          <div style={{ color:'rgba(255,255,255,.45)', fontSize:13, marginTop:5 }}>
            Tamil United CC · Members Portal
          </div>
        </div>

        {/* Card */}
        <div style={{ borderRadius:20, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', padding:3 }}>
          <div style={{ borderRadius:18, background:'linear-gradient(145deg,#0d1535 0%,#111a3e 60%,#0a0f2a 100%)', padding:'28px 24px' }}>

            {done ? (
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
                <div style={{ color:'#86efac', fontSize:17, fontWeight:800 }}>Password updated!</div>
                <div style={{ color:'rgba(255,255,255,.45)', fontSize:13, marginTop:6 }}>Redirecting you to login…</div>
              </motion.div>
            ) : !validSession ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:42, marginBottom:12 }}>⏳</div>
                <div style={{ color:'rgba(255,255,255,.7)', fontSize:15, fontWeight:600 }}>Verifying reset link…</div>
                <div style={{ color:'rgba(255,255,255,.35)', fontSize:12, marginTop:6 }}>
                  If this takes too long, your link may have expired.{' '}
                  <button onClick={() => nav('/login')} style={{ color:'#60a5fa', background:'none', border:'none', cursor:'pointer', fontFamily:FONT, fontWeight:700, fontSize:12 }}>
                    Go back →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ color:'rgba(255,255,255,.5)', fontSize:13, marginBottom:22, textAlign:'center' }}>
                  Enter a new password for your account
                </div>

                {/* New password */}
                <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:14, display:'flex', alignItems:'center', gap:10, padding:'0 14px', marginBottom:12, height:52 }}>
                  <span style={{ fontSize:18 }}>🔒</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="New password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontFamily:FONT, fontSize:15, fontWeight:500 }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.45)', fontSize:16, padding:0 }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>

                {/* Confirm password */}
                <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:14, display:'flex', alignItems:'center', gap:10, padding:'0 14px', marginBottom:20, height:52 }}>
                  <span style={{ fontSize:18 }}>🔐</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    style={{ flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontFamily:FONT, fontSize:15, fontWeight:500 }}
                  />
                </div>

                {err && (
                  <div style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.25)', borderRadius:10, padding:'10px 14px', color:'#fca5a5', fontSize:13, marginBottom:16, textAlign:'center' }}>
                    {err}
                  </div>
                )}

                <button
                  type="submit" disabled={busy}
                  style={{
                    width:'100%', height:52, borderRadius:14, border:'none', cursor:busy?'default':'pointer',
                    background:'linear-gradient(135deg,#2563eb,#4f46e5)', color:'#fff',
                    fontFamily:FONT, fontSize:16, fontWeight:800, letterSpacing:0.2,
                    opacity:busy?0.7:1, transition:'opacity .2s',
                    boxShadow:'0 4px 20px rgba(37,99,235,.4)',
                  }}
                >
                  {busy ? 'Updating…' : '🔑 Set New Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
