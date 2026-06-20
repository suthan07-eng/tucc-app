import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabase'
import { C, FONT, FORMATS } from '../../constants'
const AC = { green:'#2563eb', greenDark:'#1e3a8a', greenLight:'#1d4ed8', greenBg:'#eff6ff', gold:'#e9a020', white:'#ffffff', bg:'#eef2ff', gray1:'#f1f5f9', gray2:'#e2e8f0', gray3:'#94a3b8', gray4:'#64748b', gray5:'#334155', dark:'#0f172a', red:'#dc2626', redBg:'#fee2e2', ok:'#16a34a', okBg:'#dcfce7', blue:'#2563eb', blueBg:'#eff6ff', shadow:'rgba(30,58,138,0.07)', shadowMd:'rgba(30,58,138,0.11)', shadowLg:'rgba(30,58,138,0.18)' } // admin keeps original light theme
import Card from '../ui/Card'
import Button from '../ui/Button'
import Field, { Input, Textarea, Select } from '../ui/Field'
import { useToast } from '../Toast'

const EMPTY = {
  date: '', time: '', venue: '', address: '',
  opponent: '', format: 'T20', notes: '', deadline: '', home_message: '',
}

const OUR_NAMES = ['Tamil United', 'TUCC', 'Dollishill Tamil United', 'DTU']
const isOurs = (n = '') => OUR_NAMES.some(t => n.toLowerCase().includes(t.toLowerCase()))

