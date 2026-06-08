import { useState } from 'react'
import { motion } from 'framer-motion'
import { C, FONT, ADMIN_PASSWORD } from '../../constants'
import Card from '../ui/Card'

const PW_KEY = 'tucc_admin_pw'

export function getAdminPassword() {
  return localStorage.getItem(PW_KEY) || ADMIN_PASSWORD
}

export default function TabSettings() {
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confPw, setConfPw]         = useState('')
  const [showCur, setShowCur]       = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [showConf, setShowConf]     = useState(false)
  const [err, setErr]               = useState('')
  const [ok, setOk]                 = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    const storedPw = getAdminPassword()
    if (currentPw !== storedPw) { setErr('Current password is incorrect'); return }
    if (newPw.length < 6)       { setErr('New password must be at least 6 characters'); return }
    if (newPw !== confPw)       { setErr('New passwords do not match'); return }
    localStorage.setItem(PW_KEY, newPw)
    setOk(true)
    setCurrentPw(''); setNewPw(''); setConfPw('')
    setTimeout(() => setOk(false), 3000)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 40px 11px 14px',
    border: `1.5px solid ${C.gray1}`, borderRadius: 12,
    background: '#fff', color: C.dark, fontSize: 14, fontFamily: FONT,
    outline: 'none', transition: 'border .2s',
  }

  const eyeBtn = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: C.gray3,
    cursor: 'pointer', fontSize: 14, padding: 0,
  }

  const labelStyle = { fontSize: 12, fontWeight: 700, color: C.gray4, fontFamily: FONT, marginBottom: 6, display: 'block' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 4 }}>🔒 Change Admin Password</div>
        <div style={{ fontSize: 13, color: C.gray3, fontFamily: FONT, marginBottom: 20, lineHeight: 1.5 }}>
          The new password will be saved locally on this device and used for future admin logins.
        </div>

        {ok && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#16a34a', fontFamily: FONT, fontSize: 14, fontWeight: 600 }}
          >
            ✅ Password updated successfully!
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Current password */}
          <div>
            <label style={labelStyle}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showCur ? 'text' : 'password'} value={currentPw}
                onChange={e => { setCurrentPw(e.target.value); setErr('') }}
                placeholder="Enter current password" style={inputStyle} autoFocus />
              <button type="button" onClick={() => setShowCur(v => !v)} style={eyeBtn}>{showCur ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} value={newPw}
                onChange={e => { setNewPw(e.target.value); setErr('') }}
                placeholder="Min. 6 characters" style={inputStyle} />
              <button type="button" onClick={() => setShowNew(v => !v)} style={eyeBtn}>{showNew ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {/* Strength bar */}
          {newPw.length > 0 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: -6 }}>
              {[4, 6, 10].map((thresh, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, transition: 'background .3s',
                  background: newPw.length >= thresh ? (i === 0 ? '#f87171' : i === 1 ? '#fbbf24' : '#3b82f6') : C.gray1 }} />
              ))}
              <span style={{ fontSize: 10, color: C.gray3, fontFamily: FONT, marginLeft: 4 }}>
                {newPw.length < 4 ? 'Weak' : newPw.length < 10 ? 'Fair' : 'Strong'}
              </span>
            </div>
          )}

          {/* Confirm password */}
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showConf ? 'text' : 'password'} value={confPw}
                onChange={e => { setConfPw(e.target.value); setErr('') }}
                placeholder="Repeat new password" style={inputStyle} />
              <button type="button" onClick={() => setShowConf(v => !v)} style={eyeBtn}>{showConf ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {err && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontFamily: FONT }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={!currentPw || !newPw || !confPw}
            style={{
              width: '100%', padding: '13px', borderRadius: 14, border: 'none',
              cursor: !currentPw || !newPw || !confPw ? 'not-allowed' : 'pointer',
              background: !currentPw || !newPw || !confPw
                ? C.gray1 : `linear-gradient(135deg,${C.greenDark},${C.green})`,
              color: !currentPw || !newPw || !confPw ? C.gray3 : '#fff',
              fontFamily: FONT, fontWeight: 700, fontSize: 14, marginTop: 4,
              boxShadow: !currentPw || !newPw || !confPw ? 'none' : '0 4px 20px rgba(37,99,235,.35)',
              transition: 'all .2s',
            }}
          >
            🔒 Update Admin Password
          </button>
        </form>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 10 }}>ℹ️ Password Notes</div>
        <ul style={{ margin: 0, padding: '0 0 0 18px', color: C.gray4, fontSize: 13, fontFamily: FONT, lineHeight: 1.8 }}>
          <li>Password is stored locally on this device</li>
          <li>If you clear browser data, the default password is restored</li>
          <li>Default password: <code style={{ background: C.gray1, padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>TUCC@2025</code></li>
          <li>Use a strong, unique password for better security</li>
        </ul>
      </Card>
    </div>
  )
}
