import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { C, FONT } from '../constants'
import { LogOut, Shield, Zap, Target, Award } from 'lucide-react'

// ── Avatar ───────────────────────────────────────────────────────────────────
function DashAvatar({ photoUrl, name, photoPos, size = 72 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden',
      border: '3px solid rgba(255,255,255,0.3)',
      boxShadow: '0 0 0 3px rgba(233,160,32,0.4), 0 8px 24px rgba(0,0,0,.3)',
      background: 'rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {photoUrl ? (
        <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photoPos || 'center 35%' }} />
      ) : (
        <span style={{ fontSize: size * 0.35, fontWeight: 900, color: '#fff', fontFamily: FONT }}>{initials}</span>
      )}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient, delay }) {
  if (value === null || value === undefined) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        flex: 1, minWidth: 0,
        background: gradient,
        borderRadius: 18,
        padding: '14px 12px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,.12)',
      }}
    >
      {/* Shine */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,.15) 0%, transparent 100%)',
        borderRadius: '18px 18px 0 0', pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 18, marginBottom: 4 }}>
        <Icon size={18} color="rgba(255,255,255,.7)" strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1, letterSpacing: '-0.5px' }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.65)', fontWeight: 800, marginTop: 5, textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT }}>
        {label}
      </div>
    </motion.div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function PlayerDashboard() {
  const { user, profile, signOut } = useAuth()
  const [myPlayer, setMyPlayer] = useState(null)
  const [btclLoaded, setBtclLoaded] = useState(false)
  const [greeting, setGreeting] = useState('Welcome back')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Good morning')
    else if (h < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  useEffect(() => {
    if (!user) return
    const displayName = profile?.display_name || user?.user_metadata?.full_name || ''
    if (!displayName) { setBtclLoaded(true); return }

    fetch('/api/players')
      .then(r => r.json())
      .then(data => {
        const squad = data.players || []
        const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim()
        const dn = norm(displayName)
        let matched = squad.find(p => norm(p.name) === dn)
        if (!matched) {
          const parts = dn.split(' ').filter(w => w.length > 2)
          matched = squad.find(p => parts.length > 0 && parts.every(w => norm(p.name).includes(w)))
        }
        if (!matched) {
          const parts = dn.split(' ').filter(w => w.length > 2)
          matched = squad.find(p => {
            const pn = norm(p.name)
            return parts.filter(w => pn.includes(w)).length >= Math.ceil(parts.length * 0.6)
          })
        }
        setMyPlayer(matched || null)
        setBtclLoaded(true)
      })
      .catch(() => setBtclLoaded(true))
  }, [user, profile])

  if (!user) return null

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'
  const firstName = displayName.split(' ')[0]
  const stats = myPlayer?.stats || null
  const hasStats = stats && (stats.matches !== null || stats.runs !== null || stats.wickets !== null)

  // Role badge colour
  const roleColor = myPlayer?.bowlStyle?.toLowerCase().includes('bat') ? '#f59e0b'
    : myPlayer?.bowlStyle ? '#ef4444' : '#22c55e'

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 16,
        boxShadow: '0 16px 48px rgba(15,56,37,.35)',
        position: 'relative',
      }}
    >
      {/* ── Hero band ── */}
      <div style={{
        background: 'linear-gradient(135deg, #071a10 0%, #0f3825 45%, #1a5c38 100%)',
        padding: '22px 20px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,160,32,.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,116,74,.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        {/* Top row: avatar + info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <DashAvatar photoUrl={myPlayer?.photoUrl} name={displayName} photoPos={myPlayer?.photoPos} size={68} />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Greeting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontFamily: FONT, fontWeight: 600, letterSpacing: 0.5 }}>
                {greeting}
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1.1, letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {firstName} <span style={{ color: 'rgba(255,255,255,.45)', fontWeight: 700 }}>{displayName.split(' ').slice(1).join(' ')}</span>
            </div>

            {/* Role + style chips */}
            {myPlayer && (
              <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                {myPlayer.batStyle && (
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT, padding: '3px 8px', borderRadius: 99, background: 'rgba(233,160,32,.15)', border: '1px solid rgba(233,160,32,.3)', color: '#e9a020' }}>
                    🏏 {myPlayer.batStyle.replace('Hand', '').trim()}
                  </span>
                )}
                {myPlayer.bowlStyle && (
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT, padding: '3px 8px', borderRadius: 99, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5' }}>
                    🔴 {myPlayer.bowlStyle.replace('Right-arm ', 'RA ').replace('Left-arm ', 'LA ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Logout */}
          <motion.button
            onClick={() => signOut()}
            whileTap={{ scale: 0.9 }}
            title="Sign out"
            style={{
              width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,.12)',
              background: 'rgba(255,255,255,.07)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backdropFilter: 'blur(8px)',
            }}
          >
            <LogOut size={15} color="rgba(255,255,255,.6)" />
          </motion.button>
        </div>
      </div>

      {/* ── Stats cards — overlap the hero band ── */}
      {hasStats && (
        <div style={{
          display: 'flex', gap: 10,
          padding: '0 16px',
          marginTop: -36,
          position: 'relative', zIndex: 2,
        }}>
          <StatCard icon={Shield} label="Matches" value={stats.matches}
            gradient="linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" delay={0.1} />
          <StatCard icon={Zap} label="Runs" value={stats.runs}
            gradient="linear-gradient(135deg, #15803d 0%, #22c55e 100%)" delay={0.15} />
          <StatCard icon={Target} label="Wickets" value={stats.wickets}
            gradient="linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)" delay={0.2} />
          {stats.catches !== null && (
            <StatCard icon={Award} label="Catches" value={stats.catches}
              gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)" delay={0.25} />
          )}
        </div>
      )}

      {/* ── Bottom white section ── */}
      <div style={{
        background: '#fff',
        padding: hasStats ? '16px 16px 18px' : '12px 16px 18px',
        borderTop: 'none',
      }}>
        {/* No stats yet */}
        {btclLoaded && (!hasStats) && (
          <div style={{ padding: '8px 0 4px', fontSize: 12, color: C.gray3, fontFamily: FONT, textAlign: 'center' }}>
            🏏 No match stats yet this season
          </div>
        )}

        {/* BTCL # badge */}
        {myPlayer && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: hasStats ? 14 : 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{
                fontSize: 11, fontWeight: 800, fontFamily: FONT,
                padding: '4px 10px', borderRadius: 99,
                background: C.greenBg, color: C.green,
                border: `1px solid ${C.gray2}`,
              }}>
                BTCL #{myPlayer.id}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, fontFamily: FONT,
                padding: '4px 10px', borderRadius: 99,
                background: '#f0f9ff', color: '#0369a1',
                border: '1px solid #bae6fd',
              }}>
                {myPlayer.ageGroup || 'Pro'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.gray3, fontFamily: FONT }}>
              #{myPlayer.playerType || 'Home'}
            </div>
          </div>
        )}

        {btclLoaded && !myPlayer && (
          <div style={{ fontSize: 12, color: C.gray3, fontFamily: FONT, textAlign: 'center', padding: '4px 0' }}>
            Profile not yet linked to squad — contact admin
          </div>
        )}
      </div>
    </motion.div>
  )
}
