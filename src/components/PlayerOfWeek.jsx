import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { C, FONT } from '../constants'

// Decorative SVG cricket ball
function CricketBallBg({ color, size = 220, opacity = 0.06 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute', pointerEvents: 'none' }}>
      <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="0.8" opacity={opacity * 2} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="0.5" opacity={opacity} />
      {/* seam lines */}
      <path d="M 18 30 Q 50 44 82 30" fill="none" stroke={color} strokeWidth="0.8" opacity={opacity * 3} />
      <path d="M 18 70 Q 50 56 82 70" fill="none" stroke={color} strokeWidth="0.8" opacity={opacity * 3} />
      <path d="M 30 18 Q 44 50 30 82" fill="none" stroke={color} strokeWidth="0.8" opacity={opacity * 3} />
      <path d="M 70 18 Q 56 50 70 82" fill="none" stroke={color} strokeWidth="0.8" opacity={opacity * 3} />
    </svg>
  )
}

// Star particle
function Stars({ color }) {
  const positions = [
    { top: '12%', left: '8%', size: 3, delay: 0 },
    { top: '20%', right: '10%', size: 2, delay: 0.4 },
    { top: '60%', left: '5%', size: 2, delay: 0.8 },
    { bottom: '25%', right: '8%', size: 3, delay: 0.2 },
    { bottom: '15%', left: '15%', size: 2, delay: 0.6 },
    { top: '40%', right: '6%', size: 2, delay: 1.0 },
  ]
  return (
    <>
      {positions.map((p, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.5 + i * 0.3, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: p.size, height: p.size,
            borderRadius: '50%', background: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            top: p.top, left: p.left, right: p.right, bottom: p.bottom,
          }}
        />
      ))}
    </>
  )
}

