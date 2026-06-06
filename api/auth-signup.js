// Vercel serverless — creates a Supabase user with email pre-confirmed
// Uses the service role key via Supabase JS admin client (server-side only)
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://nrbuweeexnoofitznffo.supabase.co'
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, full_name, phone } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || '', phone: phone || '' },
    })

    if (error) {
      console.error('Admin createUser error:', error)
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ user: data.user })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
