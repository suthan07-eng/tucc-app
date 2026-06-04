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
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    fetch('/api/league-table')
      .then(r => r.json())
      .then(d => {
        setTeams(d.teams || [])
        setUpdatedAt(d.updatedAt)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (error) return null // Fail silently — don't break the home page

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 4 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gray5 }}>
            🏆 BTCL Premier League 2026
          </div>
          <div style={{ fontSize: 11, color: C.gray3, marginTop: 2 }}>British Tamil Cricket League</div>
        </div>
        {updatedAt && (
          <span style={{ fontSize: 11, color: C.gray3 }}>
            Updated {new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Table card */}
      <div style={{
        background: C.white,
        borderRadius: 18,
        boxShadow: `0 2px 12px ${C.shadow}, 0 1px 3px ${C.shadowMd}`,
        border: `1px solid ${C.gray2}`,
        overflow: 'hidden',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 32px 32px 32px 48px 56px',
          gap: 0,
          padding: '10px 14px',
          background: C.gray1,
          borderBottom: `1px solid ${C.gray2}`,
        }}>
          {['#', 'Team', 'P', 'W', 'L', 'NRR', 'Pts'].map((h, i) => (
            <div key={h} style={{
              fontSize: 10, fontWeight: 700, color: C.gray3,
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
                borderBottom: i < 7 ? `1px solid ${C.gray1}` : 'none',
                alignItems: 'center', gap: 0,
              }}>
                <div style={{ height: 10, width: 12, background: C.gray2, borderRadius: 4 }} />
                <div style={{ height: 10, width: `${60 + (i % 3) * 20}%`, background: C.gray2, borderRadius: 4 }} />
                {[1,2,3,4,5].map(j => (
                  <div key={j} style={{ height: 10, width: 20, background: C.gray2, borderRadius: 4, margin: '0 auto' }} />
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
                    borderBottom: i < teams.length - 1 ? `1px solid ${C.gray1}` : 'none',
                    alignItems: 'center',
                    gap: 0,
                    background: highlight
                      ? `linear-gradient(90deg, ${C.greenBg} 0%, rgba(230,244,237,0.4) 100%)`
                      : 'transparent',
                    borderLeft: highlight ? `3px solid ${C.green}` : '3px solid transparent',
                    transition: 'background 200ms ease',
                  }}
                >
                  {/* Position */}
                  <div style={{
                    fontSize: 12, fontWeight: t.pos <= 3 ? 800 : 500,
                    color: t.pos === 1 ? C.gold : t.pos <= 3 ? C.green : C.gray3,
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
                      color: highlight ? C.green : C.dark,
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
                  <div style={{ fontSize: 12, color: C.gray4, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.p}</div>
                  {/* W */}
                  <div style={{ fontSize: 12, color: C.ok, fontWeight: 600, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.w}</div>
                  {/* L */}
                  <div style={{ fontSize: 12, color: t.l > 0 ? C.red : C.gray3, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.l}</div>
                  {/* NRR */}
                  <div style={{ textAlign: 'center' }}><NRRBadge nrr={t.nrr} /></div>
                  {/* Pts */}
                  <div style={{
                    fontSize: 14, fontWeight: 800,
                    color: highlight ? C.green : C.dark,
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
          borderTop: `1px solid ${C.gray2}`,
          background: C.gray1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: C.gray3 }}>
            P=Played · W=Won · L=Lost · NRR=Net Run Rate · Pts=Points
          </span>
          <a
            href="https://dtucc.play-cricket.com/website/division/137680"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: C.green, fontWeight: 600, fontFamily: FONT, textDecoration: 'none' }}
          >
            Full table →
          </a>
        </div>
      </div>
    </div>
  )
}
