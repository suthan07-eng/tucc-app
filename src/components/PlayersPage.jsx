import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, TrendingUp, Target, Shield, Star, ExternalLink, Users } from 'lucide-react'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'

const EASE = [0.23, 1, 0.32, 1]
const PHOTO_BASE = 'https://admin.btcluk.com/players/'
const BTCL_PROFILE = 'https://play-cricket.com/player_stats/player/'

// ── Role detection ────────────────────────────────────────────
function detectRole(p) {
  const bat  = p.stats?.runs  !== null && p.stats?.runs  >= 0
  const bowl = p.stats?.wickets !== null
  const bowl2 = (p.bowlStyle || '').length > 0
  const bat2  = (p.batStyle  || '').length > 0
  if ((p.batStyle || '').includes('Wicket') || (p.bowlStyle || '').includes('Wicket')) return 'Wicket-Keeper'
  if (bat && bowl) return 'All-Rounder'
  if (bowl && !bat) return 'Bowler'
  if (bat && !bowl) return 'Batsman'
  if (bowl2) return 'Bowler'
  if (bat2)  return 'Batsman'
  return 'Player'
}

const ROLE_META = {
  'Batsman':       { color: '#15803d', bg: '#dcfce7', grad: 'linear-gradient(135deg,#15803d,#22c55e)', icon: TrendingUp,  label: 'BAT' },
  'Bowler':        { color: '#be123c', bg: '#ffe4e6', grad: 'linear-gradient(135deg,#be123c,#f43f5e)', icon: Target,      label: 'BOWL' },
  'All-Rounder':   { color: '#7c3aed', bg: '#ede9fe', grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)', icon: Star,        label: 'AR' },
  'Wicket-Keeper': { color: '#b45309', bg: '#fef3c7', grad: 'linear-gradient(135deg,#b45309,#f59e0b)', icon: Shield,      label: 'WK' },
  'Player':        { color: '#475569', bg: '#f1f5f9', grad: 'linear-gradient(135deg,#475569,#94a3b8)', icon: Users,       label: 'PLR' },
}

const HAND_SHORT = s => (s || '').replace('Right Hand', 'RHB').replace('Left Hand', 'LHB').replace('Right-arm', 'RA').replace('Left-arm', 'LA').replace('Slow left-arm orthodox', 'LA spin').replace('Off break (right-arm)', 'RA off-spin').replace(' fast', ' fast')

// ── Player Photo ──────────────────────────────────────────────
function PlayerPhoto({ photoUrl, name, size = 96 }) {
  const [err, setErr] = useState(false)
  const initials = (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const PALETTE  = ['#1a5c38','#7c3aed','#0369a1','#b45309','#0891b2','#be185d','#059669','#6d28d9','#c2410c','#0f766e']
  let h = 0; for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]

  if (!photoUrl || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${bg}, ${bg}bb)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontWeight: 900, fontSize: Math.round(size * 0.3), color: '#fff',
        boxShadow: `0 6px 20px ${bg}55`,
      }}>
        {initials}
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: '#e2e8f0',
      boxShadow: '0 6px 20px rgba(0,0,0,.18)',
      border: '3px solid rgba(255,255,255,.9)',
    }}>
      <img
        src={photoUrl}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        onError={() => setErr(true)}
      />
    </div>
  )
}

// ── Stat Mini Bar ─────────────────────────────────────────────
function StatBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ flex: 1, height: 4, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        style={{ height: '100%', borderRadius: 99, background: color }}
      />
    </div>
  )
}

