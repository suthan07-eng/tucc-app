import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import { Skeleton } from '../ui/Loader'
import { Select } from '../ui/Field'
import { useToast } from '../Toast'

export default function TabAvailability() {
  const toast = useToast()
  const [allMatches, setAllMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const selectedMatchIdRef = useRef(null)
  const [players, setPlayers] = useState([])
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)

  const loadResponses = useCallback(async (matchId) => {
    if (!matchId) return
    const { data: rs } = await supabase
      .from('availability').select('*').eq('match_id', matchId)
    setResponses(rs || [])
  }, [])

  const loadAll = useCallback(async (keepMatchId) => {
    const [{ data: ms }, { data: ps }] = await Promise.all([
      supabase.from('matches').select('*').order('date', { ascending: false }),
      supabase.from('players').select('*').order('name'),
    ])
    const matches = ms || []
    setAllMatches(matches)
    setPlayers(ps || [])

    const useId = keepMatchId
      ?? selectedMatchIdRef.current
      ?? matches.find((m) => m.is_active)?.id
      ?? matches[0]?.id
      ?? null

    selectedMatchIdRef.current = useId
    setSelectedMatchId(useId)
    await loadResponses(useId)
    setLoading(false)
  }, [loadResponses])

  useEffect(() => {
    loadAll()

    const channel = supabase
      .channel('admin-availability-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availability' }, () => {
        loadResponses(selectedMatchIdRef.current)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [loadAll, loadResponses])

  async function handleMatchChange(e) {
    const id = e.target.value
    selectedMatchIdRef.current = id
    setSelectedMatchId(id)
    setLoading(true)
    await loadResponses(id)
    setLoading(false)
  }

  function copyWhatsAppLink() {
    const activeMatch = allMatches.find((m) => m.id === selectedMatchId)
    const url = `${window.location.origin}/availability`
    const text = `🏏 Tamil United CC Match${activeMatch?.opponent ? ` vs ${activeMatch.opponent}` : ''}${activeMatch?.date ? ` on ${new Date(activeMatch.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''} — Please submit your availability: ${url}`
    navigator.clipboard.writeText(text).then(() => toast('WhatsApp message copied!'))
  }

  const playerById = Object.fromEntries(players.map((p) => [p.id, p]))
  const available   = responses.filter((r) => r.available)
  const unavailable = responses.filter((r) => !r.available)
  const respondedIds = new Set(responses.map((r) => r.player_id))
  const pending = players.filter((p) => !respondedIds.has(p.id))

  const selectedMatch = allMatches.find((m) => m.id === selectedMatchId)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Match selector */}
      {allMatches.length > 0 && (
        <Card style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.gray4, marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>
            Viewing match
          </div>
          <Select value={selectedMatchId || ''} onChange={handleMatchChange}>
            {allMatches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                {' — '}vs {m.opponent || 'TBC'}
                {m.is_active ? ' ⭐ Active' : ''}
              </option>
            ))}
          </Select>
          {selectedMatch && (
            <div style={{ fontSize: 12, color: C.gray3, marginTop: 6 }}>
              {selectedMatch.venue || 'Venue TBC'} · {selectedMatch.time || 'Time TBC'} · {selectedMatch.format || 'T20'}
            </div>
          )}
        </Card>
      )}

      {/* Summary + copy link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Pill count={available.length}   label="Available"   color={C.ok}    bg={C.okBg}  loading={loading} />
          <Pill count={unavailable.length} label="Unavailable" color={C.red}   bg={C.redBg} loading={loading} />
          <Pill count={pending.length}     label="Pending"     color={C.gray4} bg={C.gray1} loading={loading} />
        </div>
        <button
          onClick={copyWhatsAppLink}
          style={{ background: '#25d366', color: C.white, border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          📲 Copy WhatsApp Link
        </button>
      </div>

      {/* Available */}
      <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <Section title={`✅ Available (${available.length})`} color={C.ok}>
        {loading ? <SkeletonRows /> : available.length === 0 ? (
          <Empty text="No available responses yet" />
        ) : available.map((r) => {
          const p = playerById[r.player_id]
          if (!p) return null
          return (
            <PlayerRow key={r.id} player={p}
              meta={new Date(r.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              extra={r.reason && <div style={{ fontSize: 12, color: C.gray4, marginTop: 4, fontStyle: 'italic' }}>"{r.reason}"</div>}
            />
          )
        })}
      </Section>
      </motion.div>

      {/* Unavailable */}
      <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <Section title={`❌ Unavailable (${unavailable.length})`} color={C.red}>
        {loading ? <SkeletonRows /> : unavailable.length === 0 ? (
          <Empty text="Everyone's available so far 🎉" />
        ) : unavailable.map((r) => {
          const p = playerById[r.player_id]
          if (!p) return null
          return (
            <PlayerRow key={r.id} player={p}
              extra={r.reason && (
                <div style={{ fontSize: 12, background: C.redBg, border: '1px solid #fecaca', borderRadius: 6, padding: '6px 10px', marginTop: 8, color: C.red, lineHeight: 1.5 }}>
                  <strong>Reason:</strong> {r.reason}
                </div>
              )}
            />
          )
        })}
      </Section>
      </motion.div>

      {/* Pending */}
      <motion.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
      <Section title={`⏳ Pending (${pending.length})`} color={C.gray4}>
        {loading ? <SkeletonRows /> : pending.length === 0 ? (
          <Empty text="All players have responded!" />
        ) : pending.map((p) => (
          <PlayerRow key={p.id} player={p}
            right={p.phone && (
              <a
                href={`https://wa.me/${p.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#25d366', textDecoration: 'none', fontWeight: 600 }}
              >
                💬 Remind
              </a>
            )}
          />
        ))}
      </Section>
      </motion.div>
    </motion.div>
  )
}

function Pill({ count, label, color, bg, loading }) {
  return (
    <div style={{ background: bg, borderRadius: 99, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
      {loading ? <Skeleton width={22} height={16} borderRadius={4} /> : (
        <span style={{ fontWeight: 800, fontSize: 17, color }}>{count}</span>
      )}
      <span style={{ fontSize: 12, color, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <Card style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </Card>
  )
}

function PlayerRow({ player, extra, right, meta }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${C.gray1}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <Avatar name={player.name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.dark }}>{player.name}</div>
        <div style={{ fontSize: 12, color: C.gray3 }}>{player.role} · {player.phone}</div>
        {extra}
      </div>
      {(right || meta) && (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {meta && <span style={{ fontSize: 11, color: C.gray3 }}>{meta}</span>}
          {right}
        </div>
      )}
    </div>
  )
}

function SkeletonRows() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} style={{ padding: '10px 0', display: 'flex', gap: 12 }}>
      <Skeleton width={36} height={36} borderRadius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width={140} height={14} />
        <Skeleton width={100} height={12} />
      </div>
    </div>
  ))
}

function Empty({ text }) {
  return <div style={{ textAlign: 'center', padding: '14px 0', color: C.gray3, fontSize: 13 }}>{text}</div>
}
