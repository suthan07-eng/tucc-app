// Vercel Node.js serverless function — fetches BTCL squad + merges local stats
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BTCL_URL   = 'https://admin.btcluk.com/api/teamPlayer/286253'
const PHOTO_BASE = 'https://admin.btcluk.com/players/'

// Hardcoded fallback — all 29 players scraped from BTCL on 2026-06-06
const BTCL_FALLBACK = [
  { PlayerID: 1377, Forename: 'Mohamed Nafaz', Surname: 'Mohamed Nawfer', AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast', Photo: '4309WhatsApp Image 2022-04-27 at 5.51.37 PM.jpeg', player_type: 'Home' },
  { PlayerID: 1378, Forename: 'Gobinath',       Surname: 'Navaratnam',         AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '90041.jpg',                                          player_type: 'Home' },
  { PlayerID: 1383, Forename: 'Raj',            Surname: 'Sorna',               AgeGroup: 'Pro', BatStyle: '',           BowlStyle: '',                          Photo: '3615Raj.jpg',                                        player_type: 'Home' },
  { PlayerID: 1385, Forename: 'Roshan',         Surname: 'Thishanthan',         AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: 'IMG-20240409-WA0034-removebg-preview.png',            player_type: 'Home' },
  { PlayerID: 1397, Forename: 'Mahadeva',       Surname: 'Amaranath',           AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm medium',        Photo: '8625IMG-20220408-WA0011.jpg',                         player_type: 'Home' },
  { PlayerID: 2032, Forename: 'Abbi',           Surname: 'Kanthiraj',           AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Off break (right-arm)',    Photo: '4321IMG-20220428-WA0009.jpg',                         player_type: 'Home' },
  { PlayerID: 2233, Forename: 'Ajanthan',       Surname: 'Navaratnam',          AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '5336IMG-20220411-WA0010.jpg',                         player_type: 'Home' },
  { PlayerID: 2561, Forename: 'Harriharan',     Surname: 'Aravinthan',          AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '3635IMG-20220408-WA0018.jpg',                         player_type: 'Home' },
  { PlayerID: 2765, Forename: 'Theepan Rajah',  Surname: 'Rajasekaran',         AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: 'Theepan.jpeg',                                       player_type: 'Home' },
  { PlayerID: 2843, Forename: 'Sanjiv',         Surname: 'Balachandran',        AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '6916IMG-20220411-WA0018.jpg',                         player_type: 'Home' },
  { PlayerID: 2976, Forename: 'Namasevayam',    Surname: 'Vipooshanan',         AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '1660IMG-20220419-WA0009.jpg',                         player_type: 'Home' },
  { PlayerID: 3292, Forename: 'Elankopan',      Surname: 'Thavalinkam',         AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '4720IMG-20220420-WA0032.jpg',                         player_type: 'Home' },
  { PlayerID: 3826, Forename: 'Raguvaran',      Surname: 'Aravinthan',          AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '3215IMG-20220408-WA0017.jpg',                         player_type: 'Home' },
  { PlayerID: 4342, Forename: 'Kajenth',        Surname: 'Thanabalasingham',    AgeGroup: 'Pro', BatStyle: 'Left Hand',  BowlStyle: 'Left-arm fast',            Photo: '237279A25C56-43AC-49FA-B68D-FE810DBA9C4A.jpeg',       player_type: 'Home' },
  { PlayerID: 4434, Forename: 'Muralitharan',   Surname: 'Guganeshan',          AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '4485WhatsApp Image 2022-07-03 at 10.40.58 AM.jpeg',   player_type: 'Home' },
  { PlayerID: 4927, Forename: 'Krishen',        Surname: 'Daniel',              AgeGroup: 'Pro', BatStyle: 'Left Hand',  BowlStyle: 'Slow left-arm orthodox',   Photo: '2304IMG-20220418-WA0030.jpg',                         player_type: 'Home' },
  { PlayerID: 4971, Forename: 'Gaajuran',       Surname: 'Ganagabalan',         AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '4971.jpeg',                                          player_type: 'Home' },
  { PlayerID: 5099, Forename: 'Eashwaran',      Surname: 'Aravinthan',          AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Slow left-arm orthodox',   Photo: 'image0 (3).jpeg',                                    player_type: 'Home' },
  { PlayerID: 5299, Forename: 'Hrithisshan',    Surname: 'Kanendran',           AgeGroup: 'Pro', BatStyle: 'Left Hand',  BowlStyle: 'Right-arm medium',         Photo: '976Under 15.png',                                    player_type: 'Home' },
  { PlayerID: 5375, Forename: 'Abdul Khaliq',   Surname: 'Hakeem',              AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '6984886Under 18.png',                                 player_type: 'Home' },
  { PlayerID: 6296, Forename: 'Shenal',         Surname: 'Daniel Anthony',      AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: 'bc581ed9-b973-48e3-9e12-52912924f432.jpeg',           player_type: 'Home' },
  { PlayerID: 6631, Forename: 'Thevakumar',     Surname: 'Kanagarathinam Anton',AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '6631.jpeg',                                          player_type: 'Home' },
  { PlayerID: 7348, Forename: 'Malindu',        Surname: 'Maduranga',           AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Off break (right-arm)',    Photo: '7348.jpeg',                                          player_type: 'Home' },
  { PlayerID: 7349, Forename: 'Prayash',        Surname: 'Singh',               AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Off break (right-arm)',    Photo: '7349.jpeg',                                          player_type: 'Home' },
  { PlayerID: 7358, Forename: 'Arivu',          Surname: 'Sasikumar',           AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '7358.jpeg',                                          player_type: 'Home' },
  { PlayerID: 7361, Forename: 'Dilesh',         Surname: 'Sangaran',            AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '7361.jpeg',                                          player_type: 'Home' },
  { PlayerID: 7435, Forename: 'Inthikhab',      Surname: 'Mazeez',              AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '7435.jpeg',                                          player_type: 'Home' },
  { PlayerID: 7514, Forename: 'Pathmajeyan',    Surname: 'Asokumar',            AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '7514.jpeg',                                          player_type: 'Home' },
  { PlayerID: 7526, Forename: 'Mihin',          Surname: 'Sugeeswaran',         AgeGroup: 'Pro', BatStyle: 'Right Hand', BowlStyle: 'Right-arm fast',           Photo: '7526.jpeg',                                          player_type: 'Home' },
]

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
  // 1. Exact full-name match (both orderings)
  let hit = arr.find(p => {
    const n = p.name.toLowerCase().trim()
    return n === full1 || n === full2
  })
  if (hit) return hit
  // 2. Stricter partial — require at least one meaningful word from EACH of
  //    forename AND surname to appear in the stat name.
  //    This prevents short/common words (e.g. "Raj") matching unrelated names.
  const fnWords = forename.toLowerCase().split(' ').filter(w => w.length > 2)
  const snWords = surname.toLowerCase().split(' ').filter(w => w.length > 2)
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
    // Use hardcoded BTCL data + local stats as fallback
    const players = BTCL_FALLBACK.map(p => {
      const batStat   = matchStat(stats.batting,  p.Forename, p.Surname)
      const bowlStat  = matchStat(stats.bowling,  p.Forename, p.Surname)
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
    return res.status(200).json({ players, source: 'fallback', updatedAt: new Date().toISOString() })
  }
}
