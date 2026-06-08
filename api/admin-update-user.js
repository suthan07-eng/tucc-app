// Vercel serverless — admin endpoint to update a Supabase user's email and/or password
// Looks up the user by their current email (service role) then patches them
import https from 'https'

const SUPABASE_HOST = 'nrbuweeexnoofitznffo.supabase.co'
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'

const AUTH_HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

function httpsReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : ''
    const options = {
      hostname: SUPABASE_HOST,
      path,
      method,
      headers: {
        ...AUTH_HEADERS,
        ...(body ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
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
    if (body) req.write(bodyStr)
    req.end()
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { currentEmail, newEmail, newPassword } = req.body || {}
  if (!currentEmail) return res.status(400).json({ error: 'currentEmail required' })
  if (!newEmail && !newPassword) return res.status(400).json({ error: 'At least newEmail or newPassword required' })

  try {
    // 1. Look up the user by their current email
    const listRes = await httpsReq('GET', `/auth/v1/admin/users?email=${encodeURIComponent(currentEmail)}`)
    if (listRes.status >= 400) {
      return res.status(listRes.status).json({ error: listRes.body?.message || 'Failed to look up user' })
    }

    const users = listRes.body?.users || []
    if (users.length === 0) {
      return res.status(404).json({ error: `No auth account found for ${currentEmail}. The player may not have logged in yet.` })
    }

    const userId = users[0].id

    // 2. Patch the user
    const updates = {}
    if (newEmail)    updates.email    = newEmail
    if (newPassword) updates.password = newPassword

    const patchRes = await httpsReq('PUT', `/auth/v1/admin/users/${userId}`, updates)
    if (patchRes.status >= 400) {
      const msg = patchRes.body?.msg || patchRes.body?.message || patchRes.body?.error_description || 'Update failed'
      return res.status(patchRes.status).json({ error: msg })
    }

    return res.status(200).json({ user: patchRes.body })
  } catch (err) {
    console.error('admin-update-user error:', err)
    return res.status(500).json({ error: 'Internal server error: ' + err.message })
  }
}
