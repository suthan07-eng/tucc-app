import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
import Button from '../ui/Button'
import Field, { Select } from '../ui/Field'
import { useToast } from '../Toast'

function fmtMatchLabel(m) {
  const d = m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'
  return `vs ${m.opponent || 'TBC'} — ${d}`
}

function num(v) { return v === '' || v == null ? null : Number(v) }

const PERF_EMPTY = {
  bat_did_bat: false, bat_runs: '', bat_balls: '', bat_not_out: false,
  bat_fours: '', bat_sixes: '',
  bowl_did_bowl: false, bowl_overs: '', bowl_maidens: '', bowl_wickets: '', bowl_runs: '',
  field_catches: '', field_run_outs: '', field_stumpings: '',
}

export default function TabStatsMatch() {
  const toast = useToast()
  const [matches, setMatches]   = useState([])
  const [players, setPlayers]   = useState([])
  const [matchId, setMatchId]   = useState('')
  const [perfs, setPerfs]       = useState({})   // { [playerId]: perfRow }
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    Promise.all([
      supabase.from('matches').select('id,opponent,date,season').order('date', { ascending: false }),
      supabase.from('players').select('id,name,role').order('name'),
    ]).then(([{ data: ms }, { data: ps }]) => {
      setMatches(ms || [])
      setPlayers(ps || [])
      const first = ms?.[0]?.id || ''
      setMatchId(first)
      if (first) loadPerfs(first, ps || [])
      else setLoading(false)
    })
  }, [])

  async function loadPerfs(mid, playerList) {
    setLoading(true)
    const { data } = await supabase.from('match_performances').select('*').eq('match_id', mid)
    const map = {}
    const list = playerList || players
    list.forEach((p) => {
      const existing = data?.find((d) => d.player_id === p.id)
      map[p.id] = existing
        ? {
            bat_did_bat:      existing.bat_did_bat  || false,
            bat_runs:         existing.bat_runs      ?? '',
            bat_balls:        existing.bat_balls     ?? '',
            bat_not_out:      existing.bat_not_out   || false,
            bat_fours:        existing.bat_fours     ?? '',
            bat_sixes:        existing.bat_sixes     ?? '',
            bowl_did_bowl:    existing.bowl_did_bowl || false,
            bowl_overs:       existing.bowl_overs    ?? '',
            bowl_maidens:     existing.bowl_maidens  ?? '',
            bowl_wickets:     existing.bowl_wickets  ?? '',
            bowl_runs:        existing.bowl_runs     ?? '',
            field_catches:    existing.field_catches    ?? '',
            field_run_outs:   existing.field_run_outs   ?? '',
            field_stumpings:  existing.field_stumpings  ?? '',
          }
        : { ...PERF_EMPTY }
    })
    setPerfs(map)
    setLoading(false)
  }

  function handleMatchChange(e) {
    const mid = e.target.value
    setMatchId(mid)
    setExpanded({})
    loadPerfs(mid, players)
  }

  function setField(playerId, key, value) {
    setPerfs((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [key]: value },
    }))
  }

  function toggleExpand(playerId) {
    setExpanded((prev) => ({ ...prev, [playerId]: !prev[playerId] }))
  }

  async function saveAll() {
    if (!matchId) { toast('Select a match first', 'error'); return }
    setSaving(true)
    const match = matches.find((m) => m.id === matchId)
    const season = match?.season || String(new Date().getFullYear())

    const rows = players
      .filter((p) => {
        const f = perfs[p.id]
        return f && (f.bat_did_bat || f.bowl_did_bowl ||
          num(f.field_catches) || num(f.field_run_outs) || num(f.field_stumpings))
      })
      .map((p) => {
        const f = perfs[p.id]
        return {
          match_id:        matchId,
          player_id:       p.id,
          player_name:     p.name,
          season,
          bat_did_bat:     f.bat_did_bat || false,
          bat_runs:        f.bat_did_bat ? num(f.bat_runs)    : null,
          bat_balls:       f.bat_did_bat ? num(f.bat_balls)   : null,
          bat_not_out:     f.bat_did_bat ? (f.bat_not_out || false) : false,
          bat_fours:       f.bat_did_bat ? num(f.bat_fours)   : null,
          bat_sixes:       f.bat_did_bat ? num(f.bat_sixes)   : null,
          bowl_did_bowl:   f.bowl_did_bowl || false,
          bowl_overs:      f.bowl_did_bowl ? num(f.bowl_overs)   : null,
          bowl_maidens:    f.bowl_did_bowl ? num(f.bowl_maidens) : null,
          bowl_wickets:    f.bowl_did_bowl ? num(f.bowl_wickets) : null,
          bowl_runs:       f.bowl_did_bowl ? num(f.bowl_runs)    : null,
          field_catches:   num(f.field_catches)    || null,
          field_run_outs:  num(f.field_run_outs)   || null,
          field_stumpings: num(f.field_stumpings)  || null,
          updated_at:      new Date().toISOString(),
        }
      })

    if (!rows.length) {
      toast('No performances to save — tick "Batted" or "Bowled" for each player', 'error')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('match_performances')
      .upsert(rows, { onConflict: 'match_id,player_id' })

    if (error) {
      toast(error.message || 'Save failed', 'error')
    } else {
      toast(`Saved ${rows.length} performances ✓`)
      loadPerfs(matchId, players)
    }
    setSaving(false)
  }

  const n = { type: 'number', min: '0', style: { padding: '6px 8px', fontSize: 13, width: '100%', border: `1px solid ${C.gray2}`, borderRadius: 8, fontFamily: FONT } }
  const match = matches.find((m) => m.id === matchId)

  if (loading) return <div style={{ color: C.gray3, fontFamily: FONT, fontSize: 14, padding: '20px 0' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Match selector */}
      <Field label="Match">
        <Select value={matchId} onChange={handleMatchChange}>
          <option value="">— Select match —</option>
          {matches.map((m) => <option key={m.id} value={m.id}>{fmtMatchLabel(m)}</option>)}
        </Select>
      </Field>

      {match && (
        <div style={{ fontFamily: FONT, fontSize: 12, color: C.gray3, marginTop: -4 }}>
          Season: {match.season || '—'} · Enter batting and/or bowling for each player who participated.
        </div>
      )}

      {/* Player rows */}
      {matchId && players.map((p) => {
        const f = perfs[p.id] || PERF_EMPTY
        const isOpen = expanded[p.id]
        const hasBatted = f.bat_did_bat
        const hasBowled = f.bowl_did_bowl
        const hasField  = num(f.field_catches) || num(f.field_run_outs) || num(f.field_stumpings)
        const hasAny    = hasBatted || hasBowled || hasField

        return (
          <div
            key={p.id}
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1.5px solid ${hasAny ? C.green : C.gray2}`,
              overflow: 'hidden',
            }}
          >
            {/* Header row */}
            <button
              onClick={() => toggleExpand(p.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: C.dark }}>{p.name}</div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray3, marginTop: 2 }}>
                  {p.role}
                  {hasBatted  && ` · 🏏 ${f.bat_runs ?? 0}${f.bat_not_out ? '*' : ''}`}
                  {hasBowled  && ` · ⚡ ${f.bowl_wickets ?? 0}/${f.bowl_runs ?? 0}`}
                  {hasField   && ` · 🧤 ${num(f.field_catches) || 0}c`}
                </div>
              </div>
              <span style={{ color: C.gray3, fontSize: 18, lineHeight: 1 }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Expanded form */}
            {isOpen && (
              <div style={{ padding: '0 14px 16px', borderTop: `1px solid ${C.gray1}` }}>

                {/* Batting */}
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
                    <input
                      type="checkbox"
                      checked={f.bat_did_bat}
                      onChange={(e) => setField(p.id, 'bat_did_bat', e.target.checked)}
                    />
                    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.greenDark }}>🏏 Batted</span>
                  </label>
                  {f.bat_did_bat && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                      <SmallField label="Runs"><input {...n} value={f.bat_runs} onChange={(e) => setField(p.id, 'bat_runs', e.target.value)} /></SmallField>
                      <SmallField label="Balls"><input {...n} value={f.bat_balls} onChange={(e) => setField(p.id, 'bat_balls', e.target.value)} /></SmallField>
                      <SmallField label="Not Out">
                        <div style={{ paddingTop: 6 }}>
                          <input type="checkbox" checked={f.bat_not_out} onChange={(e) => setField(p.id, 'bat_not_out', e.target.checked)} />
                        </div>
                      </SmallField>
                      <SmallField label="4s"><input {...n} value={f.bat_fours} onChange={(e) => setField(p.id, 'bat_fours', e.target.value)} /></SmallField>
                      <SmallField label="6s"><input {...n} value={f.bat_sixes} onChange={(e) => setField(p.id, 'bat_sixes', e.target.value)} /></SmallField>
                    </div>
                  )}
                </div>

                {/* Bowling */}
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
                    <input
                      type="checkbox"
                      checked={f.bowl_did_bowl}
                      onChange={(e) => setField(p.id, 'bowl_did_bowl', e.target.checked)}
                    />
                    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.greenDark }}>⚡ Bowled</span>
                  </label>
                  {f.bowl_did_bowl && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                      <SmallField label="Overs"><input {...n} step="0.1" value={f.bowl_overs} onChange={(e) => setField(p.id, 'bowl_overs', e.target.value)} /></SmallField>
                      <SmallField label="Wickets"><input {...n} value={f.bowl_wickets} onChange={(e) => setField(p.id, 'bowl_wickets', e.target.value)} /></SmallField>
                      <SmallField label="Runs Given"><input {...n} value={f.bowl_runs} onChange={(e) => setField(p.id, 'bowl_runs', e.target.value)} /></SmallField>
                      <SmallField label="Maidens"><input {...n} value={f.bowl_maidens} onChange={(e) => setField(p.id, 'bowl_maidens', e.target.value)} /></SmallField>
                    </div>
                  )}
                </div>

                {/* Fielding */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.greenDark, marginBottom: 10 }}>🧤 Fielding</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    <SmallField label="Catches"><input {...n} value={f.field_catches} onChange={(e) => setField(p.id, 'field_catches', e.target.value)} /></SmallField>
                    <SmallField label="Run Outs"><input {...n} value={f.field_run_outs} onChange={(e) => setField(p.id, 'field_run_outs', e.target.value)} /></SmallField>
                    <SmallField label="Stumpings"><input {...n} value={f.field_stumpings} onChange={(e) => setField(p.id, 'field_stumpings', e.target.value)} /></SmallField>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {matchId && (
        <button
          onClick={saveAll}
          disabled={saving}
          style={{
            background: saving ? C.gray2 : C.green,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 15,
            cursor: saving ? 'default' : 'pointer',
            marginTop: 4,
          }}
        >
          {saving ? 'Saving…' : '💾 Save All Performances'}
        </button>
      )}
    </div>
  )
}

function SmallField({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray4, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}
