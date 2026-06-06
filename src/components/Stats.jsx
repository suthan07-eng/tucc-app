import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase' // kept for match log tab only
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import { Skeleton } from './ui/Loader'
import {
  BarChart2, Target, Shield, ArrowLeft,
  TrendingUp, Award, Zap, ChevronDown, ChevronUp
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────
const EASE_OUT = [0.23, 1, 0.32, 1]
const fadeUp   = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } } }
const stagger  = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } }
const SEASONS  = ['2026', '2025', '2024']
const MEDALS   = ['🥇', '🥈', '🥉']

const fmt1 = v => { const n = parseFloat(v); return (!n && n !== 0) || isNaN(n) ? '—' : n.toFixed(1) }
const fmt2 = v => { const n = parseFloat(v); return (!n && n !== 0) || isNaN(n) ? '—' : n.toFixed(2) }
const fmtN = v => { const n = parseInt(v);   return (!n && n !== 0) || isNaN(n) ? '—' : n }
const fmtHS = (r, no) => { const n = parseInt(r); return (!n && n !== 0) ? '—' : `${n}${no ? '*' : ''}` }
const fmtBest = (w, r) => { const n = parseInt(w); return !n ? '—' : `${n}/${parseInt(r) || 0}` }

function Avatar({ name = '', size = 32 }) {
  const PALETTE = ['#1a5c38','#7c3aed','#0369a1','#b45309','#0891b2','#be185d','#059669','#6d28d9']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: FONT, fontWeight: 800,
      fontSize: Math.round(size * 0.34), flexShrink: 0, userSelect: 'none',
      boxShadow: '0 1px 4px rgba(0,0,0,.2)',
    }}>
      {initials}
    </div>
  )
}

// ── Stat card (hero metrics) ──────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <motion.div variants={fadeUp} style={{
      background: C.white, borderRadius: 16,
      border: `1px solid ${C.gray2}`,
      boxShadow: `0 2px 12px ${C.shadow}`,
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={color} strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.gray3, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</span>
      </div>
      {loading
        ? <Skeleton height={28} width={60} />
        : <div style={{ fontSize: 28, fontWeight: 900, color: C.dark, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      }
      {sub && !loading && (
        <div style={{ fontSize: 11, color: C.gray3, fontWeight: 500 }}>{sub}</div>
      )}
    </motion.div>
  )
}

