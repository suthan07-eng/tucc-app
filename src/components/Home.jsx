import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import Avatar from './ui/Avatar'
import Card from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'
import { Skeleton } from './ui/Loader'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtShort(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const ROLE_STYLE = {
  Batsman:         { bg: '#eff6ff', color: '#2563eb' },
  Bowler:          { bg: '#fef2f2', color: '#dc2626' },
  'All-Rounder':   { bg: '#f5f3ff', color: '#7c3aed' },
  'Wicket-Keeper': { bg: '#fffbeb', color: '#d97706' },
  Player:          { bg: '#f3f4f6', color: '#6b7280' },
}

function roleShort(pos) {
  if (pos === 'All-Rounder')   return 'AR'
  if (pos === 'Wicket-Keeper') return 'WK'
  if (pos === 'Batsman')       return 'BAT'
  if (pos === 'Bowler')        return 'BOWL'
  return 'PLR'
}

// ── Custom easing — stronger than built-in easings ─────────────────────────
const EASE_OUT  = [0.23, 1, 0.32, 1]   // snappy ease-out, feels instant
const EASE_SPRING = { type: 'spring', duration: 0.4, bounce: 0.18 }

// ── Shared animation variants ──────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
}

const staggerList = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
}

const staggerItem = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE_OUT } },
}

const chipItem = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: EASE_SPRING },
}

