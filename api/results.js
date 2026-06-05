// Vercel Node.js serverless function — fetches BTCL last 10 results with logos + scorecard links

const BASE_URL = 'https://dtucc.play-cricket.com'
const RESULTS_URL = `${BASE_URL}/website/division/137680?type=last_10_results`

const FALLBACK = [
  { date: '31 May 2026', winner: 'Lewisham CC', margin: '3 wickets',  team1: 'Dollishill Tamil United CC - Knights', score1: '213/8 (40.0)',       pts1: '8',  logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',  team2: 'Lewisham CC - A',    score2: '217/7 (33.0)',       pts2: '20', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/11733/lcc_logo1.JPG',  scorecardUrl: '/website/results/7504406' },
  { date: '31 May 2026', winner: 'Northerns CC', margin: '6 wickets', team1: 'Northerns CC - A',   score1: '105/4 (17.1)',       pts1: '20', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg', team2: 'Kent United CC - 1st XI',  score2: '103/All out (27.3)', pts2: '4',  logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16346/KENT_UNITED_CC_mockup_new__1_.jpg', scorecardUrl: '/website/results/7504405' },
  { date: '31 May 2026', winner: 'Northerns CC', margin: '7 wickets', team1: 'Redbridge Lankians Sports & Social Club CC - 1st XI', score1: '138/All out (36.4)', pts1: '4', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/8492/logo.jpg', team2: 'Northerns CC - B', score2: '139/3 (29.3)', pts2: '20', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg', scorecardUrl: '/website/results/7504408' },
  { date: '24 May 2026', winner: 'Stanly CC',    margin: '54 runs',   team1: 'Stanly CC - A',      score1: '261/All out (39.5)', pts1: '20', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16364/7E8264ED-7826-4974-9CEF-2D36D2116E39.jpeg', team2: 'West 3 CC - 1st XI', score2: '207/9 (40.0)', pts2: '10', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16343/w3.JPG', scorecardUrl: '/website/results/7504407' },
  { date: '24 May 2026', winner: 'Northerns CC', margin: '250 runs',  team1: 'Dollishill Tamil United CC - Knights', score1: '201/All out (23.4)', pts1: '7', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png', team2: 'Northerns CC - A', score2: '451/4 (40.0)', pts2: '20', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg', scorecardUrl: '/website/results/7504401' },
  { date: '24 May 2026', winner: 'Kent United CC', margin: '4 wickets', team1: 'Kent United CC - 1st XI', score1: '172/6 (33.0)', pts1: '20', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16346/KENT_UNITED_CC_mockup_new__1_.jpg', team2: 'West 3 CC - 1st XI', score2: '169/8 (40.0)', pts2: '7', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16343/w3.JPG', scorecardUrl: '/website/results/7504402' },
  { date: '17 May 2026', winner: 'Lewisham CC',  margin: '254 runs',  team1: 'Lewisham CC - A',    score1: '386/7 (40.0)',       pts1: '20', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/11733/lcc_logo1.JPG', team2: 'Redbridge Lankians Sports & Social Club CC - 1st XI', score2: '132/All out (27.1)', pts2: '6', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/8492/logo.jpg', scorecardUrl: '/website/results/7504403' },
  { date: '17 May 2026', winner: 'Stanly CC',    margin: '9 wickets', team1: 'Stanly CC - A',      score1: '159/1 (16.5)',       pts1: '20', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16364/7E8264ED-7826-4974-9CEF-2D36D2116E39.jpeg', team2: 'Northerns CC - B', score2: '158/All out (40.0)', pts2: '3', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg', scorecardUrl: '/website/results/7504404' },
  { date: '17 May 2026', winner: 'Northerns CC', margin: '74 runs',   team1: 'Northerns CC - B',   score1: '222/All out (38.2)', pts1: '20', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg', team2: 'Kent United CC - 1st XI', score2: '148/All out (31.3)', pts2: '8', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16346/KENT_UNITED_CC_mockup_new__1_.jpg', scorecardUrl: '/website/results/7504399' },
  { date: '17 May 2026', winner: 'Redbridge Lankians CC', margin: '8 wickets', team1: 'Redbridge Lankians Sports & Social Club CC - 1st XI', score1: '153/2 (22.0)', pts1: '20', logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/8492/logo.jpg', team2: 'Dollishill Tamil United CC - Knights', score2: '208/All out (39.2)', pts2: '6', logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png', scorecardUrl: '/website/results/7504398' },
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

function parseResults(html) {
  const results = []

  // Extract dates
  const dateMatches = [...html.matchAll(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/g)]
  const dates = dateMatches.map(m => m[1])

  // Extract scorecard links
  const scorecardLinks = [...html.matchAll(/href='(\/website\/results\/(\d+))'/g)].map(m => m[1])
  // Deduplicate (each appears twice)
  const uniqueLinks = [...new Set(scorecardLinks)]

  // Extract badge images
  const badgeImgs = [...html.matchAll(/src="(https:\/\/s3[^"]+badge_image\/\d+\/[^"]+)"/g)].map(m => m[1])

  // Extract TDs (3 per match: team1+score, pts display, team2+score)
  const tdRe = /<td[\s\S]*?>([\s\S]*?)<\/td>/gi
  const tds = []
  let m
  while ((m = tdRe.exec(html)) !== null) {
    const text = strip(m[1])
    if (text) tds.push(text)
  }

  let logoIdx = 0

  for (let i = 0; i < tds.length - 2; i += 3) {
    const td0 = tds[i]
    const td1 = tds[i + 1]
    const td2 = tds[i + 2]

    if (!td0.includes('WON BY') && !td0.includes('TIED') && !td0.includes('NO RESULT')) continue

    const matchIdx = results.length

    // Parse winner + margin
    const wonIdx = td0.indexOf(' WON BY ')
    const winnerRaw = wonIdx >= 0 ? td0.substring(0, wonIdx) : ''
    const marginMatch = td0.match(/WON BY\s+([^0-9]+?)(?=\s+\d+\s+pts)/)
    const margin = marginMatch ? marginMatch[1].trim().toLowerCase() : ''

    // Parse team1 + score (from td0 after margin)
    const afterMargin = td0.replace(/^[\s\S]*?WON BY\s+[^0-9]*?/, '')
    const t1m = afterMargin.match(/(\d+)\s+pts\s+(.+?)\s+(\d+\s*\/\s*(?:All\s*out|\d+)\s*\([\d.]+\))/)
    const pts1   = t1m ? t1m[1] : ''
    const team1  = t1m ? t1m[2].trim() : ''
    const score1 = t1m ? t1m[3].replace(/\s+/g, '') : ''

    // Parse team2 + score (from td2)
    const t2m = td2.match(/(\d+)\s+pts\s+(.+?)\s+(\d+\s*\/\s*(?:All\s*out|\d+)\s*\([\d.]+\))/)
    const pts2   = t2m ? t2m[1] : ''
    const team2  = t2m ? t2m[2].trim() : ''
    const score2 = t2m ? t2m[3].replace(/\s+/g, '') : ''

    // Assign logos (pairs of 2 per match, some nav logos at start to skip)
    // Skip first 2 which are nav/header logos
    const logoOffset = 2
    const logo1 = badgeImgs[logoOffset + logoIdx * 2]     || ''
    const logo2 = badgeImgs[logoOffset + logoIdx * 2 + 1] || ''
    logoIdx++

    // Assign date (3 results per round)
    const dateIdx = Math.floor(matchIdx / 3)
    const date = dates[dateIdx] || ''

    // Scorecard URL
    const scorecardUrl = uniqueLinks[matchIdx] ? `${BASE_URL}${uniqueLinks[matchIdx]}` : ''

    results.push({ date, winner: winnerRaw, margin, team1, score1, pts1, logo1, team2, score2, pts2, logo2, scorecardUrl })
  }

  return results
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')

  try {
    const response = await fetch(RESULTS_URL, { headers: HEADERS })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const html = await response.text()
    const results = parseResults(html)

    if (results.length > 0) {
      return res.status(200).json({ results, updatedAt: new Date().toISOString(), source: 'live' })
    }
    return res.status(200).json({ results: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  } catch (err) {
    console.error('Results error:', err.message)
    return res.status(200).json({ results: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  }
}
