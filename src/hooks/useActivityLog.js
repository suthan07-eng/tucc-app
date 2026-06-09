/**
 * useActivityLog
 * Automatically logs page visits and auth events to the activity_logs table.
 * Import and call once inside AppRoutes (or any top-level route component).
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

// Human-readable labels for each route
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

function getLabel(path) {
  return PAGE_LABELS[path] || path
}

/**
 * Call this hook once in a component that is rendered for all authenticated routes.
 * It fires one INSERT per page navigation.
 */
export function useActivityLog(user) {
  const location = useLocation()
  const lastPath = useRef(null)

  useEffect(() => {
    if (!user) return
    const path = location.pathname

    // Don't double-log same path (e.g. strict mode double-mount)
    if (path === lastPath.current) return
    lastPath.current = path

    // Only log player-facing routes, not admin or auth pages
    const skip = ['/login', '/admin', '/reset-password']
    if (skip.some(s => path.startsWith(s))) return

    async function log() {
      // Look up the player row by the auth user's email
      const email = user.email || ''
      const { data: player } = await supabase
        .from('players')
        .select('id, name')
        .eq('email', email)
        .maybeSingle()

      await supabase.from('activity_logs').insert({
        player_id:    player?.id   || null,
        player_name:  player?.name || user.user_metadata?.full_name || email,
        player_email: email,
        event_type:   'page_view',
        page:         path,
        page_label:   getLabel(path),
      })
    }

    log().catch(() => {}) // never throw — logging is best-effort
  }, [location.pathname, user])
}

/**
 * Call after a successful signIn to log a login event.
 */
export async function logLogin(user) {
  if (!user) return
  try {
    const email = user.email || ''
    const { data: player } = await supabase
      .from('players')
      .select('id, name')
      .eq('email', email)
      .maybeSingle()

    await supabase.from('activity_logs').insert({
      player_id:    player?.id   || null,
      player_name:  player?.name || user.user_metadata?.full_name || email,
      player_email: email,
      event_type:   'login',
      page:         '/login',
      page_label:   'Logged In',
    })
  } catch { /* best-effort */ }
}

/**
 * Call before signOut to log a logout event.
 */
export async function logLogout(user) {
  if (!user) return
  try {
    const email = user.email || ''
    const { data: player } = await supabase
      .from('players')
      .select('id, name')
      .eq('email', email)
      .maybeSingle()

    await supabase.from('activity_logs').insert({
      player_id:    player?.id   || null,
      player_name:  player?.name || user.user_metadata?.full_name || email,
      player_email: email,
      event_type:   'logout',
      page:         '/',
      page_label:   'Logged Out',
    })
  } catch { /* best-effort */ }
}
