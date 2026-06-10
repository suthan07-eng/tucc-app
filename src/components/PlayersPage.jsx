import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { C, FONT, ADMIN_EMAIL } from '../constants'
import { useAuth } from '../context/AuthContext'
import statsJson from '../data/stats-2026.json'
import Nav from './Nav'
import Footer from './Footer'

// ─── Name-match helper (mirrors logic in api/players.js) ─────────────────────
const COMMON_WORDS = new Set(['mohamed', 'daniel', 'anton', 'kumar', 'raj'])
function matchStat(arr, name) {
  if (!arr?.length || !name) return null
  const lower = name.toLowerCase().trim()
  // 1. Exact
  let hit = arr.find(p => p.name.toLowerCase().trim() === lower)
  if (hit) return hit
  // 2. Partial — all non-common, >2-char words from player name appear in stat name
  const words = lower.split(' ').filter(w => w.length > 2 && !COMMON_WORDS.has(w))
  if (words.length >= 2) {
    hit = arr.find(p => {
      const n = p.name.toLowerCase()
      return words.every(w => n.includes(w))
    })
    if (hit) return hit
  }
  return null
}

// ─── Score Ring (matches AnalysePage style) ──────────────────────────────────
function ScoreRing({ score, size = 56 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = (Math.min(score, 100) / 100) * circ
  const col = score >= 75 ? C.ok : score >= 55 ? C.gold : score >= 35 ? C.green : C.gray3
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.gray2} strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={5}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={col} style={{ fontFamily: FONT, fontWeight: 800, fontSize: size * 0.27 }}>
        {Math.round(score)}
      </text>
    </svg>
  )
}

