// Merged admin endpoint: activity logs, auth users, update user
// Route via ?action=activity|users|update-user
import https from 'https'

const SUPABASE_HOST = 'nrbuweeexnoofitznffo.supabase.co'
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY      = process.env.SUPABASE_ANON_KEY
const ADMIN_EMAIL   = process.env.VITE_ADMIN_EMAIL || 'suthan07@gmail.com'

function httpsReq(method, path, body, headersOverride) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : ''
    const defaultHeaders = {
      'apikey':        SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type':  'application/json',
      ...(body ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
    }
    const options = {
      hostname: SUPABASE_HOST,
      path,
      method,
      headers: headersOverride
        ? { 'Content-Type': 'application/json', ...headersOverride }
        : defaultHeaders,
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

async function verifyAdminJwt(token) {
  const result = await httpsReq('GET', '/auth/v1/user', null, {
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${token}`,
  })
  if (result.status !== 200 || !result.body?.email) return null
  return result.body.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? result.body : null
}

export default async function handler(req, res) {
  const allowedOrigins = ['https://tucc.club', 'https://www.tucc.club']
  const origin = req.headers['origin'] || ''
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── Verify caller is the admin via their Supabase JWT ─────────────────
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Unauthorised' })
  const adminUser = await verifyAdminJwt(token)
  if (!adminUser) return res.status(403).json({ error: 'Forbidden' })

  const action = req.query?.action || req.query?.type

  try {
    // ── GET players list (id, name, email) ───────────────────────────────
    if (action === 'players') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
      const result = await httpsReq('GET', '/rest/v1/players?select=id,name,email&order=name')
      if (result.status >= 400) return res.status(result.status).json({ error: String(result.body) })
      return res.status(200).json(Array.isArray(result.body) ? result.body : [])
    }

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
