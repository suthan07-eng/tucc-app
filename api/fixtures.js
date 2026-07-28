// Vercel Node.js serverless function — live BTCL Premier Division fixtures.
//
// Source: the league's own JSON API (the same one www.btcluk.com uses), which is
// open and CORS-friendly — no bot challenge, unlike the play-cricket HTML pages.
//   https://admin.btcluk.com/api/divisionFixture/137680
// Each row: match_date "DD/MM/YYYY", status, ground_name, home/away club+team name.

const DIVISION_ID = '137680'
const FIXTURES_API = `https://admin.btcluk.com/api/divisionFixture/${DIVISION_ID}`

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Manual fallback if the API is ever unreachable — our final league fixture.
const FALLBACK = [
  {
    date: 'Sunday 02 August 2026', time: '13:00',
    venue: 'Stanmore Common',
    team1: 'West 3 CC - 1st XI', logo1: '',
    team2: 'Dollishill Tamil United CC - Knights', logo2: '',
  },
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.btcluk.com',
  'Referer': 'https://www.btcluk.com/',
}

// "03/05/2026" → "Sunday 03 May 2026" (the format the app's date parser expects)
function formatDate(ddmmyyyy) {
  const m = (ddmmyyyy || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ddmmyyyy || ''
  const day = m[1].padStart(2, '0')
  const monthName = MONTHS[parseInt(m[2], 10) - 1] || ''
  const year = m[3]
  const dow = DAYS[new Date(+year, +m[2] - 1, +m[1]).getDay()] || ''
  return `${dow} ${day} ${monthName} ${year}`.trim()
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
    // sort chronologically by the underlying DD/MM/YYYY
    .sort((a, b) => {
      const pa = (a._raw || '').split('/').reverse().join('')
      const pb = (b._raw || '').split('/').reverse().join('')
      return pa.localeCompare(pb)
    })
    .map(({ _raw, ...f }) => f)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300')

  try {
    const response = await fetch(FIXTURES_API, { headers: HEADERS })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const fixtures = mapFixtures(await response.json())

    if (fixtures.length > 0) {
      return res.status(200).json({ fixtures, updatedAt: new Date().toISOString(), source: 'live' })
    }
    return res.status(200).json({ fixtures: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  } catch (err) {
    console.error('Fixtures error:', err.message)
    return res.status(200).json({ fixtures: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  }
}