// ─── Medal badge for top 3 ────────────────────────────────────────────────────
function MedalBadge({ rank }) {
  const medals = {
    1: { label: '🥇 #1', bg: '#FEF3C7', color: '#D97706' },
    2: { label: '🥈 #2', bg: '#F1F5F9', color: '#64748B' },
    3: { label: '🥉 #3', bg: '#FEF3C7', color: '#B45309' },
  }
  const m = medals[rank]
  if (!m) return null
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, background: m.bg, color: m.color, borderRadius: 20, padding: '3px 10px', fontFamily: FONT, fontWeight: 800, fontSize: 11, letterSpacing: 0.3, zIndex: 2 }}>
      {m.label}
    </div>
  )
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, highlight }) {
  return (
    <div style={{ background: highlight ? `${C.green}12` : C.gray1, border: `1px solid ${highlight ? C.green + '30' : C.gray2}`, borderRadius: 10, padding: '9px 14px', minWidth: 60, textAlign: 'center', flex: '1 1 60px' }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: highlight ? C.green : C.dark, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontFamily: FONT, fontSize: 9, color: C.gray4, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}

// ─── TUCC Performance Score formula ──────────────────────────────────────────
function computeScore(player) {
  const bat  = player._bat
  const bowl = player._bowl
  const matches = player.stats?.matches || bat?.matches || bowl?.matches || 1

  // Batting sub-score 0-100
  let batScore = 0
  if (bat) {
    const runsNorm = Math.min((bat.runs || 0) / 300, 1) * 40
    const sr = parseFloat(bat.strike_rate) || 0
    const srPts = sr >= 120 ? 30 : sr >= 90 ? 22 : sr >= 70 ? 15 : sr >= 50 ? 9 : 5
    const avgNorm = Math.min((parseFloat(bat.average) || 0) / 60, 1) * 20
    const milestones = Math.min((bat.fifties || 0) * 2 + (bat.hundreds || 0) * 5, 10)
    batScore = runsNorm + srPts + avgNorm + milestones
  }

  // Bowling sub-score 0-100
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

  // Role
  const role = detectRole(player)
  let composite = 0
  let bonus = 0
  if (role === 'Bowler') {
    composite = batScore * 0.20 + bowlScore * 0.80
  } else if (role === 'Batsman' || role === 'Wicket-Keeper') {
    composite = batScore * 0.80 + bowlScore * 0.20
  } else {
    const ar_runs  = bat?.runs   || 0
    const ar_wkts  = bowl?.wickets || 0
    bonus = ar_runs >= 25 && ar_wkts >= 3 ? Math.min((ar_runs / 60 + ar_wkts / 5) * 5, 10) : 0
    composite = batScore * 0.50 + bowlScore * 0.50 + bonus
  }

  const engMult   = 0.85 + 0.15 * Math.min(matches / 8, 1.0)
  const confidence = Math.min(0.4 + Math.max(matches - 1, 0) / 3 * 0.6, 1.0)
  const final = Math.min(composite * engMult * confidence, 100)

  return {
    score:      Math.round(final * 10) / 10,
    batScore:   Math.round(batScore),
    bowlScore:  Math.round(bowlScore),
    engMult:    Math.round(engMult * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  }
}

function detectRole(player) {
  const batStyle  = (player.batStyle  || '').toLowerCase()
  const bowlStyle = (player.bowlStyle || '').toLowerCase()
  const isWK = batStyle.includes('wicket') || bowlStyle.includes('wicket')
  if (isWK) return 'Wicket-Keeper'
  const hasBat  = player._bat  && (player._bat.innings  || player._bat.matches  || 0) >= 1
  const hasBowl = player._bowl && (player._bowl.overs || 0) >= 4
  if (hasBat && hasBowl) return 'All-Rounder'
  if (hasBowl)  return 'Bowler'
  if (bowlStyle && !hasBat) return 'Bowler'
  return 'Batsman'
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    'Batsman':       { bg: '#EFF6FF', color: '#2563EB' },
    'Bowler':        { bg: '#FEF3C7', color: '#D97706' },
    'All-Rounder':   { bg: '#F0FDF4', color: '#16A34A' },
    'Wicket-Keeper': { bg: '#FDF4FF', color: '#9333EA' },
  }
  const s = map[role] || { bg: C.gray1, color: C.gray4 }
  return (
    <span style={{ background: s.bg, color: s.color, fontFamily: FONT, fontWeight: 700, fontSize: 10, padding: '3px 9px', borderRadius: 20, letterSpacing: 0.4, textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
      {role}
    </span>
  )
}

// ─── Individual Player Card ───────────────────────────────────────────────────
function PlayerCard({ player, rank, cachedScore, isAdmin }) {
  const [expanded, setExpanded] = useState(false)
  const role = detectRole(player)
  const { score, batScore, bowlScore } = computeScore(player)
  const bat  = player._bat
  const bowl = player._bowl
  const hasCache = !!cachedScore?.headline
  const isTopThree = rank <= 3

  const borderColor = rank === 1 ? '#D97706' : rank === 2 ? '#94A3B8' : rank === 3 ? '#B45309' : C.gray2
  const boxShadow   = rank === 1
    ? '0 0 0 2px #FEF3C7, 0 4px 24px rgba(217,119,6,0.15)'
    : rank === 2
    ? '0 0 0 2px #F1F5F9, 0 4px 16px rgba(100,116,139,0.12)'
    : rank === 3
    ? '0 0 0 2px #FEF3C7, 0 4px 16px rgba(180,83,9,0.12)'
    : `0 2px 12px ${C.shadowMd}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      style={{ position: 'relative', background: C.white, borderRadius: 18, boxShadow, border: `2px solid ${borderColor}`, overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => setExpanded(e => !e)}
    >
      {isTopThree && <MedalBadge rank={rank} />}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 18px 14px' }}>
        {/* Photo / initials */}
        <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: C.gray1, border: `2px solid ${C.gray2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 18, color: C.gray3 }}>
          {player.photoUrl
            ? <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: player.photoPos || 'center top' }}/>
            : <span>{(player.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
          }
        </div>

        {/* Name + role + headline */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: isTopThree ? 56 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: C.dark, lineHeight: 1.2 }}>{player.name}</span>
            <RoleBadge role={role} />
          </div>
          {hasCache
            ? <p style={{ fontFamily: FONT, fontSize: 12, color: C.gray4, margin: 0, lineHeight: 1.45 }}>{cachedScore.headline}</p>
            : <p style={{ fontFamily: FONT, fontSize: 12, color: C.gray3, margin: 0, fontStyle: 'italic' }}>
                {player.stats?.matches ? `${player.stats.matches} match${player.stats.matches > 1 ? 'es' : ''} · ${role}` : role}
              </p>
          }
        </div>

        <ScoreRing score={score} size={56} />
      </div>

      {/* ── Stat tiles ── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 14px 14px', flexWrap: 'wrap' }}>
        {bat && <>
          <StatTile label="Runs"  value={bat.runs} />
          <StatTile label="Avg"   value={bat.average} />
          <StatTile label="SR"    value={bat.strike_rate} highlight />
          {(bat.highest > 0) && <StatTile label="HS" value={bat.highest + (bat.highest_no ? '*' : '')} />}
        </>}
        {bowl && (bowl.overs || 0) >= 4 && <>
          <StatTile label="Wkts" value={bowl.wickets} highlight />
          <StatTile label="Econ" value={bowl.economy} />
          {bowl.best_wickets != null && <StatTile label="Best" value={`${bowl.best_wickets}/${bowl.best_runs}`} />}
        </>}
        {!bat && (!bowl || (bowl.overs || 0) < 4) && (
          <StatTile label="Matches" value={player.stats?.matches || '—'} />
        )}
      </div>

      {/* ── Expand footer ── */}
      <div style={{ borderTop: `1px solid ${C.gray2}`, padding: '8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray3 }}>
          {expanded ? 'Hide profile' : hasCache ? 'View AI profile' : 'View breakdown'}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke={C.gray3} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '4px 18px 18px', borderTop: `1px solid ${C.gray1}` }}>

              {/* Score breakdown */}
              <div style={{ margin: '12px 0 14px', padding: '10px 14px', background: C.gray1, borderRadius: 10 }}>
                <div style={{ fontFamily: FONT, fontSize: 10, color: C.gray4, fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Score Breakdown</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {bat && <div style={{ fontFamily: FONT, fontSize: 12, color: C.gray5 }}>⚡ Batting sub-score: <strong style={{ color: C.dark }}>{batScore}</strong>/100</div>}
                  {bowl && (bowl.overs || 0) >= 4 && <div style={{ fontFamily: FONT, fontSize: 12, color: C.gray5 }}>🎯 Bowling sub-score: <strong style={{ color: C.dark }}>{bowlScore}</strong>/100</div>}
                  <div style={{ fontFamily: FONT, fontSize: 12, color: C.gray5 }}>🏏 Overall: <strong style={{ color: C.green }}>{score}</strong>/100</div>
                </div>
              </div>

              {/* AI content */}
              {hasCache ? (
                <div>
                  {cachedScore.ai_profile && (
                    <p style={{ fontFamily: FONT, fontSize: 13, color: C.gray5, lineHeight: 1.65, margin: '0 0 14px' }}>
                      {cachedScore.ai_profile}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    {(cachedScore.strengths || []).length > 0 && (
                      <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontFamily: FONT, fontSize: 10, color: C.ok, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>Strengths</div>
                        {(cachedScore.strengths || []).map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                            <span style={{ color: C.ok, fontSize: 11, marginTop: 1, flexShrink: 0 }}>✓</span>
                            <span style={{ fontFamily: FONT, fontSize: 12, color: C.gray5, lineHeight: 1.4 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(cachedScore.development_areas || []).length > 0 && (
                      <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontFamily: FONT, fontSize: 10, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>Growth Areas</div>
                        {(cachedScore.development_areas || []).map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                            <span style={{ color: C.gold, fontSize: 11, marginTop: 1, flexShrink: 0 }}>→</span>
                            <span style={{ fontFamily: FONT, fontSize: 12, color: C.gray5, lineHeight: 1.4 }}>{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {cachedScore.role_notes && (
                    <div style={{ background: `${C.green}0d`, border: `1px solid ${C.green}20`, borderRadius: 10, padding: '10px 13px' }}>
                      <div style={{ fontFamily: FONT, fontSize: 10, color: C.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Team Role</div>
                      <p style={{ fontFamily: FONT, fontSize: 12, color: C.gray5, margin: 0, lineHeight: 1.55 }}>{cachedScore.role_notes}</p>
                    </div>
                  )}

                  {cachedScore.generated_at && (
                    <p style={{ fontFamily: FONT, fontSize: 10, color: C.gray3, margin: '10px 0 0', textAlign: 'right' }}>
                      AI profile · {new Date(cachedScore.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ padding: '12px', background: C.gray1, borderRadius: 10, textAlign: 'center' }}>
                  <p style={{ fontFamily: FONT, fontSize: 12, color: C.gray4, margin: 0 }}>
                    No AI profile yet.{isAdmin ? ' Click "Generate / Refresh All Profiles" above.' : ' Check back soon — profiles are updated by the admin.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── PlayersPage ──────────────────────────────────────────────────────────────
export default function PlayersPage() {
  const { user } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL || user?.email?.endsWith('@tucc.club')

  const [players, setPlayers]           = useState([])
  const [cachedScores, setCachedScores] = useState({})
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [activeTab, setActiveTab]       = useState('All')
  const [sortBy, setSortBy]             = useState('score')
  const [generating, setGenerating]     = useState(false)
  const [genProgress, setGenProgress]   = useState('')
  const [showMethodology, setShowMethodology] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [playersRes, scoresRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/player-profiles?action=scores&season=2026'),
        ])
        const playersRaw  = await playersRes.json()
        const scoresRaw   = await scoresRes.json()

        const enriched = (playersRaw.players || playersRaw || []).map(p => ({
          ...p,
          name: p.name || `${p.forename || ''} ${p.surname || ''}`.trim(),
        }))
        setPlayers(enriched)

        // Index by both btcl_player_id AND player_name for reliable lookup
        const scoreMap = {}
        for (const s of (scoresRaw.scores || [])) {
          scoreMap[s.btcl_player_id] = s
          if (s.player_name) scoreMap[s.player_name.toLowerCase().trim()] = s
        }
        setCachedScores(scoreMap)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const enriched = useMemo(() =>
    players.map(p => {
      const withStats = {
        ...p,
        _bat:  matchStat(statsJson.batting,  p.name),
        _bowl: matchStat(statsJson.bowling,  p.name),
      }
      return { ...withStats, _computed: computeScore(withStats), _role: detectRole(withStats) }
    }),
    [players]
  )

  const TAB_OPTIONS = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']

  const filtered = useMemo(() =>
    activeTab === 'All' ? enriched : enriched.filter(p => p._role === activeTab),
    [enriched, activeTab]
  )

  const sorted = useMemo(() => {
    const copy = [...filtered]
    if      (sortBy === 'score')   copy.sort((a, b) => b._computed.score - a._computed.score)
    else if (sortBy === 'name')    copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    else if (sortBy === 'runs')    copy.sort((a, b) => (b.batting?.runs || 0) - (a.batting?.runs || 0))
    else if (sortBy === 'wickets') copy.sort((a, b) => (b.bowling?.wickets || 0) - (a.bowling?.wickets || 0))
    return copy
  }, [filtered, sortBy])

  // Global rank (across all players, by score)
  const rankMap = useMemo(() => {
    const allByScore = [...enriched].sort((a, b) => b._computed.score - a._computed.score)
    const m = {}
    allByScore.forEach((p, i) => { m[p.id || p.name] = i + 1 })
    return m
  }, [enriched])

  const handleGenerateAll = useCallback(async () => {
    if (!isAdmin || generating) return
    setGenerating(true)
    setGenProgress('Starting...')
    const results = []
    for (let i = 0; i < enriched.length; i++) {
      const p = enriched[i]
      setGenProgress(`Generating ${i + 1}/${enriched.length}: ${p.name}…`)
      try {
        const aiRes = await fetch('/api/player-profiles?action=generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player: { name: p.name },
            stats: { batting: p._bat, bowling: p._bowl },
            score: p._computed.score,
            role: p._role,
          }),
        })
        const aiData  = await aiRes.json()
        const profile = aiData.profile || {}
        const record  = {
          btcl_player_id: p.id || (i + 1),
          player_name:    p.name,
          season:         '2026',
          role:           p._role,
          score:          p._computed.score,
          score_breakdown: p._computed,
          headline:        profile.headline            || '',
          ai_profile:      profile.ai_profile          || '',
          strengths:       profile.strengths            || [],
          development_areas: profile.development_areas || [],
          role_notes:      profile.role_notes           || '',
          generated_at:    new Date().toISOString(),
        }
        await fetch('/api/player-profiles?action=scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        })
        results.push(record)
      } catch (e) {
        console.error(`Profile gen failed for ${p.name}:`, e)
      }
    }
    const scoreMap = {}
    for (const s of results) scoreMap[s.btcl_player_id] = s
    setCachedScores(prev => ({ ...prev, ...scoreMap }))
    setGenProgress(`✅ Done — ${results.length}/${enriched.length} profiles generated.`)
    setGenerating(false)
  }, [enriched, isAdmin, generating])

  // ── Loading ──
  if (loading) {
    return (
      <>
        <Nav />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${C.gray2}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}/>
            <p style={{ fontFamily: FONT, color: C.gray4, fontSize: 14 }}>Loading squad…</p>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Nav />
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontFamily: FONT, color: C.red, fontSize: 14 }}>Failed to load players: {error}</p>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
    <Nav />
    <div style={{ padding: '24px 16px 80px', maxWidth: 780, margin: '0 auto' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ background: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.green} 100%)`, borderRadius: 20, padding: '28px 24px 22px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80,  height: 80,  background: 'rgba(255,255,255,0.04)', borderRadius: '50%', pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>TUCC · 2026 Season</div>
          <h1 style={{ fontFamily: FONT, fontWeight: 900, fontSize: 26, color: '#fff', margin: '0 0 8px', lineHeight: 1.1 }}>Our Squad</h1>
          <p style={{ fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: '0 0 18px', lineHeight: 1.55 }}>
            TUCC Performance Scores reflect each player's 2026 BTCL Premier Division contributions — role-weighted, confidence-adjusted.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { v: players.length, l: 'Squad size' },
              { v: enriched.filter(p => p._role === 'Batsman' || p._role === 'Wicket-Keeper').length, l: 'Batters' },
              { v: enriched.filter(p => p._role === 'Bowler').length, l: 'Bowlers' },
              { v: enriched.filter(p => p._role === 'All-Rounder').length, l: 'All-rounders' },
            ].map(({ v, l }) => (
              <div key={l} style={{ flex: '1 1 90px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px' }}>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 18, color: '#fff' }}>{v}</div>
                <div style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Admin panel ── */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ background: '#FFFBEB', border: `1px solid ${C.gold}50`, borderRadius: 14, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: '#92400E' }}>⚙️ Admin</div>
            {genProgress && <div style={{ fontFamily: FONT, fontSize: 11, color: '#B45309', marginTop: 3 }}>{genProgress}</div>}
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            style={{ background: generating ? C.gray2 : C.gold, color: generating ? C.gray4 : '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 10, padding: '8px 16px', cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.2s' }}
          >
            {generating
              ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }}/>Generating…</>
              : '✨ Generate / Refresh All Profiles'}
          </button>
        </motion.div>
      )}

      {/* ── Tabs + sort ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {TAB_OPTIONS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ fontFamily: FONT, fontWeight: tab === activeTab ? 700 : 500, fontSize: 12, padding: '6px 13px', borderRadius: 20, border: `1.5px solid ${tab === activeTab ? C.green : C.gray2}`, background: tab === activeTab ? C.green : C.white, color: tab === activeTab ? '#fff' : C.gray4, cursor: 'pointer', transition: 'all .2s' }}
            >
              {tab}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ fontFamily: FONT, fontSize: 12, color: C.gray5, background: C.white, border: `1.5px solid ${C.gray2}`, borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}
        >
          <option value="score">Sort: Score</option>
          <option value="name">Sort: Name</option>
          <option value="runs">Sort: Runs</option>
          <option value="wickets">Sort: Wickets</option>
        </select>
      </div>

      {/* ── Methodology note ── */}
      <button
        onClick={() => setShowMethodology(m => !m)}
        style={{ fontFamily: FONT, fontSize: 11, color: C.gray3, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
      >
        {showMethodology ? '▲ Hide' : '▼ How is the Performance Score calculated?'}
      </button>
      <AnimatePresence>
        {showMethodology && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: 14 }}
          >
            <div style={{ background: C.gray1, borderRadius: 12, padding: '14px 16px', fontFamily: FONT, fontSize: 12, color: C.gray5, lineHeight: 1.65 }}>
              <strong style={{ color: C.dark }}>TUCC Performance Score (0–100)</strong> is computed from 2026 BTCL stats using role-weighted batting and bowling sub-scores.<br/><br/>
              <strong>Batting sub-score:</strong> runs (up to 40pts) + strike rate tier (up to 30pts) + average (up to 20pts) + milestones (capped 10pts).<br/>
              <strong>Bowling sub-score:</strong> wickets (up to 40pts) + economy tier (up to 30pts) + average tier (up to 20pts) + 5-fers (capped 10pts).<br/>
              <strong>Role weights:</strong> Batters/WK — 80% bat / 20% bowl. Bowlers — 20% bat / 80% bowl. All-rounders — 50/50 + up to 10pt bonus.<br/>
              <strong>Confidence adjustment:</strong> scores for players with fewer than 4 matches are scaled down to prevent small-sample inflation.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Count line ── */}
      <p style={{ fontFamily: FONT, fontSize: 12, color: C.gray3, margin: '0 0 14px' }}>
        {sorted.length} player{sorted.length !== 1 ? 's' : ''}
        {activeTab !== 'All' ? ` · ${activeTab}` : ''}
        {Object.keys(cachedScores).length > 0 ? ` · ${Object.keys(cachedScores).length} AI profiles` : ''}
      </p>

      {/* ── Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
        <AnimatePresence mode="popLayout">
          {sorted.map(player => {
            const key    = player.id || player.name
            const rank   = rankMap[key] || 99
            const cached = cachedScores[player.id]
              || cachedScores[(player.name || '').toLowerCase().trim()]
              || null
            return (
              <PlayerCard
                key={key}
                player={player}
                rank={rank}
                cachedScore={cached}
                isAdmin={isAdmin}
              />
            )
          })}
        </AnimatePresence>
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.gray3 }}>No players found for this filter.</p>
        </div>
      )}
    </div>
    <Footer />
    </>
  )
}
