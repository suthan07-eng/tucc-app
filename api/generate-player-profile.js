// Vercel Edge Function — generate AI player profile via Anthropic
// SECURITY: ANTHROPIC_API_KEY is server-side only, never in client code
export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { player, stats, score, role, scoreBreakdown } = await req.json()

    if (!player || !stats) {
      return new Response(JSON.stringify({ error: 'Missing player or stats' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build context from stats
    const batLine = stats.batting
      ? `Batting: ${stats.batting.runs} runs in ${stats.batting.innings || stats.batting.matches} innings, avg ${stats.batting.average}, SR ${stats.batting.strike_rate}, HS ${stats.batting.highest}${stats.batting.fifties ? `, ${stats.batting.fifties} fifties` : ''}${stats.batting.hundreds ? `, ${stats.batting.hundreds} hundreds` : ''}`
      : null
    const bowlLine = stats.bowling
      ? `Bowling: ${stats.bowling.wickets} wkts in ${stats.bowling.matches} matches, econ ${stats.bowling.economy}, avg ${stats.bowling.average}, best ${stats.bowling.best_wickets}/${stats.bowling.best_runs}`
      : null

    const statsContext = [batLine, bowlLine].filter(Boolean).join(' | ')

    const prompt = `You are the team analyst for TUCC (Twickenham United Cricket Club) writing a motivating, positive player profile for the club website.

Write a profile for ${player.name} (${role}):
- TUCC Performance Score: ${score}/100
- ${statsContext}
- Season: 2026 BTCL Premier Division

Return ONLY valid JSON with exactly these fields:
{
  "headline": "A punchy 8-12 word headline that captures their standout quality or season story",
  "ai_profile": "2-3 sentence paragraph (70-100 words) describing their style, contributions, and value to TUCC. Positive, constructive tone. No file references, no opponent names.",
  "strengths": ["strength 1 (5-8 words)", "strength 2 (5-8 words)", "strength 3 (5-8 words)"],
  "development_areas": ["area 1 (5-8 words)", "area 2 (5-8 words)"],
  "role_notes": "One sentence (20-35 words) about how they fit into the team's strategy."
}

Rules:
- Keep everything positive and constructive — development areas should be framed as growth opportunities
- Be specific to their actual stats, not generic
- Avoid clichés like "talented cricketer" or "key player"
- No markdown, no extra keys, just the JSON object`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: `Anthropic error: ${err}` }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    const aiData = await response.json()
    const rawText = aiData.content?.[0]?.text?.trim() || ''

    // Parse JSON from AI response
    let profile
    try {
      // Extract JSON if wrapped in markdown
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      profile = JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
    } catch {
      return new Response(JSON.stringify({ error: 'AI returned invalid JSON', raw: rawText }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ profile }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
