import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, ChevronDown, ExternalLink, ArrowLeft, RotateCw } from 'lucide-react'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'

const EASE_OUT = [0.23, 1, 0.32, 1]
const OUR_NAMES = ['Tamil United', 'TUCC', 'DTU']

const isOurs   = (name = '') => OUR_NAMES.some(t => name.toLowerCase().includes(t.toLowerCase()))
const involved = (r) => isOurs(r.team1) || isOurs(r.team2)
const weWon    = (r) => isOurs(r.winner)

function groupByDate(results) {
  const map = {}
  results.forEach(r => {
    const k = r.date || 'Unknown date'
    if (!map[k]) map[k] = []
    map[k].push(r)
  })
  return Object.entries(map)
}

function TeamLogo({ logo, name, size = 44 }) {
  const [error, setError] = useState(false)
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  if (!logo || error) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontFamily: FONT, fontWeight: 800,
        fontSize: Math.round(size * 0.3), color: '#fff',
        border: `2px solid ${C.gray2}`,
      }}>
        {initials}
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#fff', overflow: 'hidden', flexShrink: 0,
      border: `2px solid ${C.gray2}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,.1)',
    }}>
      <img
        src={logo} alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={() => setError(true)}
      />
    </div>
  )
}

function PtsBadge({ pts }) {
  const n = parseInt(pts)
  const color  = n >= 15 ? C.ok    : n >= 10 ? '#b45309' : C.gray3
  const bg     = n >= 15 ? C.okBg  : n >= 10 ? '#fef9ec' : C.gray1
  const border = n >= 15 ? '#bbf7d0' : n >= 10 ? '#fde68a' : C.gray2
  return (
    <span style={{
      fontFamily: FONT, fontSize: 11, fontWeight: 800,
      color, background: bg, border: `1px solid ${border}`,
      borderRadius: 6, padding: '3px 8px',
      flexShrink: 0, textAlign: 'center',
      fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
    }}>
      {pts} pts
    </span>
  )
}

function ResultCard({ result, index }) {
  const us  = involved(result)
  const won = us && weWon(result)

  const bannerBg     = us ? (won ? C.ok  : C.red)     : C.gray5
  const cardBg       = us ? (won ? C.okBg : '#fef2f2') : C.white
  const cardBorder   = us ? (won ? '#bbf7d0' : '#fecaca') : C.gray2
  const cardShadow   = us
    ? `0 4px 20px ${won ? 'rgba(21,128,61,.14)' : 'rgba(200,48,42,.12)'}`
    : `0 2px 8px ${C.shadow}`

  const shorten = n => n
    .replace('Sports & Social Club', '').replace('- 1st XI', '')
    .replace('- Knights', '').replace(/\s*-\s*[AB]$/, '').trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT, delay: index * 0.05 }}
      style={{
        background: cardBg, borderRadius: 18,
        border: `1px solid ${cardBorder}`,
        overflow: 'hidden', boxShadow: cardShadow,
      }}
    >
      {/* Banner */}
      <div style={{
        padding: '10px 16px', background: bannerBg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {us && won && <Trophy size={13} color="#fff" strokeWidth={2.5} />}
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.2 }}>
            {us
              ? (won ? '🏏 Tamil United won' : '🏏 Tamil United lost')
              : shorten(result.winner).substring(0, 28)
            }
            {' '}— by {result.margin}
          </span>
        </div>
        {result.scorecardUrl && (
          <a
            href={result.scorecardUrl}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,.85)', textDecoration: 'none',
              flexShrink: 0, fontFamily: FONT,
              background: 'rgba(255,255,255,.15)', borderRadius: 6,
              padding: '3px 8px',
            }}
          >
            Scorecard <ExternalLink size={10} strokeWidth={2} />
          </a>
        )}
      </div>

      {/* Score rows */}
      <div style={{ padding: '16px' }}>
        {/* Team 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TeamLogo logo={result.logo1} name={result.team1} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: FONT, fontSize: 14,
              fontWeight: isOurs(result.team1) ? 700 : 500,
              color: isOurs(result.team1) ? C.green : C.dark,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isOurs(result.team1) ? '🏏 ' : ''}{shorten(result.team1)}
            </div>
            {result.score1 && (
              <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: C.dark, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {result.score1.replace('Allout', 'All out')}
              </div>
            )}
          </div>
          {result.pts1 && <PtsBadge pts={result.pts1} />}
        </div>

        {/* VS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.gray2 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.gray3, letterSpacing: 1.5 }}>VS</span>
          <div style={{ flex: 1, height: 1, background: C.gray2 }} />
        </div>

        {/* Team 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TeamLogo logo={result.logo2} name={result.team2} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: FONT, fontSize: 14,
              fontWeight: isOurs(result.team2) ? 700 : 500,
              color: isOurs(result.team2) ? C.green : C.dark,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isOurs(result.team2) ? '🏏 ' : ''}{shorten(result.team2)}
            </div>
            {result.score2 && (
              <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: C.dark, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {result.score2.replace('Allout', 'All out')}
              </div>
            )}
          </div>
          {result.pts2 && <PtsBadge pts={result.pts2} />}
        </div>
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.gray2}`, background: C.white }}>
      <div style={{ height: 42, background: C.gray2, backgroundImage: `linear-gradient(90deg, ${C.gray2} 25%, ${C.gray1} 50%, ${C.gray2} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite linear' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.gray1, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 14, width: '55%', borderRadius: 6, background: C.gray1 }} />
              <div style={{ height: 16, width: '35%', borderRadius: 6, background: C.gray1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const nav = useNavigate()
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [source, setSource]       = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = (bust = false) => {
    setRefreshing(true)
    const url = bust ? `/api/results?t=${Date.now()}` : '/api/results'
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setResults(d.results || [])
        setUpdatedAt(d.updatedAt)
        setSource(d.source)
        setLoading(false)
        setRefreshing(false)
      })
      .catch(() => { setError(true); setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { load() }, [])

  const grouped = groupByDate(results)

  // Stats summary
  const ourMatches    = results.filter(r => involved(r))
  const ourWins       = ourMatches.filter(r => weWon(r)).length
  const ourLosses     = ourMatches.length - ourWins
  const ourPts        = results.reduce((sum, r) => {
    if (isOurs(r.team1)) return sum + parseInt(r.pts1 || 0)
    if (isOurs(r.team2)) return sum + parseInt(r.pts2 || 0)
    return sum
  }, 0)

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* Hero header */}
      <div style={{
        background: `radial-gradient(ellipse at 70% 0%, ${C.greenLight}55 0%, transparent 60%), linear-gradient(160deg, ${C.greenDark} 0%, #163d28 100%)`,
        padding: '28px 20px 32px', position: 'relative',
      }}>
        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          <motion.button
            onClick={() => nav('/')}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.14, ease: EASE_OUT }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              color: 'rgba(255,255,255,.6)', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 14,
            }}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Home
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: '#fff', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,.2)', flexShrink: 0,
              }}>
                <img src="/logo.png" alt="DTU CC" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              </div>
              <div>
                <h1 style={{ color: C.white, fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.3 }}>
                  Last 10 Results
                </h1>
                <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, marginTop: 2 }}>
                  BTCL Premier League 2026
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tamil United mini stats */}
          {!loading && ourMatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE_OUT, delay: 0.1 }}
              style={{
                display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap',
              }}
            >
              {[
                { label: 'Matches', value: ourMatches.length, color: 'rgba(255,255,255,.9)' },
                { label: 'Wins',    value: ourWins,           color: '#86efac' },
                { label: 'Losses',  value: ourLosses,         color: '#fca5a5' },
                { label: 'Pts',     value: ourPts,            color: C.gold },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,.1)', borderRadius: 10,
                  padding: '8px 14px', textAlign: 'center', minWidth: 56,
                }}>
                  <div style={{ color, fontSize: 20, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                  <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 4 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontStyle: 'italic' }}>🏏 Tamil United CC stats</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '20px 16px 48px', width: '100%' }}>

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {source === 'live' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.ok, fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.ok, animation: 'pendingPulse 1.8s ease-in-out infinite', display: 'inline-block' }} />
                Live data
              </span>
            )}
            {updatedAt && (
              <span style={{ fontSize: 11, color: C.gray3 }}>
                · Updated {new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: `1px solid ${C.gray2}`, borderRadius: 8,
              padding: '5px 10px', cursor: refreshing ? 'default' : 'pointer',
              fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.gray4,
              opacity: refreshing ? 0.5 : 1, transition: 'opacity 150ms ease',
            }}
          >
            <RotateCw size={12} strokeWidth={2} style={{ animation: refreshing ? 'tucc-spin 0.65s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: `1px solid #fecaca`, borderRadius: 14,
            padding: '16px 20px', marginBottom: 20, textAlign: 'center',
            color: C.red, fontSize: 14, fontWeight: 500,
          }}>
            Couldn't load results. <button onClick={() => { setError(false); setLoading(true); load(true) }} style={{ color: C.green, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: FONT, fontSize: 14 }}>Try again →</button>
          </div>
        )}

        {/* Skeleton */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i}>
                <div style={{ height: 12, width: 100, background: C.gray2, borderRadius: 6, marginBottom: 10 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: i === 0 ? 3 : 1 }).map((_, j) => <SkeletonCard key={j} />)}
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: C.white, borderRadius: 18, border: `1px solid ${C.gray2}`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏏</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>No results yet</div>
            <div style={{ fontSize: 13, color: C.gray3, marginTop: 6 }}>Check back after the next match day.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {grouped.map(([date, dateResults], gi) => (
              <motion.div
                key={date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: gi * 0.06 }}
              >
                {/* Date header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                }}>
                  <div style={{
                    background: C.greenDark, borderRadius: 8, padding: '5px 12px',
                    fontFamily: FONT, fontSize: 11, fontWeight: 700,
                    color: C.gold, letterSpacing: 0.4,
                    flexShrink: 0,
                  }}>
                    {date}
                  </div>
                  <div style={{ flex: 1, height: 1, background: C.gray2 }} />
                  <span style={{ fontSize: 11, color: C.gray3, flexShrink: 0 }}>
                    {dateResults.length} match{dateResults.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {dateResults.map((result, i) => (
                    <ResultCard key={i} result={result} index={i} />
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Footer link */}
            <div style={{
              textAlign: 'center', paddingTop: 8,
              borderTop: `1px solid ${C.gray2}`, marginTop: 8,
            }}>
              <a
                href="https://dtucc.play-cricket.com/website/division/137680?type=last_10_results"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 13, color: C.green, fontWeight: 600,
                  fontFamily: FONT, textDecoration: 'none',
                }}
              >
                View full results on play-cricket
                <ExternalLink size={13} strokeWidth={2} />
              </a>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
