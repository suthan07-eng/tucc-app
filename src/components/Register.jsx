import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import { C, FONT, MAX_WIDTH, ROLES } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import Button from './ui/Button'
import Card from './ui/Card'
import Field, { Input, Select } from './ui/Field'
import { useToast } from './Toast'

const EASE_OUT = [0.23, 1, 0.32, 1]

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
}
const staggerList = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
}

const EMPTY = { name: '', email: '', phone: '', role: '' }

export default function Register() {
  const nav = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function set(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setErrors((err) => ({ ...err, [key]: undefined }))
    }
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.role) e.role = 'Please select your playing role'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('email', form.email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      setErrors({ email: 'Email already registered — use the link below to continue.' })
      setLoading(false)
      return
    }

    const { error } = await supabase.from('players').insert({
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      phone: form.phone.trim(),
      role: form.role,
    })

    if (error) {
      toast(error.message || 'Registration failed. Please try again.', 'error')
      setLoading(false)
      return
    }

    toast('Welcome to TUCC! 🏏')
    nav(`/availability?email=${encodeURIComponent(form.email.toLowerCase().trim())}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
          padding: '44px 20px 36px',
          textAlign: 'center',
        }}
      >
        <motion.div variants={staggerList} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 2px 12px rgba(0,0,0,.15)', overflow: 'hidden' }}>
            <img src="/logo.png" alt="DTU CC" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </motion.div>
          <motion.h1 variants={fadeUp} style={{ color: C.white, fontSize: 24, fontWeight: 800, margin: 0 }}>
            Join Tamil United CC
          </motion.h1>
          <motion.p variants={fadeUp} style={{ color: 'rgba(255,255,255,.65)', fontSize: 14, marginTop: 8, maxWidth: 320, margin: '8px auto 0' }}>
            Register once to submit your availability each week
          </motion.p>
        </motion.div>
      </div>

      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '24px 16px 40px', width: '100%' }}>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ transitionDelay: '0.2s' }}>
        <Card>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Full Name" required error={errors.name}>
              <Input
                placeholder="Suthan Sivashanmugam"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
                autoComplete="name"
              />
            </Field>

            <Field label="Email Address" required error={errors.email}>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                autoComplete="email"
              />
            </Field>

            <Field label="Phone Number" required error={errors.phone} hint="Used for WhatsApp reminders">
              <Input
                type="tel"
                placeholder="+44 7700 900000"
                value={form.phone}
                onChange={set('phone')}
                error={errors.phone}
                autoComplete="tel"
              />
            </Field>

            <Field label="Playing Role" required error={errors.role}>
              <Select value={form.role} onChange={set('role')} error={errors.role}>
                <option value="">Select your role...</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </Field>

            <Button type="submit" size="full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Registering…' : 'Register & Continue →'}
            </Button>
          </form>
        </Card>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{ textAlign: 'center', marginTop: 18, color: C.gray4, fontSize: 14 }}
        >
          Already registered?{' '}
          <Link to="/availability" style={{ color: C.green, fontWeight: 600, textDecoration: 'none' }}>
            Submit availability →
          </Link>
        </motion.p>
      </div>

      <Footer />
    </div>
  )
}
