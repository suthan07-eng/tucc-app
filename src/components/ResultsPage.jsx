import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Clock, ExternalLink, ArrowLeft, RotateCw,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'

const EASE_OUT = [0.23, 1, 0.32, 1]
const OUR_NAMES = ['Tamil United', 'TUCC', 'DTU']

const isOurs   = (name = '') => OUR_NAMES.some(t => name.toLowerCase().includes(t.toLowerCase()))
const involved = (r) => isOurs(r.team1) || isOurs(r.team2)
const weWon    = (r) => isOurs(r.winner)

const TEAM_LOGOS = {
  'Dollishill Tamil United CC - Knights':               'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/15368/vector.png',
  'Lewisham CC - A':                                    'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/11733/lcc_logo1.JPG',
  'Northerns CC - A':                                   'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg',
  'Northerns CC - B':                                   'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16370/IMG_2013.jpeg',
  'Kent United CC - 1st XI':                            'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16346/KENT_UNITED_CC_mockup_new__1_.jpg',
  'Redbridge Lankians Sports & Social Club CC - 1st XI':'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/8492/logo.jpg',
  'Stanly CC - A':                                      'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16364/7E8264ED-7826-4974-9CEF-2D36D2116E39.jpeg',
  'West 3 CC - 1st XI':                                'https://s3-eu-west-1.amazonaws.com/p-c2gallery.ecb.co.uk/uploads/website_configuration/badge_image/16343/w3.JPG',
}

function getLogoForTeam(name) {
  if (TEAM_LOGOS[name]) return TEAM_LOGOS[name]
  const key = Object.keys(TEAM_LOGOS).find(k =>
    name.toLowerCase().includes(k.toLowerCase().split(' ')[0]) ||
    k.toLowerCase().includes(name.toLowerCase().split(' ')[0])
  )
  return key ? TEAM_LOGOS[key] : ''
}

function groupByDate(results) {
  const map = {}
  results.forEach(r => {
    const k = r.date || 'Unknown date'
    if (!map[k]) map[k] = []
    map[k].push(r)
  })
  return Object.entries(map)
}

const shorten = n => n
  .replace('Sports & Social Club', '').replace('- 1st XI', '')
  .replace('- Knights', '').replace(/\s*-\s*[AB]$/, '').trim()

// ── Team Logo ──────────────────────────────────────────────
function TeamLogo({ logo: logoProp, name, size = 52 }) {
  const [error, setError] = useState(false)
  const logo = getLogoForTeam(name) || logoProp
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const PALETTE = ['#2563eb','#7c3aed','#0369a1','#b45309','#0891b2','#be185d']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]

  if (!logo || error) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontFamily: FONT, fontWeight: 900,
        fontSize: Math.round(size * 0.3), color: '#fff',
        boxShadow: `0 4px 16px ${bg}40`,
      }}>
        {initials}
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: '#fff', overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,.12)',
      border: '2px solid rgba(255,255,255,.6)',
    }}>
      <img src={logo} alt={name}
        style={{ width: '90%', height: '90%', objectFit: 'contain' }}
        onError={() => setError(true)}
      />
    </div>
  )
}

// ── Points pill ────────────────────────────────────────────
function PtsBadge({ pts }) {
  const n = parseInt(pts)
  const configs = [
    [15, { bg: 'linear-gradient(135deg,#15803d,#3b82f6)', color: '#fff', shadow: '#15803d40' }],
    [10, { bg: 'linear-gradient(135deg,#b45309,#f59e0b)', color: '#fff', shadow: '#b4530940' }],
    [0,  { bg: C.gray1, color: C.gray4, shadow: 'none' }],
  ]
  const { bg, color, shadow } = configs.find(([min]) => n >= min)[1]
  return (
    <div style={{
      background: bg, color, fontFamily: FONT, fontSize: 12, fontWeight: 800,
      borderRadius: 10, padding: '5px 10px', textAlign: 'center',
      boxShadow: shadow !== 'none' ? `0 3px 10px ${shadow}` : 'none',
      flexShrink: 0, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      minWidth: 52,
    }}>
      {pts} pts
    </div>
  )
}

