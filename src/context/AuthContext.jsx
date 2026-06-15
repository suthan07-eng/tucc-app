import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { logLogin, logLogout } from '../hooks/useActivityLog'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch extended profile from player_profiles table
  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    setProfile(data || null)
    return data
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id).finally(() => setLoading(false))
      else setLoading(false)
    }).catch(() => setLoading(false)) // never get stuck on a session-restore error

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Log the login event after successful auth
    if (data?.user) logLogin(data.user).catch(() => {})
  }

  async function signUp(email, password, meta) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: meta },
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (user) await logLogout(user).catch(() => {})
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  async function updateProfile(updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('player_profiles')
      .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
