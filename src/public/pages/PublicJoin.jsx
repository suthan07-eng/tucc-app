import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'
import { supabase } from '../../supabase'

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7 } }

const INPUT_STYLE = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)',
  borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 15,
  fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const LABEL_STYLE = { display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8, letterSpacing: '0.3px' }

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
      {error && <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{error}</div>}
    </div>
  )
}

export default function PublicJoin() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const defaultType = params.get('type') || ''

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', dob: '',
    membership_type: defaultType, message: '',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [serverError, setServerError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    else if (form.full_name.trim().length > 120) e.full_name = 'Name too long'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    else if (!/^[0-9+\s\-().]{7,20}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number'
    if (!form.dob) e.dob = 'Date of birth is required'
    if (!form.membership_type) e.membership_type = 'Please select a membership type'
    if (form.message.trim().length > 2000) e.message = 'Message is too long (max 2000 chars)'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStatus('loading')
    setServerError('')

    const payload = {
      full_name: form.full_name.trim().slice(0, 120),
      email: form.email.trim().toLowerCase().slice(0, 254),
      phone: form.phone.trim().slice(0, 30),
      dob: form.dob,
      membership_type: form.membership_type,
      message: form.message.trim().slice(0, 2000),
      created_at: new Date().toISOString(),
    }

    try {
      // Insert into Supabase
      const { error: dbErr } = await supabase.from('membership_enquiries').insert(payload)
      if (dbErr) console.warn('Supabase insert error (non-fatal):', dbErr.message)

      // Send email notification
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: SITE.email,
          subject: `New Membership Enquiry — ${payload.full_name} (${payload.membership_type})`,
          html: `
            <div style="font-family:sans-serif;max-width:560px">
              <h2 style="color:#1e3a8a">New Membership Enquiry</h2>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:8px;color:#666;width:140px">Name</td><td style="padding:8px;font-weight:600">${payload.full_name}</td></tr>
                <tr><td style="padding:8px;color:#666">Email</td><td style="padding:8px"><a href="mailto:${payload.email}">${payload.email}</a></td></tr>
                <tr><td style="padding:8px;color:#666">Phone</td><td style="padding:8px">${payload.phone}</td></tr>
                <tr><td style="padding:8px;color:#666">Date of Birth</td><td style="padding:8px">${payload.dob}</td></tr>
                <tr><td style="padding:8px;color:#666">Membership</td><td style="padding:8px;font-weight:700;color:#e9a020">${payload.membership_type}</td></tr>
                ${payload.message ? `<tr><td style="padding:8px;color:#666;vertical-align:top">Notes</td><td style="padding:8px">${payload.message}</td></tr>` : ''}
              </table>
            </div>
          `,
        }),
      }).catch(err => console.warn('Email send failed (non-fatal):', err))

      // Auto-reply to applicant
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payload.email,
          subject: 'Your Tamil United CC Membership Enquiry',
          html: `
            <div style="font-family:sans-serif;max-width:560px">
              <h2 style="color:#1e3a8a">Thank you, ${payload.full_name}!</h2>
              <p>We've received your enquiry for <strong>${payload.membership_type}</strong> and will be in touch soon.</p>
              <p>If you have any questions in the meantime, contact us at <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
              <p style="color:#888;font-size:13px">Tamil United Cricket Club · ${SITE.league}</p>
            </div>
          `,
        }),
      }).catch(err => console.warn('Auto-reply failed (non-fatal):', err))

      setStatus('success')
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again or email us directly.')
      setStatus('error')
    }
  }

  const focusStyle = { borderColor: SITE.colors.gold }

  if (status === 'success') {
    return (
      <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
        <PublicNav />
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center' }}>
          <motion.div {...fadeUp}>
            <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 12 }}>Enquiry Sent!</h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Thank you for your interest in joining Tamil United CC. We'll be in touch at <strong style={{ color: SITE.colors.gold }}>{form.email}</strong> within a few days.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setStatus('idle'); setForm({ full_name: '', email: '', phone: '', dob: '', membership_type: '', message: '' }) }}
                style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontSize: 15, fontFamily: "'Outfit', sans-serif" }}>
                Submit Another
              </button>
            </div>
          </motion.div>
        </div>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      <section style={{
        paddingTop: 140, paddingBottom: 60, textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '140px 24px 60px',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Membership</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 16 }}>Join Tamil United CC</h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Fill in the form below and our committee will be in touch to complete your membership.
          </p>
        </motion.div>
      </section>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px 120px' }}>
        <motion.form onSubmit={handleSubmit} noValidate {...fadeUp}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '48px 40px' }}
        >
          <Field label="Full Name *" error={errors.full_name}>
            <input
              type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
              placeholder="Your full name" maxLength={120}
              style={INPUT_STYLE}
              onFocus={e => e.target.style.borderColor = SITE.colors.gold}
              onBlur={e => e.target.style.borderColor = errors.full_name ? '#f87171' : 'rgba(255,255,255,0.12)'}
            />
          </Field>

          <Field label="Email Address *" error={errors.email}>
            <input
              type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="you@example.com" maxLength={254}
              style={INPUT_STYLE}
              onFocus={e => e.target.style.borderColor = SITE.colors.gold}
              onBlur={e => e.target.style.borderColor = errors.email ? '#f87171' : 'rgba(255,255,255,0.12)'}
            />
          </Field>

          <Field label="Phone Number *" error={errors.phone}>
            <input
              type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+44 7700 000000" maxLength={30}
              style={INPUT_STYLE}
              onFocus={e => e.target.style.borderColor = SITE.colors.gold}
              onBlur={e => e.target.style.borderColor = errors.phone ? '#f87171' : 'rgba(255,255,255,0.12)'}
            />
          </Field>

          <Field label="Date of Birth *" error={errors.dob}>
            <input
              type="date" value={form.dob} onChange={e => set('dob', e.target.value)}
              style={{ ...INPUT_STYLE, colorScheme: 'dark' }}
              onFocus={e => e.target.style.borderColor = SITE.colors.gold}
              onBlur={e => e.target.style.borderColor = errors.dob ? '#f87171' : 'rgba(255,255,255,0.12)'}
            />
          </Field>

          <Field label="Membership Type *" error={errors.membership_type}>
            <select
              value={form.membership_type} onChange={e => set('membership_type', e.target.value)}
              style={{ ...INPUT_STYLE, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = SITE.colors.gold}
              onBlur={e => e.target.style.borderColor = errors.membership_type ? '#f87171' : 'rgba(255,255,255,0.12)'}
            >
              <option value="" disabled>Select a membership type...</option>
              {SITE.membership.map(m => <option key={m.name} value={m.name}>{m.name} — {m.price}</option>)}
            </select>
          </Field>

          <Field label="Notes / Message" error={errors.message}>
            <textarea
              value={form.message} onChange={e => set('message', e.target.value)}
              placeholder="Tell us a bit about yourself — playing experience, preferred role, how you heard about us..." maxLength={2000}
              rows={5}
              style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 120 }}
              onFocus={e => e.target.style.borderColor = SITE.colors.gold}
              onBlur={e => e.target.style.borderColor = errors.message ? '#f87171' : 'rgba(255,255,255,0.12)'}
            />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>{form.message.length}/2000</div>
          </Field>

          {serverError && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 14, color: '#f87171' }}>
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%', background: status === 'loading' ? 'rgba(233,160,32,0.5)' : SITE.colors.gold,
              color: '#000', border: 'none', borderRadius: 12, padding: '16px 24px',
              fontSize: 16, fontWeight: 800, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              fontFamily: "'Outfit', sans-serif", letterSpacing: '0.3px',
              transition: 'all 0.2s',
            }}
          >
            {status === 'loading' ? 'Submitting...' : 'Submit Enquiry →'}
          </button>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 16 }}>
            We'll respond within 2–3 working days. Your data is handled in accordance with our{' '}
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.5)' }}>Privacy Policy</a>.
          </p>
        </motion.form>
      </section>

      <PublicFooter />

      <style>{`
        select option { background: #0d1b3e; color: #fff; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); }
      `}</style>
    </div>
  )
}
