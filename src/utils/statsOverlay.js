import { supabase } from '../supabase'
import statsJson from '../data/stats-2026.json'

// ── Stats overlay ───────────────────────────────────────────────────────────
// The static Excel file (stats-2026.json) is the bulk base. The admin "Stats"
// tab writes to the Supabase `player_stats` table — those rows OVERRIDE / ADD
// on top of the base, so admins can correct any player and it shows live.
// If a player has no admin row, the Excel figure is used unchanged.

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

// Returns { batting, bowling } — Excel base with admin player_stats overlaid by name.
export async function loadMergedStats(season = '2026') {
  let rows = []
  try {
    const { data } = await supabase.from('player_stats').select('*').eq('season', season)
    rows = data || []
  } catch {
    rows = []
  }

  const batOv = new Map(), bowlOv = new Map()
  for (const r of rows) {
    if (!r.player_name) continue
    const hasBat = r.bat_matches != null || r.bat_innings != null || r.bat_runs != null
    const hasBowl = r.bowl_matches != null || r.bowl_overs != null || r.bowl_wickets != null
    if (hasBat) batOv.set(norm(r.player_name), toBatting(r))
    if (hasBowl) bowlOv.set(norm(r.player_name), toBowling(r))
  }

  const merge = (base, ov) =>
    (base || []).filter(p => !ov.has(norm(p.name))).concat([...ov.values()])

  return {
    batting: merge(statsJson.batting, batOv),
    bowling: merge(statsJson.bowling, bowlOv),
  }
}
