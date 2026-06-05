import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, ChevronDown, ExternalLink } from 'lucide-react'
import { C, FONT } from '../constants'

const EASE_OUT = [0.23, 1, 0.32, 1]
const OUR_NAMES = ['Tamil United', 'TUCC', 'DTU']

const isOurs    = (name = '') => OUR_NAMES.some(t => name.toLowerCase().includes(t.toLowerCase()))
const weWon     = (r) => isOurs(r.winner)
const involved  = (r) => isOurs(r.team1) || isOurs(r.team2)

function groupByDate(results) {
  const map = {}
  results.forEach(r => {
    const k = r.date || 'Unknown date'
    if (!map[k]) map[k] = []
    map[k].push(r)
  })
  return Object.entries(map)
}

// Team logo with graceful fallback to initials
function TeamLogo({ logo, name, size = 36 }) {
  const [error, setError] = useState(false)
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  if (!logo || error) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontFamily: FONT, fontWeight: 800,
        fontSize: Math.round(size * 0.32), color: '#fff',
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
      boxShadow: '0 1px 4px rgba(0,0,0,.1)',
    }}>
      <img
        src={logo}
        alt={name}
        width={size - 4}
        height={size - 4}
        style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        onError={() => setError(true)}
      />
    </div>
  )
}