// ── Bar chart for runs/wickets ────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4
  return (
    <div style={{ flex: 1, height: 6, background: C.gray1, borderRadius: 99, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  )
}

// ── Top 3 podium ──────────────────────────────────────────
function Podium({ items, valueKey, label, fmtFn = fmtN }) {
  const top3 = [...items].filter(s => (parseFloat(s[valueKey]) || 0) > 0)
    .sort((a, b) => (parseFloat(b[valueKey]) || 0) - (parseFloat(a[valueKey]) || 0))
    .slice(0, 3)
  if (!top3.length) return null
  const borderColors = [C.gold, '#94a3b8', '#b45309']
  const heights = [96, 72, 60]
  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden" animate="visible"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 20 }}
    >
      {[top3[1], top3[0], top3[2]].filter(Boolean).map((s, i) => {
        const realIdx = i === 0 ? 1 : i === 1 ? 0 : 2
        return (
          <motion.div
            key={s.id}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', duration: 0.5, bounce: 0.2 } } }}
            style={{
              flex: 1, background: C.white,
              borderRadius: 14, padding: '14px 10px',
              border: `2px solid ${borderColors[realIdx]}`,
              boxShadow: realIdx === 0 ? `0 4px 20px ${C.gold}30` : `0 2px 10px ${C.shadow}`,
              textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              minHeight: heights[realIdx],
            }}
          >
            <div style={{ fontSize: 20 }}>{MEDALS[realIdx]}</div>
            <Avatar name={s.player_name} size={36} />
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: C.dark, lineHeight: 1.2 }}>
              {s.player_name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: realIdx === 0 ? C.green : C.gray5, fontVariantNumeric: 'tabular-nums' }}>
              {fmtFn(s[valueKey])}
            </div>
            <div style={{ fontSize: 10, color: C.gray3, fontWeight: 600 }}>{label}</div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ── Batting dashboard ──────────────────────────────────────
function BattingDashboard({ stats, loading }) {
  const [sortCol, setSortCol] = useState('bat_runs')
  const [sortDir, setSortDir] = useState('desc')
  const [showAll, setShowAll] = useState(false)

  if (loading) return <SkeletonDash />

  if (!stats.length) return <EmptyState tab="batting" />

  const sorted = [...stats].filter(s => s.bat_innings > 0 || s.bat_runs > 0).sort((a, b) => {
    const av = typeof a[sortCol] === 'string' ? a[sortCol].toLowerCase() : parseFloat(a[sortCol]) || 0
    const bv = typeof b[sortCol] === 'string' ? b[sortCol].toLowerCase() : parseFloat(b[sortCol]) || 0
    return sortDir === 'asc' ? (av < bv ? -1 : 1) : (bv < av ? -1 : 1)
  })

  const maxRuns = Math.max(...sorted.map(s => s.bat_runs || 0))
  const totalRuns = sorted.reduce((s, p) => s + (parseInt(p.bat_runs) || 0), 0)
  const totalFifties = sorted.reduce((s, p) => s + (parseInt(p.bat_fifties) || 0), 0)
  const totalSixes = sorted.reduce((s, p) => s + (parseInt(p.bat_sixes) || 0), 0)
  const topSR = [...sorted].filter(s => s.bat_balls >= 10).sort((a, b) => (b.bat_strike_rate || 0) - (a.bat_strike_rate || 0))[0]

  const visible = showAll ? sorted : sorted.slice(0, 8)

  const onSort = col => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div>
      {/* Hero stat cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}
      >
        <StatCard icon={TrendingUp}  label="Total runs"  value={totalRuns}   sub={`${sorted.length} batters`} color={C.green}  loading={false} />
        <StatCard icon={Award}       label="Fifties"     value={totalFifties} sub="50+ scores"               color={C.gold}   loading={false} />
        <StatCard icon={Zap}         label="Sixes"       value={totalSixes}   sub="this season"              color="#7c3aed"  loading={false} />
        <StatCard icon={BarChart2}   label="Top SR"      value={topSR ? fmt2(topSR.bat_strike_rate) : '—'} sub={topSR?.player_name?.split(' ')[0] || ''} color={C.blue} loading={false} />
      </motion.div>

      {/* Podium */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.gray5, marginBottom: 12 }}>🏆 Top Run Scorers</div>
      <Podium items={sorted} valueKey="bat_runs" label="Runs" />

      {/* Full table */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.gray5, marginBottom: 10 }}>Batting averages</div>
      <div style={{
        background: C.white, borderRadius: 16,
        border: `1px solid ${C.gray2}`,
        boxShadow: `0 2px 12px ${C.shadow}`,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 44px 36px 52px', gap: 0, padding: '10px 14px', background: C.gray1, borderBottom: `1px solid ${C.gray2}` }}>
          {[
            { col: 'player_name', label: 'Player', align: 'left' },
            { col: 'bat_innings', label: 'Inn',  align: 'center' },
            { col: 'bat_runs',    label: 'Runs', align: 'center' },
            { col: 'bat_highest', label: 'HS',   align: 'center' },
            { col: 'bat_fifties', label: '50s',  align: 'center' },
            { col: 'bat_average', label: 'Avg',  align: 'center' },
          ].map(({ col, label, align }) => (
            <button key={col} onClick={() => onSort(col)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
              color: sortCol === col ? C.green : C.gray3, textTransform: 'uppercase',
              textAlign: align, display: 'flex', alignItems: 'center',
              justifyContent: align === 'left' ? 'flex-start' : 'center', gap: 2,
            }}>
              {label}
              {sortCol === col && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
            </button>
          ))}
        </div>

        {/* Rows */}
        {visible.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT, delay: i * 0.03 }}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 36px 36px 44px 36px 52px',
              gap: 0, padding: '11px 14px',
              borderBottom: i < visible.length - 1 ? `1px solid ${C.gray1}` : 'none',
              background: i === 0 && sortCol === 'bat_runs' ? `${C.green}08` : 'transparent',
              alignItems: 'center',
            }}
          >
            {/* Player */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <Avatar name={s.player_name} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.player_name}
                </div>
                <MiniBar value={s.bat_runs || 0} max={maxRuns} color={C.green} />
              </div>
            </div>
            <div style={cellStyle}>{fmtN(s.bat_innings)}</div>
            <div style={{ ...cellStyle, fontWeight: 800, color: C.green }}>{fmtN(s.bat_runs)}</div>
            <div style={cellStyle}>{fmtHS(s.bat_highest, s.bat_highest_not_out)}</div>
            <div style={{ ...cellStyle, color: s.bat_fifties > 0 ? C.gold : C.gray3, fontWeight: s.bat_fifties > 0 ? 700 : 400 }}>{fmtN(s.bat_fifties)}</div>
            <div style={{ ...cellStyle, fontWeight: 700 }}>{fmt2(s.bat_average)}</div>
          </motion.div>
        ))}
      </div>

      {sorted.length > 8 && (
        <button onClick={() => setShowAll(a => !a)} style={{
          marginTop: 10, width: '100%', background: C.gray1, border: `1px solid ${C.gray2}`,
          borderRadius: 10, padding: '10px', fontFamily: FONT, fontSize: 13,
          fontWeight: 600, color: C.gray4, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <ChevronDown size={14} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          {showAll ? 'Show fewer' : `Show all ${sorted.length} batters`}
        </button>
      )}
    </div>
  )
}

