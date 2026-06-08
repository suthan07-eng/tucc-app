import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase'
import { sendMessageToPlayer, sendBulkMessage } from '../../emailService'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Field, { Input, Textarea, Select } from '../ui/Field'
import Avatar from '../ui/Avatar'
import { Skeleton } from '../ui/Loader'
import { useToast } from '../Toast'

const SENDER_OPTIONS = [
  'Suthan — Team Manager',
  'Roshan — Captain',
  'Tamil United CC',
]
const LS_KEY = 'tucc_sender_name'
const DEFAULT_SENDER = 'Suthan — Team Manager'

// ── BTCL league contacts (always shown as extra options in Send To) ────────────
const BTCL_CONTACTS = [
  { id: 'btcl_secretary', label: '🏛️ BTCL — Secretary',  email: 'secretary@btcluk.com' },
  { id: 'btcl_info',      label: '📋 BTCL — Info',        email: 'Info@btcluk.com' },
  { id: 'btcl_scorecard', label: '📊 BTCL — Scorecard',   email: 'Scorecard@btcluk.com' },
]

function initSenderOption() {
  const saved = localStorage.getItem(LS_KEY) || DEFAULT_SENDER
  return SENDER_OPTIONS.includes(saved) ? saved : 'custom'
}

function initCustomSender() {
  const saved = localStorage.getItem(LS_KEY) || DEFAULT_SENDER
  return SENDER_OPTIONS.includes(saved) ? '' : saved
}

