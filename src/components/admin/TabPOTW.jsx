import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Field, { Input, Textarea, Select } from '../ui/Field'
import { useToast } from '../Toast'

const PLAYERS = [
  'Gaajuran Ganagabalan', 'Prayash Singh', 'Gobinath Navaratnam', 'Roshan Thishanthan',
  'Mahadeva Amaranath', 'Abbi Kanthiraj', 'Ajanthan Navaratnam', 'Harriharan Aravinthan',
  'Theepan Rajah Rajasekaran', 'Sanjiv Balachandran', 'Namasevayam Vipooshanan',
  'Elankopan Thavalinkam', 'Raguvaran Aravinthan', 'Kajenth Thanabalasingham',
  'Muralitharan Guganeshan', 'Krishen Daniel', 'Eashwaran Aravinthan',
  'Hrithisshan Kanendran', 'Abdul Khaliq Hakeem', 'Shenal Daniel Anthony',
  'Thevakumar Kanagarathinam Anton', 'Malindu Maduranga', 'Arivu Sasikumar',
  'Dilesh Sangaran', 'Inthikhab Mazeez', 'Pathmajeyan Asokumar',
  'Mihin Sugeeswaran', 'Mohamed Nafaz', 'Raj Sorna',
]

const EMPTY_BATTER = { batter_name: '', batter_runs: '', batter_balls: '', batter_fours: '', batter_sixes: '', batter_message: '' }
const EMPTY_BOWLER = { bowler_name: '', bowler_wickets: '', bowler_overs: '', bowler_runs: '', bowler_economy: '', bowler_message: '' }

