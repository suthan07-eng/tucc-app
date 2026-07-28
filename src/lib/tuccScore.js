// TUCC performance score — the SINGLE definition used everywhere (Players page
// live cards AND the cached scores written for the public pages), so the number
// is identical on every page. Inputs:
//   bat  = { runs, strike_rate, average, fifties, hundreds, innings, matches } | null
//   bowl = { wickets, economy, average, five_fers, overs, matches } | null
//   styles = { batStyle, bowlStyle }
//   matchesHint = squad match count (falls back to bat/bowl matches)

export function detectRole(bat, bowl, styles = {}) {
  const batStyle = (styles.batStyle || '').toLowerCase()
  const bowlStyle = (styles.bowlStyle || '').toLowerCase()
  if (batStyle.includes('wicket') || bowlStyle.includes('wicket')) return 'Wicket-Keeper'
  const hasBat = bat && (bat.innings || bat.matches || 0) >= 1
  const hasBowl = bowl && (bowl.overs || 0) >= 4
  if (hasBat && hasBowl) return 'All-Rounder'
  if (hasBowl) return 'Bowler'
  if (bowlStyle && !hasBat) return 'Bowler'
  return 'Batsman'
}

export function computeTuccScore(bat, bowl, styles = {}, matchesHint = null) {
  const matches = matchesHint || bat?.matches || bowl?.matches || 1
  let batScore = 0
  if (bat) {
    const runsNorm = Math.min((bat.runs || 0) / 300, 1) * 40
    const sr = parseFloat(bat.strike_rate) || 0
    const srPts = sr >= 120 ? 30 : sr >= 90 ? 22 : sr >= 70 ? 15 : sr >= 50 ? 9 : 5
    const avgNorm = Math.min((parseFloat(bat.average) || 0) / 60, 1) * 20
    const milestones = Math.min((bat.fifties || 0) * 2 + (bat.hundreds || 0) * 5, 10)
    batScore = runsNorm + srPts + avgNorm + milestones
  }
  let bowlScore = 0
  if (bowl && (bowl.overs || 0) >= 4) {
    const wktsNorm = Math.min((bowl.wickets || 0) / 15, 1) * 40
    const econ = parseFloat(bowl.economy) || 99
    const econPts = econ <= 5 ? 30 : econ <= 6.5 ? 22 : econ <= 8 ? 15 : econ <= 10 ? 9 : 5
    const avg = parseFloat(bowl.average) || 99
    const avgPts = avg <= 15 ? 20 : avg <= 22 ? 15 : avg <= 30 ? 10 : avg <= 40 ? 5 : 0
    const fivefers = Math.min((bowl.five_fers || 0) * 10, 10)
    bowlScore = wktsNorm + econPts + avgPts + fivefers
  }
  const role = detectRole(bat, bowl, styles)
  let composite = 0
  if (role === 'Bowler') composite = batScore * 0.20 + bowlScore * 0.80
  else if (role === 'Batsman' || role === 'Wicket-Keeper') composite = batScore * 0.80 + bowlScore * 0.20
  else {
    const bonus = (bat?.runs || 0) >= 25 && (bowl?.wickets || 0) >= 3 ? Math.min(((bat?.runs || 0) / 60 + (bowl?.wickets || 0) / 5) * 5, 10) : 0
    composite = batScore * 0.50 + bowlScore * 0.50 + bonus
  }
  const engMult = 0.85 + 0.15 * Math.min(matches / 8, 1)
  const confidence = Math.min(0.4 + Math.max(matches - 1, 0) / 3 * 0.6, 1)
  const final = Math.min(composite * engMult * confidence, 100)
  return { score: Math.round(final * 10) / 10, batScore: Math.round(batScore), bowlScore: Math.round(bowlScore), role }
}
