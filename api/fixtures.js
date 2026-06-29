// Vercel Node.js serverless function — scrapes BTCL fixtures from play-cricket

const BASE_URL = 'https://dtucc.play-cricket.com'
const FIXTURES_URL = `${BASE_URL}/Matches?tab=Fixture`

const FALLBACK = [
  {
    date: 'Sunday 28 June 2026', time: '13:00',
    venue: 'North Mymms Cricket Club Ground, Home Farm, Welham Green, North Mymms Park, Brookmans Park, Hertfordshire AL9 7TR',
    team1: 'Stanly CC - A',
    logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16364/7E8264ED-7826-4974-9CEF-2D36D2116E39.jpeg',
    team2: 'Dollishill Tamil United CC - Knights',
    logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',
  },
  {
    date: 'Sunday 05 July 2026', time: '13:00',
    venue: 'Harrow Town Cricket Club, Rayners Lane, Harrow HA2 9TY',
    team1: 'Dollishill Tamil United CC - Knights',
    logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',
    team2: 'Redbridge Lankians Sports & Social Club CC - 1st XI',
    logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/8492/logo.jpg',
  },
  {
    date: 'Sunday 12 July 2026', time: '13:00',
    venue: 'Tentelow Cricket Club, Tentelow Lane, Osterley, Middlesex, UB2 4LW',
    team1: 'Northerns CC - A',
    logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg',
    team2: 'Dollishill Tamil United CC - Knights',
    logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',
  },
  {
    date: 'Sunday 19 July 2026', time: '13:00',
    venue: 'Orpington Cricket Club',
    team1: 'Lewisham CC - A',
    logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/11733/lcc_logo1.JPG',
    team2: 'Dollishill Tamil United CC - Knights',
    logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',
  },
  {
    date: 'Sunday 26 July 2026', time: '13:00',
    venue: 'Harrow Town Cricket Club, Rayners Lane, Harrow HA2 9TY',
    team1: 'Dollishill Tamil United CC - Knights',
    logo1: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',
    team2: 'Northerns CC - B',
    logo2: 'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg',
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300')

  try {
    const response = await fetch(FIXTURES_URL, { headers: HEADERS })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const html = await response.text()
    const fixtures = parseFixtures(html)

    if (fixtures.length > 0) {
      return res.status(200).json({ fixtures, updatedAt: new Date().toISOString(), source: 'live' })
    }
    return res.status(200).json({ fixtures: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  } catch (err) {
    console.error('Fixtures error:', err.message)
    return res.status(200).json({ fixtures: FALLBACK, updatedAt: new Date().toISOString(), source: 'fallback' })
  }
}
