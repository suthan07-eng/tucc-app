// Vercel serverless — geocodes a venue then fetches 7-day forecast from Open-Meteo (free)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  // Cache 1 hr on CDN — weather doesn't need to be real-time
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300')

  const { venue } = req.query
  if (!venue) return res.status(400).json({ error: 'venue required' })

  try {
    // Try to extract a UK postcode first (most accurate), else use last 2 parts of address
    const postcodeMatch = venue.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i)
    const geoQuery = postcodeMatch
      ? postcodeMatch[0]
      : venue.split(',').slice(-2).join(',').trim()

    // Nominatim reverse-geocoding (OpenStreetMap, free, UK-scoped)
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geoQuery)}&format=json&limit=1&countrycodes=gb`
    const geoRes = await fetch(geoUrl, {
      headers: { 'User-Agent': 'TUCC-Cricket-App/1.0 (tucc.club)' },
    })
    const geoData = await geoRes.json()
    const loc = geoData[0]
    if (!loc) throw new Error('Could not geocode venue')

    // Open-Meteo 7-day daily forecast (free, no API key)
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=Europe%2FLondon&forecast_days=7`
    const wxRes = await fetch(wxUrl)
    const wx = await wxRes.json()

    return res.status(200).json({
      daily: wx.daily,
      location: { lat: Number(loc.lat), lon: Number(loc.lon), name: geoQuery },
    })
  } catch (err) {
    console.error('Weather API error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
