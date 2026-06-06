// Player stats API — serves from local data file
// When PLAY_CRICKET_API_KEY is set, will fetch live from play-cricket instead
import stats2026 from '../src/data/stats-2026.json' assert { type: 'json' }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')

  const { season = '2026' } = req.query
  const apiKey = process.env.PLAY_CRICKET_API_KEY

  // Once API key is available, fetch live data from play-cricket
  if (apiKey) {
    try {
      const r = await fetch(
        `https://play-cricket.com/api/v2/statistics.json?site_id=15368&season_id=259&api_token=${apiKey}`,
        { headers: { 'Accept': 'application/json' } }
      )
      if (r.ok) {
        const data = await r.json()
        return res.status(200).json({ ...data, source: 'live', season })
      }
    } catch (e) {
      console.warn('Play-cricket API error:', e.message)
    }
  }

  // Serve from local stats file
  return res.status(200).json({
    ...stats2026,
    source: 'excel',
    updatedAt: stats2026.updatedAt,
    season,
  })
}
