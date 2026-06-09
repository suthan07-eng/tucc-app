// Accepts activity events from the client and inserts them using the service role key.
// This bypasses RLS entirely — no session or auth token needed from the browser.
import https from 'https'

const SUPABASE_HOST = 'nrbuweeexnoofitznffo.supabase.co'
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'

function httpsPost(path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body)
    const options = {
      hostname: SUPABASE_HOST,
      path,
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'apikey':         SERVICE_KEY,
        'Authorization':  `Bearer ${SERVICE_KEY}`,
        'Prefer':         'return=representation',
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.write(bodyStr)
    req.end()
  })
}

function httpsPatch(path, body, matchParam) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body)
    const options = {
      hostname: SUPABASE_HOST,
      path: `${path}?${matchParam}`,
      method: 'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'apikey':         SERVICE_KEY,
        'Authorization':  `Bearer ${SERVICE_KEY}`,
        'Prefer':         'return=minimal',
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.write(bodyStr)
    req.end()
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, row, update_id, duration_secs } = req.body || {}

  try {
    if (action === 'insert' && row) {
      const result = await httpsPost('/rest/v1/activity_logs', row)
      if (result.status >= 400) {
        console.error('activity insert failed:', result.status, result.body)
        return res.status(result.status).json({ error: result.body })
      }
      // Return the inserted row so the client can capture its ID for duration patching
      let inserted = null
      try { inserted = JSON.parse(result.body) } catch {}
      const id = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id
      return res.status(200).json({ ok: true, id: id || null })
    }

    if (action === 'update_duration' && update_id && duration_secs != null) {
      const result = await httpsPatch(
        '/rest/v1/activity_logs',
        { duration_secs },
        `id=eq.${update_id}`
      )
      if (result.status >= 400) {
        return res.status(result.status).json({ error: result.body })
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('log-activity error:', err)
    return res.status(500).json({ error: err.message })
  }
}
