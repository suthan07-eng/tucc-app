export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const { fileName, mediaType, playerName, dateStr } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ title: null, caption: null, error: 'No API key' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const cleanName = (fileName || '')
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(IMG|VID|DSC|MOV|mp4|jpeg|jpg|png)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    const prompt = `You are a creative writer for Tamil United Cricket Club's team gallery.

Generate a TITLE and CAPTION for a ${mediaType === 'video' ? 'video' : 'photo'} uploaded by ${playerName || 'a player'} on ${dateStr || 'today'}.
File hint: "${cleanName || 'team moment'}"

Rules:
- TITLE: max 55 characters, catchy, energetic, cricket/team themed, can include 1 emoji
- CAPTION: 1 short sentence, max 100 characters, warm and celebratory, can include 1 emoji
- No quotes around either answer

Reply in EXACTLY this format with no extra text:
TITLE: <title here>
CAPTION: <caption here>`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ title: null, caption: null, error: err }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text?.trim() || ''

    const titleLine   = text.split('\n').find(l => l.startsWith('TITLE:'))
    const captionLine = text.split('\n').find(l => l.startsWith('CAPTION:'))
    const title   = titleLine?.replace('TITLE:', '').trim()   || null
    const caption = captionLine?.replace('CAPTION:', '').trim() || null

    return new Response(JSON.stringify({ title, caption }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ title: null, caption: null, error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
