export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { fileName, mediaType, playerName, dateStr } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ title: null, error: 'No API key' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Clean up filename for context
    const cleanName = (fileName || '')
      .replace(/\.[^.]+$/, '')          // remove extension
      .replace(/[-_]/g, ' ')            // dashes/underscores to spaces
      .replace(/\b(IMG|VID|DSC|MOV|mp4|jpeg|jpg|png)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    const prompt = `You are a creative title writer for a cricket club's team gallery. Generate ONE short, catchy title (max 55 characters) for a ${mediaType === 'video' ? 'video' : 'photo'} uploaded by ${playerName || 'a player'} on ${dateStr || 'today'}.

File hint: "${cleanName || 'team moment'}"
Team: Tamil United Cricket Club (TUCC)

The title should be energetic and cricket/team themed. Examples of good titles:
- "Match Day Vibes 🏏"
- "Training Hard 💪"
- "Victory Celebration! 🎉"
- "Pre-Match Warm-Up"
- "Season Highlights 🌟"
- "Squad Goals 👊"

Return ONLY the title text — no quotes, no explanation, nothing else.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ title: null, error: err }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    const title = data.content?.[0]?.text?.trim() || null

    return new Response(JSON.stringify({ title }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ title: null, error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
