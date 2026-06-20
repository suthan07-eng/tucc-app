import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
const AC = { green:'#2563eb', greenDark:'#1e3a8a', greenLight:'#1d4ed8', greenBg:'#eff6ff', gold:'#e9a020', white:'#ffffff', bg:'#eef2ff', gray1:'#f1f5f9', gray2:'#e2e8f0', gray3:'#94a3b8', gray4:'#64748b', gray5:'#334155', dark:'#0f172a', red:'#dc2626', redBg:'#fee2e2', ok:'#16a34a', okBg:'#dcfce7', blue:'#2563eb', blueBg:'#eff6ff', shadow:'rgba(30,58,138,0.07)', shadowMd:'rgba(30,58,138,0.11)', shadowLg:'rgba(30,58,138,0.18)' } // admin keeps original light theme
import { useToast } from '../Toast'

// ── Composite scoring (mirrors AnalysePage methodology) ────────────────────
function normalise(arr, key, invert = false) {
  const vals = arr.map(r => Number(r[key]) || 0)
  const min = Math.min(...vals), max = Math.max(...vals)
  if (max === min) return arr.map(() => 0)
  return arr.map(r => {
    const v = (Number(r[key]) || 0 - min) / (max - min)
    return invert ? 1 - v : v
  })
}

function computeBattingScores(rows) {
  const valid = rows.filter(r => r.innings >= 1)
  if (!valid.length) return []
  const n = arr => { const vals = arr.map(Number); const mn = Math.min(...vals), mx = Math.max(...vals); return vals.map(v => mx===mn?0:(v-mn)/(mx-mn)) }
  const runs_n  = n(valid.map(r=>r.runs))
  const sr_n    = n(valid.map(r=>r.strike_rate))
  const hs_n    = n(valid.map(r=>r.high_score))
  const mile_n  = n(valid.map(r=>r.hundreds*20+r.fifties*10))
  const games_n = n(valid.map(r=>r.matches))
  return valid.map((r, i) => ({
    ...r,
    composite: Math.round((runs_n[i]*0.40 + sr_n[i]*0.25 + hs_n[i]*0.15 + mile_n[i]*0.10 + games_n[i]*0.10) * 100 * 10) / 10,
  })).sort((a, b) => b.composite - a.composite)
}

function computeBowlingScores(rows) {
  const valid = rows.filter(r => r.overs >= 10)
  if (!valid.length) return []
  const n = arr => { const vals = arr.map(Number); const mn = Math.min(...vals), mx = Math.max(...vals); return vals.map(v => mx===mn?0:(v-mn)/(mx-mn)) }
  const wkts_n  = n(valid.map(r=>r.wickets))
  const econ_ni = valid.map(r=>r.economy_rate); const en_n = n(econ_ni.map((v,i)=>-v)).map(v=>1-v); // invert: lower economy = higher score
  const avg_ni  = valid.map(r=>r.average);      const av_n = n(avg_ni.map((v,i)=>-v)).map(v=>1-v);
  const sr_ni   = valid.map(r=>r.strike_rate);   const sr_n = n(sr_ni.map((v,i)=>-v)).map(v=>1-v);
  // recalculate properly
  const wV = valid.map(r=>r.wickets)
  const eV = valid.map(r=>r.economy_rate)
  const aV = valid.map(r=>r.average)
  const sV = valid.map(r=>r.strike_rate)
  const norm = (arr, inv) => { const mn=Math.min(...arr),mx=Math.max(...arr); return arr.map(v=>mx===mn?0.5:inv?(1-(v-mn)/(mx-mn)):(v-mn)/(mx-mn)) }
  const wN = norm(wV, false)
  const eN = norm(eV, true)
  const aN = norm(aV, true)
  const sN = norm(sV, true)
  return valid.map((r, i) => ({
    ...r,
    composite: Math.round((wN[i]*0.40 + eN[i]*0.30 + aN[i]*0.20 + sN[i]*0.10) * 100 * 10) / 10,
  })).sort((a, b) => b.composite - a.composite)
}

