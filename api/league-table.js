// Vercel Node.js serverless function — fetches BTCL league table
// Uses full browser headers to avoid bot-blocking

const PLAY_CRICKET_URL = 'https://dtucc.play-cricket.com/website/division/137680'

// Hardcoded fallback in case scraping fails (update manually if needed)
const FALLBACK_TEAMS = [
  { pos: 1, team: 'Stanly CC - A',                                         p: '5', w: '5', l: '0', bp: '2',  nrr: '2.94',  pts: '98' },
  { pos: 2, team: 'Northerns CC - A',                                       p: '5', w: '4', l: '1', bp: '0',  nrr: '2.67',  pts: '87' },
  { pos: 3, team: 'Lewisham CC - A',                                        p: '5', w: '3', l: '1', bp: '0',  nrr: '1.95',  pts: '77' },
  { pos: 4, team: 'Northerns CC - B',                                       p: '5', w: '3', l: '2', bp: '0',  nrr: '0.49',  pts: '73' },
  { pos: 5, team: 'Kent United CC - 1st XI',                                p: '5', w: '2', l: '2', bp: '0',  nrr: '-0.43', pts: '62' },
  { pos: 6, team: 'West 3 CC - 1st XI',                                    p: '5', w: '1', l: '4', bp: '2',  nrr: '-2.10', pts: '47' },
  { pos: 7, team: 'Redbridge Lankians Sports & Social Club CC - 1st XI',   p: '5', w: '1', l: '4', bp: '0',  nrr: '-2.58', pts: '46' },
  { pos: 8, team: 'Dollishill Tamil United CC - Knights',                   p: '5', w: '0', l: '5', bp: '0',  nrr: '-2.85', pts: '33' },
]

function parseTable(html) {
  const teams = []
  // Match each <tr>...</tr>
  const rowRe = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi
  let rowMatch
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const rowHtml = rowMatch[1]
    // Extract all <td> cell contents
    const cells = []
    const tdRe = /<td[\s\S]*?>([\s\S]*?)<\/td>/gi
    let tdMatch
    while ((tdMatch = tdRe.exec(rowHtml)) !== null) {
      // Strip all HTML tags and normalise whitespace
      const text = tdMatch[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
      cells.push(text)
    }
    if (cells.length >= 14) {
      const pos = parseInt(cells[0], 10)
      if (!isNaN(pos) && pos >= 1 && pos <= 20) {
        teams.push({
          pos,
          team: cells[1],
          p:    cells[2],
          w:    cells[3],
          l:    cells[4],
          bp:   cells[11],
          nrr:  cells[12],
          pts:  cells[13],
        })
      }
    }
  }
  return teams
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')

  try {
    const response = await fetch(PLAY_CRICKET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const teams = parseTable(html)

    if (teams.length > 0) {
      return res.status(200).json({ teams, updatedAt: new Date().toISOString(), source: 'live' })
    }

    // Parsing succeeded but no teams found — use fallback
    return res.status(200).json({ teams: FALLBACK_TEAMS, updatedAt: new Date().toISOString(), source: 'fallback' })

  } catch (err) {
    console.error('League table fetch error:', err.message)
    // Always return the fallback so the UI never breaks
    return res.status(200).json({ teams: FALLBACK_TEAMS, updatedAt: new Date().toISOString(), source: 'fallback' })
  }
}
