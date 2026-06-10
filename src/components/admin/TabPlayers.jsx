import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { Skeleton } from '../ui/Loader'
import { useToast } from '../Toast'
import statsJson from '../../data/stats-2026.json'

const COMMON_WORDS = new Set(['mohamed', 'daniel', 'anton', 'kumar', 'raj'])
function matchStat(arr, name) {
  if (!arr?.length || !name) return null
  const lower = name.toLowerCase().trim()
  let hit = arr.find(p => p.name.toLowerCase().trim() === lower)
  if (hit) return hit
  const words = lower.split(' ').filter(w => w.length > 2 && !COMMON_WORDS.has(w))
  if (words.length >= 2) {
    hit = arr.find(p => { const n = p.name.toLowerCase(); return words.every(w => n.includes(w)) })
    if (hit) return hit
  }
  return null
}

function detectRole(p) {
  const batStyle  = (p.batStyle  || '').toLowerCase()
  const bowlStyle = (p.bowlStyle || '').toLowerCase()
  if (batStyle.includes('wicket') || bowlStyle.includes('wicket')) return 'Wicket-Keeper'
  const bat  = matchStat(statsJson.batting,  p.name)
  const bowl = matchStat(statsJson.bowling,  p.name)
  const hasBat  = bat  && (bat.innings  || bat.matches  || 0) >= 1
  const hasBowl = bowl && (bowl.overs || 0) >= 4
  if (hasBat && hasBowl) return 'All-Rounder'
  if (hasBowl)  return 'Bowler'
  if (bowlStyle && !hasBat) return 'Bowler'
  return 'Batsman'
}

function computeScore(p) {
  const bat  = matchStat(statsJson.batting,  p.name)
  const bowl = matchStat(statsJson.bowling,  p.name)
  const matches = bat?.matches || bowl?.matches || 1
  let batScore = 0
  if (bat) {
    batScore = Math.min((bat.runs || 0) / 300, 1) * 40
      + (parseFloat(bat.strike_rate) >= 120 ? 30 : parseFloat(bat.strike_rate) >= 90 ? 22 : parseFloat(bat.strike_rate) >= 70 ? 15 : parseFloat(bat.strike_rate) >= 50 ? 9 : 5)
      + Math.min((parseFloat(bat.average) || 0) / 60, 1) * 20
      + Math.min((bat.fifties || 0) * 2 + (bat.hundreds || 0) * 5, 10)
  }
  let bowlScore = 0
  if (bowl && (bowl.overs || 0) >= 4) {
    const econ = parseFloat(bowl.economy) || 99
    const avg  = parseFloat(bowl.average) || 99
    bowlScore = Math.min((bowl.wickets || 0) / 15, 1) * 40
      + (econ <= 5 ? 30 : econ <= 6.5 ? 22 : econ <= 8 ? 15 : econ <= 10 ? 9 : 5)
      + (avg <= 15 ? 20 : avg <= 22 ? 15 : avg <= 30 ? 10 : avg <= 40 ? 5 : 0)
      + Math.min((bowl.five_fers || 0) * 10, 10)
  }
  const role = detectRole(p)
  let composite = role === 'Bowler' ? batScore * 0.2 + bowlScore * 0.8
    : (role === 'Batsman' || role === 'Wicket-Keeper') ? batScore * 0.8 + bowlScore * 0.2
    : batScore * 0.5 + bowlScore * 0.5
  const engMult    = 0.85 + 0.15 * Math.min(matches / 8, 1)
  const confidence = Math.min(0.4 + Math.max(matches - 1, 0) / 3 * 0.6, 1)
  return Math.round(Math.min(composite * engMult * confidence, 100) * 10) / 10
}

