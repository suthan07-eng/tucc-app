import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase'
import { FONT } from '../../constants'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useToast } from '../Toast'
import { recomputeAll } from '../../lib/scorecards'
import { extractScorecardText } from '../../lib/pdfText'
import { parseScorecard } from '../../lib/scorecardParser'

const AC = { green:'#2563eb', greenDark:'#1e3a8a', greenBg:'#eff6ff', gold:'#e9a020', white:'#ffffff', gray1:'#f1f5f9', gray2:'#e2e8f0', gray3:'#94a3b8', gray4:'#64748b', gray5:'#334155', dark:'#0f172a', red:'#dc2626', redBg:'#fee2e2', ok:'#16a34a', okBg:'#dcfce7' }

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const oppShort = (o) => (o || '').replace(/ - (1st XI|Knights|[AB])$/,'').replace('Sports & Social Club CC','').trim()

export default function TabScorecards() {
  const toast = useToast()
  const fileRef = useRef(null)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  useEffect(() => { loadList() }, [])

  async function loadList() {
    setLoading(true)
    const { data } = await supabase.from('match_results')
      .select('id,match_date,opponent,result,our_score,our_wickets,their_score,their_wickets')
      .eq('season', '2026').order('match_date', { ascending: false })
    setList(data || [])
    setLoading(false)
  }

  function pickFile() { fileRef.current?.click() }

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.pdf$/i.test(file.name)) { toast('Please choose a PDF scorecard', 'error'); return }
    setParsing(true); setPreview(null); setFileName(file.name)
    try {
      const buf = await file.arrayBuffer()
      const text = await extractScorecardText(buf)
      const parsed = parseScorecard(text)
      if (!parsed.match_date) throw new Error('Could not read the match date — is this a play-cricket scorecard PDF?')
      setPreview(parsed)
      toast('Scorecard read — review below, then save ✓')
    } catch (err) {
      toast(err.message || 'Failed to read scorecard', 'error')
    }
    setParsing(false)
  }

  async function save() {
    if (!preview) return
    setSaving(true)
    try {
      const { error } = await supabase.from('match_results')
        .upsert({ ...preview, source_file: fileName }, { onConflict: 'match_date,opponent,season' })
      if (error) throw error
      const r = await recomputeAll()
      toast(`Saved & updated ${r.players} players across ${r.matches} matches ✓`)
      setPreview(null); setFileName('')
      await loadList()
    } catch (err) {
      toast(err.message || 'Save failed', 'error')
    }
    setSaving(false)
  }

  async function del(id) {
    setConfirmDel(null)
    const { error } = await supabase.from('match_results').delete().eq('id', id)
    if (error) { toast(error.message || 'Delete failed', 'error'); return }
    await recomputeAll()
    toast('Scorecard removed & stats updated')
    await loadList()
  }

  const bat = preview ? (preview.our_batting || []).filter(b => b.did_bat).sort((a,b)=>b.runs-a.runs) : []
  const bowl = preview ? (preview.our_bowling || []).slice().sort((a,b)=>b.wickets-a.wickets) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Upload banner */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: 14, padding: '18px', color: '#fff' }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15 }}>🏏 Upload match scorecard</div>
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 4, lineHeight: 1.5 }}>
          Upload a play-cricket scorecard PDF. It auto-fills the result, batting, bowling & fielding, and updates every stats page, the players page, top performers and Player of the Week.
        </div>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={onFile} style={{ display: 'none' }} />
        <button onClick={pickFile} disabled={parsing}
          style={{ marginTop: 14, background: parsing ? 'rgba(255,255,255,.15)' : AC.gold, color: parsing ? 'rgba(255,255,255,.5)' : '#1e3a8a', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: parsing ? 'wait' : 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 13 }}>
          {parsing ? '⏳ Reading PDF…' : '📄 Choose scorecard PDF'}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: AC.dark }}>vs {oppShort(preview.opponent)}</div>
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: AC.gray4, marginTop: 2 }}>
                {fmtDate(preview.match_date)} · <strong style={{ color: preview.result === 'won' ? AC.ok : (preview.result === 'lost' ? AC.red : AC.gray4) }}>{preview.result === 'won' ? 'Tamil United won' : preview.result === 'lost' ? 'Tamil United lost' : preview.result}</strong>
                {preview.our_score != null ? ` · TUCC ${preview.our_score}-${preview.our_wickets} vs ${preview.their_score}-${preview.their_wickets}` : ''}
              </div>
            </div>
            <span style={{ background: AC.okBg, color: AC.ok, fontFamily: FONT, fontWeight: 800, fontSize: 11, padding: '4px 10px', borderRadius: 8 }}>Parsed ✓</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 12, color: AC.gray4, textTransform: 'uppercase', marginBottom: 6 }}>🏏 Batting ({bat.length})</div>
              {bat.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${AC.gray1}`, fontFamily: FONT, fontSize: 12.5 }}>
                  <span style={{ color: AC.dark, fontWeight: 600 }}>{b.name}</span>
                  <span style={{ color: AC.gray5 }}>{b.runs}{b.not_out ? '*' : ''} ({b.balls})</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 12, color: AC.gray4, textTransform: 'uppercase', marginBottom: 6 }}>⚡ Bowling ({bowl.length})</div>
              {bowl.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${AC.gray1}`, fontFamily: FONT, fontSize: 12.5 }}>
                  <span style={{ color: AC.dark, fontWeight: 600 }}>{b.name}</span>
                  <span style={{ color: AC.gray5 }}>{b.wickets}/{b.runs} ({b.overs})</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Button size="sm" variant="ghost" onClick={() => { setPreview(null); setFileName('') }} style={{ flex: 1 }}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving} style={{ flex: 2 }}>
              {saving ? 'Saving & updating stats…' : '💾 Save scorecard & update all stats'}
            </Button>
          </div>
        </Card>
      )}

      {/* Existing scorecards */}
      <Card>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: AC.dark, marginBottom: 12 }}>
          Saved scorecards {loading ? '' : `(${list.length})`}
        </div>
        {loading ? <div style={{ color: AC.gray3, fontSize: 13 }}>Loading…</div>
        : list.length === 0 ? <div style={{ color: AC.gray3, fontSize: 13, fontFamily: FONT }}>No scorecards yet — upload one above.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1px solid ${AC.gray2}`, background: AC.white }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: AC.dark }}>vs {oppShort(m.opponent)}</div>
                  <div style={{ fontFamily: FONT, fontSize: 11.5, color: AC.gray3, marginTop: 2 }}>
                    {fmtDate(m.match_date)}{m.our_score != null ? ` · ${m.our_score}-${m.our_wickets} v ${m.their_score}-${m.their_wickets}` : ''}
                  </div>
                </div>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 11, color: m.result === 'won' ? AC.ok : (m.result === 'lost' ? AC.red : AC.gray4), textTransform: 'uppercase' }}>{m.result}</span>
                {confirmDel === m.id ? (
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    <button onClick={() => del(m.id)} style={{ background: AC.red, color: '#fff', border: 'none', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Delete</button>
                    <button onClick={() => setConfirmDel(null)} style={{ background: AC.gray2, color: AC.gray5, border: 'none', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✕</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDel(m.id)} title="Delete scorecard" style={{ background: AC.white, border: `1.5px solid ${AC.gray2}`, color: AC.gray4, borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>🗑</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