function computeAllrounderScores(batScored, bowlScored) {
  // normalise bat scores and bowl scores independently
  const batMap  = Object.fromEntries(batScored.map(r => [r.player_name, r.composite]))
  const bowlMap = Object.fromEntries(bowlScored.map(r => [r.player_name, r.composite]))
  const batMax  = Math.max(...Object.values(batMap)) || 1
  const bowlMax = Math.max(...Object.values(bowlMap)) || 1
  // only include players who appear in both lists
  const names = Object.keys(batMap).filter(n => bowlMap[n] !== undefined)
  return names.map(name => {
    const batN  = (batMap[name]  || 0) / batMax * 100
    const bowlN = (bowlMap[name] || 0) / bowlMax * 100
    return {
      player_name: name,
      bat_score:   Math.round(batN * 10) / 10,
      bowl_score:  Math.round(bowlN * 10) / 10,
      composite:   Math.round((batN * 0.5 + bowlN * 0.5) * 10) / 10,
    }
  }).sort((a, b) => b.composite - a.composite)
}

function tagFromScore(score, rank) {
  if (rank === 1 || score >= 80) return 'AVOID'
  if (score >= 55) return 'CONTAIN'
  return 'TARGET'
}

// ── Excel parsers (header-based — column order does not matter) ───────────
const _int = v => Math.round(Number(v) || 0)
const _num = v => Number(v) || 0
const _norm = s => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '')

// Read a cell by coordinate directly (does NOT rely on the sheet's declared
// !ref range, which some exports set too narrow — e.g. "A1:A10").
function getCell(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })]
  return cell ? cell.v : undefined
}

// Find the header row (the one with a Player/Name column) by scanning cells,
// then map every header title → its column index.
function findHeader(ws) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 40; c++) {
      const v = getCell(ws, r, c)
      if (v && /^(player|name|player name)$/i.test(String(v).trim())) {
        const map = {}
        for (let cc = 0; cc < 60; cc++) {
          const k = _norm(getCell(ws, r, cc))
          if (k && !(k in map)) map[k] = cc
        }
        return { row: r, map }
      }
    }
  }
  return null
}

// Pick a cell value for a data row by trying a list of header aliases
function cell(ws, map, r, aliases) {
  for (const a of aliases) {
    const k = _norm(a)
    if (k in map) {
      const v = getCell(ws, r, map[k])
      if (v !== undefined && v !== '') return v
    }
  }
  return undefined
}

function loadSheet(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  return wb.Sheets[wb.SheetNames[0]]
}

function parseBattingExcel(buffer) {
  const ws = loadSheet(buffer)
  const h = findHeader(ws)
  if (!h) return []
  const out = []
  let blanks = 0
  for (let r = h.row + 1; r < h.row + 600; r++) {
    const name = cell(ws, h.map, r, ['player', 'name', 'playername'])
    if (!name || typeof name !== 'string' || !name.trim()) { if (++blanks > 8) break; continue }
    blanks = 0
    const hsRaw = cell(ws, h.map, r, ['highscore', 'hs', 'high'])
    const hsNo  = cell(ws, h.map, r, ['highscorenotout', 'hsnotout'])
    out.push({
      player_name:        String(name).trim(),
      matches:            _int(cell(ws, h.map, r, ['games', 'matches', 'mat', 'm', 'mts'])),
      innings:            _int(cell(ws, h.map, r, ['inns', 'innings', 'inn'])),
      not_outs:           _int(cell(ws, h.map, r, ['notouts', 'no', 'nos'])),
      runs:               _int(cell(ws, h.map, r, ['runs', 'r'])),
      high_score:         _int(String(hsRaw == null ? 0 : hsRaw).replace('*', '')),
      high_score_not_out: hsNo !== undefined ? /^(y|yes|true|1)/i.test(String(hsNo)) : String(hsRaw || '').includes('*'),
      avg:                _num(cell(ws, h.map, r, ['avg', 'average', 'ave'])),
      strike_rate:        _num(cell(ws, h.map, r, ['strikerate', 'sr'])),
      fifties:            _int(cell(ws, h.map, r, ['50s', 'fifties', '50', 'fifty'])),
      hundreds:           _int(cell(ws, h.map, r, ['100s', 'hundreds', '100', 'hundred'])),
    })
  }
  return out
}

