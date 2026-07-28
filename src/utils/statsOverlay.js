import { supabase } from '../supabase'

// ── Season stats source ──────────────────────────────────────────────────────
// The Supabase `player_stats` table is the single source of truth — it is
// aggregated from the uploaded match scorecards (see admin Scorecards tab).
// (Previously this overlaid an Excel file; scorecards now replace that entirely.)

const norm = s => String(s == null ? '' : s).toLowerCase().trim()
const n = (v, d = 0) => (v == null ? d : Number(v))

function toBatting(r) {
  return {
    name: r.player_name,
    matches: n(r.bat_matches), innings: n(r.bat_innings), runs: n(r.bat_runs),
    fours: n(r.bat_fours), sixes: n(r.bat_sixes), not_outs: 0,
    average: n(r.bat_average), strike_rate: n(r.bat_strike_rate),
    highest: n(r.bat_highest), highest_no: !!r.bat_highest_not_out,
    fifties: n(r.bat_fifties), hundreds: n(r.bat_hundreds),
  }
}

function toBowling(r) {
  const best = r.bowl_best_wickets != null ? `${r.bowl_best_wickets}/${n(r.bowl_best_runs)}` : ''
  return {
    name: r.player_name,
    matches: n(r.bowl_matches), overs: n(r.bowl_overs), wickets: n(r.bowl_wickets),
    runs: n(r.bowl_runs), economy: n(r.bowl_economy), average: n(r.bowl_average),
    strike_rate: n(r.bowl_strike_rate), five_fers: n(r.bowl_five_fers), best_bowling: best,
  }
}

// Returns { batting, bowling } straight from the scorecard-aggregated table.
export async function loadMergedStats(season = '2026') {
  let rows = []
  try {
    const { data } = await supabase.from('player_stats').select('*').eq('season', season)
    rows = data || []
  } catch {
    rows = []
  }

  const batting = [], bowling = []
  for (const r of rows) {
    if (!r.player_name) continue
    if (Number(r.bat_innings) > 0 || Number(r.bat_runs) > 0) batting.push(toBatting(r))
    if (Number(r.bowl_matches) > 0 || Number(r.bowl_wickets) > 0 || Number(r.bowl_overs) > 0) bowling.push(toBowling(r))
  }
  batting.sort((a, b) => b.runs - a.runs)
  bowling.sort((a, b) => b.wickets - a.wickets)
  return { batting, bowling }
}
