// Vercel Node.js serverless function — fetches BTCL last 10 results with logos + scorecard links

const BASE_URL = 'https://dtucc.play-cricket.com'
const RESULTS_URL = `${BASE_URL}/website/division/137680?type=last_10_results`

// Logos
const L = {
  tucc:     'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',
  lewisham: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/11733/lcc_logo1.JPG',
  northerns:'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg',
  redbridge:'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/8492/logo.jpg',
  stanly:   'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16364/7E8264ED-7826-4974-9CEF-2D36D2116E39.jpeg',
  west3:    'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16343/w3.JPG',
  kent:     'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16346/KENT_UNITED_CC_mockup_new__1_.jpg',
}

const FALLBACK = [
  // 07 June 2026
  { date: '07 June 2026', winner: 'Lewisham CC A',  margin: '5 wickets',  team1: 'Lewisham CC A',                       score1: '216/5 (35.2)',       pts1: '20', logo1: L.lewisham, team2: 'Northerns CC A',                             score2: '212/9 (40.0)',        pts2: '4',  logo2: L.northerns, scorecardUrl: `${BASE_URL}/website/results/7504409` },
  { date: '07 June 2026', winner: 'Abandoned',      margin: '',           team1: 'Tamil United CC',                     score1: '— (Abandoned)',      pts1: '10', logo1: L.tucc,     team2: 'Northerns CC B',                             score2: '— (Abandoned)',       pts2: '10', logo2: L.northerns, scorecardUrl: `${BASE_URL}/website/results/7504411` },
  { date: '07 June 2026', winner: 'Stanly CC',      margin: '9 wickets',  team1: 'Stanly CC',                           score1: '85/1 (12.5)',         pts1: '20', logo1: L.stanly,   team2: 'Kent United CC',                            score2: '84/All out (27.1)',   pts2: '2',  logo2: L.kent,      scorecardUrl: `${BASE_URL}/website/results/7504410` },
  { date: '07 June 2026', winner: 'West 3 CC',      margin: '6 wickets',  team1: 'West 3 CC',                           score1: '209/4 (32.4)',        pts1: '20', logo1: L.west3,    team2: 'Redbridge Lankians CC',                     score2: '203/8 (40.0)',        pts2: '7',  logo2: L.redbridge, scorecardUrl: `${BASE_URL}/website/results/7504412` },
  // 31 May 2026
  { date: '31 May 2026',  winner: 'Lewisham CC A',  margin: '3 wickets',  team1: 'Tamil United CC',                     score1: '213/8 (40.0)',        pts1: '8',  logo1: L.tucc,     team2: 'Lewisham CC A',                             score2: '217/7 (33.0)',        pts2: '20', logo2: L.lewisham,  scorecardUrl: `${BASE_URL}/website/results/7504406` },
  { date: '31 May 2026',  winner: 'Northerns CC A', margin: '6 wickets',  team1: 'Northerns CC A',                      score1: '105/4 (17.1)',        pts1: '20', logo1: L.northerns,team2: 'Kent United CC',                            score2: '103/All out (27.3)', pts2: '4',  logo2: L.kent,      scorecardUrl: `${BASE_URL}/website/results/7504405` },
  { date: '31 May 2026',  winner: 'Northerns CC B', margin: '7 wickets',  team1: 'Redbridge Lankians CC',               score1: '138/All out (36.4)', pts1: '4',  logo1: L.redbridge,team2: 'Northerns CC B',                            score2: '139/3 (29.3)',        pts2: '20', logo2: L.northerns, scorecardUrl: `${BASE_URL}/website/results/7504408` },
  { date: '31 May 2026',  winner: 'Stanly CC',      margin: '54 runs',    team1: 'Stanly CC',                           score1: '261/All out (39.5)', pts1: '20', logo1: L.stanly,   team2: 'West 3 CC',                                 score2: '207/9 (40.0)',        pts2: '10', logo2: L.west3,     scorecardUrl: `${BASE_URL}/website/results/7504407` },
  // 24 May 2026
  { date: '24 May 2026',  winner: 'Northerns CC A', margin: '250 runs',   team1: 'Tamil United CC',                     score1: '201/All out (23.4)', pts1: '7',  logo1: L.tucc,     team2: 'Northerns CC A',                            score2: '451/4 (40.0)',        pts2: '20', logo2: L.northerns, scorecardUrl: `${BASE_URL}/website/results/7504401` },
  { date: '24 May 2026',  winner: 'Kent United CC', margin: '4 wickets',  team1: 'Kent United CC',                      score1: '172/6 (33.0)',        pts1: '20', logo1: L.kent,     team2: 'West 3 CC',                                 score2: '169/8 (40.0)',        pts2: '7',  logo2: L.west3,     scorecardUrl: `${BASE_URL}/website/results/7504402` },
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Connection': 'keep-alive',
}

