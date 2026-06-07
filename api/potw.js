// Player of the Week — reads from Supabase player_of_week table
// Admin sets this via the admin panel

const SUPABASE_URL = 'https://nrbuweeexnoofitznffo.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'
const PHOTO_BASE   = 'https://admin.btcluk.com/players/'

// All our players for photo lookup
const PLAYERS = [
  { name: 'Mohamed Nafaz',              first: 'Mohamed Nafaz', photo: '4309WhatsApp Image 2022-04-27 at 5.51.37 PM.jpeg' },
  { name: 'Gobinath Navaratnam',        first: 'Gobinath',      photo: '90041.jpg' },
  { name: 'Raj Sorna',                  first: 'Raj',           photo: '3615Raj.jpg' },
  { name: 'Roshan Thishanthan',         first: 'Roshan',        photo: 'IMG-20240409-WA0034-removebg-preview.png' },
  { name: 'Mahadeva Amaranath',         first: 'Mahadeva',      photo: '8625IMG-20220408-WA0011.jpg' },
  { name: 'Abbi Kanthiraj',            first: 'Abbi',          photo: '4321IMG-20220428-WA0009.jpg' },
  { name: 'Ajanthan Navaratnam',        first: 'Ajanthan',      photo: '5336IMG-20220411-WA0010.jpg' },
  { name: 'Harriharan Aravinthan',      first: 'Harriharan',    photo: '3635IMG-20220408-WA0018.jpg' },
  { name: 'Theepan Rajah Rajasekaran', first: 'Theepan Rajah', photo: 'Theepan.jpeg' },
  { name: 'Sanjiv Balachandran',        first: 'Sanjiv',        photo: '6916IMG-20220411-WA0018.jpg' },
  { name: 'Namasevayam Vipooshanan',    first: 'Namasevayam',   photo: '1660IMG-20220419-WA0009.jpg' },
  { name: 'Elankopan Thavalinkam',      first: 'Elankopan',     photo: '4720IMG-20220420-WA0032.jpg' },
  { name: 'Raguvaran Aravinthan',       first: 'Raguvaran',     photo: '3215IMG-20220408-WA0017.jpg' },
  { name: 'Kajenth Thanabalasingham',   first: 'Kajenth',       photo: '237279A25C56-43AC-49FA-B68D-FE810DBA9C4A.jpeg' },
  { name: 'Muralitharan Guganeshan',    first: 'Muralitharan',  photo: '4485WhatsApp Image 2022-07-03 at 10.40.58 AM.jpeg' },
  { name: 'Krishen Daniel',            first: 'Krishen',       photo: '2304IMG-20220418-WA0030.jpg' },
  { name: 'Gaajuran Ganagabalan',       first: 'Gaajuran',      photo: '4971.jpeg' },
  { name: 'Eashwaran Aravinthan',       first: 'Eashwaran',     photo: 'image0 (3).jpeg' },
  { name: 'Hrithisshan Kanendran',      first: 'Hrithisshan',   photo: '976Under 15.png' },
  { name: 'Abdul Khaliq Hakeem',        first: 'Abdul Khaliq',  photo: '6984886Under 18.png' },
  { name: 'Shenal Daniel Anthony',      first: 'Shenal',        photo: 'bc581ed9-b973-48e3-9e12-52912924f432.jpeg' },
  { name: 'Thevakumar Kanagarathinam Anton', first: 'Thevakumar', photo: '6631.jpeg' },
  { name: 'Malindu Maduranga',          first: 'Malindu',       photo: '7348.jpeg' },
  { name: 'Prayash Singh',              first: 'Prayash',       photo: '7349.jpeg' },
  { name: 'Arivu Sasikumar',            first: 'Arivu',         photo: '7358.jpeg' },
  { name: 'Dilesh Sangaran',            first: 'Dilesh',        photo: '7361.jpeg' },
  { name: 'Inthikhab Mazeez',          first: 'Inthikhab',     photo: '7435.jpeg' },
  { name: 'Pathmajeyan Asokumar',       first: 'Pathmajeyan',   photo: '7514.jpeg' },
  { name: 'Mihin Sugeeswaran',          first: 'Mihin',         photo: '7526.jpeg' },
]

function findPlayer(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  return PLAYERS.find(p =>
    p.name.toLowerCase() === lower ||
    p.first.toLowerCase() === lower ||
    lower.startsWith(p.first.toLowerCase()) ||
    p.name.toLowerCase().startsWith(lower)
  ) || null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')

  try {
    // Fetch latest POTW row from Supabase
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/player_of_week?order=id.desc&limit=1`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!resp.ok) throw new Error(`Supabase ${resp.status}`)
    const rows = await resp.json()
    const row = rows?.[0]

    if (!row) {
      return res.status(200).json({ batter: null, bowler: null, matchDate: '', opponent: '', source: 'empty' })
    }

    // Build batter object
    let batter = null
    if (row.batter_name && row.batter_runs != null) {
      const player = findPlayer(row.batter_name)
      batter = {
        name: row.batter_name,
        displayName: player ? player.first : row.batter_name.split(' ')[0],
        photoUrl: player ? `${PHOTO_BASE}${encodeURIComponent(player.photo)}` : null,
        runs: row.batter_runs,
        balls: row.batter_balls || 0,
        fours: row.batter_fours || 0,
        sixes: row.batter_sixes || 0,
        message: row.batter_message || `Outstanding innings from ${row.batter_name.split(' ')[0]}! 🏏`,
      }
    }

    // Build bowler object
    let bowler = null
    if (row.bowler_name && row.bowler_wickets != null) {
      const player = findPlayer(row.bowler_name)
      bowler = {
        name: row.bowler_name,
        displayName: player ? player.first : row.bowler_name.split(' ')[0],
        photoUrl: player ? `${PHOTO_BASE}${encodeURIComponent(player.photo)}` : null,
        wickets: row.bowler_wickets,
        overs: row.bowler_overs || 0,
        runsGiven: row.bowler_runs || 0,
        economy: row.bowler_economy || 0,
        message: row.bowler_message || `Brilliant bowling from ${row.bowler_name.split(' ')[0]}! 🎯`,
      }
    }

    return res.status(200).json({
      matchDate: row.match_date || '',
      opponent: row.opponent || '',
      batter,
      bowler,
      updatedAt: row.updated_at,
      source: 'supabase',
    })

  } catch (err) {
    console.error('POTW error:', err.message)
    return res.status(200).json({ batter: null, bowler: null, matchDate: '', opponent: '', source: 'error' })
  }
}
