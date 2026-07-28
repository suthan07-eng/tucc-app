// Serverless endpoint: POST { pdf: <base64> } -> parsed scorecard object.
// Uses pdfjs-dist to extract text WITH x/y positions, reconstructs the column
// layout (play-cricket scorecards are tabular), then parses batting/bowling/
// fielding + match meta. Returns data the admin previews and saves.

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const monthIdx = (m) => MONTHS.findIndex(x => x.toLowerCase() === (m || '').toLowerCase()) + 1

const clean = (n) => (n || '').replace(/[*†]/g, '').replace(/\s+/g, ' ').trim()
const isOurs = (n) => /dollishill|tamil united/i.test(n || '')

// ── Reconstruct spaced text lines from positioned glyph items ──────────────
async function extractText(buffer) {
  const doc = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise
  const lines = []
  for (let pn = 1; pn <= doc.numPages; pn++) {
    const page = await doc.getPage(pn)
    const tc = await page.getTextContent()
    const rows = {}
    for (const it of tc.items) {
      const y = Math.round(it.transform[5])
      const x = it.transform[4]
      ;(rows[y] = rows[y] || []).push({ x, s: it.str, w: (it.width || it.str.length * 3) })
    }
    for (const y of Object.keys(rows).map(Number).sort((a, b) => b - a)) {
      const items = rows[y].sort((a, b) => a.x - b.x)
      let line = '', lastEnd = null
      for (const it of items) {
        if (lastEnd !== null && it.x - lastEnd > 2.0) line += ' '
        line += it.s
        lastEnd = it.x + it.w
      }
      lines.push(line)
    }
  }
  return lines.join('\n').replace(/ /g, ' ').replace(/[  ]/g, ' ')
}

function parseDate(txt) {
  const m = txt.match(/Date\s+\w+day\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/)
  if (!m) return null
  const mon = monthIdx(m[2])
  if (!mon) return null
  return `${m[3]}-${String(mon).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`
}

function parseScores(txt) {
  const m = txt.match(/\nScore ([\s\S]+?)\nGame Points/)
  const seg = (m ? m[1] : '').replace(/\n/g, ' ')
  const re = /(\d+)(?:-(\d+))?\s*(all out)?\s*\(\s*(\d+(?:\.\d+)?)?\s*overs\)/g
  const out = []
  let mm
  while ((mm = re.exec(seg))) {
    const runs = +mm[1]
    if (runs === 0 && !mm[4]) { out.push(null); continue }
    out.push({ runs, wkts: mm[3] ? 10 : (mm[2] ? +mm[2] : 0), overs: mm[4] || '' })
  }
  return out
}

const DIS = /^(.*?)\s+(ct & b |ct |c |st |b\s+|lbw|run out|not out|did not bat|retired|absent|dnb)/i

function parseBatting(block) {
  const rows = []
  for (let line of block.split('\n')) {
    line = line.trim()
    if (!line || /^(Name How Out|Extras|Total|Wickets|\* = |Fall of Wickets|Overs|† = )/.test(line)) continue
    if (/\bdid not bat\b/i.test(line)) {
      rows.push({ name: clean(line.replace(/\s*did not bat.*/i, '')), how_out: 'did not bat', runs: 0, fours: 0, sixes: 0, balls: 0, did_bat: false, not_out: false })
      continue
    }
    const m = line.match(/^(.*?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/)
    if (!m) continue
    const pre = m[1]
    const dm = (pre + ' ').match(DIS)
    let name, how
    if (dm) { name = clean(dm[1]); how = pre.slice(dm[1].length).trim() }
    else { name = clean(pre); how = '' }
    rows.push({ name, how_out: how, runs: +m[2], fours: +m[3], sixes: +m[4], balls: +m[5], did_bat: true, not_out: /not out/i.test(how) })
  }
  return rows
}

function parseBowling(block) {
  const rows = []
  for (let line of block.split('\n')) {
    line = line.trim()
    if (!line || /^(Bowler Overs|Fielding|Total|Extras)/.test(line)) continue
    const m = line.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/)
    if (!m) continue
    rows.push({ name: clean(m[1]), overs: m[2], maidens: +m[3], runs: +m[4], wickets: +m[5] })
  }
  return rows
}

