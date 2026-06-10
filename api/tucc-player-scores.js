// Vercel serverless — read/write TUCC player performance scores
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — return all cached scores for current season
  if (req.method === 'GET') {
    const season = req.query.season || '2026'
    const { data, error } = await supabase
      .from('tucc_player_scores')
      .select('*')
      .eq('season', season)
      .order('score', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ scores: data || [] })
  }

  // POST — upsert one or many player score records
  if (req.method === 'POST') {
    const body = req.body
    const records = Array.isArray(body) ? body : [body]
    const { data, error } = await supabase
      .from('tucc_player_scores')
      .upsert(records, { onConflict: 'btcl_player_id' })
      .select()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ saved: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
