import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { Skeleton } from '../ui/Loader'
import { useToast } from '../Toast'

// ── Edit Credentials Modal ─────────────────────────────────────
function EditCredentialsModal({ player, onClose, onSaved }) {
  const toast = useToast()
  const [email, setEmail]       = useState(player.email || '')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy]         = useState(false)
  const [err, setErr]           = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setErr('')
    const trimmedEmail    = email.trim().toLowerCase()
    const emailChanged    = trimmedEmail && trimmedEmail !== (player.email || '').toLowerCase()
    const passwordChanged = password.length > 0
    if (!emailChanged && !passwordChanged) { setErr('No changes to save.'); return }
    if (passwordChanged && password.length < 6) { setErr('Password must be at least 6 characters.'); return }

    setBusy(true)
    const body = { currentEmail: player.email }
    if (emailChanged)    body.newEmail    = trimmedEmail
    if (passwordChanged) body.newPassword = password

    const r = await fetch('/api/admin?action=update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    setBusy(false)

    if (!r.ok) { setErr(data.error || 'Update failed.'); return }

    // Sync email in players table too
    if (emailChanged) {
      await supabase.from('players').update({ email: trimmedEmail }).eq('id', player.id)
    }

    toast(passwordChanged && emailChanged
      ? `Email + password updated for ${player.name}`
      : emailChanged ? `Email updated for ${player.name}`
      : `Password reset for ${player.name}`)
    onSaved({ ...player, email: emailChanged ? trimmedEmail : player.email })
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:420, padding:'26px 24px', boxShadow:'0 24px 60px rgba(0,0,0,.3)', fontFamily:FONT }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#2563eb,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>✏️</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:C.dark }}>Edit Login Credentials</div>
            <div style={{ fontSize:12, color:C.gray3, marginTop:1 }}>{player.name}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:20, color:C.gray3, lineHeight:1, padding:4 }}>×</button>
        </div>

        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:C.gray4, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>
              Login Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="player@example.com"
              style={{ width:'100%', border:`1.5px solid ${C.gray2}`, borderRadius:10, padding:'11px 14px', fontFamily:FONT, fontSize:14, color:C.dark, outline:'none', boxSizing:'border-box' }}
            />
            <div style={{ fontSize:11, color:C.gray3, marginTop:5 }}>This is the email address the player uses to log in.</div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:C.gray4, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>
              New Password <span style={{ color:C.gray3, fontWeight:500, textTransform:'none', letterSpacing:0 }}>(leave blank to keep unchanged)</span>
            </label>
            <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${C.gray2}`, borderRadius:10, overflow:'hidden' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{ flex:1, border:'none', padding:'11px 14px', fontFamily:FONT, fontSize:14, color:C.dark, outline:'none' }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'0 12px', color:C.gray3, fontSize:15 }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {err && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', color:'#dc2626', fontSize:13 }}>
              {err}
            </div>
          )}

          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px', color:'#1d4ed8', fontSize:12 }}>
            ℹ️ The player must have logged in at least once for this to work. If they haven't logged in yet, their account doesn't exist in the auth system.
          </div>

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:'12px 0', borderRadius:10, border:`1.5px solid ${C.gray2}`, background:'#fff', color:C.gray4, fontFamily:FONT, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={busy}
              style={{ flex:2, padding:'12px 0', borderRadius:10, border:'none', background: busy?C.gray2:'linear-gradient(135deg,#2563eb,#4f46e5)', color:'#fff', fontFamily:FONT, fontSize:14, fontWeight:800, cursor:busy?'not-allowed':'pointer', boxShadow: busy?'none':'0 4px 16px rgba(37,99,235,.3)' }}>
              {busy ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TabPlayers() {
  const toast = useToast()
  const [players, setPlayers] = useState([])
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [editingPlayer, setEditingPlayer] = useState(null)

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
                  {/* Edit credentials button */}
                  <button
                    onClick={() => setEditingPlayer(p)}
                    title={`Edit login credentials for ${p.name}`}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: `1.5px solid ${C.gray2}`,
                      background: C.white, color: '#2563eb',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, flexShrink: 0,
                      transition: 'background .15s, border-color .15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#2563eb' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.gray2 }}
                  >
                    ✏️
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={isDeleting}
                    title={`Remove ${p.name}`}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: `1.5px solid ${C.gray2}`,
                      background: C.white, color: C.red,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 15,
                      flexShrink: 0, transition: 'background .15s, border-color .15s',
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

      {/* Edit credentials modal */}
      {editingPlayer && (
        <EditCredentialsModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSaved={(updated) => setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p))}
        />
      )}
    </div>
  )
}