// ── Player Card ───────────────────────────────────────────────
function PlayerCard({ player, index, maxRuns, maxWkts, maxCatch, onClick }) {
  const role = detectRole(player)
  const meta = ROLE_META[role] || ROLE_META.Player
  const RoleIcon = meta.icon
  const runs    = player.stats?.runs    ?? null
  const wickets = player.stats?.wickets ?? null
  const catches = player.stats?.catches ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE, delay: index * 0.04 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(player)}
      style={{
        background: '#fff',
        borderRadius: 22,
        overflow: 'hidden',
        border: `1.5px solid ${C.gray2}`,
        boxShadow: `0 4px 20px ${C.shadow}`,
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Color top stripe */}
      <div style={{ height: 5, background: meta.grad }} />

      <div style={{ padding: '18px 16px 16px' }}>
        {/* Top row: photo + role badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <PlayerPhoto photoUrl={player.photoUrl} name={player.name} size={72} />
            {/* Role badge on photo */}
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: '50%',
              background: meta.grad, border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 8px ${meta.color}55`,
            }}>
              <RoleIcon size={10} color="#fff" strokeWidth={2.5} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 900, color: C.dark, lineHeight: 1.2, marginBottom: 4 }}>
              {player.forename}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.gray4, lineHeight: 1.2, marginBottom: 8 }}>
              {player.surname}
            </div>
            {/* Role pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: meta.bg, borderRadius: 20, padding: '3px 10px', border: `1px solid ${meta.color}22` }}>
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{role}</span>
            </div>
          </div>

          {/* BTCL ID badge */}
          {player.id && (
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: C.gray3, textTransform: 'uppercase', letterSpacing: 0.5 }}>BTCL ID</div>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: C.dark }}>{player.id}</div>
            </div>
          )}
        </div>

        {/* Styles */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {player.batStyle && (
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: '4px 8px', fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#1d4ed8' }}>
              🏏 {HAND_SHORT(player.batStyle)}
            </div>
          )}
          {player.bowlStyle && (
            <div style={{ background: '#fff1f2', borderRadius: 8, padding: '4px 8px', fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#be123c' }}>
              🔴 {HAND_SHORT(player.bowlStyle)}
            </div>
          )}
        </div>

        {/* Stats bars */}
        {(runs !== null || wickets !== null || catches !== null) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {runs !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#15803d', width: 38, flexShrink: 0 }}>Runs</span>
                <StatBar value={runs} max={maxRuns} color="#22c55e" />
                <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: C.dark, width: 28, textAlign: 'right', flexShrink: 0 }}>{runs}</span>
              </div>
            )}
            {wickets !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#be123c', width: 38, flexShrink: 0 }}>Wkts</span>
                <StatBar value={wickets} max={maxWkts} color="#f43f5e" />
                <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: C.dark, width: 28, textAlign: 'right', flexShrink: 0 }}>{wickets}</span>
              </div>
            )}
            {catches !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: '#7c3aed', width: 38, flexShrink: 0 }}>Catch</span>
                <StatBar value={catches} max={maxCatch} color="#a78bfa" />
                <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: C.dark, width: 28, textAlign: 'right', flexShrink: 0 }}>{catches}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Player Modal ──────────────────────────────────────────────
function PlayerModal({ player, onClose }) {
  const role = detectRole(player)
  const meta = ROLE_META[role] || ROLE_META.Player
  const { runs, wickets, economy, catches } = player.stats || {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', duration: 0.45, bounce: 0.1 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '28px 28px 0 0',
          width: '100%', maxWidth: MAX_WIDTH,
          maxHeight: '88vh', overflowY: 'auto',
          paddingBottom: 40,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: C.gray2 }} />
        </div>

        {/* Hero */}
        <div style={{ background: meta.grad, padding: '24px 24px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <PlayerPhoto photoUrl={player.photoUrl} name={player.name} size={96} />
            <div>
              <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                {player.forename}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.75)', marginBottom: 10 }}>
                {player.surname}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 20, padding: '4px 12px', fontFamily: FONT, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                  {role}
                </div>
                {player.id && (
                  <div style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '4px 12px', fontFamily: FONT, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>
                    BTCL #{player.id}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 24px 0' }}>
          {/* Playing styles */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: C.gray3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Playing Style</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Batting', value: player.batStyle, color: '#1d4ed8', bg: '#eff6ff', emoji: '🏏' },
                { label: 'Bowling', value: player.bowlStyle, color: '#be123c', bg: '#fff1f2', emoji: '🔴' },
              ].filter(s => s.value).map(({ label, value, color, bg, emoji }) => (
                <div key={label} style={{ background: bg, borderRadius: 14, padding: '12px 14px', border: `1px solid ${color}18` }}>
                  <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{emoji} {label}</div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.dark }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Season Stats */}
          {(runs !== null || wickets !== null || catches !== null) && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: C.gray3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>2026 Season Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Runs',    value: runs,    color: '#15803d', bg: '#dcfce7' },
                  { label: 'Wickets', value: wickets, color: '#be123c', bg: '#ffe4e6' },
                  { label: 'Economy', value: economy, color: '#0891b2', bg: '#cffafe' },
                  { label: 'Catches', value: catches, color: '#7c3aed', bg: '#ede9fe' },
                ].filter(s => s.value !== null && s.value !== undefined).map(({ label, value, color, bg }) => (
                  <div key={label} style={{ background: bg, borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: `1px solid ${color}18` }}>
                    <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: `${color}99`, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BTCL Profile link */}
          {player.id && (
            <a
              href={`${BTCL_PROFILE}${player.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: meta.grad, color: '#fff',
                borderRadius: 16, padding: '14px 20px',
                fontFamily: FONT, fontSize: 14, fontWeight: 800,
                textDecoration: 'none', boxShadow: `0 6px 20px ${meta.color}35`,
              }}
            >
              View BTCL Profile <ExternalLink size={15} strokeWidth={2.5} />
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', border: `1px solid ${C.gray2}` }}>
      <div style={{ height: 5, background: C.gray2 }} />
      <div style={{ padding: '18px 16px' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.gray1, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            <div style={{ height: 14, width: '60%', borderRadius: 6, background: C.gray1 }} />
            <div style={{ height: 11, width: '40%', borderRadius: 6, background: C.gray1 }} />
            <div style={{ height: 20, width: 72, borderRadius: 20, background: C.gray1 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <div style={{ height: 24, width: 70, borderRadius: 8, background: C.gray1 }} />
          <div style={{ height: 24, width: 80, borderRadius: 8, background: C.gray1 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0,1].map(i => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 38, height: 10, borderRadius: 4, background: C.gray1 }} />
            <div style={{ flex: 1, height: 4, borderRadius: 99, background: C.gray1 }} />
            <div style={{ width: 24, height: 10, borderRadius: 4, background: C.gray1 }} />
          </div>)}
        </div>
      </div>
    </div>
  )
}

