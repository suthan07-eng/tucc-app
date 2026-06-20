import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { C, FONT, ADMIN_EMAIL, ADMIN_PASSWORD } from '../../constants'
const AC = { green:'#2563eb', greenDark:'#1e3a8a', greenLight:'#1d4ed8', greenBg:'#eff6ff', gold:'#e9a020', white:'#ffffff', bg:'#eef2ff', gray1:'#f1f5f9', gray2:'#e2e8f0', gray3:'#94a3b8', gray4:'#64748b', gray5:'#334155', dark:'#0f172a', red:'#dc2626', redBg:'#fee2e2', ok:'#16a34a', okBg:'#dcfce7', blue:'#2563eb', blueBg:'#eff6ff', shadow:'rgba(30,58,138,0.07)', shadowMd:'rgba(30,58,138,0.11)', shadowLg:'rgba(30,58,138,0.18)' } // admin keeps original light theme
import Button from '../ui/Button'
import Card from '../ui/Card'
import Field, { Input } from '../ui/Field'
import { useToast } from '../Toast'

export default function AdminLogin() {
  const nav = useNavigate()
  const toast = useToast()

  // Already logged in
  if (sessionStorage.getItem('tucc_admin')) {
    return <Navigate to="/admin" replace />
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!email.trim()) errs.email = 'Required'
    if (!password) errs.password = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)

    const emailOk    = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
    const passwordOk = password === ADMIN_PASSWORD

    if (!emailOk || !passwordOk) {
      setErrors({ password: 'Invalid login credentials' })
      setLoading(false)
      return
    }

    sessionStorage.setItem('tucc_admin', '1')
    toast('Welcome back, Captain! 🏏')
    nav('/admin')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: AC.bg,
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
          <h1 style={{ fontSize: 21, fontWeight: 800, color: AC.dark, margin: 0 }}>Admin Login</h1>
          <p style={{ color: AC.gray3, fontSize: 13, marginTop: 6 }}>Tamil United Cricket Club</p>
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

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: AC.gray3 }}>
          <button
            onClick={() => nav('/')}
            style={{ color: AC.gray3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13 }}
          >
            ← Back to home
          </button>
        </p>
      </motion.div>
    </div>
  )
}
