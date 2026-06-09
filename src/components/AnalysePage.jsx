import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend,
} from 'recharts'
import {
  TOP_BATTERS, TOP_BOWLERS, TOP_ALLROUNDERS, MATCH_PLAN,
  BATTING_CHART, BOWLING_CHART, SCATTER_BATTING, SCATTER_BOWLING, RADAR_ALLROUNDERS,
  BATTING_RAW, BOWLING_RAW,
} from '../data/west3-scouting'
import Nav from './Nav'
import { C, FONT, MAX_WIDTH } from '../constants'

const EASE = [0.23, 1, 0.32, 1]

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  const cfg = {
    AVOID:   { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    CONTAIN: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    TARGET:  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    WATCH:   { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
  }
  const s = cfg[label] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: s.bg, border: `1.5px solid ${s.border}`,
      fontFamily: FONT, fontSize: 11, fontWeight: 800,
      color: s.text, letterSpacing: 0.8, whiteSpace: 'nowrap',
    }}>
      {label === 'AVOID'   && '🚫 '}
      {label === 'CONTAIN' && '🛡️ '}
      {label === 'TARGET'  && '🎯 '}
      {label === 'WATCH'   && '👁️ '}
      {label}
    </span>
  )
}

// ── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }) {
  const r   = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const col  = score >= 80 ? '#dc2626' : score >= 60 ? '#d97706' : score >= 40 ? '#2563eb' : '#16a34a'
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={col} strokeWidth={5}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={col} style={{ fontFamily: FONT, fontWeight: 800, fontSize: size * 0.28 }}>
        {Math.round(score)}
      </text>
    </svg>
  )
}

// ── Initials avatar ────────────────────────────────────────────────────────
function Avatar({ initials, size = 44, color = C.green }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${C.greenDark})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, fontWeight: 800, fontSize: size * 0.32,
      color: '#fff', boxShadow: `0 4px 14px ${color}50`,
      letterSpacing: -0.5,
    }}>
      {initials}
    </div>
  )
}

// ── Stat pill ──────────────────────────────────────────────────────────────
function Stat({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 12px', borderRadius: 10,
      background: highlight ? C.blueBg : '#f8fafc',
      border: `1px solid ${highlight ? '#bfdbfe' : '#e2e8f0'}`,
      minWidth: 56,
    }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: highlight ? C.green : C.dark }}>
        {value}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: C.gray4, marginTop: 2, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

