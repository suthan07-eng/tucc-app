// Vercel serverless function — fetches BTCL league table from play-cricket
// Cached for 10 minutes so we don't hammer their server

export const config = { runtime: 'edge' }

const URL = 'https://dtucc.play-cricket.com/website/division/137680'
const CACHE_SECONDS = 600

export default async function handler(req) {
  try {
    const res = await fetch(URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TUCCApp/1.0)' },
    })
    const html = await res.text()

    // Parse table rows
    const rowRe = /<tr[^>]*>(.*?)<\/tr>/gs
    const tdRe  = /<td[^>]*>(.*?)<\/td>/gs
    const tagRe = /<[^>]+>/g

    const teams = []
    let rowMatch
    while ((rowMatch = rowRe.exec(html)) !== null) {
      const cells = []
      let tdMatch
      const tdSrc = rowMatch[1]
      tdRe.lastIndex = 0
      while ((tdMatch = tdRe.exec(tdSrc)) !== null) {
        cells.push(tdMatch[1].replace(tagRe, '').replace(/\s+/g, ' ').trim())
      }
      if (cells.length >= 14) {
        const pos = parseInt(cells[0])
        if (!isNaN(pos)) {
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

    return new Response(JSON.stringify({ teams, updatedAt: new Date().toISOString() }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, teams: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
