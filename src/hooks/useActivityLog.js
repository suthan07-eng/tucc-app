/**
 * useActivityLog
 * Tracks page visits (with duration), button clicks, and auth events.
 * All writes go through /api/log-activity (service role) — never direct Supabase inserts.
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

// ── Page labels ─────────────────────────────────────────────────
const PAGE_LABELS = {
  '/':             'Home Dashboard',
  '/availability': 'Availability',
  '/results':      'Results',
  '/fixtures':     'Fixtures',
  '/players':      'Squad',
  '/league':       'League Table',
  '/stats':        'Stats',
  '/success':      'Availability Confirmed',
  '/register':     'Register',
}
function getLabel(path) { return PAGE_LABELS[path] || path }

// ── Device detection ────────────────────────────────────────────
function getDeviceInfo() {
  const ua = navigator.userAgent || ''
  let deviceType = 'Desktop'
  if (/tablet|ipad|playbook|silk/i.test(ua))                                            deviceType = 'Tablet'
  else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua))     deviceType = 'Mobile'

  let browser = 'Unknown'
  if      (/edg\//i.test(ua))        browser = 'Edge'
  else if (/opr\//i.test(ua))        browser = 'Opera'
  else if (/chrome/i.test(ua))       browser = 'Chrome'
  else if (/safari/i.test(ua))       browser = 'Safari'
  else if (/firefox/i.test(ua))      browser = 'Firefox'
  else if (/msie|trident/i.test(ua)) browser = 'IE'

  let os = 'Unknown'
  if      (/windows nt/i.test(ua))                              os = 'Windows'
  else if (/mac os x/i.test(ua) && !/mobile/i.test(ua))        os = 'macOS'
  else if (/iphone|ipad|ipod/i.test(ua))                        os = 'iOS'
  else if (/android/i.test(ua))                                 os = 'Android'
  else if (/linux/i.test(ua))                                   os = 'Linux'

  return { deviceType, browser, os }
}

// ── Core: POST to serverless endpoint ───────────────────────────
async function postLog(row) {
  try {
    await fetch('/api/log-activity', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'insert', row }),
    })
  } catch { /* best-effort */ }
}

async function patchDuration(id, duration_secs) {
  try {
    await fetch('/api/log-activity', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'update_duration', update_id: id, duration_secs }),
    })
  } catch { /* best-effort */ }
}

// ── Build row ────────────────────────────────────────────────────
async function buildRow(user, fields) {
  if (!user) return null
  const email = user.email || ''

  // Look up the player row (best-effort — don't block on failure)
  let playerName = user.user_metadata?.full_name || email
  let playerId   = null
  try {
    const { data: player } = await supabase
      .from('players')
      .select('id, name')
      .eq('email', email)
      .maybeSingle()
    if (player) { playerName = player.name; playerId = player.id }
  } catch { /* ignore */ }

  const { deviceType, browser, os } = getDeviceInfo()

  return {
    player_id:    playerId,
    player_name:  playerName,
    player_email: email,
    device_type:  deviceType,
    browser,
    os,
    ...fields,
  }
}

// ── Page-view + duration hook ─────────────────────────────────
export function useActivityLog(user) {
  const location   = useLocation()
  const lastPath   = useRef(null)
  const enterTime  = useRef(null)
  const lastLogId  = useRef(null)   // ID returned from last page_view insert (for duration patch)

  useEffect(() => {
    if (!user) return
    const path = location.pathname

    const skip = ['/login', '/admin', '/reset-password']
    if (skip.some(s => path.startsWith(s))) return

    const now = Date.now()

    // Patch duration on the previous page
    if (lastLogId.current && lastPath.current !== path && enterTime.current) {
      const secs = Math.round((now - enterTime.current) / 1000)
      patchDuration(lastLogId.current, secs)
      lastLogId.current = null
    }

    if (path === lastPath.current) return
    lastPath.current = path
    enterTime.current = now

    // Insert new page_view — capture the ID so we can patch duration later
    ;(async () => {
      const row = await buildRow(user, {
        event_type: 'page_view',
        page:       path,
        page_label: getLabel(path),
      })
      if (!row) return

      try {
        // Insert via REST directly so we can get the ID back
        const r = await fetch('/api/log-activity', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'insert', row }),
        })
        const data = await r.json()
        if (data?.id) lastLogId.current = data.id
      } catch { /* best-effort */ }
    })()
  }, [location.pathname, user])

  // Duration on tab close
  useEffect(() => {
    if (!user) return
    const onUnload = () => {
      if (!lastLogId.current || !enterTime.current) return
      const secs = Math.round((Date.now() - enterTime.current) / 1000)
      patchDuration(lastLogId.current, secs)
    }
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onUnload()
    })
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('visibilitychange', onUnload)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [user])
}

// ── Button click auto-tracker ────────────────────────────────
export function useButtonTracking(user) {
  useEffect(() => {
    if (!user) return

    const KEYWORDS = /availability|submit|login|logout|refresh|profile|fixture|result|squad|player/i

    async function handleClick(e) {
      const el = e.target.closest('button, a[href]')
      if (!el) return
      const text = el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60)
      if (!text || !KEYWORDS.test(text)) return

      const row = await buildRow(user, {
        event_type:   'button_click',
        page:         window.location.pathname,
        page_label:   getLabel(window.location.pathname),
        button_label: text,
      })
      if (row) postLog(row)
    }

    document.addEventListener('click', handleClick, { capture: true, passive: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [user])
}

// ── Auth events ───────────────────────────────────────────────
export async function logLogin(user) {
  const row = await buildRow(user, { event_type:'login', page:'/login', page_label:'Logged In' })
  if (row) await postLog(row)
}

export async function logLogout(user) {
  const row = await buildRow(user, { event_type:'logout', page:'/', page_label:'Logged Out' })
  if (row) await postLog(row)
}