// ── Generate Profiles Panel ─────────────────────────────────────
function GenerateProfilesPanel() {
  const toast = useToast()
  const [btclPlayers, setBtclPlayers] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [generating, setGenerating]         = useState(false)
  const [progress, setProgress]             = useState('')
  const [done, setDone]                     = useState(false)

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then(d => { setBtclPlayers(d.players || d || []); setLoadingPlayers(false) })
      .catch(() => setLoadingPlayers(false))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (generating || btclPlayers.length === 0) return
    setGenerating(true)
    setDone(false)
    let count = 0

    for (let i = 0; i < btclPlayers.length; i++) {
      const p = btclPlayers[i]
      setProgress(`${i + 1}/${btclPlayers.length} — ${p.name}`)
      try {
        const bat  = matchStat(statsJson.batting,  p.name)
        const bowl = matchStat(statsJson.bowling,  p.name)
        const role  = detectRole(p)
        const score = computeScore(p)

        const aiRes = await fetch('/api/player-profiles?action=generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player: { name: p.name }, stats: { batting: bat, bowling: bowl }, score, role }),
        })
        const aiData  = await aiRes.json()
        const profile = aiData.profile || {}

        await fetch('/api/player-profiles?action=scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            btcl_player_id:   p.id,
            player_name:      p.name,
            season:           '2026',
            role,
            score,
            headline:         profile.headline           || '',
            ai_profile:       profile.ai_profile         || '',
            strengths:        profile.strengths           || [],
            development_areas: profile.development_areas || [],
            role_notes:       profile.role_notes          || '',
            generated_at:     new Date().toISOString(),
          }),
        })
        count++
      } catch (e) {
        console.error(`Profile gen failed for ${p.name}:`, e)
      }
    }

    setGenerating(false)
    setDone(true)
    setProgress('')
    toast(`✅ ${count}/${btclPlayers.length} AI profiles generated`)
  }, [btclPlayers, generating, toast])

  return (
    <div style={{ background: '#FFFBEB', border: `1px solid ${C.gold}50`, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: '#92400E', marginBottom: 4 }}>
            ✨ AI Player Profiles
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: '#B45309', lineHeight: 1.5 }}>
            Generate AI-written profiles, headlines, strengths and role notes for all {loadingPlayers ? '…' : btclPlayers.length} BTCL players.
            Profiles are cached and shown on the public Players page.
          </div>
          {generating && (
            <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, border: '2px solid #D97706', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite', flexShrink: 0 }}/>
              {progress}
            </div>
          )}
          {done && !generating && (
            <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 12, color: '#16A34A', fontWeight: 700 }}>
              ✅ All profiles generated! They are now live on the Players page.
            </div>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || loadingPlayers}
          style={{
            background: generating ? C.gray2 : 'linear-gradient(135deg, #D97706, #F59E0B)',
            color: generating ? C.gray4 : '#fff',
            fontFamily: FONT, fontWeight: 800, fontSize: 13,
            border: 'none', borderRadius: 12, padding: '11px 20px',
            cursor: (generating || loadingPlayers) ? 'not-allowed' : 'pointer',
            boxShadow: generating ? 'none' : '0 4px 16px rgba(217,119,6,0.3)',
            display: 'flex', alignItems: 'center', gap: 8,
            whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'all .2s',
          }}
        >
          {generating
            ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }}/>Generating…</>
            : '✨ Generate / Refresh All Profiles'}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']
const ROLE_ICONS = { 'Batsman': '🏏', 'Bowler': '🎯', 'All-Rounder': '⚡', 'Wicket-Keeper': '🧤' }

// Parse a stored role string into an array of selected roles
// e.g. "Batsman / Wicket-Keeper" → ['Batsman', 'Wicket-Keeper']
function parseRoles(roleStr) {
  if (!roleStr) return ['Batsman']
  return roleStr.split('/').map(r => r.trim()).filter(r => ROLES.includes(r))
}
// Combine selected roles array back to a display string
function combineRoles(selected) {
  if (!selected.length) return 'Batsman'
  return selected.join(' / ')
}

