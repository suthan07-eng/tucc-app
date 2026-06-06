// Vercel Node.js serverless function — fetches BTCL squad + merges local stats
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BTCL_URL  = 'https://admin.btcluk.com/api/teamPlayer/286253'
const PHOTO_BASE = 'https://admin.btcluk.com/players/'

function loadStats() {
  try {
    const raw = readFileSync(join(__dirname, '../src/data/stats-2026.json'), 'utf8')
    return JSON.parse(raw)
  } catch { return { batting: [], bowling: [], fielding: [] } }
}

// Fuzzy name match — tries forename+surname and surname+forename
function matchStat(arr, forename, surname) {
  if (!arr || !arr.length) return null
  const full1 = `${forename} ${surname}`.toLowerCase().replace(/\s+/g, ' ').trim()
  const full2 = `${surname} ${forename}`.toLowerCase().replace(/\s+/g, ' ').trim()
  // Exact
  let hit = arr.find(p => {
    const n = p.name.toLowerCase().trim()
    return n === full1 || n === full2
  })
  if (hit) return hit
  // Partial — all words of forename appear in stat name
  const words = forename.toLowerCase().split(' ').filter(Boolean)
  hit = arr.find(p => {
    const n = p.name.toLowerCase()
    return words.every(w => n.includes(w))
  })
  return hit || null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300')

  const stats = loadStats()

  try {
    const r = await fetch(BTCL_URL, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://www.btcluk.com',
        'Referer': 'https://www.btcluk.com/',
      },
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const btclPlayers = await r.json()

    const players = btclPlayers.map(p => {
      const batStat  = matchStat(stats.batting,  p.Forename, p.Surname)
      const bowlStat = matchStat(stats.bowling,  p.Forename, p.Surname)
      const fieldStat = matchStat(stats.fielding, p.Forename, p.Surname)

      return {
        id:         p.PlayerID,
        forename:   p.Forename,
        surname:    p.Surname,
        name:       `${p.Forename} ${p.Surname}`,
        ageGroup:   p.AgeGroup,
        batStyle:   p.BatStyle || null,
        bowlStyle:  p.BowlStyle || null,
        playerType: p.player_type,
        photoUrl:   p.Photo ? `${PHOTO_BASE}${encodeURIComponent(p.Photo)}` : null,
        stats: {
          runs:    batStat?.runs    ?? null,
          wickets: bowlStat?.wickets ?? null,
          economy: bowlStat?.economy ?? null,
          catches: fieldStat?.catches ?? null,
        },
      }
    })

    return res.status(200).json({ players, source: 'live', updatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Players API error:', err.message)
    // Return just the stats players as fallback
    const fallback = stats.batting.map(b => ({
      id:       null,
      name:     b.name,
      forename: b.name.split(' ')[0],
      surname:  b.name.split(' ').slice(1).join(' '),
      ageGroup: 'Pro',
      batStyle: null, bowlStyle: null, playerType: 'Home', photoUrl: null,
      stats: {
        runs:    b.runs ?? null,
        wickets: stats.bowling.find(x => x.name === b.name)?.wickets ?? null,
        economy: stats.bowling.find(x => x.name === b.name)?.economy ?? null,
        catches: stats.fielding.find(x => x.name === b.name)?.catches ?? null,
      },
    }))
    return res.status(200).json({ players: fallback, source: 'fallback', updatedAt: new Date().toISOString() })
  }
}
