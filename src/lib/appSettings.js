// Small key/value app settings backed by the Supabase `app_settings` table.
// Used for admin-controlled feature toggles (e.g. the Survival Report banner).

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export async function getSetting(key, fallback = null) {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (error) return fallback
    return data ? data.value : fallback
  } catch (e) {
    return fallback
  }
}

export async function setSetting(key, value) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  return !error
}

// React hook — returns the current boolean-ish value (defaults to `fallback`
// until loaded). Re-reads on mount.
export function useSetting(key, fallback = null) {
  const [value, setValue] = useState(fallback)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    getSetting(key, fallback).then((v) => {
      if (alive) { setValue(v); setLoaded(true) }
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return [value, loaded]
}
