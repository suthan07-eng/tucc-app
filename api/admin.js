// Merged admin endpoint: activity logs, auth users, update user
// Route via ?action=activity|users|update-user
import https from 'https'

const SUPABASE_HOST = 'nrbuweeexnoofitznffo.supabase.co'
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'

function httpsReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : ''
    const options = {
      hostname: SUPABASE_HOST,
      path,
      method,
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(bodyStr)
    req.end()
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const action = req.query?.action || req.query?.type

  try {
    // ── GET activity logs ─────────────────────────────────────────────────
    if (action === 'activity') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
      const limit = parseInt(req.query?.limit || '300', 10)
      const result = await httpsReq('GET', `/rest/v1/activity_logs?select=*&order=created_at.desc&limit=${limit}`)
      if (result.status >= 400) return res.status(result.status).json({ error: String(result.body) })
      return res.status(200).json({ logs: Array.isArray(result.body) ? result.body : [] })
    }

    // ── GET auth users ────────────────────────────────────────────────────
    if (action === 'users') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
      const result = await httpsReq('GET', '/auth/v1/admin/users?per_page=1000')
      if (result.status >= 400) return res.status(result.status).json({ error: result.body?.message || 'Failed' })
      const users = (result.body?.users || []).map(u => ({
        id:              u.id,
        email:           u.email,
        last_sign_in_at: u.last_sign_in_at,
        created_at:      u.created_at,
      }))
      return res.status(200).json({ users })
    }

    // ── POST update-user (email / password) ───────────────────────────────
    if (action === 'update-user') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
      const { currentEmail, newEmail, newPassword } = req.body || {}
      if (!currentEmail) return res.status(400).json({ error: 'currentEmail required' })
      if (!newEmail && !newPassword) return res.status(400).json({ error: 'newEmail or newPassword required' })

      const listRes = await httpsReq('GET', `/auth/v1/admin/users?email=${encodeURIComponent(currentEmail)}`)
      if (listRes.status >= 400) return res.status(listRes.status).json({ error: listRes.body?.message || 'Lookup failed' })
      const users = listRes.body?.users || []
      if (!users.length) return res.status(404).json({ error: `No account for ${currentEmail}` })

      const updates = {}
      if (newEmail)    updates.email    = newEmail
      if (newPassword) updates.password = newPassword
      const patchRes = await httpsReq('PUT', `/auth/v1/admin/users/${users[0].id}`, updates)
      if (patchRes.status >= 400) {
        const msg = patchRes.body?.msg || patchRes.body?.message || patchRes.body?.error_description || 'Update failed'
        return res.status(patchRes.status).json({ error: msg })
      }
      return res.status(200).json({ user: patchRes.body })
    }

    return res.status(400).json({ error: 'Missing ?action= (activity|users|update-user)' })
  } catch (err) {
    console.error('admin handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