function PosterCard({ hero, type, delay = 0 }) {
  const [imgOk, setImgOk] = useState(true)

  const isBatter = type === 'bat'

  // Colour palette
  const accent    = isBatter ? '#4ade80' : '#fb7185'
  const accentMid = isBatter ? '#22c55e' : '#f43f5e'
  const accentDk  = isBatter ? '#15803d' : '#be123c'
  const glow      = isBatter ? 'rgba(74,222,128,.5)' : 'rgba(251,113,133,.5)'
  const bgTop     = isBatter ? '#041a0d' : '#1a0308'
  const bgMid     = isBatter ? '#0a3318' : '#3b0717'
  const bgBot     = isBatter ? '#0f4422' : '#5c0e22'

  const stat      = isBatter ? hero.runs   : hero.wickets
  const label     = isBatter ? 'RUNS'      : 'WICKETS'
  const roleLabel = isBatter ? 'BEST BATTER' : 'BEST BOWLER'
  const roleIcon  = isBatter ? '🏏' : '🎯'
  const sub       = isBatter
    ? [
        hero.balls  ? `${hero.balls} balls`  : null,
        hero.fours  ? `${hero.fours} fours`  : null,
        hero.sixes  ? `${hero.sixes} sixes`  : null,
      ].filter(Boolean).join(' · ') || null
    : `${hero.overs} ov · ${hero.runsGiven} runs · Eco ${hero.economy}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      style={{
        flex: 1, minWidth: 270, maxWidth: 380,
        borderRadius: 28, overflow: 'hidden', position: 'relative',
        background: `linear-gradient(175deg, ${bgTop} 0%, ${bgMid} 45%, ${bgBot} 100%)`,
        boxShadow: `0 30px 80px ${glow}, 0 0 0 1px rgba(255,255,255,.07), inset 0 1px 0 rgba(255,255,255,.08)`,
      }}
    >
      {/* Decorative cricket ball watermark */}
      <div style={{ position: 'absolute', bottom: -40, right: -40, opacity: 1 }}>
        <CricketBallBg color={accent} size={240} opacity={0.055} />
      </div>

      {/* Radial spotlight behind photo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 320,
        background: `radial-gradient(ellipse 70% 60% at 50% 30%, ${accentMid}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Twinkling stars */}
      <Stars color={accent} />

      {/* Top accent bar */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, transparent 0%, ${accentDk} 20%, ${accent} 50%, ${accentDk} 80%, transparent 100%)`,
      }} />

      {/* Role badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: `linear-gradient(135deg, ${accentDk}55, ${accentMid}33)`,
          border: `1px solid ${accentMid}55`,
          backdropFilter: 'blur(10px)',
          borderRadius: 30, padding: '7px 14px',
        }}>
          <span style={{ fontSize: 13 }}>{roleIcon}</span>
          <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 900, color: accent, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {roleLabel}
          </span>
        </div>
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          style={{ fontSize: 26 }}
        >🏆</motion.div>
      </div>

      {/* Photo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20 }}>
        {/* Outer glow ring */}
        <div style={{
          width: 118, height: 118, borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${accent}, ${accentDk}, ${accent}, ${accentDk}, ${accent})`,
          padding: 3,
          boxShadow: `0 0 0 6px ${accentMid}22, 0 0 40px ${glow}`,
          position: 'relative',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
            background: bgTop,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {imgOk && hero.photoUrl ? (
              <img
                src={hero.photoUrl}
                alt={hero.displayName}
                onError={() => setImgOk(false)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              />
            ) : (
              <span style={{ fontSize: 46 }}>👤</span>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginTop: 14, textAlign: 'center', padding: '0 20px' }}>
          <div style={{
            fontFamily: FONT, fontWeight: 900, fontSize: 24, color: '#fff',
            letterSpacing: -0.5, textShadow: `0 2px 20px ${glow}`,
          }}>
            {hero.displayName}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: `${accent}99`, marginTop: 2, fontWeight: 500 }}>
            {hero.name.split(' ').slice(1).join(' ')}
          </div>
        </div>

        {/* Divider with dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '16px 0', width: '75%' }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${accentMid}44)` }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: accent }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: accent }} />
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accentMid}44, transparent)` }} />
        </div>

        {/* Big stat number */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          {/* Number glow backdrop */}
          <div style={{
            position: 'absolute', inset: -10,
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${accentMid}30 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            fontFamily: FONT, fontWeight: 900, fontSize: 76, color: '#fff',
            lineHeight: 1, letterSpacing: -4,
            textShadow: `0 0 40px ${glow}, 0 4px 0 ${accentDk}`,
          }}>
            {stat}
          </div>
          <div style={{
            fontFamily: FONT, fontWeight: 900, fontSize: 12, letterSpacing: 4,
            marginTop: 2,
            background: `linear-gradient(90deg, ${accentDk}, ${accent}, ${accentDk})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {label}
          </div>
          {sub && (
            <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 7, letterSpacing: 0.3 }}>
              {sub}
            </div>
          )}
        </div>

        {/* Message banner */}
        <div style={{
          margin: '16px 16px 20px',
          background: `linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.03))`,
          borderRadius: 16, padding: '12px 16px',
          border: `1px solid ${accentMid}30`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Left accent line */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: `linear-gradient(180deg, ${accent}, ${accentDk})`,
            borderRadius: '3px 0 0 3px',
          }} />
          <div style={{
            fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.75)',
            lineHeight: 1.6, textAlign: 'center', paddingLeft: 4,
          }}>
            {hero.message}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ShimmerCard() {
  return (
    <div style={{ flex: 1, minWidth: 270, borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(175deg,#0a1f0e,#0f2d14)', height: 480, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.04) 50%,transparent 100%)', animation: 'shimmer 1.6s infinite' }} />
    </div>
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

  const hasBatter = data?.batter
  const hasBowler = data?.bowler
  if (!loading && !hasBatter && !hasBowler) return null

  return (
    <div style={{ marginTop: compact ? 0 : 28, marginBottom: compact ? 0 : 28 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 22, borderRadius: 99, background: `linear-gradient(180deg, #fbbf24, #d97706)` }} />
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 17, color: C.dark, letterSpacing: -0.3 }}>
            Player of the Week 🏆
          </span>
        </div>
        {data?.matchDate && (
          <span style={{ fontFamily: FONT, fontSize: 12, color: C.gray3, fontWeight: 500 }}>
            {data.matchDate}{data.opponent ? ` · vs ${data.opponent}` : ''}
          </span>
        )}
      </div>

      {/* Poster cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {loading ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : (
          <>
            {hasBatter && <PosterCard hero={data.batter} type="bat"  delay={0} />}
            {hasBowler && <PosterCard hero={data.bowler} type="bowl" delay={0.15} />}
          </>
        )}
      </div>
    </div>
  )
}