// Raw fielding credits by fielder name (matched to players later, client-side)
function parseFielding(oppBatting) {
  const cr = {}
  const add = (nm, k) => { nm = clean(nm); if (!nm) return; (cr[nm] = cr[nm] || { name: nm, catches: 0, stumpings: 0, run_outs: 0 })[k]++ }
  for (const r of oppBatting) {
    const how = r.how_out
    if (!how) continue
    let m
    if ((m = how.match(/^ct & b\s+(.+)/i))) { add(m[1], 'catches'); continue }
    if ((m = how.match(/^(?:ct|c)\s+(.+?)\s+b\s+/i))) { add(m[1], 'catches'); continue }
    if ((m = how.match(/^st\s+(.+?)\s+b\s+/i))) { add(m[1], 'stumpings'); continue }
    if ((m = how.match(/^run out\s*\(?([^)]+?)\)?(?:\s+b\s+|$)/i))) { add(m[1].split('/')[0], 'run_outs'); continue }
  }
  return Object.values(cr)
}

function extrasTotal(block) {
  const ex = block.match(/Extras[^\n]*?(\d+)\s*(?:\n|$)/)
  const tot = block.match(/\nTotal (\d+)/)
  const wk = block.match(/\nWickets (\d+)/)
  return { extras: ex ? +ex[1] : 0, total: tot ? +tot[1] : null, wickets: wk ? +wk[1] : null }
}

function splitInnings(txt) {
  const innings = []
  const re = /\n([^\n]+)\nBatting\n([\s\S]*?)\nBowling\n([\s\S]*?)(?=\n[^\n]+\nBatting\n|$)/g
  let m
  while ((m = re.exec(txt))) {
    const team = m[1].trim()
    const bat = parseBatting(m[2])
    const bowl = parseBowling(m[3])
    const et = extrasTotal(m[2])
    innings.push({ team, is_ours: isOurs(team), batting: bat, bowling: bowl, extras: et.extras, total: et.total, wickets: et.wickets })
  }
  return innings
}

export function parseScorecard(txt) {
  const head = txt.match(/^(.*?)\s+Vs\s+(.*?)$/m)
  if (!head) throw new Error('Not a recognised scorecard (no "A Vs B" header found)')
  const teamA = head[1].trim(), teamB = head[2].trim()
  const date = parseDate(txt)
  const scores = parseScores(txt)
  const resM = txt.match(/Result :\s*(.+)/)
  const resultRaw = resM ? resM[1].trim() : ''
  const ptsM = txt.match(/Total Points (\d+) (\d+)/)
  const grdM = txt.match(/Ground\s+([\s\S]+?)\s+Date/)
  let venue = grdM ? grdM[1].trim() : null
  if (venue === 'Add New Ground') venue = null

  const ourA = isOurs(teamA)
  const opponent = ourA ? teamB : teamA
  let ourScore = scores[0] || null, theirScore = scores[1] || null
  if (!ourA) { const t = ourScore; ourScore = theirScore; theirScore = t }
  const [ptsA, ptsB] = ptsM ? [+ptsM[1], +ptsM[2]] : [null, null]
  const ourPts = ourA ? ptsA : ptsB, theirPts = ourA ? ptsB : ptsA

  const rl = resultRaw.toLowerCase()
  let outcome = 'lost'
  if (/abandon|cancel/.test(rl)) outcome = 'abandoned'
  else if (/tie/.test(rl)) outcome = 'tie'
  else if (isOurs(resultRaw)) outcome = 'won'

  const innings = splitInnings(txt)
  let ourBat = [], ourBowl = [], ourField = []
  for (const inn of innings) {
    if (inn.is_ours) ourBat = inn.batting
    else { ourBowl = inn.bowling; ourField = parseFielding(inn.batting) }
  }

  return {
    match_date: date, opponent, season: '2026', result: outcome, result_raw: resultRaw,
    our_score: ourScore?.runs ?? null, our_wickets: ourScore?.wkts ?? null, our_overs: ourScore?.overs ?? null,
    their_score: theirScore?.runs ?? null, their_wickets: theirScore?.wkts ?? null, their_overs: theirScore?.overs ?? null,
    our_points: ourPts, their_points: theirPts, venue,
    scorecard: { innings }, our_batting: ourBat, our_bowling: ourBowl, our_fielding: ourField,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const b64 = (body.pdf || '').replace(/^data:.*;base64,/, '')
    if (!b64) return res.status(400).json({ error: 'No pdf provided' })
    const buffer = Buffer.from(b64, 'base64')
    const text = await extractText(buffer)
    const parsed = parseScorecard(text)
    if (!parsed.match_date) return res.status(422).json({ error: 'Could not read the match date from this PDF.' })
    return res.status(200).json({ ok: true, parsed })
  } catch (e) {
    console.error('parse-scorecard error:', e.message)
    return res.status(422).json({ error: e.message || 'Failed to parse scorecard' })
  }
}
