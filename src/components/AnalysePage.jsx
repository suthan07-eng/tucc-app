import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend,
} from 'recharts'
import { supabase } from '../supabase'
import Nav from './Nav'
import { C, FONT, MAX_WIDTH } from '../constants'

const EASE = [0.23, 1, 0.32, 1]

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ label }) {
  const cfg = {
    AVOID:   { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    CONTAIN: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    TARGET:  { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    WATCH:   { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
  }
  const s = cfg[label] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
  const icons = { AVOID:'🚫', CONTAIN:'🛡️', TARGET:'🎯', WATCH:'👁️' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: s.bg, border: `1.5px solid ${s.border}`,
      fontFamily: FONT, fontSize: 11, fontWeight: 800,
      color: s.text, letterSpacing: 0.8, whiteSpace: 'nowrap',
    }}>
      {icons[label] || ''} {label}
    </span>
  )
}

function ScoreRing({ score, size = 52 }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r
  const fill = (Math.min(score, 100) / 100) * circ
  const col = score >= 80 ? '#dc2626' : score >= 60 ? '#d97706' : score >= 40 ? '#2563eb' : '#16a34a'
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={5}
        strokeDasharray={`${fill} ${circ-fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={col} style={{ fontFamily: FONT, fontWeight: 800, fontSize: size * 0.28 }}>
        {Math.round(score)}
      </text>
    </svg>
  )
}

function Avatar({ initials, photoUrl, size = 42, color = C.green }) {
  const [imgError, setImgError] = useState(false)
  if (photoUrl && !imgError) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        overflow: 'hidden', boxShadow: `0 4px 14px ${color}50`,
        border: `2px solid ${color}30`,
      }}>
        <img
          src={photoUrl} alt={initials}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${C.greenDark})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, fontWeight: 800, fontSize: size * 0.32,
      color: '#fff', boxShadow: `0 4px 14px ${color}50`,
    }}>
      {initials}
    </div>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '7px 10px', borderRadius: 9,
      background: highlight ? C.blueBg : '#f8fafc',
      border: `1px solid ${highlight ? '#bfdbfe' : '#e2e8f0'}`,
      minWidth: 50,
    }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: highlight ? C.green : C.dark }}>{value ?? '—'}</span>
      <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: C.gray4, marginTop: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

// ── Player card (batting) ──────────────────────────────────────────────────
function BatCard({ a, bat }) {
  const [open, setOpen] = useState(false)
  const name = a.opponent_players?.player_name || ''
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3, ease:EASE }}
      style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 12px rgba(30,58,138,.06)' }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'16px 16px 12px', display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color: a.rank===1 ? C.gold : C.gray4 }}>#{a.rank}</span>
          <Avatar initials={initials} photoUrl={a.opponent_players?.photo_url} size={40} color={a.tag==='AVOID'?'#dc2626':a.tag==='TARGET'?'#16a34a':C.green}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontFamily:FONT, fontWeight:800, fontSize:15, color:C.dark }}>{name}</span>
            <Badge label={a.tag}/>
          </div>
          {a.flag && <div style={{ fontFamily:FONT, fontSize:11, color:'#92400e', marginBottom:6 }}>{a.flag}</div>}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {bat && <>
              <Stat label="Runs" value={bat.runs} highlight/>
              <Stat label="Avg"  value={bat.avg}/>
              <Stat label="SR"   value={bat.strike_rate}/>
              <Stat label="HS"   value={bat.high_score+(bat.high_score_not_out?'*':'')}/>
              {bat.hundreds>0 && <Stat label="100s" value={bat.hundreds}/>}
              {bat.fifties>0  && <Stat label="50s"  value={bat.fifties}/>}
            </>}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <ScoreRing score={a.composite_score}/>
          <motion.span animate={{ rotate: open?180:0 }} transition={{ duration:0.2 }} style={{ color:C.gray3, fontSize:10 }}>▼</motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="exp" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:EASE }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'0 16px 16px', borderTop:'1px solid #f1f5f9', paddingTop:12 }}>
              {a.summary && <p style={{ fontFamily:FONT, fontSize:13.5, lineHeight:1.7, color:C.gray5, margin:'0 0 12px' }}>{a.summary}</p>}
              {a.strengths?.length > 0 && a.weaknesses?.length > 0 && (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#15803d', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 }}>✅ Strengths</div>
                    {a.strengths.map((s,i) => <div key={i} style={{ fontFamily:FONT, fontSize:12.5, color:C.gray5, marginBottom:4, display:'flex', gap:6 }}><span style={{ color:'#16a34a', flexShrink:0 }}>›</span>{s}</div>)}
                  </div>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#b91c1c', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 }}>⚠️ Weaknesses</div>
                    {a.weaknesses.map((w,i) => <div key={i} style={{ fontFamily:FONT, fontSize:12.5, color:C.gray5, marginBottom:4, display:'flex', gap:6 }}><span style={{ color:'#dc2626', flexShrink:0 }}>›</span>{w}</div>)}
                  </div>
                </div>
              )}
              {a.how_to_play && (
                <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:C.green, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>🏏 How to play them</div>
                  <p style={{ fontFamily:FONT, fontSize:13, color:C.gray5, lineHeight:1.6, margin:0 }}>{a.how_to_play}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Player card (bowling) ─────────────────────────────────────────────────
function BowlCard({ a, bowl }) {
  const [open, setOpen] = useState(false)
  const name = a.opponent_players?.player_name || ''
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3, ease:EASE }}
      style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 12px rgba(30,58,138,.06)' }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'16px 16px 12px', display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color: a.rank===1 ? C.gold : C.gray4 }}>#{a.rank}</span>
          <Avatar initials={initials} photoUrl={a.opponent_players?.photo_url} size={40} color={a.tag==='AVOID'?'#dc2626':a.tag==='TARGET'?'#16a34a':'#7c3aed'}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontFamily:FONT, fontWeight:800, fontSize:15, color:C.dark }}>{name}</span>
            <Badge label={a.tag}/>
          </div>
          {a.flag && <div style={{ fontFamily:FONT, fontSize:11, color:'#92400e', marginBottom:6 }}>{a.flag}</div>}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {bowl && <>
              <Stat label="Wkts" value={bowl.wickets} highlight/>
              <Stat label="Avg"  value={bowl.average}/>
              <Stat label="Econ" value={bowl.economy_rate}/>
              <Stat label="Best" value={bowl.best_bowling}/>
              {bowl.five_wkt_haul>0 && <Stat label="5WH" value={bowl.five_wkt_haul}/>}
            </>}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <ScoreRing score={a.composite_score}/>
          <motion.span animate={{ rotate: open?180:0 }} transition={{ duration:0.2 }} style={{ color:C.gray3, fontSize:10 }}>▼</motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="exp" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:EASE }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'0 16px 16px', borderTop:'1px solid #f1f5f9', paddingTop:12 }}>
              {a.summary && <p style={{ fontFamily:FONT, fontSize:13.5, lineHeight:1.7, color:C.gray5, margin:'0 0 12px' }}>{a.summary}</p>}
              {a.strengths?.length > 0 && a.weaknesses?.length > 0 && (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#15803d', marginBottom:5, textTransform:'uppercase' }}>✅ Strengths</div>
                    {a.strengths.map((s,i) => <div key={i} style={{ fontFamily:FONT, fontSize:12.5, color:C.gray5, marginBottom:4 }}>› {s}</div>)}
                  </div>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#b91c1c', marginBottom:5, textTransform:'uppercase' }}>⚠️ Weaknesses</div>
                    {a.weaknesses.map((w,i) => <div key={i} style={{ fontFamily:FONT, fontSize:12.5, color:C.gray5, marginBottom:4 }}>› {w}</div>)}
                  </div>
                </div>
              )}
              {a.how_to_play && (
                <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:C.green, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>🏏 How to play them</div>
                  <p style={{ fontFamily:FONT, fontSize:13, color:C.gray5, lineHeight:1.6, margin:0 }}>{a.how_to_play}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── All-rounder card ───────────────────────────────────────────────────────
function ArCard({ a, bat, bowl }) {
  const [open, setOpen] = useState(false)
  const name = a.opponent_players?.player_name || ''
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  return (
    <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3, ease:EASE }}
      style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 12px rgba(30,58,138,.06)' }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'16px 16px 12px', display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color: a.rank===1 ? C.gold : C.gray4 }}>#{a.rank}</span>
          <Avatar initials={initials} photoUrl={a.opponent_players?.photo_url} size={40} color="#7c3aed"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontFamily:FONT, fontWeight:800, fontSize:15, color:C.dark }}>{name}</span>
            <Badge label={a.tag}/>
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {bat  && <Stat label="Runs" value={bat.runs}   highlight/>}
            {bat  && <Stat label="Bat SR" value={bat.strike_rate}/>}
            {bowl && <Stat label="Wkts"  value={bowl.wickets} highlight/>}
            {bowl && <Stat label="Econ"  value={bowl.economy_rate}/>}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <ScoreRing score={a.composite_score}/>
          <motion.span animate={{ rotate: open?180:0 }} transition={{ duration:0.2 }} style={{ color:C.gray3, fontSize:10 }}>▼</motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="exp" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:EASE }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'0 16px 16px', borderTop:'1px solid #f1f5f9', paddingTop:12 }}>
              {a.summary && <p style={{ fontFamily:FONT, fontSize:13.5, lineHeight:1.7, color:C.gray5, margin:'0 0 12px' }}>{a.summary}</p>}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {bat && (
                  <div style={{ flex:1, minWidth:130, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:'#15803d', marginBottom:3 }}>BATTING</div>
                    <div style={{ fontFamily:FONT, fontSize:13, color:C.dark }}>{bat.runs} runs · SR {bat.strike_rate} · HS {bat.high_score}{bat.high_score_not_out?'*':''}</div>
                  </div>
                )}
                {bowl && (
                  <div style={{ flex:1, minWidth:130, background:'#fefce8', border:'1px solid #fde68a', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:'#92400e', marginBottom:3 }}>BOWLING</div>
                    <div style={{ fontFamily:FONT, fontSize:13, color:C.dark }}>{bowl.wickets} wkts · Econ {bowl.economy_rate} · Best {bowl.best_bowling}</div>
                  </div>
                )}
                <div style={{ flex:1, minWidth:130, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 12px' }}>
                  <div style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:C.green, marginBottom:3 }}>COMPOSITE</div>
                  <div style={{ fontFamily:FONT, fontSize:13, color:C.dark }}>
                    Bat {Math.round(a.batting_score??0)} · Bowl {Math.round(a.bowling_score??0)} · Overall {Math.round(a.composite_score)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Sortable table ────────────────────────────────────────────────────────
function SortableTable({ rows, cols }) {
  const [sortKey, setSortKey] = useState(cols[1]?.key || cols[0].key)
  const [dir, setDir] = useState('desc')
  const sorted = useMemo(() => [...rows].sort((a,b) => {
    const va=a[sortKey], vb=b[sortKey]
    if (typeof va==='number') return dir==='desc'?vb-va:va-vb
    return dir==='desc'?String(vb).localeCompare(String(va)):String(va).localeCompare(String(vb))
  }), [rows, sortKey, dir])
  const toggle = k => { if (sortKey===k) setDir(d=>d==='desc'?'asc':'desc'); else { setSortKey(k); setDir('desc') } }
  return (
    <div style={{ overflowX:'auto', borderRadius:14, border:'1.5px solid #e2e8f0', background:'#fff' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:FONT }}>
        <thead>
          <tr style={{ background:C.greenDark }}>
            {cols.map(c => (
              <th key={c.key} onClick={() => toggle(c.key)}
                style={{ padding:'10px 12px', textAlign:c.align||'center', fontFamily:FONT, fontSize:11, fontWeight:700, color:sortKey===c.key?C.gold:'rgba(255,255,255,.8)', cursor:'pointer', whiteSpace:'nowrap', userSelect:'none', textTransform:'uppercase', letterSpacing:0.5 }}>
                {c.label}{sortKey===c.key?(dir==='desc'?' ↓':' ↑'):''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} style={{ background:i%2===0?'#fff':'#f8fafc' }}>
              {cols.map(c => (
                <td key={c.key} style={{ padding:'9px 12px', fontSize:13, color:c.highlight?C.green:C.dark, fontWeight:c.highlight?700:500, textAlign:c.align||'center', whiteSpace:'nowrap', borderTop:'1px solid #f1f5f9' }}>
                  {row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Chart tooltip ─────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:'#1e293b', borderRadius:10, padding:'10px 14px', fontFamily:FONT, fontSize:12, color:'#fff', boxShadow:'0 8px 24px rgba(0,0,0,.3)' }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color||'#fff', marginBottom:2 }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:5, background:'#f1f5f9', borderRadius:14, padding:5, overflowX:'auto' }}>
      {tabs.map(t => (
        <motion.button key={t.key} onClick={() => onChange(t.key)} whileTap={{ scale:0.96 }}
          style={{ flex:'1 0 auto', padding:'9px 14px', borderRadius:10, border:'none', cursor:'pointer', background:active===t.key?'#fff':'none', fontFamily:FONT, fontSize:13, fontWeight:active===t.key?800:500, color:active===t.key?C.dark:C.gray4, boxShadow:active===t.key?'0 2px 8px rgba(30,58,138,.1)':'none', transition:'all 150ms ease', whiteSpace:'nowrap' }}>
          {t.label}
        </motion.button>
      ))}
    </div>
  )
}

// ── Generated match plan from DB data ─────────────────────────────────────
function MatchPlan({ batAnalysis, bowlAnalysis, opp }) {
  const avoidBowlers = bowlAnalysis.filter(a => a.tag === 'AVOID').slice(0,2)
  const targetBowlers = bowlAnalysis.filter(a => a.tag === 'TARGET')
  const avoidBatters = batAnalysis.filter(a => a.tag === 'AVOID').slice(0,2)
  const targetBatters = batAnalysis.filter(a => a.tag === 'TARGET')

  const whenBat = [
    avoidBowlers.length > 0
      ? { icon:'🛡️', p:1, text:`Survive ${avoidBowlers.map(a=>a.opponent_players?.player_name?.split(' ')[0]).join(' and ')}'s opening spells. No attacking shots — rotate strike, take singles, no heroes.` }
      : { icon:'🏏', p:1, text:'Identify their strike bowlers from the first over and play them with patience.' },
    targetBowlers.length > 0
      ? { icon:'⚔️', p:2, text:`Attack ${targetBowlers.map(a=>a.opponent_players?.player_name?.split(' ')[0]).join(', ')} when they bowl — their economy rates are exploitable. Look for 10+ per over.` }
      : null,
    { icon:'📊', p:3, text:'Rotate the strike consistently in the first 8 overs to build a platform before accelerating.' },
    { icon:'⚡', p:4, text:'Set a target of at least 150+ to give your bowlers something to defend.' },
  ].filter(Boolean)

  const whenBowl = [
    avoidBatters.length > 0
      ? { icon:'🎯', p:1, text:`Get ${avoidBatters.map(a=>a.opponent_players?.player_name?.split(' ')[0]).join(' and ')} early — they are their most dangerous batters. Post your strike bowler vs them.` }
      : { icon:'🎯', p:1, text:'Identify their best batters from the analysis cards and target their early wickets.' },
    targetBatters.length > 0
      ? { icon:'⚔️', p:2, text:`${targetBatters.map(a=>a.opponent_players?.player_name?.split(' ')[0]).join(', ')} can be exploited — their averages suggest they give their wickets away under pressure.` }
      : null,
    { icon:'🛡️', p:3, text:'Bowl tight lines in the first 6 overs to restrict the powerplay score to under 50.' },
    { icon:'📍', p:4, text:'Change the bowling end every 3-4 overs in the middle to break any settled partnerships.' },
  ].filter(Boolean)

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, color:C.dark, marginBottom:4 }}>When We Bat</div>
        <div style={{ fontFamily:FONT, fontSize:13, color:C.gray4, marginBottom:14 }}>How to approach their bowling attack</div>
        {whenBat.map((p,i) => (
          <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.07, duration:0.3, ease:EASE }}
            style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'14px 16px', display:'flex', gap:14, alignItems:'flex-start', marginBottom:10, boxShadow:'0 1px 6px rgba(30,58,138,.05)' }}>
            <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:C.blueBg, border:'1.5px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{p.icon}</div>
            <div>
              <div style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:C.green, marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 }}>Priority {p.p}</div>
              <div style={{ fontFamily:FONT, fontSize:13.5, color:C.dark, lineHeight:1.6 }}>{p.text}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, color:C.dark, marginBottom:4 }}>When We Bowl</div>
        <div style={{ fontFamily:FONT, fontSize:13, color:C.gray4, marginBottom:14 }}>How to attack their batting lineup</div>
        {whenBowl.map((p,i) => (
          <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.07, duration:0.3, ease:EASE }}
            style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'14px 16px', display:'flex', gap:14, alignItems:'flex-start', marginBottom:10, boxShadow:'0 1px 6px rgba(30,58,138,.05)' }}>
            <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:'#fef3c7', border:'1.5px solid #fcd34d', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{p.icon}</div>
            <div>
              <div style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:'#d97706', marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 }}>Priority {p.p}</div>
              <div style={{ fontFamily:FONT, fontSize:13.5, color:C.dark, lineHeight:1.6 }}>{p.text}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:16, padding:16 }}>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, color:C.dark, marginBottom:12 }}>🏷️ Badge Legend</div>
        {[
          { badge:'AVOID',   desc:'Elite player — do NOT give easy runs/wickets. Maximum respect.' },
          { badge:'CONTAIN', desc:'Good player — keep dot-ball pressure, no freebies but manageable.' },
          { badge:'TARGET',  desc:'Exploitable — actively look to score off or target their dismissal.' },
          { badge:'WATCH',   desc:'Insufficient data — approach with caution, assess in real time.' },
        ].map(({ badge, desc }) => (
          <div key={badge} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:8 }}>
            <Badge label={badge}/>
            <span style={{ fontFamily:FONT, fontSize:13, color:C.gray5, lineHeight:1.5 }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
const TABS = [
  { key:'batting',     label:'🏏 Batting' },
  { key:'bowling',     label:'🎳 Bowling' },
  { key:'allrounders', label:'⚡ All-rounders' },
  { key:'matchplan',   label:'📋 Match Plan' },
]

export default function AnalysePage() {
  const [opponents,    setOpponents]    = useState([])
  const [selectedId,   setSelectedId]   = useState(null)
  const [loadingOpps,  setLoadingOpps]  = useState(true)
  const [loadingData,  setLoadingData]  = useState(false)

  // Opponent data
  const [batStats,   setBatStats]   = useState([])
  const [bowlStats,  setBowlStats]  = useState([])
  const [batAnalysis,  setBatAnalysis]  = useState([])
  const [bowlAnalysis, setBowlAnalysis] = useState([])
  const [arAnalysis,   setArAnalysis]   = useState([])

  const [activeTab, setActiveTab] = useState('batting')

  // 1. Load opponents list
  useEffect(() => {
    supabase.from('opponents').select('id, name, season, match_date')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOpponents(data || [])
        if (data?.length) setSelectedId(data[0].id)
        setLoadingOpps(false)
      })
  }, [])

  // 2. Load all data when opponent changes
  useEffect(() => {
    if (!selectedId) return
    setLoadingData(true)
    Promise.all([
      supabase.from('opponent_batting_stats').select('*, opponent_players(player_name, photo_url)').eq('opponent_id', selectedId),
      supabase.from('opponent_bowling_stats').select('*, opponent_players(player_name, photo_url)').eq('opponent_id', selectedId),
      supabase.from('opponent_analysis').select('*, opponent_players(player_name, photo_url)')
        .eq('opponent_id', selectedId).eq('category', 'batting').order('rank'),
      supabase.from('opponent_analysis').select('*, opponent_players(player_name, photo_url)')
        .eq('opponent_id', selectedId).eq('category', 'bowling').order('rank'),
      supabase.from('opponent_analysis').select('*, opponent_players(player_name, photo_url)')
        .eq('opponent_id', selectedId).eq('category', 'allrounder').order('rank'),
    ]).then(([b, bw, ba, boa, ara]) => {
      setBatStats(b.data || [])
      setBowlStats(bw.data || [])
      setBatAnalysis(ba.data?.map(a => ({ ...a, strengths: parseJson(a.strengths), weaknesses: parseJson(a.weaknesses) })) || [])
      setBowlAnalysis(boa.data?.map(a => ({ ...a, strengths: parseJson(a.strengths), weaknesses: parseJson(a.weaknesses) })) || [])
      setArAnalysis(ara.data?.map(a => ({ ...a, strengths: parseJson(a.strengths), weaknesses: parseJson(a.weaknesses) })) || [])
      setLoadingData(false)
    })
  }, [selectedId])

  function parseJson(v) {
    if (Array.isArray(v)) return v
    try { return JSON.parse(v) } catch { return [] }
  }

  // Maps: player_id → stats
  const batMap  = useMemo(() => Object.fromEntries(batStats.map(r=>[r.player_id, r])), [batStats])
  const bowlMap = useMemo(() => Object.fromEntries(bowlStats.map(r=>[r.player_id, r])), [bowlStats])

  // Chart data
  const battingChart = useMemo(() =>
    [...batStats].sort((a,b)=>b.runs-a.runs).slice(0,8).map(r=>({
      name: r.opponent_players?.player_name?.split(' ')[0] || '?',
      runs: r.runs, sr: r.strike_rate,
    })), [batStats])

  const bowlingChart = useMemo(() =>
    [...bowlStats].filter(r=>r.overs>=10).sort((a,b)=>b.wickets-a.wickets).slice(0,8).map(r=>({
      name: r.opponent_players?.player_name?.split(' ')[0] || '?',
      wickets: r.wickets, econ: r.economy_rate,
    })), [bowlStats])

  const selectedOpp = opponents.find(o => o.id === selectedId)

  const BAT_COLS = [
    { key:'name',    label:'Player',  align:'left', render:(_,r)=>r.opponent_players?.player_name||'—' },
    { key:'matches', label:'M' },
    { key:'innings', label:'Inn' },
    { key:'runs',    label:'Runs',   highlight:true },
    { key:'avg',     label:'Avg' },
    { key:'strike_rate', label:'SR' },
    { key:'high_score',  label:'HS', render:(v,r)=>v+(r.high_score_not_out?'*':'') },
    { key:'hundreds',    label:'100s' },
    { key:'fifties',     label:'50s' },
  ]

  const BOWL_COLS = [
    { key:'name',         label:'Player',  align:'left', render:(_,r)=>r.opponent_players?.player_name||'—' },
    { key:'matches',      label:'M' },
    { key:'overs',        label:'Overs' },
    { key:'wickets',      label:'Wkts',   highlight:true },
    { key:'average',      label:'Avg' },
    { key:'economy_rate', label:'Econ' },
    { key:'strike_rate',  label:'SR' },
    { key:'best_bowling', label:'Best' },
  ]

  // Augment table rows with player name at top level for sorting
  const batTableRows = useMemo(() =>
    batStats.map(r=>({ ...r, name: r.opponent_players?.player_name||'' })), [batStats])
  const bowlTableRows = useMemo(() =>
    bowlStats.map(r=>({ ...r, name: r.opponent_players?.player_name||'' })), [bowlStats])

  if (loadingOpps) return (
    <>
      <Nav/>
      <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'60px 16px', textAlign:'center', fontFamily:FONT, color:C.gray4 }}>
        Loading opponents…
      </div>
    </>
  )

  if (opponents.length === 0) return (
    <>
      <Nav/>
      <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'60px 16px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, color:C.dark, marginBottom:8 }}>No opponents yet</div>
        <div style={{ fontFamily:FONT, fontSize:14, color:C.gray4 }}>
          Ask the admin to add an opponent in the Admin Panel → 🔍 Analyse tab.
        </div>
      </div>
    </>
  )

  return (
    <>
      <Nav/>
      <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'0 16px 80px', fontFamily:FONT }}>

        {/* ── Hero ── */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4, ease:EASE }}
          style={{ margin:'24px 0 20px', background:`linear-gradient(135deg, ${C.greenDark} 0%, #1d4ed8 100%)`, borderRadius:20, padding:'22px 20px', position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(30,58,138,.25)' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(233,160,32,.15)', border:'1px solid rgba(233,160,32,.35)', borderRadius:20, padding:'4px 12px', marginBottom:10 }}>
            <span style={{ fontSize:10, fontWeight:800, color:'#e9a020', letterSpacing:1, textTransform:'uppercase' }}>🔍 Opposition Scouting</span>
          </div>
          <h1 style={{ fontFamily:FONT, fontSize:20, fontWeight:900, color:'#fff', margin:'0 0 14px', letterSpacing:-0.3, lineHeight:1.2 }}>
            {selectedOpp ? `${selectedOpp.name} · ${selectedOpp.season}` : 'Opposition Analysis'}
          </h1>

          {/* Opponent selector */}
          <div style={{ marginBottom:4 }}>
            <label style={{ fontFamily:FONT, fontSize:11, color:'rgba(255,255,255,.6)', fontWeight:600, display:'block', marginBottom:6 }}>
              SELECT OPPONENT
            </label>
            <select
              value={selectedId||''}
              onChange={e => setSelectedId(e.target.value)}
              style={{
                fontFamily:FONT, fontSize:13, fontWeight:700, color:C.dark,
                background:'rgba(255,255,255,.95)', border:'none', borderRadius:10,
                padding:'9px 14px', cursor:'pointer', maxWidth:320, width:'100%',
                outline:'none',
              }}
            >
              {opponents.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name} — {o.season}{o.match_date ? ` (${new Date(o.match_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})})` : ''}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* ── Loading skeleton ── */}
        {loadingData && (
          <div style={{ textAlign:'center', padding:'40px 0', fontFamily:FONT, color:C.gray4 }}>
            ⏳ Loading scouting data…
          </div>
        )}

        {!loadingData && (
          <>
            {/* Quick stats row */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
              {[
                { v: batStats.length,    l:'Batters analysed' },
                { v: bowlStats.filter(r=>r.overs>=10).length, l:'Bowlers (10+ overs)' },
                { v: bowlStats.reduce((s,r)=>s+r.five_wkt_haul,0), l:'Five-wicket hauls' },
                { v: batStats.reduce((s,r)=>s+r.hundreds,0), l:'Centuries' },
              ].map(({ v, l }) => (
                <div key={l} style={{ flex:'1 1 110px', background:'#fff', border:`1.5px solid ${C.gray2}`, borderRadius:14, padding:'12px 14px', boxShadow:'0 1px 6px rgba(30,58,138,.05)' }}>
                  <div style={{ fontFamily:FONT, fontWeight:900, fontSize:20, color:C.green }}>{v}</div>
                  <div style={{ fontFamily:FONT, fontSize:10, color:C.gray4, marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ marginBottom:20 }}>
              <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab}/>
            </div>

            <AnimatePresence mode="wait">

              {/* ── BATTING ── */}
              {activeTab==='batting' && (
                <motion.div key="batting" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.22, ease:EASE }}>
                  {battingChart.length > 0 && (
                    <div style={{ background:'#fff', borderRadius:16, padding:'16px 14px', marginBottom:18, border:'1.5px solid #e2e8f0', boxShadow:'0 2px 10px rgba(30,58,138,.05)' }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, color:C.dark, marginBottom:12 }}>📊 Top Run-scorers</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={battingChart} margin={{ top:0, right:0, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                          <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:11, fill:C.gray4 }}/>
                          <YAxis tick={{ fontFamily:FONT, fontSize:11, fill:C.gray4 }}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Bar dataKey="runs" fill={C.green} radius={[5,5,0,0]} name="Runs"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, color:C.dark, marginBottom:4 }}>Top {batAnalysis.length} Batters — Watch List</div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:C.gray4, marginBottom:14 }}>Weighted composite: 40% runs, 25% SR, 15% HS, 10% milestones, 10% matches</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                    {batAnalysis.map(a => <BatCard key={a.id} a={a} bat={batMap[a.player_id]}/>)}
                  </div>

                  {batTableRows.length > 0 && (
                    <>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:16, color:C.dark, marginBottom:4 }}>Full Batting Statistics</div>
                      <div style={{ fontFamily:FONT, fontSize:12, color:C.gray4, marginBottom:10 }}>Click any column header to sort</div>
                      <SortableTable rows={batTableRows} cols={BAT_COLS}/>
                    </>
                  )}
                  <Methodology type="batting"/>
                </motion.div>
              )}

              {/* ── BOWLING ── */}
              {activeTab==='bowling' && (
                <motion.div key="bowling" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.22, ease:EASE }}>
                  {bowlingChart.length > 0 && (
                    <div style={{ background:'#fff', borderRadius:16, padding:'16px 14px', marginBottom:18, border:'1.5px solid #e2e8f0', boxShadow:'0 2px 10px rgba(30,58,138,.05)' }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, color:C.dark, marginBottom:12 }}>🎳 Top Wicket-takers (min. 10 overs)</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={bowlingChart} margin={{ top:0, right:0, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                          <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:11, fill:C.gray4 }}/>
                          <YAxis tick={{ fontFamily:FONT, fontSize:11, fill:C.gray4 }}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Bar dataKey="wickets" fill="#7c3aed" radius={[5,5,0,0]} name="Wickets"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, color:C.dark, marginBottom:4 }}>Top {bowlAnalysis.length} Bowlers — Threat Assessment</div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:C.gray4, marginBottom:14 }}>Weighted composite: 40% wickets, 30% economy (inv.), 20% average (inv.), 10% SR (inv.)</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                    {bowlAnalysis.map(a => <BowlCard key={a.id} a={a} bowl={bowlMap[a.player_id]}/>)}
                  </div>

                  {bowlTableRows.length > 0 && (
                    <>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:16, color:C.dark, marginBottom:4 }}>Full Bowling Statistics</div>
                      <div style={{ fontFamily:FONT, fontSize:12, color:C.gray4, marginBottom:10 }}>Click any column header to sort</div>
                      <SortableTable rows={bowlTableRows} cols={BOWL_COLS}/>
                    </>
                  )}
                  <Methodology type="bowling"/>
                </motion.div>
              )}

              {/* ── ALL-ROUNDERS ── */}
              {activeTab==='allrounders' && (
                <motion.div key="ar" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.22, ease:EASE }}>
                  {arAnalysis.length > 1 && (
                    <div style={{ background:'#fff', borderRadius:16, padding:'16px 14px', marginBottom:18, border:'1.5px solid #e2e8f0', boxShadow:'0 2px 10px rgba(30,58,138,.05)' }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, color:C.dark, marginBottom:4 }}>⚡ Bat vs Bowl Contribution</div>
                      <div style={{ fontFamily:FONT, fontSize:11, color:C.gray4, marginBottom:12 }}>Normalised 0–100 scale</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={arAnalysis.map(a=>({ name:a.opponent_players?.player_name?.split(' ')[0]||'?', bat:Math.round(a.batting_score||0), bowl:Math.round(a.bowling_score||0) }))}
                          margin={{ top:0, right:0, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                          <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:11, fill:C.gray4 }}/>
                          <YAxis domain={[0,110]} tick={{ fontFamily:FONT, fontSize:11, fill:C.gray4 }}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Legend iconType="circle" wrapperStyle={{ fontFamily:FONT, fontSize:12 }}/>
                          <Bar dataKey="bat"  fill={C.green}  radius={[4,4,0,0]} name="Bat Score"/>
                          <Bar dataKey="bowl" fill="#7c3aed" radius={[4,4,0,0]} name="Bowl Score"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, color:C.dark, marginBottom:4 }}>Top {arAnalysis.length} All-rounders</div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:C.gray4, marginBottom:14 }}>Composite = 50% bat score + 50% bowl score. Min 3 games + 10 overs.</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                    {arAnalysis.map(a => <ArCard key={a.id} a={a} bat={batMap[a.player_id]} bowl={bowlMap[a.player_id]}/>)}
                  </div>
                  <Methodology type="allrounder"/>
                </motion.div>
              )}

              {/* ── MATCH PLAN ── */}
              {activeTab==='matchplan' && (
                <motion.div key="plan" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.22, ease:EASE }}>
                  <MatchPlan batAnalysis={batAnalysis} bowlAnalysis={bowlAnalysis} opp={selectedOpp}/>
                </motion.div>
              )}

            </AnimatePresence>
          </>
        )}
      </div>
    </>
  )
}

function Methodology({ type }) {
  const notes = {
    batting:    'Batting composite (0–100): 40% runs, 25% SR, 15% HS, 10% milestones (100s×20 + 50s×10), 10% matches. All normalised within the squad.',
    bowling:    'Bowling composite (0–100): 40% wickets, 30% economy (inverted), 20% average (inverted), 10% SR (inverted). Normalised within squad. Min. 10 overs.',
    allrounder: 'All-rounder composite: 50% batting score (normalised) + 50% bowling score (normalised). Min. 3 matches and 10 overs.',
  }
  return (
    <div style={{ marginTop:18, padding:'12px 16px', background:'#f8fafc', border:`1px solid ${C.gray2}`, borderRadius:12, borderLeft:`3px solid ${C.green}` }}>
      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:11, color:C.green, marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 }}>📐 Methodology</div>
      <p style={{ fontFamily:FONT, fontSize:12, color:C.gray5, lineHeight:1.6, margin:0 }}>{notes[type]}</p>
    </div>
  )
}
