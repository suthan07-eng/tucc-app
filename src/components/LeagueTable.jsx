import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { C, FONT } from '../constants'

const EASE_OUT = [0.23, 1, 0.32, 1]

const rowVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.28, ease: EASE_OUT, delay: i * 0.045 },
  }),
}

// Teams we want to highlight
const OUR_TEAMS = ['Tamil United', 'TUCC', 'DTU']

function isOurTeam(name) {
  return OUR_TEAMS.some(t => name.toLowerCase().includes(t.toLowerCase()))
}

function NRRBadge({ nrr }) {
  const n = parseFloat(nrr)
  const color = n > 0 ? C.ok : n < 0 ? C.red : C.gray3
  return (
    <span style={{ color, fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 12 }}>
      {n > 0 ? '+' : ''}{nrr}
    </span>
  )
}

function FormDots({ w, l, p }) {
  const played = parseInt(p) || 0
  const wins   = parseInt(w) || 0
  const losses = parseInt(l) || 0
  const other  = played - wins - losses
  const dots = [
    ...Array(wins).fill('w'),
    ...Array(losses).fill('l'),
    ...Array(Math.max(0, other)).fill('d'),
  ].slice(0, 5)
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {dots.map((d, i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: d === 'w' ? C.ok : d === 'l' ? C.red : C.gray3,
        }} />
      ))}
    </div>
  )
}

export default function LeagueTable() {
  const [teams, setTeams]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [source, setSource]       = useState(null)

  useEffect(() => {
    fetch('/api/league-table')
      .then(r => r.json())
      .then(d => {
        setTeams(d.teams || [])
        setUpdatedAt(d.updatedAt)
        setSource(d.source)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (error) return null // Fail silently — don't break the home page

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 4 }}>
        <div>
          <div style={{
            display: 'inline-block',
            fontSize: 9.5, fontWeight: 700, letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 999, padding: '3px 10px', marginBottom: 7,
          }}>British Tamil Cricket League</div>
          <div style={{
            fontSize: 18, fontWeight: 800,
            color: '#fff',
            backgroundImage: 'linear-gradient(92deg,#60a5fa,#c084fc 60%,#f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            🏆 BTCL Premier League 2026
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {source === 'live' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: C.ok, fontWeight: 600 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.ok, animation: 'pendingPulse 1.8s ease-in-out infinite', display: 'inline-block' }} />
              Live
            </span>
          )}
          {updatedAt && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {source === 'fallback' ? 'As of ' : 'Updated '}
              {new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* Table card */}
      <div style={{
        background: 'linear-gradient(150deg, rgba(37,99,235,0.34), rgba(124,58,237,0.30) 60%, rgba(20,184,166,0.20))',
        borderRadius: 22,
        boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)',
        border: '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        overflow: 'hidden',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 32px 32px 32px 48px 56px',
          gap: 0,
          padding: '11px 14px',
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}>
          {['#', 'Team', 'P', 'W', 'L', 'NRR', 'Pts'].map((h, i) => (
            <div key={h} style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase', letterSpacing: 0.6,
              textAlign: i === 1 ? 'left' : 'center',
            }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 32px 32px 32px 48px 56px',
                padding: '12px 14px',
                borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                alignItems: 'center', gap: 0,
              }}>
                <div style={{ height: 10, width: 12, background: 'rgba(255,255,255,0.10)', borderRadius: 4 }} />
                <div style={{ height: 10, width: `${60 + (i % 3) * 20}%`, background: 'rgba(255,255,255,0.10)', borderRadius: 4 }} />
                {[1,2,3,4,5].map(j => (
                  <div key={j} style={{ height: 10, width: 20, background: 'rgba(255,255,255,0.10)', borderRadius: 4, margin: '0 auto' }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {teams.map((t, i) => {
              const highlight = isOurTeam(t.team)
              return (
                <motion.div
                  key={t.pos}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr 32px 32px 32px 48px 56px',
                    padding: '11px 14px',
                    borderBottom: i < teams.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    alignItems: 'center',
                    gap: 0,
                    background: highlight
                      ? 'linear-gradient(90deg, rgba(192,132,252,0.20) 0%, rgba(192,132,252,0.06) 100%)'
                      : (i % 2 === 1 ? 'rgba(255,255,255,0.03)' : 'transparent'),
                    borderLeft: highlight ? '3px solid #c084fc' : '3px solid transparent',
                    transition: 'background 200ms ease',
                  }}
                >
                  {/* Position */}
                  <div style={{
                    fontSize: 12, fontWeight: t.pos <= 3 ? 800 : 500,
                    color: t.pos === 1 ? C.gold : t.pos <= 3 ? '#c084fc' : 'rgba(255,255,255,0.5)',
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {t.pos === 1 ? '🥇' : t.pos === 2 ? '🥈' : t.pos === 3 ? '🥉' : t.pos}
                  </div>

                  {/* Team name */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: highlight ? 700 : 500,
                      color: highlight ? '#c084fc' : '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {highlight && <span style={{ marginRight: 4 }}>🏏</span>}
                      {t.team}
                    </div>
                    <FormDots w={t.w} l={t.l} p={t.p} />
                  </div>

                  {/* P */}
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.p}</div>
                  {/* W */}
                  <div style={{ fontSize: 12, color: C.ok, fontWeight: 600, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.w}</div>
                  {/* L */}
                  <div style={{ fontSize: 12, color: t.l > 0 ? C.red : 'rgba(255,255,255,0.5)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.l}</div>
                  {/* NRR */}
                  <div style={{ textAlign: 'center' }}><NRRBadge nrr={t.nrr} /></div>
                  {/* Pts */}
                  <div style={{
                    fontSize: 14, fontWeight: 800,
                    color: highlight ? '#c084fc' : '#fff',
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{t.pts}</div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            P=Played · W=Won · L=Lost · NRR=Net Run Rate · Pts=Points
          </span>
          <a
            href="https://dtucc.play-cricket.com/website/division/137680"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, fontFamily: FONT, textDecoration: 'none' }}
          >
            Full table →
          </a>
        </div>
      </div>
    </div>
  )
}
