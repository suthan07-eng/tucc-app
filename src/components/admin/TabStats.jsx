import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Field, { Input, Select } from '../ui/Field'
import { useToast } from '../Toast'
import TabStatsMatch from './TabStatsMatch'

const CURRENT_YEAR = new Date().getFullYear()
const SEASONS = Array.from({ length: 6 }, (_, i) => String(CURRENT_YEAR - i))

const EMPTY = {
  bat_matches: '', bat_innings: '', bat_runs: '', bat_highest: '',
  bat_highest_not_out: false, bat_strike_rate: '', bat_fifties: '',
  bat_hundreds: '', bat_ducks: '', bat_fours: '', bat_sixes: '',
  bowl_matches: '', bowl_overs: '', bowl_wickets: '', bowl_runs: '',
  bowl_best: '', // UI only — "W/R" string, parsed to bowl_best_wickets + bowl_best_runs
  bowl_five_fers: '',
  field_catches: '', field_run_outs: '', field_stumpings: '',
}

function num(v) { return v === '' || v == null ? null : Number(v) }

// Parse "3/12" → { w: 3, r: 12 }
function parseBest(s) {
  const str = String(s || '').trim()
  if (!str) return { w: null, r: null }
  const parts = str.split('/')
  const w = parseInt(parts[0]) || null
  const r = parseInt(parts[1]) || null
  return { w, r }
}

function CalcHint({ label, value }) {
  if (value == null) return null
  return <span style={{ marginLeft: 8, color: C.gray3, fontFamily: FONT, fontSize: 11 }}>= {label}: <strong>{value}</strong></span>
}

