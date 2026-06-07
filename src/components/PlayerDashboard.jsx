import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { C, FONT } from '../constants'

function DashAvatar({ photoUrl, name, photoPos, size = 64 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden',
      border: '2.5px solid rgba(255,255,255,0.25)',
      boxShadow: '0 0 0 2.5px rgba(233,160,32,0.5), 0 6px 20px rgba(0,0,0,.3)',
      background: 'rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {photoUrl
        ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photoPos || 'center 35%' }} />
        : <span style={{ fontSize: size * 0.34, fontWeight: 900, color: '#fff', fontFamily: FONT }}>{initials}</span>
      }
    </div>
  )
}

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

    fetch('/api/players').then(r => r.json()).then(data => {
      const squad = data.players || []
      let hit = squad.find(p => norm(p.name) === dn)
      if (!hit) {
        const parts = dn.split(' ').filter(w => w.length > 2)
        hit = squad.find(p => parts.length > 0 && parts.every(w => norm(p.name).includes(w)))
      }
      if (!hit) {
        const parts = dn.split(' ').filter(w => w.length > 2)
        hit = squad.find(p => parts.filter(w => norm(p.name).includes(w)).length >= Math.ceil(parts.length * 0.6))
      }
      setMyPlayer(hit || null)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [user, profile])

  if (!user) return null

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'
  const [first, ...rest] = displayName.split(' ')
  const stats = myPlayer?.stats || null
  const hasStats = stats && [stats.matches, stats.runs, stats.wickets].some(v => v !== null)

  const statItems = [
    { label: 'Matches', value: stats?.matches, color: '#60a5fa' },
    { label: 'Runs',    value: stats?.runs,    color: '#4ade80' },
    { label: 'Wickets', value: stats?.wickets, color: '#f87171' },
    { label: 'Catches', value: stats?.catches, color: '#c084fc' },
  ].filter(s => s.value !== null && s.value !== undefined)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        background: 'linear-gradient(145deg, #071a10 0%, #0e3320 55%, #1a5c38 100%)',
        borderRadius: 24,
        padding: '20px 20px 18px',
        marginBottom: 16,
        boxShadow: '0 12px 40px rgba(10,40,20,.45)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative glows */}
      <div style={{ position: 'absolute', top: -50, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,160,32,.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,116,74,.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Player identity ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <DashAvatar photoUrl={myPlayer?.photoUrl} name={displayName} photoPos={myPlayer?.photoPos} size={62} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Live dot + greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px #4ade80', flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontFamily: FONT, fontWeight: 600 }}>{greeting}</span>
          </div>

          {/* Name */}
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {first}{' '}
            <span style={{ color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{rest.join(' ')}</span>
          </div>

          {/* Style chips */}
          {myPlayer && (
            <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
              {myPlayer.batStyle && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(233,160,32,.13)', border: '1px solid rgba(233,160,32,.28)', color: '#fbbf24', fontFamily: FONT }}>
                  🏏 {myPlayer.batStyle.replace(' Hand', '')}
                </span>
              )}
              {myPlayer.bowlStyle && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.22)', color: '#fca5a5', fontFamily: FONT }}>
                  🔴 {myPlayer.bowlStyle.replace('Right-arm ', 'RA ').replace('Left-arm ', 'LA ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      {hasStats && (
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '16px 0 14px', position: 'relative', zIndex: 1 }} />
      )}

      {/* ── Stats row ── */}
      {hasStats && (
        <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
          {statItems.map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1,
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 14,
              padding: '10px 6px',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: FONT, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: FONT }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Not linked yet */}
      {loaded && !myPlayer && (
        <div style={{ marginTop: 14, padding: '9px 12px', background: 'rgba(255,255,255,.05)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,.35)', fontFamily: FONT, position: 'relative', zIndex: 1 }}>
          🏏 Profile not yet linked to squad — contact admin
        </div>
      )}
    </motion.div>
  )
}
