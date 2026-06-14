import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { supabase } from '../../supabase'
import statsJson from '../../data/stats-2026.json'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const FONT = "'Outfit', sans-serif"

// ── Animated count-up ──────────────────────────────────────
function useCountUp(target, { duration = 1400, decimals = 0, start = true } = {}) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    const end = parseFloat(target) || 0
    if (end === 0) { setVal(0); return }
    let raf, t0
    const ease = t => 1 - Math.pow(1 - t, 3)
    const tick = now => {
      if (!t0) t0 = now
      const p = Math.min((now - t0) / duration, 1)
      setVal(end * ease(p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])
  return decimals > 0 ? val.toFixed(decimals) : Math.round(val)
}

function AnimatedNumber({ value, decimals = 0, start = true }) {
  const out = useCountUp(value, { decimals, start })
  return <>{out}</>
}

// ── Name match ─────────────────────────────────────────────
const COMMON_WORDS = new Set(['mohamed', 'daniel', 'anton', 'kumar', 'raj'])
function matchStat(arr, name) {
  if (!arr?.length || !name) return null
  const lower = name.toLowerCase().trim()
  let hit = arr.find(p => p.name.toLowerCase().trim() === lower)
  if (hit) return hit
  const words = lower.split(' ').filter(w => w.length > 2 && !COMMON_WORDS.has(w))
  if (words.length >= 2) {
    hit = arr.find(p => { const n = p.name.toLowerCase(); return words.every(w => n.includes(w)) })
    if (hit) return hit
  }
  return null
}

// ── Score computation ──────────────────────────────────────
function detectRole(player) {
  const batStyle  = (player.batStyle  || '').toLowerCase()
  const bowlStyle = (player.bowlStyle || '').toLowerCase()
  if (batStyle.includes('wicket') || bowlStyle.includes('wicket')) return 'Wicket-Keeper'
  const hasBat  = player._bat  && (player._bat.innings  || player._bat.matches  || 0) >= 1
  const hasBowl = player._bowl && (player._bowl.overs || 0) >= 4
  if (hasBat && hasBowl) return 'All-Rounder'
  if (hasBowl)  return 'Bowler'
  if (bowlStyle && !hasBat) return 'Bowler'
  return 'Batsman'
}

function computeScore(player) {
  const bat  = player._bat
  const bowl = player._bowl
  let batScore = 0
  if (bat) {
    const runsNorm = Math.min((bat.runs || 0) / 300, 1) * 40
    const sr = parseFloat(bat.strike_rate) || 0
    const srPts = sr >= 120 ? 30 : sr >= 90 ? 22 : sr >= 70 ? 15 : sr >= 50 ? 9 : 5
    const avgNorm = Math.min((parseFloat(bat.average) || 0) / 60, 1) * 20
    const milestones = Math.min((bat.fifties || 0) * 2 + (bat.hundreds || 0) * 5, 10)
    batScore = runsNorm + srPts + avgNorm + milestones
  }
  let bowlScore = 0
  if (bowl && (bowl.overs || 0) >= 4) {
    const wktsNorm = Math.min((bowl.wickets || 0) / 15, 1) * 40
    const econ = parseFloat(bowl.economy) || 99
    const econPts = econ <= 5 ? 30 : econ <= 6.5 ? 22 : econ <= 8 ? 15 : econ <= 10 ? 9 : 5
    const avg = parseFloat(bowl.average) || 99
    const avgPts = avg <= 15 ? 20 : avg <= 22 ? 15 : avg <= 30 ? 10 : avg <= 40 ? 5 : 0
    const fivefers = Math.min((bowl.five_fers || 0) * 10, 10)
    bowlScore = wktsNorm + econPts + avgPts + fivefers
  }
  const role = detectRole(player)
  let composite = 0
  if (role === 'Bowler') composite = batScore * 0.20 + bowlScore * 0.80
  else if (role === 'Batsman' || role === 'Wicket-Keeper') composite = batScore * 0.80 + bowlScore * 0.20
  else {
    const bonus = (bat?.runs || 0) >= 25 && (bowl?.wickets || 0) >= 3 ? Math.min(((bat?.runs || 0) / 60 + (bowl?.wickets || 0) / 5) * 5, 10) : 0
    composite = batScore * 0.50 + bowlScore * 0.50 + bonus
  }
  const matches = player.stats?.matches || bat?.matches || bowl?.matches || 1
  const engMult = 0.85 + 0.15 * Math.min(matches / 8, 1)
  const confidence = Math.min(0.4 + Math.max(matches - 1, 0) / 3 * 0.6, 1)
  return Math.round(Math.min(composite * engMult * confidence, 100) * 10) / 10
}