// ── Bowling dashboard ──────────────────────────────────────
function BowlingDashboard({ stats, loading }) {
  const [sortCol, setSortCol] = useState('bowl_wickets')
  const [sortDir, setSortDir] = useState('desc')
  const [showAll, setShowAll] = useState(false)

  if (loading) return <SkeletonDash />
  if (!stats.length) return <EmptyState tab="bowling" />

  const sorted = [...stats].filter(s => s.bowl_overs > 0 || s.bowl_wickets > 0).sort((a, b) => {
    const av = parseFloat(a[sortCol]) || 0
    const bv = parseFloat(b[sortCol]) || 0
    return sortDir === 'asc' ? (av < bv ? -1 : 1) : (bv < av ? -1 : 1)
  })

  const maxWkts = Math.max(...sorted.map(s => s.bowl_wickets || 0))
  const totalWkts = sorted.reduce((s, p) => s + (parseInt(p.bowl_wickets) || 0), 0)
  const totalOvers = sorted.reduce((s, p) => s + (parseFloat(p.bowl_overs) || 0), 0)
  const bestEcon = [...sorted].filter(s => parseFloat(s.bowl_overs) >= 4)
    .sort((a, b) => (parseFloat(a.bowl_economy) || 99) - (parseFloat(b.bowl_economy) || 99))[0]
  const fiveWkts = sorted.reduce((s, p) => s + (parseInt(p.bowl_five_fers) || 0), 0)

  const visible = showAll ? sorted : sorted.slice(0, 8)

  const onSort = col => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div>
      {/* Hero cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}
      >
        <StatCard icon={Target}    label="Wickets"   value={totalWkts}    sub={`${sorted.length} bowlers`}  color={C.red}    loading={false} />
        <StatCard icon={BarChart2} label="Overs"     value={fmt1(totalOvers)} sub="total bowled"            color={C.green}  loading={false} />
        <StatCard icon={Zap}       label="Best Econ" value={bestEcon ? fmt2(bestEcon.bowl_economy) : '—'} sub={bestEcon?.player_name?.split(' ')[0] || ''} color="#0891b2" loading={false} />
        <StatCard icon={Award}     label="5-fers"    value={fiveWkts}     sub="five-wicket hauls"           color={C.gold}   loading={false} />
      </motion.div>

      {/* Podium */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.gray5, marginBottom: 12 }}>🎯 Top Wicket Takers</div>
      <Podium items={sorted} valueKey="bowl_wickets" label="Wkts" />

      {/* Table */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.gray5, marginBottom: 10 }}>Bowling figures</div>
      <div style={{
        background: C.white, borderRadius: 16,
        border: `1px solid ${C.gray2}`,
        boxShadow: `0 2px 12px ${C.shadow}`,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 36px 48px 52px 52px', gap: 0, padding: '10px 14px', background: C.gray1, borderBottom: `1px solid ${C.gray2}` }}>
          {[
            { col: 'player_name',    label: 'Player', align: 'left' },
            { col: 'bowl_overs',     label: 'Ovr',   align: 'center' },
            { col: 'bowl_wickets',   label: 'Wkts',  align: 'center' },
            { col: 'bowl_best_wickets', label: 'Best', align: 'center' },
            { col: 'bowl_economy',   label: 'Econ',  align: 'center' },
            { col: 'bowl_average',   label: 'Avg',   align: 'center' },
          ].map(({ col, label, align }) => (
            <button key={col} onClick={() => onSort(col)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
              color: sortCol === col ? C.green : C.gray3, textTransform: 'uppercase',
              textAlign: align, display: 'flex', alignItems: 'center',
              justifyContent: align === 'left' ? 'flex-start' : 'center', gap: 2,
            }}>
              {label}
              {sortCol === col && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
            </button>
          ))}
        </div>

        {visible.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT, delay: i * 0.03 }}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 40px 36px 48px 52px 52px',
              gap: 0, padding: '11px 14px',
              borderBottom: i < visible.length - 1 ? `1px solid ${C.gray1}` : 'none',
              background: i === 0 && sortCol === 'bowl_wickets' ? `${C.red}08` : 'transparent',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <Avatar name={s.player_name} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.player_name}
                </div>
                <MiniBar value={s.bowl_wickets || 0} max={maxWkts} color={C.red} />
              </div>
            </div>
            <div style={cellStyle}>{fmt1(s.bowl_overs)}</div>
            <div style={{ ...cellStyle, fontWeight: 800, color: C.red }}>{fmtN(s.bowl_wickets)}</div>
            <div style={cellStyle}>{fmtBest(s.bowl_best_wickets, s.bowl_best_runs)}</div>
            <div style={{ ...cellStyle, color: parseFloat(s.bowl_economy) < 6 ? C.ok : parseFloat(s.bowl_economy) < 8 ? C.gold : C.red, fontWeight: 700 }}>
              {fmt2(s.bowl_economy)}
            </div>
            <div style={cellStyle}>{fmt2(s.bowl_average)}</div>
          </motion.div>
        ))}
      </div>

      {sorted.length > 8 && (
        <button onClick={() => setShowAll(a => !a)} style={{
          marginTop: 10, width: '100%', background: C.gray1, border: `1px solid ${C.gray2}`,
          borderRadius: 10, padding: '10px', fontFamily: FONT, fontSize: 13,
          fontWeight: 600, color: C.gray4, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <ChevronDown size={14} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          {showAll ? 'Show fewer' : `Show all ${sorted.length} bowlers`}
        </button>
      )}
    </div>
  )
}

