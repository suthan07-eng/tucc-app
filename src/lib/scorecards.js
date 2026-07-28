// Client-side scorecard aggregation. After a scorecard is uploaded/parsed and
// saved to `match_results`, we recompute the whole season from ALL match_results
// rows -> player_stats (season totals) + auto Player of the Week. Idempotent:
// player_stats for the season is fully replaced each time.
//
// Players are keyed by their scorecard-printed name (same source as the BTCL
// squad names, so they line up on the Players page). We also stamp the BTCL
// PlayerID where the name matches the team roster, giving an exact id link.

import { supabase } from '../supabase'
import { computeTuccScore } from './tuccScore'

const BTCL_ROSTER_URL = 'https://admin.btcluk.com/api/teamPlayer/286253'
const DISPLAY_OVERRIDE = { 2233: 'Ajanthan Navaratnam', 4927: 'Krishen Daniel', 6296: 'Shenal Daniel Anthony' }

const norm = (n) => (n || '').replace(/[*†]/g, '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()
const toks = (n) => new Set(norm(n).split(' ').filter(Boolean))
const clean = (n) => (n || '').replace(/[*†]/g, '').replace(/\s+/g, ' ').trim()
const dedup = (n) => { // collapse consecutive duplicate tokens ("Anton Anton" -> "Anton")
  const out = []
  for (const w of clean(n).split(' ')) if (!out.length || out[out.length - 1].toLowerCase() !== w.toLowerCase()) out.push(w)
  return out.join(' ')
}
const title = (s) => s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

const oversToBalls = (o) => { const f = parseFloat(o) || 0; const w = Math.floor(f); return w * 6 + Math.round((f - w) * 10) }
const ballsToOvers = (b) => `${Math.floor(b / 6)}.${b % 6}`
const r2 = (x) => Math.round(x * 100) / 100

async function loadRoster() {
  try {
    const r = await fetch(BTCL_ROSTER_URL, { headers: { Accept: 'application/json' } })
    if (!r.ok) return []
    const raw = await r.json()
    return (raw || []).map((p) => ({
      id: p.PlayerID,
      display: title(DISPLAY_OVERRIDE[p.PlayerID] || `${p.Forename} ${p.Surname}`),
      batStyle: p.BatStyle || '', bowlStyle: p.BowlStyle || '',
    }))
  } catch { return [] }
}

// Recompute the cached TUCC performance scores (tucc_player_scores.score) from
// the fresh player_stats rows, using the SAME formula the Players page uses, so
// the public pages never drift from the portal.
async function syncCachedScores(rows, roster) {
  const styleById = {}
  for (const r of roster) styleById[r.id] = { batStyle: r.batStyle, bowlStyle: r.bowlStyle }
  const updates = rows.filter((r) => r.btcl_player_id != null).map((r) => {
    const bat = (r.bat_innings || r.bat_runs)
      ? { runs: r.bat_runs, strike_rate: r.bat_strike_rate, average: r.bat_average, fifties: r.bat_fifties, hundreds: r.bat_hundreds, innings: r.bat_innings, matches: r.bat_matches }
      : null
    const bowl = (r.bowl_matches || r.bowl_overs)
      ? { wickets: r.bowl_wickets, economy: r.bowl_economy, average: r.bowl_average, five_fers: r.bowl_five_fers, overs: r.bowl_overs, matches: r.bowl_matches }
      : null
    const matches = r.bat_matches || r.bowl_matches || 0
    const { score } = computeTuccScore(bat, bowl, styleById[r.btcl_player_id] || {}, matches)
    return { id: r.btcl_player_id, score }
  })
  await Promise.all(updates.map((u) =>
    supabase.from('tucc_player_scores').update({ score: u.score }).eq('btcl_player_id', u.id)
  ))
}

function makeRosterMatcher(roster) {
  return (name) => {
    const t = toks(name)
    if (!t.size) return null
    let best = null, bs = 0
    for (const p of roster) {
      const pt = toks(p.display)
      const inter = [...t].filter((x) => pt.has(x))
      const subset = [...t].every((x) => pt.has(x)) || [...pt].every((x) => t.has(x))
      if (subset && (inter.length >= 2 || (t.size === 1 && pt.size === 1)) && inter.length > bs) { bs = inter.length; best = p }
    }
    return best
  }
}

// Aggregate all match_results -> array of player_stats rows (keyed by scorecard name)
export function aggregate(matchResults, roster = []) {
  const matchRoster = makeRosterMatcher(roster)
  const NAME = {}, BID = {}
  const keyFor = (name) => {
    const k = norm(name)
    if (!(k in NAME)) { NAME[k] = dedup(name); const b = matchRoster(name); BID[k] = b ? b.id : null }
    return k
  }
  const BAT = {}, BOWL = {}, FIELD = {}
  const bat0 = () => ({ inn: 0, no: 0, runs: 0, balls: 0, fours: 0, sixes: 0, hs: 0, hsno: false, f: 0, h: 0, d: 0, m: new Set() })
  const bowl0 = () => ({ m: new Set(), balls: 0, runs: 0, wkts: 0, maid: 0, bw: 0, br: 9999, fifer: 0 })

  matchResults.forEach((mr, mi) => {
    for (const b of (mr.our_batting || [])) {
      if (!b.did_bat) continue
      const k = keyFor(b.name); const d = (BAT[k] = BAT[k] || bat0())
      d.m.add(mi); d.inn++; d.runs += b.runs; d.balls += b.balls; d.fours += b.fours; d.sixes += b.sixes
      if (b.not_out) d.no++
      if (b.runs === 0 && !b.not_out) d.d++
      if (b.runs >= 100) d.h++; else if (b.runs >= 50) d.f++
      if (b.runs > d.hs || (b.runs === d.hs && b.not_out)) { d.hs = b.runs; d.hsno = b.not_out }
    }
    for (const b of (mr.our_bowling || [])) {
      const k = keyFor(b.name); const d = (BOWL[k] = BOWL[k] || bowl0())
      d.m.add(mi); d.balls += oversToBalls(b.overs); d.runs += b.runs; d.wkts += b.wickets; d.maid += (b.maidens || 0)
      if (b.wickets > d.bw || (b.wickets === d.bw && b.runs < d.br)) { d.bw = b.wickets; d.br = b.runs }
      if (b.wickets >= 5) d.fifer++
    }
    for (const f of (mr.our_fielding || [])) {
      const k = keyFor(f.name); const d = (FIELD[k] = FIELD[k] || { c: 0, s: 0, r: 0 })
      d.c += (f.catches || 0); d.s += (f.stumpings || 0); d.r += (f.run_outs || 0)
    }
  })

  const keys = new Set([...Object.keys(BAT), ...Object.keys(BOWL), ...Object.keys(FIELD)])
  const rows = []
  for (const k of keys) {
    const b = BAT[k], bo = BOWL[k], fi = FIELD[k] || { c: 0, s: 0, r: 0 }
    const row = { player_id: null, btcl_player_id: BID[k] ?? null, player_name: NAME[k], season: '2026', bat_highest_not_out: false }
    Object.assign(row, { bat_matches: 0, bat_innings: 0, bat_runs: 0, bat_balls: 0, bat_highest: 0, bat_fifties: 0, bat_hundreds: 0, bat_ducks: 0, bat_fours: 0, bat_sixes: 0, bat_average: 0, bat_strike_rate: 0 })
    if (b) {
      const outs = b.inn - b.no
      Object.assign(row, {
        bat_matches: b.m.size, bat_innings: b.inn, bat_runs: b.runs, bat_balls: b.balls,
        bat_highest: b.hs, bat_highest_not_out: b.hsno, bat_fifties: b.f, bat_hundreds: b.h,
        bat_ducks: b.d, bat_fours: b.fours, bat_sixes: b.sixes,
        bat_average: outs > 0 ? r2(b.runs / outs) : b.runs,
        bat_strike_rate: b.balls ? r2(b.runs / b.balls * 100) : 0,
      })
    }
    Object.assign(row, { bowl_matches: 0, bowl_overs: 0, bowl_wickets: 0, bowl_runs: 0, bowl_maidens: 0, bowl_best_wickets: 0, bowl_best_runs: 0, bowl_average: 0, bowl_economy: 0, bowl_strike_rate: 0, bowl_five_fers: 0 })
    if (bo) {
      const ov = bo.balls / 6
      Object.assign(row, {
        bowl_matches: bo.m.size, bowl_overs: parseFloat(ballsToOvers(bo.balls)), bowl_wickets: bo.wkts, bowl_runs: bo.runs,
        bowl_maidens: bo.maid, bowl_best_wickets: bo.bw, bowl_best_runs: bo.br < 9999 ? bo.br : 0,
        bowl_average: bo.wkts ? r2(bo.runs / bo.wkts) : 0, bowl_economy: ov ? r2(bo.runs / ov) : 0,
        bowl_strike_rate: bo.wkts ? r2(bo.balls / bo.wkts) : 0, bowl_five_fers: bo.fifer,
      })
    }
    Object.assign(row, { field_catches: fi.c, field_run_outs: fi.r, field_stumpings: fi.s })
    rows.push(row)
  }
  return rows
}

// Auto Player of the Week from the most recent decided match
export function autoPOTW(matchResults) {
  const decided = matchResults.filter((m) => ['won', 'lost', 'tie'].includes(m.result))
  if (!decided.length) return null
  decided.sort((a, b) => (a.match_date < b.match_date ? -1 : 1))
  const latest = decided[decided.length - 1]
  const opp = (latest.opponent || '').split(' - ')[0]
  const bat = (latest.our_batting || []).filter((b) => b.did_bat)
    .sort((a, b) => (b.runs - a.runs) || (b.sixes - a.sixes))[0]
  const bowl = (latest.our_bowling || []).slice().sort((a, b) => (b.wickets - a.wickets) || (a.runs - b.runs))[0]
  const sr = (r, b) => (b ? Math.round(r / b * 1000) / 10 : 0)
  const row = { match_date: latest.match_date, opponent: latest.opponent, auto: true, updated_at: new Date().toISOString() }
  if (bat) Object.assign(row, {
    batter_name: dedup(bat.name), batter_runs: bat.runs, batter_balls: bat.balls, batter_fours: bat.fours, batter_sixes: bat.sixes,
    batter_message: `Top scored with ${bat.runs} (${bat.balls} balls, ${bat.fours}x4 ${bat.sixes}x6) at SR ${sr(bat.runs, bat.balls)} vs ${opp}.`,
  })
  if (bowl) {
    const ov = parseFloat(bowl.overs) || 0
    const econ = ov ? Math.round(bowl.runs / ov * 100) / 100 : 0
    Object.assign(row, {
      bowler_name: dedup(bowl.name), bowler_wickets: bowl.wickets, bowler_overs: bowl.overs, bowler_runs: bowl.runs, bowler_economy: econ,
      bowler_message: `${bowl.wickets}/${bowl.runs} from ${bowl.overs} overs (econ ${econ}) vs ${opp}.`,
    })
  }
  return row
}

// Recompute + persist everything from the current match_results rows.
export async function recomputeAll() {
  const [{ data: mrs }, roster] = await Promise.all([
    supabase.from('match_results').select('*').eq('season', '2026'),
    loadRoster(),
  ])
  const matchResults = mrs || []
  const rows = aggregate(matchResults, roster)

  await supabase.from('player_stats').delete().eq('season', '2026')
  if (rows.length) await supabase.from('player_stats').insert(rows)

  // keep the cached public performance scores in sync with the live formula
  try { await syncCachedScores(rows, roster) } catch (e) { /* non-fatal */ }

  const potw = autoPOTW(matchResults)
  if (potw) {
    const { data: cur } = await supabase.from('player_of_week').select('id,auto').order('id', { ascending: false }).limit(1)
    const latest = cur && cur[0]
    if (!latest || latest.auto !== false) {
      await supabase.from('player_of_week').delete().neq('id', -1)
      await supabase.from('player_of_week').insert(potw)
    }
  }
  return { players: rows.length, matches: matchResults.length }
}
