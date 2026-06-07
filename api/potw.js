// Player of the Week — scrapes latest TUCC match scorecard from play-cricket
// Falls back to potw-fallback data if scraping fails

const BASE = 'https://dtucc.play-cricket.com'
const RESULTS_URL = `${BASE}/website/division/137680?type=last_10_results`
const PHOTO_BASE = 'https://admin.btcluk.com/players/'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
}

// Our known players with their photo filenames
const PLAYERS = [
  { name: 'Mohamed Nafaz Mohamed Nawfer',  first: 'Mohamed Nafaz', photo: '4309WhatsApp Image 2022-04-27 at 5.51.37 PM.jpeg' },
  { name: 'Gobinath Navaratnam',           first: 'Gobinath',      photo: '90041.jpg' },
  { name: 'Raj Sorna',                     first: 'Raj',           photo: '3615Raj.jpg' },
  { name: 'Roshan Thishanthan',            first: 'Roshan',        photo: 'IMG-20240409-WA0034-removebg-preview.png' },
  { name: 'Mahadeva Amaranath',            first: 'Mahadeva',      photo: '8625IMG-20220408-WA0011.jpg' },
  { name: 'Abbi Kanthiraj',               first: 'Abbi',          photo: '4321IMG-20220428-WA0009.jpg' },
  { name: 'Ajanthan Navaratnam',           first: 'Ajanthan',      photo: '5336IMG-20220411-WA0010.jpg' },
  { name: 'Harriharan Aravinthan',         first: 'Harriharan',    photo: '3635IMG-20220408-WA0018.jpg' },
  { name: 'Theepan Rajah Rajasekaran',     first: 'Theepan Rajah', photo: 'Theepan.jpeg' },
  { name: 'Sanjiv Balachandran',           first: 'Sanjiv',        photo: '6916IMG-20220411-WA0018.jpg' },
  { name: 'Namasevayam Vipooshanan',       first: 'Namasevayam',   photo: '1660IMG-20220419-WA0009.jpg' },
  { name: 'Elankopan Thavalinkam',         first: 'Elankopan',     photo: '4720IMG-20220420-WA0032.jpg' },
  { name: 'Raguvaran Aravinthan',          first: 'Raguvaran',     photo: '3215IMG-20220408-WA0017.jpg' },
  { name: 'Kajenth Thanabalasingham',      first: 'Kajenth',       photo: '237279A25C56-43AC-49FA-B68D-FE810DBA9C4A.jpeg' },
  { name: 'Muralitharan Guganeshan',       first: 'Muralitharan',  photo: '4485WhatsApp Image 2022-07-03 at 10.40.58 AM.jpeg' },
  { name: 'Krishen Daniel',               first: 'Krishen',       photo: '2304IMG-20220418-WA0030.jpg' },
  { name: 'Gaajuran Ganagabalan',          first: 'Gaajuran',      photo: '4971.jpeg' },
  { name: 'Eashwaran Aravinthan',          first: 'Eashwaran',     photo: 'image0 (3).jpeg' },
  { name: 'Hrithisshan Kanendran',         first: 'Hrithisshan',   photo: '976Under 15.png' },
  { name: 'Abdul Khaliq Hakeem',           first: 'Abdul Khaliq',  photo: '6984886Under 18.png' },
  { name: 'Shenal Daniel Anthony',         first: 'Shenal',        photo: 'bc581ed9-b973-48e3-9e12-52912924f432.jpeg' },
  { name: 'Thevakumar Kanagarathinam Anton', first: 'Thevakumar', photo: '6631.jpeg' },
  { name: 'Malindu Maduranga',             first: 'Malindu',       photo: '7348.jpeg' },
  { name: 'Prayash Singh',                 first: 'Prayash',       photo: '7349.jpeg' },
  { name: 'Arivu Sasikumar',               first: 'Arivu',         photo: '7358.jpeg' },
  { name: 'Dilesh Sangaran',               first: 'Dilesh',        photo: '7361.jpeg' },
  { name: 'Inthikhab Mazeez',             first: 'Inthikhab',     photo: '7435.jpeg' },
  { name: 'Pathmajeyan Asokumar',          first: 'Pathmajeyan',   photo: '7514.jpeg' },
  { name: 'Mihin Sugeeswaran',             first: 'Mihin',         photo: '7526.jpeg' },
]

const OUR_NAMES = ['Tamil United', 'TUCC', 'Dollishill Tamil United', 'DTU']
const isOurs = (n = '') => OUR_NAMES.some(t => n.toLowerCase().includes(t.toLowerCase()))

function strip(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&dagger;/g, '†').replace(/\s+/g, ' ').trim()
}

