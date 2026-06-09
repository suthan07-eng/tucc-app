// Admin endpoint: fetch activity logs using service role (bypasses RLS)
// Also returns auth users' last_sign_in_at in the same call
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://nrbuweeexnoofitznffo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0',
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const limit = parseInt(req.query?.limit || '300', 10)

    const { data: logs, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ logs: logs || [] })
  } catch (err) {
    console.error('admin-get-activity error:', err)
    return res.status(500).json({ error: 'Internal server error: ' + err.message })
  }
}
