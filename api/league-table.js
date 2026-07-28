// Vercel Node.js serverless function — live BTCL Premier Division table.
//
// Source: the league's own JSON API (the same one www.btcluk.com uses), which is
// open and CORS-friendly — no bot challenge, unlike the play-cricket HTML pages.
//   https://admin.btcluk.com/api/divisionLeague/137680
// Fields per row: position, team_name, p, w, i(=losses), BP, Pen, NRR, Pts.

const DIVISION_ID = '137680'
const LEAGUE_API = `https://admin.btcluk.com/api/divisionLeague/${DIVISION_ID}`

// Manual fallback (current standings) if the API is ever unreachable.
const FALLBACK_TEAMS = [
  { pos: 1, team: 'Stanly CC - A',                                       p: '13', w: '12', l: '1',  bp: '8',  nrr: '2.5',   pts: '248' },
  { pos: 2, team: 'Lewisham CC - A',                                     p: '13', w: '10', l: '2',  bp: '13', nrr: '2.09',  pts: '223' },
  { pos: 3, team: 'Northerns CC - A',                                    p: '13', w: '10', l: '3',  bp: '21', nrr: '2.09',  pts: '221' },
  { pos: 4, team: 'West 3 CC - 1st XI',                                  p: '13', w: '5',  l: '8',  bp: '60', nrr: '-0.65', pts: '158' },
  { pos: 5, team: 'Northerns CC - B',                                    p: '13', w: '5',  l: '7',  bp: '47', nrr: '-0.98', pts: '137' },
  { pos: 6, team: 'Redbridge Lankians Sports & Social Club CC - 1st XI', p: '13', w: '4',  l: '9',  bp: '55', nrr: '-1.47', pts: '135' },
  { pos: 7, team: 'Kent United CC - 1st XI',                             p: '13', w: '3',  l: '9',  bp: '59', nrr: '-1.35', pts: '129' },
  { pos: 8, team: 'Dollishill Tamil United CC - Knights',               p: '13', w: '1',  l: '11', bp: '73', nrr: '-2.51', pts: '101' },
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.btcluk.com',
  'Referer': 'https://www.btcluk.com/',
}

function mapRows(data) {
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')

  try {
    const response = await fetch(LEAGUE_API, { headers: HEADERS })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const teams = mapRows(await response.json())

    if (teams.length > 0) {
      return res.status(200).json({ teams, updatedAt: new Date().toISOString(), source: 'live' })
    }
    return res.status(200).json({ teams: FALLBACK_TEAMS, updatedAt: new Date().toISOString(), source: 'fallback' })
  } catch (err) {
    console.error('League table fetch error:', err.message)
    return res.status(200).json({ teams: FALLBACK_TEAMS, updatedAt: new Date().toISOString(), source: 'fallback' })
  }
}