// ── Edit Player Modal ─────────────────────────────────────────────
function EditPlayerModal({ player, onClose, onSaved }) {
  const toast = useToast()
  const [email, setEmail]         = useState(player.email || '')
  const [password, setPassword]   = useState('')
  const [selectedRoles, setSelectedRoles] = useState(() => parseRoles(player.role))
  const [showPass, setShowPass]   = useState(false)
  const [busy, setBusy]           = useState(false)
  const [err, setErr]             = useState('')

  function toggleRole(r) {
    setSelectedRoles(prev => {
      if (prev.includes(r)) {
        // Don't allow deselecting the last role
        if (prev.length === 1) return prev
        return prev.filter(x => x !== r)
      }
      return [...prev, r]
    })
  }

  const combinedRole = combineRoles(selectedRoles)

  async function handleSave(e) {
    e.preventDefault()
    setErr('')
    const trimmedEmail    = email.trim().toLowerCase()
    const emailChanged    = trimmedEmail && trimmedEmail !== (player.email || '').toLowerCase()
    const passwordChanged = password.length > 0
    const roleChanged     = combinedRole !== player.role
    if (!emailChanged && !passwordChanged && !roleChanged) { setErr('No changes to save.'); return }
    if (passwordChanged && password.length < 6) { setErr('Password must be at least 6 characters.'); return }

    setBusy(true)

    // Save role (and optionally email) to players table
    if (roleChanged || emailChanged) {
      const updates = {}
      if (roleChanged)  updates.role  = combinedRole
      if (emailChanged) updates.email = trimmedEmail
      await supabase.from('players').update(updates).eq('id', player.id)
    }

    // Update auth credentials if needed
    if (emailChanged || passwordChanged) {
      const body = { currentEmail: player.email }
      if (emailChanged)    body.newEmail    = trimmedEmail
      if (passwordChanged) body.newPassword = password
      const r    = await fetch('/api/admin?action=update-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await r.json()
      if (!r.ok) { setBusy(false); setErr(data.error || 'Auth update failed.'); return }
    }

    setBusy(false)
    const changes = [roleChanged && `role → ${combinedRole}`, emailChanged && 'email', passwordChanged && 'password'].filter(Boolean).join(', ')
    toast(`✅ Updated ${player.name}: ${changes}`)
    onSaved({ ...player, role: combinedRole, email: emailChanged ? trimmedEmail : player.email })
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:440, padding:'26px 24px', boxShadow:'0 24px 60px rgba(0,0,0,.3)', fontFamily:FONT }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#2563eb,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>✏️</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:C.dark }}>Edit Player</div>
            <div style={{ fontSize:12, color:C.gray3, marginTop:1 }}>{player.name}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:22, color:C.gray3, lineHeight:1, padding:4 }}>×</button>
        </div>

        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* ── Role multi-select ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <label style={{ fontSize:12, fontWeight:700, color:C.gray4, textTransform:'uppercase', letterSpacing:.5 }}>
                Player Role
              </label>
              <span style={{ fontSize:11, color:C.gray3 }}>Select one or more</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {ROLES.map(r => {
                const active = selectedRoles.includes(r)
                return (
                  <button
                    key={r} type="button"
                    onClick={() => toggleRole(r)}
                    style={{
                      padding:'10px 12px', borderRadius:10, cursor:'pointer', fontFamily:FONT,
                      fontWeight: active ? 700 : 500, fontSize:13,
                      border: `2px solid ${active ? C.green : C.gray2}`,
                      background: active ? C.greenBg : '#fff',
                      color: active ? C.green : C.gray5,
                      display:'flex', alignItems:'center', gap:7,
                      transition:'all .15s', position:'relative',
                    }}
                  >
                    <span style={{ fontSize:15 }}>{ROLE_ICONS[r]}</span>
                    {r}
                    {active && (
                      <span style={{ marginLeft:'auto', width:16, height:16, borderRadius:'50%', background:C.green, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width={9} height={9} viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {/* Preview combined role */}
            <div style={{ marginTop:8, padding:'8px 12px', background:C.gray1, borderRadius:8, fontSize:12, color:C.gray5 }}>
              <span style={{ color:C.gray3 }}>Will be saved as: </span>
              <strong style={{ color:C.dark }}>{combinedRole}</strong>
            </div>
          </div>

          <div style={{ borderTop:`1px solid ${C.gray2}`, paddingTop:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.gray4, textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>Login Credentials</div>

            {/* Email */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:C.gray4, display:'block', marginBottom:6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="player@example.com"
                style={{ width:'100%', border:`1.5px solid ${C.gray2}`, borderRadius:10, padding:'10px 14px', fontFamily:FONT, fontSize:14, color:C.dark, outline:'none', boxSizing:'border-box' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize:12, color:C.gray4, display:'block', marginBottom:6 }}>
                New Password <span style={{ color:C.gray3, fontWeight:400 }}>(leave blank to keep unchanged)</span>
              </label>
              <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${C.gray2}`, borderRadius:10, overflow:'hidden' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  style={{ flex:1, border:'none', padding:'10px 14px', fontFamily:FONT, fontSize:14, color:C.dark, outline:'none' }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'0 12px', color:C.gray3, fontSize:15 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          </div>

          {err && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', color:'#dc2626', fontSize:13 }}>
              {err}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
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
      <GenerateProfilesPanel />

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
        <EditPlayerModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSaved={(updated) => setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p))}
        />
      )}
    </div>
  )
}
