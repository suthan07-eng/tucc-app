import { useState, useEffect, useCallback } from 'react'
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
  if (mins  < 1)  return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit',
  })
}

function fmtDuration(secs) {
  if (!secs || secs < 1) return null
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60), s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

const EVENT_META = {
  login:        { bg:'#dcfce7', color:'#15803d', icon:'🔓', label:'Login'        },
  logout:       { bg:'#fee2e2', color:'#dc2626', icon:'🔒', label:'Logout'       },
  page_view:    { bg:'#eff6ff', color:'#2563eb', icon:'👁',  label:'Page View'   },
  button_click: { bg:'#fef9c3', color:'#b45309', icon:'👆', label:'Button Click' },
}

const PAGE_ICONS = {
  '/':             '🏠', '/availability':'📋', '/results':'🏆',
  '/fixtures':'📅', '/players':'👥', '/league':'📊',
  '/stats':'📈',  '/success':'✅',   '/register':'📝',
}

const DEVICE_ICONS = { Desktop:'🖥', Mobile:'📱', Tablet:'⬛' }
const BROWSER_ICONS = { Chrome:'🌐', Safari:'🧭', Firefox:'🦊', Edge:'🌀', Opera:'🅾', IE:'🔵', Unknown:'🌐' }
const OS_ICONS = { Windows:'🪟', macOS:'🍎', iOS:'📱', Android:'🤖', Linux:'🐧', Unknown:'💻' }

// ── Last Login card ────────────────────────────────────────────
function PlayerLoginCard({ player, authUser, lastLog }) {
  const lastLogin  = authUser?.last_sign_in_at
  const isRecent   = lastLogin && (Date.now() - new Date(lastLogin).getTime()) < 24 * 3600000
  const deviceIcon = lastLog ? (DEVICE_ICONS[lastLog.device_type] || '💻') : ''
  const browserIcon= lastLog ? (BROWSER_ICONS[lastLog.browser]   || '🌐') : ''
  const osIcon     = lastLog ? (OS_ICONS[lastLog.os]             || '💻') : ''

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'13px 16px',
      borderBottom:`1px solid ${C.gray1}`,
    }}>
      <div style={{ position:'relative', flexShrink:0 }}>
        <Avatar name={player.name} size={36}/>
        {isRecent && (
          <div style={{ position:'absolute', bottom:0, right:0, width:10, height:10, borderRadius:'50%', background:'#22c55e', border:'2px solid #fff' }}/>
        )}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:13, color:C.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {player.name}
        </div>
        <div style={{ fontSize:11, color:C.gray3, marginTop:1, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{player.email}</span>
          {lastLog && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:3, flexShrink:0 }}>
              <span title={`Device: ${lastLog.device_type}`}>{deviceIcon}</span>
              <span title={`Browser: ${lastLog.browser}`}>{browserIcon}</span>
              <span title={`OS: ${lastLog.os}`}>{osIcon}</span>
              <span style={{ color:C.gray4 }}>{lastLog.device_type} · {lastLog.browser} · {lastLog.os}</span>
            </span>
          )}
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

