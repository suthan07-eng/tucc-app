// Vercel serverless — BTCL squad list + season stats from the scorecard-derived
// player_stats table (matched by BTCL PlayerID, then robust name). Replaces the
// old Excel-file stats source so the profile card, Players page and Stats page
// all show the SAME scorecard numbers.

const BTCL_URL   = 'https://admin.btcluk.com/api/teamPlayer/286253'
const PHOTO_BASE = 'https://admin.btcluk.com/players/'
const SUPABASE_URL = 'https://nrbuweeexnoofitznffo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDE2NzUsImV4cCI6MjA5NDI3NzY3NX0.rbzJIdXFbj7XrumesA1kFRZ3mp4VJO22QYEMbGuUYFE'

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

// ── Season stats from the scorecard table ────────────────────────────────────
const COMMON = new Set(['mohamed', 'daniel', 'anton', 'kumar', 'raj', 'singh', 'mohamad'])
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()
const toks = (s) => new Set(norm(s).split(' ').filter(Boolean))
const nnum = (v) => (v == null ? null : Number(v))

async function loadScorecardStats() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/player_stats?season=eq.2026&select=*`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
    if (!r.ok) return []
    return await r.json()
  } catch { return [] }
}

// Find the player_stats row for a BTCL squad player: exact PlayerID, else name.
function findStatRow(rows, byId, player) {
  if (byId[player.PlayerID]) return byId[player.PlayerID]
  const candidates = [
    player.displayName,
    `${player.Forename} ${player.Surname}`,
    `${player.Surname} ${player.Forename}`,
  ].filter(Boolean)
  // exact
  for (const c of candidates) {
    const hit = rows.find((r) => norm(r.player_name) === norm(c))
    if (hit) return hit
  }
  // token subset with >=2 overlap incl. a non-common word
  let best = null, bs = 0
  for (const c of candidates) {
    const ct = toks(c)
    for (const r of rows) {
      const rt = toks(r.player_name)
      const inter = [...ct].filter((x) => rt.has(x))
      const subset = [...ct].every((x) => rt.has(x)) || [...rt].every((x) => ct.has(x))
      const meaningful = inter.filter((x) => !COMMON.has(x)).length
      if (subset && inter.length >= 2 && meaningful >= 1 && inter.length > bs) { bs = inter.length; best = r }
    }
  }
  return best
}

function statsFrom(row) {
  if (!row) return { matches: null, runs: null, innings: null, highest: null, average: null, wickets: null, economy: null, bestWkt: null, catches: null }
  const bat = nnum(row.bat_innings) || nnum(row.bat_runs)
  const bowl = nnum(row.bowl_matches) || nnum(row.bowl_wickets) || nnum(row.bowl_overs)
  return {
    matches: nnum(row.bat_matches) || nnum(row.bowl_matches) || null,
    runs: bat != null ? nnum(row.bat_runs) : null,
    innings: nnum(row.bat_innings),
    highest: nnum(row.bat_highest),
    average: nnum(row.bat_average),
    wickets: bowl != null ? nnum(row.bowl_wickets) : null,
    economy: nnum(row.bowl_economy),
    bestWkt: nnum(row.bowl_best_wickets),
    catches: nnum(row.field_catches),
  }
}

function buildPlayers(squad, statRows) {
  const byId = {}
  for (const r of statRows) if (r.btcl_player_id != null) byId[r.btcl_player_id] = r
  const DISPLAY = {}, dispFromFallback = {}
  for (const fb of BTCL_FALLBACK) if (fb.displayName) dispFromFallback[fb.PlayerID] = fb.displayName
  return squad.map((p) => {
    const displayName = dispFromFallback[p.PlayerID] || p.displayName || `${p.Forename} ${p.Surname}`
    const name = displayName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    const row = findStatRow(statRows, byId, { ...p, displayName })
    return {
      id: p.PlayerID, forename: p.Forename, surname: p.Surname, name,
      ageGroup: p.AgeGroup, batStyle: p.BatStyle || null, bowlStyle: p.BowlStyle || null,
      playerType: p.player_type,
      photoUrl: p.Photo ? `${PHOTO_BASE}${encodeURIComponent(p.Photo)}` : null,
      photoPos: p.photoPos || null,
      stats: statsFrom(row),
    }
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60')

  const statRows = await loadScorecardStats()
  try {
    const r = await fetch(BTCL_URL, { headers: { Accept: 'application/json', Origin: 'https://www.btcluk.com', Referer: 'https://www.btcluk.com/' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const squad = await r.json()
    return res.status(200).json({ players: buildPlayers(squad, statRows), source: 'live', updatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Players API error:', err.message)
    return res.status(200).json({ players: buildPlayers(BTCL_FALLBACK, statRows), source: 'fallback', updatedAt: new Date().toISOString() })
  }
}
