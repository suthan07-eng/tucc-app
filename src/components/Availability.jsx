import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { sendAvailabilityConfirmation } from '../emailService'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import Button from './ui/Button'
import Card from './ui/Card'
import Field, { Input, Textarea, Select } from './ui/Field'
import Avatar from './ui/Avatar'
import { useToast } from './Toast'
import { useAuth } from '../context/AuthContext'

const EASE_OUT = [0.23, 1, 0.32, 1]

const GLASS_CARD = {
  background: 'linear-gradient(150deg, rgba(37,99,235,0.24), rgba(124,58,237,0.22) 60%, rgba(20,184,166,0.14))',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)',
  borderRadius: 22,
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
}
const GRADIENT_TEXT = {
  color: '#fff',
  backgroundImage: 'linear-gradient(92deg,#60a5fa,#c084fc 60%,#f472b6)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}
const EYEBROW = {
  display: 'inline-block',
  letterSpacing: 2,
  fontSize: 10.5,
  textTransform: 'uppercase',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: 999,
  padding: '4px 10px',
}

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
}
const staggerList = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
}
const staggerItem = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT } },
}
const stepVariants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.28, ease: EASE_OUT } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.16 } },
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function matchLabel(m) {
  if (!m) return ''
  const date = m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'
  return `vs ${m.opponent || 'TBC'} — ${date}${m.is_active ? ' (Active)' : ''}`
}

function fmtMsgDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return (
    dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ' · ' +
    dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

export default function Availability() {
  const nav = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()

  const [allMatches, setAllMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [nextFixture, setNextFixture] = useState(null)   // auto from BTCL

  const [step, setStep] = useState(1)
  const [nameOrEmail, setNameOrEmail] = useState(searchParams.get('email') || '')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [player, setPlayer] = useState(null)
  const [existing, setExisting] = useState(null)

  const [available, setAvailable] = useState(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [playerMessages, setPlayerMessages] = useState([])

  useEffect(() => {
    async function init() {
      const { data: ms } = await supabase
        .from('matches').select('*').order('date', { ascending: false })
      const matches = ms || []
      setAllMatches(matches)
      const active = matches.find((m) => m.is_active) || matches[0] || null
      setSelectedMatch(active)
      setSelectedMatchId(active?.id || null)

      // Auto-fetch next fixture from BTCL
      try {
        const r = await fetch('/api/fixtures')
        const d = await r.json()
        const OUR = ['Tamil United','TUCC','Dollishill Tamil United','DTU']
        const isOurs = n => OUR.some(t => (n||'').toLowerCase().includes(t.toLowerCase()))
        const parseD = str => { const p = (str||'').match(/(\d{1,2})\s+(\w+)\s+(\d{4})/); return p ? new Date(`${p[2]} ${p[1]}, ${p[3]}`) : null }
        const tomorrow = new Date(); tomorrow.setHours(0,0,0,0); tomorrow.setDate(tomorrow.getDate()+1)
        const next = (d.fixtures||[]).filter(f => (isOurs(f.team1)||isOurs(f.team2)) && parseD(f.date) >= tomorrow)
          .sort((a,b) => parseD(a.date) - parseD(b.date))[0] || null
        setNextFixture(next)
      } catch { /* silent */ }

      // If user is logged in, auto-find their player record by email or name — skip Step 1
      if (user) {
        const userEmail = user.email || ''
        const userName  = profile?.display_name || user?.user_metadata?.full_name || ''

        // Try to find by email first, then by name
        let { data: candidates } = await supabase
          .from('players')
          .select('*')
          .or(`email.ilike.${userEmail},name.ilike.%${userName}%`)

        const matched = (candidates || []).find(p =>
          p.email?.toLowerCase() === userEmail.toLowerCase() ||
          p.name?.toLowerCase().replace(/\s+/g,' ').trim() === userName.toLowerCase().replace(/\s+/g,' ').trim()
        ) || (candidates || [])[0] || null

        if (matched) {
          setPlayer(matched)
          if (active) {
            const { data: prev } = await supabase
              .from('availability').select('*')
              .eq('match_id', active.id).eq('player_id', matched.id).maybeSingle()
            setExisting(prev || null)
            if (prev) { setAvailable(prev.available); setReason(prev.reason || '') }
          }
          setStep(2)
        }
        // Not found — auto-create a players row from their auth data
        else if (userEmail || userName) {
          const phone = user?.user_metadata?.phone || profile?.phone || ''
          const { data: newRow, error: insErr } = await supabase
            .from('players')
            .insert({ name: userName || userEmail, email: userEmail, phone })
            .select()
            .single()
          if (newRow && !insErr) {
            setPlayer(newRow)
          } else {
            // Fallback: lightweight object (insert may fail due to RLS — player can still try)
            setPlayer({ id: null, name: userName || userEmail, email: userEmail, phone, role: '' })
          }
          setStep(2)
        }
      }
    }
    init()
  }, [user])

  async function fetchMessages(playerId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('player_id', playerId)
      .order('sent_at', { ascending: false })
    setPlayerMessages(data || [])
  }

  // Poll for new messages every 30s once a player is identified
  useEffect(() => {
    if (!player?.id) return
    fetchMessages(player.id)
    const interval = setInterval(() => fetchMessages(player.id), 30000)
    return () => clearInterval(interval)
  }, [player?.id])

  function handleMatchChange(e) {
    const id = e.target.value
    const m = allMatches.find((x) => x.id === id) || null
    setSelectedMatchId(id)
    setSelectedMatch(m)
    // Reset existing response when match changes
    setExisting(null)
    setAvailable(null)
    setReason('')
    setMessage('')
    // If player already found, reload their existing response for new match
    if (player && m) {
      supabase
        .from('availability')
        .select('*')
        .eq('match_id', m.id)
        .eq('player_id', player.id)
        .maybeSingle()
        .then(({ data }) => {
          setExisting(data || null)
          if (data) { setAvailable(data.available); setReason(data.reason || '') }
        })
    }
  }

  async function findAndLoad(nameEmail, phone, activeMatch) {
    const trimmedNE    = (nameEmail || '').trim()
    const trimmedPhone = (phone || '').replace(/\D/g, '').slice(-4)
    if (!trimmedNE || !trimmedPhone) return

    setSearching(true)
    setNotFound(false)
    setErrors({})

    // Step 1: find by name or email
    const { data: candidates } = await supabase
      .from('players')
      .select('*')
      .or(`name.ilike.%${trimmedNE}%,email.ilike.%${trimmedNE}%`)

    setSearching(false)

    if (!candidates || candidates.length === 0) {
      setNotFound(true)
      return
    }

    // Step 2: verify phone — last 4 digits must match
    const matched = candidates.find(
      (p) => p.phone && p.phone.replace(/\D/g, '').endsWith(trimmedPhone)
    )

    if (!matched) {
      setErrors({ phone: "Details don't match. Please check your phone number." })
      return
    }

    setPlayer(matched)

    const m = activeMatch ?? selectedMatch
    if (m) {
      const { data: prev } = await supabase
        .from('availability')
        .select('*')
        .eq('match_id', m.id)
        .eq('player_id', matched.id)
        .maybeSingle()
      setExisting(prev || null)
      if (prev) { setAvailable(prev.available); setReason(prev.reason || '') }
    }

    setStep(2)
  }

  async function handleSubmit() {
    const errs = {}
    if (available === null) errs.available = 'Please select your availability'
    if (!available && !reason.trim()) errs.reason = 'Please provide a reason'
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!selectedMatch) { toast('No match selected', 'error'); return }

    setSubmitting(true)

    const { error } = await supabase.from('availability').upsert(
      {
        match_id: selectedMatch.id,
        player_id: player.id,
        available,
        reason: available ? (message.trim() || null) : reason.trim(),
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'match_id,player_id' }
    )

    if (error) {
      toast(error.message || 'Failed to submit — please try again.', 'error')
      setSubmitting(false)
      return
    }

    sendAvailabilityConfirmation(player, selectedMatch, available, reason, message)
      .catch((e) => console.warn('Email error:', e))

    nav('/success')
  }

  function resetSearch() {
    setStep(1)
    setPlayer(null)
    setExisting(null)
    setAvailable(null)
    setReason('')
    setMessage('')
    setErrors({})
    setPlayerMessages([])
    setPhoneDigits('')
    setNotFound(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />
      {/* Header */}
      <div style={{ background: 'transparent', padding: '28px 16px' }}>
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: MAX_WIDTH, margin: '0 auto', width: '100%' }}
        >
          <motion.button
            variants={fadeUp}
            onClick={() => nav('/app')}
            style={{ color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 12 }}
          >
            ← Home
          </motion.button>
          <motion.div variants={fadeUp} style={{ ...EYEBROW, marginBottom: 12 }}>
            Player Portal
          </motion.div>
          <motion.h1 variants={fadeUp} style={{ ...GRADIENT_TEXT, fontSize: 'clamp(24px, 6vw, 30px)', fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            Submit Availability
          </motion.h1>
          {selectedMatch && (
            <motion.p variants={fadeUp} style={{ color: 'rgba(255,255,255,.72)', fontSize: 13, marginTop: 8 }}>
              vs {selectedMatch.opponent || 'TBC'} · {fmtDate(selectedMatch.date)} · {selectedMatch.venue || 'Venue TBC'}
            </motion.p>
          )}
        </motion.div>
      </div>

      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '24px 16px 40px', width: '100%' }}>

        {/* ── Match selector (shown if multiple matches) ── */}
        {allMatches.length > 1 && (
          <Card style={{ ...GLASS_CARD, marginBottom: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              Select Match
            </div>
            <Select value={selectedMatchId || ''} onChange={handleMatchChange}>
              {allMatches.map((m) => (
                <option key={m.id} value={m.id}>{matchLabel(m)}</option>
              ))}
            </Select>
          </Card>
        )}

        {/* ── STEP 1: Find player (two-field verification) ── */}
        <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
          <Card style={GLASS_CARD}>
            <div style={{ ...GRADIENT_TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              Find Your Profile
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginBottom: 20 }}>
              Enter your name and phone to continue
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field
                label="Your Name or Email"
                error={notFound ? 'No player found with that name or email. Please register first.' : undefined}
              >
                <Input
                  placeholder="Suthan Sivashanmugam"
                  value={nameOrEmail}
                  onChange={(e) => { setNameOrEmail(e.target.value); setNotFound(false); setErrors({}) }}
                  onKeyDown={(e) => e.key === 'Enter' && findAndLoad(nameOrEmail, phoneDigits)}
                  autoFocus
                  autoComplete="name"
                />
              </Field>

              <Field
                label="Last 4 digits of your phone number"
                error={errors.phone}
              >
                <Input
                  type="tel"
                  placeholder="e.g. 4762"
                  value={phoneDigits}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setPhoneDigits(digits)
                    setErrors((err) => ({ ...err, phone: undefined }))
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && findAndLoad(nameOrEmail, phoneDigits)}
                  error={errors.phone}
                  maxLength={4}
                  inputMode="numeric"
                  autoComplete="tel"
                  style={{ letterSpacing: 4, fontSize: 18 }}
                />
              </Field>
            </div>

            <Button
              size="full"
              style={{ marginTop: 20 }}
              onClick={() => findAndLoad(nameOrEmail, phoneDigits)}
              disabled={searching || !nameOrEmail.trim() || phoneDigits.length < 4}
            >
              {searching ? 'Checking...' : 'Continue →'}
            </Button>

            {notFound && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 14, textAlign: 'center' }}>
                New player?{' '}
                <Link to="/register" style={{ color: '#c084fc', fontWeight: 700, textDecoration: 'none' }}>
                  Register here →
                </Link>
              </p>
            )}
          </Card>
          </motion.div>
        )}

        {/* ── STEP 2: Submit ── */}
        {step === 2 && player && (
          <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
          <>
            {/* Player card */}
            <Card style={{ ...GLASS_CARD, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Avatar name={player.name} size={48} />
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>{player.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{player.role} · {player.phone}</div>
                </div>
              </div>
              {existing && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(192,132,252,0.16)', border: '1px solid rgba(192,132,252,0.32)', borderRadius: 12, fontSize: 13, color: '#e9d5ff', fontWeight: 500 }}>
                  ✏️ You already responded — updating your answer below.
                </div>
              )}
            </Card>

            {/* Availability selection */}
            <Card style={GLASS_CARD}>
              <div style={{ ...GRADIENT_TEXT, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                Are you available?
              </div>
              {selectedMatch && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>
                  vs {selectedMatch.opponent} · {fmtDate(selectedMatch.date)} · {selectedMatch.time}
                </div>
              )}

              {errors.available && (
                <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{errors.available}</div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { value: true,  emoji: '✅', label: "Yes, I'm in", activeColor: C.ok,  activeBg: C.okBg,  activeBorder: '#86efac' },
                  { value: false, emoji: '❌', label: "Can't make it", activeColor: C.red, activeBg: C.redBg, activeBorder: '#fca5a5' },
                ].map(({ value, emoji, label, activeColor, activeBg, activeBorder }) => {
                  const isActive = available === value
                  return (
                    <motion.button
                      key={label}
                      onClick={() => { setAvailable(value); setErrors({}) }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
                      style={{
                        padding: '22px 16px',
                        borderRadius: 16,
                        border: `2px solid ${isActive ? activeBorder : 'rgba(255,255,255,0.10)'}`,
                        background: isActive ? activeBg : 'rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'border-color 180ms cubic-bezier(0.23,1,0.32,1), background 180ms cubic-bezier(0.23,1,0.32,1), box-shadow 180ms ease',
                        boxShadow: isActive ? `0 0 0 3px ${activeBorder}40` : 'none',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <span style={{ fontSize: 34, lineHeight: 1 }}>{emoji}</span>
                      <span style={{
                        fontFamily: FONT, fontWeight: 700, fontSize: 15,
                        color: isActive ? activeColor : 'rgba(255,255,255,0.78)',
                        transition: 'color 180ms ease',
                      }}>{label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="availability-check"
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 18, height: 18, borderRadius: '50%',
                            background: activeColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: '#fff', fontWeight: 800,
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', duration: 0.3, bounce: 0.3 }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {available === false && (
                <Field label="Reason" required error={errors.reason} style={{ marginBottom: 16 }}>
                  <Textarea
                    placeholder="E.g. work, family, injury..."
                    value={reason}
                    onChange={(e) => { setReason(e.target.value); setErrors({}) }}
                    error={errors.reason}
                  />
                </Field>
              )}

              {/* FIX 2: Updated label */}
              {available === true && (
                <Field label="Message to Captain and Manager (optional)" style={{ marginBottom: 16 }}>
                  <Textarea
                    placeholder="Any notes — batting position, fitness, early arrival..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </Field>
              )}

              <Button size="full" onClick={handleSubmit} disabled={submitting || available === null}>
                {submitting ? 'Submitting...' : existing ? 'Update Response' : 'Submit Response'}
              </Button>

              <button
                onClick={resetSearch}
                style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 14, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13 }}
              >
                ← Wrong person? Search again
              </button>
            </Card>

            {/* ── Messages from Captain & Manager ── */}
            {playerMessages.length > 0 && (
              <div
                style={{
                  ...GLASS_CARD,
                  marginTop: 16,
                  padding: 20,
                }}
              >
                <div style={{ ...GRADIENT_TEXT, fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
                  📬 Messages from Captain &amp; Manager
                </div>
                <motion.div
                  variants={staggerList}
                  initial="hidden"
                  animate="visible"
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {playerMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      variants={staggerItem}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: 16,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                        {fmtMsgDate(msg.sent_at)}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}
