// Season player stats — now sourced from the scorecard-derived `player_stats`
// table (aggregated from uploaded match scorecards), NOT the old Excel file or
// the play-cricket scrape. Returns batting/bowling/fielding arrays in the shape
// the Stats page, Home top-performers and public pages already consume.

const SUPABASE_URL = 'https://nrbuweeexnoofitznffo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDE2NzUsImV4cCI6MjA5NDI3NzY3NX0.rbzJIdXFbj7XrumesA1kFRZ3mp4VJO22QYEMbGuUYFE'

const n = (v, d = 0) => (v == null ? d : Number(v))
// "8.3" overs (8 overs 3 balls) → balls
const oversToBalls = (o) => { const f = Number(o) || 0; const w = Math.floor(f); return w * 6 + Math.round((f - w) * 10) }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60')

  const { season = '2026' } = req.query

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/player_stats?season=eq.${encodeURIComponent(season)}&select=*`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    if (!r.ok) throw new Error(`supabase ${r.status}`)
    const rows = await r.json()

    const batting = rows
      .filter((p) => n(p.bat_innings) > 0 || n(p.bat_runs) > 0)
      .map((p) => ({
        name: p.player_name,
        matches: n(p.bat_matches), innings: n(p.bat_innings), runs: n(p.bat_runs),
        balls: n(p.bat_balls), fours: n(p.bat_fours), sixes: n(p.bat_sixes), not_outs: 0,
        average: n(p.bat_average), strike_rate: n(p.bat_strike_rate),
        highest: n(p.bat_highest), highest_not_out: !!p.bat_highest_not_out,
        fifties: n(p.bat_fifties), hundreds: n(p.bat_hundreds),
      }))
      .sort((a, b) => b.runs - a.runs)

    const bowling = rows
      .filter((p) => n(p.bowl_matches) > 0 || n(p.bowl_wickets) > 0 || n(p.bowl_overs) > 0)
      .map((p) => ({
        name: p.player_name,
        matches: n(p.bowl_matches), overs: n(p.bowl_overs), balls: oversToBalls(p.bowl_overs),
        runs: n(p.bowl_runs), wickets: n(p.bowl_wickets), maidens: n(p.bowl_maidens),
        economy: n(p.bowl_economy), average: n(p.bowl_average), strike_rate: n(p.bowl_strike_rate),
        five_fers: n(p.bowl_five_fers), best_wickets: n(p.bowl_best_wickets), best_runs: n(p.bowl_best_runs),
      }))
      .sort((a, b) => b.wickets - a.wickets)

    const fielding = rows
      .filter((p) => n(p.field_catches) > 0 || n(p.field_run_outs) > 0 || n(p.field_stumpings) > 0)
      .map((p) => ({
        name: p.player_name,
        catches: n(p.field_catches), run_outs: n(p.field_run_outs), stumpings: n(p.field_stumpings),
      }))
      .sort((a, b) => (b.catches + b.run_outs + b.stumpings) - (a.catches + a.run_outs + a.stumpings))

    const updatedAt = rows.reduce((m, p) => (p.updated_at > m ? p.updated_at : m), '')

    return res.status(200).json({ batting, bowling, fielding, source: 'scorecards', updatedAt, season })
  } catch (e) {
    console.error('player-stats error:', e.message)
    return res.status(200).json({ batting: [], bowling: [], fielding: [], source: 'error', season })
  }
}
