import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { C, FONT, MAX_WIDTH } from '../constants'
import { LogOut, Settings, ChevronRight, User } from 'lucide-react'

// ── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, bg }) {
  if (value === null || value === undefined) return null
  return (
    <div style={{
      flex: 1, minWidth: 70,
      background: bg,
      borderRadius: 14, padding: '10px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: FONT, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color, opacity: 0.7, fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: FONT }}>{label}</div>
    </div>
  )
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function DashAvatar({ photoUrl, name, size = 64 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', border: '3px solid #fff',
      boxShadow: '0 4px 16px rgba(0,0,0,.15)',
      background: C.greenBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {photoUrl ? (
        <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }} />
      ) : (
        <span style={{ fontSize: size * 0.35, fontWeight: 800, color: C.green, fontFamily: FONT }}>{initials}</span>
      )}
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function PlayerDashboard({ players = [] }) {
  const { user, profile, signOut } = useAuth()
  const nav = useNavigate()
  const [myPlayer, setMyPlayer] = useState(null)
  const [greeting, setGreeting] = useState('Welcome back')

  // Time-based greeting
  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Good morning')
    else if (h < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  // Try to match this user to a player in the squad
  useEffect(() => {
    if (!players.length) return
    const displayName = profile?.display_name || user?.user_metadata?.full_name || ''
    if (!displayName) return

    const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const dn = norm(displayName)

    // Try exact or partial match against player names
    let matched = players.find(p => norm(p.name) === dn)
    if (!matched) {
      const parts = dn.split(' ').filter(w => w.length > 2)
      matched = players.find(p => {
        const pn = norm(p.name)
        return parts.some(w => pn.includes(w))
      })
    }
    setMyPlayer(matched || null)
  }, [players, user, profile])

  if (!user) return null

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'
  const photoUrl = myPlayer?.photoUrl || profile?.avatar_url || null
  const stats = myPlayer?.stats || null
  const hasStats = stats && (stats.matches !== null || stats.runs !== null || stats.wickets !== null)

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: `linear-gradient(135deg, ${C.greenDark} 0%, #1a5c38 60%, #22744a 100%)`,
        borderRadius: 24,
        padding: '20px',
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(15,56,37,.4)',
      }}
    >
      {/* Subtle pattern */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(233,160,32,.12) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 120, height: 120,
        borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none',
      }} />

      {/* Top row: avatar + name + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <DashAvatar photoUrl={photoUrl} name={displayName} size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontFamily: FONT, fontWeight: 600, marginBottom: 2 }}>
            {greeting} 👋
          </div>
          <div style={{
            fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: FONT,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          {myPlayer && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontFamily: FONT, marginTop: 2 }}>
              🏏 {myPlayer.batStyle || ''}{myPlayer.batStyle && myPlayer.bowlStyle ? ' · ' : ''}{myPlayer.bowlStyle || ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <motion.button
            onClick={() => signOut()}
            whileTap={{ scale: 0.92 }}
            title="Sign out"
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,.1)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <LogOut size={15} color="rgba(255,255,255,.7)" />
          </motion.button>
        </div>
      </div>

      {/* Stats row */}
      {hasStats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', gap: 8, marginTop: 16, position: 'relative', zIndex: 1 }}
        >
          <StatPill label="Matches"  value={stats.matches}  color="#22744a" bg="rgba(255,255,255,.92)" />
          <StatPill label="Runs"     value={stats.runs}     color="#15803d" bg="rgba(255,255,255,.92)" />
          <StatPill label="Wickets"  value={stats.wickets}  color={C.red}   bg="rgba(255,255,255,.92)" />
          {stats.catches !== null && (
            <StatPill label="Catches"  value={stats.catches}  color="#7c3aed" bg="rgba(255,255,255,.92)" />
          )}
        </motion.div>
      )}

      {!myPlayer && (
        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: 'rgba(255,255,255,.08)', borderRadius: 12,
          fontSize: 12, color: 'rgba(255,255,255,.5)', fontFamily: FONT,
          display: 'flex', alignItems: 'center', gap: 8,
          position: 'relative', zIndex: 1,
        }}>
          <User size={13} color="rgba(255,255,255,.4)" />
          Your profile hasn't been linked to the squad yet. Contact the admin.
        </div>
      )}
    </motion.div>
  )
}