// ── Role config ────────────────────────────────────────────
const ROLE_CONFIG = {
  'Batsman':       { grad: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)', accent: '#3b82f6', icon: '🏏' },
  'Bowler':        { grad: 'linear-gradient(135deg,#92400e 0%,#f59e0b 100%)', accent: '#f59e0b', icon: '🎯' },
  'All-Rounder':   { grad: 'linear-gradient(135deg,#065f46 0%,#10b981 100%)', accent: '#10b981', icon: '⚡' },
  'Wicket-Keeper': { grad: 'linear-gradient(135deg,#581c87 0%,#a855f7 100%)', accent: '#a855f7', icon: '🧤' },
}
function getRoleConfig(role) {
  if (!role) return ROLE_CONFIG['Batsman']
  return ROLE_CONFIG[role.split('/')[0].trim()] || ROLE_CONFIG['Batsman']
}
function getRoleIcon(role) {
  const icons = { Batsman:'🏏', Bowler:'🎯', 'All-Rounder':'⚡', 'Wicket-Keeper':'🧤' }
  if (!role) return '🏏'
  return role.split('/').map(r => icons[r.trim()] || '🏏').join(' ')
}

const MEDAL = {
  1: { emoji: '🥇', glow: 'rgba(217,119,6,0.4)' },
  2: { emoji: '🥈', glow: 'rgba(100,116,139,0.35)' },
  3: { emoji: '🥉', glow: 'rgba(180,83,9,0.35)' },
}

// ── Score ring ─────────────────────────────────────────────
function ScoreRing({ score, accent = '#3b82f6', size = 64 }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const fill = (Math.min(score, 100) / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#fff" strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter: `drop-shadow(0 0 4px ${accent})` }}/>
      <text x={size/2} y={size/2 - 2} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.27 }}>
        {Math.round(score)}
      </text>
      <text x={size/2} y={size/2 + size * 0.22} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.5)" style={{ fontFamily: FONT, fontWeight: 600, fontSize: size * 0.13 }}>
        /100
      </text>
    </svg>
  )
}

