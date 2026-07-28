// Live BTCL data, fetched CLIENT-SIDE straight from the league's own JSON API.
//
// Why client-side: admin.btcluk.com sits behind Cloudflare, which blocks our
// Vercel serverless IPs (so /api/league-table & /api/fixtures fall back to
// static data). The API sends `Access-Control-Allow-Origin: *`, so the browser
// can call it directly from the user's own IP — which Cloudflare allows — giving
// genuinely live standings/fixtures. If the direct call fails for any reason we
// fall back to our serverless endpoint (which has its own static fallback).

const DIVISION_ID = '137680'
const LEAGUE_API = `https://admin.btcluk.com/api/divisionLeague/${DIVISION_ID}`
const FIXTURES_API = `https://admin.btcluk.com/api/divisionFixture/${DIVISION_ID}`

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function mapLeague(data) {
  if (!Array.isArray(data)) return []
  return data
    .map((r) => ({
      pos: parseInt(r.position, 10),
      team: (r.team_name || '').trim(),
      p:   String(r.p ?? ''),
      w:   String(r.w ?? ''),
      l:   String(r.i ?? ''),   // API uses "i" for losses
      bp:  String(r.BP ?? ''),
      nrr: String(r.NRR ?? ''),
      pts: String(r.Pts ?? ''),
    }))
    .filter((t) => !isNaN(t.pos) && t.team)
    .sort((a, b) => a.pos - b.pos)
}

// "03/05/2026" → "Sunday 03 May 2026" (the format the app's date parsers expect)
function formatDate(ddmmyyyy) {
  const m = (ddmmyyyy || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ddmmyyyy || ''
  const day = m[1].padStart(2, '0')
  const monthName = MONTHS[parseInt(m[2], 10) - 1] || ''
  const dow = DAYS[new Date(+m[3], +m[2] - 1, +m[1]).getDay()] || ''
  return `${dow} ${day} ${monthName} ${m[3]}`.trim()
}

const teamName = (club, team) => [club, team].filter(Boolean).join(' - ').trim()

function mapFixtures(data) {
  if (!Array.isArray(data)) return []
  return data
    .map((r) => ({
      date: formatDate(r.match_date),
      time: r.match_time || '13:00',
      venue: r.ground_name && r.ground_name !== 'Add New Ground' ? r.ground_name : '',
      team1: teamName(r.home_club_name, r.home_team_name),
      logo1: '',
      team2: teamName(r.away_club_name, r.away_team_name),
      logo2: '',
      _raw: r.match_date,
    }))
    .filter((f) => f.team1 && f.team2)
    .sort((a, b) => {
      const pa = (a._raw || '').split('/').reverse().join('')
      const pb = (b._raw || '').split('/').reverse().join('')
      return pa.localeCompare(pb)
    })
    .map(({ _raw, ...f }) => f)
}

// Returns { teams, rows, source, updatedAt }. `rows` is an alias of `teams`
// (some callers read d.rows, others d.teams).
export async function getLeagueTable() {
  try {
    const r = await fetch(LEAGUE_API, { headers: { Accept: 'application/json' } })
    if (r.ok) {
      const teams = mapLeague(await r.json())
      if (teams.length) return { teams, rows: teams, source: 'live', updatedAt: new Date().toISOString() }
    }
  } catch (e) { /* fall through to serverless */ }
  try {
    const d = await (await fetch('/api/league-table')).json()
    const teams = d.teams || []
    return { teams, rows: teams, source: d.source, updatedAt: d.updatedAt }
  } catch (e) {
    return { teams: [], rows: [], source: 'error', updatedAt: null }
  }
}

// Returns { fixtures, source, updatedAt }.
export async function getFixtures() {
  try {
    const r = await fetch(FIXTURES_API, { headers: { Accept: 'application/json' } })
    if (r.ok) {
      const fixtures = mapFixtures(await r.json())
      if (fixtures.length) return { fixtures, source: 'live', updatedAt: new Date().toISOString() }
    }
  } catch (e) { /* fall through to serverless */ }
  try {
    const d = await (await fetch('/api/fixtures')).json()
    return { fixtures: d.fixtures || [], source: d.source, updatedAt: d.updatedAt }
  } catch (e) {
    return { fixtures: [], source: 'error', updatedAt: null }
  }
}
