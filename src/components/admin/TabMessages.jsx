import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabase'
import { sendMessageToPlayer, sendBulkMessage } from '../../emailService'
import { C, FONT } from '../../constants'
const AC = { green:'#2563eb', greenDark:'#1e3a8a', greenLight:'#1d4ed8', greenBg:'#eff6ff', gold:'#e9a020', white:'#ffffff', bg:'#eef2ff', gray1:'#f1f5f9', gray2:'#e2e8f0', gray3:'#94a3b8', gray4:'#64748b', gray5:'#334155', dark:'#0f172a', red:'#dc2626', redBg:'#fee2e2', ok:'#16a34a', okBg:'#dcfce7', blue:'#2563eb', blueBg:'#eff6ff', shadow:'rgba(30,58,138,0.07)', shadowMd:'rgba(30,58,138,0.11)', shadowLg:'rgba(30,58,138,0.18)' } // admin keeps original light theme
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
const ADMIN_EMAIL = 'suthan07@gmail.com'

// ── BTCL league contacts ──────────────────────────────────────────────────────
const BTCL_CONTACTS = [
  { id: 'btcl_secretary', label: '🏛️ BTCL — Secretary',  email: 'secretary@btcluk.com' },
  { id: 'btcl_info',      label: '📋 BTCL — Info',        email: 'Info@btcluk.com' },
  { id: 'btcl_scorecard', label: '📊 BTCL — Scorecard',   email: 'Scorecard@btcluk.com' },
]

// Accepted attachment types
const ACCEPT_TYPES = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv'
const MAX_FILE_SIZE_MB = 10
const MAX_TOTAL_MB = 20

function initSenderOption() {
  const saved = localStorage.getItem(LS_KEY) || DEFAULT_SENDER
  return SENDER_OPTIONS.includes(saved) ? saved : 'custom'
}
function initCustomSender() {
  const saved = localStorage.getItem(LS_KEY) || DEFAULT_SENDER
  return SENDER_OPTIONS.includes(saved) ? '' : saved
}

function fmtFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type) {
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.includes('word') || type.includes('doc')) return '📝'
  if (type.includes('sheet') || type.includes('xls')) return '📊'
  return '📎'
}

