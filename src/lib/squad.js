// Client-side squad loader. Fetches the live BTCL team roster (CORS-open, from
// the viewer's own IP so Cloudflare allows it — unlike our Vercel functions) and
// merges season stats from the scorecard-derived player_stats table. Falls back
// to /api/players if the roster fetch fails. Returns the same shape the pages
// already consume: { players: [{ id, name, forename, surname, ageGroup,
// batStyle, bowlStyle, playerType, photoUrl, photoPos, stats }], source }.

import { supabase } from '../supabase'

const ROSTER_URL = 'https://admin.btcluk.com/api/teamPlayer/286253'
const PHOTO_BASE = 'https://admin.btcluk.com/players/'
const DISPLAY_OVERRIDE = { 2233: 'Ajanthan Navaratnam', 4927: 'Krishen Daniel', 6296: 'Shenal Daniel Anthony' }
const PHOTO_POS = { 1377: 'center 72%', 1397: 'center 55%', 7361: 'center 62%', 7435: 'center 22%' }

const COMMON = new Set(['mohamed', 'daniel', 'anton', 'kumar', 'raj', 'singh', 'mohamad'])
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()
const toks = (s) => new Set(norm(s).split(' ').filter(Boolean))
const nnum = (v) => (v == null ? null : Number(v))
const title = (s) => s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

function findStatRow(rows, byId, p, displayName) {
  if (byId[p.PlayerID]) return byId[p.PlayerID]
  const candidates = [displayName, `${p.Forename} ${p.Surname}`, `${p.Surname} ${p.Forename}`].filter(Boolean)
  for (const c of candidates) {
    const hit = rows.find((r) => norm(r.player_name) === norm(c))
    if (hit) return hit
  }
  let best = null, bs = 0
  for (const c of candidates) {
    const ct = toks(c)
    for (const r of rows) {
      const rt = toks(r.player_name)
      const inter = [...ct].filter((x) => rt.has(x))
      const subset = [...ct].every((x) => rt.has(x)) || [...rt].every((x) => ct.has(x))
      const meaningful = inter.filter((x) => !COMMON.has(x)).length
      if (subset && inter.length >= 2 && meaningful >= 1 && inter.length > bs) { bs = inter.length; best = r }
    }
  }
  return best
}

function statsFrom(row) {
  if (!row) return { matches: null, runs: null, innings: null, highest: null, average: null, wickets: null, economy: null, bestWkt: null, catches: null }
  const hasBat = nnum(row.bat_innings) || nnum(row.bat_runs)
  const hasBowl = nnum(row.bowl_matches) || nnum(row.bowl_wickets) || nnum(row.bowl_overs)
  return {
    matches: nnum(row.bat_matches) || nnum(row.bowl_matches) || null,
    runs: hasBat != null ? nnum(row.bat_runs) : null,
    innings: nnum(row.bat_innings), highest: nnum(row.bat_highest), average: nnum(row.bat_average),
    wickets: hasBowl != null ? nnum(row.bowl_wickets) : null,
    economy: nnum(row.bowl_economy), bestWkt: nnum(row.bowl_best_wickets), catches: nnum(row.field_catches),
  }
}

export async function getSquad() {
  const [rosterR, statsR] = await Promise.allSettled([
    fetch(ROSTER_URL, { headers: { Accept: 'application/json' } }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('roster')))),
    supabase.from('player_stats').select('*').eq('season', '2026'),
  ])
  const roster = rosterR.status === 'fulfilled' ? rosterR.value : null
  const statRows = (statsR.status === 'fulfilled' && statsR.value.data) ? statsR.value.data : []

  if (!roster || !roster.length) {
    // fall back to the serverless squad (its own fallback may be stale, but keeps the page working)
    try { const d = await (await fetch('/api/players')).json(); return { players: d.players || [], source: d.source || 'fallback' } }
    catch { return { players: [], source: 'error' } }
  }

  const byId = {}
  for (const r of statRows) if (r.btcl_player_id != null) byId[r.btcl_player_id] = r

  const players = roster.map((p) => {
    const displayName = DISPLAY_OVERRIDE[p.PlayerID] || `${p.Forename} ${p.Surname}`
    const row = findStatRow(statRows, byId, p, displayName)
    return {
      id: p.PlayerID, forename: p.Forename, surname: p.Surname, name: title(displayName),
      ageGroup: p.AgeGroup, batStyle: p.BatStyle || null, bowlStyle: p.BowlStyle || null,
      playerType: p.player_type,
      photoUrl: p.Photo ? `${PHOTO_BASE}${encodeURIComponent(p.Photo)}` : null,
      photoPos: PHOTO_POS[p.PlayerID] || null,
      stats: statsFrom(row),
    }
  })
  return { players, source: 'live' }
}