// ── Fielding ───────────────────────────────────────────────
function FieldingDashboard({ stats, loading }) {
  if (loading) return <SkeletonDash />
  const fielders = stats
    .map(s => ({ ...s, _total: (s.field_catches || 0) + (s.field_run_outs || 0) + (s.field_stumpings || 0) }))
    .filter(s => s._total > 0)
    .sort((a, b) => b._total - a._total)
  if (!fielders.length) return <EmptyState tab="fielding" />

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.gray5, marginBottom: 12 }}>🧤 Fielding contributions</div>
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.gray2}`, boxShadow: `0 2px 12px ${C.shadow}`, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 56px 56px 52px', padding: '10px 14px', background: C.gray1, borderBottom: `1px solid ${C.gray2}` }}>
          {['Player', 'Cat', 'Run Out', 'Stmp', 'Total'].map((h, i) => (
            <div key={h} style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: C.gray3, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: i === 0 ? 'left' : 'center' }}>{h}</div>
          ))}
        </div>
        {fielders.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 48px 56px 56px 52px', padding: '11px 14px', borderBottom: i < fielders.length - 1 ? `1px solid ${C.gray1}` : 'none', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Avatar name={s.player_name} size={28} />
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark }}>{s.player_name}</span>
            </div>
            <div style={cellStyle}>{fmtN(s.field_catches)}</div>
            <div style={cellStyle}>{fmtN(s.field_run_outs)}</div>
            <div style={cellStyle}>{fmtN(s.field_stumpings)}</div>
            <div style={{ ...cellStyle, fontWeight: 800, color: C.green }}>{s._total}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Match log ──────────────────────────────────────────────
function MatchLogDashboard({ season }) {
  const [matches, setMatches] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [perfs, setPerfs] = useState([])
  const [loadingM, setLoadingM] = useState(true)
  const [loadingP, setLoadingP] = useState(false)

  useEffect(() => {
    async function load() {
      setLoadingM(true)
      const { data: ps } = await supabase.from('match_performances').select('match_id').eq('season', season)
      const ids = [...new Set((ps || []).map(p => p.match_id))]
      if (!ids.length) { setMatches([]); setLoadingM(false); return }
      const { data: ms } = await supabase.from('matches').select('id,opponent,date,venue,format').in('id', ids).order('date', { ascending: false })
      setMatches(ms || [])
      if (ms?.length) { setSelectedId(ms[0].id); loadPerfs(ms[0].id) }
      setLoadingM(false)
    }
    load()
  }, [season])

  async function loadPerfs(mid) {
    setLoadingP(true)
    const { data } = await supabase.from('match_performances').select('*').eq('match_id', mid)
    setPerfs(data || []); setLoadingP(false)
  }

  if (loadingM) return <div style={{ color: C.gray3, fontSize: 13, padding: '20px 0' }}>Loading…</div>
  if (!matches.length) return <EmptyState tab="match log" />

  const batters = perfs.filter(p => p.bat_did_bat).sort((a, b) => (b.bat_runs || 0) - (a.bat_runs || 0))
  const bowlers = perfs.filter(p => p.bowl_did_bowl).sort((a, b) => (b.bowl_wickets || 0) - (a.bowl_wickets || 0))

  return (
    <div>
      {/* Match selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {matches.map(m => (
          <button key={m.id} onClick={() => { setSelectedId(m.id); loadPerfs(m.id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 12, border: `2px solid ${m.id === selectedId ? C.green : C.gray2}`,
              background: m.id === selectedId ? C.greenBg : C.white,
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: m.id === selectedId ? C.green : C.dark }}>vs {m.opponent || 'TBC'}</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray3, marginTop: 2 }}>
                {m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}{m.venue ? ` · ${m.venue}` : ''}
              </div>
            </div>
            <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray3 }}>{m.format || 'T20'}</span>
          </button>
        ))}
      </div>

      {loadingP ? <Skeleton height={200} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {batters.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: C.greenDark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>🏏 Batting</div>
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.gray2}`, overflow: 'hidden' }}>
                {batters.map((p, i) => {
                  const sr = p.bat_balls ? ((p.bat_runs || 0) * 100 / p.bat_balls).toFixed(0) : '—'
                  return (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 36px 36px 40px', padding: '10px 14px', borderBottom: i < batters.length - 1 ? `1px solid ${C.gray1}` : 'none', alignItems: 'center', gap: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={p.player_name} size={26} />
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark }}>{p.player_name}</span>
                      </div>
                      <div style={{ ...cellStyle, fontWeight: 800, color: C.green }}>{p.bat_runs ?? '—'}{p.bat_not_out ? '*' : ''}</div>
                      <div style={cellStyle}>{p.bat_balls ?? '—'}</div>
                      <div style={cellStyle}>{p.bat_fours ?? '—'}</div>
                      <div style={cellStyle}>{p.bat_sixes ?? '—'}</div>
                      <div style={cellStyle}>{sr}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, padding: '6px 2px', fontSize: 10, color: C.gray3, fontFamily: FONT }}>
                {['Runs','Balls','4s','6s','SR'].map(h => <span key={h} style={{ flex: 1, textAlign: 'center' }}>{h}</span>)}
              </div>
            </div>
          )}

          {bowlers.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: C.greenDark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>⚡ Bowling</div>
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.gray2}`, overflow: 'hidden' }}>
                {bowlers.map((p, i) => {
                  const econ = p.bowl_overs ? (p.bowl_runs / p.bowl_overs).toFixed(2) : '—'
                  return (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 36px 44px', padding: '10px 14px', borderBottom: i < bowlers.length - 1 ? `1px solid ${C.gray1}` : 'none', alignItems: 'center', gap: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={p.player_name} size={26} />
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark }}>{p.player_name}</span>
                      </div>
                      <div style={cellStyle}>{p.bowl_overs ?? '—'}</div>
                      <div style={{ ...cellStyle, fontWeight: 800, color: C.red }}>{p.bowl_wickets ?? '—'}</div>
                      <div style={cellStyle}>{p.bowl_runs ?? '—'}</div>
                      <div style={cellStyle}>{econ}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, padding: '6px 2px', fontSize: 10, color: C.gray3, fontFamily: FONT }}>
                {['Overs','Wkts','Runs','Econ'].map(h => <span key={h} style={{ flex: 1, textAlign: 'center' }}>{h}</span>)}
              </div>
            </div>
          )}

          {!batters.length && !bowlers.length && (
            <div style={{ textAlign: 'center', padding: '24px', color: C.gray3, fontSize: 13 }}>No scorecard data for this match.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────
const cellStyle = { fontFamily: FONT, fontSize: 13, color: C.gray5, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }

function SkeletonDash() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[1,2,3,4].map(i => <Skeleton key={i} height={90} borderRadius={16} />)}
      </div>
      <Skeleton height={120} borderRadius={16} />
      <Skeleton height={220} borderRadius={16} />
    </div>
  )
}

function EmptyState({ tab }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', background: C.white, borderRadius: 18, border: `1px solid ${C.gray2}` }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: C.dark }}>No {tab} stats yet</div>
      <div style={{ fontFamily: FONT, fontSize: 13, color: C.gray3, marginTop: 6 }}>Admin can add stats in the admin panel.</div>
    </div>
  )
}

// ── Main Stats page ────────────────────────────────────────
const TABS = [
  { id: 'batting',  label: 'Batting',   icon: BarChart2 },
  { id: 'bowling',  label: 'Bowling',   icon: Target },
  { id: 'fielding', label: 'Fielding',  icon: Shield },
  { id: 'matchlog', label: 'Match Log', icon: TrendingUp },
]

export default function Stats() {
  const nav = useNavigate()
  const [season, setSeason]     = useState('2026')
  const [tab, setTab]           = useState('batting')
  const [batting, setBatting]   = useState([])
  const [bowling, setBowling]   = useState([])
  const [fielding, setFielding] = useState([])
  const [loading, setLoading]   = useState(true)
  const [source, setSource]     = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/player-stats?season=${season}`)
      .then(r => r.json())
      .then(d => {
        setBatting(d.batting  || [])
        setBowling(d.bowling  || [])
        setFielding(d.fielding || [])
        setSource(d.source)
        setUpdatedAt(d.updatedAt)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [season])

  // Map to the field names the dashboard components expect
  const batStats  = batting.map((p, i) => ({ id: i, player_name: p.name, bat_matches: p.matches, bat_innings: p.innings, bat_runs: p.runs, bat_balls: p.balls, bat_fours: p.fours, bat_sixes: p.sixes, bat_not_out: p.not_outs > 0, bat_average: p.average, bat_strike_rate: p.strike_rate, bat_highest: p.highest, bat_highest_not_out: p.highest_no, bat_fifties: p.fifties, bat_hundreds: p.hundreds }))
  const bowlStats = bowling.map((p, i) => ({ id: i, player_name: p.name, bowl_matches: p.matches, bowl_overs: p.overs, bowl_balls: p.balls, bowl_runs: p.runs, bowl_wickets: p.wickets, bowl_maidens: p.maidens, bowl_economy: p.economy, bowl_average: p.average, bowl_strike_rate: p.strike_rate, bowl_five_fers: p.five_fers, bowl_best_wickets: p.best_wickets, bowl_best_runs: p.best_runs }))
  const fieldStats = fielding.map((p, i) => ({ id: i, player_name: p.name, field_catches: p.catches, field_run_outs: p.run_outs, field_stumpings: p.stumpings }))

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* Hero */}
      <div style={{
        background: `radial-gradient(ellipse at 70% 0%, ${C.greenLight}55 0%, transparent 60%), linear-gradient(160deg, ${C.greenDark} 0%, #163d28 100%)`,
        padding: '28px 20px 0', position: 'relative',
      }}>
        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          <motion.button
            onClick={() => nav('/')}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.14 }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 14 }}
          >
            <ArrowLeft size={14} strokeWidth={2} /> Home
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE_OUT }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.2)', flexShrink: 0 }}>
                  <img src="/logo.png" alt="DTU CC" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                </div>
                <div>
                  <h1 style={{ color: C.white, fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.3 }}>Player Statistics</h1>
                  <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, marginTop: 2 }}>Tamil United CC · {season} Season</div>
                </div>
              </div>
              <select value={season} onChange={e => setSeason(e.target.value)}
                style={{ background: 'rgba(255,255,255,.15)', color: C.white, border: '1.5px solid rgba(255,255,255,.25)', borderRadius: 8, padding: '7px 12px', fontFamily: FONT, fontSize: 13, cursor: 'pointer', outline: 'none' }}
              >
                {SEASONS.map(s => <option key={s} value={s} style={{ color: C.dark, background: C.white }}>{s} Season</option>)}
              </select>
            </div>

            {/* Data source badge */}
            {source && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: source === 'live' ? 'rgba(21,128,61,.35)' : 'rgba(233,160,32,.2)',
                  border: `1px solid ${source === 'live' ? 'rgba(21,128,61,.5)' : 'rgba(233,160,32,.4)'}`,
                  borderRadius: 20, padding: '4px 10px',
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: source === 'live' ? '#4ade80' : C.gold,
                    boxShadow: source === 'live' ? '0 0 6px #4ade80' : 'none',
                  }} />
                  <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: source === 'live' ? '#86efac' : C.gold }}>
                    {source === 'live' ? 'Live · play-cricket.com' : `Excel import · Updated ${updatedAt ? new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}`}
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 0 }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id
              return (
                <button key={id} onClick={() => setTab(id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '10px 14px', background: 'none', border: 'none',
                  borderBottom: `2.5px solid ${active ? C.gold : 'transparent'}`,
                  color: active ? C.gold : 'rgba(255,255,255,.55)',
                  cursor: 'pointer', fontFamily: FONT, fontSize: 13,
                  fontWeight: active ? 700 : 400, whiteSpace: 'nowrap',
                  transition: 'color 150ms ease', flexShrink: 0,
                }}>
                  <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '20px 16px 48px', width: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab + season}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            {tab === 'batting'  && <BattingDashboard  stats={batStats}   loading={loading} />}
            {tab === 'bowling'  && <BowlingDashboard  stats={bowlStats}  loading={loading} />}
            {tab === 'fielding' && <FieldingDashboard stats={fieldStats} loading={loading} />}
            {tab === 'matchlog' && <MatchLogDashboard season={season} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}