// ── Player Card ────────────────────────────────────────────
function PlayerCard({ player, rank, profile, index }) {
  const [expanded, setExpanded] = useState(false)
  const role  = player._role
  const rc    = getRoleConfig(role)
  const score = computeScore(player)
  const bat   = player._bat
  const bowl  = player._bowl
  const medal = MEDAL[rank]
  const hasProfile = !!(profile?.headline || profile?.ai_profile)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.32) }}
      onClick={() => setExpanded(e => !e)}
      style={{
        borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
        border: medal ? `1.5px solid ${rc.accent}60` : '1px solid rgba(255,255,255,0.08)',
        boxShadow: medal ? `0 8px 32px ${medal.glow}, 0 0 0 1px ${rc.accent}30` : '0 4px 20px rgba(0,0,0,0.3)',
        background: '#0d1b3e',
      }}
    >
      {/* Gradient header */}
      <div style={{ background: rc.grad, padding: '20px 20px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, background: 'rgba(255,255,255,0.07)', borderRadius: '50%', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -16, left: '40%', width: 70, height: 70, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }}/>

        {medal && (
          <div style={{ position: 'absolute', top: 12, left: 14, fontSize: 20 }}>{medal.emoji}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1, paddingTop: medal ? 26 : 0 }}>
          {/* Avatar */}
          <div style={{ width: 68, height: 68, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: '2.5px solid rgba(255,255,255,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            {player.photoUrl
              ? <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: player.photoPos || 'center top' }}/>
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 22, color: 'rgba(255,255,255,0.75)' }}>
                  {(player.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 15, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{player.name}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>
              <span style={{ fontSize: 10 }}>{getRoleIcon(role)}</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' }}>{role}</span>
            </div>
            {hasProfile && profile.headline && (
              <p style={{ fontFamily: FONT, fontSize: 11.5, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {profile.headline}
              </p>
            )}
          </div>

          <ScoreRing score={score} accent={rc.accent} size={64} />
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {bat && <>
            <StatPill label="Runs" value={bat.runs} />
            <StatPill label="Avg"  value={bat.average} />
            <StatPill label="SR"   value={bat.strike_rate} highlight />
            {bat.highest > 0 && <StatPill label="HS" value={bat.highest + (bat.highest_no ? '*' : '')} />}
            {(bat.fifties > 0 || bat.hundreds > 0) && <StatPill label="50s/100s" value={`${bat.fifties||0}/${bat.hundreds||0}`} />}
          </>}
          {bowl && (bowl.overs || 0) >= 4 && <>
            <StatPill label="Wkts" value={bowl.wickets} highlight />
            <StatPill label="Econ" value={bowl.economy} />
            <StatPill label="Avg"  value={bowl.average} />
            {bowl.best_wickets != null && <StatPill label="Best" value={`${bowl.best_wickets}/${bowl.best_runs}`} />}
          </>}
        </div>
      </div>

      {/* Expand toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: 'rgba(0,0,0,0.2)', borderBottom: expanded ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
        <span style={{ fontFamily: FONT, fontSize: 11.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
          {expanded ? 'Hide details' : hasProfile ? 'View profile & stats' : 'View score breakdown'}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 18px 20px', background: 'rgba(0,0,0,0.15)' }}>
              {hasProfile ? (
                <>
                  {profile.ai_profile && (
                    <p style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '0 0 16px' }}>
                      {profile.ai_profile}
                    </p>
                  )}
                  {((profile.strengths || []).length > 0 || (profile.development_areas || []).length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      {(profile.strengths || []).filter(Boolean).length > 0 && (
                        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ fontFamily: FONT, fontSize: 10, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>✓ Strengths</div>
                          {profile.strengths.filter(Boolean).map((s, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4ade80', flexShrink: 0, marginTop: 6 }}/>
                              <span style={{ fontFamily: FONT, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(profile.development_areas || []).filter(Boolean).length > 0 && (
                        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ fontFamily: FONT, fontSize: 10, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>→ Growth</div>
                          {profile.development_areas.filter(Boolean).map((d, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fbbf24', flexShrink: 0, marginTop: 6 }}/>
                              <span style={{ fontFamily: FONT, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>{d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {profile.role_notes && (
                    <div style={{ background: `${rc.accent}0f`, border: `1px solid ${rc.accent}25`, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontFamily: FONT, fontSize: 10, color: rc.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                        {rc.icon} Team Role
                      </div>
                      <p style={{ fontFamily: FONT, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>{profile.role_notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '14px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                  <p style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>Profile coming soon — check back after the next match!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StatPill({ label, value, highlight }) {
  if (value == null || value === '') return null
  return (
    <div style={{
      background: highlight ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)',
      border: `1px solid ${highlight ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}`,
      borderRadius: 10, padding: '7px 11px', textAlign: 'center', flex: '1 1 52px', minWidth: 48,
    }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}

// ── Dashboard feature card ─────────────────────────────────
function DashCard({ icon, accent, label, name, value, unit, decimals = 0, ratio = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      style={{
        background: 'linear-gradient(150deg, #0d1b3e 0%, #0a142e 100%)',
        border: `1px solid ${accent}30`, borderRadius: 18, padding: '18px 18px 16px',
        boxShadow: `0 8px 30px rgba(0,0,0,0.3)`, position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.25s',
      }}
    >
      <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 4, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name ? name.split(' ').slice(0, 2).join(' ') : '—'}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 28, color: accent, letterSpacing: '-1px', lineHeight: 1 }}>
          <AnimatedNumber value={value} decimals={decimals} start={inView} />
        </span>
        <span style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{unit}</span>
      </div>
      {/* progress bar */}
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${Math.max(ratio * 100, 6)}%` } : {}}
          transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, boxShadow: `0 0 8px ${accent}80` }}
        />
      </div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function PublicPlayers() {
  const [players, setPlayers]     = useState([])
  const [profiles, setProfiles]   = useState({})
  const [adminRoles, setAdminRoles] = useState({})
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [sortBy, setSortBy]       = useState('score')
  const [search, setSearch]       = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [{ data: sbPlayers }, { data: sbProfiles }] = await Promise.all([
          supabase.from('players').select('*').order('name'),
          supabase.from('tucc_player_scores').select('*').eq('season', '2026'),
        ])

        const roleMap = {}
        for (const p of (sbPlayers || [])) {
          if (p.name && p.role) roleMap[p.name.toLowerCase().trim()] = p.role
        }
        setAdminRoles(roleMap)

        const profileMap = {}
        for (const s of (sbProfiles || [])) {
          if (s.btcl_player_id) profileMap[s.btcl_player_id] = s
          if (s.player_name)    profileMap[s.player_name.toLowerCase().trim()] = s
        }
        setProfiles(profileMap)

        setPlayers((sbPlayers || []).map(p => ({
          ...p,
          name: p.name || `${p.forename || ''} ${p.surname || ''}`.trim(),
        })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const enriched = useMemo(() =>
    players.map(p => {
      const withStats = { ...p, _bat: matchStat(statsJson.batting, p.name), _bowl: matchStat(statsJson.bowling, p.name) }
      const adminRole = adminRoles[(p.name || '').toLowerCase().trim()]
      return { ...withStats, _role: adminRole || detectRole(withStats), _score: computeScore(withStats) }
    }),
    [players, adminRoles]
  )

  const squadStats = useMemo(() => {
    const totalRuns = enriched.reduce((s, p) => s + (p._bat?.runs || 0), 0)
    const totalWkts = enriched.reduce((s, p) => s + (p._bowl?.wickets || 0), 0)
    const topScorer = [...enriched].sort((a, b) => (b._bat?.runs||0) - (a._bat?.runs||0))[0]
    const topBowler = [...enriched].sort((a, b) => (b._bowl?.wickets||0) - (a._bowl?.wickets||0))[0]
    // Best strike rate (min 40 runs to qualify) & best economy (min 8 overs)
    const srQualified = enriched.filter(p => (p._bat?.runs||0) >= 40 && parseFloat(p._bat?.strike_rate) > 0)
    const bestSR = [...srQualified].sort((a, b) => parseFloat(b._bat.strike_rate) - parseFloat(a._bat.strike_rate))[0]
    const econQualified = enriched.filter(p => (p._bowl?.overs||0) >= 8 && parseFloat(p._bowl?.economy) > 0)
    const bestEcon = [...econQualified].sort((a, b) => parseFloat(a._bowl.economy) - parseFloat(b._bowl.economy))[0]
    return { totalRuns, totalWkts, topScorer, topBowler, bestSR, bestEcon }
  }, [enriched])

  const TABS = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']

  const filtered = useMemo(() => {
    let arr = enriched
    if (activeTab !== 'All') arr = arr.filter(p => p._role?.split('/').map(r => r.trim()).includes(activeTab))
    if (search.trim()) { const q = search.toLowerCase(); arr = arr.filter(p => (p.name||'').toLowerCase().includes(q)) }
    return arr
  }, [enriched, activeTab, search])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    if (sortBy === 'score')   copy.sort((a, b) => b._score - a._score)
    else if (sortBy === 'name') copy.sort((a, b) => (a.name||'').localeCompare(b.name||''))
    else if (sortBy === 'runs') copy.sort((a, b) => (b._bat?.runs||0) - (a._bat?.runs||0))
    else if (sortBy === 'wickets') copy.sort((a, b) => (b._bowl?.wickets||0) - (a._bowl?.wickets||0))
    return copy
  }, [filtered, sortBy])

  const rankMap = useMemo(() => {
    const all = [...enriched].sort((a, b) => b._score - a._score)
    const m = {}; all.forEach((p, i) => { m[p.id || p.name] = i + 1 }); return m
  }, [enriched])

  const fadeUp = { initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }

  return (
    <div style={{ fontFamily: FONT, background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      {/* Hero */}
      <section style={{
        padding: '140px 24px 80px', textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>2026 Season</div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>Our Squad</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Meet the players representing Tamil United CC in the British Tamils Cricket League.
          </p>

          {/* Squad summary stats — animated count-up */}
          {!loading && enriched.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
              style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              {[
                { icon: '👥', value: enriched.length, label: 'Players' },
                { icon: '🏏', value: squadStats.totalRuns, label: 'Total Runs' },
                { icon: '🎯', value: squadStats.totalWkts, label: 'Wickets' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '12px 22px', backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 26, color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>
                      <AnimatedNumber value={s.value} />
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Champion podium */}
      {!loading && sorted.length >= 3 && activeTab === 'All' && !search && sortBy === 'score' && (
        <section style={{ maxWidth: 880, margin: '0 auto', padding: '70px 24px 0' }}>
          <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ color: SITE.colors.gold, fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 8 }}>Performance Leaderboard</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,34px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Top Performers</h2>
          </motion.div>

          {/* Podium: 2nd | 1st (raised) | 3rd */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 16, alignItems: 'end' }}>
            {[sorted[1], sorted[0], sorted[2]].map((player, slot) => {
              const rank  = slot === 0 ? 2 : slot === 1 ? 1 : 3
              const champ = rank === 1
              const rc    = getRoleConfig(player._role)
              const medal = MEDAL[rank]
              const avatar = champ ? 88 : 64
              return (
                <motion.div
                  key={player.id || player.name}
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: slot === 1 ? 0 : 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -8 }}
                  style={{
                    position: 'relative', marginBottom: champ ? 28 : 0,
                    background: rc.grad, borderRadius: 22, padding: champ ? '30px 18px 26px' : '24px 14px 22px',
                    textAlign: 'center', overflow: 'hidden', cursor: 'default',
                    boxShadow: champ ? `0 24px 70px ${rc.accent}55, 0 0 0 1px ${rc.accent}70` : `0 14px 44px ${rc.accent}35`,
                    border: `1px solid ${rc.accent}55`,
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  {/* champion glow + crown */}
                  {champ && (
                    <>
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 55%)', pointerEvents: 'none' }}/>
                      <motion.div
                        initial={{ scale: 0, rotate: -30 }} whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }} transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                        style={{ fontSize: 30, marginBottom: 2, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.4))' }}
                      >👑</motion.div>
                    </>
                  )}
                  <div style={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, background: 'rgba(255,255,255,0.07)', borderRadius: '50%', pointerEvents: 'none' }}/>

                  <div style={{ fontSize: champ ? 30 : 24, marginBottom: 10, position: 'relative', zIndex: 1 }}>{medal.emoji}</div>

                  {/* avatar with ring */}
                  <div style={{
                    width: avatar, height: avatar, borderRadius: '50%', overflow: 'hidden',
                    margin: '0 auto 14px', border: `3px solid rgba(255,255,255,0.5)`,
                    boxShadow: champ ? '0 8px 28px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.3)',
                    position: 'relative', zIndex: 1,
                  }}>
                    {player.photoUrl
                      ? <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: player.photoPos || 'center top' }}/>
                      : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: champ ? 26 : 18, color: '#fff' }}>{(player.name||'').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
                    }
                  </div>

                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: champ ? 16 : 13, color: '#fff', marginBottom: 3, lineHeight: 1.2, position: 'relative', zIndex: 1 }}>{player.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '2px 9px', marginBottom: 12, position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: 9 }}>{getRoleIcon(player._role)}</span>
                    <span style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' }}>{player._role}</span>
                  </div>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: champ ? 40 : 30, color: '#fff', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                    <AnimatedNumber value={player._score} decimals={player._score % 1 !== 0 ? 1 : 0} />
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5, position: 'relative', zIndex: 1 }}>TUCC Score</div>

                  {/* podium base block */}
                  <div style={{
                    marginTop: 16, marginLeft: -18, marginRight: -18, marginBottom: champ ? -26 : -22,
                    height: champ ? 26 : 16, background: 'rgba(0,0,0,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT, fontWeight: 900, fontSize: champ ? 14 : 11, color: 'rgba(255,255,255,0.75)',
                    position: 'relative', zIndex: 1,
                  }}>{rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD'}</div>
                </motion.div>
              )
            })}
          </div>
        </section>
      )}

      {/* Team performance dashboard */}
      {!loading && enriched.length > 0 && (
        <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px 0' }}>
          <motion.div {...fadeUp} style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ color: SITE.colors.gold, fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 8 }}>2026 Season</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Squad at a Glance</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14 }}>
            <DashCard icon="🏏" accent="#3b82f6" label="Top Run Scorer"
              name={squadStats.topScorer?.name} value={squadStats.topScorer?._bat?.runs ?? 0} unit="runs"
              ratio={1} />
            <DashCard icon="🎯" accent="#f59e0b" label="Top Wicket Taker"
              name={squadStats.topBowler?.name} value={squadStats.topBowler?._bowl?.wickets ?? 0} unit="wkts"
              ratio={1} />
            <DashCard icon="⚡" accent="#10b981" label="Best Strike Rate"
              name={squadStats.bestSR?.name} value={squadStats.bestSR ? parseFloat(squadStats.bestSR._bat.strike_rate) : 0} unit="SR" decimals={1}
              ratio={squadStats.bestSR ? Math.min(parseFloat(squadStats.bestSR._bat.strike_rate) / 200, 1) : 0} />
            <DashCard icon="🛡️" accent="#a855f7" label="Best Economy"
              name={squadStats.bestEcon?.name} value={squadStats.bestEcon ? parseFloat(squadStats.bestEcon._bowl.economy) : 0} unit="econ" decimals={2}
              ratio={squadStats.bestEcon ? Math.max(0, 1 - parseFloat(squadStats.bestEcon._bowl.economy) / 12) : 0} />
          </div>
        </section>
      )}

      {/* Controls + Grid */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 100px' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players…"
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: FONT, fontSize: 14, color: '#fff',
              background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: 12, padding: '11px 14px 11px 40px', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = SITE.colors.gold}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 18, padding: 0 }}>×</button>
          )}
        </div>

        {/* Tabs + sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                fontFamily: FONT, fontWeight: tab === activeTab ? 700 : 500, fontSize: 12,
                padding: '7px 14px', borderRadius: 20,
                border: `1.5px solid ${tab === activeTab ? SITE.colors.gold : 'rgba(255,255,255,0.15)'}`,
                background: tab === activeTab ? SITE.colors.gold : 'rgba(255,255,255,0.05)',
                color: tab === activeTab ? '#000' : 'rgba(255,255,255,0.65)',
                cursor: 'pointer', transition: 'all 0.18s',
              }}>
                {tab === 'All' ? `All (${enriched.length})` : tab}
              </button>
            ))}
          </div>
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ fontFamily: FONT, fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', flexShrink: 0 }}
          >
            <option value="score">Score ↓</option>
            <option value="name">Name A–Z</option>
            <option value="runs">Runs ↓</option>
            <option value="wickets">Wickets ↓</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: SITE.colors.gold, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}/>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading squad…</p>
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
            <AnimatePresence mode="popLayout">
              {sorted.map((player, index) => {
                const key     = player.id || player.name
                const rank    = rankMap[key] || 99
                const profile = profiles[player.id] || profiles[(player.name||'').toLowerCase().trim()] || null
                return (
                  <PlayerCard key={key} player={player} rank={rank} profile={profile} index={index} />
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🏏</div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>No players found.</p>
            {search && <button onClick={() => setSearch('')} style={{ fontFamily: FONT, fontSize: 13, color: SITE.colors.gold, background: 'none', border: `1px solid ${SITE.colors.gold}`, borderRadius: 8, padding: '7px 18px', cursor: 'pointer', marginTop: 10 }}>Clear search</button>}
          </div>
        )}
      </section>

      <PublicFooter />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
