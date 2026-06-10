import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { C, FONT, ADMIN_EMAIL } from '../constants'
import { useAuth } from '../context/AuthContext'
import statsJson from '../data/stats-2026.json'
import Nav from './Nav'
import Footer from './Footer'

// ─── Name-match helper ────────────────────────────────────────────────────────
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

// ─── Score helpers ────────────────────────────────────────────────────────────
function computeScore(player) {
  const bat  = player._bat
  const bowl = player._bowl
  const matches = player.stats?.matches || bat?.matches || bowl?.matches || 1
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
  const engMult   = 0.85 + 0.15 * Math.min(matches / 8, 1)
  const confidence = Math.min(0.4 + Math.max(matches - 1, 0) / 3 * 0.6, 1)
  const final = Math.min(composite * engMult * confidence, 100)
  return { score: Math.round(final * 10) / 10, batScore: Math.round(batScore), bowlScore: Math.round(bowlScore) }
}

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

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  'Batsman':       { grad: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%)', accent: '#3b82f6', light: '#eff6ff', text: '#1e40af', icon: '🏏' },
  'Bowler':        { grad: 'linear-gradient(135deg,#92400e 0%,#f59e0b 100%)', accent: '#f59e0b', light: '#fffbeb', text: '#92400e', icon: '🎯' },
  'All-Rounder':   { grad: 'linear-gradient(135deg,#065f46 0%,#10b981 100%)', accent: '#10b981', light: '#ecfdf5', text: '#065f46', icon: '⚡' },
  'Wicket-Keeper': { grad: 'linear-gradient(135deg,#581c87 0%,#a855f7 100%)', accent: '#a855f7', light: '#faf5ff', text: '#581c87', icon: '🧤' },
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 72, accent = '#3b82f6' }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const fill = (Math.min(score, 100) / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, filter: `drop-shadow(0 0 8px ${accent}50)` }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#fff" strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter: `drop-shadow(0 0 4px ${accent})` }}/>
      <text x={size/2} y={size/2 - 3} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.28 }}>
        {Math.round(score)}
      </text>
      <text x={size/2} y={size/2 + size * 0.22} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.6)" style={{ fontFamily: FONT, fontWeight: 600, fontSize: size * 0.14 }}>
        /100
      </text>
    </svg>
  )
}