function strip(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

// Logo lookup by team name
function logoFor(name = '') {
  const n = name.toLowerCase()
  if (n.includes('tamil') || n.includes('dollishill') || n.includes('dtu') || n.includes('knights')) return L.tucc
  if (n.includes('lewisham')) return L.lewisham
  if (n.includes('northerns')) return L.northerns
  if (n.includes('redbridge') || n.includes('lankians')) return L.redbridge
  if (n.includes('stanly')) return L.stanly
  if (n.includes('west 3')) return L.west3
  if (n.includes('kent')) return L.kent
  return ''
}

function parseResults(html) {
  const results = []

  // Fix: use full month names in date regex
  const DATE_RE = /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/g
  const dateMatches = [...html.matchAll(DATE_RE)]

  // Split into match blocks using the mobile status div (one per match)
  const splitRe = /class=['"]col-sm-12 d-md-none match-status-mobile['"]/g
  const splitPositions = [...html.matchAll(splitRe)].map(m => m.index)

  for (let i = 0; i < splitPositions.length; i++) {
    const blockStart = splitPositions[i]
    const blockEnd   = splitPositions[i + 1] ?? html.length

    // The desktop table row is further ahead — look up to 6000 chars
    const block      = html.slice(blockStart, Math.min(blockEnd, blockStart + 6000))
    const blockText  = strip(block)

    // Scorecard ID — from link-scorecard href within this block
    const scMatch = block.match(/href='(\/website\/results\/(\d+))'\s+class='link-scorecard/)
    if (!scMatch) continue
    const scorecardPath = scMatch[1]
    const scorecardUrl  = `${BASE_URL}${scorecardPath}`

    // Result text
    const resultMatch = block.match(/match-status-mobile[^>]*>\s*([^<]+)</)
    const resultText  = resultMatch ? resultMatch[1].trim().replace(/\s+/g, ' ') : ''

    // Skip rows with no result info
    if (!resultText) continue

    // Determine winner and margin from result text
    let winner = '', margin = ''
    const wonBy = resultText.match(/^(.+?)\s+WON\s+BY\s+(.+)$/i)
    if (wonBy) { winner = wonBy[1].trim(); margin = wonBy[2].trim().toLowerCase() }
    const abandoned = /ABANDONED|NO RESULT/i.test(resultText)
    const tied = /TIED/i.test(resultText)
    if (abandoned) { winner = 'Abandoned'; margin = '' }
    if (tied)      { winner = 'Tied';      margin = '' }

    // Nearest date before this block
    let date = ''
    for (const dm of dateMatches) {
      if (dm.index < blockStart) date = dm[1]
    }

    // Parse teams and scores from the desktop table row (d-none d-md-table-row)
    // Format: "[pts] pts [TeamName] - [XI/A/B/Knights] [score] / [wkts or All out] ([overs])"
    const desktopRow = block.match(/d-none d-md-table-row[^>]*>([\s\S]*?)(?=d-none d-md-table-row|$)/)
    const rowText = desktopRow ? strip(desktopRow[0]) : blockText

    // Extract team names — look for known club names (A/B variants first so they match before bare name)
    const CLUBS = [
      'Dollishill Tamil United CC - Knights', 'Dollishill Tamil United CC', 'Tamil United CC',
      'Lewisham CC A', 'Lewisham CC B', 'Lewisham CC',
      'Northerns CC A', 'Northerns CC B', 'Northerns CC',
      'Stanly CC', 'West 3 CC', 'Kent United CC',
      'Redbridge Lankians Sports & Social Club CC', 'Redbridge Lankians CC',
    ]
    // Find all matching clubs, then deduplicate by logo (same club = same logo)
    const rawTeams = CLUBS.filter(c => rowText.toLowerCase().includes(c.toLowerCase()))
    const seenLogos = new Set()
    const foundTeams = []
    for (const t of rawTeams) {
      const lg = logoFor(t) || t
      if (!seenLogos.has(lg)) { seenLogos.add(lg); foundTeams.push(t) }
    }
    // Normalise our own team name to the current name
    const normTeam = t => {
      const l = t.toLowerCase()
      if (l.includes('tamil') || l.includes('dollishill') || l.includes('knights')) return 'Tamil United CC'
      return t
    }
    const team1 = normTeam(foundTeams[0] || '')
    const team2 = normTeam(foundTeams[1] || '')

    // Extract scores — pattern: digits / (digits|All out) (overs)
    const scoreRe = /(\d{2,3})\s*\/\s*(\d+|All\s*out)\s*\(([\d.]+)\)/gi
    const scoreMatches = [...rowText.matchAll(scoreRe)]
    const score1 = scoreMatches[0] ? `${scoreMatches[0][1]}/${scoreMatches[0][2].replace(/\s/g, '')} (${scoreMatches[0][3]})` : '—'
    const score2 = scoreMatches[1] ? `${scoreMatches[1][1]}/${scoreMatches[1][2].replace(/\s/g, '')} (${scoreMatches[1][3]})` : '—'

    // Extract pts — look for numbers near "pts"
    const ptsMatches = [...rowText.matchAll(/(\d+)\s*pts/gi)]
    const pts1 = ptsMatches[0]?.[1] || ''
    const pts2 = ptsMatches[1]?.[1] || ''

    results.push({
      date, winner, margin,
      team1: team1 || (abandoned ? 'Tamil United CC' : ''),
      score1: abandoned ? '— (Abandoned)' : score1,
      pts1,
      logo1: logoFor(team1),
      team2: team2 || '',
      score2: abandoned ? '— (Abandoned)' : score2,
      pts2,
      logo2: logoFor(team2),
      scorecardUrl,
    })
  }

  return results
}

// Build a lookup map: scorecard URL → { team1, team2, winner } from FALLBACK (curated correct names)
const FALLBACK_BY_URL = {}
for (const f of FALLBACK) {
  FALLBACK_BY_URL[f.scorecardUrl] = { team1: f.team1, team2: f.team2, winner: f.winner, logo1: f.logo1, logo2: f.logo2 }
}

// Merge live-parsed result with curated FALLBACK team names (live scraper can't see A/B subtitles)
function applyFallbackNames(result) {
  const override = FALLBACK_BY_URL[result.scorecardUrl]
  if (!override) return result
  return {
    ...result,
    team1:  override.team1  || result.team1,
    team2:  override.team2  || result.team2,
    logo1:  override.logo1  || result.logo1,
    logo2:  override.logo2  || result.logo2,
    // also fix winner name if fallback has more specific version
    winner: override.winner || result.winner,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')

  try {
    const response = await fetch(RESULTS_URL, { headers: HEADERS })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const html = await response.text()
    const raw = parseResults(html)

    if (raw.length >= 5) {
      // Apply curated team names (A/B suffixes etc.) from FALLBACK
      const results = raw.map(applyFallbackNames)
      return res.status(200).json({ results, updatedAt: new Date().toISOString(), source: 'live' })
    }
    return res.status(200).json({ results: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  } catch (err) {
    console.error('Results error:', err.message)
    return res.status(200).json({ results: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  }
}