// Match a name from scorecard to our player list
function matchPlayer(scorecardName) {
  if (!scorecardName) return null
  const lower = scorecardName.toLowerCase().trim()
  // Try exact match on full name
  let p = PLAYERS.find(pl => pl.name.toLowerCase() === lower)
  if (p) return p
  // Try first name match
  p = PLAYERS.find(pl => lower.startsWith(pl.first.toLowerCase()))
  if (p) return p
  // Try any word overlap
  const words = lower.split(/\s+/)
  p = PLAYERS.find(pl => {
    const pWords = pl.name.toLowerCase().split(/\s+/)
    return words.some(w => w.length > 3 && pWords.includes(w))
  })
  return p || null
}

// Congrats messages for batter
function batterMsg(name, runs, opponent) {
  const first = name.split(' ')[0]
  if (runs >= 100) return `Incredible century from ${first}! A stunning ${runs}-run knock against ${opponent} — truly world-class! 🏏💯`
  if (runs >= 75) return `What an innings! ${first} smashed ${runs} runs against ${opponent}, carrying the side with a brilliant display. 🌟`
  return `Outstanding batting from ${first}! A crucial ${runs} runs against ${opponent} showed real class and composure. 👏`
}

// Congrats messages for bowler
function bowlerMsg(name, wickets, economy, opponent) {
  const first = name.split(' ')[0]
  if (wickets >= 5) return `Phenomenal bowling! ${first} took a 5-wicket haul against ${opponent}, ripping through their batting lineup! 🎳🔥`
  if (wickets >= 4) return `Superb spell from ${first}! ${wickets} wickets against ${opponent} with an economy of ${economy} — outstanding! 💪`
  return `Brilliant bowling from ${first}! ${wickets} wickets against ${opponent} made a huge impact on the match result. 🎯`
}

// Parse scorecard HTML to extract batting and bowling innings
function parseScorecard(html, opponent) {
  const batters = []
  const bowlers = []

  // Find all table rows
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(m => m[0])

  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => strip(m[1]))
    if (cells.length < 4) continue

    // Batting row detection: cells[2] should be runs (a number), cells[3] balls
    // Row format: [name, how_out, runs, balls, 4s, 6s, sr]
    if (cells.length >= 5) {
      const runs = parseInt(cells[2], 10)
      const balls = parseInt(cells[3], 10)
      if (!isNaN(runs) && !isNaN(balls) && runs >= 0 && balls >= 0 && cells[0] && !/total|extras|fall|did not/i.test(cells[0])) {
        const player = matchPlayer(cells[0])
        if (player) {
          const fours = parseInt(cells[4], 10) || 0
          const sixes = parseInt(cells[5], 10) || 0
          const sr = parseFloat(cells[6]) || (balls > 0 ? Math.round(runs / balls * 100) : 0)
          batters.push({ name: player.name, displayName: `${player.first}`, photo: player.photo, runs, balls, fours, sixes, sr: Math.round(sr) })
        }
      }
    }

    // Bowling row detection: cells[4] should be wickets
    // Row format: [name, overs, maidens, runs, wickets, economy]
    if (cells.length >= 5) {
      const overs = parseFloat(cells[1])
      const wickets = parseInt(cells[4], 10)
      const runsGiven = parseInt(cells[3], 10)
      if (!isNaN(overs) && !isNaN(wickets) && !isNaN(runsGiven) && overs > 0 && cells[0] && !/total|extras/i.test(cells[0])) {
        const player = matchPlayer(cells[0])
        if (player) {
          const economy = overs > 0 ? Math.round((runsGiven / overs) * 10) / 10 : 0
          bowlers.push({ name: player.name, displayName: player.first, photo: player.photo, wickets, overs, runsGiven, economy })
        }
      }
    }
  }

  // Best batter: highest runs >= 50
  const topBatter = batters
    .filter(b => b.runs >= 50)
    .sort((a, b) => b.runs - a.runs)[0] || null

  // Best bowler: most wickets >= 3, tiebreak by economy (lower better)
  const topBowler = bowlers
    .filter(b => b.wickets >= 3)
    .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)[0] || null

  return { topBatter, topBowler }
}