// ─── Mini score ring for list view ───────────────────────────────────────────
function MiniRing({ score, size = 44 }) {
  const col = score >= 50 ? C.green : score >= 35 ? C.gold : C.gray3
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const fill = (Math.min(score, 100) / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.gray2} strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={4}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={col} style={{ fontFamily: FONT, fontWeight: 800, fontSize: size * 0.3 }}>
        {Math.round(score)}
      </text>
    </svg>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, highlight, dark }) {
  if (value == null || value === '') return null
  return (
    <div style={{
      background: dark
        ? (highlight ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)')
        : (highlight ? `${C.green}14` : C.gray1),
      border: dark
        ? `1px solid ${highlight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`
        : `1px solid ${highlight ? C.green + '30' : C.gray2}`,
      borderRadius: 10, padding: '8px 12px', textAlign: 'center', flex: '1 1 56px', minWidth: 52,
    }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: dark ? '#fff' : (highlight ? C.green : C.dark), lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 9, color: dark ? 'rgba(255,255,255,0.55)' : C.gray3, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  )
}

// ─── Medal ────────────────────────────────────────────────────────────────────
const MEDAL = {
  1: { emoji: '🥇', label: '#1', bg: 'rgba(217,119,6,0.9)', glow: '#FEF3C7' },
  2: { emoji: '🥈', label: '#2', bg: 'rgba(100,116,139,0.9)', glow: '#F1F5F9' },
  3: { emoji: '🥉', label: '#3', bg: 'rgba(180,83,9,0.9)', glow: '#FEF3C7' },
}

// ─── Player Card (full) ────────────────────────────────────────────────────────
function PlayerCard({ player, rank, cachedScore, isAdmin, index }) {
  const [expanded, setExpanded] = useState(false)
  const role     = detectRole(player)
  const rc       = ROLE_CONFIG[role] || ROLE_CONFIG['Batsman']
  const { score, batScore, bowlScore } = computeScore(player)
  const bat      = player._bat
  const bowl     = player._bowl
  const hasCache = !!(cachedScore?.headline || cachedScore?.ai_profile)
  const medal    = MEDAL[rank]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: Math.min(index * 0.04, 0.3) }}
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: medal
          ? `0 0 0 2px ${medal.glow}, 0 8px 32px rgba(30,58,138,0.18)`
          : `0 4px 20px rgba(30,58,138,0.10)`,
        background: '#fff',
        border: medal ? `2px solid ${medal.bg}` : `1.5px solid ${C.gray2}`,
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* ── Gradient header ── */}
      <div style={{
        background: rc.grad,
        padding: '20px 20px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background texture bubbles */}
        <div style={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, background: 'rgba(255,255,255,0.07)', borderRadius: '50%', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -16, left: '40%', width: 70, height: 70, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }}/>

        {/* Medal */}
        {medal && (
          <div style={{ position: 'absolute', top: 14, left: 14, background: medal.bg, borderRadius: 20, padding: '3px 10px 3px 8px', display: 'flex', alignItems: 'center', gap: 4, zIndex: 2, backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: 12 }}>{medal.emoji}</span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 11, color: '#fff' }}>{medal.label}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1, paddingTop: medal ? 28 : 0 }}>
          {/* Photo */}
          <div style={{
            width: 72, height: 72, borderRadius: 16, overflow: 'hidden', flexShrink: 0,
            background: 'rgba(255,255,255,0.15)',
            border: '2.5px solid rgba(255,255,255,0.35)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            {player.photoUrl
              ? <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: player.photoPos || 'center top' }}/>
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 22, color: 'rgba(255,255,255,0.7)' }}>
                  {(player.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
            }
          </div>

          {/* Name + role + headline */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 15, color: '#fff', lineHeight: 1.2 }}>
                {player.name}
              </span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>
              <span style={{ fontSize: 10 }}>{rc.icon}</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' }}>{role}</span>
            </div>
            {hasCache && (
              <p style={{ fontFamily: FONT, fontSize: 11.5, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {cachedScore.headline}
              </p>
            )}
          </div>

          {/* Score ring */}
          <ScoreRing score={score} size={68} accent={rc.accent} />
        </div>

        {/* Stat pills on gradient */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {bat && <>
            <StatPill dark label="Runs" value={bat.runs} />
            <StatPill dark label="Avg"  value={bat.average} />
            <StatPill dark label="SR"   value={bat.strike_rate} highlight />
            {bat.highest > 0 && <StatPill dark label="HS"  value={bat.highest + (bat.highest_no ? '*' : '')} />}
            {(bat.fifties > 0 || bat.hundreds > 0) && (
              <StatPill dark label="50s/100s" value={`${bat.fifties || 0}/${bat.hundreds || 0}`} />
            )}
          </>}
          {bowl && (bowl.overs || 0) >= 4 && <>
            <StatPill dark label="Wkts" value={bowl.wickets} highlight />
            <StatPill dark label="Econ" value={bowl.economy} />
            <StatPill dark label="Avg"  value={bowl.average} />
            {bowl.best_wickets != null && <StatPill dark label="Best" value={`${bowl.best_wickets}/${bowl.best_runs}`} />}
          </>}
        </div>
      </div>

      {/* ── Expand toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: '#fafafa', borderBottom: expanded ? `1px solid ${C.gray2}` : 'none' }}>
        <span style={{ fontFamily: FONT, fontSize: 11.5, color: C.gray4, fontWeight: 600 }}>
          {expanded ? 'Hide profile' : hasCache ? 'View profile & breakdown' : 'View score breakdown'}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke={C.gray3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
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
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 18px 20px', background: '#fff' }}>

              {/* Score breakdown */}
              <div style={{ background: `linear-gradient(135deg,${rc.light},#fff)`, border: `1px solid ${rc.accent}25`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontFamily: FONT, fontSize: 10, color: rc.text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Score Breakdown</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {bat && (
                    <div style={{ flex: '1 1 90px', background: '#fff', borderRadius: 10, padding: '8px 12px', border: `1px solid ${C.gray2}`, textAlign: 'center' }}>
                      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 18, color: C.green }}>{batScore}</div>
                      <div style={{ fontFamily: FONT, fontSize: 9, color: C.gray3, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>⚡ Batting</div>
                    </div>
                  )}
                  {bowl && (bowl.overs || 0) >= 4 && (
                    <div style={{ flex: '1 1 90px', background: '#fff', borderRadius: 10, padding: '8px 12px', border: `1px solid ${C.gray2}`, textAlign: 'center' }}>
                      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 18, color: C.gold }}>{bowlScore}</div>
                      <div style={{ fontFamily: FONT, fontSize: 9, color: C.gray3, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>🎯 Bowling</div>
                    </div>
                  )}
                  <div style={{ flex: '1 1 90px', background: rc.grad, borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 18, color: '#fff' }}>{score}</div>
                    <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>🏏 Overall</div>
                  </div>
                </div>
              </div>

              {hasCache ? (
                <>
                  {/* AI profile text */}
                  {cachedScore.ai_profile && (
                    <p style={{ fontFamily: FONT, fontSize: 13, color: C.gray5, lineHeight: 1.7, margin: '0 0 16px', padding: '0 2px' }}>
                      {cachedScore.ai_profile}
                    </p>
                  )}

                  {/* Strengths + Growth */}
                  {((cachedScore.strengths || []).length > 0 || (cachedScore.development_areas || []).length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      {(cachedScore.strengths || []).filter(Boolean).length > 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ fontFamily: FONT, fontSize: 10, color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>✓ Strengths</div>
                          {(cachedScore.strengths || []).filter(Boolean).map((s, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', flexShrink: 0, marginTop: 5 }}/>
                              <span style={{ fontFamily: FONT, fontSize: 11.5, color: '#166534', lineHeight: 1.45 }}>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(cachedScore.development_areas || []).filter(Boolean).length > 0 && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ fontFamily: FONT, fontSize: 10, color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>→ Growth Areas</div>
                          {(cachedScore.development_areas || []).filter(Boolean).map((d, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#d97706', flexShrink: 0, marginTop: 5 }}/>
                              <span style={{ fontFamily: FONT, fontSize: 11.5, color: '#78350f', lineHeight: 1.45 }}>{d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Team Role */}
                  {cachedScore.role_notes && (
                    <div style={{ background: `linear-gradient(135deg,${rc.light},#fff)`, border: `1px solid ${rc.accent}30`, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                      <div style={{ fontFamily: FONT, fontSize: 10, color: rc.text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                        {rc.icon} Team Role
                      </div>
                      <p style={{ fontFamily: FONT, fontSize: 12.5, color: C.gray5, margin: 0, lineHeight: 1.6 }}>{cachedScore.role_notes}</p>
                    </div>
                  )}

                  {cachedScore.generated_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/>
                      <span style={{ fontFamily: FONT, fontSize: 10, color: C.gray3 }}>
                        AI profile · {new Date(cachedScore.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '14px', background: '#FFFBEB', border: `1px solid #FDE68A`, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>✨</span>
                  <p style={{ fontFamily: FONT, fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                    AI profile not generated yet.{' '}
                    {isAdmin ? <strong>Go to Admin → Players → Generate All Profiles.</strong> : 'Check back soon!'}
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

// ─── Leaderboard row (compact list view) ─────────────────────────────────────
function LeaderRow({ player, rank, cachedScore, onClick }) {
  const role = detectRole(player)
  const rc   = ROLE_CONFIG[role] || ROLE_CONFIG['Batsman']
  const { score } = computeScore(player)
  const bat  = player._bat
  const bowl = player._bowl
  const medal = MEDAL[rank]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: '#fff',
        borderRadius: 14,
        border: medal ? `1.5px solid ${medal.bg}` : `1px solid ${C.gray2}`,
        boxShadow: medal ? `0 2px 12px rgba(30,58,138,0.12)` : `0 1px 6px rgba(30,58,138,0.06)`,
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(30,58,138,0.14)' }}
    >
      {/* Rank */}
      <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
        {medal
          ? <span style={{ fontSize: 16 }}>{medal.emoji}</span>
          : <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.gray3 }}>#{rank}</span>
        }
      </div>

      {/* Photo */}
      <div style={{ width: 42, height: 42, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: rc.light, border: `2px solid ${rc.accent}40` }}>
        {player.photoUrl
          ? <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: player.photoPos || 'center top' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 14, color: rc.text }}>{(player.name || '').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}</div>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.dark, lineHeight: 1.2, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: rc.light, color: rc.text, fontFamily: FONT, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {rc.icon} {role}
          </span>
          {bat && <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray4 }}>{bat.runs}r</span>}
          {bowl && (bowl.overs || 0) >= 4 && <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray4 }}>{bowl.wickets}w</span>}
        </div>
      </div>

      <MiniRing score={score} />
    </motion.div>
  )
}

// ─── Squad stats banner ───────────────────────────────────────────────────────
function SquadStat({ value, label, sub }) {
  return (
    <div style={{ flex: '1 1 90px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '12px 14px', backdropFilter: 'blur(8px)' }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 22, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{sub}</div>}
    </div>
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
  const [viewMode, setViewMode]         = useState('cards')
  const [generating, setGenerating]     = useState(false)
  const [genProgress, setGenProgress]   = useState('')
  const [searchQuery, setSearchQuery]   = useState('')
  const [showMethodology, setShowMethodology] = useState(false)
  const [focusedPlayer, setFocusedPlayer]     = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [playersRes, scoresRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/player-profiles?action=scores&season=2026'),
        ])
        const playersRaw = await playersRes.json()
        const scoresRaw  = await scoresRes.json()
        const enriched = (playersRaw.players || playersRaw || []).map(p => ({
          ...p,
          name: p.name || `${p.forename || ''} ${p.surname || ''}`.trim(),
        }))
        setPlayers(enriched)
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
      const withStats = { ...p, _bat: matchStat(statsJson.batting, p.name), _bowl: matchStat(statsJson.bowling, p.name) }
      return { ...withStats, _computed: computeScore(withStats), _role: detectRole(withStats) }
    }),
    [players]
  )

  // Squad-wide stats
  const squadStats = useMemo(() => {
    const totalRuns = enriched.reduce((s, p) => s + (p._bat?.runs || 0), 0)
    const totalWkts = enriched.reduce((s, p) => s + (p._bowl?.wickets || 0), 0)
    const topScorer = [...enriched].sort((a,b)=>(b._bat?.runs||0)-(a._bat?.runs||0))[0]
    const topBowler = [...enriched].sort((a,b)=>(b._bowl?.wickets||0)-(a._bowl?.wickets||0))[0]
    const avgScore  = Math.round(enriched.reduce((s,p) => s + p._computed.score, 0) / (enriched.length || 1) * 10) / 10
    return { totalRuns, totalWkts, topScorer, topBowler, avgScore }
  }, [enriched])

  const TAB_OPTIONS = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']

  const filtered = useMemo(() => {
    let arr = activeTab === 'All' ? enriched : enriched.filter(p => p._role === activeTab)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      arr = arr.filter(p => (p.name || '').toLowerCase().includes(q))
    }
    return arr
  }, [enriched, activeTab, searchQuery])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    if      (sortBy === 'score')   copy.sort((a, b) => b._computed.score - a._computed.score)
    else if (sortBy === 'name')    copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    else if (sortBy === 'runs')    copy.sort((a, b) => (b._bat?.runs || 0) - (a._bat?.runs || 0))
    else if (sortBy === 'wickets') copy.sort((a, b) => (b._bowl?.wickets || 0) - (a._bowl?.wickets || 0))
    return copy
  }, [filtered, sortBy])

  const rankMap = useMemo(() => {
    const all = [...enriched].sort((a, b) => b._computed.score - a._computed.score)
    const m = {}; all.forEach((p, i) => { m[p.id || p.name] = i + 1 }); return m
  }, [enriched])

  const handleGenerateAll = useCallback(async () => {
    if (!isAdmin || generating) return
    setGenerating(true); setGenProgress('Starting…')
    const results = []
    for (let i = 0; i < enriched.length; i++) {
      const p = enriched[i]; setGenProgress(`Generating ${i+1}/${enriched.length}: ${p.name}…`)
      try {
        const aiRes = await fetch('/api/player-profiles?action=generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player: { name: p.name }, stats: { batting: p._bat, bowling: p._bowl }, score: p._computed.score, role: p._role }) })
        const { profile = {} } = await aiRes.json()
        const record = { btcl_player_id: p.id || (i+1), player_name: p.name, season: '2026', role: p._role, score: p._computed.score, headline: profile.headline || '', ai_profile: profile.ai_profile || '', strengths: profile.strengths || [], development_areas: profile.development_areas || [], role_notes: profile.role_notes || '', generated_at: new Date().toISOString() }
        await fetch('/api/player-profiles?action=scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) })
        results.push(record)
      } catch(e) { console.error(p.name, e) }
    }
    const sm = {}; for (const s of results) sm[s.btcl_player_id] = s
    setCachedScores(prev => ({ ...prev, ...sm }))
    setGenProgress(`✅ Done — ${results.length}/${enriched.length} profiles generated.`)
    setGenerating(false)
  }, [enriched, isAdmin, generating])

  // ── Loading ──
  if (loading) return (
    <>
      <Nav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${C.gray2}`, borderTopColor: C.green, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}/>
          <p style={{ fontFamily: FONT, color: C.gray4, fontSize: 14 }}>Loading squad…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
      <Footer />
    </>
  )

  if (error) return (
    <>
      <Nav />
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ fontFamily: FONT, color: C.red, fontSize: 14 }}>Failed to load players: {error}</p>
      </div>
      <Footer />
    </>
  )

  return (
    <>
    <Nav />
    <div style={{ paddingBottom: 80, maxWidth: 900, margin: '0 auto', padding: '24px 16px 80px' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{opacity:0.6}50%{opacity:1}100%{opacity:0.6}}
      `}</style>

      {/* ════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        style={{
          background: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.green} 60%, #3b82f6 100%)`,
          borderRadius: 24, padding: '32px 28px 28px', marginBottom: 22,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(30,58,138,0.25)',
        }}
      >
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 120, height: 120, background: 'rgba(255,255,255,0.04)', borderRadius: '50%', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: '20%', right: '20%', width: 60, height: 60, background: 'rgba(255,255,255,0.03)', borderRadius: '50%', pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '4px 12px', marginBottom: 12 }}>
            <span style={{ fontSize: 12 }}>🏏</span>
            <span style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>TUCC · 2026 Season</span>
          </div>
          <h1 style={{ fontFamily: FONT, fontWeight: 900, fontSize: 32, color: '#fff', margin: '0 0 10px', lineHeight: 1.1, letterSpacing: -0.5 }}>Our Squad</h1>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: 'rgba(255,255,255,0.72)', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 520 }}>
            TUCC Performance Scores reflect each player's 2026 BTCL Premier Division contributions — role-weighted, confidence-adjusted.
          </p>

          {/* Squad stats */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <SquadStat value={players.length} label="Squad Size" sub="Active players" />
            <SquadStat value={squadStats.totalRuns} label="Total Runs" sub={`Top: ${squadStats.topScorer?.name?.split(' ')[0] || '—'}`} />
            <SquadStat value={squadStats.totalWkts} label="Total Wickets" sub={`Top: ${squadStats.topBowler?.name?.split(' ')[0] || '—'}`} />
            <SquadStat value={`${squadStats.avgScore}`} label="Avg Score" sub="Team average" />
          </div>

          {/* Role breakdown pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { role: 'Batsman', icon: '🏏', count: enriched.filter(p => p._role === 'Batsman').length },
              { role: 'Bowler', icon: '🎯', count: enriched.filter(p => p._role === 'Bowler').length },
              { role: 'All-Rounder', icon: '⚡', count: enriched.filter(p => p._role === 'All-Rounder').length },
              { role: 'Wicket-Keeper', icon: '🧤', count: enriched.filter(p => p._role === 'Wicket-Keeper').length },
            ].filter(x => x.count > 0).map(x => (
              <div key={x.role} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px' }}>
                <span style={{ fontSize: 12 }}>{x.icon}</span>
                <span style={{ fontFamily: FONT, fontSize: 11, color: '#fff', fontWeight: 600 }}>{x.count} {x.role}{x.count > 1 ? 's' : ''}</span>
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
          style={{ background: '#FFFBEB', border: `1.5px solid ${C.gold}50`, borderRadius: 16, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: '#92400E' }}>⚙️ Admin Panel</div>
            {genProgress && <div style={{ fontFamily: FONT, fontSize: 11, color: '#B45309', marginTop: 3 }}>{genProgress}</div>}
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            style={{ background: generating ? C.gray2 : C.gold, color: generating ? C.gray4 : '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 10, padding: '9px 18px', cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            {generating
              ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }}/> Generating…</>
              : '✨ Generate / Refresh All Profiles'}
          </button>
        </motion.div>
      )}

      {/* ════════════════════════════════════
          CONTROLS: SEARCH + TABS + VIEW + SORT
      ════════════════════════════════════ */}
      <div style={{ marginBottom: 16 }}>
        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx={6.5} cy={6.5} r={4.5} stroke={C.gray3} strokeWidth={1.5}/>
            <path d="M10 10l3 3" stroke={C.gray3} strokeWidth={1.5} strokeLinecap="round"/>
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search players by name…"
            style={{ width: '100%', boxSizing: 'border-box', fontFamily: FONT, fontSize: 13, color: C.dark, background: '#fff', border: `1.5px solid ${C.gray2}`, borderRadius: 12, padding: '10px 14px 10px 36px', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = C.green}
            onBlur={e => e.target.style.borderColor = C.gray2}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.gray3, fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
          )}
        </div>

        {/* Tabs + view toggle + sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
            {TAB_OPTIONS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontFamily: FONT, fontWeight: tab === activeTab ? 700 : 500, fontSize: 12,
                  padding: '7px 14px', borderRadius: 20,
                  border: `1.5px solid ${tab === activeTab ? C.green : C.gray2}`,
                  background: tab === activeTab ? C.green : '#fff',
                  color: tab === activeTab ? '#fff' : C.gray4,
                  cursor: 'pointer', transition: 'all .18s',
                }}
              >
                {tab === 'All' ? `All (${enriched.length})` : tab}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', background: C.gray1, borderRadius: 10, padding: 3, gap: 2, flexShrink: 0 }}>
            {[{ id: 'cards', icon: '⊞' }, { id: 'list', icon: '≡' }].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} style={{ fontFamily: FONT, fontSize: 14, padding: '5px 12px', borderRadius: 8, border: 'none', background: viewMode === v.id ? '#fff' : 'transparent', color: viewMode === v.id ? C.dark : C.gray3, cursor: 'pointer', boxShadow: viewMode === v.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s' }}>
                {v.icon}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ fontFamily: FONT, fontSize: 12, color: C.gray5, background: '#fff', border: `1.5px solid ${C.gray2}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}
          >
            <option value="score">Sort: Score ↓</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="runs">Sort: Runs ↓</option>
            <option value="wickets">Sort: Wickets ↓</option>
          </select>
        </div>
      </div>

      {/* Count + methodology */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontFamily: FONT, fontSize: 12, color: C.gray3, margin: 0 }}>
          {sorted.length} player{sorted.length !== 1 ? 's' : ''}
          {activeTab !== 'All' ? ` · ${activeTab}` : ''}
          {searchQuery ? ` · matching "${searchQuery}"` : ''}
        </p>
        <button
          onClick={() => setShowMethodology(m => !m)}
          style={{ fontFamily: FONT, fontSize: 11, color: C.gray3, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', padding: 0 }}
        >
          {showMethodology ? '▲ Hide' : '▼ How scores work'}
        </button>
      </div>

      <AnimatePresence>
        {showMethodology && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: 16 }}
          >
            <div style={{ background: C.gray1, borderRadius: 14, padding: '16px 18px', fontFamily: FONT, fontSize: 12, color: C.gray5, lineHeight: 1.7, border: `1px solid ${C.gray2}` }}>
              <strong style={{ color: C.dark, fontSize: 13 }}>TUCC Performance Score (0–100)</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                {[
                  { title: '⚡ Batting', text: 'Runs (40pts) + Strike rate tier (30pts) + Average (20pts) + Milestones (10pts)' },
                  { title: '🎯 Bowling', text: 'Wickets (40pts) + Economy tier (30pts) + Average tier (20pts) + 5-fers (10pts)' },
                  { title: '⚖️ Role Weights', text: 'Batters/WK: 80/20 · Bowlers: 20/80 · All-rounders: 50/50 + bonus' },
                  { title: '📊 Confidence', text: 'Scores shrunk for <4 matches to prevent small-sample inflation' },
                ].map(x => (
                  <div key={x.title} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: `1px solid ${C.gray2}` }}>
                    <div style={{ fontWeight: 700, color: C.dark, marginBottom: 4, fontSize: 12 }}>{x.title}</div>
                    <div style={{ fontSize: 11, color: C.gray4 }}>{x.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════
          TOP 3 PODIUM (always shown)
      ════════════════════════════════════ */}
      {activeTab === 'All' && !searchQuery && sortBy === 'score' && sorted.length >= 3 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FONT, fontSize: 10, color: C.gray3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>🏆 Top Performers</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {sorted.slice(0, 3).map((player, i) => {
              const rank = i + 1
              const rc   = ROLE_CONFIG[player._role] || ROLE_CONFIG['Batsman']
              const { score } = computeScore(player)
              const cached = cachedScores[player.id] || cachedScores[(player.name||'').toLowerCase().trim()] || null
              return (
                <motion.div
                  key={player.id || player.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: rc.grad, borderRadius: 18, padding: '18px 14px',
                    textAlign: 'center', position: 'relative', overflow: 'hidden',
                    boxShadow: `0 8px 24px ${rc.accent}40`,
                    border: `1px solid ${rc.accent}60`,
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.2 } }}
                  onClick={() => setFocusedPlayer(focusedPlayer?.id === player.id ? null : player)}
                >
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }}/>
                  <div style={{ fontSize: rank === 1 ? 26 : 20, marginBottom: 8 }}>{MEDAL[rank].emoji}</div>
                  <div style={{ width: rank === 1 ? 64 : 52, height: rank === 1 ? 64 : 52, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 10px', border: '3px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                    {player.photoUrl
                      ? <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: player.photoPos || 'center top' }}/>
                      : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 18, color: '#fff' }}>{(player.name||'').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
                    }
                  </div>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 12, color: '#fff', marginBottom: 3, lineHeight: 1.2 }}>{player.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>{player._role}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: rank === 1 ? 28 : 22, color: '#fff', lineHeight: 1 }}>{score}</div>
                  <div style={{ fontFamily: FONT, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>TUCC Score</div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          CARD GRID / LIST VIEW
      ════════════════════════════════════ */}
      {viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          <AnimatePresence mode="popLayout">
            {sorted.map((player, index) => {
              const key    = player.id || player.name
              const rank   = rankMap[key] || 99
              const cached = cachedScores[player.id] || cachedScores[(player.name||'').toLowerCase().trim()] || null
              return (
                <PlayerCard
                  key={key}
                  player={player}
                  rank={rank}
                  cachedScore={cached}
                  isAdmin={isAdmin}
                  index={index}
                />
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence mode="popLayout">
            {sorted.map((player, index) => {
              const key    = player.id || player.name
              const rank   = rankMap[key] || 99
              const cached = cachedScores[player.id] || cachedScores[(player.name||'').toLowerCase().trim()] || null
              return (
                <LeaderRow
                  key={key}
                  player={player}
                  rank={rank}
                  cachedScore={cached}
                  onClick={() => setFocusedPlayer(focusedPlayer?.id === player.id ? null : player)}
                />
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.gray3 }}>No players found.</p>
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ fontFamily: FONT, fontSize: 12, color: C.green, background: 'none', border: `1px solid ${C.green}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', marginTop: 8 }}>Clear search</button>}
        </div>
      )}

      {/* ── Detail overlay (list view focus) ── */}
      <AnimatePresence>
        {focusedPlayer && viewMode === 'list' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 16px' }}
            onClick={() => setFocusedPlayer(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ ease: [0.32, 0.72, 0, 1] }}
              style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, background: '#fff' }}
              onClick={e => e.stopPropagation()}
            >
              <PlayerCard
                player={focusedPlayer}
                rank={rankMap[focusedPlayer.id || focusedPlayer.name] || 99}
                cachedScore={cachedScores[focusedPlayer.id] || cachedScores[(focusedPlayer.name||'').toLowerCase().trim()] || null}
                isAdmin={isAdmin}
                index={0}
              />
              <div style={{ padding: '0 16px 16px', textAlign: 'center' }}>
                <button onClick={() => setFocusedPlayer(null)} style={{ fontFamily: FONT, fontSize: 12, color: C.gray4, background: C.gray1, border: 'none', borderRadius: 10, padding: '8px 24px', cursor: 'pointer' }}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    <Footer />
    </>
  )
}