export default function Home() {
  const nav = useNavigate()
  const [match, setMatch] = useState(null)
  const [allMatches, setAllMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [responses, setResponses] = useState([])
  const [teamSelection, setTeamSelection] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: ms }, { data: ps }] = await Promise.all([
      supabase.from('matches').select('*').order('date', { ascending: false }),
      supabase.from('players').select('*').order('name'),
    ])
    const matches = ms || []
    const active = matches.find((m) => m.is_active) || null
    setAllMatches(matches)
    setMatch(active)
    setPlayers(ps || [])
    if (active) {
      const [{ data: rs }, { data: ts }] = await Promise.all([
        supabase.from('availability').select('*').eq('match_id', active.id),
        active.is_team_published
          ? supabase
              .from('team_selections')
              .select('*')
              .eq('match_id', active.id)
              .order('batting_order', { ascending: true })
          : Promise.resolve({ data: [] }),
      ])
      setResponses(rs || [])
      setTeamSelection(ts || [])
    }
    setLoading(false)
  }

  const countAvailable   = responses.filter((r) => r.available).length
  const countUnavailable = responses.filter((r) => !r.available).length
  const countPending     = players.length - responses.length

  function statusOf(playerId) {
    const r = responses.find((r) => r.player_id === playerId)
    if (!r) return 'pending'
    return r.available ? 'available' : 'unavailable'
  }

  const chipColors = {
    available:   { bg: C.okBg,  border: '#bbf7d0', dot: C.ok },
    unavailable: { bg: C.redBg, border: '#fecaca', dot: C.red },
    pending:     { bg: C.gray1, border: C.gray2,   dot: C.gray3 },
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.green} 100%)`, padding: '36px 20px 52px' }}>
        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height={14} width={160} style={{ background: 'rgba(255,255,255,.2)' }} />
              <Skeleton height={30} width={280} style={{ background: 'rgba(255,255,255,.2)' }} />
              <Skeleton height={14} width={220} style={{ background: 'rgba(255,255,255,.15)' }} />
            </div>
          ) : match ? (
            <motion.div variants={staggerList} initial="hidden" animate="visible">
              <motion.div variants={fadeUp} style={{ color: C.gold, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                🏏 {match.format || 'T20'} · Active Match
              </motion.div>
              <motion.h1 variants={fadeUp} style={{ color: C.white, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                Tamil United CC vs {match.opponent || 'TBC'}
              </motion.h1>
              <motion.div variants={fadeUp} style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                <span>📅 {fmtDate(match.date)}</span>
                {match.time && <span>🕐 {match.time}</span>}
              </motion.div>
              {match.venue && (
                <motion.div variants={fadeUp} style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, marginTop: 4 }}>
                  📍 {match.venue}{match.address ? `, ${match.address}` : ''}
                </motion.div>
              )}
              {match.notes && (
                <motion.div variants={fadeUp} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '10px 14px', marginTop: 14, color: 'rgba(255,255,255,.9)', fontSize: 13, lineHeight: 1.5 }}>
                  📋 {match.notes}
                </motion.div>
              )}
              {match.deadline && (
                <motion.div variants={fadeUp} style={{ color: C.gold, fontSize: 12, fontWeight: 600, marginTop: 12 }}>
                  ⏰ Respond by: {match.deadline}
                </motion.div>
              )}
              <motion.div variants={fadeUp} style={{ marginTop: 16 }}>
                <button
                  onClick={() => nav('/league')}
                  style={{
                    background: 'rgba(255,255,255,.15)',
                    color: C.white,
                    border: '1.5px solid rgba(255,255,255,.35)',
                    borderRadius: 8,
                    padding: '8px 18px',
                    cursor: 'pointer',
                    fontFamily: FONT,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  🏆 BTCL League →
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 15 }}>
              No active match scheduled yet.
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '0 16px 40px', width: '100%' }}>
        {/* Stats row */}
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: -26 }}
        >
          {[
            { label: 'Available',   count: countAvailable,   color: C.ok,    bg: C.okBg,  dot: '#bbf7d0' },
            { label: 'Unavailable', count: countUnavailable, color: C.red,   bg: C.redBg, dot: '#fecaca' },
            { label: 'Pending',     count: countPending,     color: C.gray4, bg: C.gray1, dot: C.gray2 },
          ].map(({ label, count, color, bg, dot }) => (
            <motion.div key={label} variants={staggerItem}>
            <Card style={{ padding: '16px 10px', textAlign: 'center', borderTop: `3px solid ${dot}` }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  <Skeleton height={28} width={40} />
                  <Skeleton height={12} width={60} />
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 11, color: C.gray3, fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                </>
              )}
            </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <Button size="full" onClick={() => nav('/availability')}>
            🏏 Submit My Availability
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => nav('/register')}
            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            + Register
          </Button>
        </div>

        {/* ── Selected XI ── */}
        {!loading && match?.is_team_published && teamSelection.length > 0 && (
          <SelectedXICard match={match} teamSelection={teamSelection} />
        )}

        {/* Player chips */}
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray5 }}>Players</div>
            {!loading && <span style={{ fontSize: 12, color: C.gray3 }}>{players.length} registered</span>}
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} height={34} width={90 + (i % 3) * 20} borderRadius={99} />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div style={{ color: C.gray3, fontSize: 14, textAlign: 'center', padding: '12px 0' }}>
              No players yet.{' '}
              <button onClick={() => nav('/register')} style={{ color: C.green, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Register first →
              </button>
            </div>
          ) : (
            <motion.div
              variants={staggerList}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
            >
              {players.map((p) => {
                const s = chipColors[statusOf(p.id)]
                return (
                  <motion.div key={p.id} variants={chipItem} style={{ display: 'flex', alignItems: 'center', gap: 6, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 99, padding: '3px 10px 3px 4px', fontSize: 13, fontWeight: 500, color: C.gray5, minHeight: 34 }}>
                    <Avatar name={p.name} size={26} />
                    <span>{p.name.split(' ')[0]}</span>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </Card>

        {/* Greeting / message from captain */}
        {!loading && match?.home_message && (
          <div
            style={{
              marginTop: 16,
              background: C.white,
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,.06)',
              borderLeft: `4px solid ${C.green}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
              📣 Message from the Captain
            </div>
            <div style={{ fontSize: 14, color: C.gray5, lineHeight: 1.65, fontStyle: 'italic' }}>
              "{match.home_message}"
            </div>
          </div>
        )}

        {/* Active match details */}
        {!loading && match && (
          <Card style={{ marginTop: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray5, marginBottom: 14 }}>Match Details</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Date',     fmtDate(match.date)],
                  ['Time',     match.time],
                  ['Venue',    match.venue],
                  ['Address',  match.address],
                  ['Opponent', match.opponent],
                  ['Format',   match.format],
                  ['Notes',    match.notes],
                  ['Deadline', match.deadline],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: '7px 0', color: C.gray3, fontSize: 13, width: 80, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{k}</td>
                      <td style={{ padding: '7px 0', color: C.dark, fontSize: 13, fontWeight: 500 }}>{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* ── Upcoming & Recent Matches ── */}
        {!loading && allMatches.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray5, marginBottom: 12 }}>
              Upcoming & Recent Matches
            </div>
            <motion.div
              variants={staggerList}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {allMatches.map((m) => (
                <motion.div
                  key={m.id}
                  variants={staggerItem}
                  style={{
                    background: C.white,
                    borderRadius: 12,
                    padding: '14px 16px',
                    boxShadow: '0 1px 6px rgba(0,0,0,.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: m.is_active ? `2px solid ${C.green}` : `1px solid ${C.gray2}`,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: m.is_active ? C.green : C.gray1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ color: m.is_active ? C.white : C.gray4, fontSize: 11, fontWeight: 800, lineHeight: 1 }}>
                      {m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric' }) : '—'}
                    </div>
                    <div style={{ color: m.is_active ? 'rgba(255,255,255,.75)' : C.gray3, fontSize: 10, lineHeight: 1.2 }}>
                      {m.date ? new Date(m.date).toLocaleDateString('en-GB', { month: 'short' }) : ''}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                      vs {m.opponent || 'TBC'}
                    </div>
                    <div style={{ fontSize: 12, color: C.gray3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.venue || 'Venue TBC'}{m.time ? ` · ${m.time}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {m.is_active && (
                      <Badge variant="available" style={{ fontSize: 11 }}>Active</Badge>
                    )}
                    <span style={{ fontSize: 11, color: C.gray3 }}>{m.format || 'T20'}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

      </div>

      <Footer />
    </div>
  )
}

function SelectedXICard({ match, teamSelection }) {
  const xi       = teamSelection.filter((s) => !s.is_reserve)
  const reserves = teamSelection.filter((s) =>  s.is_reserve)
  const lastUpdated = teamSelection[0]?.created_at

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 14,
        boxShadow: '0 2px 14px rgba(0,0,0,.07)',
        overflow: 'hidden',
        marginTop: 16,
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
          padding: '16px 20px',
        }}
      >
        <div style={{ color: C.gold, fontWeight: 800, fontSize: 16 }}>
          🏏 Selected XI — vs {match.opponent || 'TBC'}
        </div>
        <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, marginTop: 3 }}>
          {fmtDate(match.date)}{match.venue ? ` · ${match.venue}` : ''}
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Published badge */}
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              background: C.okBg,
              color: C.ok,
              padding: '3px 12px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✓ Published by captain
          </span>
        </div>

        {/* XI list */}
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {xi.map((s, i) => {
            const rs = ROLE_STYLE[s.position] || ROLE_STYLE.Player
            return (
              <motion.div
                key={s.player_id}
                variants={staggerItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 0',
                  borderBottom: i < xi.length - 1 ? `1px solid ${C.gray1}` : 'none',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: C.green,
                    color: C.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: C.dark, minWidth: 0 }}>
                  {s.player_name}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                  <span
                    style={{
                      background: rs.bg,
                      color: rs.color,
                      padding: '2px 7px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {roleShort(s.position)}
                  </span>
                  {s.is_captain && (
                    <span
                      style={{
                        background: C.greenBg,
                        color: C.greenDark,
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      C
                    </span>
                  )}
                  {s.is_vice_captain && (
                    <span
                      style={{
                        background: C.greenBg,
                        color: C.green,
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      VC
                    </span>
                  )}
                  {s.is_wicketkeeper && (
                    <span
                      style={{
                        background: '#fffbeb',
                        color: '#d97706',
                        padding: '2px 7px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      WK
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Reserves */}
        {reserves.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.gray3,
                margin: '12px 0 8px',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Reserves
            </div>
            {reserves.map((s) => (
              <div
                key={s.player_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: `1px solid ${C.gray1}`,
                  opacity: 0.75,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: C.gray3,
                    color: C.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  R
                </div>
                <div style={{ flex: 1, fontWeight: 500, fontSize: 14, color: C.gray4 }}>
                  {s.player_name}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Last updated */}
        {lastUpdated && (
          <div style={{ fontSize: 11, color: C.gray3, marginTop: 12, textAlign: 'right' }}>
            Last updated:{' '}
            {new Date(lastUpdated).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  )
}
