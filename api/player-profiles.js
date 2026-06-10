// Merged player profiles endpoint — handles three actions via ?action= param:
//   GET  ?action=scores&season=2026        → read tucc_player_scores
//   POST ?action=scores                    → upsert score records
//   POST ?action=generate                  → AI generate player profile (Anthropic, server-side)
//   POST ?action=generate-title            → AI generate gallery title/caption
export const config = { runtime: 'edge' }

const SUPABASE_URL      = 'https://nrbuweeexnoofitznffo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDE2NzUsImV4cCI6MjA5NDI3NzY3NX0.cZNkT3TqWMmH_YTi4_cK8NFAELG-Qbq43FDRjqB8Sbs'
// Service role bypasses RLS — required for writes to tucc_player_scores
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'

async function supabaseFetch(path, opts = {}, useServiceKey = false) {
  const key = useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY
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
  try { return { status: r.status, body: JSON.parse(text) } }
  catch { return { status: r.status, body: text } }
}

export default async function handler(req) {
  const url    = new URL(req.url)
  const action = url.searchParams.get('action') || ''

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors })

  try {
    // ── GET scores ─────────────────────────────────────────────────────────
    if (action === 'scores' && req.method === 'GET') {
      const season = url.searchParams.get('season') || '2026'
      const { status, body } = await supabaseFetch(
        `/rest/v1/tucc_player_scores?season=eq.${season}&order=score.desc`
      )
      if (status >= 400) return new Response(JSON.stringify({ error: body }), { status, headers: cors })
      return new Response(JSON.stringify({ scores: Array.isArray(body) ? body : [] }), { status: 200, headers: cors })
    }

    // ── POST scores (upsert) ───────────────────────────────────────────────
    if (action === 'scores' && req.method === 'POST') {
      const records = await req.json()
      const arr = Array.isArray(records) ? records : [records]
      const { status, body } = await supabaseFetch(
        '/rest/v1/tucc_player_scores',
        {
          method: 'POST',
          body: JSON.stringify(arr),
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        },
        true  // use service role key to bypass RLS
      )
      if (status >= 400) return new Response(JSON.stringify({ error: body }), { status, headers: cors })
      return new Response(JSON.stringify({ saved: body }), { status: 200, headers: cors })
    }

    // ── POST generate player profile (Anthropic) ──────────────────────────
    if (action === 'generate' && req.method === 'POST') {
      const apiKey = typeof process !== 'undefined' ? process.env?.ANTHROPIC_API_KEY : undefined
        || (typeof globalThis !== 'undefined' ? (globalThis).ANTHROPIC_API_KEY : undefined)
      const key = apiKey || (await (async () => {
        try { return (await import('process')).env.ANTHROPIC_API_KEY } catch { return null }
      })())

      // Edge runtime: env vars via globalThis
      const edgeKey = key || (typeof ANTHROPIC_API_KEY !== 'undefined' ? ANTHROPIC_API_KEY : null)
      if (!edgeKey) {
        return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: cors })
      }

      const { player, stats, score, role } = await req.json()
      const batLine  = stats?.batting  ? `Batting: ${stats.batting.runs} runs in ${stats.batting.innings || stats.batting.matches} innings, avg ${stats.batting.average}, SR ${stats.batting.strike_rate}, HS ${stats.batting.highest}${stats.batting.fifties ? `, ${stats.batting.fifties} fifties` : ''}${stats.batting.hundreds ? `, ${stats.batting.hundreds} hundreds` : ''}` : null
      const bowlLine = stats?.bowling && (stats.bowling.overs || 0) >= 4 ? `Bowling: ${stats.bowling.wickets} wkts in ${stats.bowling.matches} matches, econ ${stats.bowling.economy}, avg ${stats.bowling.average}, best ${stats.bowling.best_wickets}/${stats.bowling.best_runs}` : null
      const statsCtx = [batLine, bowlLine].filter(Boolean).join(' | ')

      const prompt = `You are the team analyst for TUCC (Twickenham United Cricket Club) writing a motivating player profile for the club website.

Write a profile for ${player?.name} (${role}):
- TUCC Performance Score: ${score}/100
- ${statsCtx}
- Season: 2026 BTCL Premier Division

Return ONLY valid JSON:
{
  "headline": "punchy 8-12 word headline capturing their standout quality",
  "ai_profile": "2-3 sentence paragraph (70-100 words) describing style, contributions, value to TUCC. Positive tone. No file references.",
  "strengths": ["strength 1 (5-8 words)", "strength 2 (5-8 words)", "strength 3 (5-8 words)"],
  "development_areas": ["area 1 (5-8 words)", "area 2 (5-8 words)"],
  "role_notes": "One sentence (20-35 words) about team strategy fit."
}
Rules: positive/constructive only, specific to actual stats, avoid clichés. No markdown, just the JSON.`

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': edgeKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
      })
      if (!aiRes.ok) {
        const err = await aiRes.text()
        return new Response(JSON.stringify({ error: `Anthropic: ${err}` }), { status: 500, headers: cors })
      }
      const aiData = await aiRes.json()
      const raw = aiData.content?.[0]?.text?.trim() || ''
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        const profile = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
        return new Response(JSON.stringify({ profile }), { status: 200, headers: cors })
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid AI JSON', raw }), { status: 500, headers: cors })
      }
    }

    // ── POST generate gallery title/caption (Anthropic) ───────────────────
    if (action === 'generate-title' && req.method === 'POST') {
      const apiKey = typeof ANTHROPIC_API_KEY !== 'undefined' ? ANTHROPIC_API_KEY : null
      if (!apiKey) {
        return new Response(JSON.stringify({ title: null, caption: null, error: 'No API key' }), { status: 200, headers: cors })
      }
      const { fileName, mediaType, playerName, dateStr } = await req.json()
      const cleanName = (fileName || '').replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b(IMG|VID|DSC|MOV|mp4|jpeg|jpg|png)\b/gi, '').replace(/\s+/g, ' ').trim()
      const prompt = `You are a creative writer for Tamil United Cricket Club's team gallery.
Generate a TITLE and CAPTION for a ${mediaType === 'video' ? 'video' : 'photo'} uploaded by ${playerName || 'a player'} on ${dateStr || 'today'}.
File hint: "${cleanName || 'team moment'}"
Rules:
- TITLE: max 55 characters, catchy, energetic, cricket/team themed, can include 1 emoji
- CAPTION: 1 short sentence, max 100 characters, warm and celebratory, can include 1 emoji
Reply EXACTLY:
TITLE: <title here>
CAPTION: <caption here>`

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 120, messages: [{ role: 'user', content: prompt }] }),
      })
      if (!aiRes.ok) {
        const err = await aiRes.text()
        return new Response(JSON.stringify({ title: null, caption: null, error: err }), { status: 200, headers: cors })
      }
      const data = await aiRes.json()
      const text  = data.content?.[0]?.text?.trim() || ''
      const title   = text.split('\n').find(l => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim() || null
      const caption = text.split('\n').find(l => l.startsWith('CAPTION:'))?.replace('CAPTION:', '').trim() || null
      return new Response(JSON.stringify({ title, caption }), { status: 200, headers: cors })
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Use ?action=scores|generate|generate-title' }), { status: 400, headers: cors })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors })
  }
}
