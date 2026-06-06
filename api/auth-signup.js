// Vercel serverless — creates a Supabase user with email pre-confirmed
// Uses the service role key (server-side only, never exposed to browser)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, full_name, phone } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    // Create user via admin API — email_confirm: true skips confirmation email
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,   // ← auto-confirms, no email sent
        user_metadata: { full_name: full_name || '', phone: phone || '' },
      }),
    })

    const data = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: data.msg || data.message || 'Signup failed' })

    return res.status(200).json({ user: data })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