function parseBowlingExcel(buffer) {
  const ws = loadSheet(buffer)
  const h = findHeader(ws)
  if (!h) return []
  const out = []
  let blanks = 0
  for (let r = h.row + 1; r < h.row + 600; r++) {
    const name = cell(ws, h.map, r, ['player', 'name', 'playername'])
    if (!name || typeof name !== 'string' || !name.trim()) { if (++blanks > 8) break; continue }
    blanks = 0
    out.push({
      player_name:   String(name).trim(),
      matches:       _int(cell(ws, h.map, r, ['games', 'matches', 'mat', 'm'])),
      overs:         _num(cell(ws, h.map, r, ['overs', 'ov', 'ovrs', 'over'])),
      maidens:       _int(cell(ws, h.map, r, ['maidens', 'mdns', 'maid', 'md'])),
      runs:          _int(cell(ws, h.map, r, ['runs', 'runsconceded', 'r'])),
      wickets:       _int(cell(ws, h.map, r, ['wickets', 'wkts', 'wkt', 'w'])),
      best_bowling:  String(cell(ws, h.map, r, ['bestbowling', 'best', 'bb']) || ''),
      five_wkt_haul: _int(cell(ws, h.map, r, ['5wickethaul', '5wickethauls', 'fivewickethaul', '5w', '5wkt', 'fifer', 'fivefors'])),
      economy_rate:  _num(cell(ws, h.map, r, ['economyrate', 'economy', 'econ', 'eco', 'er'])),
      strike_rate:   _num(cell(ws, h.map, r, ['strikerate', 'sr'])),
      average:       _num(cell(ws, h.map, r, ['average', 'avg', 'ave'])),
    })
  }
  return out
}

