/**
 * useActivityLog
 * Tracks page visits (with duration), button clicks, and auth events.
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

  // Device type
  let deviceType = 'Desktop'
  if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = 'Tablet'
  else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) deviceType = 'Mobile'

  // Browser
  let browser = 'Unknown'
  if (/edg\//i.test(ua))        browser = 'Edge'
  else if (/opr\//i.test(ua))   browser = 'Opera'
  else if (/chrome/i.test(ua))  browser = 'Chrome'
  else if (/safari/i.test(ua))  browser = 'Safari'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/msie|trident/i.test(ua)) browser = 'IE'

  // OS
  let os = 'Unknown'
  if (/windows nt/i.test(ua))   os = 'Windows'
  else if (/mac os x/i.test(ua) && !/mobile/i.test(ua)) os = 'macOS'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/linux/i.test(ua))   os = 'Linux'

  return { deviceType, browser, os }
}

// ── Core insert ─────────────────────────────────────────────────
async function insertLog(user, fields) {
  if (!user) return
  const email = user.email || ''
  try {
    const { data: player } = await supabase
      .from('players')
      .select('id, name')
      .eq('email', email)
      .maybeSingle()

    const { deviceType, browser, os } = getDeviceInfo()

    await supabase.from('activity_logs').insert({
      player_id:    player?.id   || null,
      player_name:  player?.name || user.user_metadata?.full_name || email,
      player_email: email,
      device_type:  deviceType,
      browser,
      os,
      ...fields,
    })
  } catch { /* best-effort — never throw */ }
}

// ── Page-view hook ──────────────────────────────────────────────
export function useActivityLog(user) {
  const location   = useLocation()
  const lastPath   = useRef(null)
  const enterTime  = useRef(null)

  useEffect(() => {
    if (!user) return
    const path = location.pathname

    // Skip admin / auth routes
    const skip = ['/login', '/admin', '/reset-password']
    if (skip.some(s => path.startsWith(s))) return

    const now = Date.now()

    // Log duration on the PREVIOUS page before switching
    if (lastPath.current && lastPath.current !== path && enterTime.current) {
      const duration = Math.round((now - enterTime.current) / 1000)
      // Update the last log for the previous path with duration
      supabase
        .from('activity_logs')
        .select('id')
        .eq('player_email', user.email)
        .eq('page', lastPath.current)
        .eq('event_type', 'page_view')
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data?.[0]) {
            supabase
              .from('activity_logs')
              .update({ duration_secs: duration })
              .eq('id', data[0].id)
              .then(() => {})
          }
        })
    }

    if (path === lastPath.current) return
    lastPath.current = path
    enterTime.current = now

    insertLog(user, {
      event_type:  'page_view',
      page:        path,
      page_label:  getLabel(path),
    })
  }, [location.pathname, user])

  // Log duration when tab/window closes
  useEffect(() => {
    if (!user) return
    const handleUnload = () => {
      if (!lastPath.current || !enterTime.current) return
      const duration = Math.round((Date.now() - enterTime.current) / 1000)
      // Use sendBeacon for reliability on page unload
      const email = user.email || ''
      navigator.sendBeacon?.('/api/log-unload', JSON.stringify({
        player_email: email, page: lastPath.current, duration_secs: duration,
      }))
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [user])
}

// ── Button click tracker ────────────────────────────────────────
// Call this wherever you want to track a specific button interaction
export async function logButtonClick(user, buttonLabel, page) {
  if (!user) return
  await insertLog(user, {
    event_type:   'button_click',
    page:         page || window.location.pathname,
    page_label:   getLabel(page || window.location.pathname),
    button_label: buttonLabel,
  })
}

// ── Global click listener (auto-tracks important buttons) ───────
export function useButtonTracking(user) {
  useEffect(() => {
    if (!user) return

    // Buttons/links we want to auto-track (by their visible text content)
    const TRACKED_LABELS = [
      'Submit My Availability',
      'Login to Club Portal',
      'Submit Availability',
      'Play Cricket Profile',
      'View Fixtures',
      'View Results',
      'View Players',
      'Refresh',
    ]

    function handleClick(e) {
      const el = e.target.closest('button, a[href]')
      if (!el) return
      const text = el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60)
      if (!text) return
      // Only track if it matches our list OR contains key words
      const shouldTrack = TRACKED_LABELS.some(l => text.includes(l))
        || /availability|submit|login|logout|refresh|profile|fixture|result|player/i.test(text)
      if (!shouldTrack) return

      insertLog(user, {
        event_type:   'button_click',
        page:         window.location.pathname,
        page_label:   getLabel(window.location.pathname),
        button_label: text,
      })
    }

    document.addEventListener('click', handleClick, { capture: true, passive: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [user])
}

// ── Login event ─────────────────────────────────────────────────
export async function logLogin(user) {
  await insertLog(user, {
    event_type:  'login',
    page:        '/login',
    page_label:  'Logged In',
  })
}

// ── Logout event ────────────────────────────────────────────────
export async function logLogout(user) {
  await insertLog(user, {
    event_type:  'logout',
    page:        '/',
    page_label:  'Logged Out',
  })
}