export default function TabMatch() {
  const toast = useToast()
  const [allMatches, setAllMatches] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)

  useEffect(() => { loadMatches() }, [])

  async function loadMatches(keepId) {
    const { data: ms } = await supabase
      .from('matches').select('*').order('date', { ascending: false })
    const matches = ms || []
    setAllMatches(matches)
    const useId = keepId ?? matches.find((m) => m.is_active)?.id ?? matches[0]?.id ?? null
    setSelectedId(useId)
    const selected = matches.find((m) => m.id === useId)
    setForm(selected ? { ...EMPTY, ...selected } : EMPTY)
    setLoading(false)
  }

  function selectMatch(id) {
    setSelectedId(id)
    const m = allMatches.find((x) => x.id === id)
    setForm(m ? { ...EMPTY, ...m } : EMPTY)
    setPendingDelete(false)
  }

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function saveMatch() {
    if (!selectedId) return
    setSaving(true)
    const { date, time, venue, address, opponent, format, notes, deadline, home_message } = form
    const { error } = await supabase
      .from('matches')
      .update({ date, time, venue, address, opponent, format, notes, deadline, home_message })
      .eq('id', selectedId)
    if (error) toast(error.message || 'Save failed', 'error')
    else { toast('Match saved! ✓'); loadMatches(selectedId) }
    setSaving(false)
  }

  async function createNewMatch() {
    setCreating(true)
    // Deactivate all current active matches
    await supabase.from('matches').update({ is_active: false }).eq('is_active', true)
    const { data, error } = await supabase
      .from('matches')
      .insert({ ...EMPTY, is_active: true, date: new Date().toISOString().slice(0, 10) })
      .select()
      .single()
    if (error) {
      toast(error.message || 'Create failed', 'error')
    } else {
      toast('New match created!')
      await loadMatches(data.id)
    }
    setCreating(false)
  }

  async function importFromBTCL() {
    setImporting(true)
    try {
      const r = await fetch('/api/fixtures')
      const data = await r.json()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const fixtures = (data.fixtures || []).filter(f => {
        if (!isOurs(f.team1) && !isOurs(f.team2)) return false
        const parts = (f.date || '').match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
        if (!parts) return false
        const dt = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`)
        return dt >= today
      }).sort((a, b) => {
        const parse = d => { const p = (d||'').match(/(\d{1,2})\s+(\w+)\s+(\d{4})/); return p ? new Date(`${p[2]} ${p[1]}, ${p[3]}`) : new Date(9999,0) }
        return parse(a.date) - parse(b.date)
      })
      if (!fixtures.length) { toast('No upcoming fixtures found on BTCL', 'error'); setImporting(false); return }
      const fx = fixtures[0]
      // Parse date → YYYY-MM-DD
      const parts = (fx.date || '').match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
      const isoDate = parts ? new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`).toISOString().slice(0, 10) : ''
      const opponent = isOurs(fx.team1) ? fx.team2 : fx.team1
      const venue = fx.venue || ''
      const address = fx.address || ''
      const time = fx.time || ''
      // Deactivate all, then create/update active match
      await supabase.from('matches').update({ is_active: false }).eq('is_active', true)
      const { data: newMatch, error } = await supabase
        .from('matches')
        .insert({ date: isoDate, time, venue, address, opponent, format: 'ODI', is_active: true })
        .select().single()
      if (error) { toast(error.message || 'Import failed', 'error'); setImporting(false); return }
      toast(`✅ Imported: vs ${opponent} on ${isoDate}`)
      await loadMatches(newMatch.id)
    } catch (e) {
      toast('Failed to fetch BTCL fixtures', 'error')
    }
    setImporting(false)
  }

  async function setActive() {
    if (!selectedId) return
    await supabase.from('matches').update({ is_active: false }).eq('is_active', true)
    await supabase.from('matches').update({ is_active: true }).eq('id', selectedId)
    toast('Match set as active!')
    loadMatches(selectedId)
  }

  async function deleteMatch() {
    setDeleting(true)
    const wasActive = allMatches.find((x) => x.id === selectedId)?.is_active ?? false

    // 1. Delete all availability records for this match
    await supabase.from('availability').delete().eq('match_id', selectedId)

    // 2. Delete the match itself — use .select() so a silent RLS block is detectable
    const { data: deleted, error } = await supabase
      .from('matches')
      .delete()
      .eq('id', selectedId)
      .select()
    if (error) {
      toast(error.message || 'Delete failed', 'error')
      setDeleting(false)
      setPendingDelete(false)
      return
    }
    if (!deleted || deleted.length === 0) {
      toast('Delete was blocked by the database — no rows removed', 'error')
      setDeleting(false)
      setPendingDelete(false)
      return
    }

    // 3. Re-fetch remaining matches fresh from Supabase
    const { data: ms } = await supabase
      .from('matches')
      .select('*')
      .order('date', { ascending: false })
    const remaining = ms || []

    // 4. If deleted match was active and others remain, auto-activate the most recent
    if (wasActive && remaining.length > 0) {
      await supabase.from('matches').update({ is_active: true }).eq('id', remaining[0].id)
      remaining[0] = { ...remaining[0], is_active: true }
    }

    // 5. Update UI state
    setAllMatches(remaining)
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id)
      setForm({ ...EMPTY, ...remaining[0] })
    } else {
      setSelectedId(null)
      setForm(EMPTY)
    }

    toast('Match deleted successfully')
    setDeleting(false)
    setPendingDelete(false)
  }

  if (loading) {
    return <div style={{ color: AC.gray3, fontFamily: FONT, fontSize: 14, padding: '20px 0' }}>Loading…</div>
  }

  const selectedMatch = allMatches.find((m) => m.id === selectedId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Import from BTCL banner */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: '#fff' }}>📡 Auto-import from BTCL</div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>Fetches the next upcoming fixture and sets it as active</div>
        </div>
        <button
          onClick={importFromBTCL}
          disabled={importing}
          style={{ background: importing ? 'rgba(255,255,255,.1)' : AC.gold, color: importing ? 'rgba(255,255,255,.4)' : '#1e3a8a', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: importing ? 'not-allowed' : 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', transition: 'all .2s' }}
        >
          {importing ? '⏳ Importing…' : '📡 Import Next Match'}
        </button>
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, color: AC.dark, fontSize: 15 }}>
          {allMatches.length} match{allMatches.length !== 1 ? 'es' : ''}
        </div>
        <Button size="sm" variant="subtle" onClick={createNewMatch} disabled={creating}>
          {creating ? 'Creating…' : '+ New Match'}
        </Button>
      </div>

      {/* Match list selector */}
      {allMatches.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {allMatches.map((m) => (
            <motion.button
              key={m.id}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
              onClick={() => selectMatch(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                border: `2px solid ${m.id === selectedId ? AC.green : AC.gray2}`,
                background: m.id === selectedId ? AC.greenBg : AC.white,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: m.id === selectedId ? AC.green : AC.dark }}>
                  vs {m.opponent || 'TBC'}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: AC.gray3, marginTop: 2 }}>
                  {m.date || 'Date TBD'} · {m.venue || 'Venue TBD'}
                </div>
              </div>
              {m.is_active && (
                <span style={{ background: AC.greenBg, color: AC.green, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                  Active
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Edit form */}
      {selectedMatch ? (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: AC.dark }}>
              Edit Match
            </div>
            {!selectedMatch.is_active && (
              <button
                onClick={setActive}
                style={{ background: AC.greenBg, color: AC.green, border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 12 }}
              >
                ⭐ Set as Active
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Opponent">
                <Input placeholder="Plymouth CC" value={form.opponent} onChange={set('opponent')} />
              </Field>
              <Field label="Format">
                <Select value={form.format} onChange={set('format')}>
                  {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Date">
                <Input type="date" value={form.date} onChange={set('date')} />
              </Field>
              <Field label="Time">
                <Input type="time" value={form.time} onChange={set('time')} />
              </Field>
            </div>
            <Field label="Venue">
              <Input placeholder="Central Park Cricket Ground" value={form.venue} onChange={set('venue')} />
            </Field>
            <Field label="Address">
              <Input placeholder="123 Main St, Plymouth, PL1 1AA" value={form.address} onChange={set('address')} />
            </Field>
            <Field label="Response Deadline" hint="E.g. Saturday 9pm">
              <Input placeholder="Saturday 9pm" value={form.deadline} onChange={set('deadline')} />
            </Field>
            <Field label="Notes">
              <Textarea placeholder="Any special notes for the match…" value={form.notes} onChange={set('notes')} />
            </Field>
            <Field label="Home Page Message" hint="Shown as a greeting on the public home page">
              <Textarea placeholder="e.g. Good luck lads! Let's bring it home this Sunday 💪" value={form.home_message} onChange={set('home_message')} />
            </Field>

            <Button size="full" onClick={saveMatch} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Match'}
            </Button>

            {/* Delete match */}
            <div style={{ borderTop: `1px solid ${AC.gray2}`, paddingTop: 16, marginTop: 4 }}>
              {!pendingDelete ? (
                <>
                  <Button
                    size="full"
                    variant="danger"
                    onClick={() => setPendingDelete(true)}
                    disabled={deleting}
                  >
                    🗑 Delete Match &amp; All Availability Data
                  </Button>
                  <div style={{ fontSize: 11, color: AC.gray3, textAlign: 'center', marginTop: 6, fontFamily: FONT }}>
                    This cannot be undone — all availability responses will be removed.
                  </div>
                </>
              ) : (
                <div
                  style={{
                    background: AC.redBg,
                    border: `1.5px solid #fecaca`,
                    borderRadius: 12,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ color: AC.red, fontWeight: 700, fontSize: 14, marginBottom: 6, fontFamily: FONT }}>
                    ⚠️ Are you sure you want to delete this match?
                  </div>
                  <div style={{ color: AC.gray5, fontSize: 13, marginBottom: 16, fontFamily: FONT, lineHeight: 1.5 }}>
                    Delete <strong>vs {selectedMatch?.opponent || 'TBC'}</strong>
                    {selectedMatch?.date ? ` on ${selectedMatch.date}` : ''} and all availability data?
                    This cannot be undone.
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(false)}
                      disabled={deleting}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={deleteMatch}
                      disabled={deleting}
                      style={{ flex: 1 }}
                    >
                      {deleting ? 'Deleting…' : 'Yes, Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '24px 0', color: AC.gray3, fontFamily: FONT, fontSize: 14 }}>
            No matches yet. Click <strong>"+ New Match"</strong> to create one.
          </div>
        </Card>
      )}
    </div>
  )
}