// ── Player card ────────────────────────────────────────────────────────────
function PlayerCard({ player, type, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false)
  const isBat  = type === 'bat'
  const isBowl = type === 'bowl'
  const isAll  = type === 'all'

  const stats = isBat  ? player.stats
               : isBowl ? player.stats
               : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{
        background: '#fff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(30,58,138,0.06)',
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left', background: 'none',
          border: 'none', cursor: 'pointer', padding: '16px 16px 12px',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}
      >
        {/* Rank + avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={{
            fontFamily: FONT, fontSize: 10, fontWeight: 800,
            color: player.rank === 1 ? C.gold : C.gray4, letterSpacing: 0.5,
          }}>
            #{player.rank}
          </span>
          <Avatar initials={player.initials} size={42}
            color={player.badge === 'AVOID' ? '#dc2626' : player.badge === 'TARGET' ? '#16a34a' : C.green} />
        </div>

        {/* Name + badge + score */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: C.dark }}>
              {player.name}
            </span>
            <Badge label={player.badge} color={player.badgeColor} />
            {player.role && (
              <span style={{
                fontFamily: FONT, fontSize: 10, fontWeight: 700,
                color: C.gray4, background: '#f1f5f9',
                border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 7px',
              }}>
                {player.role}
              </span>
            )}
          </div>

          {/* Flag */}
          {player.flag && (
            <div style={{ fontFamily: FONT, fontSize: 11, color: '#92400e', marginBottom: 6 }}>
              {player.flag}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isBat && (<>
              <Stat label="Runs" value={stats.runs} highlight />
              <Stat label="Avg"  value={stats.avg} />
              <Stat label="SR"   value={stats.sr} />
              <Stat label="HS"   value={stats.hs} />
              {stats.hundreds > 0 && <Stat label="100s" value={stats.hundreds} />}
              {stats.fifties  > 0 && <Stat label="50s"  value={stats.fifties} />}
            </>)}
            {isBowl && (<>
              <Stat label="Wkts" value={stats.wickets} highlight />
              <Stat label="Avg"  value={stats.avg} />
              <Stat label="Econ" value={stats.econ} />
              <Stat label="Best" value={stats.best} />
              {stats.fiveWickets > 0 && <Stat label="5WH" value={stats.fiveWickets} />}
            </>)}
            {isAll && (<>
              <Stat label="Runs"  value={player.batStats.runs}   highlight />
              <Stat label="Bat SR" value={player.batStats.sr} />
              <Stat label="Wkts"  value={player.bowlStats.wickets} highlight />
              <Stat label="Econ"  value={player.bowlStats.econ} />
            </>)}
          </div>
        </div>

        {/* Score ring + expand chevron */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <ScoreRing score={isAll ? player.compositeScore : player.compositeScore} size={52} />
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: C.gray3, lineHeight: 1 }}
          >
            ▼
          </motion.div>
        </div>
      </button>

      {/* Expanded analysis */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              {/* Summary */}
              <p style={{
                fontFamily: FONT, fontSize: 13.5, lineHeight: 1.7,
                color: C.gray5, marginBottom: 14, margin: '0 0 14px',
              }}>
                {player.summary}
              </p>

              {/* Strengths / Weaknesses */}
              {player.strengths && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: '#15803d', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      ✅ Strengths
                    </div>
                    {player.strengths.map((s, i) => (
                      <div key={i} style={{ fontFamily: FONT, fontSize: 12.5, color: C.gray5, marginBottom: 4, display: 'flex', gap: 6 }}>
                        <span style={{ color: '#16a34a', flexShrink: 0 }}>›</span>{s}
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: '#b91c1c', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      ⚠️ Weaknesses
                    </div>
                    {player.weaknesses.map((w, i) => (
                      <div key={i} style={{ fontFamily: FONT, fontSize: 12.5, color: C.gray5, marginBottom: 4, display: 'flex', gap: 6 }}>
                        <span style={{ color: '#dc2626', flexShrink: 0 }}>›</span>{w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How to play */}
              {player.howToPlay && (
                <div style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 10, padding: '10px 14px',
                }}>
                  <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, color: C.green, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🏏 How to play them
                  </div>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: C.gray5, lineHeight: 1.6, margin: 0 }}>
                    {player.howToPlay}
                  </p>
                </div>
              )}

              {/* All-rounder both arms */}
              {isAll && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: '#15803d', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Batting</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, color: C.dark }}>
                      {player.batStats.runs} runs · SR {player.batStats.sr} · HS {player.batStats.hs}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: '#92400e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bowling</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, color: C.dark }}>
                      {player.bowlStats.wickets} wkts · Econ {player.bowlStats.econ} · Best {player.bowlStats.best}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: C.green, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Composite</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, color: C.dark }}>
                      Bat {Math.round(player.batScore)} · Bowl {Math.round(player.bowlScore)} · Overall {Math.round(player.compositeScore)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Sortable table ─────────────────────────────────────────────────────────
function SortableTable({ data, columns }) {
  const [sortKey, setSortKey]   = useState(columns[1].key)
  const [sortDir, setSortDir]   = useState('desc')

  const sorted = [...data].sort((a, b) => {
    const va = a[sortKey]; const vb = b[sortKey]
    if (typeof va === 'number') return sortDir === 'desc' ? vb - va : va - vb
    return sortDir === 'desc' ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb))
  })

  const toggle = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
        <thead>
          <tr style={{ background: C.greenDark }}>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => toggle(col.key)}
                style={{
                  padding: '11px 14px', textAlign: col.align || 'center',
                  fontFamily: FONT, fontSize: 11, fontWeight: 700,
                  color: sortKey === col.key ? C.gold : 'rgba(255,255,255,0.8)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  userSelect: 'none', letterSpacing: 0.5, textTransform: 'uppercase',
                }}
              >
                {col.label}{sortKey === col.key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.name || i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              {columns.map(col => (
                <td key={col.key} style={{
                  padding: '10px 14px', fontSize: 13,
                  color: col.highlight ? C.green : C.dark,
                  fontWeight: col.highlight ? 700 : 500,
                  textAlign: col.align || 'center', whiteSpace: 'nowrap',
                  borderTop: '1px solid #f1f5f9',
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Custom tooltip for charts ──────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', borderRadius: 10, padding: '10px 14px',
      fontFamily: FONT, fontSize: 12, color: '#fff',
      boxShadow: '0 8px 24px rgba(0,0,0,.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff', marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: C.dark, margin: 0, letterSpacing: -0.3 }}>
        {children}
      </h2>
      {sub && <p style={{ fontFamily: FONT, fontSize: 13, color: C.gray4, margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}

// ── Tab bar ────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 6,
      background: '#f1f5f9', borderRadius: 14,
      padding: 5, flexShrink: 0,
    }}>
      {tabs.map(t => (
        <motion.button
          key={t.key}
          onClick={() => onChange(t.key)}
          whileTap={{ scale: 0.96 }}
          style={{
            flex: 1, padding: '9px 16px', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: active === t.key ? '#fff' : 'none',
            fontFamily: FONT, fontSize: 13.5, fontWeight: active === t.key ? 800 : 500,
            color: active === t.key ? C.dark : C.gray4,
            boxShadow: active === t.key ? '0 2px 8px rgba(30,58,138,.1)' : 'none',
            transition: 'all 150ms ease', whiteSpace: 'nowrap',
          }}
        >
          {t.label}
        </motion.button>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'batting',      label: '🏏 Batting' },
  { key: 'bowling',      label: '🎳 Bowling' },
  { key: 'allrounders',  label: '⚡ All-rounders' },
  { key: 'matchplan',    label: '📋 Match Plan' },
]

export default function AnalysePage() {
  const [activeTab, setActiveTab] = useState('batting')

  const BAT_COLS = [
    { key: 'name',    label: 'Player',  align: 'left', highlight: false },
    { key: 'matches', label: 'M',       highlight: false },
    { key: 'innings', label: 'Inn',     highlight: false },
    { key: 'runs',    label: 'Runs',    highlight: true  },
    { key: 'avg',     label: 'Avg',     highlight: false },
    { key: 'sr',      label: 'SR',      highlight: false },
    { key: 'hs',      label: 'HS',      highlight: false },
    { key: 'hundreds',label: '100s',    highlight: false },
    { key: 'fifties', label: '50s',     highlight: false },
  ]

  const BOWL_COLS = [
    { key: 'name',    label: 'Player',  align: 'left', highlight: false },
    { key: 'matches', label: 'M',       highlight: false },
    { key: 'overs',   label: 'Overs',   highlight: false },
    { key: 'wickets', label: 'Wkts',    highlight: true  },
    { key: 'avg',     label: 'Avg',     highlight: false },
    { key: 'econ',    label: 'Econ',    highlight: false },
    { key: 'sr',      label: 'SR',      highlight: false },
    { key: 'best',    label: 'Best',    highlight: false },
  ]

  return (
    <>
      <Nav />
      <div style={{
        maxWidth: MAX_WIDTH, margin: '0 auto',
        padding: '0 16px 80px',
        fontFamily: FONT,
      }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{
            margin: '24px 0 28px',
            background: `linear-gradient(135deg, ${C.greenDark} 0%, #1d4ed8 100%)`,
            borderRadius: 20, overflow: 'hidden',
            padding: '24px 20px', position: 'relative',
            boxShadow: '0 8px 32px rgba(30,58,138,.25)',
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(233,160,32,.15)', border: '1px solid rgba(233,160,32,.35)',
            borderRadius: 20, padding: '4px 12px', marginBottom: 12,
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#e9a020', letterSpacing: 1, textTransform: 'uppercase' }}>
              🔍 Opposition Scouting
            </span>
          </div>

          <h1 style={{
            fontFamily: FONT, fontSize: 22, fontWeight: 900,
            color: '#fff', margin: '0 0 6px', letterSpacing: -0.5, lineHeight: 1.2,
          }}>
            West 3 CC Analysis
          </h1>
          <p style={{
            fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,.7)',
            margin: '0 0 18px', lineHeight: 1.6,
          }}>
            {MATCH_PLAN.executiveSummary}
          </p>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { v: '32', l: 'Batters analysed' },
              { v: '18', l: 'Bowlers analysed' },
              { v: '2 × 5WH', l: 'Five-wicket hauls' },
              { v: '2 × 100s', l: 'Centuries' },
            ].map(({ v, l }) => (
              <div key={l} style={{
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                borderRadius: 10, padding: '8px 14px', flex: '1', minWidth: 120,
              }}>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 18, color: '#fff' }}>{v}</div>
                <div style={{ fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div style={{ marginBottom: 24 }}>
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* ══════════════════════════════════════════════
            BATTING TAB
        ══════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'batting' && (
            <motion.div key="batting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {/* Chart: Top runs */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '18px 14px', marginBottom: 20, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(30,58,138,.05)' }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 14 }}>
                  📊 Top Run-scorers
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={BATTING_CHART} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} />
                    <YAxis tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="runs" fill={C.green} radius={[6, 6, 0, 0]} name="Runs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart: Runs vs SR scatter */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '18px 14px', marginBottom: 24, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(30,58,138,.05)' }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 4 }}>
                  ⚡ Runs vs Strike Rate
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray4, marginBottom: 12 }}>
                  Top-right = most dangerous (high volume + fast scoring)
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="runs" name="Runs" tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} label={{ value: 'Runs', position: 'insideBottom', offset: -2, style: { fontFamily: FONT, fontSize: 10, fill: C.gray4 } }} />
                    <YAxis dataKey="sr"   name="SR"   tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div style={{ background: '#1e293b', borderRadius: 8, padding: '8px 12px', fontFamily: FONT, fontSize: 12, color: '#fff' }}>
                          <strong>{d.name}</strong><br />Runs: {d.runs} · SR: {d.sr}
                        </div>
                      )
                    }} />
                    <Scatter data={SCATTER_BATTING} fill={C.green} fillOpacity={0.8} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Top 6 player cards */}
              <SectionTitle
                sub="Weighted composite: 40% runs, 25% SR, 15% HS, 10% milestones, 10% games played"
              >
                Top 6 Batters — Watch List
              </SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {TOP_BATTERS.map(p => (
                  <PlayerCard key={p.name} player={p} type="bat" />
                ))}
              </div>

              {/* Full sortable table */}
              <SectionTitle sub="Click any column header to sort">Full Batting Statistics</SectionTitle>
              <SortableTable data={BATTING_RAW} columns={BAT_COLS} />

              <MethodologyNote type="batting" />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              BOWLING TAB
          ══════════════════════════════════════════════ */}
          {activeTab === 'bowling' && (
            <motion.div key="bowling"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {/* Chart: Top wicket takers */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '18px 14px', marginBottom: 20, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(30,58,138,.05)' }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 14 }}>
                  🎳 Top Wicket-takers
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={BOWLING_CHART} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} />
                    <YAxis tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="wickets" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Wickets" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart: Wickets vs Economy scatter */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '18px 14px', marginBottom: 24, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(30,58,138,.05)' }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 4 }}>
                  🎯 Wickets vs Economy
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray4, marginBottom: 12 }}>
                  Top-left = most dangerous (high wickets + low economy). Min. 10 overs.
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="econ" name="Economy" tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} label={{ value: 'Economy', position: 'insideBottom', offset: -2, style: { fontFamily: FONT, fontSize: 10, fill: C.gray4 } }} />
                    <YAxis dataKey="wickets" name="Wickets" tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div style={{ background: '#1e293b', borderRadius: 8, padding: '8px 12px', fontFamily: FONT, fontSize: 12, color: '#fff' }}>
                          <strong>{d.name}</strong><br />Wkts: {d.wickets} · Econ: {d.econ}
                        </div>
                      )
                    }} />
                    <Scatter data={SCATTER_BOWLING} fill="#7c3aed" fillOpacity={0.8} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Top 6 bowler cards */}
              <SectionTitle
                sub="Weighted composite: 40% wickets, 30% economy (inverted), 20% average (inverted), 10% SR (inverted)"
              >
                Top 6 Bowlers — Threat Assessment
              </SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {TOP_BOWLERS.map(p => (
                  <PlayerCard key={p.name} player={p} type="bowl" />
                ))}
              </div>

              {/* Full table */}
              <SectionTitle sub="Click any column header to sort">Full Bowling Statistics</SectionTitle>
              <SortableTable data={BOWLING_RAW} columns={BOWL_COLS} />

              <MethodologyNote type="bowling" />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              ALL-ROUNDERS TAB
          ══════════════════════════════════════════════ */}
          {activeTab === 'allrounders' && (
            <motion.div key="allrounders"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {/* Radar chart */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '18px 14px', marginBottom: 24, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(30,58,138,.05)' }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 4 }}>
                  📡 Top 3 All-rounders — Score Comparison
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray4, marginBottom: 12 }}>
                  Bat Score + Bowl Score + Overall composite (0–100 scale)
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={[
                    { subject: 'Bat Score',   IR: TOP_ALLROUNDERS[0].batScore,       SJS: TOP_ALLROUNDERS[1].batScore,  AK: TOP_ALLROUNDERS[2].batScore },
                    { subject: 'Bowl Score',  IR: TOP_ALLROUNDERS[0].bowlScore,      SJS: TOP_ALLROUNDERS[1].bowlScore, AK: TOP_ALLROUNDERS[2].bowlScore },
                    { subject: 'Overall',     IR: TOP_ALLROUNDERS[0].compositeScore, SJS: TOP_ALLROUNDERS[1].compositeScore, AK: TOP_ALLROUNDERS[2].compositeScore },
                    { subject: 'Runs',        IR: 100,                               SJS: 57,  AK: 38 },
                    { subject: 'Wickets',     IR: 69,                                SJS: 89,  AK: 90 },
                  ]}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray5 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontFamily: FONT, fontSize: 9, fill: C.gray3 }} />
                    <Radar name="Imesh R." dataKey="IR"  stroke="#dc2626" fill="#dc2626" fillOpacity={0.15} dot />
                    <Radar name="Sujan S." dataKey="SJS" stroke={C.green} fill={C.green}   fillOpacity={0.12} dot />
                    <Radar name="Ashen K." dataKey="AK"  stroke="#7c3aed" fill="#7c3aed"   fillOpacity={0.10} dot />
                    <Legend iconType="circle" wrapperStyle={{ fontFamily: FONT, fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bat vs Bowl score bar comparison */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '18px 14px', marginBottom: 24, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(30,58,138,.05)' }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 14 }}>
                  ⚡ Bat vs Bowl Contribution
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={TOP_ALLROUNDERS.map(p => ({ name: p.name.split(' ')[0], bat: Math.round(p.batScore), bowl: Math.round(p.bowlScore) }))}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} />
                    <YAxis tick={{ fontFamily: FONT, fontSize: 11, fill: C.gray4 }} domain={[0, 110]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontFamily: FONT, fontSize: 12 }} />
                    <Bar dataKey="bat"  fill={C.green}   radius={[4, 4, 0, 0]} name="Bat Score" />
                    <Bar dataKey="bowl" fill="#7c3aed"   radius={[4, 4, 0, 0]} name="Bowl Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* All-rounder cards */}
              <SectionTitle
                sub="Composite = 50% batting score (normalised) + 50% bowling score (normalised). Min. 3 games played."
              >
                Top 6 All-rounders
              </SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {TOP_ALLROUNDERS.map(p => (
                  <PlayerCard key={p.name} player={p} type="all" />
                ))}
              </div>

              <MethodologyNote type="allrounder" />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              MATCH PLAN TAB
          ══════════════════════════════════════════════ */}
          {activeTab === 'matchplan' && (
            <motion.div key="matchplan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {/* When batting */}
              <div style={{ marginBottom: 20 }}>
                <SectionTitle sub="How to approach their bowling attack">When We Bat</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MATCH_PLAN.battingPriorities.map(p => (
                    <motion.div
                      key={p.priority}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: p.priority * 0.08, duration: 0.3, ease: EASE }}
                      style={{
                        background: '#fff', border: '1.5px solid #e2e8f0',
                        borderRadius: 14, padding: '14px 16px',
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        boxShadow: '0 1px 6px rgba(30,58,138,.05)',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: C.blueBg, border: `1.5px solid #bfdbfe`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: FONT, fontWeight: 800, fontSize: 18,
                      }}>
                        {p.icon}
                      </div>
                      <div>
                        <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: C.green, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Priority {p.priority}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.dark, lineHeight: 1.6 }}>
                          {p.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* When bowling */}
              <div style={{ marginBottom: 20 }}>
                <SectionTitle sub="How to attack their batting lineup">When We Bowl</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MATCH_PLAN.bowlingPriorities.map(p => (
                    <motion.div
                      key={p.priority}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: p.priority * 0.08, duration: 0.3, ease: EASE }}
                      style={{
                        background: '#fff', border: '1.5px solid #e2e8f0',
                        borderRadius: 14, padding: '14px 16px',
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        boxShadow: '0 1px 6px rgba(30,58,138,.05)',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: '#fef3c7', border: '1.5px solid #fcd34d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: FONT, fontWeight: 800, fontSize: 18,
                      }}>
                        {p.icon}
                      </div>
                      <div>
                        <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: '#d97706', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Priority {p.priority}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.dark, lineHeight: 1.6 }}>
                          {p.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bowling order */}
              <div style={{ marginBottom: 20 }}>
                <SectionTitle sub="Suggested approach by over block">Suggested Bowling Order</SectionTitle>
                <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(30,58,138,.05)' }}>
                  {MATCH_PLAN.bowlingOrder.map((b, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      padding: '14px 16px',
                      borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
                      background: i % 2 === 0 ? '#fff' : '#fafbfc',
                    }}>
                      <div style={{
                        flexShrink: 0, fontFamily: FONT, fontWeight: 800,
                        fontSize: 12, color: C.green,
                        background: C.blueBg, border: '1px solid #bfdbfe',
                        borderRadius: 8, padding: '4px 10px', whiteSpace: 'nowrap',
                      }}>
                        {b.slot}
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.dark, lineHeight: 1.5 }}>
                        {b.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fielding notes */}
              <div style={{ marginBottom: 20 }}>
                <SectionTitle sub="Field placement tips">Fielding Notes</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {MATCH_PLAN.fieldingNotes.map((note, i) => (
                    <div key={i} style={{
                      background: '#fff', border: '1.5px solid #e2e8f0',
                      borderRadius: 12, padding: '12px 16px',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      boxShadow: '0 1px 4px rgba(30,58,138,.04)',
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
                      <span style={{ fontFamily: FONT, fontSize: 13.5, color: C.dark, lineHeight: 1.5 }}>
                        {note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threat level legend */}
              <div style={{
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: 16, padding: '16px',
                boxShadow: '0 1px 6px rgba(30,58,138,.04)',
              }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 12 }}>
                  🏷️ Badge Legend
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { badge: 'AVOID',   desc: 'Elite player — do NOT give easy runs/wickets. Treat with maximum respect.' },
                    { badge: 'CONTAIN', desc: 'Good player — keep dot-ball pressure, no freebies but can be handled.' },
                    { badge: 'TARGET',  desc: 'Exploitable — actively look to score off or attack their dismissal.' },
                    { badge: 'WATCH',   desc: 'Insufficient data — approach with caution, assess in real time.' },
                  ].map(({ badge, desc }) => (
                    <div key={badge} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <Badge label={badge} />
                      <span style={{ fontFamily: FONT, fontSize: 13, color: C.gray5, lineHeight: 1.5 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// ── Methodology note ───────────────────────────────────────────────────────
function MethodologyNote({ type }) {
  const notes = {
    batting:    'Batting composite (0–100): 40% runs volume, 25% strike rate, 15% highest score, 10% milestones (100s×20 + 50s×10), 10% matches played. All metrics normalised within the squad.',
    bowling:    'Bowling composite (0–100): 40% wickets, 30% economy rate (inverted — lower is better), 20% bowling average (inverted), 10% bowling strike rate (inverted). All metrics normalised within the squad. Minimum 10 overs.',
    allrounder: 'All-rounder composite (0–100): 50% batting score (normalised within batting list) + 50% bowling score (normalised within bowling list). Must have played 3+ games and bowled 10+ overs.',
  }
  return (
    <div style={{
      marginTop: 20, padding: '12px 16px',
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 12, borderLeft: `3px solid ${C.green}`,
    }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 11, color: C.green, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        📐 Methodology
      </div>
      <p style={{ fontFamily: FONT, fontSize: 12, color: C.gray5, lineHeight: 1.6, margin: 0 }}>
        {notes[type]}
      </p>
    </div>
  )
}
