import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import { Skeleton } from './ui/Loader'

const EASE_OUT   = [0.23, 1, 0.32, 1]
const EASE_SPRING = { type: 'spring', duration: 0.38, bounce: 0.15 }

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
}
const staggerList = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
}
const staggerItem = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } },
}
const tabFade = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.22, ease: EASE_OUT } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.14 } },
}
const medalVariants = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: EASE_SPRING },
}

const SEASONS = ['2026', '2025', '2024']
const MEDALS  = ['🥇', '🥈', '🥉']

/* ─── MATCH LOG ────────────────────────────────────────── */
function MatchLogContent({ season }) {
  const [matches, setMatches] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [perfs, setPerfs] = useState([])
  const [loadingM, setLoadingM] = useState(true)
  const [loadingP, setLoadingP] = useState(false)

  useEffect(() => {
    async function load() {
      setLoadingM(true)
      // Get matches that have performances for this season
      const { data: ps } = await supabase
        .from('match_performances')
        .select('match_id')
        .eq('season', season)
      const ids = [...new Set((ps || []).map((p) => p.match_id))]
      if (!ids.length) { setMatches([]); setLoadingM(false); return }
      const { data: ms } = await supabase
        .from('matches')
        .select('id,opponent,date,venue,format')
        .in('id', ids)
        .order('date', { ascending: false })
      setMatches(ms || [])
      if (ms?.length) {
        setSelectedId(ms[0].id)
        loadPerfs(ms[0].id)
      }
      setLoadingM(false)
    }
    load()
  }, [season])

  async function loadPerfs(mid) {
    setLoadingP(true)
    const { data } = await supabase
      .from('match_performances')
      .select('*')
      .eq('match_id', mid)
    setPerfs(data || [])
    setLoadingP(false)
  }

  function selectMatch(id) {
    setSelectedId(id)
    loadPerfs(id)
  }

  if (loadingM) return <div style={{ color: C.gray3, fontFamily: FONT, fontSize: 14, padding: '20px 0' }}>Loading…</div>

  if (!matches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 2px 12px rgba(0,0,0,.1)', overflow: 'hidden' }}>
          <img src="/logo.png" alt="DTU CC" style={{ width: 64, height: 64, objectFit: 'contain' }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.dark, marginBottom: 6 }}>No match scorecards yet</div>
        <div style={{ color: C.gray3, fontSize: 14 }}>Admin can add match performances under Stats → Match Scorecards.</div>
      </div>
    )
  }

  const batters = perfs.filter((p) => p.bat_did_bat).sort((a, b) => (b.bat_runs || 0) - (a.bat_runs || 0))
  const bowlers = perfs.filter((p) => p.bowl_did_bowl).sort((a, b) => (b.bowl_wickets || 0) - (a.bowl_wickets || 0))
  const fielders = perfs.filter((p) => (p.field_catches || 0) + (p.field_run_outs || 0) + (p.field_stumpings || 0) > 0)

  return (
    <div>
      {/* Match selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {matches.map((m) => (
          <button
            key={m.id}
            onClick={() => selectMatch(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 10, border: `2px solid ${m.id === selectedId ? C.green : C.gray2}`,
              background: m.id === selectedId ? C.greenBg : C.white,
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: m.id === selectedId ? C.green : C.dark }}>
                vs {m.opponent || 'TBC'}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: C.gray3, marginTop: 2 }}>
                {m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                {m.venue ? ` · ${m.venue}` : ''}
              </div>
            </div>
            <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray3 }}>{m.format || 'T20'}</span>
          </button>
        ))}
      </div>

      {loadingP ? (
        <div style={{ color: C.gray3, fontFamily: FONT, fontSize: 14 }}>Loading scorecard…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Batting */}
          {batters.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.greenDark, marginBottom: 8 }}>🏏 Batting</div>
              <TableWrap minWidth={340}>
                <thead>
                  <tr>
                    {['Player','R','B','4s','6s','SR'].map((h) => (
                      <th key={h} style={{ padding: '8px 8px', fontSize: 12, fontWeight: 700, color: C.gray4, background: C.gray1, textAlign: h === 'Player' ? 'left' : 'center', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batters.map((p, i) => {
                    const bg = i % 2 === 0 ? C.white : '#fafafa'
                    const sr = p.bat_balls ? ((p.bat_runs || 0) * 100 / p.bat_balls).toFixed(0) : '—'
                    return (
                      <tr key={p.id}>
                        <td style={{ ...td(bg), textAlign: 'left', fontWeight: 600, paddingLeft: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <InitAvatar name={p.player_name} size={22} />
                            {p.player_name}
                          </div>
                        </td>
                        <td style={{ ...td(bg), fontWeight: 700, color: C.green }}>{p.bat_runs ?? '—'}{p.bat_not_out ? '*' : ''}</td>
                        <td style={td(bg)}>{p.bat_balls ?? '—'}</td>
                        <td style={td(bg)}>{p.bat_fours ?? '—'}</td>
                        <td style={td(bg)}>{p.bat_sixes ?? '—'}</td>
                        <td style={td(bg)}>{sr}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </TableWrap>
            </div>
          )}

          {/* Bowling */}
          {bowlers.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.greenDark, marginBottom: 8 }}>⚡ Bowling</div>
              <TableWrap minWidth={320}>
                <thead>
                  <tr>
                    {['Player','O','W','R','Econ'].map((h) => (
                      <th key={h} style={{ padding: '8px 8px', fontSize: 12, fontWeight: 700, color: C.gray4, background: C.gray1, textAlign: h === 'Player' ? 'left' : 'center', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bowlers.map((p, i) => {
                    const bg = i % 2 === 0 ? C.white : '#fafafa'
                    const econ = p.bowl_overs ? (p.bowl_runs / p.bowl_overs).toFixed(2) : '—'
                    return (
                      <tr key={p.id}>
                        <td style={{ ...td(bg), textAlign: 'left', fontWeight: 600, paddingLeft: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <InitAvatar name={p.player_name} size={22} />
                            {p.player_name}
                          </div>
                        </td>
                        <td style={td(bg)}>{p.bowl_overs ?? '—'}</td>
                        <td style={{ ...td(bg), fontWeight: 700, color: C.green }}>{p.bowl_wickets ?? '—'}</td>
                        <td style={td(bg)}>{p.bowl_runs ?? '—'}</td>
                        <td style={td(bg)}>{econ}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </TableWrap>
            </div>
          )}

          {/* Fielding */}
          {fielders.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.greenDark, marginBottom: 8 }}>🧤 Fielding</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {fielders.map((p) => (
                  <div key={p.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.gray2}`, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InitAvatar name={p.player_name} size={24} />
                    <div>
                      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: C.dark }}>{p.player_name}</div>
                      <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray3 }}>
                        {p.field_catches ? `${p.field_catches}c ` : ''}
                        {p.field_run_outs ? `${p.field_run_outs}ro ` : ''}
                        {p.field_stumpings ? `${p.field_stumpings}st` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function fmt2(v) {
  const n = parseFloat(v)
  if (!n || isNaN(n)) return '—'
  return n.toFixed(2)
}
function fmtHS(runs, notOut) {
  const n = parseInt(runs)
  if (!n && n !== 0) return '—'
  return `${n}${notOut ? '*' : ''}`
}
function fmtBest(w, r) {
  const wn = parseInt(w)
  if (!wn) return '—'
  return `${wn}/${parseInt(r) || 0}`
}
function fmtNum(v) {
  const n = parseInt(v)
  if (!n && n !== 0) return '—'
  return n
}

function InitAvatar({ name, size = 30 }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: C.green, color: C.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: Math.floor(size * 0.38), flexShrink: 0,
        fontFamily: FONT,
      }}
    >
      {initials}
    </div>
  )
}

function MedalCards({ items, primaryKey, primaryLabel, secondaryKey, secondaryLabel, fmtPrimary, fmtSecondary }) {
  const top3 = [...items]
    .filter((s) => (parseFloat(s[primaryKey]) || 0) > 0)
    .sort((a, b) => (parseFloat(b[primaryKey]) || 0) - (parseFloat(a[primaryKey]) || 0))
    .slice(0, 3)
  if (!top3.length) return null
  const borderColors = [C.gold, '#d1d5db', '#b45309']
  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', gap: 10, marginBottom: 20 }}
    >
      {top3.map((s, i) => (
        <motion.div
          key={s.id}
          variants={medalVariants}
          style={{
            flex: 1, background: C.white, borderRadius: 12, padding: '14px 10px',
            boxShadow: '0 2px 10px rgba(0,0,0,.07)',
            border: `1.5px solid ${borderColors[i]}`,
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}
        >
          <span style={{ fontSize: 22 }}>{MEDALS[i]}</span>
          <InitAvatar name={s.player_name} size={36} />
          <div style={{ fontWeight: 700, fontSize: 13, color: C.dark, lineHeight: 1.2, marginTop: 2 }}>
            {s.player_name.split(' ')[0]}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: i === 0 ? C.green : C.gray5, lineHeight: 1 }}>
            {fmtPrimary ? fmtPrimary(s) : (parseInt(s[primaryKey]) || 0)}
          </div>
          <div style={{ fontSize: 11, color: C.gray3 }}>{primaryLabel}</div>
          {secondaryKey && (
            <div style={{ fontSize: 12, color: C.gray4 }}>
              {fmtSecondary ? fmtSecondary(s) : fmt2(s[secondaryKey])} {secondaryLabel}
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}

function SortTh({ col, label, sortCol, sortDir, onSort, align = 'center', style: s, sticky, left, minW }) {
  const active = sortCol === col
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        padding: '10px 8px',
        fontSize: 12,
        fontWeight: 700,
        color: active ? C.green : C.gray4,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        background: C.gray1,
        textAlign: align,
        borderBottom: `2.5px solid ${active ? C.green : 'transparent'}`,
        ...(sticky ? {
          position: 'sticky',
          left: left ?? 0,
          zIndex: 2,
          boxShadow: left ? '2px 0 6px rgba(0,0,0,.08)' : undefined,
          minWidth: minW ?? 'auto',
        } : {}),
        ...s,
      }}
    >
      {label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )
}

function RankTh() {
  return (
    <th style={{
      width: 36, padding: '10px 6px',
      fontSize: 12, fontWeight: 700, color: C.gray4,
      background: C.gray1, textAlign: 'center',
      borderBottom: `2.5px solid transparent`,
      position: 'sticky', left: 0, zIndex: 2,
    }}>
      #
    </th>
  )
}

function TableWrap({ children, minWidth = 560 }) {
  return (
    <div style={{
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      borderRadius: 12,
      boxShadow: '0 2px 14px rgba(0,0,0,.06)',
    }}>
      <table style={{ minWidth, width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  )
}

function rbg(i, isFirst) {
  if (isFirst) return '#f0fdf4'
  return i % 2 === 0 ? C.white : '#fafafa'
}

function td(bg) {
  return { padding: '9px 8px', fontSize: 13, color: C.dark, textAlign: 'center', background: bg, verticalAlign: 'middle' }
}
function tdSticky(bg, left) {
  return {
    ...td(bg),
    position: 'sticky', left, zIndex: 1,
    boxShadow: left ? '2px 0 6px rgba(0,0,0,.07)' : undefined,
  }
}

/* ─── BATTING ─────────────────────────────────────────── */
function BattingContent({ stats, sortCol, sortDir, onSort }) {
  const sp = { sortCol, sortDir, onSort }
  return (
    <>
      <MedalCards
        items={stats}
        primaryKey="bat_runs"
        primaryLabel="Runs"
        secondaryKey="bat_average"
        secondaryLabel="avg"
      />
      <TableWrap minWidth={620}>
        <thead>
          <tr>
            <RankTh />
            <SortTh col="player_name" label="Player" align="left" sticky left={36} minW={130} {...sp} />
            <SortTh col="bat_matches"    label="M"    {...sp} />
            <SortTh col="bat_innings"    label="Inn"  {...sp} />
            <SortTh col="bat_runs"       label="Runs" {...sp} />
            <SortTh col="bat_highest"    label="HS"   {...sp} />
            <SortTh col="bat_average"    label="Avg"  {...sp} />
            <SortTh col="bat_strike_rate" label="SR"  {...sp} />
            <SortTh col="bat_fifties"    label="50s"  {...sp} />
            <SortTh col="bat_hundreds"   label="100s" {...sp} />
            <SortTh col="bat_sixes"      label="6s"   {...sp} />
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => {
            const bg = rbg(i, i === 0 && sortCol === 'bat_runs' && sortDir === 'desc')
            return (
              <tr key={s.id}>
                <td style={{ ...tdSticky(bg, 0), color: C.gray3, fontSize: 11, width: 36 }}>{i + 1}</td>
                <td style={{ ...tdSticky(bg, 36), textAlign: 'left', fontWeight: 600, paddingLeft: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InitAvatar name={s.player_name} size={26} />
                    {s.player_name}
                  </div>
                </td>
                <td style={td(bg)}>{fmtNum(s.bat_matches)}</td>
                <td style={td(bg)}>{fmtNum(s.bat_innings)}</td>
                <td style={{ ...td(bg), fontWeight: 700, color: C.green }}>{fmtNum(s.bat_runs)}</td>
                <td style={td(bg)}>{fmtHS(s.bat_highest, s.bat_highest_not_out)}</td>
                <td style={td(bg)}>{fmt2(s.bat_average)}</td>
                <td style={td(bg)}>{fmt2(s.bat_strike_rate)}</td>
                <td style={td(bg)}>{fmtNum(s.bat_fifties)}</td>
                <td style={td(bg)}>{fmtNum(s.bat_hundreds)}</td>
                <td style={td(bg)}>{fmtNum(s.bat_sixes)}</td>
              </tr>
            )
          })}
        </tbody>
      </TableWrap>
    </>
  )
}

/* ─── BOWLING ─────────────────────────────────────────── */
function BowlingContent({ stats, sortCol, sortDir, onSort }) {
  const sp = { sortCol, sortDir, onSort }
  return (
    <>
      <MedalCards
        items={stats}
        primaryKey="bowl_wickets"
        primaryLabel="Wickets"
        secondaryKey="bowl_economy"
        secondaryLabel="econ"
      />
      <TableWrap minWidth={660}>
        <thead>
          <tr>
            <RankTh />
            <SortTh col="player_name"      label="Player" align="left" sticky left={36} minW={130} {...sp} />
            <SortTh col="bowl_matches"     label="M"      {...sp} />
            <SortTh col="bowl_overs"       label="Overs"  {...sp} />
            <SortTh col="bowl_wickets"     label="Wkts"   {...sp} />
            <SortTh col="bowl_runs"        label="Runs"   {...sp} />
            <SortTh col="bowl_best_wickets" label="Best"  {...sp} />
            <SortTh col="bowl_average"     label="Avg"    {...sp} />
            <SortTh col="bowl_economy"     label="Econ"   {...sp} />
            <SortTh col="bowl_strike_rate" label="SR"     {...sp} />
            <SortTh col="bowl_five_fers"   label="5W"     {...sp} />
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => {
            const bg = rbg(i, i === 0 && sortCol === 'bowl_wickets' && sortDir === 'desc')
            return (
              <tr key={s.id}>
                <td style={{ ...tdSticky(bg, 0), color: C.gray3, fontSize: 11, width: 36 }}>{i + 1}</td>
                <td style={{ ...tdSticky(bg, 36), textAlign: 'left', fontWeight: 600, paddingLeft: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InitAvatar name={s.player_name} size={26} />
                    {s.player_name}
                  </div>
                </td>
                <td style={td(bg)}>{fmtNum(s.bowl_matches)}</td>
                <td style={td(bg)}>{parseFloat(s.bowl_overs) || '—'}</td>
                <td style={{ ...td(bg), fontWeight: 700, color: C.green }}>{fmtNum(s.bowl_wickets)}</td>
                <td style={td(bg)}>{fmtNum(s.bowl_runs)}</td>
                <td style={td(bg)}>{fmtBest(s.bowl_best_wickets, s.bowl_best_runs)}</td>
                <td style={td(bg)}>{fmt2(s.bowl_average)}</td>
                <td style={td(bg)}>{fmt2(s.bowl_economy)}</td>
                <td style={td(bg)}>{fmt2(s.bowl_strike_rate)}</td>
                <td style={td(bg)}>{fmtNum(s.bowl_five_fers)}</td>
              </tr>
            )
          })}
        </tbody>
      </TableWrap>
    </>
  )
}

/* ─── FIELDING ────────────────────────────────────────── */
function FieldingContent({ stats, sortCol, sortDir, onSort }) {
  const sp = { sortCol, sortDir, onSort }
  return (
    <TableWrap minWidth={420}>
      <thead>
        <tr>
          <RankTh />
          <SortTh col="player_name"   label="Player"    align="left" sticky left={36} minW={130} {...sp} />
          <SortTh col="field_catches"  label="Catches"  {...sp} />
          <SortTh col="field_run_outs" label="Run Outs" {...sp} />
          <SortTh col="field_stumpings" label="Stmpgs" {...sp} />
          <SortTh col="_total"         label="Total"    {...sp} />
        </tr>
      </thead>
      <tbody>
        {stats.map((s, i) => {
          const bg = rbg(i, i === 0 && sortCol === '_total' && sortDir === 'desc')
          return (
            <tr key={s.id}>
              <td style={{ ...tdSticky(bg, 0), color: C.gray3, fontSize: 11, width: 36 }}>{i + 1}</td>
              <td style={{ ...tdSticky(bg, 36), textAlign: 'left', fontWeight: 600, paddingLeft: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <InitAvatar name={s.player_name} size={26} />
                  {s.player_name}
                </div>
              </td>
              <td style={td(bg)}>{fmtNum(s.field_catches)}</td>
              <td style={td(bg)}>{fmtNum(s.field_run_outs)}</td>
              <td style={td(bg)}>{fmtNum(s.field_stumpings)}</td>
              <td style={{ ...td(bg), fontWeight: 700, color: C.green }}>{s._total || '—'}</td>
            </tr>
          )
        })}
      </tbody>
    </TableWrap>
  )
}

/* ─── ROOT ────────────────────────────────────────────── */
export default function Stats() {
  const nav = useNavigate()
  const [season, setSeason]   = useState('2026')
  const [tab, setTab]         = useState('batting')
  const [stats, setStats]     = useState([])
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState('bat_runs')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => { loadStats() }, [season])

  useEffect(() => {
    if (tab === 'batting')  { setSortCol('bat_runs');     setSortDir('desc') }
    if (tab === 'bowling')  { setSortCol('bowl_wickets'); setSortDir('desc') }
    if (tab === 'fielding') { setSortCol('_total');       setSortDir('desc') }
  }, [tab])

  async function loadStats() {
    setLoading(true)
    const { data } = await supabase.from('player_stats').select('*').eq('season', season)
    setStats(data || [])
    setLoading(false)
  }

  function handleSort(col) {
    if (col === sortCol) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('desc') }
  }

  const enriched = stats.map((s) => ({
    ...s,
    _total: (s.field_catches || 0) + (s.field_run_outs || 0) + (s.field_stumpings || 0),
  }))

  const sorted = [...enriched].sort((a, b) => {
    const av = typeof a[sortCol] === 'string' ? a[sortCol].toLowerCase() : parseFloat(a[sortCol]) || 0
    const bv = typeof b[sortCol] === 'string' ? b[sortCol].toLowerCase() : parseFloat(b[sortCol]) || 0
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const lastUpdated = enriched.reduce(
    (l, s) => (!l || (s.updated_at && s.updated_at > l) ? s.updated_at : l),
    null
  )
  const updatedBy = [...enriched].sort((a, b) =>
    (b.updated_at || '') > (a.updated_at || '') ? 1 : -1
  )[0]?.updated_by

  const sp = { sortCol, sortDir, onSort: handleSort }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`, padding: '24px 20px' }}>
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}
        >
          <motion.button
            variants={fadeUp}
            onClick={() => nav('/')}
            style={{ color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 10 }}
          >
            ← Home
          </motion.button>
          <motion.h1 variants={fadeUp} style={{ color: C.white, fontSize: 22, fontWeight: 800, margin: 0 }}>🏏 Player Statistics</motion.h1>
          <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>Tamil United CC · {season} Season</span>
            <span style={{ background: C.gold, color: C.dark, fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 99 }}>
              ⚡ Live Season
            </span>
          </motion.div>
          <motion.select
            variants={fadeUp}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            style={{
              marginTop: 14,
              background: 'rgba(255,255,255,.15)', color: C.white,
              border: '1.5px solid rgba(255,255,255,.3)', borderRadius: 8,
              padding: '7px 14px', fontFamily: FONT, fontSize: 13,
              cursor: 'pointer', outline: 'none',
            }}
          >
            {SEASONS.map((s) => (
              <option key={s} value={s} style={{ color: C.dark, background: C.white }}>{s} Season</option>
            ))}
          </motion.select>
        </motion.div>
      </div>

      {/* Sub-tabs */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.gray2}` }}>
        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '0 12px', display: 'flex' }}>
          {[
            { id: 'batting',  label: '🏏 Batting'  },
            { id: 'bowling',  label: '🎯 Bowling'  },
            { id: 'fielding', label: '🤸 Fielding' },
            { id: 'matchlog', label: '📋 Match Log' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '12px 18px', background: 'none', border: 'none',
                borderBottom: `2.5px solid ${tab === t.id ? C.green : 'transparent'}`,
                color: tab === t.id ? C.green : C.gray4,
                cursor: 'pointer', fontFamily: FONT, fontSize: 13,
                fontWeight: tab === t.id ? 700 : 400, whiteSpace: 'nowrap',
                transition: 'color .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '16px 16px 40px', width: '100%' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} height={44} borderRadius={10} />)}
          </div>
        ) : stats.length === 0 && tab !== 'matchlog' ? (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.dark, marginBottom: 8 }}>
              No statistics yet for {season}
            </div>
            <div style={{ color: C.gray3, fontSize: 14, lineHeight: 1.6 }}>
              Admin can add stats from the admin panel.
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                variants={tabFade}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {tab === 'batting'  && <BattingContent  stats={sorted} {...sp} />}
                {tab === 'bowling'  && <BowlingContent  stats={sorted} {...sp} />}
                {tab === 'fielding' && <FieldingContent stats={sorted} {...sp} />}
                {tab === 'matchlog' && <MatchLogContent season={season} />}
              </motion.div>
            </AnimatePresence>

            {lastUpdated && (
              <div style={{ textAlign: 'center', color: C.gray3, fontSize: 12, marginTop: 20 }}>
                Last updated:{' '}
                {new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {updatedBy ? ` · by ${updatedBy}` : ''}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
