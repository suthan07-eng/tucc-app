import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { C, FONT, ADMIN_EMAIL } from '../../constants'
import { supabase } from '../../supabase'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Field, { Input } from '../ui/Field'
import { useToast } from '../Toast'

export default function AdminLogin() {
  const nav = useNavigate()
  const toast = useToast()

  // Already logged in
  if (sessionStorage.getItem('tucc_admin_token')) {
    return <Navigate to="/admin" replace />
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!email.trim()) errs.email = 'Required'
    if (!password) errs.password = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error || !data?.session) {
      setErrors({ password: error?.message || 'Invalid email or password' })
      setLoading(false)
      return
    }

    if (data.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut()
      setErrors({ password: 'Not authorised as admin' })
      setLoading(false)
      return
    }

    sessionStorage.setItem('tucc_admin_token', data.session.access_token)
    toast('Welcome back, Captain! 🏏')
    nav('/admin')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ maxWidth: 400, width: '100%' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 2px 12px rgba(0,0,0,.12)', overflow: 'hidden' }}>
            <img src="/logo.png" alt="DTU CC" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.dark, margin: 0 }}>Admin Login</h1>
          <p style={{ color: C.gray3, fontSize: 13, marginTop: 6 }}>Tamil United Cricket Club</p>
        </motion.div>

        <Card>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                placeholder="suthan07@gmail.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                error={errors.email}
                autoComplete="email"
                autoFocus
              />
            </Field>

            <Field label="Password" required error={errors.password}>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
                error={errors.password}
                autoComplete="current-password"
              />
            </Field>

            <Button type="submit" size="full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: C.gray3 }}>
          <button
            onClick={() => nav('/')}
            style={{ color: C.gray3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13 }}
          >
            ← Back to home
          </button>
        </p>
      </motion.div>
    </div>
  )
}
