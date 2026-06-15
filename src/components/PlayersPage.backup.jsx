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
const OUR_NAMES_LG = ['Tamil United', 'TUCC', 'Dollishill Tamil United', 'DTU']
const isOursLeague = (name = '') => OUR_NAMES_LG.some(t => name.toLowerCase().includes(t.toLowerCase()))

// ── Season stat pill ──────────────────────────────────────────
function SeasonPill({ label, value, grad, shadow, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: EASE }}
      style={{
        background: grad, borderRadius: 18,
        padding: '14px 10px', textAlign: 'center',
        boxShadow: shadow, flex: 1, minWidth: 0,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position:'absolute', top:-14, right:-14, width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,.13)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-10, left:-10, width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,.07)', pointerEvents:'none' }}/>
      <div style={{ fontFamily:FONT, fontSize:26, fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums', position:'relative', zIndex:1 }}>{value}</div>
      <div style={{ fontFamily:FONT, fontSize:9, fontWeight:800, color:'rgba(255,255,255,.75)', marginTop:5, textTransform:'uppercase', letterSpacing:1, position:'relative', zIndex:1 }}>{label}</div>
    </motion.div>
  )
}

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
  'Batsman':       { color: '#15803d', bg: 'rgba(34,197,94,0.16)', grad: 'linear-gradient(135deg,#15803d,#3b82f6)', icon: TrendingUp,  label: 'BAT' },
  'Bowler':        { color: '#be123c', bg: '#ffe4e6', grad: 'linear-gradient(135deg,#be123c,#f43f5e)', icon: Target,      label: 'BOWL' },
  'All-Rounder':   { color: '#7c3aed', bg: 'rgba(168,85,247,0.14)', grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)', icon: Star,        label: 'AR' },
  'Wicket-Keeper': { color: '#b45309', bg: 'rgba(233,160,32,0.16)', grad: 'linear-gradient(135deg,#b45309,#f59e0b)', icon: Shield,      label: 'WK' },
  'Player':        { color: '#475569', bg: 'rgba(255,255,255,0.05)', grad: 'linear-gradient(135deg,#475569,#94a3b8)', icon: Users,       label: 'PLR' },
}

const HAND_SHORT = s => (s || '').replace('Right Hand', 'RHB').replace('Left Hand', 'LHB').replace('Right-arm', 'RA').replace('Left-arm', 'LA').replace('Slow left-arm orthodox', 'LA spin').replace('Off break (right-arm)', 'RA off-spin').replace(' fast', ' fast')

// ── Player Photo ──────────────────────────────────────────────
// fill=true → stretches to 100% of parent (use when parent is the circle)
// fill=false → renders its own fixed-size circle
// photoPos → CSS object-position override (e.g. 'center 20%')
function PlayerPhoto({ photoUrl, name, size = 96, fill = false, photoPos = 'center 35%' }) {
  const [err, setErr] = useState(false)
  const initials = (name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const PALETTE  = ['#2563eb','#7c3aed','#0369a1','#b45309','#0891b2','#be185d','#059669','#6d28d9','#c2410c','#0f766e']
  let h = 0; for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]

  const fillBase = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const fixedBase = { width: size, height: size, borderRadius: '50%', flexShrink: 0 }

  if (!photoUrl || err) {
    return (
      <div style={{
        ...(fill ? fillBase : fixedBase),
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT, fontWeight: 900,
        fontSize: fill ? '28%' : Math.round(size * 0.3),
        color: '#fff',
        ...(fill ? {} : { boxShadow: `0 6px 20px ${bg}55` }),
      }}>
        {initials}
      </div>
    )
  }
  return (
    <div style={{
      ...(fill ? fillBase : fixedBase),
      overflow: 'hidden',
      background: '#e2e8f0',
      ...(fill ? {} : { borderRadius: '50%', boxShadow: '0 6px 20px rgba(0,0,0,.18)', border: '3px solid rgba(255,255,255,.9)', flexShrink: 0 }),
    }}>
      <img
        src={photoUrl}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photoPos }}
        onError={() => setErr(true)}
      />
    </div>
  )
}

