// Fetches all auth users with last_sign_in_at using service role key
import https from 'https'

const SUPABASE_HOST = 'nrbuweeexnoofitznffo.supabase.co'
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'

function httpsGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_HOST,
      path,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Fetch up to 1000 users (paginate if needed in future)
    const result = await httpsGet('/auth/v1/admin/users?per_page=1000')
    if (result.status >= 400) {
      return res.status(result.status).json({ error: result.body?.message || 'Failed to fetch users' })
    }

    // Return just the fields we need
    const users = (result.body?.users || []).map(u => ({
      id:               u.id,
      email:            u.email,
      last_sign_in_at:  u.last_sign_in_at,
      created_at:       u.created_at,
    }))

    return res.status(200).json({ users })
  } catch (err) {
    console.error('admin-get-auth-users error:', err)
    return res.status(500).json({ error: 'Internal server error: ' + err.message })
  }
}