export default function TabStats() {
  const toast = useToast()
  const [players, setPlayers] = useState([])
  const [statsList, setStatsList] = useState([])
  const [season, setSeason] = useState(String(CURRENT_YEAR))
  const [playerId, setPlayerId] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('players').select('id,name,role').order('name').then(({ data }) => {
      setPlayers(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { loadStats() }, [season])

  async function loadStats() {
    const { data } = await supabase
      .from('player_stats')
      .select('*')
      .eq('season', season)
      .order('updated_at', { ascending: false })
    setStatsList(data || [])
  }

  function set(key) {
    return (e) => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [key]: val }))
    }
  }

  function calcBatAvg() {
    const inn = Number(form.bat_innings) || 0
    const runs = Number(form.bat_runs) || 0
    const no = form.bat_highest_not_out ? 1 : 0
    const denom = inn - no
    if (!inn || denom <= 0) return null
    return (runs / denom).toFixed(2)
  }

  function calcBowlAvg() {
    const wkts = Number(form.bowl_wickets) || 0
    const runs = Number(form.bowl_runs) || 0
    if (!wkts) return null
    return (runs / wkts).toFixed(2)
  }

  function calcEconomy() {
    const overs = Number(form.bowl_overs) || 0
    const runs = Number(form.bowl_runs) || 0
    if (!overs) return null
    return (runs / overs).toFixed(2)
  }

  function calcBowlSR() {
    const overs = Number(form.bowl_overs) || 0
    const wkts = Number(form.bowl_wickets) || 0
    if (!wkts) return null
    return ((overs * 6) / wkts).toFixed(1)
  }

  async function handleSave() {
    if (!playerId) { toast('Select a player first', 'error'); return }
    setSaving(true)

    const { w: bw, r: br } = parseBest(form.bowl_best)
    const batAvg  = calcBatAvg()
    const bowlAvg = calcBowlAvg()
    const econ    = calcEconomy()
    const bowlSR  = calcBowlSR()

    const playerName = players.find((p) => p.id === playerId)?.name || ''

    const payload = {
      player_id:            playerId,
      player_name:          playerName,
      season,
      bat_matches:          num(form.bat_matches),
      bat_innings:          num(form.bat_innings),
      bat_runs:             num(form.bat_runs),
      bat_highest:          num(form.bat_highest),
      bat_highest_not_out:  form.bat_highest_not_out || false,
      bat_average:          batAvg  ? parseFloat(batAvg)  : null,
      bat_strike_rate:      num(form.bat_strike_rate),
      bat_fifties:          num(form.bat_fifties),
      bat_hundreds:         num(form.bat_hundreds),
      bat_ducks:            num(form.bat_ducks),
      bat_fours:            num(form.bat_fours),
      bat_sixes:            num(form.bat_sixes),
      bowl_matches:         num(form.bowl_matches),
      bowl_overs:           num(form.bowl_overs),
      bowl_wickets:         num(form.bowl_wickets),
      bowl_runs:            num(form.bowl_runs),
      bowl_best_wickets:    bw,
      bowl_best_runs:       br,
      bowl_average:         bowlAvg ? parseFloat(bowlAvg) : null,
      bowl_economy:         econ    ? parseFloat(econ)    : null,
      bowl_strike_rate:     bowlSR  ? parseFloat(bowlSR)  : null,
      bowl_five_fers:       num(form.bowl_five_fers),
      field_catches:        num(form.field_catches),
      field_run_outs:       num(form.field_run_outs),
      field_stumpings:      num(form.field_stumpings),
      updated_by:           'Admin',
    }

    const { error } = await supabase
      .from('player_stats')
      .upsert(payload, { onConflict: 'player_id,season' })

    if (error) {
      toast(error.message || 'Save failed', 'error')
    } else {
      toast('Stats saved! ✓')
      loadStats()
      clearForm()
    }
    setSaving(false)
  }

  function clearForm() {
    setPlayerId('')
    setForm(EMPTY)
    setEditingId(null)
  }

  function startEdit(row) {
    setPlayerId(row.player_id)
    setEditingId(row.id)
    const best = (row.bowl_best_wickets != null && row.bowl_best_runs != null)
      ? `${row.bowl_best_wickets}/${row.bowl_best_runs}`
      : (row.bowl_best_wickets != null ? String(row.bowl_best_wickets) : '')
    setForm({
      bat_matches:         row.bat_matches         ?? '',
      bat_innings:         row.bat_innings         ?? '',
      bat_runs:            row.bat_runs            ?? '',
      bat_highest:         row.bat_highest         ?? '',
      bat_highest_not_out: row.bat_highest_not_out || false,
      bat_strike_rate:     row.bat_strike_rate     ?? '',
      bat_fifties:         row.bat_fifties         ?? '',
      bat_hundreds:        row.bat_hundreds        ?? '',
      bat_ducks:           row.bat_ducks           ?? '',
      bat_fours:           row.bat_fours           ?? '',
      bat_sixes:           row.bat_sixes           ?? '',
      bowl_matches:        row.bowl_matches        ?? '',
      bowl_overs:          row.bowl_overs          ?? '',
      bowl_wickets:        row.bowl_wickets        ?? '',
      bowl_runs:           row.bowl_runs           ?? '',
      bowl_best:           best,
      bowl_five_fers:      row.bowl_five_fers      ?? '',
      field_catches:       row.field_catches       ?? '',
      field_run_outs:      row.field_run_outs      ?? '',
      field_stumpings:     row.field_stumpings     ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const n = { type: 'number', min: '0' }
  const [subTab, setSubTab] = useState('season')

  if (loading) return <div style={{ color: C.gray3, fontFamily: FONT, fontSize: 14, padding: '20px 0' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: 0, background: C.gray1, borderRadius: 10, padding: 3 }}>
        {[
          { id: 'season', label: '📊 Season Totals' },
          { id: 'match',  label: '🏏 Match Scorecards' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              flex: 1, padding: '9px 0', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontFamily: FONT,
              fontSize: 13, fontWeight: subTab === t.id ? 700 : 400,
              background: subTab === t.id ? C.white : 'transparent',
              color: subTab === t.id ? C.green : C.gray4,
              boxShadow: subTab === t.id ? '0 1px 6px rgba(0,0,0,.08)' : 'none',
              transition: 'background .15s, color .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'match' && <TabStatsMatch />}
      {subTab === 'season' && <>
      <Card>
        <div style={{ fontFamily: FONT, fontWeight: 700, color: C.dark, fontSize: 15, marginBottom: 14 }}>
          {editingId ? '✏️ Edit Player Stats' : '➕ Enter Player Stats'}
        </div>

        {/* Season + player */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <Field label="Season">
            <Select value={season} onChange={(e) => setSeason(e.target.value)}>
              {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Player">
            <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              <option value="">— Select player —</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.role ? ` (${p.role})` : ''}</option>
              ))}
            </Select>
          </Field>
        </div>

        {/* BATTING */}
        <SectionHeader>🏏 Batting</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
          <Field label="Matches"><Input {...n} value={form.bat_matches} onChange={set('bat_matches')} /></Field>
          <Field label="Innings"><Input {...n} value={form.bat_innings} onChange={set('bat_innings')} /></Field>
          <Field label="Runs"><Input {...n} value={form.bat_runs} onChange={set('bat_runs')} /></Field>
          <Field label="Highest Score">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input {...n} placeholder="45" value={form.bat_highest} onChange={set('bat_highest')} style={{ flex: 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 12, color: C.gray5, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={form.bat_highest_not_out} onChange={set('bat_highest_not_out')} />
                not out
              </label>
            </div>
          </Field>
          <Field label="Strike Rate"><Input {...n} value={form.bat_strike_rate} onChange={set('bat_strike_rate')} /></Field>
          <Field label={<>Avg <CalcHint label="calc" value={calcBatAvg()} /></>}>
            <Input disabled value={calcBatAvg() ?? ''} style={{ background: '#f9fafb', color: C.gray4 }} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
          <Field label="50s"><Input {...n} value={form.bat_fifties} onChange={set('bat_fifties')} /></Field>
          <Field label="100s"><Input {...n} value={form.bat_hundreds} onChange={set('bat_hundreds')} /></Field>
          <Field label="Ducks"><Input {...n} value={form.bat_ducks} onChange={set('bat_ducks')} /></Field>
          <Field label="4s"><Input {...n} value={form.bat_fours} onChange={set('bat_fours')} /></Field>
          <Field label="6s"><Input {...n} value={form.bat_sixes} onChange={set('bat_sixes')} /></Field>
        </div>

        {/* BOWLING */}
        <SectionHeader>⚡ Bowling</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
          <Field label="Matches"><Input {...n} value={form.bowl_matches} onChange={set('bowl_matches')} /></Field>
          <Field label="Overs"><Input {...n} value={form.bowl_overs} onChange={set('bowl_overs')} /></Field>
          <Field label="Wickets"><Input {...n} value={form.bowl_wickets} onChange={set('bowl_wickets')} /></Field>
          <Field label={<>Runs Conceded <CalcHint label="Econ" value={calcEconomy()} /></>}>
            <Input {...n} value={form.bowl_runs} onChange={set('bowl_runs')} />
          </Field>
          <Field label={<>Bowl Avg <CalcHint label="calc" value={calcBowlAvg()} /></>}>
            <Input disabled value={calcBowlAvg() ?? ''} style={{ background: '#f9fafb', color: C.gray4 }} />
          </Field>
          <Field label={<>Bowl SR <CalcHint label="calc" value={calcBowlSR()} /></>}>
            <Input disabled value={calcBowlSR() ?? ''} style={{ background: '#f9fafb', color: C.gray4 }} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
          <Field label="Best Figures" hint='e.g. "3/12"'>
            <Input placeholder="3/12" value={form.bowl_best} onChange={set('bowl_best')} />
          </Field>
          <Field label="5-Wicket Hauls"><Input {...n} value={form.bowl_five_fers} onChange={set('bowl_five_fers')} /></Field>
        </div>

        {/* FIELDING */}
        <SectionHeader>🧤 Fielding</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
          <Field label="Catches"><Input {...n} value={form.field_catches} onChange={set('field_catches')} /></Field>
          <Field label="Run Outs"><Input {...n} value={form.field_run_outs} onChange={set('field_run_outs')} /></Field>
          <Field label="Stumpings"><Input {...n} value={form.field_stumpings} onChange={set('field_stumpings')} /></Field>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button size="full" onClick={handleSave} disabled={saving || !playerId}>
            {saving ? 'Saving…' : editingId ? '💾 Update Stats' : '💾 Save Stats'}
          </Button>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={clearForm} style={{ flexShrink: 0 }}>
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* Stats list */}
      <div style={{ fontFamily: FONT, fontWeight: 700, color: C.dark, fontSize: 14, marginTop: 4 }}>
        {season} Season — {statsList.length} player{statsList.length !== 1 ? 's' : ''} entered
      </div>
      {statsList.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px 0', color: C.gray3, fontFamily: FONT, fontSize: 14 }}>
            No stats entered for {season} yet.
          </div>
        </Card>
      ) : (
        statsList.map((row) => {
          const name = players.find((p) => p.id === row.player_id)?.name || '—'
          const role = players.find((p) => p.id === row.player_id)?.role || ''
          const best = (row.bowl_best_wickets != null && row.bowl_best_runs != null)
            ? `${row.bowl_best_wickets}/${row.bowl_best_runs}`
            : null
          return (
            <Card key={row.id} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.dark }}>{name}</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: C.gray3, marginTop: 2 }}>{role}</div>
                </div>
                <Button size="sm" variant="subtle" onClick={() => startEdit(row)}>✏️ Edit</Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
                {row.bat_runs      != null && <StatChip label="Runs"     value={row.bat_runs} />}
                {row.bat_average   != null && <StatChip label="Bat Avg"  value={parseFloat(row.bat_average).toFixed(2)} />}
                {row.bat_highest   != null && <StatChip label="HS"       value={`${row.bat_highest}${row.bat_highest_not_out ? '*' : ''}`} />}
                {row.bowl_wickets  != null && <StatChip label="Wkts"     value={row.bowl_wickets} />}
                {row.bowl_average  != null && <StatChip label="Bowl Avg" value={parseFloat(row.bowl_average).toFixed(2)} />}
                {best              != null && <StatChip label="Best"     value={best} />}
                {(row.field_catches != null || row.field_run_outs != null) && (
                  <StatChip label="Field" value={`${row.field_catches || 0}c ${row.field_run_outs || 0}ro`} />
                )}
              </div>
            </Card>
          )
        })
      )}
      </>}
    </div>
  )
}

function SectionHeader({ children }) {
  return (
    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.greenDark, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.gray2}` }}>
      {children}
    </div>
  )
}

function StatChip({ label, value }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: 12, color: C.gray5 }}>
      <span style={{ color: C.gray3 }}>{label}: </span>
      <strong>{value}</strong>
    </div>
  )
}
