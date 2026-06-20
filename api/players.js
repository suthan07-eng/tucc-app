// Vercel Node.js serverless function — fetches BTCL squad + merges local stats
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BTCL_URL   = 'https://admin.btcluk.com/api/teamPlayer/286253'
const PHOTO_BASE = 'https://admin.btcluk.com/players/'

// Hardcoded fallback — synced with BTCL API on 2026-06-20
const BTCL_FALLBACK = [
  { PlayerID: 1377, Forename: 'Mohamed Nafaz', Surname: 'Mohamed Nawfer', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '4309WhatsApp Image 2022-04-27 at 5.51.37 PM.jpeg', player_type: 'Home', statName: 'Mohamed Nafaz', photoPos: 'center 72%' },
  { PlayerID: 1378, Forename: 'Gobinath', Surname: 'Navaratnam', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '90041.jpg', player_type: 'Home' },
  { PlayerID: 1383, Forename: 'Raj', Surname: 'Sorna', AgeGroup: 'Pro', BatStyle: '', BowlStyle: '', Photo: '3615Raj.jpg', player_type: 'Home' },
  { PlayerID: 1385, Forename: 'Roshan', Surname: 'Thishanthan', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: 'IMG-20240409-WA0034-removebg-preview.png', player_type: 'Home' },
  { PlayerID: 1397, Forename: 'Mahadeva', Surname: 'Amaranath', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm medium', Photo: '8625IMG-20220408-WA0011.jpg', player_type: 'Home', photoPos: 'center 55%' },
  { PlayerID: 2032, Forename: 'Abbi', Surname: 'Kanthiraj', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Off break (right-arm)', Photo: '4321IMG-20220428-WA0009.jpg', player_type: 'Home' },
  { PlayerID: 2233, Forename: 'Navaratnam', Surname: 'Ajanthan', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '5336IMG-20220411-WA0010.jpg', player_type: 'Home', displayName: 'Ajanthan Navaratnam' },
  { PlayerID: 2561, Forename: 'Harriharan', Surname: 'Aravinthan', AgeGroup: 'Under 19', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '3635IMG-20220408-WA0018.jpg', player_type: 'Home' },
  { PlayerID: 2765, Forename: 'Theepan Rajah', Surname: 'Rajasekaran', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: 'Theepan.jpeg', player_type: 'Home' },
  { PlayerID: 2843, Forename: 'Sanjiv', Surname: 'Balachandran', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '6916IMG-20220411-WA0018.jpg', player_type: 'Home' },
  { PlayerID: 2976, Forename: 'namasevayam', Surname: 'vipooshanan', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '1660IMG-20220419-WA0009.jpg', player_type: 'Home' },
  { PlayerID: 3292, Forename: 'ELANKOPAN', Surname: 'THAVALINKAM', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '4720IMG-20220420-WA0032.jpg', player_type: 'Home' },
  { PlayerID: 3826, Forename: 'RAGUVARAN', Surname: 'ARAVINTHAN', AgeGroup: 'Under 15', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '3215IMG-20220408-WA0017.jpg', player_type: 'Home' },
  { PlayerID: 4342, Forename: 'Kajenth', Surname: 'Thanabalasingham', AgeGroup: 'Pro', BatStyle: 'Left Hand', BowlStyle: 'Left-arm fast', Photo: '237279A25C56-43AC-49FA-B68D-FE810DBA9C4A.jpeg', player_type: 'Home' },
  { PlayerID: 4434, Forename: 'muralitharan', Surname: 'guganeshan', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '4485WhatsApp Image 2022-07-03 at 10.40.58 AM.jpeg', player_type: 'Home' },
  { PlayerID: 4927, Forename: 'Daniel', Surname: 'Krishen', AgeGroup: 'Under 19', BatStyle: 'Left Hand', BowlStyle: 'Slow left-arm orthodox', Photo: '2304IMG-20220418-WA0030.jpg', player_type: 'Home', displayName: 'Krishen Daniel', statName: 'Krishen Daniel' },
  { PlayerID: 4971, Forename: 'Gaajuran', Surname: 'ganagabalan', AgeGroup: 'Under 19', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '4971.jpeg', player_type: 'Home' },
  { PlayerID: 5099, Forename: 'Eashwaran', Surname: 'Aravinthan', AgeGroup: 'Under 15', BatStyle: 'Right Hand', BowlStyle: 'Slow left-arm orthodox', Photo: 'image0 (3).jpeg', player_type: 'Home' },
  { PlayerID: 5299, Forename: 'Hrithisshan', Surname: 'Kanendran', AgeGroup: 'Under 15', BatStyle: 'Left Hand', BowlStyle: 'Right-arm medium', Photo: '976Under 15.png', player_type: 'Home' },
  { PlayerID: 5375, Forename: 'Abdul Khaliq ', Surname: 'Hakeem', AgeGroup: 'Under 15', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '6984886Under 18.png', player_type: 'Home' },
  { PlayerID: 6296, Forename: 'Daniel', Surname: 'Anthony Shenal', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: 'bc581ed9-b973-48e3-9e12-52912924f432.jpeg', player_type: 'Home Player', displayName: 'Shenal Daniel Anthony', statName: 'Shenal Daniel' },
  { PlayerID: 6631, Forename: 'Thevakumar', Surname: 'Kanagarathinam Anton', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '6631.jpeg', player_type: 'Home Player', statName: 'Thevakumar Kanagarathinam Anton' },
  { PlayerID: 7349, Forename: 'Prayash', Surname: 'Singh', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Off break (right-arm)', Photo: '7349.jpeg', player_type: 'Overseas Player' },
  { PlayerID: 7361, Forename: 'Dilesh', Surname: 'Sangaran', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '7361.jpeg', player_type: 'Home Player', photoPos: 'center 62%' },
  { PlayerID: 7435, Forename: 'Inthikhab', Surname: 'Mazeez', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '7435.jpeg', player_type: 'Home Player', photoPos: 'center 22%' },
  { PlayerID: 7514, Forename: 'Pathmajeyan', Surname: 'Asokumar', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '7514.jpeg', player_type: 'Home Player' },
  { PlayerID: 7526, Forename: 'Mihin', Surname: 'Sugeeswaran', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '7526.jpeg', player_type: 'Home Player' },
  { PlayerID: 7571, Forename: 'Himesh Hewage', Surname: 'Ramanayake', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '7571.jpeg', player_type: 'Overseas Player' },
]

function loadStats() {
  try {
    const raw = readFileSync(join(__dirname, '../src/data/stats-2026.json'), 'utf8')
    return JSON.parse(raw)
  } catch { return { batting: [], bowling: [], fielding: [] } }
}

// Words too common to be a reliable match signal (appear in many Tamil/Muslim names)
const COMMON_WORDS = new Set(['mohamed', 'daniel', 'anton', 'kumar', 'raj'])

// Fuzzy name match — tries forename+surname and surname+forename
// Pass statName=null  → always return null (no stats for this player)
// Pass statName=string → exact lookup by that name only
// Pass statName=undefined → fuzzy auto-match
function matchStat(arr, forename, surname, statName) {
  if (!arr || !arr.length) return null
  // Explicit override: null = no stats, string = exact name in stats
  if (statName === null) return null
  if (typeof statName === 'string') {
    return arr.find(p => p.name.toLowerCase().trim() === statName.toLowerCase().trim()) || null
  }
  const full1 = `${forename} ${surname}`.toLowerCase().replace(/\s+/g, ' ').trim()
  const full2 = `${surname} ${forename}`.toLowerCase().replace(/\s+/g, ' ').trim()
  // 1. Exact full-name match (both orderings)
  let hit = arr.find(p => {
    const n = p.name.toLowerCase().trim()
    return n === full1 || n === full2
  })
  if (hit) return hit
  // 2. Stricter partial — require at least one UNIQUE (non-common) meaningful word
  //    from EACH of forename AND surname to appear in the stat name.
  //    Filters out common words like "Mohamed", "Daniel" that cause false positives.
  const fnWords = forename.toLowerCase().split(' ').filter(w => w.length > 2 && !COMMON_WORDS.has(w))
  const snWords = surname.toLowerCase().split(' ').filter(w => w.length > 2 && !COMMON_WORDS.has(w))
  if (fnWords.length > 0 && snWords.length > 0) {
    hit = arr.find(p => {
      const n = p.name.toLowerCase()
      const fnOk = fnWords.some(w => n.includes(w))
      const snOk = snWords.some(w => n.includes(w))
      return fnOk && snOk
    })
    if (hit) return hit
  }
  return null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  // 5-min CDN cache + serve stale for 60s while revalidating → squad changes appear within ~5 min
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')

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

    // Build a displayName lookup from the fallback overrides so the live API also
    // uses friendly names for players whose BTCL Forename/Surname are swapped/formal.
    const DISPLAY_OVERRIDES = {}
    const STAT_OVERRIDES    = {}
    for (const fb of BTCL_FALLBACK) {
      if (fb.displayName) DISPLAY_OVERRIDES[fb.PlayerID] = fb.displayName
      if (fb.statName !== undefined) STAT_OVERRIDES[fb.PlayerID] = fb.statName
    }

    const players = btclPlayers.map(p => {
      const displayName = DISPLAY_OVERRIDES[p.PlayerID] || `${p.Forename} ${p.Surname}`
      // Normalize casing (some BTCL names are ALL CAPS or all lower)
      const name = displayName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      const statName = p.PlayerID in STAT_OVERRIDES ? STAT_OVERRIDES[p.PlayerID] : undefined
      const batStat   = matchStat(stats.batting,  p.Forename, p.Surname, statName)
      const bowlStat  = matchStat(stats.bowling,  p.Forename, p.Surname, statName)
      const fieldStat = matchStat(stats.fielding, p.Forename, p.Surname, statName)

      return {
        id:         p.PlayerID,
        forename:   p.Forename,
        surname:    p.Surname,
        name,
        ageGroup:   p.AgeGroup,
        batStyle:   p.BatStyle || null,
        bowlStyle:  p.BowlStyle || null,
        playerType: p.player_type,
        photoUrl:   p.Photo ? `${PHOTO_BASE}${encodeURIComponent(p.Photo)}` : null,
        photoPos:   p.photoPos || null,
        stats: {
          matches: batStat?.matches ?? bowlStat?.matches ?? fieldStat?.matches ?? null,
          runs:    batStat?.runs    ?? null,
          innings: batStat?.innings ?? null,
          highest: batStat?.highest ?? null,
          average: batStat?.average ?? null,
          wickets: bowlStat?.wickets ?? null,
          economy: bowlStat?.economy ?? null,
          bestWkt: bowlStat?.best_wickets ?? null,
          catches: fieldStat?.catches ?? null,
        },
      }
    })

    return res.status(200).json({ players, source: 'live', updatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Players API error:', err.message)
    // Use hardcoded BTCL data + local stats as fallback
    const players = BTCL_FALLBACK.map(p => {
      const rawName = p.displayName || `${p.Forename} ${p.Surname}`
      const name = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      const batStat   = matchStat(stats.batting,  p.Forename, p.Surname, p.statName)
      const bowlStat  = matchStat(stats.bowling,  p.Forename, p.Surname, p.statName)
      const fieldStat = matchStat(stats.fielding, p.Forename, p.Surname, p.statName)
      return {
        id:         p.PlayerID,
        forename:   p.Forename,
        surname:    p.Surname,
        name,
        ageGroup:   p.AgeGroup,
        batStyle:   p.BatStyle || null,
        bowlStyle:  p.BowlStyle || null,
        playerType: p.player_type,
        photoUrl:   p.Photo ? `${PHOTO_BASE}${encodeURIComponent(p.Photo)}` : null,
        photoPos:   p.photoPos || null,
        stats: {
          matches: batStat?.matches ?? bowlStat?.matches ?? fieldStat?.matches ?? null,
          runs:    batStat?.runs    ?? null,
          innings: batStat?.innings ?? null,
          highest: batStat?.highest ?? null,
          average: batStat?.average ?? null,
          wickets: bowlStat?.wickets ?? null,
          economy: bowlStat?.economy ?? null,
          bestWkt: bowlStat?.best_wickets ?? null,
          catches: fieldStat?.catches ?? null,
        },
      }
    })
    return res.status(200).json({ players, source: 'fallback', updatedAt: new Date().toISOString() })
  }
}