function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(false)
  const us  = involved(result)
  const won = us && weWon(result)

  const accentColor  = us ? (won ? C.ok : C.red) : C.gray5
  const accentBg     = us ? (won ? C.okBg : '#fef2f2') : C.white
  const accentBorder = us ? (won ? '#bbf7d0' : '#fecaca') : C.gray2

  // Shorten team names for display
  const shorten = name => name
    .replace('Sports & Social Club', '')
    .replace('- 1st XI', '').replace('- Knights', '').replace('- A', '').replace('- B', '')
    .trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT, delay: index * 0.04 }}
      style={{
        background: accentBg,
        borderRadius: 16,
        border: `1px solid ${accentBorder}`,
        overflow: 'hidden',
        boxShadow: us
          ? `0 2px 14px ${won ? 'rgba(21,128,61,.12)' : 'rgba(200,48,42,.1)'}`
          : `0 1px 4px ${C.shadow}`,
      }}
    >
      {/* Result banner */}
      <div style={{
        padding: '7px 14px',
        background: accentColor,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {us && won && <Trophy size={12} color="#fff" strokeWidth={2.5} />}
          <span style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 700,
            color: '#fff', letterSpacing: 0.3,
          }}>
            {us
              ? (won ? '🏏 Tamil United won' : '🏏 Tamil United lost')
              : shorten(result.winner).substring(0, 26)
            } — by {result.margin}
          </span>
        </div>
        {result.scorecardUrl && (
          <a
            href={result.scorecardUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.8)',
              textDecoration: 'none', flexShrink: 0,
              fontFamily: FONT,
            }}
          >
            Scorecard <ExternalLink size={10} strokeWidth={2} />
          </a>
        )}
      </div>

      {/* Scores */}
      <div style={{ padding: '12px 14px' }}>
        {/* Team 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TeamLogo logo={result.logo1} name={result.team1} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: FONT, fontSize: 13,
              fontWeight: isOurs(result.team1) ? 700 : 500,
              color: isOurs(result.team1) ? C.green : C.dark,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isOurs(result.team1) ? '🏏 ' : ''}{shorten(result.team1)}
            </div>
            {result.score1 && (
              <div style={{
                fontFamily: FONT, fontSize: 12, fontWeight: 700,
                color: C.gray5, marginTop: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {result.score1.replace('Allout', 'All out')}
              </div>
            )}
          </div>
          {result.pts1 && <PtsBadge pts={result.pts1} />}
        </div>

        {/* VS divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.gray2 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.gray3, letterSpacing: 1 }}>VS</span>
          <div style={{ flex: 1, height: 1, background: C.gray2 }} />
        </div>

        {/* Team 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TeamLogo logo={result.logo2} name={result.team2} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: FONT, fontSize: 13,
              fontWeight: isOurs(result.team2) ? 700 : 500,
              color: isOurs(result.team2) ? C.green : C.dark,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isOurs(result.team2) ? '🏏 ' : ''}{shorten(result.team2)}
            </div>
            {result.score2 && (
              <div style={{
                fontFamily: FONT, fontSize: 12, fontWeight: 700,
                color: C.gray5, marginTop: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
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

function PtsBadge({ pts }) {
  const n = parseInt(pts)
  const color  = n >= 15 ? C.ok    : n >= 10 ? '#b45309' : C.gray3
  const bg     = n >= 15 ? C.okBg  : n >= 10 ? '#fef9ec' : C.gray1
  const border = n >= 15 ? '#bbf7d0' : n >= 10 ? '#fde68a' : C.gray2
  return (
    <span style={{
      fontFamily: FONT, fontSize: 10, fontWeight: 800,
      color, background: bg, border: `1px solid ${border}`,
      borderRadius: 5, padding: '2px 7px',
      flexShrink: 0, textAlign: 'center',
      fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
    }}>
      {pts} pts
    </span>
  )
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.gray2}` }}>
      <div style={{ height: 32, background: C.gray2 }} />
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.gray1, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: 12, width: '60%', borderRadius: 6, background: C.gray1 }} />
              <div style={{ height: 10, width: '35%', borderRadius: 6, background: C.gray1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Results() {
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [source, setSource]       = useState(null)
  const [showAll, setShowAll]     = useState(false)

  useEffect(() => {
    fetch('/api/results')
      .then(r => r.json())
      .then(d => {
        setResults(d.results || [])
        setUpdatedAt(d.updatedAt)
        setSource(d.source)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const visible = showAll ? results : results.slice(0, 6)
  const grouped = groupByDate(visible)

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 4 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gray5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color={C.gray4} strokeWidth={2} />
            Last 10 Results
          </div>
          <div style={{ fontSize: 11, color: C.gray3, marginTop: 2 }}>BTCL Premier League 2026</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {source === 'live' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: C.ok, fontWeight: 600 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.ok, animation: 'pendingPulse 1.8s ease-in-out infinite', display: 'inline-block' }} />
              Live
            </span>
          )}
          {updatedAt && (
            <span style={{ fontSize: 11, color: C.gray3 }}>
              {new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: C.gray3, fontSize: 13 }}>
          No results yet this season.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {grouped.map(([date, dateResults]) => (
              <div key={date}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: C.gray3,
                  letterSpacing: 0.6, textTransform: 'uppercase',
                  marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ whiteSpace: 'nowrap' }}>{date}</span>
                  <div style={{ flex: 1, height: 1, background: C.gray2 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dateResults.map((result, i) => (
                    <ResultCard key={i} result={result} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Show more */}
          {results.length > 6 && (
            <motion.button
              onClick={() => setShowAll(s => !s)}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop: 12, width: '100%',
                background: C.gray1, border: `1px solid ${C.gray2}`,
                borderRadius: 12, padding: '11px 16px',
                fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.gray4,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.gray2 }}
              onMouseLeave={e => { e.currentTarget.style.background = C.gray1 }}
            >
              <ChevronDown size={15} strokeWidth={2} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} />
              {showAll ? 'Show fewer' : `Show all ${results.length} results`}
            </motion.button>
          )}

          <div style={{ marginTop: 10, textAlign: 'right' }}>
            <a
              href="https://dtucc.play-cricket.com/website/division/137680?type=last_10_results"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: C.green, fontWeight: 600, fontFamily: FONT, textDecoration: 'none' }}
            >
              Full results on play-cricket →
            </a>
          </div>
        </>
      )}
    </div>
  )
}
