import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { C, FONT } from '../constants'

const FADE = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } } }

// Shimmer card while loading
function ShimmerCard() {
  return (
    <div style={{ flex: 1, minWidth: 260, borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,.06)', height: 340, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.05) 50%,transparent 100%)', animation: 'shimmer 1.5s infinite' }} />
    </div>
  )
}

// Single hero card (batter or bowler)
function HeroCard({ hero, type, delay = 0 }) {
  const [imgOk, setImgOk] = useState(true)

  const isBatter = type === 'bat'
  const accent   = isBatter ? '#22c55e' : '#f43f5e'
  const accentDk = isBatter ? '#16a34a' : '#e11d48'
  const bg       = isBatter
    ? 'linear-gradient(145deg,#0a2e1a 0%,#0f3d22 40%,#145228 70%,#1a6334 100%)'
    : 'linear-gradient(145deg,#1a0308 0%,#6b0f1a 40%,#881523 70%,#a51c2c 100%)'
  const glow     = isBatter ? 'rgba(34,197,94,.35)' : 'rgba(244,63,94,.35)'
  const icon     = isBatter ? '🏏' : '🎯'
  const label    = isBatter ? 'RUNS' : 'WICKETS'
  const stat     = isBatter ? hero.runs : hero.wickets
  const sub      = isBatter
    ? `${hero.balls} balls · ${hero.fours} fours · ${hero.sixes} sixes`
    : `${hero.overs} overs · ${hero.runsGiven} runs · Eco ${hero.economy}`

  return (
    <motion.div
      variants={FADE}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      style={{
        flex: 1, minWidth: 260, maxWidth: 380,
        borderRadius: 24, overflow: 'hidden', position: 'relative',
        background: bg,
        boxShadow: `0 20px 60px ${glow}, 0 0 0 1px rgba(255,255,255,.08)`,
      }}
    >
      {/* Top shimmer bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${accent},${accentDk},transparent)` }} />

      {/* Badge top-left */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        background: `rgba(255,255,255,.1)`, backdropFilter: 'blur(8px)',
        borderRadius: 12, padding: '6px 10px',
        display: 'flex', alignItems: 'center', gap: 5,
        border: '1px solid rgba(255,255,255,.15)',
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1, textTransform: 'uppercase' }}>
          {isBatter ? 'Best Batter' : 'Best Bowler'}
        </span>
      </div>

      {/* Trophy top-right */}
      <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 22, opacity: 0.7 }}>🏆</div>

      {/* Profile photo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 52 }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
          border: `3px solid ${accent}`,
          boxShadow: `0 0 0 4px rgba(255,255,255,.08), 0 8px 24px ${glow}`,
          background: 'rgba(255,255,255,.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {imgOk && hero.photoUrl ? (
            <img
              src={hero.photoUrl}
              alt={hero.displayName}
              onError={() => setImgOk(false)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 36 }}>👤</span>
          )}
        </div>

        {/* Name */}
        <div style={{ marginTop: 12, textAlign: 'center', padding: '0 16px' }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: -0.3 }}>
            {hero.displayName}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>
            {hero.name.split(' ').slice(1).join(' ')}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '60%', height: 1, background: 'rgba(255,255,255,.1)', margin: '14px 0' }} />

        {/* Stat */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
            {stat}
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 11, color: accent, letterSpacing: 2, marginTop: 2 }}>
            {label}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 6, letterSpacing: 0.2 }}>
            {sub}
          </div>
        </div>

        {/* Message */}
        <div style={{
          margin: '14px 16px 20px',
          background: 'rgba(255,255,255,.06)',
          borderRadius: 12, padding: '10px 14px',
          border: `1px solid rgba(255,255,255,.08)`,
          fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.7)',
          lineHeight: 1.55, textAlign: 'center',
        }}>
          {hero.message}
        </div>
      </div>
    </motion.div>
  )
}

export default function PlayerOfWeek({ compact = false }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/potw?v=' + Date.now())
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Nothing to show
  const hasBatter = data?.batter
  const hasBowler = data?.bowler
  if (!loading && !hasBatter && !hasBowler) return null

  return (
    <div style={{ marginTop: compact ? 0 : 28, marginBottom: compact ? 0 : 28 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 20, borderRadius: 99, background: C.gold }} />
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 17, color: C.dark }}>
            Player of the Week 🏆
          </span>
        </div>
        {data?.matchDate && (
          <span style={{ fontFamily: FONT, fontSize: 12, color: C.gray3, fontWeight: 500 }}>
            {data.matchDate}{data.opponent ? ` · vs ${data.opponent}` : ''}
          </span>
        )}
      </div>

      {/* Cards row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {loading ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : (
          <>
            {hasBatter && <HeroCard hero={data.batter} type="bat" delay={0} />}
            {hasBowler && <HeroCard hero={data.bowler} type="bowl" delay={0.12} />}
          </>
        )}
      </div>

      {/* Powered-by note */}
      {data?.scorecardUrl && !loading && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <a
            href={data.scorecardUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: FONT, fontSize: 11, color: C.gray3, textDecoration: 'none' }}
          >
            View full scorecard ↗
          </a>
        </div>
      )}
    </div>
  )
}
