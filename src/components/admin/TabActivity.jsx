import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import { Skeleton } from '../ui/Loader'

// ── Helpers ────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)    return 'Just now'
  if (mins  < 60)   return `${mins}m ago`
  if (hours < 24)   return `${hours}h ago`
  if (days  < 7)    return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const EVENT_STYLES = {
  login:     { bg:'#dcfce7', color:'#15803d', icon:'🔓', label:'Login'    },
  logout:    { bg:'#fee2e2', color:'#dc2626', icon:'🔒', label:'Logout'   },
  page_view: { bg:'#eff6ff', color:'#2563eb', icon:'👁',  label:'Page View'},
}

const PAGE_ICONS = {
  '/':             '🏠',
  '/availability': '📋',
  '/results':      '🏆',
  '/fixtures':     '📅',
  '/players':      '👥',
  '/league':       '📊',
  '/stats':        '📈',
  '/success':      '✅',
  '/register':     '📝',
}

// ── Last Login card per player ──────────────────────────────────
function PlayerLoginCard({ player, authUser }) {
  const lastLogin = authUser?.last_sign_in_at
  const isRecent  = lastLogin && (Date.now() - new Date(lastLogin).getTime()) < 24 * 3600000

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'12px 16px',
      borderBottom: `1px solid ${C.gray1}`,
    }}>
      <div style={{ position:'relative', flexShrink:0 }}>
        <Avatar name={player.name} size={36}/>
        {isRecent && (
          <div style={{
            position:'absolute', bottom:0, right:0,
            width:10, height:10, borderRadius:'50%',
            background:'#22c55e', border:'2px solid #fff',
          }}/>
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:13, color:C.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {player.name}
        </div>
        <div style={{ fontSize:11, color:C.gray3, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {player.email}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        {lastLogin ? (
          <>
            <div style={{
              fontSize:12, fontWeight:700,
              color: isRecent ? '#15803d' : C.gray4,
              background: isRecent ? '#dcfce7' : C.gray1,
              borderRadius:99, padding:'2px 9px', display:'inline-block',
            }}>
              {timeAgo(lastLogin)}
            </div>
            <div style={{ fontSize:10, color:C.gray3, marginTop:3 }}>
              {new Date(lastLogin).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
            </div>
          </>
        ) : (
          <span style={{ fontSize:11, color:C.gray3, background:C.gray1, borderRadius:99, padding:'2px 9px' }}>
            Never logged in
          </span>
        )}
      </div>
    </div>
  )
}

// ── Single activity log row ─────────────────────────────────────
function LogRow({ log }) {
  const style = EVENT_STYLES[log.event_type] || EVENT_STYLES.page_view
  const pageIcon = PAGE_ICONS[log.page] || '📄'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', borderBottom:`1px solid ${C.gray1}` }}>
      {/* Event badge */}
      <div style={{
        width:28, height:28, borderRadius:8, flexShrink:0,
        background:style.bg, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:14,
      }}>
        {style.icon}
      </div>
      {/* Player name */}
      <Avatar name={log.player_name} size={26}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:12, color:C.dark }}>
            {log.player_name || log.player_email}
          </span>
          <span style={{ fontSize:11, color:style.color, background:style.bg, borderRadius:99, padding:'1px 7px', fontWeight:700 }}>
            {style.label}
          </span>
          {log.event_type === 'page_view' && (
            <span style={{ fontSize:11, color:C.gray4, display:'flex', alignItems:'center', gap:3 }}>
              {pageIcon} {log.page_label}
            </span>
          )}
        </div>
        <div style={{ fontSize:10, color:C.gray3, marginTop:2 }}>
          {log.player_email}
        </div>
      </div>
      {/* Time */}
      <div style={{ fontSize:11, color:C.gray3, flexShrink:0, textAlign:'right', lineHeight:1.4 }}>
        <div style={{ fontWeight:600 }}>{timeAgo(log.created_at)}</div>
        <div>{new Date(log.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
      </div>
    </div>
  )
}

// ── Main tab ───────────────────────────────────────────────────
export default function TabActivity() {
  const [players,     setPlayers]     = useState([])
  const [authUsers,   setAuthUsers]   = useState({})   // email → authUser
  const [logs,        setLogs]        = useState([])
  const [loadingTop,  setLoadingTop]  = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [filter,      setFilter]      = useState('all') // 'all' | 'login' | 'page_view'
  const [playerFilter,setPlayerFilter]= useState('')
  const [refreshing,  setRefreshing]  = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoadingTop(true); setLoadingLogs(true) }
    else setRefreshing(true)

    try {
      // Fetch players + auth users in parallel
      const [playersRes, authRes, logsRes] = await Promise.all([
        supabase.from('players').select('id, name, email').order('name'),
        fetch('/api/admin-get-auth-users').then(r => r.json()),
        supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
      ])

      setPlayers(playersRes.data || [])

      // Build email → authUser map
      const map = {}
      ;(authRes.users || []).forEach(u => { map[u.email?.toLowerCase()] = u })
      setAuthUsers(map)

      setLogs(logsRes.data || [])
    } finally {
      setLoadingTop(false)
      setLoadingLogs(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => load(true), 30000)
    return () => clearInterval(id)
  }, [load])

  // Sort players by last login (most recent first)
  const sortedPlayers = [...players].sort((a, b) => {
    const aT = authUsers[a.email?.toLowerCase()]?.last_sign_in_at
    const bT = authUsers[b.email?.toLowerCase()]?.last_sign_in_at
    if (!aT && !bT) return 0
    if (!aT) return 1
    if (!bT) return -1
    return new Date(bT) - new Date(aT)
  })

  // Stats
  const loggedInToday = players.filter(p => {
    const t = authUsers[p.email?.toLowerCase()]?.last_sign_in_at
    return t && (Date.now() - new Date(t).getTime()) < 24 * 3600000
  }).length
  const neverLoggedIn = players.filter(p => !authUsers[p.email?.toLowerCase()]?.last_sign_in_at).length

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    const matchType   = filter === 'all' || l.event_type === filter
    const matchPlayer = !playerFilter || l.player_name?.toLowerCase().includes(playerFilter.toLowerCase()) || l.player_email?.toLowerCase().includes(playerFilter.toLowerCase())
    return matchType && matchPlayer
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* ── Header row ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.dark, fontFamily:FONT }}>
          🕵️ Player Activity & Login Tracker
        </div>
        <button
          onClick={() => load(true)} disabled={refreshing}
          style={{ background:C.gray1, color:C.gray4, border:'none', borderRadius:8, padding:'7px 13px', cursor:refreshing?'default':'pointer', fontFamily:FONT, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6, opacity:refreshing?0.6:1 }}
        >
          {refreshing ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* ── Summary pills ── */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { label:'Total Players',    value: players.length,  bg:'#eff6ff', color:'#2563eb' },
          { label:'Active Today',     value: loggedInToday,   bg:'#dcfce7', color:'#15803d' },
          { label:'Never Logged In',  value: neverLoggedIn,   bg:'#fef9c3', color:'#b45309' },
          { label:'Events (last 200)',value: logs.length,     bg:'#f3e8ff', color:'#7c3aed' },
        ].map(pill => (
          <div key={pill.label} style={{ background:pill.bg, borderRadius:12, padding:'10px 16px', minWidth:100, flexShrink:0 }}>
            <div style={{ fontSize:22, fontWeight:900, color:pill.color, lineHeight:1 }}>{pill.value}</div>
            <div style={{ fontSize:10, fontWeight:700, color:pill.color, marginTop:3, textTransform:'uppercase', letterSpacing:.5, opacity:.8 }}>{pill.label}</div>
          </div>
        ))}
      </div>

      {/* ── Last Login section ── */}
      <div>
        <div style={{ fontWeight:700, fontSize:13, color:C.dark, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
          🕐 Last Login — All Players
          <span style={{ fontSize:11, color:C.gray3, fontWeight:500 }}>sorted by most recent</span>
        </div>
        <Card style={{ padding:0, overflow:'hidden' }}>
          {loadingTop ? (
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <Skeleton width={36} height={36} borderRadius="50%"/>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                    <Skeleton width={140} height={12}/>
                    <Skeleton width={180} height={10}/>
                  </div>
                  <Skeleton width={70} height={22} borderRadius={99}/>
                </div>
              ))}
            </div>
          ) : sortedPlayers.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:C.gray3, fontSize:13 }}>No players found</div>
          ) : (
            sortedPlayers.map(p => (
              <PlayerLoginCard
                key={p.id}
                player={p}
                authUser={authUsers[p.email?.toLowerCase()]}
              />
            ))
          )}
        </Card>
      </div>

      {/* ── Activity Log section ── */}
      <div>
        <div style={{ fontWeight:700, fontSize:13, color:C.dark, marginBottom:10 }}>
          📋 Activity Log <span style={{ fontSize:11, color:C.gray3, fontWeight:500 }}>— last 200 events</span>
        </div>

        {/* Filter bar */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', background:C.gray1, borderRadius:10, padding:3, gap:2 }}>
            {[
              { id:'all',       label:'All' },
              { id:'login',     label:'🔓 Logins' },
              { id:'page_view', label:'👁 Page Views' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:FONT, fontSize:12, fontWeight:700, transition:'all .15s', background: filter===f.id?'#fff':'transparent', color: filter===f.id?C.dark:C.gray3, boxShadow: filter===f.id?'0 1px 4px rgba(0,0,0,.1)':'none' }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Player search */}
          <input
            type="text"
            placeholder="🔍 Filter by player…"
            value={playerFilter}
            onChange={e => setPlayerFilter(e.target.value)}
            style={{ border:`1.5px solid ${C.gray2}`, borderRadius:10, padding:'7px 12px', fontFamily:FONT, fontSize:12, color:C.dark, outline:'none', minWidth:180 }}
          />
        </div>

        <Card style={{ padding:0, overflow:'hidden' }}>
          {loadingLogs ? (
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:10 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Skeleton width={28} height={28} borderRadius={8}/>
                  <Skeleton width={26} height={26} borderRadius="50%"/>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                    <Skeleton width={200} height={12}/>
                    <Skeleton width={130} height={10}/>
                  </div>
                  <Skeleton width={55} height={12}/>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:C.gray3, fontFamily:FONT, fontSize:14 }}>
              {logs.length === 0
                ? 'No activity yet — events will appear here as players use the app.'
                : 'No events match your filter.'}
            </div>
          ) : (
            filteredLogs.map(log => <LogRow key={log.id} log={log}/>)
          )}
        </Card>
      </div>

    </div>
  )
}