// ── Result Card ────────────────────────────────────────────
function ResultCard({ result, index }) {
  const us  = involved(result)
  const won = us && weWon(result)

  // Card theme
  const theme = us
    ? won
      ? {
          headerGrad:  'linear-gradient(135deg, #15803d 0%, #3b82f6 100%)',
          cardBg:      '#f0fdf4',
          cardBorder:  '#bbf7d0',
          shadow:      '0 8px 32px rgba(21,128,61,.18)',
          glow:        'rgba(21,128,61,.12)',
          accent:      '#15803d',
          scoreBg:     'rgba(21,128,61,.08)',
          label:       'Victory 🏆',
          labelColor:  '#fff',
        }
      : {
          headerGrad:  'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
          cardBg:      '#fff1f2',
          cardBorder:  '#fecaca',
          shadow:      '0 8px 32px rgba(190,18,60,.15)',
          glow:        'rgba(190,18,60,.08)',
          accent:      '#be123c',
          scoreBg:     'rgba(190,18,60,.06)',
          label:       'Defeat',
          labelColor:  '#fff',
        }
    : {
        headerGrad:  'linear-gradient(135deg, #334155 0%, #64748b 100%)',
        cardBg:      C.white,
        cardBorder:  C.gray2,
        shadow:      `0 4px 20px ${C.shadow}`,
        glow:        'transparent',
        accent:      C.gray5,
        scoreBg:     C.gray1,
        label:       null,
        labelColor:  '#fff',
      }

  const t1Ours = isOurs(result.team1)
  const t2Ours = isOurs(result.team2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay: index * 0.06 }}
      style={{
        background: theme.cardBg,
        borderRadius: 22,
        border: `1.5px solid ${theme.cardBorder}`,
        overflow: 'hidden',
        boxShadow: theme.shadow,
      }}
    >
      {/* ── Header band ── */}
      <div style={{
        background: theme.headerGrad,
        padding: '13px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Shine */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.12)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {us && won && <Trophy size={14} color="#fff" strokeWidth={2.5} style={{ flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: 0.2 }}>
              {us
                ? (won ? '🏏 Tamil United won' : '🏏 Tamil United lost')
                : `${shorten(result.winner || '')} won`
              }
            </div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 1 }}>
              by {result.margin}
            </div>
          </div>
        </div>

        {result.scorecardUrl && (
          <a
            href={result.scorecardUrl}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700,
              color: '#fff', textDecoration: 'none', flexShrink: 0,
              background: 'rgba(255,255,255,.2)',
              border: '1px solid rgba(255,255,255,.3)',
              borderRadius: 10, padding: '6px 12px',
              fontFamily: FONT, backdropFilter: 'blur(4px)',
              whiteSpace: 'nowrap',
            }}
          >
            Scorecard <ExternalLink size={11} strokeWidth={2} />
          </a>
        )}
      </div>

      {/* ── Match body ── */}
      <div style={{ padding: '18px 16px' }}>

        {/* Team 1 */}
        <TeamRow
          logo={result.logo1} name={result.team1}
          score={result.score1} pts={result.pts1}
          isOurs={t1Ours} isWinner={isOurs(result.winner) ? t1Ours : result.winner === result.team1}
          theme={theme}
        />

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)` }} />
          <div style={{
            fontSize: 11, fontWeight: 900, letterSpacing: 2,
            color: theme.accent, fontFamily: FONT,
            background: theme.scoreBg, borderRadius: 20,
            padding: '4px 12px',
          }}>VS</div>
          <div style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)` }} />
        </div>

        {/* Team 2 */}
        <TeamRow
          logo={result.logo2} name={result.team2}
          score={result.score2} pts={result.pts2}
          isOurs={t2Ours} isWinner={isOurs(result.winner) ? t2Ours : result.winner === result.team2}
          theme={theme}
        />
      </div>
    </motion.div>
  )
}

