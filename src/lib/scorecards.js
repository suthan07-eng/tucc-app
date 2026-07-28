// Client-side scorecard aggregation. After a scorecard is uploaded/parsed and
// saved to `match_results`, we recompute the whole season from ALL match_results
// rows -> player_stats (season totals) + auto Player of the Week. Idempotent:
// player_stats for the season is fully replaced each time.

import { supabase } from '../supabase'

const norm = (n) => (n || '').replace(/[*†]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim()
const toks = (n) => new Set(norm(n).split(' ').filter(Boolean))
const clean = (n) => (n || '').replace(/[*†]/g, '').replace(/\s+/g, ' ').trim()

// scorecard spelling -> DB player name
const ALIAS = {
  'kajenth thanabalasingham': 'kajenth',
  'namasevayam vipooshanan': 'namassevayam vipooshanan',
}

// Build a matcher from the players table
function makeMatcher(players) {
  const byNorm = new Map()
  for (const p of players) byNorm.set(norm(p.name), p)
  return (name) => {
    let key = norm(name)
    if (ALIAS[key]) key = ALIAS[key]
    if (byNorm.has(key)) return byNorm.get(key)
    const t = toks(name)
    let best = null, bestScore = 0
    for (const p of players) {
      const pt = toks(p.name)
      const inter = [...t].filter((x) => pt.has(x)).length
      if (!inter) continue
      let score = inter / Math.min(t.size, pt.size)
      const subset = [...t].every((x) => pt.has(x)) || [...pt].every((x) => t.has(x))
      if (subset && score >= 1) score += 1
      if (score > bestScore) { bestScore = score; best = p }
    }
    return bestScore >= 1 ? best : null
  }
}

const oversToBalls = (o) => { const f = parseFloat(o) || 0; const w = Math.floor(f); return w * 6 + Math.round((f - w) * 10) }
const ballsToOvers = (b) => `${Math.floor(b / 6)}.${b % 6}`
const r2 = (x) => Math.round(x * 100) / 100

// Aggregate all match_results -> array of player_stats rows
export function aggregate(matchResults, players) {
  const match = makeMatcher(players)
  const NAME = {}, PID = {}
  const keyFor = (name) => {
    const p = match(name)
    if (p) { NAME[p.id] = p.name; PID[p.id] = p.id; return p.id }
    const k = 'g:' + norm(name); NAME[k] = clean(name); PID[k] = null; return k
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
      const p = match(f.name)
      if (!p) continue
      NAME[p.id] = p.name; PID[p.id] = p.id
      const d = (FIELD[p.id] = FIELD[p.id] || { c: 0, s: 0, r: 0 })
      d.c += (f.catches || 0); d.s += (f.stumpings || 0); d.r += (f.run_outs || 0)
    }
  })

  const ids = new Set([...Object.keys(BAT), ...Object.keys(BOWL), ...Object.keys(FIELD)])
  const rows = []
  for (const id of ids) {
    const b = BAT[id], bo = BOWL[id], fi = FIELD[id] || { c: 0, s: 0, r: 0 }
    const row = { player_id: PID[id] ?? null, player_name: NAME[id], season: '2026', bat_highest_not_out: false }
    // batting defaults
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
    batter_name: bat.name, batter_runs: bat.runs, batter_balls: bat.balls, batter_fours: bat.fours, batter_sixes: bat.sixes,
    batter_message: `Top scored with ${bat.runs} (${bat.balls} balls, ${bat.fours}x4 ${bat.sixes}x6) at SR ${sr(bat.runs, bat.balls)} vs ${opp}.`,
  })
  if (bowl) {
    const ov = parseFloat(bowl.overs) || 0
    const econ = ov ? Math.round(bowl.runs / ov * 100) / 100 : 0
    Object.assign(row, {
      bowler_name: bowl.name, bowler_wickets: bowl.wickets, bowler_overs: bowl.overs, bowler_runs: bowl.runs, bowler_economy: econ,
      bowler_message: `${bowl.wickets}/${bowl.runs} from ${bowl.overs} overs (econ ${econ}) vs ${opp}.`,
    })
  }
  return row
}

// Recompute + persist everything from the current match_results rows.
export async function recomputeAll() {
  const [{ data: mrs }, { data: players }] = await Promise.all([
    supabase.from('match_results').select('*').eq('season', '2026'),
    supabase.from('players').select('id,name'),
  ])
  const matchResults = mrs || []
  const rows = aggregate(matchResults, players || [])

  // Replace season player_stats
  await supabase.from('player_stats').delete().eq('season', '2026')
  if (rows.length) await supabase.from('player_stats').insert(rows)

  // Auto POTW — only overwrite if the current latest row is auto (respect manual edits)
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
