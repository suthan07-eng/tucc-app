import { useState } from 'react'
import { motion } from 'framer-motion'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const INPUT_STYLE = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)',
  borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 15,
  fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const SUBJECTS = ['General Enquiry', 'Membership', 'Sponsorship', 'Match / Fixture', 'Media / Press', 'Committee', 'Other']

export default function PublicContact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [serverError, setServerError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.subject) e.subject = 'Please select a subject'
    if (!form.message.trim()) e.message = 'Message is required'
    else if (form.message.trim().length > 3000) e.message = 'Message too long (max 3000 chars)'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStatus('loading')

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: SITE.email,
          subject: `Website Contact: ${form.subject} — ${form.name.trim()}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px">
              <h2 style="color:#1e3a8a">New Contact Form Submission</h2>
              <p><strong>From:</strong> ${form.name.trim()}</p>
              <p><strong>Email:</strong> <a href="mailto:${form.email.trim()}">${form.email.trim()}</a></p>
              <p><strong>Subject:</strong> ${form.subject}</p>
              <hr/>
              <p style="white-space:pre-wrap">${form.message.trim()}</p>
            </div>
          `,
        }),
      })
      setStatus('success')
    } catch (err) {
      setServerError('Failed to send message. Please email us directly at ' + SITE.email)
      setStatus('error')
    }
  }

  const CONTACT_DETAILS = [
    { icon: '📍', label: 'Address', value: SITE.address, href: null },
    ...(SITE.phone ? [{ icon: '📞', label: 'Phone', value: SITE.phone, href: `tel:${SITE.phone}` }] : []),
    { icon: '✉️', label: 'Email', value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: '🕐', label: 'Office Hours', value: SITE.hours, href: null },
    { icon: '🏏', label: 'League', value: SITE.league, href: null },
  ]

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      <section style={{
        padding: '140px 24px 80px', textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Get In Touch</div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>Contact Us</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Whether you want to join, sponsor, or just say hello — we'd love to hear from you.
          </p>
        </motion.div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 24px 120px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64, alignItems: 'start' }}>
          {/* Left: contact details */}
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 32 }}>Club Details</h2>
            {CONTACT_DETAILS.map(d => (
              <div key={d.label} style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, width: 32, flexShrink: 0, lineHeight: 1.4 }}>{d.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>{d.label}</div>
                  {d.href
                    ? <a href={d.href} style={{ fontSize: 15, color: SITE.colors.gold, textDecoration: 'none', fontWeight: 500 }}>{d.value}</a>
                    : <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{d.value}</div>
                  }
                </div>
              </div>
            ))}

            {/* Map embed */}
            <div style={{ marginTop: 32, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
              <iframe
                title="TU CC Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.4!2d-0.340!3d51.535!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s27+Orchard+Gate%2C+Greenford%2C+Middlesex+UB6+0QL!5e0!3m2!1sen!2suk!4v1"
                width="100%" height="240" style={{ border: 0, display: 'block' }}
                allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>

          {/* Right: contact form */}
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '60px 40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24 }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
                <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Message Sent!</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 24 }}>
                  Thanks for reaching out. We'll get back to you at <strong style={{ color: SITE.colors.gold }}>{form.email}</strong> within 2–3 working days.
                </p>
                <button onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '11px 28px', cursor: 'pointer', fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '40px 36px' }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 28 }}>Send a Message</h2>

                {[
                  { key: 'name', label: 'Your Name *', type: 'text', placeholder: 'Full name', max: 120 },
                  { key: 'email', label: 'Email Address *', type: 'email', placeholder: 'you@example.com', max: 254 },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>{f.label}</label>
                    <input
                      type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder} maxLength={f.max}
                      style={INPUT_STYLE}
                      onFocus={e => e.target.style.borderColor = SITE.colors.gold}
                      onBlur={e => e.target.style.borderColor = errors[f.key] ? '#f87171' : 'rgba(255,255,255,0.12)'}
                    />
                    {errors[f.key] && <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{errors[f.key]}</div>}
                  </div>
                ))}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>Subject *</label>
                  <select value={form.subject} onChange={e => set('subject', e.target.value)}
                    style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = SITE.colors.gold}
                    onBlur={e => e.target.style.borderColor = errors.subject ? '#f87171' : 'rgba(255,255,255,0.12)'}
                  >
                    <option value="" disabled>Select a subject...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{errors.subject}</div>}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>Message *</label>
                  <textarea value={form.message} onChange={e => set('message', e.target.value)}
                    placeholder="Your message..." maxLength={3000} rows={6}
                    style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 140 }}
                    onFocus={e => e.target.style.borderColor = SITE.colors.gold}
                    onBlur={e => e.target.style.borderColor = errors.message ? '#f87171' : 'rgba(255,255,255,0.12)'}
                  />
                  {errors.message && <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{errors.message}</div>}
                </div>

                {serverError && (
                  <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#f87171' }}>
                    {serverError}
                  </div>
                )}

                <button type="submit" disabled={status === 'loading'} style={{
                  width: '100%', background: status === 'loading' ? 'rgba(233,160,32,0.5)' : SITE.colors.gold,
                  color: '#000', border: 'none', borderRadius: 12, padding: '15px 24px',
                  fontSize: 15, fontWeight: 800, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {status === 'loading' ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <PublicFooter />

      <style>{`
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1.4fr"] { grid-template-columns: 1fr !important; }
        }
        select option { background: #0d1b3e; color: #fff; }
      `}</style>
    </div>
  )
}