function TeamRow({ logo, name, score, pts, isOurs, isWinner, theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', borderRadius: 14,
      background: isOurs ? theme.scoreBg : 'transparent',
      border: isOurs ? `1px solid ${theme.cardBorder}` : '1px solid transparent',
      transition: 'background 200ms',
    }}>
      <TeamLogo logo={logo} name={name} size={50} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{
            fontFamily: FONT, fontSize: 14,
            fontWeight: isOurs ? 800 : 600,
            color: isOurs ? theme.accent : C.dark,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isOurs ? '🏏 ' : ''}{shorten(name)}
          </div>
          {isWinner && (
            <div style={{
              background: theme.headerGrad,
              color: '#fff', fontSize: 9, fontWeight: 800,
              borderRadius: 6, padding: '2px 7px', letterSpacing: 0.5,
              textTransform: 'uppercase', flexShrink: 0,
            }}>
              Won
            </div>
          )}
        </div>
        {score && (
          <div style={{
            fontFamily: FONT, fontSize: 18, fontWeight: 900,
            color: isOurs ? theme.accent : C.dark,
            marginTop: 3, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
          }}>
            {score.replace('Allout', 'All out')}
          </div>
        )}
      </div>

      {pts && <PtsBadge pts={pts} />}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 22, overflow: 'hidden', border: `1px solid ${C.gray2}`, background: C.white }}>
      <div style={{ height: 62, background: C.gray2, backgroundImage: `linear-gradient(90deg,${C.gray2} 25%,${C.gray1} 50%,${C.gray2} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite linear' }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[0,1].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: C.gray1, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 13, width: '50%', borderRadius: 6, background: C.gray1 }} />
              <div style={{ height: 20, width: '35%', borderRadius: 6, background: C.gray2 }} />
            </div>
            <div style={{ width: 52, height: 32, borderRadius: 10, background: C.gray1 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Season stat pill ───────────────────────────────────────
function SeasonPill({ label, value, grad, shadow }) {
  return (
    <div style={{
      background: grad, borderRadius: 16,
      padding: '14px 16px', textAlign: 'center', minWidth: 68,
      boxShadow: shadow, flex: 1,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -12, right: -12, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.12)', pointerEvents: 'none' }} />
      <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.75)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    </div>
  )
}

// ── Date header ────────────────────────────────────────────
function DateHeader({ date, count, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT, delay: index * 0.04 }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}
    >
      <div style={{
        background: `linear-gradient(135deg, ${C.greenDark}, #1d4ed8)`,
        borderRadius: 12, padding: '6px 14px', flexShrink: 0,
        boxShadow: '0 3px 12px rgba(37,99,235,.3)',
      }}>
        <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: C.gold, letterSpacing: 0.3 }}>{date}</div>
      </div>
      <div style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, ${C.gray2}, transparent)` }} />
      <div style={{
        fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.gray3,
        background: C.gray1, borderRadius: 20, padding: '3px 10px',
      }}>
        {count} match{count !== 1 ? 'es' : ''}
      </div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function ResultsPage() {
  const nav = useNavigate()
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(false)
  const [updatedAt, setUpdatedAt]   = useState(null)
  const [source, setSource]         = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [teamStats, setTeamStats]   = useState(null)

  const load = (bust = false) => {
    setRefreshing(true)
    fetch(bust ? `/api/results?t=${Date.now()}` : '/api/results')
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

  useEffect(() => {
    fetch('/api/league-table')
      .then(r => r.json())
      .then(d => {
        const ourRow = (d.rows || d.teams || []).find(t => isOurs(t.team))
        if (ourRow) setTeamStats(ourRow)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [])

  const grouped = groupByDate(results)

  // Season summary stats
  const wins   = results.filter(r => involved(r) && weWon(r)).length
  const losses = results.filter(r => involved(r) && !weWon(r)).length

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* ── Hero ── */}
      <div style={{
        background: `radial-gradient(ellipse at 80% -10%, #1d4ed860 0%, transparent 55%), linear-gradient(160deg, ${C.greenDark} 0%, #1e3a8a 100%)`,
        padding: '28px 20px 36px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative cricket ball */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(233,160,32,.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', position: 'relative' }}>
          <motion.button
            onClick={() => nav('/')}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 20 }}
          >
            <ArrowLeft size={14} strokeWidth={2} /> Home
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.25)', flexShrink: 0 }}>
                <img src="/logo.png" alt="TUCC" style={{ width: 47, height: 47, objectFit: 'contain' }} />
              </div>
              <div>
                <h1 style={{ color: C.white, fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -0.4 }}>
                  Last 10 Results
                </h1>
                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>BTCL Premier League 2026</span>
                  {source === 'live' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 6px #60a5fa', display: 'inline-block', animation: 'pendingPulse 1.8s ease-in-out infinite' }} />
                      <span style={{ color: '#86efac', fontWeight: 600, fontSize: 11 }}>Live</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Season stats pills */}
            {teamStats ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 2 }}>
                <SeasonPill label="Played"   value={teamStats.p   ?? '—'} grad="linear-gradient(135deg,#2563eb,#3b82f6)" shadow="0 6px 20px rgba(37,99,235,.35)" />
                <SeasonPill label="Won"      value={teamStats.w   ?? '0'} grad="linear-gradient(135deg,#15803d,#3b82f6)" shadow="0 6px 20px rgba(21,128,61,.35)" />
                <SeasonPill label="Lost"     value={teamStats.l   ?? '—'} grad="linear-gradient(135deg,#be123c,#f43f5e)" shadow="0 6px 20px rgba(190,18,60,.3)" />
                <SeasonPill label="Points"   value={teamStats.pts ?? '—'} grad="linear-gradient(135deg,#b45309,#f59e0b)" shadow="0 6px 20px rgba(180,83,9,.35)" />
                <SeasonPill label="NRR"      value={teamStats.nrr ?? '—'} grad={parseFloat(teamStats.nrr) >= 0 ? 'linear-gradient(135deg,#15803d,#3b82f6)' : 'linear-gradient(135deg,#6d28d9,#8b5cf6)'} shadow="0 6px 20px rgba(109,40,217,.3)" />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 62, borderRadius: 16, background: 'rgba(255,255,255,.1)', animation: 'shimmer 1.4s infinite linear', backgroundSize: '200% 100%' }} />)}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '24px 16px 56px', width: '100%' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.gray4 }}>
            {!loading && `${results.length} results loaded`}
          </div>
          <motion.button
            onClick={() => load(true)}
            disabled={refreshing}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.white, border: `1.5px solid ${C.gray2}`, borderRadius: 10,
              padding: '8px 14px', cursor: refreshing ? 'default' : 'pointer',
              fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.gray4,
              opacity: refreshing ? 0.5 : 1,
              boxShadow: `0 2px 8px ${C.shadow}`,
            }}
          >
            <RotateCw size={13} strokeWidth={2.2} style={{ animation: refreshing ? 'tucc-spin 0.65s linear infinite' : 'none' }} />
            Refresh
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fff1f2', border: '1.5px solid #fecaca', borderRadius: 16, padding: '18px 20px', marginBottom: 20, textAlign: 'center', color: C.red, fontSize: 14, fontWeight: 500 }}>
            Couldn't load results.{' '}
            <button onClick={() => { setError(false); setLoading(true); load(true) }} style={{ color: C.green, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontFamily: FONT, fontSize: 14 }}>
              Try again →
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[0,1,2].map(i => (
              <div key={i}>
                <div style={{ height: 38, width: 160, background: C.gray2, borderRadius: 12, marginBottom: 14, backgroundImage: `linear-gradient(90deg,${C.gray2} 25%,${C.gray1} 50%,${C.gray2} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite linear' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array.from({ length: i === 0 ? 3 : 1 }).map((_, j) => <SkeletonCard key={j} />)}
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: C.white, borderRadius: 22, border: `1px solid ${C.gray2}`, boxShadow: `0 4px 20px ${C.shadow}` }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🏏</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>No results yet</div>
            <div style={{ fontSize: 13, color: C.gray3, marginTop: 6 }}>Check back after the next match day.</div>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {grouped.map(([date, dateResults], gi) => (
                <div key={date}>
                  <DateHeader date={date} count={dateResults.length} index={gi} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {dateResults.map((result, i) => (
                      <ResultCard key={i} result={result} index={i + gi * 2} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: `linear-gradient(135deg, ${C.greenDark}, #1e3a8a)`,
                  borderRadius: 20, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, boxShadow: '0 6px 24px rgba(37,99,235,.3)',
                }}
              >
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: C.white }}>Full match scorecards</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>View on play-cricket.com</div>
                </div>
                <a
                  href="https://dtucc.play-cricket.com/website/division/137680?type=last_10_results"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: C.gold, color: C.dark,
                    borderRadius: 12, padding: '10px 18px',
                    fontFamily: FONT, fontSize: 13, fontWeight: 800,
                    textDecoration: 'none', flexShrink: 0,
                    boxShadow: `0 4px 16px ${C.gold}50`,
                  }}
                >
                  Open <ExternalLink size={13} strokeWidth={2.5} />
                </a>
              </motion.div>
            </div>
          </AnimatePresence>
        )}
      </div>

      <Footer />
    </div>
  )
}
