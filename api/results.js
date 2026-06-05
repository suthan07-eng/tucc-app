// Vercel Node.js serverless function — fetches BTCL last 10 results
const URL = 'https://dtucc.play-cricket.com/website/division/137680?type=last_10_results'

// Fallback hardcoded results (last known)
const FALLBACK = [
  { date: '31 May 2026', winner: 'Lewisham CC', margin: '3 wickets',  team1: 'Dollishill Tamil United CC - Knights', score1: '213/8 (40.0)',       pts1: '8',  team2: 'Lewisham CC - A',                                       score2: '217/7 (33.0)',       pts2: '20' },
  { date: '31 May 2026', winner: 'Northerns CC', margin: '6 wickets', team1: 'Northerns CC - A',                    score1: '105/4 (17.1)',       pts1: '20', team2: 'Kent United CC - 1st XI',                                  score2: '103/all out (27.3)', pts2: '4'  },
  { date: '31 May 2026', winner: 'Northerns CC', margin: '7 wickets', team1: 'Redbridge Lankians CC - 1st XI',      score1: '138/all out (36.4)', pts1: '4',  team2: 'Northerns CC - B',                                        score2: '139/3 (29.3)',       pts2: '20' },
  { date: '24 May 2026', winner: 'Stanly CC',    margin: '54 runs',   team1: 'Stanly CC - A',                      score1: '261/all out (39.5)', pts1: '20', team2: 'West 3 CC - 1st XI',                                      score2: '207/9 (40.0)',       pts2: '10' },
  { date: '24 May 2026', winner: 'Northerns CC', margin: '250 runs',  team1: 'Dollishill Tamil United CC - Knights', score1: '201/all out (23.4)', pts1: '7', team2: 'Northerns CC - A',                                       score2: '451/4 (40.0)',       pts2: '20' },
  { date: '24 May 2026', winner: 'Kent United CC', margin: '4 wickets', team1: 'Kent United CC - 1st XI',          score1: '172/6 (33.0)',       pts1: '20', team2: 'West 3 CC - 1st XI',                                      score2: '169/8 (40.0)',       pts2: '7'  },
  { date: '17 May 2026', winner: 'Lewisham CC',  margin: '254 runs',  team1: 'Lewisham CC - A',                    score1: '386/7 (40.0)',       pts1: '20', team2: 'Redbridge Lankians Sports & Social Club CC - 1st XI',      score2: '132/all out (27.1)', pts2: '6'  },
  { date: '17 May 2026', winner: 'Stanly CC',    margin: '9 wickets', team1: 'Stanly CC - A',                      score1: '159/1 (16.5)',       pts1: '20', team2: 'Northerns CC - B',                                        score2: '158/all out (40.0)', pts2: '3'  },
  { date: '17 May 2026', winner: 'Northerns CC', margin: '74 runs',   team1: 'Northerns CC - B',                   score1: '222/all out (38.2)', pts1: '20', team2: 'Kent United CC - 1st XI',                                  score2: '148/all out (31.3)', pts2: '8'  },
  { date: '17 May 2026', winner: 'Redbridge Lankians CC', margin: '8 wickets', team1: 'Redbridge Lankians Sports & Social Club CC - 1st XI', score1: '153/2 (22.0)', pts1: '20', team2: 'Dollishill Tamil United CC - Knights', score2: '208/all out (39.2)', pts2: '6' },
]

function parseResults(html) {
  const results = []

  // Extract dates from the page
  const dateMatches = [...html.matchAll(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/g)]
  const dates = dateMatches.map(m => m[1])

  // Extract all TDs
  const tdRe = /<td[\s\S]*?>([\s\S]*?)<\/td>/gi
  const tds = []
  let m
  while ((m = tdRe.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
    if (text) tds.push(text)
  }

  // Group into sets of 3 (each match = 3 TDs)
  for (let i = 0; i < tds.length - 2; i += 3) {
    const td0 = tds[i]
    const td1 = tds[i + 1]
    const td2 = tds[i + 2]

    if (!td0.includes('WON BY') && !td0.includes('TIED') && !td0.includes('NO RESULT')) continue

    // Parse TD0: "{WINNER} WON BY {MARGIN}  {pts1} pts  {Team1}  {Score1}"
    const wonByIdx = td0.indexOf(' WON BY ')
    const winnerRaw = wonByIdx >= 0 ? td0.substring(0, wonByIdx) : ''

    const marginMatch = td0.match(/WON BY\s+([^0-9]+?)(?=\s+\d+\s+pts)/)
    const margin = marginMatch ? marginMatch[1].trim().toLowerCase() : ''

    // Everything after "WON BY {margin}  {pts1} pts " is team1 + score1
    const afterMargin = td0.replace(/^.+?WON BY\s+[^0-9]+?/, '')
    const team1Match = afterMargin.match(/(\d+)\s+pts\s+(.+?)\s+(\d+\s*\/\s*(?:All out|\d+)\s*\([\d.]+\))/)
    const pts1   = team1Match ? team1Match[1] : ''
    const team1  = team1Match ? team1Match[2].trim() : ''
    const score1 = team1Match ? team1Match[3].trim().replace(/\s+/g, '') : ''

    // Parse TD2: "{pts2} pts {Team2} {Score2}"
    const team2Match = td2.match(/(\d+)\s+pts\s+(.+?)\s+(\d+\s*\/\s*(?:All out|\d+)\s*\([\d.]+\))/)
    const pts2   = team2Match ? team2Match[1] : ''
    const team2  = team2Match ? team2Match[2].trim() : ''
    const score2 = team2Match ? team2Match[3].trim().replace(/\s+/g, '') : ''

    // Assign date by index (3 results per date round typically)
    const matchIndex = results.length
    const dateIndex = Math.floor(matchIndex / 3)
    const date = dates[dateIndex] || dates[dates.length - 1] || ''

    // Title-case the winner name
    const winner = winnerRaw.replace(/\b\w/g, c => c.toUpperCase()).replace(/\bBy\b/g, 'by').trim()

    results.push({ date, winner, margin, team1, score1, pts1, team2, score2, pts2 })
  }

  return results
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')

  try {
    const response = await fetch(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Connection': 'keep-alive',
      },
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const html = await response.text()
    const results = parseResults(html)

    if (results.length > 0) {
      return res.status(200).json({ results, updatedAt: new Date().toISOString(), source: 'live' })
    }
    return res.status(200).json({ results: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  } catch (err) {
    console.error('Results fetch error:', err.message)
    return res.status(200).json({ results: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  }
}