// ── Activity log row ───────────────────────────────────────────
function LogRow({ log }) {
  const meta      = EVENT_META[log.event_type] || EVENT_META.page_view
  const pageIcon  = PAGE_ICONS[log.page] || '📄'
  const duration  = fmtDuration(log.duration_secs)
  const devIcon   = DEVICE_ICONS[log.device_type]  || '💻'
  const brwIcon   = BROWSER_ICONS[log.browser]     || '🌐'
  const osIcon    = OS_ICONS[log.os]               || '💻'

  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10,
      padding:'10px 16px', borderBottom:`1px solid ${C.gray1}`,
    }}>
      {/* Event type badge */}
      <div style={{
        width:30, height:30, borderRadius:9, flexShrink:0,
        background:meta.bg, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:15, marginTop:1,
      }}>
        {meta.icon}
      </div>

      <Avatar name={log.player_name} size={28} style={{ marginTop:1 }}/>

      <div style={{ flex:1, minWidth:0 }}>
        {/* Row 1: name + event type + page */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:12, color:C.dark }}>
            {log.player_name || log.player_email}
          </span>
          <span style={{ fontSize:11, color:meta.color, background:meta.bg, borderRadius:99, padding:'1px 7px', fontWeight:700, flexShrink:0 }}>
            {meta.label}
          </span>
          {log.event_type === 'page_view' && (
            <span style={{ fontSize:11, color:C.gray4 }}>
              {pageIcon} {log.page_label || log.page}
            </span>
          )}
          {log.event_type === 'button_click' && log.button_label && (
            <span style={{ fontSize:11, color:'#b45309', background:'#fef9c3', borderRadius:6, padding:'1px 7px', fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              "{log.button_label}"
            </span>
          )}
        </div>

        {/* Row 2: device + duration */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, color:C.gray3, display:'flex', alignItems:'center', gap:3 }}>
            {devIcon} {log.device_type || '—'}
          </span>
          <span style={{ fontSize:10, color:C.gray3 }}>·</span>
          <span style={{ fontSize:10, color:C.gray3, display:'flex', alignItems:'center', gap:3 }}>
            {brwIcon} {log.browser || '—'}
          </span>
          <span style={{ fontSize:10, color:C.gray3 }}>·</span>
          <span style={{ fontSize:10, color:C.gray3, display:'flex', alignItems:'center', gap:3 }}>
            {osIcon} {log.os || '—'}
          </span>
          {duration && (
            <>
              <span style={{ fontSize:10, color:C.gray3 }}>·</span>
              <span style={{ fontSize:10, color:'#7c3aed', background:'#f3e8ff', borderRadius:99, padding:'1px 7px', fontWeight:700 }}>
                ⏱ {duration}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Time */}
      <div style={{ fontSize:11, color:C.gray3, flexShrink:0, textAlign:'right', lineHeight:1.5 }}>
        <div style={{ fontWeight:700 }}>{timeAgo(log.created_at)}</div>
        <div style={{ fontSize:10 }}>
          {new Date(log.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
        </div>
      </div>
    </div>
  )
}

// ── Main tab ───────────────────────────────────────────────────
const SUPABASE_URL = 'https://nrbuweeexnoofitznffo.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnV3ZWVleG5vb2ZpdHpuZmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMTY3NSwiZXhwIjoyMDk0Mjc3Njc1fQ.JyCySfb0mVFZ7HXc20AZHz3-YVTRW_VMAv8lwhyPvk0'

async function fetchWithServiceRole(path) {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  return r.json()
}

export default function TabActivity() {
  const [players,      setPlayers]      = useState([])
  const [authUsers,    setAuthUsers]    = useState({})  // email → authUser
  const [lastLogByEmail, setLastLogByEmail] = useState({}) // email → most recent log (for device info)
  const [logs,         setLogs]         = useState([])
  const [loadingTop,   setLoadingTop]   = useState(true)
  const [loadingLogs,  setLoadingLogs]  = useState(true)
  const [filter,       setFilter]       = useState('all')
  const [playerFilter, setPlayerFilter] = useState('')
  const [refreshing,   setRefreshing]   = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoadingTop(true); setLoadingLogs(true) }
    else setRefreshing(true)

    try {
      const [playersData, authData, logsData] = await Promise.all([
        // Players via anon (RLS allows read)
        fetch(`${SUPABASE_URL}/rest/v1/players?select=id,name,email&order=name`, {
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        }).then(r => r.json()),

        // Auth users for last_sign_in_at
        fetch('/api/admin-get-auth-users').then(r => r.json()),

        // Activity logs via service-role API (bypasses RLS)
        fetch('/api/admin-get-activity?limit=300').then(r => r.json()),
      ])

      const ps = Array.isArray(playersData) ? playersData : []
      setPlayers(ps)

      const authMap = {}
      ;(authData.users || []).forEach(u => {
        if (u.email) authMap[u.email.toLowerCase()] = u
      })
      setAuthUsers(authMap)

      const allLogs = logsData.logs || []
      setLogs(allLogs)

      // Build per-player "last log" map (for device info on the login cards)
      const lastMap = {}
      allLogs.forEach(l => {
        const key = l.player_email?.toLowerCase()
        if (key && !lastMap[key]) lastMap[key] = l  // already sorted desc
      })
      setLastLogByEmail(lastMap)

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

  // Sort players: most recently logged in first
  const sortedPlayers = [...players].sort((a, b) => {
    const aT = authUsers[a.email?.toLowerCase()]?.last_sign_in_at
    const bT = authUsers[b.email?.toLowerCase()]?.last_sign_in_at
    if (!aT && !bT) return 0
    if (!aT) return 1
    if (!bT) return -1
    return new Date(bT) - new Date(aT)
  })

  // Summary stats
  const activeToday   = players.filter(p => {
    const t = authUsers[p.email?.toLowerCase()]?.last_sign_in_at
    return t && (Date.now() - new Date(t).getTime()) < 86400000
  }).length
  const neverLoggedIn = players.filter(p => !authUsers[p.email?.toLowerCase()]?.last_sign_in_at).length
  const totalDuration = logs.reduce((sum, l) => sum + (l.duration_secs || 0), 0)

  // Filtered logs
  const filtered = logs.filter(l => {
    const okType   = filter === 'all' || l.event_type === filter
    const okPlayer = !playerFilter || [l.player_name, l.player_email].some(v => v?.toLowerCase().includes(playerFilter.toLowerCase()))
    return okType && okPlayer
  })

  const FILTERS = [
    { id:'all',          label:'All' },
    { id:'login',        label:'🔓 Logins' },
    { id:'page_view',    label:'👁 Pages' },
    { id:'button_click', label:'👆 Clicks' },
    { id:'logout',       label:'🔒 Logouts' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, fontFamily:FONT }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.dark }}>🕵️ Player Activity & Login Tracker</div>
        <button onClick={() => load(true)} disabled={refreshing}
          style={{ background:C.gray1, color:C.gray4, border:'none', borderRadius:8, padding:'7px 13px', cursor:refreshing?'default':'pointer', fontFamily:FONT, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:5, opacity:refreshing?0.6:1 }}>
          {refreshing ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Summary pills */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { label:'Total Players',   value:players.length,               bg:'#eff6ff', color:'#2563eb' },
          { label:'Active Today',    value:activeToday,                  bg:'#dcfce7', color:'#15803d' },
          { label:'Never Logged In', value:neverLoggedIn,                bg:'#fef9c3', color:'#b45309' },
          { label:'Events Logged',   value:logs.length,                  bg:'#f3e8ff', color:'#7c3aed' },
          { label:'Total Time Spent',value:fmtDuration(totalDuration)||'—', bg:'#fff7ed', color:'#c2410c' },
        ].map(p => (
          <div key={p.label} style={{ background:p.bg, borderRadius:12, padding:'10px 16px', minWidth:90, flexShrink:0 }}>
            <div style={{ fontSize:20, fontWeight:900, color:p.color, lineHeight:1 }}>{p.value}</div>
            <div style={{ fontSize:10, fontWeight:700, color:p.color, marginTop:3, textTransform:'uppercase', letterSpacing:.4, opacity:.8 }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* Last Login section */}
      <div>
        <div style={{ fontWeight:700, fontSize:13, color:C.dark, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
          🕐 Last Login — All Players
          <span style={{ fontSize:11, color:C.gray3, fontWeight:500 }}>sorted by most recent · device shown from last session</span>
        </div>
        <Card style={{ padding:0, overflow:'hidden' }}>
          {loadingTop ? (
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <Skeleton width={36} height={36} borderRadius="50%"/>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                    <Skeleton width={140} height={12}/><Skeleton width={220} height={10}/>
                  </div>
                  <Skeleton width={70} height={22} borderRadius={99}/>
                </div>
              ))}
            </div>
          ) : sortedPlayers.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:C.gray3, fontSize:13 }}>No players found</div>
          ) : sortedPlayers.map(p => (
            <PlayerLoginCard
              key={p.id} player={p}
              authUser={authUsers[p.email?.toLowerCase()]}
              lastLog={lastLogByEmail[p.email?.toLowerCase()]}
            />
          ))}
        </Card>
      </div>

      {/* Activity log */}
      <div>
        <div style={{ fontWeight:700, fontSize:13, color:C.dark, marginBottom:10 }}>
          📋 Activity Log
          <span style={{ fontSize:11, color:C.gray3, fontWeight:500, marginLeft:8 }}>
            last 300 events · auto-refreshes every 30s
          </span>
        </div>

        {/* Filter bar */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', background:C.gray1, borderRadius:10, padding:3, gap:1 }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ padding:'6px 11px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:FONT, fontSize:11, fontWeight:700, transition:'all .15s', background:filter===f.id?'#fff':'transparent', color:filter===f.id?C.dark:C.gray3, boxShadow:filter===f.id?'0 1px 4px rgba(0,0,0,.1)':'none', whiteSpace:'nowrap' }}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={playerFilter} onChange={e => setPlayerFilter(e.target.value)}
            style={{ border:`1.5px solid ${C.gray2}`, borderRadius:10, padding:'7px 12px', fontFamily:FONT, fontSize:12, color:playerFilter?C.dark:C.gray3, outline:'none', minWidth:180, background:'#fff', cursor:'pointer' }}>
            <option value="">👤 All players</option>
            {players.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <Card style={{ padding:0, overflow:'hidden' }}>
          {loadingLogs ? (
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:10 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Skeleton width={30} height={30} borderRadius={9}/>
                  <Skeleton width={28} height={28} borderRadius="50%"/>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                    <Skeleton width={240} height={12}/><Skeleton width={160} height={10}/>
                  </div>
                  <Skeleton width={55} height={12}/>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:C.gray3, fontFamily:FONT, fontSize:14 }}>
              {logs.length === 0
                ? '📭 No activity yet — events will appear here as players use the app.'
                : 'No events match your filter.'}
            </div>
          ) : filtered.map(log => <LogRow key={log.id} log={log}/>)}
        </Card>
      </div>

    </div>
  )
}

function fmtDuration(secs) {
  if (!secs || secs < 1) return null
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60), s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}