export default function TabMessages() {
  const toast = useToast()
  const [players, setPlayers] = useState([])
  const [match, setMatch] = useState(null)
  const [history, setHistory] = useState([])
  const [recipient, setRecipient] = useState('all')
  const [ccInput, setCcInput] = useState('')        // free-text CC field
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [senderOption, setSenderOption] = useState(initSenderOption)
  const [customSender, setCustomSender] = useState(initCustomSender)

  // Parse CC field into array of valid emails
  const ccEmails = ccInput.split(/[\s,;]+/).map(e => e.trim()).filter(e => e.includes('@'))

  const senderName = senderOption === 'custom' ? customSender.trim() : senderOption

  useEffect(() => {
    if (senderName) localStorage.setItem(LS_KEY, senderName)
  }, [senderName])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: ps }, { data: m }, { data: msgs }] = await Promise.all([
      supabase.from('players').select('*').order('name'),
      supabase.from('matches').select('*').eq('is_active', true).single(),
      supabase.from('messages').select('*').order('sent_at', { ascending: false }).limit(60),
    ])
    setPlayers(ps || [])
    setMatch(m)
    setHistory(msgs || [])
    setLoadingHistory(false)
  }

  async function handleSend() {
    if (!text.trim()) { toast('Please enter a message', 'error'); return }
    setSending(true)

    // Check if recipient is a BTCL contact
    const btclContact = BTCL_CONTACTS.find(c => c.id === recipient)

    if (btclContact) {
      // Send directly to BTCL email (no DB record needed)
      try {
        const { sendEmail: _ignored, ...rest } = {}
        // Use sendMessageToPlayer-style but with BTCL as recipient
        const btclPlayer = { id: btclContact.id, name: btclContact.label.replace(/^[^\s]+\s/, ''), email: btclContact.email }
        await sendMessageToPlayer(btclPlayer, text.trim(), match, senderName, ccEmails)
        toast(`Message sent to ${btclContact.label} 📤`)
        setText('')
      } catch (err) {
        toast(`Email failed: ${err.message || 'Unknown error'}`, 'error')
      }
      setSending(false)
      return
    }

    const target = recipient === 'all'
      ? players
      : players.filter((p) => p.id === recipient)

    if (!target.length) { toast('No players found', 'error'); setSending(false); return }

    // Persist to DB first
    const inserts = target.map((p) => ({
      player_id: p.id,
      player_name: p.name,
      text: text.trim(),
      sent_at: new Date().toISOString(),
    }))
    await supabase.from('messages').insert(inserts)

    // Send emails — show specific error if it fails
    try {
      if (target.length === 1) {
        await sendMessageToPlayer(target[0], text.trim(), match, senderName, ccEmails)
      } else {
        await sendBulkMessage(target, text.trim(), match, senderName, ccEmails)
      }
      toast(
        recipient === 'all'
          ? `Message sent to all ${players.length} players 📤`
          : `Message sent to ${target[0].name} 📤`
      )
    } catch (err) {
      toast(
        `Message saved, but email failed: ${err.message || 'Unknown error'}. Check your Resend API key and sender domain.`,
        'error'
      )
    }

    setText('')
    loadData()
    setSending(false)
  }

  async function deleteMessage(msgId) {
    const { error } = await supabase.from('messages').delete().eq('id', msgId)
    if (error) {
      toast(error.message || 'Delete failed', 'error')
    } else {
      setHistory((prev) => prev.filter((m) => m.id !== msgId))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Compose */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 16 }}>
          Send Message
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Send To">
            <Select value={recipient} onChange={(e) => setRecipient(e.target.value)}>
              <optgroup label="── Club Players ──">
                <option value="all">📢 All Players ({players.length})</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
              <optgroup label="── BTCL League ──">
                {BTCL_CONTACTS.map(c => (
                  <option key={c.id} value={c.id}>{c.label} — {c.email}</option>
                ))}
              </optgroup>
            </Select>
          </Field>

          {/* CC field */}
          <Field label="CC (optional)">
            <Input
              type="text"
              placeholder="e.g. captain@tucc.club, manager@tucc.club"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
            />
            {ccEmails.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {ccEmails.map(em => (
                  <span key={em} style={{ fontSize: 11, background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 20, padding: '2px 10px', color: C.green, fontFamily: FONT, fontWeight: 600 }}>
                    {em}
                  </span>
                ))}
              </div>
            )}
          </Field>
          <Field label="From">
            <Select
              value={senderOption}
              onChange={(e) => {
                setSenderOption(e.target.value)
                if (e.target.value !== 'custom') setCustomSender('')
              }}
            >
              {SENDER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="custom">Custom…</option>
            </Select>
          </Field>
          {senderOption === 'custom' && (
            <Field label="Custom sender name">
              <Input
                placeholder="e.g. Priya — Assistant Manager"
                value={customSender}
                onChange={(e) => setCustomSender(e.target.value)}
                autoFocus
              />
            </Field>
          )}
          <Field label="Message">
            <Textarea
              placeholder="Hi team, match confirmed for Sunday. See you at 9am sharp!"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ minHeight: 110 }}
            />
          </Field>
          <Button size="full" onClick={handleSend} disabled={sending || !text.trim()}>
            {sending ? 'Sending…' : '📤 Send Message'}
          </Button>
          <div style={{ fontSize: 11, color: C.gray3, fontFamily: FONT, lineHeight: 1.5 }}>
            Emails are sent via Resend. With <code>onboarding@resend.dev</code> as sender, delivery is restricted to the Resend account owner's email only. Add a verified domain in Resend for full delivery.
          </div>
        </div>
      </Card>

      {/* History */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 14 }}>
          Message History
        </div>
        {loadingHistory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <Skeleton width={28} height={28} borderRadius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width={100} height={12} />
                  <Skeleton width="80%" height={11} />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div style={{ color: C.gray3, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
            No messages sent yet
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {history.map((m) => (
              <motion.div
                key={m.id}
                variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3 } } }}
                style={{ padding: '10px 0', borderBottom: `1px solid ${C.gray1}`, position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Avatar name={m.player_name} size={28} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>{m.player_name}</span>
                  <span style={{ fontSize: 11, color: C.gray3, marginLeft: 'auto' }}>
                    {new Date(m.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {/* Delete × button */}
                  <button
                    onClick={() => deleteMessage(m.id)}
                    title="Delete message"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      color: C.gray3,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                      padding: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redBg }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.gray3; e.currentTarget.style.background = 'transparent' }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ fontSize: 13, color: C.gray5, paddingLeft: 36, lineHeight: 1.5 }}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </div>
  )
}