export default function TabPOTW() {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [matchDate, setMatchDate] = useState('')
  const [opponent, setOpponent] = useState('')
  const [batter, setBatter] = useState(EMPTY_BATTER)
  const [bowler, setBowler] = useState(EMPTY_BOWLER)
  const [existingId, setExistingId] = useState(null)

  useEffect(() => {
    supabase.from('player_of_week').select('*').order('id', { ascending: false }).limit(1)
      .then(({ data }) => {
        const row = data?.[0]
        if (row) {
          setExistingId(row.id)
          setMatchDate(row.match_date || '')
          setOpponent(row.opponent || '')
          setBatter({
            batter_name: row.batter_name || '',
            batter_runs: row.batter_runs ?? '',
            batter_balls: row.batter_balls ?? '',
            batter_fours: row.batter_fours ?? '',
            batter_sixes: row.batter_sixes ?? '',
            batter_message: row.batter_message || '',
          })
          setBowler({
            bowler_name: row.bowler_name || '',
            bowler_wickets: row.bowler_wickets ?? '',
            bowler_overs: row.bowler_overs ?? '',
            bowler_runs: row.bowler_runs ?? '',
            bowler_economy: row.bowler_economy ?? '',
            bowler_message: row.bowler_message || '',
          })
        }
        setLoading(false)
      })
  }, [])

  // Auto-calc economy when overs/runs change
  useEffect(() => {
    const ov = parseFloat(bowler.bowler_overs)
    const rn = parseInt(bowler.bowler_runs)
    if (ov > 0 && rn >= 0) {
      setBowler(b => ({ ...b, bowler_economy: (rn / ov).toFixed(2) }))
    }
  }, [bowler.bowler_overs, bowler.bowler_runs])

  async function save() {
    setSaving(true)
    const payload = {
      match_date: matchDate,
      opponent,
      batter_name: batter.batter_name || null,
      batter_runs: batter.batter_name ? (parseInt(batter.batter_runs) || null) : null,
      batter_balls: parseInt(batter.batter_balls) || null,
      batter_fours: parseInt(batter.batter_fours) || null,
      batter_sixes: parseInt(batter.batter_sixes) || null,
      batter_message: batter.batter_message || null,
      bowler_name: bowler.bowler_name || null,
      bowler_wickets: bowler.bowler_name ? (parseInt(bowler.bowler_wickets) || null) : null,
      bowler_overs: parseFloat(bowler.bowler_overs) || null,
      bowler_runs: parseInt(bowler.bowler_runs) || null,
      bowler_economy: parseFloat(bowler.bowler_economy) || null,
      bowler_message: bowler.bowler_message || null,
      updated_at: new Date().toISOString(),
    }

    let error
    if (existingId) {
      ;({ error } = await supabase.from('player_of_week').update(payload).eq('id', existingId))
    } else {
      const { data, error: e } = await supabase.from('player_of_week').insert(payload).select().single()
      error = e
      if (data) setExistingId(data.id)
    }

    if (error) toast(error.message || 'Save failed', 'error')
    else toast('Player of the Week saved! ✓')
    setSaving(false)
  }

  async function clear() {
    if (!existingId) return
    await supabase.from('player_of_week').delete().eq('id', existingId)
    setExistingId(null)
    setMatchDate(''); setOpponent('')
    setBatter(EMPTY_BATTER); setBowler(EMPTY_BOWLER)
    toast('Cleared — Player of the Week hidden from site')
  }

  if (loading) return <div style={{ color: C.gray3, fontFamily: FONT, fontSize: 14, padding: '20px 0' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Info banner */}
      <div style={{ background: 'linear-gradient(135deg,#0f3825,#1a5c38)', borderRadius: 14, padding: '14px 18px' }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: '#fff' }}>🏆 Player of the Week</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 3 }}>
          Set after each match. Shown on the Home page and Stats page. Leave batter or bowler blank to hide that card.
        </div>
      </div>

      {/* Match info */}
      <Card>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.dark, marginBottom: 14 }}>Match Info</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Match Date">
            <Input placeholder="31 May 2026" value={matchDate} onChange={e => setMatchDate(e.target.value)} />
          </Field>
          <Field label="Opponent">
            <Input placeholder="Lewisham CC" value={opponent} onChange={e => setOpponent(e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Best Batter */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>🏏</span>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.dark }}>Best Batter</div>
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray3 }}>(50+ runs)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Player">
            <Select value={batter.batter_name} onChange={e => setBatter(b => ({ ...b, batter_name: e.target.value }))}>
              <option value="">— None —</option>
              {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <Field label="Runs">
              <Input type="number" placeholder="79" value={batter.batter_runs} onChange={e => setBatter(b => ({ ...b, batter_runs: e.target.value }))} />
            </Field>
            <Field label="Balls">
              <Input type="number" placeholder="85" value={batter.batter_balls} onChange={e => setBatter(b => ({ ...b, batter_balls: e.target.value }))} />
            </Field>
            <Field label="4s">
              <Input type="number" placeholder="8" value={batter.batter_fours} onChange={e => setBatter(b => ({ ...b, batter_fours: e.target.value }))} />
            </Field>
            <Field label="6s">
              <Input type="number" placeholder="2" value={batter.batter_sixes} onChange={e => setBatter(b => ({ ...b, batter_sixes: e.target.value }))} />
            </Field>
          </div>
          <Field label="Congrats Message" hint="Leave blank for auto-generated message">
            <Textarea placeholder="Brilliant innings from…" value={batter.batter_message} onChange={e => setBatter(b => ({ ...b, batter_message: e.target.value }))} />
          </Field>
        </div>
      </Card>

      {/* Best Bowler */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.dark }}>Best Bowler</div>
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray3 }}>(3+ wickets)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Player">
            <Select value={bowler.bowler_name} onChange={e => setBowler(b => ({ ...b, bowler_name: e.target.value }))}>
              <option value="">— None —</option>
              {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <Field label="Wickets">
              <Input type="number" placeholder="4" value={bowler.bowler_wickets} onChange={e => setBowler(b => ({ ...b, bowler_wickets: e.target.value }))} />
            </Field>
            <Field label="Overs">
              <Input type="number" step="0.1" placeholder="8.0" value={bowler.bowler_overs} onChange={e => setBowler(b => ({ ...b, bowler_overs: e.target.value }))} />
            </Field>
            <Field label="Runs Given">
              <Input type="number" placeholder="32" value={bowler.bowler_runs} onChange={e => setBowler(b => ({ ...b, bowler_runs: e.target.value }))} />
            </Field>
            <Field label="Economy">
              <Input type="number" step="0.01" placeholder="4.00" value={bowler.bowler_economy} onChange={e => setBowler(b => ({ ...b, bowler_economy: e.target.value }))} />
            </Field>
          </div>
          <Field label="Congrats Message" hint="Leave blank for auto-generated message">
            <Textarea placeholder="Superb spell from…" value={bowler.bowler_message} onChange={e => setBowler(b => ({ ...b, bowler_message: e.target.value }))} />
          </Field>
        </div>
      </Card>

      <Button size="full" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : '💾 Save Player of the Week'}
      </Button>

      {existingId && (
        <button
          onClick={clear}
          style={{ background: 'none', border: `1px solid ${C.gray2}`, borderRadius: 10, padding: '10px', fontFamily: FONT, fontSize: 13, color: C.gray3, cursor: 'pointer' }}
        >
          🗑 Clear & Hide Player of the Week
        </button>
      )}
    </div>
  )
}