// ── Small UI helpers ─────────────────────────────────────────────────────
function Inp({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: FONT, fontSize: 12, fontWeight: 700, color: AC.gray5, marginBottom: 5 }}>
        {label}{required && <span style={{ color: AC.red }}> *</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: `1.5px solid ${AC.gray2}`, fontFamily: FONT, fontSize: 13,
          color: AC.dark, background: '#fff', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', disabled, loading, small }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '8px 14px' : '11px 20px',
    borderRadius: 10, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: FONT, fontSize: small ? 12 : 13, fontWeight: 700,
    opacity: disabled ? 0.6 : 1, transition: 'all 150ms ease',
  }
  const vars = {
    primary:  { background: AC.green,   color: '#fff' },
    danger:   { background: '#fee2e2', color: '#b91c1c' },
    ghost:    { background: '#f1f5f9', color: AC.gray5 },
    gold:     { background: AC.gold,    color: '#fff' },
  }
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ ...base, ...vars[variant] }}>
      {loading ? '⏳ ' : ''}{children}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${AC.gray2}`, borderRadius: 16, padding: '18px 16px', marginBottom: 18 }}>
      {title && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: AC.dark, marginBottom: 14, borderBottom: `1px solid ${AC.gray2}`, paddingBottom: 10 }}>{title}</div>}
      {children}
    </div>
  )
}

// ── Opponent list card ───────────────────────────────────────────────────
function OpponentCard({ opp, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${AC.gray2}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: AC.greenDark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: FONT, fontWeight: 900, fontSize: 16, color: '#fff' }}>
        {opp.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: AC.dark }}>{opp.name}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: AC.gray4 }}>
          Season {opp.season}
          {opp.match_date ? ` · ${new Date(opp.match_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}` : ''}
          {opp.player_count ? ` · ${opp.player_count} players` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <Btn small variant="ghost" onClick={onEdit}>✏️ Edit</Btn>
        {confirming
          ? <Btn small variant="danger" onClick={onDelete}>Confirm Delete</Btn>
          : <Btn small variant="danger" onClick={() => setConfirming(true)}>🗑️</Btn>}
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────
function Steps({ current, steps }) {
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {i > 0 && <div style={{ position: 'absolute', left: 0, top: 14, width: '50%', height: 2, background: i <= current ? AC.green : AC.gray2 }} />}
          {i < steps.length - 1 && <div style={{ position: 'absolute', right: 0, top: 14, width: '50%', height: 2, background: i < current ? AC.green : AC.gray2 }} />}
          <div style={{
            width: 28, height: 28, borderRadius: '50%', zIndex: 1,
            background: i < current ? AC.green : i === current ? AC.green : AC.gray2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT, fontWeight: 800, fontSize: 12,
            color: i <= current ? '#fff' : AC.gray4,
            boxShadow: i === current ? `0 0 0 4px ${AC.blueBg}` : 'none',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: i === current ? 700 : 400, color: i <= current ? AC.green : AC.gray4, marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>
            {s}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function TabAnalyse() {
  const toast = useToast()
  const [opponents, setOpponents] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [view, setView] = useState('list') // 'list' | 'wizard'
  const [editId, setEditId] = useState(null)
  const [step, setStep] = useState(0)

  // Wizard state
  const [oppName,    setOppName]    = useState('')
  const [season,     setSeason]     = useState('2026')
  const [matchDate,  setMatchDate]  = useState('')
  const [btclUrl,    setBtclUrl]    = useState('')
  const [pcUrl,      setPcUrl]      = useState('')
  const [notes,      setNotes]      = useState('')
  const [batFile,    setBatFile]    = useState(null)
  const [bowlFile,   setBowlFile]   = useState(null)
  const [batRows,    setBatRows]    = useState([])
  const [bowlRows,   setBowlRows]   = useState([])
  const [batScored,  setBatScored]  = useState([])
  const [bowlScored, setBowlScored] = useState([])
  const [arScored,   setArScored]   = useState([])
  const [saving,     setSaving]     = useState(false)

  const batRef  = useRef()
  const bowlRef = useRef()

  useEffect(() => { loadOpponents() }, [])

  async function loadOpponents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('opponents')
      .select('*, opponent_players(count)')
      .order('created_at', { ascending: false })
    if (!error) {
      setOpponents((data || []).map(o => ({
        ...o,
        player_count: o.opponent_players?.[0]?.count ?? 0,
      })))
    }
    setLoading(false)
  }

  function resetWizard() {
    setOppName(''); setSeason('2026'); setMatchDate(''); setBtclUrl(''); setPcUrl(''); setNotes('')
    setBatFile(null); setBowlFile(null); setBatRows([]); setBowlRows([])
    setBatScored([]); setBowlScored([]); setArScored([])
    setStep(0); setEditId(null)
  }

  function openAdd() { resetWizard(); setView('wizard') }

  function openEdit(opp) {
    resetWizard()
    setEditId(opp.id)
    setOppName(opp.name); setSeason(opp.season || '2026')
    setMatchDate(opp.match_date || ''); setBtclUrl(opp.btcluk_profile_url || '')
    setPcUrl(opp.play_cricket_url || ''); setNotes(opp.notes || '')
    setView('wizard')
  }

  async function deleteOpponent(id) {
    const { error } = await supabase.from('opponents').delete().eq('id', id)
    if (error) { toast('Delete failed: ' + error.message); return }
    toast('Opponent deleted'); loadOpponents()
  }

  // ── Step 0: read Excel files ────────────────────────────────────────────
  function handleBatFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    setBatFile(f)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseBattingExcel(new Uint8Array(ev.target.result))
        setBatRows(rows)
        toast(`✅ Batting: ${rows.length} players parsed`)
      } catch (err) { toast('❌ Failed to parse batting file: ' + err.message) }
    }
    reader.readAsArrayBuffer(f)
  }

  function handleBowlFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    setBowlFile(f)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseBowlingExcel(new Uint8Array(ev.target.result))
        setBowlRows(rows)
        toast(`✅ Bowling: ${rows.length} players parsed`)
      } catch (err) { toast('❌ Failed to parse bowling file: ' + err.message) }
    }
    reader.readAsArrayBuffer(f)
  }

  // ── Step 2: compute scores ──────────────────────────────────────────────
  function computeScores() {
    const bat  = computeBattingScores(batRows)
    const bowl = computeBowlingScores(bowlRows)
    const ar   = computeAllrounderScores(bat, bowl)
    setBatScored(bat); setBowlScored(bowl); setArScored(ar)
    setStep(3)
    toast(`Scored: ${bat.slice(0,6).length} batters · ${bowl.slice(0,6).length} bowlers · ${ar.slice(0,6).length} all-rounders`)
  }

  // ── Step 3: save to DB ──────────────────────────────────────────────────
  async function saveAll() {
    if (!oppName.trim()) { toast('Opponent name is required'); return }
    setSaving(true)

    try {
      let oppId = editId

      // Upsert opponent row
      if (editId) {
        const { error } = await supabase.from('opponents').update({
          name: oppName.trim(), season, match_date: matchDate || null,
          btcluk_profile_url: btclUrl || null, play_cricket_url: pcUrl || null, notes: notes || null,
        }).eq('id', editId)
        if (error) throw error
        // If re-uploading stats, wipe and re-seed players
        if (batRows.length > 0 || bowlRows.length > 0) {
          await supabase.from('opponent_players').delete().eq('opponent_id', editId)
        }
      } else {
        const { data, error } = await supabase.from('opponents').insert({
          name: oppName.trim(), season, match_date: matchDate || null,
          btcluk_profile_url: btclUrl || null, play_cricket_url: pcUrl || null, notes: notes || null,
        }).select('id').single()
        if (error) throw error
        oppId = data.id
      }

      // Only seed stats if files were uploaded
      if (batRows.length > 0 || bowlRows.length > 0) {
        // Collect all unique player names
        const allNames = [...new Set([
          ...batRows.map(r => r.player_name),
          ...bowlRows.map(r => r.player_name),
        ])]

        // Insert players, get back IDs
        const { data: playerData, error: pErr } = await supabase
          .from('opponent_players')
          .insert(allNames.map(n => ({ opponent_id: oppId, player_name: n, role: 'unknown' })))
          .select('id, player_name')
        if (pErr) throw pErr

        const playerMap = Object.fromEntries(playerData.map(p => [p.player_name, p.id]))

        // Insert batting stats
        if (batRows.length > 0) {
          await supabase.from('opponent_batting_stats').delete().eq('opponent_id', oppId)
          const { error: bErr } = await supabase.from('opponent_batting_stats').insert(
            batRows.filter(r => playerMap[r.player_name]).map(r => ({
              opponent_id: oppId, player_id: playerMap[r.player_name],
              matches: Math.round(r.matches||0), innings: Math.round(r.innings||0), not_outs: Math.round(r.not_outs||0),
              runs: Math.round(r.runs||0), high_score: Math.round(r.high_score||0), high_score_not_out: r.high_score_not_out,
              avg: r.avg, strike_rate: r.strike_rate, fifties: Math.round(r.fifties||0), hundreds: Math.round(r.hundreds||0),
            }))
          )
          if (bErr) throw bErr
        }

        // Insert bowling stats — the bowling export has no matches column,
        // so fall back to the player's games count from the batting upload.
        if (bowlRows.length > 0) {
          const batMatches = Object.fromEntries(batRows.map(b => [b.player_name, Math.round(b.matches || 0)]))
          await supabase.from('opponent_bowling_stats').delete().eq('opponent_id', oppId)
          const { error: boErr } = await supabase.from('opponent_bowling_stats').insert(
            bowlRows.filter(r => playerMap[r.player_name]).map(r => ({
              opponent_id: oppId, player_id: playerMap[r.player_name],
              matches: Math.round(r.matches||0) || batMatches[r.player_name] || 0, overs: r.overs, maidens: Math.round(r.maidens||0),
              runs: Math.round(r.runs||0), wickets: Math.round(r.wickets||0), best_bowling: r.best_bowling,
              five_wkt_haul: Math.round(r.five_wkt_haul||0), economy_rate: r.economy_rate,
              strike_rate: r.strike_rate, average: r.average,
            }))
          )
          if (boErr) throw boErr
        }

        // Insert analysis (top 6 per category)
        await supabase.from('opponent_analysis').delete().eq('opponent_id', oppId)
        const analysisRows = [
          ...batScored.slice(0, 6).map((r, i) => ({
            opponent_id: oppId, player_id: playerMap[r.player_name],
            category: 'batting', rank: i + 1, composite_score: r.composite,
            tag: tagFromScore(r.composite, i + 1),
            summary: `${r.player_name} is ranked #${i+1} batter for this opponent. ${r.runs} runs at SR ${r.strike_rate}.`,
            strengths: JSON.stringify([`${r.runs} runs in ${r.innings} innings`, `SR ${r.strike_rate}`, r.hundreds > 0 ? `${r.hundreds} century/ies` : r.fifties > 0 ? `${r.fifties} fifty/ies` : 'Consistent contributor'].filter(Boolean)),
            weaknesses: JSON.stringify([r.avg > 60 ? 'Average may be inflated by not-outs' : 'Average suggests room to exploit', r.strike_rate < 90 ? 'Below-average strike rate — dot balls work' : 'Active scorer — needs containment']),
            flag: r.not_outs > r.innings * 0.5 ? '⚠️ Average inflated by not-outs' : null,
          })),
          ...bowlScored.slice(0, 6).map((r, i) => ({
            opponent_id: oppId, player_id: playerMap[r.player_name],
            category: 'bowling', rank: i + 1, composite_score: r.composite,
            tag: tagFromScore(r.composite, i + 1),
            summary: `${r.player_name} is ranked #${i+1} bowler. ${r.wickets} wickets at economy ${r.economy_rate}.`,
            strengths: JSON.stringify([`${r.wickets} wickets`, `Economy ${r.economy_rate}`, r.five_wkt_haul > 0 ? `${r.five_wkt_haul} five-wicket haul(s)` : null].filter(Boolean)),
            weaknesses: JSON.stringify([r.economy_rate > 5 ? 'Economy rate is attackable' : 'Economical — take time to settle in', r.average > 20 ? 'Average suggests batters score off him' : 'Dangerous average — respect required']),
            flag: r.five_wkt_haul > 0 ? '🏆 5-wicket haul' : r.overs < 15 ? '⚠️ Small sample' : null,
          })),
          ...arScored.slice(0, 6).map((r, i) => ({
            opponent_id: oppId, player_id: playerMap[r.player_name],
            category: 'allrounder', rank: i + 1, composite_score: r.composite,
            batting_score: r.bat_score, bowling_score: r.bowl_score,
            tag: tagFromScore(r.composite, i + 1),
            summary: `${r.player_name} is ranked #${i+1} all-rounder. Bat: ${r.bat_score} · Bowl: ${r.bowl_score}.`,
            strengths: JSON.stringify(['Contributes in both departments']),
            weaknesses: JSON.stringify([r.bat_score < r.bowl_score ? 'Batting is the weaker department' : 'Bowling is the weaker department']),
          })),
        ].filter(r => r.player_id)
        if (analysisRows.length > 0) {
          const { error: aErr } = await supabase.from('opponent_analysis').insert(analysisRows)
          if (aErr) throw aErr
        }
      }

      toast(editId ? '✅ Opponent updated!' : '✅ Opponent saved with full stats!')
      setView('list'); resetWizard(); loadOpponents()

    } catch (err) {
      toast('❌ Save failed: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // ── Render: list ─────────────────────────────────────────────────────────
  if (view === 'list') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 18, color: AC.dark }}>🔍 Opposition Scouting</div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: AC.gray4, marginTop: 2 }}>
            Add opponents, upload stats Excel files, and auto-generate scouting reports.
          </div>
        </div>
        <Btn onClick={openAdd}>+ Add Opponent</Btn>
      </div>

      {loading ? (
        <div style={{ fontFamily: FONT, color: AC.gray4, padding: 20, textAlign: 'center' }}>Loading…</div>
      ) : opponents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, border: `1.5px solid ${AC.gray2}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏏</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: AC.dark, marginBottom: 6 }}>No opponents yet</div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: AC.gray4, marginBottom: 16 }}>Add your first opponent to start building scouting reports.</div>
          <Btn onClick={openAdd}>+ Add First Opponent</Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {opponents.map(opp => (
            <OpponentCard
              key={opp.id}
              opp={opp}
              onEdit={() => openEdit(opp)}
              onDelete={() => deleteOpponent(opp.id)}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, padding: '12px 16px', background: '#f8fafc', border: `1px solid ${AC.gray2}`, borderRadius: 12, borderLeft: `3px solid ${AC.green}` }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 11, color: AC.green, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>📐 Excel columns (any order — matched by header name)</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: AC.gray5, lineHeight: 1.7 }}>
          Just upload the Play-Cricket export as-is — columns are read by their header titles, so the order doesn't matter.<br />
          <strong>Batting headers:</strong> Player, Games/Inns/Not Outs, Runs, High Score, Avg, Strike Rate, 50s, 100s<br />
          <strong>Bowling headers:</strong> Player, Overs, Maidens, Runs, Wickets, Best Bowling, 5 Wicket Haul, Economy Rate, Strike Rate, Average
        </div>
      </div>
    </div>
  )

  // ── Render: wizard ────────────────────────────────────────────────────────
  const STEPS = ['Details', 'Upload files', 'Compute scores', 'Review & Save']
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => { setView('list'); resetWizard() }}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: AC.gray5 }}>
          ← Back
        </button>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: AC.dark }}>
          {editId ? 'Edit Opponent' : 'Add New Opponent'}
        </div>
      </div>

      <Steps current={step} steps={STEPS} />

      {/* Step 0 — Details */}
      {step === 0 && (
        <Section title="Opponent Details">
          <Inp label="Opponent name" value={oppName} onChange={setOppName} placeholder="e.g. West 3 CC" required />
          <Inp label="Season" value={season} onChange={setSeason} placeholder="2026" />
          <Inp label="Match date" type="date" value={matchDate} onChange={setMatchDate} />
          <Inp label="BTCL profile URL" value={btclUrl} onChange={setBtclUrl} placeholder="https://btcluk.com/..." />
          <Inp label="Play-Cricket URL" value={pcUrl} onChange={setPcUrl} placeholder="https://play-cricket.com/..." />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontFamily: FONT, fontSize: 12, fontWeight: 700, color: AC.gray5, marginBottom: 5 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${AC.gray2}`, fontFamily: FONT, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <Btn onClick={() => { if (!oppName.trim()) { toast('Name is required'); return } setStep(1) }}>
            Next →
          </Btn>
        </Section>
      )}

      {/* Step 1 — Upload files */}
      {step === 1 && (
        <Section title="Upload Stats Files">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: AC.dark, marginBottom: 8 }}>🏏 Batting Stats (Excel)</div>
            <div style={{
              border: `2px dashed ${batFile ? AC.green : AC.gray2}`,
              borderRadius: 12, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
              background: batFile ? '#f0fdf4' : '#fafafa',
              transition: 'all 200ms ease',
            }}
              onClick={() => batRef.current?.click()}>
              <input ref={batRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleBatFile} />
              {batFile
                ? <div style={{ fontFamily: FONT, fontSize: 13, color: '#15803d', fontWeight: 700 }}>✅ {batFile.name} ({batRows.length} players)</div>
                : <div style={{ fontFamily: FONT, fontSize: 13, color: AC.gray4 }}>Click to upload batting.xlsx</div>}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: AC.dark, marginBottom: 8 }}>🎳 Bowling Stats (Excel)</div>
            <div style={{
              border: `2px dashed ${bowlFile ? AC.green : AC.gray2}`,
              borderRadius: 12, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
              background: bowlFile ? '#f0fdf4' : '#fafafa',
            }}
              onClick={() => bowlRef.current?.click()}>
              <input ref={bowlRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleBowlFile} />
              {bowlFile
                ? <div style={{ fontFamily: FONT, fontSize: 13, color: '#15803d', fontWeight: 700 }}>✅ {bowlFile.name} ({bowlRows.length} players)</div>
                : <div style={{ fontFamily: FONT, fontSize: 13, color: AC.gray4 }}>Click to upload bowling.xlsx</div>}
            </div>
          </div>

          {(batRows.length > 0 || bowlRows.length > 0) && (
            <div style={{ background: AC.blueBg, border: `1px solid #bfdbfe`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontFamily: FONT, fontSize: 12, color: AC.gray5 }}>
              Parsed: <strong>{batRows.length}</strong> batting rows, <strong>{bowlRows.length}</strong> bowling rows.
              {batRows.length > 0 && <span> Top batter: {batRows.sort((a,b)=>b.runs-a.runs)[0]?.player_name} ({batRows.sort((a,b)=>b.runs-a.runs)[0]?.runs} runs).</span>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
            <Btn onClick={() => setStep(2)} disabled={batRows.length === 0 && bowlRows.length === 0}>
              Next →
            </Btn>
            {editId && <Btn variant="ghost" onClick={() => setStep(3)}>Skip (keep existing stats)</Btn>}
          </div>
        </Section>
      )}

      {/* Step 2 — Preview & compute */}
      {step === 2 && (
        <Section title="Preview Parsed Data">
          {batRows.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: AC.dark, marginBottom: 8 }}>Top 5 Batters (by runs)</div>
              <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${AC.gray2}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
                  <thead><tr style={{ background: AC.greenDark }}>
                    {['Player','M','Inn','Runs','Avg','SR','50s','100s'].map(h => (
                      <th key={h} style={{ padding:'8px 10px', color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...batRows].sort((a,b)=>b.runs-a.runs).slice(0,5).map((r,i) => (
                      <tr key={i} style={{ background: i%2===0?'#fff':'#f8fafc' }}>
                        <td style={{ padding:'8px 10px', fontSize:12, color:AC.dark, fontWeight:600 }}>{r.player_name}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.matches}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.innings}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center', fontWeight:700, color:AC.green }}>{r.runs}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.avg}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.strike_rate}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.fifties}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.hundreds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bowlRows.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: AC.dark, marginBottom: 8 }}>Top 5 Bowlers (by wickets)</div>
              <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${AC.gray2}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
                  <thead><tr style={{ background: AC.greenDark }}>
                    {['Player','Overs','Wkts','Econ','Avg','Best'].map(h => (
                      <th key={h} style={{ padding:'8px 10px', color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...bowlRows].sort((a,b)=>b.wickets-a.wickets).slice(0,5).map((r,i) => (
                      <tr key={i} style={{ background: i%2===0?'#fff':'#f8fafc' }}>
                        <td style={{ padding:'8px 10px', fontSize:12, color:AC.dark, fontWeight:600 }}>{r.player_name}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.overs}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center', fontWeight:700, color:'#7c3aed' }}>{r.wickets}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.economy_rate}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.average}</td>
                        <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{r.best_bowling}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
            <Btn variant="gold" onClick={computeScores}>⚡ Compute Rankings & Analysis</Btn>
          </div>
        </Section>
      )}

      {/* Step 3 — Review & save */}
      {step === 3 && (
        <Section title="Review & Save">
          {batScored.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: AC.dark, marginBottom: 8 }}>🏏 Top 6 Batters (Composite Score)</div>
              {batScored.slice(0, 6).map((r, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background: i%2===0?'#f8fafc':'#fff', borderRadius:8, marginBottom:4, fontFamily:FONT, fontSize:13 }}>
                  <span><strong>#{i+1}</strong> {r.player_name}</span>
                  <span style={{ display:'flex', gap:10 }}>
                    <span style={{ color:AC.green, fontWeight:700 }}>Score: {r.composite}</span>
                    <span style={{
                      fontWeight:700, fontSize:11,
                      color: tagFromScore(r.composite,i+1)==='AVOID'?'#b91c1c':tagFromScore(r.composite,i+1)==='TARGET'?'#15803d':'#92400e'
                    }}>{tagFromScore(r.composite, i+1)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {bowlScored.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: AC.dark, marginBottom: 8 }}>🎳 Top 6 Bowlers (Composite Score)</div>
              {bowlScored.slice(0, 6).map((r, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background: i%2===0?'#f8fafc':'#fff', borderRadius:8, marginBottom:4, fontFamily:FONT, fontSize:13 }}>
                  <span><strong>#{i+1}</strong> {r.player_name}</span>
                  <span style={{ display:'flex', gap:10 }}>
                    <span style={{ color:'#7c3aed', fontWeight:700 }}>Score: {r.composite}</span>
                    <span style={{ fontWeight:700, fontSize:11, color: tagFromScore(r.composite,i+1)==='AVOID'?'#b91c1c':'#92400e' }}>{tagFromScore(r.composite,i+1)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {arScored.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: AC.dark, marginBottom: 8 }}>⚡ Top 6 All-rounders</div>
              {arScored.slice(0, 6).map((r, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background: i%2===0?'#f8fafc':'#fff', borderRadius:8, marginBottom:4, fontFamily:FONT, fontSize:13 }}>
                  <span><strong>#{i+1}</strong> {r.player_name}</span>
                  <span style={{ color:AC.green, fontWeight:700 }}>Bat: {r.bat_score} · Bowl: {r.bowl_score} · Overall: {r.composite}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:10, padding:'10px 14px', marginBottom:16, fontFamily:FONT, fontSize:12, color:'#92400e' }}>
            ⚠️ Scouting summaries are auto-generated from stats. You can edit them per player in the Analyse page after saving.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {batScored.length > 0 && <Btn variant="ghost" onClick={() => setStep(2)}>← Back</Btn>}
            <Btn loading={saving} onClick={saveAll} variant="gold">
              💾 Save to Database
            </Btn>
          </div>
        </Section>
      )}
    </div>
  )
}