const FILTERS = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']

// ── Main Page ─────────────────────────────────────────────────
export default function PlayersPage() {
  const nav = useNavigate()
  const [players, setPlayers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [query, setQuery]       = useState('')
  const [filter, setFilter]     = useState('All')
  const [selected, setSelected] = useState(null)
  const [source, setSource]     = useState(null)

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then(d => { setPlayers(d.players || []); setSource(d.source); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const maxRuns  = Math.max(...players.map(p => p.stats?.runs    ?? 0), 1)
  const maxWkts  = Math.max(...players.map(p => p.stats?.wickets ?? 0), 1)
  const maxCatch = Math.max(...players.map(p => p.stats?.catches ?? 0), 1)

  const filtered = players.filter(p => {
    const role = detectRole(p)
    const matchFilter = filter === 'All' || role === filter
    const q = query.toLowerCase()
    const matchQuery = !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q)
    return matchFilter && matchQuery
  })

  // Squad counts
  const roleCounts = players.reduce((acc, p) => {
    const r = detectRole(p); acc[r] = (acc[r] || 0) + 1; return acc
  }, {})

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* ── Hero ── */}
      <div style={{
        background: 'radial-gradient(ellipse at 70% -10%, rgba(124,58,237,.3) 0%, transparent 55%), linear-gradient(160deg, #1e1b4b 0%, #312e81 100%)',
        padding: '24px 20px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(167,139,250,.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', position: 'relative' }}>
          <motion.button onClick={() => nav('/')} whileTap={{ scale: 0.95 }} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 20 }}>
            <ArrowLeft size={14} strokeWidth={2} /> Home
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.3)', flexShrink: 0 }}>
                <img src="/logo.png" alt="TUCC" style={{ width: 47, height: 47, objectFit: 'contain' }} />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -0.4 }}>Squad</h1>
                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Tamil United CC · BTCL 2026</span>
                  {source === 'live' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', animation: 'pendingPulse 1.8s ease-in-out infinite', display: 'inline-block' }} />
                      <span style={{ color: '#86efac', fontWeight: 600, fontSize: 11 }}>Live</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Role stats strip */}
            {!loading && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total', value: players.length, grad: 'linear-gradient(135deg,#4338ca,#6366f1)', shadow: '0 4px 14px rgba(67,56,202,.4)' },
                  { label: 'Batsmen', value: (roleCounts['Batsman'] || 0) + (roleCounts['All-Rounder'] || 0), grad: 'linear-gradient(135deg,#15803d,#22c55e)', shadow: '0 4px 14px rgba(21,128,61,.35)' },
                  { label: 'Bowlers', value: (roleCounts['Bowler'] || 0) + (roleCounts['All-Rounder'] || 0), grad: 'linear-gradient(135deg,#be123c,#f43f5e)', shadow: '0 4px 14px rgba(190,18,60,.3)' },
                  { label: 'WK', value: roleCounts['Wicket-Keeper'] || 0, grad: 'linear-gradient(135deg,#b45309,#f59e0b)', shadow: '0 4px 14px rgba(180,83,9,.35)' },
                ].map(({ label, value, grad, shadow }) => (
                  <div key={label} style={{ flex: 1, minWidth: 60, background: grad, borderRadius: 14, padding: '10px 8px', textAlign: 'center', boxShadow: shadow, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -8, right: -8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />
                    <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '20px 16px 56px', width: '100%' }}>

        {/* Search + filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color={C.gray3} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name or BTCL ID…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                borderRadius: 14, border: `1.5px solid ${C.gray2}`,
                fontFamily: FONT, fontSize: 14, color: C.dark,
                background: '#fff', outline: 'none',
                boxShadow: `0 2px 8px ${C.shadow}`,
              }}
            />
          </div>

          {/* Role filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {FILTERS.map(f => {
              const active = filter === f
              const m = ROLE_META[f] || { color: '#4338ca', bg: '#ede9fe', grad: 'linear-gradient(135deg,#4338ca,#6366f1)' }
              return (
                <motion.button
                  key={f}
                  onClick={() => setFilter(f)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px', borderRadius: 20,
                    fontFamily: FONT, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer',
                    background: active ? (f === 'All' ? 'linear-gradient(135deg,#4338ca,#6366f1)' : m.grad) : '#fff',
                    color: active ? '#fff' : C.gray4,
                    border: `1.5px solid ${active ? 'transparent' : C.gray2}`,
                    boxShadow: active ? `0 4px 12px ${m.color || '#4338ca'}35` : 'none',
                    transition: 'all 180ms ease',
                  }}
                >
                  {f}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.gray4, marginBottom: 16 }}>
            {filtered.length} player{filtered.length !== 1 ? 's' : ''}{filter !== 'All' ? ` · ${filter}` : ''}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#fff1f2', border: `1.5px solid #fecaca`, borderRadius: 16, padding: '16px', marginBottom: 16, textAlign: 'center', color: C.red, fontFamily: FONT, fontSize: 14 }}>
            Couldn't load squad data.
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 22, border: `1px solid ${C.gray2}` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏏</div>
            <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: C.dark }}>No players found</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.gray3, marginTop: 4 }}>Try a different search or filter.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {filtered.map((p, i) => (
              <PlayerCard
                key={p.id || p.name}
                player={p}
                index={i}
                maxRuns={maxRuns}
                maxWkts={maxWkts}
                maxCatch={maxCatch}
                onClick={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Player Modal ── */}
      <AnimatePresence>
        {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      <Footer />

      <style>{`
        input::placeholder { color: ${C.gray3}; }
        input:focus { border-color: #a78bfa !important; box-shadow: 0 0 0 3px rgba(167,139,250,.15) !important; }
      `}</style>
    </div>
  )
}
