// Merged player profiles endpoint — handles actions via ?action= param:
//   GET  ?action=scores&season=2026  → read tucc_player_scores
//   POST ?action=scores              → upsert score records
//   POST ?action=generate            → AI generate player profile (Anthropic)
//   POST ?action=generate-title      → AI generate gallery title/caption
export const config = { runtime: 'edge' }

const SUPABASE_URL         = 'https://nrbuweeexnoofitznffo.supabase.co'
const SUPABASE_ANON_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDE2NzUsImV4cCI6MjA5NDI3NzY3NX0.rbzJIdXFbj7XrumesA1kFRZ3mp4VJO22QYEMbGuUYFE'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS })
}

async function sbFetch(path, opts = {}, serviceRole = false) {
  const key = serviceRole ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opts.headers || {}),
    },
  })
  const text = await r.text()
  try   { return { ok: r.ok, status: r.status, body: JSON.parse(text) } }
  catch { return { ok: r.ok, status: r.status, body: text } }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS })

  const url    = new URL(req.url)
  const action = url.searchParams.get('action') || ''

  try {
    // ── GET scores ────────────────────────────────────────────────────────
    if (action === 'scores' && req.method === 'GET') {
      const season = url.searchParams.get('season') || '2026'
      const { ok, status, body } = await sbFetch(
        `/rest/v1/tucc_player_scores?season=eq.${season}&order=score.desc`
      )
      if (!ok) return json({ error: body }, status)
      return json({ scores: Array.isArray(body) ? body : [] })
    }

    // ── POST scores (upsert) ──────────────────────────────────────────────
    if (action === 'scores' && req.method === 'POST') {
      const payload = await req.json()
      const arr = Array.isArray(payload) ? payload : [payload]
      const { ok, status, body } = await sbFetch(
        '/rest/v1/tucc_player_scores',
        { method: 'POST', body: JSON.stringify(arr),
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' } },
        true  // service role — bypasses RLS
      )
      if (!ok) return json({ error: body }, status)
      return json({ saved: body })
    }

    // ── POST generate player profile (Anthropic) ──────────────────────────
    if (action === 'generate' && req.method === 'POST') {
      // process.env works in Vercel edge runtime
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not set in Vercel env' }, 500)

      const { player, stats, score, role } = await req.json()

      const batLine = stats?.batting
        ? `Batting: ${stats.batting.runs ?? 0} runs, ${stats.batting.innings ?? stats.batting.matches ?? 0} innings, avg ${stats.batting.average ?? 0}, SR ${stats.batting.strike_rate ?? 0}, HS ${stats.batting.highest ?? 0}${stats.batting.fifties ? `, ${stats.batting.fifties} fifties` : ''}${stats.batting.hundreds ? `, ${stats.batting.hundreds} hundreds` : ''}`
        : null
      const bowlLine = stats?.bowling && (stats.bowling.overs || 0) >= 4
        ? `Bowling: ${stats.bowling.wickets ?? 0} wkts in ${stats.bowling.matches ?? 0} matches, econ ${stats.bowling.economy ?? 0}, best ${stats.bowling.best_wickets ?? 0}/${stats.bowling.best_runs ?? 0}`
        : null
      const statsCtx = [batLine, bowlLine].filter(Boolean).join(' | ') || 'Limited 2026 stats available'

      const prompt = `You are the team analyst for TUCC (Twickenham United Cricket Club) writing a motivating player profile for the club website.

Player: ${player?.name} | Role: ${role} | TUCC Score: ${score}/100
Stats: ${statsCtx}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "headline": "punchy 8-12 word headline capturing their standout quality or season story",
  "ai_profile": "2-3 sentence paragraph, 60-90 words, describing playing style and value to TUCC. Positive, specific to their stats.",
  "strengths": ["concrete strength based on stats (6-8 words)", "second strength (6-8 words)", "third strength (6-8 words)"],
  "development_areas": ["growth opportunity framed positively (6-8 words)", "second growth area (6-8 words)"],
  "role_notes": "One sentence about how they fit into TUCC team strategy, 20-30 words."
}`

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-3-haiku-20240307',
          max_tokens: 700,
          messages:   [{ role: 'user', content: prompt }],
        }),
      })

      if (!aiRes.ok) {
        const err = await aiRes.text()
        return json({ error: `Anthropic API error: ${err}` }, 500)
      }

      const aiData = await aiRes.json()
      const raw    = aiData.content?.[0]?.text?.trim() || ''

      try {
        const match   = raw.match(/\{[\s\S]*\}/)
        const profile = JSON.parse(match ? match[0] : raw)
        return json({ profile })
      } catch {
        return json({ error: 'AI returned invalid JSON', raw }, 500)
      }
    }

    // ── POST generate gallery title/caption ───────────────────────────────
    if (action === 'generate-title' && req.method === 'POST') {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return json({ title: null, caption: null, error: 'No API key' })

      const { fileName, mediaType, playerName, dateStr } = await req.json()
      const cleanName = (fileName || '')
        .replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        .replace(/\b(IMG|VID|DSC|MOV|mp4|jpeg|jpg|png)\b/gi, '')
        .replace(/\s+/g, ' ').trim()

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5', max_tokens: 120,
          messages: [{ role: 'user', content:
            `You are a creative writer for Tamil United Cricket Club's gallery.
Generate a TITLE and CAPTION for a ${mediaType === 'video' ? 'video' : 'photo'} by ${playerName || 'a player'} on ${dateStr || 'today'}.
File hint: "${cleanName || 'team moment'}"
TITLE: max 55 chars, catchy, cricket themed, 1 emoji ok
CAPTION: 1 sentence max 100 chars, warm, 1 emoji ok
Reply EXACTLY:
TITLE: <title>
CAPTION: <caption>` }],
        }),
      })
      if (!aiRes.ok) return json({ title: null, caption: null })
      const data    = await aiRes.json()
      const text    = data.content?.[0]?.text?.trim() || ''
      const title   = text.split('\n').find(l => l.startsWith('TITLE:'))  ?.replace('TITLE:',   '').trim() || null
      const caption = text.split('\n').find(l => l.startsWith('CAPTION:'))?.replace('CAPTION:', '').trim() || null
      return json({ title, caption })
    }

    return json({ error: 'Unknown action. Use ?action=scores|generate|generate-title' }, 400)

  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