// Parse results page to find latest TUCC match scorecard URL
function findLatestTUCCScorecard(html) {
  // Find all scorecard links
  const scorecardLinks = [...html.matchAll(/href='(\/website\/results\/(\d+))'/g)].map(m => m[1])
  const uniqueLinks = [...new Set(scorecardLinks)]

  // Find the TD blocks around each scorecard to identify TUCC matches
  const tdBlocks = [...html.matchAll(/<td[\s\S]*?<\/td>/gi)].map(m => strip(m[0]))

  // Find TDs that mention TUCC team names
  const tuccBlocks = tdBlocks.filter(td => isOurs(td))
  if (!tuccBlocks.length) return uniqueLinks[0] || null

  // Try to find scorecard links near TUCC mentions
  // Extract nearby text blocks containing our name + scorecard link
  const idx = html.indexOf(tuccBlocks[0])
  // Find closest scorecard link before this point
  const linksBeforeIdx = uniqueLinks.filter(link => {
    const linkIdx = html.indexOf(link)
    return linkIdx >= 0 && linkIdx <= idx + 2000
  })

  return linksBeforeIdx[linksBeforeIdx.length - 1] || uniqueLinks[0] || null
}

// Extract date + opponent from results page for a given scorecard path
function extractMatchInfo(html, scorecardPath) {
  // Find block around this scorecard link
  const linkIdx = html.indexOf(scorecardPath)
  if (linkIdx < 0) return { date: '', opponent: 'Unknown' }

  const snippet = html.substring(Math.max(0, linkIdx - 2000), linkIdx + 500)
  const strippedSnippet = strip(snippet)

  // Extract date
  const dateMatch = strippedSnippet.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/)
  const date = dateMatch ? dateMatch[1] : ''

  // Extract opponent: look for team names in TDs
  const teamMatches = [...snippet.matchAll(/([A-Z][a-zA-Z\s&'-]+(?:CC|Cricket Club|XI)[^<]*)/g)].map(m => m[1].trim())
  const opponent = teamMatches.find(t => !isOurs(t)) || 'Unknown'

  return { date, opponent: opponent.replace(/\s*-\s*(Knights?|A|B|1st XI|2nd XI)\s*$/i, '').trim() }
}

// Hardcoded fallback: last known TUCC match scorecard (31 May 2026 vs Lewisham CC)
const FALLBACK_SCORECARD = '/website/results/7504406'
const FALLBACK_DATE      = '31 May 2026'
const FALLBACK_OPPONENT  = 'Lewisham CC'

async function tryScorecard(path, date, opponent) {
  const scorecardUrl = `${BASE}${path}`
  const resp = await fetch(scorecardUrl, { headers: HEADERS })
  if (!resp.ok) throw new Error(`Scorecard HTTP ${resp.status}`)
  const html = await resp.text()
  const { topBatter, topBowler } = parseScorecard(html, opponent)
  return { scorecardUrl, date, opponent, topBatter, topBowler }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300')

  try {
    let scorecardPath = null
    let date = FALLBACK_DATE
    let opponent = FALLBACK_OPPONENT

    // Step 1: Try to get latest TUCC scorecard from results page
    try {
      const resultsResp = await fetch(RESULTS_URL, { headers: HEADERS })
      if (resultsResp.ok) {
        const resultsHtml = await resultsResp.text()
        const found = findLatestTUCCScorecard(resultsHtml)
        if (found) {
          scorecardPath = found
          const info = extractMatchInfo(resultsHtml, found)
          if (info.date) date = info.date
          if (info.opponent && info.opponent !== 'Unknown') opponent = info.opponent
        }
      }
    } catch (_) { /* fall through to hardcoded fallback */ }

    // Step 2: Use hardcoded fallback if live scrape found nothing
    if (!scorecardPath) scorecardPath = FALLBACK_SCORECARD

    // Step 3: Fetch & parse the scorecard
    const { scorecardUrl, topBatter, topBowler } = await tryScorecard(scorecardPath, date, opponent)

    const result = {
      matchDate: date,
      opponent,
      scorecardUrl,
      batter: topBatter ? {
        ...topBatter,
        photoUrl: `${PHOTO_BASE}${encodeURIComponent(topBatter.photo)}`,
        message: batterMsg(topBatter.name, topBatter.runs, opponent),
      } : null,
      bowler: topBowler ? {
        ...topBowler,
        photoUrl: `${PHOTO_BASE}${encodeURIComponent(topBowler.photo)}`,
        message: bowlerMsg(topBowler.name, topBowler.wickets, topBowler.economy, opponent),
      } : null,
      updatedAt: new Date().toISOString(),
      source: scorecardPath === FALLBACK_SCORECARD ? 'fallback' : 'live',
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('POTW error:', err.message)
    return res.status(200).json({
      matchDate: FALLBACK_DATE,
      opponent: FALLBACK_OPPONENT,
      scorecardUrl: '',
      batter: null,
      bowler: null,
      updatedAt: new Date().toISOString(),
      source: 'error',
      error: err.message,
    })
  }
}
