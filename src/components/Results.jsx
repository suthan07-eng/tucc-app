import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, ChevronRight } from 'lucide-react'
import { C, FONT } from '../constants'

const EASE_OUT = [0.23, 1, 0.32, 1]
const OUR_TEAMS = ['Tamil United', 'TUCC', 'DTU']

function isOurTeam(name = '') {
  return OUR_TEAMS.some(t => name.toLowerCase().includes(t.toLowerCase()))
}

function didOurTeamWin(result) {
  return isOurTeam(result.winner)
}

// Group results by date
function groupByDate(results) {
  const groups = {}
  results.forEach(r => {
    const key = r.date || 'Unknown date'
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  })
  return Object.entries(groups)
}

function ResultCard({ result, index }) {
  const ourTeam = isOurTeam(result.team1) || isOurTeam(result.team2)
  const weWon   = didOurTeamWin(result)

  // Determine which team batted first (team1) vs chased (team2)
  const team1Short = result.team1.replace(/\s*-\s*(1st XI|A|B|Knights)$/, '').trim()
  const team2Short = result.team2.replace(/\s*-\s*(1st XI|A|B|Knights)$/, '').trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: EASE_OUT, delay: index * 0.04 }}
      style={{
        background: ourTeam
          ? weWon
            ? `linear-gradient(135deg, ${C.okBg} 0%, rgba(230,244,237,0.3) 100%)`
            : `linear-gradient(135deg, #fef2f2 0%, rgba(254,242,242,0.3) 100%)`
          : C.white,
        borderRadius: 14,
        border: `1px solid ${ourTeam ? (weWon ? '#bbf7d0' : '#fecaca') : C.gray2}`,
        overflow: 'hidden',
        boxShadow: ourTeam ? `0 2px 12px ${weWon ? 'rgba(21,128,61,.1)' : 'rgba(200,48,42,.1)'}` : `0 1px 4px ${C.shadow}`,
      }}
    >
      {/* Result banner */}
      <div style={{
        padding: '8px 14px',
        background: ourTeam
          ? weWon ? C.ok : C.red
          : C.gray5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {ourTeam && weWon && <Trophy size={13} color="#fff" strokeWidth={2.5} />}
          <span style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 700,
            color: '#fff', letterSpacing: 0.4, textTransform: 'uppercase',
          }}>
            {ourTeam
              ? weWon ? 'Tamil United Won' : 'Tamil United Lost'
              : result.winner.length > 30 ? result.winner.substring(0, 28) + '…' : result.winner
            } — won by {result.margin}
          </span>
        </div>
      </div>

      {/* Scores */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Team 1 row */}
        <ScoreRow
          teamName={team1Short}
          fullName={result.team1}
          score={result.score1}
          pts={result.pts1}
          highlight={isOurTeam(result.team1)}
        />

        {/* VS divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ flex: 1, height: 1, background: C.gray2 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.gray3, letterSpacing: 1 }}>VS</span>
          <div style={{ flex: 1, height: 1, background: C.gray2 }} />
        </div>

        {/* Team 2 row */}
        <ScoreRow
          teamName={team2Short}
          fullName={result.team2}
          score={result.score2}
          pts={result.pts2}
          highlight={isOurTeam(result.team2)}
          winner={result.winner}
        />
      </div>
    </motion.div>
  )
}

function ScoreRow({ teamName, fullName, score, pts, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Team name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONT, fontSize: 13,
          fontWeight: highlight ? 700 : 500,
          color: highlight ? C.green : C.dark,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {highlight && '🏏 '}{teamName}
        </div>
      </div>

      {/* Score */}
      {score && (
        <span style={{
          fontFamily: FONT, fontSize: 12, fontWeight: 600,
          color: C.gray5, fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>
          {score.replace('Allout', 'all out').replace('Allout', 'all out')}
        </span>
      )}

      {/* Points badge */}
      {pts && (
        <span style={{
          fontFamily: FONT, fontSize: 10, fontWeight: 800,
          color: parseInt(pts) >= 15 ? C.ok : parseInt(pts) >= 10 ? C.gold : C.gray3,
          background: parseInt(pts) >= 15 ? C.okBg : parseInt(pts) >= 10 ? '#fef9ec' : C.gray1,
          border: `1px solid ${parseInt(pts) >= 15 ? '#bbf7d0' : parseInt(pts) >= 10 ? '#fde68a' : C.gray2}`,
          borderRadius: 5, padding: '2px 6px',
          flexShrink: 0, minWidth: 32, textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pts} pts
        </span>
      )}
    </div>
  )
}

export default function Results() {
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [source, setSource]       = useState(null)
  const [expanded, setExpanded]   = useState(false)

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

  const visible = expanded ? results : results.slice(0, 5)
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

      {/* Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${C.gray2}`,
            }}>
              <div style={{ height: 34, background: C.gray2, animation: 'shimmer 1.4s infinite linear', backgroundSize: '200% 100%', backgroundImage: `linear-gradient(90deg, ${C.gray2} 25%, ${C.gray1} 50%, ${C.gray2} 75%)` }} />
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[80, 65].map((w, j) => (
                  <div key={j} style={{ height: 14, width: `${w}%`, borderRadius: 6, background: C.gray1, animation: 'shimmer 1.4s infinite linear', backgroundSize: '200% 100%', backgroundImage: `linear-gradient(90deg, ${C.gray1} 25%, ${C.gray2} 50%, ${C.gray1} 75%)` }} />
                ))}
              </div>
            </div>
          ))}
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
                {/* Date header */}
                <div style={{
                  fontSize: 11, fontWeight: 700, color: C.gray3,
                  letterSpacing: 0.6, textTransform: 'uppercase',
                  marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>{date}</span>
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

          {/* Show more / less */}
          {results.length > 5 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                marginTop: 12, width: '100%',
                background: C.gray1, border: `1px solid ${C.gray2}`,
                borderRadius: 10, padding: '10px 16px',
                fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.gray4,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background 150ms ease, color 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.gray2; e.currentTarget.style.color = C.gray5 }}
              onMouseLeave={e => { e.currentTarget.style.background = C.gray1; e.currentTarget.style.color = C.gray4 }}
            >
              <ChevronRight size={14} strokeWidth={2} style={{ transform: expanded ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 200ms ease' }} />
              {expanded ? 'Show fewer results' : `Show all ${results.length} results`}
            </button>
          )}

          {/* Footer link */}
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
