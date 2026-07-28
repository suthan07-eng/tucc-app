// Vercel Node.js serverless function — scrapes BTCL fixtures from play-cricket

const BASE_URL = 'https://dtucc.play-cricket.com'
// play-cricket's Fixtures tab defaults to the CURRENT calendar month. Near the
// end of a month (or once this month's games are done) that view is empty, so we
// must query each month explicitly and merge. Build a per-month fixtures URL.
const monthUrl = (month, year) =>
  `${BASE_URL}/Matches?tab=Fixture&fixture_month=${month}&fixture_year=${year}`

const FALLBACK = [
  {
    date: 'Sunday 02 August 2026', time: '13:00',
    venue: 'Stanmore Common',
    team1: 'West 3 CC - 1st XI',
    logo1: '',
    team2: 'Dollishill Tamil United CC - Knights',
    logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',
  },
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
}

function strip(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseFixtures(html) {
  const fixtures = []

  // Find date header divs: <div ...>Sunday 07 June 2026</div>
  const dateBlocks = [...html.matchAll(/<div[^>]*>\s*(Sunday \d{1,2} \w+ \d{4})\s*<\/div>/g)]
  if (dateBlocks.length === 0) return []

  for (let i = 0; i < dateBlocks.length; i++) {
    const date = dateBlocks[i][1]
    const blockStart = dateBlocks[i].index
    const blockEnd   = i + 1 < dateBlocks.length ? dateBlocks[i + 1].index : blockStart + 8000

    const block = html.slice(blockStart, blockEnd)

    // TDs in this block
    const tdMatches = [...block.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
    const tds = tdMatches.map(m => strip(m[1])).filter(t => t)

    // Expect at least 4 tds: time+venue, team1, "Vs", team2
    if (tds.length < 4) continue

    const timeVenue = tds[0]
    const timeMatch = timeVenue.match(/(\d{1,2}:\d{2})/)
    const time  = timeMatch ? timeMatch[1] : '13:00'
    const venue = timeVenue.replace(/^\d{1,2}:\d{2}\s*/, '').trim()

    const team1 = tds[1]
    const team2 = tds[3]

    // Badges: 4 per match (each appears twice), take unique pairs
    const badges = [...block.matchAll(/src="(https:\/\/s3[^"]+badge_image\/\d+\/[^"]+)"/g)].map(m => m[1])
    const logo1 = badges[0] || ''
    const logo2 = badges[2] || badges[1] || ''

    if (!team1 || !team2) continue

    fixtures.push({ date, time, venue, team1, logo1, team2, logo2 })
  }

  return fixtures
}

// Fetch + parse the fixtures for one specific month/year (empty array on failure)
async function fetchMonth(month, year) {
  try {
    const response = await fetch(monthUrl(month, year), { headers: HEADERS })
    if (!response.ok) return []
    return parseFixtures(await response.text())
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300')

  try {
    // Query the current month plus the next three, so upcoming fixtures are found
    // even at month-end when the current month has no games left.
    const now = new Date()
    const months = [0, 1, 2, 3].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      return { month: d.getMonth() + 1, year: d.getFullYear() }
    })

    const results = await Promise.all(months.map((m) => fetchMonth(m.month, m.year)))

    // Merge + de-duplicate by date+teams (a fixture only ever appears in one month)
    const seen = new Set()
    const fixtures = []
    for (const list of results) {
      for (const fx of list) {
        const key = `${fx.date}|${fx.team1}|${fx.team2}`
        if (seen.has(key)) continue
        seen.add(key)
        fixtures.push(fx)
      }
    }

    if (fixtures.length > 0) {
      return res.status(200).json({ fixtures, updatedAt: new Date().toISOString(), source: 'live' })
    }
    return res.status(200).json({ fixtures: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  } catch (err) {
    console.error('Fixtures error:', err.message)
    return res.status(200).json({ fixtures: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  }
}