// ── Player Card ───────────────────────────────────────────────
function PlayerCard({ player, index, onClick }) {
  const role    = detectRole(player)
  const meta    = ROLE_META[role] || ROLE_META.Player
  const RoleIcon = meta.icon
  const { matches, runs, wickets, catches } = player.stats || {}
  const hasStats = matches != null || runs != null || wickets != null || catches != null

  const statPills = [
    { label: 'GP',   value: matches, color: '#6366f1', bg: '#eef2ff', borderColor: '#c7d2fe' },
    { label: 'Runs', value: runs,    color: '#15803d', bg: 'rgba(34,197,94,0.16)', borderColor: '#bbf7d0' },
    { label: 'Wkts', value: wickets, color: '#be123c', bg: '#ffe4e6', borderColor: '#fecdd3' },
    { label: 'Catch',value: catches, color: '#7c3aed', bg: 'rgba(168,85,247,0.14)', borderColor: '#ddd6fe' },
  ].filter(s => s.value != null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE, delay: Math.min(index * 0.05, 0.4) }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(player)}
      style={{
        background: C.white,
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,.07), 0 8px 28px rgba(0,0,0,.06)',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Hero photo area ── */}
      <div style={{ position: 'relative', background: meta.grad, paddingTop: '60%', overflow: 'hidden' }}>
        {/* Background texture circles */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(0,0,0,.1)', pointerEvents: 'none' }} />

        {/* GP badge — top left */}
        {matches != null && (
          <div style={{
            position: 'absolute', top: 9, left: 9, zIndex: 2,
            background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(6px)',
            borderRadius: 10, padding: '4px 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{matches}</div>
            <div style={{ fontFamily: FONT, fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: 0.5 }}>GP</div>
          </div>
        )}

        {/* Role badge — top right */}
        <div style={{
          position: 'absolute', top: 9, right: 9, zIndex: 2,
          background: 'rgba(255,255,255,.22)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,.35)',
          borderRadius: 10, padding: '4px 8px',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <RoleIcon size={9} color="#fff" strokeWidth={2.5} />
          <span style={{ fontFamily: FONT, fontSize: 8, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>{meta.label}</span>
        </div>

        {/* Player photo — positioned at bottom-center of hero */}
        <div style={{
          position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
          width: '55%', aspectRatio: '1',
          borderRadius: '50%', overflow: 'hidden',
          border: '3px solid rgba(255,255,255,.9)',
          boxShadow: '0 8px 24px rgba(0,0,0,.25)',
          background: '#e2e8f0',
          zIndex: 1,
        }}>
          <PlayerPhoto photoUrl={player.photoUrl} name={player.name} fill photoPos={player.photoPos || 'center 35%'} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '10px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Name */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 900, color: C.dark, lineHeight: 1.2 }}>
            {player.forename}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.gray4, lineHeight: 1.3 }}>
            {player.surname}
          </div>
        </div>

        {/* Role + BTCL chip row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: meta.grad, borderRadius: 20, padding: '3px 10px', boxShadow: `0 2px 8px ${meta.color}44` }}>
            <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6 }}>{role}</span>
          </div>
          {player.id && (
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '3px 9px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: C.gray4 }}>#{player.id}</span>
            </div>
          )}
        </div>

        {/* Bat / Bowl style chips */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 }}>
          {player.batStyle && (
            <div style={{ background: 'rgba(59,130,246,0.12)', borderRadius: 6, padding: '3px 7px', fontFamily: FONT, fontSize: 9, fontWeight: 700, color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              🏏 {HAND_SHORT(player.batStyle)}
            </div>
          )}
          {player.bowlStyle && (
            <div style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 6, padding: '3px 7px', fontFamily: FONT, fontSize: 9, fontWeight: 700, color: '#be123c', border: '1px solid #fecdd3' }}>
              🔴 {HAND_SHORT(player.bowlStyle)}
            </div>
          )}
        </div>

        {/* Stat pills */}
        {hasStats && statPills.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(statPills.length, 4)}, 1fr)`, gap: 5, marginTop: 'auto' }}>
            {statPills.map(({ label, value, color, bg, borderColor }) => (
              <div key={label} style={{
                background: bg, borderRadius: 10, padding: '6px 4px',
                textAlign: 'center', border: `1px solid ${borderColor}`,
              }}>
                <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: FONT, fontSize: 7, fontWeight: 800, color: `${color}99`, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
        {!hasStats && (
          <div style={{ textAlign: 'center', marginTop: 'auto', padding: '6px 0' }}>
            <span style={{ fontFamily: FONT, fontSize: 10, color: C.gray3, fontWeight: 600 }}>No matches yet</span>
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
  const RoleIcon = meta.icon
  const { matches, runs, innings, highest, average, wickets, economy, bestWkt, catches } = player.stats || {}

  const allStats = [
    { label: 'Games',   value: matches, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
    { label: 'Runs',    value: runs,    color: '#15803d', bg: 'rgba(34,197,94,0.16)', border: '#bbf7d0' },
    { label: 'Innings', value: innings, color: '#0369a1', bg: 'rgba(59,130,246,0.14)', border: '#bae6fd' },
    { label: 'Highest', value: highest, color: '#b45309', bg: 'rgba(233,160,32,0.16)', border: '#fde68a' },
    { label: 'Average', value: average != null ? Number(average).toFixed(1) : null, color: '#0891b2', bg: '#cffafe', border: '#a5f3fc' },
    { label: 'Wickets', value: wickets, color: '#be123c', bg: '#ffe4e6', border: '#fecdd3' },
    { label: 'Economy', value: economy != null ? Number(economy).toFixed(2) : null, color: '#7c3aed', bg: 'rgba(168,85,247,0.14)', border: '#ddd6fe' },
    { label: 'Best',    value: bestWkt != null ? `${bestWkt}wkt` : null, color: '#9f1239', bg: 'rgba(239,68,68,0.12)', border: '#fecdd3' },
    { label: 'Catches', value: catches, color: '#6d28d9', bg: 'rgba(168,85,247,0.12)', border: '#ddd6fe' },
  ].filter(s => s.value != null && s.value !== '' && s.value !== 0 || s.value === 0 && s.label === 'Runs')
   .filter(s => s.value != null)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', duration: 0.42, bounce: 0.08 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '32px 32px 0 0',
          width: '100%', maxWidth: MAX_WIDTH,
          maxHeight: '92vh', overflowY: 'auto',
          paddingBottom: 48,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e2e8f0' }} />
        </div>

        {/* ── Hero ── */}
        <div style={{ position: 'relative', background: meta.grad, margin: '12px 16px 0', borderRadius: 24, overflow: 'hidden', padding: '24px 20px 20px' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(0,0,0,.1)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,.85)', boxShadow: '0 8px 24px rgba(0,0,0,.25)', flexShrink: 0, background: '#e2e8f0' }}>
              <PlayerPhoto photoUrl={player.photoUrl} name={player.name} fill photoPos={player.photoPos || 'center 35%'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: -0.3 }}>
                {player.forename}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginBottom: 12 }}>
                {player.surname}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 20, padding: '5px 12px' }}>
                  <RoleIcon size={11} color="#fff" strokeWidth={2.5} />
                  <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: '#fff' }}>{role}</span>
                </div>
                {player.id && (
                  <div style={{ background: 'rgba(0,0,0,.2)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 20, padding: '5px 12px', fontFamily: FONT, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>
                    BTCL #{player.id}
                  </div>
                )}
                {matches != null && (
                  <div style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 20, padding: '5px 12px', fontFamily: FONT, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                    {matches} game{matches !== 1 ? 's' : ''} played
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 16px 0' }}>

          {/* Playing styles */}
          {(player.batStyle || player.bowlStyle) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: C.gray3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Playing Style</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {player.batStyle && (
                  <div style={{ flex: 1, minWidth: 120, background: 'rgba(59,130,246,0.12)', borderRadius: 16, padding: '12px 16px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>🏏 Batting</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}>{player.batStyle}</div>
                  </div>
                )}
                {player.bowlStyle && (
                  <div style={{ flex: 1, minWidth: 120, background: 'rgba(239,68,68,0.12)', borderRadius: 16, padding: '12px 16px', border: '1px solid #fecdd3' }}>
                    <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: '#be123c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>🔴 Bowling</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: '#881337' }}>{player.bowlStyle}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2026 Season Stats grid */}
          {allStats.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: C.gray3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>2026 Season Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {allStats.map(({ label, value, color, bg, border }) => (
                  <div key={label} style={{ background: bg, borderRadius: 16, padding: '14px 10px', textAlign: 'center', border: `1.5px solid ${border}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: -8, right: -8, width: 36, height: 36, borderRadius: '50%', background: `${color}12`, pointerEvents: 'none' }} />
                    <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                    <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, color: `${color}aa`, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
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
                borderRadius: 18, padding: '15px 20px',
                fontFamily: FONT, fontSize: 14, fontWeight: 800,
                textDecoration: 'none', boxShadow: `0 8px 24px ${meta.color}40`,
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
    <div style={{ background: C.white, borderRadius: 24, overflow: 'hidden', border: `1px solid ${C.gray2}` }}>
      {/* Photo area */}
      <div style={{ paddingTop: '72%', background: C.gray1, position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', width: '60%', aspectRatio: '1', borderRadius: '50%', background: C.gray2, border: '3px solid #fff' }} />
      </div>
      <div style={{ padding: '32px 14px 14px' }}>
        <div style={{ height: 13, width: '60%', borderRadius: 6, background: C.gray1, margin: '0 auto 6px' }} />
        <div style={{ height: 10, width: '40%', borderRadius: 6, background: C.gray1, margin: '0 auto 12px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
          {[0,1,2].map(i => <div key={i} style={{ height: 40, borderRadius: 10, background: C.gray1 }} />)}
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
  const [teamStats, setTeamStats] = useState(null)

  useEffect(() => {
    fetch('/api/league-table')
      .then(r => r.json())
      .then(d => {
        const ourRow = (d.rows || d.teams || []).find(t => isOursLeague(t.team))
        if (ourRow) setTeamStats(ourRow)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then(d => { setPlayers(d.players || []); setSource(d.source); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

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
        background: 'linear-gradient(160deg, #020818 0%, #0f1e5a 35%, #1a1060 65%, #0a0730 100%)',
        padding: '24px 20px 36px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient orbs */}
        <motion.div animate={{ scale:[1,1.2,1], opacity:[.14,.04,.14] }} transition={{ duration:8, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(124,58,237,.3)', filter:'blur(60px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-30, left:-30, width:160, height:160, borderRadius:'50%', background:'rgba(233,160,32,.08)', filter:'blur(40px)', pointerEvents:'none' }}/>
        {/* Grid overlay */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)', backgroundSize:'40px 40px' }}/>

        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.button onClick={() => nav('/')} whileTap={{ scale: 0.95 }} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.38)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 24 }}>
            <ArrowLeft size={14} strokeWidth={2} /> Home
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>

            {/* Title row — bigger circular logo with gold ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <motion.div animate={{ scale:[1,1.1,1], opacity:[.4,.1,.4] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                  style={{ position:'absolute', inset:-8, borderRadius:'50%', background:'radial-gradient(circle,rgba(233,160,32,.4) 0%,transparent 70%)', pointerEvents:'none' }}/>
                <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(255,255,255,.06)', border:'3px solid rgba(233,160,32,.6)', boxShadow:'0 0 0 2px rgba(233,160,32,.15), 0 8px 28px rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative', zIndex:1 }}>
                  <div style={{ width:58, height:58, borderRadius:'50%', background: '#fff', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <img src="/logo.png" alt="TUCC" style={{ width:50, height:50, objectFit:'contain' }}/>
                  </div>
                </div>
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>Squad</h1>
                <div style={{ color: 'rgba(255,255,255,.38)', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>Tamil United CC · BTCL 2026</span>
                  {!loading && (
                    <span style={{ background:'rgba(167,139,250,.12)', border:'1px solid rgba(167,139,250,.25)', borderRadius:20, padding:'2px 9px', fontFamily:FONT, fontSize:10, fontWeight:700, color:'#c4b5fd' }}>
                      {players.length} players
                    </span>
                  )}
                  {source === 'live' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <motion.span animate={{ opacity:[1,.2,1] }} transition={{ duration:1.8, repeat:Infinity }}
                        style={{ width:6, height:6, borderRadius:'50%', background:'#67e8f9', boxShadow:'0 0 8px #67e8f9', display:'inline-block' }}/>
                      <span style={{ color:'#67e8f9', fontWeight:700, fontSize:11 }}>Live</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Season stats pills — live from league table */}
            {teamStats && (
              <div style={{ display: 'flex', gap: 10 }}>
                <SeasonPill delay={0.05} label="Played" value={teamStats.p   ?? '—'} grad="linear-gradient(135deg,#2563eb,#3b82f6)" shadow="0 6px 20px rgba(37,99,235,.4)" />
                <SeasonPill delay={0.10} label="Won"    value={teamStats.w   ?? '0'} grad="linear-gradient(135deg,#15803d,#22c55e)" shadow="0 6px 20px rgba(21,128,61,.4)" />
                <SeasonPill delay={0.15} label="Lost"   value={teamStats.l   ?? '—'} grad="linear-gradient(135deg,#be123c,#f43f5e)" shadow="0 6px 20px rgba(190,18,60,.35)" />
                <SeasonPill delay={0.20} label="Points" value={teamStats.pts ?? '—'} grad="linear-gradient(135deg,#b45309,#f59e0b)" shadow="0 6px 20px rgba(180,83,9,.4)" />
                <SeasonPill delay={0.25} label="NRR"    value={teamStats.nrr ?? '—'} grad={parseFloat(teamStats.nrr) >= 0 ? 'linear-gradient(135deg,#15803d,#22c55e)' : 'linear-gradient(135deg,#6d28d9,#8b5cf6)'} shadow="0 6px 20px rgba(109,40,217,.35)" />
              </div>
            )}

            {/* Fallback squad role pills if league stats not yet loaded */}
            {!teamStats && !loading && (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label:'Squad',   value:players.length,                                              grad:'linear-gradient(135deg,#4338ca,#6366f1)', shadow:'0 6px 20px rgba(67,56,202,.4)' },
                  { label:'Batsmen', value:(roleCounts['Batsman']||0)+(roleCounts['All-Rounder']||0),   grad:'linear-gradient(135deg,#15803d,#22c55e)', shadow:'0 6px 20px rgba(21,128,61,.4)' },
                  { label:'Bowlers', value:(roleCounts['Bowler']||0)+(roleCounts['All-Rounder']||0),    grad:'linear-gradient(135deg,#be123c,#f43f5e)', shadow:'0 6px 20px rgba(190,18,60,.35)' },
                  { label:'WK',      value:roleCounts['Wicket-Keeper']||0,                              grad:'linear-gradient(135deg,#b45309,#f59e0b)', shadow:'0 6px 20px rgba(180,83,9,.4)' },
                ].map(({ label, value, grad, shadow }, i) => (
                  <SeasonPill key={label} delay={0.05+i*0.05} label={label} value={value} grad={grad} shadow={shadow}/>
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
                background: C.white, outline: 'none',
                boxShadow: `0 2px 8px ${C.shadow}`,
              }}
            />
          </div>

          {/* Role filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {FILTERS.map(f => {
              const active = filter === f
              const m = ROLE_META[f] || { color: '#4338ca', bg: 'rgba(168,85,247,0.14)', grad: 'linear-gradient(135deg,#4338ca,#6366f1)' }
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
          <div style={{ background: 'rgba(239,68,68,0.12)', border: `1.5px solid #fecaca`, borderRadius: 16, padding: '16px', marginBottom: 16, textAlign: 'center', color: C.red, fontFamily: FONT, fontSize: 14 }}>
            Couldn't load squad data.
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: C.white, borderRadius: 22, border: `1px solid ${C.gray2}` }}>
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