// Convert File to base64 content string (Resend format)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // result is "data:<mime>;base64,<content>" — strip prefix
      const base64 = reader.result.split(',')[1]
      resolve({ filename: file.name, content: base64, type: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function TabMessages() {
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [players,      setPlayers]      = useState([])
  const [match,        setMatch]        = useState(null)
  const [history,      setHistory]      = useState([])
  const [recipient,    setRecipient]    = useState('all')
  const [ccInput,      setCcInput]      = useState('')
  const [text,         setText]         = useState('')
  const [attachments,  setAttachments]  = useState([])   // [{ filename, content, type, size, name }]
  const [sending,      setSending]      = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [senderOption, setSenderOption] = useState(initSenderOption)
  const [customSender, setCustomSender] = useState(initCustomSender)
  const [expandedMsg,  setExpandedMsg]  = useState(null)

  const ccEmails  = ccInput.split(/[\s,;]+/).map(e => e.trim()).filter(e => e.includes('@'))
  const senderName = senderOption === 'custom' ? customSender.trim() : senderOption

  const totalAttachmentMB = attachments.reduce((s, a) => s + (a.sizeBytes || 0), 0) / (1024 * 1024)

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

  // ── File picker ──────────────────────────────────────────────────
  async function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    e.target.value = ''   // reset so same file can be re-added if removed

    const tooBig = files.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024)
    if (tooBig.length) {
      toast(`${tooBig.map(f => f.name).join(', ')} exceeds ${MAX_FILE_SIZE_MB} MB limit`, 'error')
      return
    }

    // Check total
    const newTotal = (totalAttachmentMB * 1024 * 1024 + files.reduce((s, f) => s + f.size, 0)) / (1024 * 1024)
    if (newTotal > MAX_TOTAL_MB) {
      toast(`Total attachments would exceed ${MAX_TOTAL_MB} MB`, 'error')
      return
    }

    // Convert all to base64
    const converted = await Promise.all(files.map(async f => {
      const { filename, content, type } = await fileToBase64(f)
      return { filename, content, type, sizeBytes: f.size }
    }))

    setAttachments(prev => {
      const names = new Set(prev.map(a => a.filename))
      return [...prev, ...converted.filter(a => !names.has(a.filename))]
    })
  }

  function removeAttachment(filename) {
    setAttachments(prev => prev.filter(a => a.filename !== filename))
  }

  // ── Send ─────────────────────────────────────────────────────────
  async function handleSend() {
    if (!text.trim()) { toast('Please enter a message', 'error'); return }
    setSending(true)

    // Prepare attachments for Resend (just filename + content)
    const resendAttachments = attachments.map(({ filename, content }) => ({ filename, content }))

    const btclContact = BTCL_CONTACTS.find(c => c.id === recipient)
    if (btclContact) {
      try {
        const btclPlayer = { id: btclContact.id, name: btclContact.label.replace(/^[^\s]+\s/, ''), email: btclContact.email }
        await sendMessageToPlayer(btclPlayer, text.trim(), match, senderName, ccEmails, resendAttachments)
        toast(`Message sent to ${btclContact.label} 📤`)
        setText('')
        setAttachments([])
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

    // Persist to DB
    const inserts = target.map((p) => ({
      player_id: p.id,
      player_name: p.name,
      text: text.trim(),
      sent_at: new Date().toISOString(),
    }))
    await supabase.from('messages').insert(inserts)

    try {
      if (target.length === 1) {
        await sendMessageToPlayer(target[0], text.trim(), match, senderName, ccEmails, resendAttachments)
      } else {
        await sendBulkMessage(target, text.trim(), match, senderName, ccEmails, resendAttachments)
      }
      toast(
        recipient === 'all'
          ? `Message sent to all ${players.length} players 📤`
          : `Message sent to ${target[0].name} 📤`
      )
    } catch (err) {
      toast(
        `Message saved, but email failed: ${err.message || 'Unknown error'}. Check your Resend API key.`,
        'error'
      )
    }

    setText('')
    setAttachments([])
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

  // Gmail search link for player replies
  const gmailRepliesUrl = `https://mail.google.com/mail/u/0/#search/Tamil+United+CC+OR+TUCC+in%3Ainbox`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Replies banner ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        border: '1.5px solid #bfdbfe',
        borderRadius: 14,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 28 }}>📬</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 3 }}>
            Checking Player Replies
          </div>
          <div style={{ fontSize: 12, color: '#3b82f6', lineHeight: 1.5 }}>
            When players reply to your messages, their reply goes directly to <strong>{ADMIN_EMAIL}</strong>.
            Click the button to open your Gmail inbox and check for replies.
          </div>
        </div>
        <a
          href={gmailRepliesUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '9px 16px',
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          📥 Open Gmail Inbox
        </a>
      </div>

      {/* ── Compose ────────────────────────────────────────────── */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: AC.dark, marginBottom: 16 }}>
          ✉️ Send Message
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Send To */}
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

          {/* CC */}
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
                  <span key={em} style={{ fontSize: 11, background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 20, padding: '2px 10px', color: AC.green, fontFamily: FONT, fontWeight: 600 }}>
                    {em}
                  </span>
                ))}
              </div>
            )}
          </Field>

          {/* From */}
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

          {/* Message */}
          <Field label="Message">
            <Textarea
              placeholder="Hi team, match confirmed for Sunday. See you at 9am sharp!"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ minHeight: 110 }}
            />
          </Field>

          {/* ── Attachments ─────────────────────────────────────── */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: AC.gray4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .4 }}>
              Attachments
            </div>

            {/* Attached files list */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  {attachments.map(a => (
                    <motion.div
                      key={a.filename}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: '#f8faff',
                        border: '1.5px solid #dbeafe',
                        borderRadius: 10,
                        padding: '8px 12px',
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{fileIcon(a.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: AC.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.filename}
                        </div>
                        <div style={{ fontSize: 11, color: AC.gray3 }}>{fmtFileSize(a.sizeBytes)}</div>
                      </div>
                      <button
                        onClick={() => removeAttachment(a.filename)}
                        style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', color: AC.gray3, cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                        onMouseLeave={e => { e.currentTarget.style.color = AC.gray3; e.currentTarget.style.background = 'transparent' }}
                        title="Remove attachment"
                      >×</button>
                    </motion.div>
                  ))}
                  {/* Total size indicator */}
                  <div style={{ fontSize: 11, color: totalAttachmentMB > 15 ? '#dc2626' : AC.gray3, textAlign: 'right' }}>
                    Total: {totalAttachmentMB.toFixed(1)} MB / {MAX_TOTAL_MB} MB
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_TYPES}
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: attachments.length ? '#eff6ff' : AC.gray1,
                border: `1.5px dashed ${attachments.length ? '#93c5fd' : AC.gray2}`,
                borderRadius: 10,
                padding: '10px 16px',
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 700,
                color: attachments.length ? '#2563eb' : AC.gray4,
                width: '100%',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.color = '#2563eb' }}
              onMouseLeave={e => { e.currentTarget.style.background = attachments.length ? '#eff6ff' : AC.gray1; e.currentTarget.style.borderColor = attachments.length ? '#93c5fd' : AC.gray2; e.currentTarget.style.color = attachments.length ? '#2563eb' : AC.gray4 }}
            >
              <span style={{ fontSize: 16 }}>📎</span>
              {attachments.length === 0
                ? 'Attach files or images…'
                : `Add more attachments (${attachments.length} attached)`}
            </button>
            <div style={{ fontSize: 11, color: AC.gray3, marginTop: 5, lineHeight: 1.4 }}>
              Images, PDF, Word, Excel · Max {MAX_FILE_SIZE_MB} MB per file · {MAX_TOTAL_MB} MB total
            </div>
          </div>

          <Button size="full" onClick={handleSend} disabled={sending || !text.trim()}>
            {sending ? 'Sending…' : `📤 Send Message${attachments.length ? ` + ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}` : ''}`}
          </Button>

          <div style={{ fontSize: 11, color: AC.gray3, fontFamily: FONT, lineHeight: 1.5 }}>
            Emails sent via Resend · replies go to <strong>{ADMIN_EMAIL}</strong> · with <code>onboarding@resend.dev</code> as sender, delivery is restricted to the Resend account owner only — add a verified domain in Resend for full delivery.
          </div>
        </div>
      </Card>

      {/* ── Message History ──────────────────────────────────────── */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: AC.dark, marginBottom: 14 }}>
          📋 Message History
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
          <div style={{ color: AC.gray3, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
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
                style={{ padding: '10px 0', borderBottom: `1px solid ${AC.gray1}`, position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Avatar name={m.player_name} size={28} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: AC.dark }}>{m.player_name}</span>
                  <span style={{ fontSize: 11, color: AC.gray3, marginLeft: 'auto' }}>
                    {new Date(m.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {/* Expand / collapse */}
                  <button
                    onClick={() => setExpandedMsg(expandedMsg === m.id ? null : m.id)}
                    title={expandedMsg === m.id ? 'Collapse' : 'Expand'}
                    style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', color: AC.gray3, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                  >
                    {expandedMsg === m.id ? '▲' : '▼'}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteMessage(m.id)}
                    title="Delete message"
                    style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', color: AC.gray3, cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = AC.gray3; e.currentTarget.style.background = 'transparent' }}
                  >×</button>
                </div>
                <AnimatePresence>
                  {(expandedMsg === m.id || m.text.length < 100) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ fontSize: 13, color: AC.gray5, paddingLeft: 36, lineHeight: 1.6 }}
                    >
                      {m.text}
                    </motion.div>
                  )}
                  {expandedMsg !== m.id && m.text.length >= 100 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: AC.gray3, paddingLeft: 36, fontStyle: 'italic', cursor: 'pointer' }}
                      onClick={() => setExpandedMsg(m.id)}
                    >
                      {m.text.slice(0, 80)}… <span style={{ color: '#2563eb', fontStyle: 'normal', fontWeight: 600 }}>Read more</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </div>
  )
}
