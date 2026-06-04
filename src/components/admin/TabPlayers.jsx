import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { Skeleton } from '../ui/Loader'
import { useToast } from '../Toast'

export default function TabPlayers() {
  const toast = useToast()
  const [players, setPlayers] = useState([])
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: ps }, { data: m }] = await Promise.all([
      supabase.from('players').select('*').order('name'),
      supabase.from('matches').select('id').eq('is_active', true).single(),
    ])
    setPlayers(ps || [])
    if (m) {
      const { data: rs } = await supabase
        .from('availability').select('player_id,available').eq('match_id', m.id)
      setResponses(rs || [])
    }
    setLoading(false)
  }

  async function handleDelete(player) {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${player.name} from the club?\n\nThis will also delete their availability records and messages.`
    )
    if (!confirmed) return

    setDeletingId(player.id)
    // Remove related records first to avoid FK constraint issues
    await Promise.all([
      supabase.from('availability').delete().eq('player_id', player.id),
      supabase.from('messages').delete().eq('player_id', player.id),
    ])
    const { error } = await supabase.from('players').delete().eq('id', player.id)
    if (error) {
      toast(error.message || 'Delete failed', 'error')
    } else {
      toast(`${player.name} removed from the club`)
      setPlayers((prev) => prev.filter((p) => p.id !== player.id))
    }
    setDeletingId(null)
  }

  function exportCSV() {
    const headers = ['#', 'Name', 'Email', 'Phone', 'Role', 'This Week', 'Joined']
    const rows = players.map((p, i) => {
      const status = statusOf(p.id)
      return [
        i + 1,
        p.name, p.email, p.phone, p.role,
        status === 'available' ? 'Available' : status === 'unavailable' ? 'Unavailable' : 'Pending',
        new Date(p.created_at).toLocaleDateString('en-GB'),
      ]
    })
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tucc-players-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function statusOf(playerId) {
    const r = responses.find((r) => r.player_id === playerId)
    if (!r) return 'pending'
    return r.available ? 'available' : 'unavailable'
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: C.dark, fontFamily: FONT, fontSize: 15 }}>
          {loading ? <Skeleton width={140} height={16} /> : `${players.length} registered player${players.length !== 1 ? 's' : ''}`}
        </div>
        <button
          onClick={exportCSV}
          style={{ background: C.greenBg, color: C.green, border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ⬇ Export CSV
        </button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skeleton width={36} height={36} borderRadius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width={150} height={14} />
                  <Skeleton width={200} height={11} />
                </div>
                <Skeleton width={60} height={22} borderRadius={99} />
              </div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.gray3, fontFamily: FONT, fontSize: 14 }}>
            No players registered yet
          </div>
        ) : (
          players.map((p, i) => {
            const status = statusOf(p.id)
            const isDeleting = deletingId === p.id
            return (
              <div
                key={p.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 12px 20px', borderBottom: i < players.length - 1 ? `1px solid ${C.gray1}` : 'none', opacity: isDeleting ? 0.5 : 1, transition: 'opacity .2s' }}
              >
                <span style={{ color: C.gray3, fontSize: 11, fontWeight: 700, width: 22, textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <Avatar name={p.name} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.dark }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.gray3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.email} · {p.phone}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 11, color: C.gray4, background: C.gray1, borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>
                      {p.role}
                    </span>
                    <Badge variant={status} style={{ fontSize: 11, padding: '2px 8px' }}>
                      {status === 'available' ? '✅ Available' : status === 'unavailable' ? '❌ Out' : '⏳ Pending'}
                    </Badge>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={isDeleting}
                    title={`Remove ${p.name}`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `1.5px solid ${C.gray2}`,
                      background: C.white,
                      color: C.red,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      flexShrink: 0,
                      transition: 'background .15s, border-color .15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.borderColor = C.red }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.gray2 }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
