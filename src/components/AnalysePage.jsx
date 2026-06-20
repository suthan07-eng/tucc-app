import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend, ReferenceLine,
} from 'recharts'
import { supabase } from '../supabase'
import Nav from './Nav'
import { C, FONT, MAX_WIDTH } from '../constants'

const EASE = [0.23, 1, 0.32, 1]

// ── Bold Gradient theme tokens ───────────────────────────────────────────────
const GLASS = {
  background: 'linear-gradient(150deg, rgba(37,99,235,0.34), rgba(124,58,237,0.30) 60%, rgba(20,184,166,0.20))',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)',
  borderRadius: 22,
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
}
const NESTED = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 16,
}
const TITLE_GRAD = {
  color: '#fff',
  backgroundImage: 'linear-gradient(92deg,#60a5fa,#c084fc 60%,#f472b6)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}
const T_HEAD = '#fff'
const T_BODY = 'rgba(255,255,255,0.72)'
const T_MUTE = 'rgba(255,255,255,0.5)'
const eyebrowStyle = {
  display: 'inline-block', textTransform: 'uppercase', letterSpacing: 2,
  fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)',
  border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)',
  borderRadius: 20, padding: '3px 10px', fontFamily: FONT,
}
const BTN_GRAD = {
  background: 'linear-gradient(180deg,#818cf8,#6d28d9)', color: '#fff',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: '0 12px 30px -8px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.4)',
  borderRadius: 12, padding: '12px 22px', fontWeight: 700,
}

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ label }) {
  const cfg = {
    AVOID:   { bg: 'rgba(239,68,68,0.16)', text: '#b91c1c', border: '#fca5a5' },
    CONTAIN: { bg: 'rgba(233,160,32,0.16)', text: '#92400e', border: '#fcd34d' },
    TARGET:  { bg: 'rgba(34,197,94,0.16)', text: '#15803d', border: '#86efac' },
    WATCH:   { bg: 'rgba(168,85,247,0.14)', text: '#6d28d9', border: '#c4b5fd' },
  }
  const s = cfg[label] || { bg: 'rgba(255,255,255,0.05)', text: '#475569', border: '#cbd5e1' }
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
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={5}
        strokeDasharray={`${fill} ${circ-fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" style={{ fontFamily: FONT, fontWeight: 800, fontSize: size * 0.28 }}>
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
      padding: '7px 10px', borderRadius: 11,
      background: highlight ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${highlight ? 'rgba(192,132,252,0.5)' : 'rgba(255,255,255,0.10)'}`,
      minWidth: 50,
    }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: highlight ? '#c084fc' : '#fff' }}>{value ?? '—'}</span>
      <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: T_MUTE, marginTop: 1, whiteSpace: 'nowrap' }}>{label}</span>
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
      whileHover={{ y:-3 }}
      style={{ ...GLASS, borderRadius:18, overflow:'hidden' }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'16px 16px 12px', display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color: a.rank===1 ? C.gold : C.gray4 }}>#{a.rank}</span>
          <Avatar initials={initials} photoUrl={a.opponent_players?.photo_url} size={40} color={a.tag==='AVOID'?'#dc2626':a.tag==='TARGET'?'#16a34a':C.green}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontFamily:FONT, fontWeight:800, fontSize:15, color:'#fff' }}>{name}</span>
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
          <motion.span animate={{ rotate: open?180:0 }} transition={{ duration:0.2 }} style={{ color:'rgba(255,255,255,0.6)', fontSize:10 }}>▼</motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="exp" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:EASE }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.10)', paddingTop:12 }}>
              {a.summary && <p style={{ fontFamily:FONT, fontSize:13.5, lineHeight:1.7, color:T_BODY, margin:'0 0 12px' }}>{a.summary}</p>}
              {a.strengths?.length > 0 && a.weaknesses?.length > 0 && (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#15803d', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 }}>✅ Strengths</div>
                    {a.strengths.map((s,i) => <div key={i} style={{ fontFamily:FONT, fontSize:12.5, color:T_BODY, marginBottom:4, display:'flex', gap:6 }}><span style={{ color:'#16a34a', flexShrink:0 }}>›</span>{s}</div>)}
                  </div>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#b91c1c', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 }}>⚠️ Weaknesses</div>
                    {a.weaknesses.map((w,i) => <div key={i} style={{ fontFamily:FONT, fontSize:12.5, color:T_BODY, marginBottom:4, display:'flex', gap:6 }}><span style={{ color:'#dc2626', flexShrink:0 }}>›</span>{w}</div>)}
                  </div>
                </div>
              )}
              {a.how_to_play && (
                <div style={{ background:'rgba(96,165,250,0.16)', border:'1px solid rgba(96,165,250,0.35)', borderRadius:12, padding:'10px 14px' }}>
                  <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#60a5fa', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>🏏 How to play them</div>
                  <p style={{ fontFamily:FONT, fontSize:13, color:T_BODY, lineHeight:1.6, margin:0 }}>{a.how_to_play}</p>
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
      whileHover={{ y:-3 }}
      style={{ ...GLASS, borderRadius:18, overflow:'hidden' }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'16px 16px 12px', display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color: a.rank===1 ? C.gold : C.gray4 }}>#{a.rank}</span>
          <Avatar initials={initials} photoUrl={a.opponent_players?.photo_url} size={40} color={a.tag==='AVOID'?'#dc2626':a.tag==='TARGET'?'#16a34a':'#7c3aed'}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontFamily:FONT, fontWeight:800, fontSize:15, color:'#fff' }}>{name}</span>
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
          <motion.span animate={{ rotate: open?180:0 }} transition={{ duration:0.2 }} style={{ color:'rgba(255,255,255,0.6)', fontSize:10 }}>▼</motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="exp" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:EASE }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.10)', paddingTop:12 }}>
              {a.summary && <p style={{ fontFamily:FONT, fontSize:13.5, lineHeight:1.7, color:T_BODY, margin:'0 0 12px' }}>{a.summary}</p>}
              {a.strengths?.length > 0 && a.weaknesses?.length > 0 && (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#15803d', marginBottom:5, textTransform:'uppercase' }}>✅ Strengths</div>
                    {a.strengths.map((s,i) => <div key={i} style={{ fontFamily:FONT, fontSize:12.5, color:T_BODY, marginBottom:4 }}>› {s}</div>)}
                  </div>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#b91c1c', marginBottom:5, textTransform:'uppercase' }}>⚠️ Weaknesses</div>
                    {a.weaknesses.map((w,i) => <div key={i} style={{ fontFamily:FONT, fontSize:12.5, color:T_BODY, marginBottom:4 }}>› {w}</div>)}
                  </div>
                </div>
              )}
              {a.how_to_play && (
                <div style={{ background:'rgba(96,165,250,0.16)', border:'1px solid rgba(96,165,250,0.35)', borderRadius:12, padding:'10px 14px' }}>
                  <div style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:'#60a5fa', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>🏏 How to play them</div>
                  <p style={{ fontFamily:FONT, fontSize:13, color:T_BODY, lineHeight:1.6, margin:0 }}>{a.how_to_play}</p>
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
      whileHover={{ y:-3 }}
      style={{ ...GLASS, borderRadius:18, overflow:'hidden' }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'16px 16px 12px', display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <span style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color: a.rank===1 ? C.gold : C.gray4 }}>#{a.rank}</span>
          <Avatar initials={initials} photoUrl={a.opponent_players?.photo_url} size={40} color="#7c3aed"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontFamily:FONT, fontWeight:800, fontSize:15, color:'#fff' }}>{name}</span>
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
          <motion.span animate={{ rotate: open?180:0 }} transition={{ duration:0.2 }} style={{ color:'rgba(255,255,255,0.6)', fontSize:10 }}>▼</motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="exp" initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:EASE }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.10)', paddingTop:12 }}>
              {a.summary && <p style={{ fontFamily:FONT, fontSize:13.5, lineHeight:1.7, color:T_BODY, margin:'0 0 12px' }}>{a.summary}</p>}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {bat && (
                  <div style={{ flex:1, minWidth:130, background:'rgba(52,211,153,0.14)', border:'1px solid rgba(52,211,153,0.32)', borderRadius:12, padding:'10px 12px' }}>
                    <div style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:'#34d399', marginBottom:3 }}>BATTING</div>
                    <div style={{ fontFamily:FONT, fontSize:13, color:T_BODY }}>{bat.runs} runs · SR {bat.strike_rate} · HS {bat.high_score}{bat.high_score_not_out?'*':''}</div>
                  </div>
                )}
                {bowl && (
                  <div style={{ flex:1, minWidth:130, background:'rgba(233,160,32,0.16)', border:'1px solid rgba(233,160,32,0.35)', borderRadius:12, padding:'10px 12px' }}>
                    <div style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:'#e9a020', marginBottom:3 }}>BOWLING</div>
                    <div style={{ fontFamily:FONT, fontSize:13, color:T_BODY }}>{bowl.wickets} wkts · Econ {bowl.economy_rate} · Best {bowl.best_bowling}</div>
                  </div>
                )}
                <div style={{ flex:1, minWidth:130, background:'rgba(96,165,250,0.16)', border:'1px solid rgba(96,165,250,0.32)', borderRadius:12, padding:'10px 12px' }}>
                  <div style={{ fontFamily:FONT, fontSize:10, fontWeight:800, color:'#60a5fa', marginBottom:3 }}>COMPOSITE</div>
                  <div style={{ fontFamily:FONT, fontSize:13, color:T_BODY }}>
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
    <div style={{ overflowX:'auto', ...GLASS, borderRadius:18 }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:FONT }}>
        <thead>
          <tr style={{ background:'rgba(255,255,255,0.06)' }}>
            {cols.map(c => (
              <th key={c.key} onClick={() => toggle(c.key)}
                style={{ padding:'11px 12px', textAlign:c.align||'center', fontFamily:FONT, fontSize:11, fontWeight:700, color:sortKey===c.key?'#c084fc':'rgba(255,255,255,.55)', cursor:'pointer', whiteSpace:'nowrap', userSelect:'none', textTransform:'uppercase', letterSpacing:0.6 }}>
                {c.label}{sortKey===c.key?(dir==='desc'?' ↓':' ↑'):''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} style={{ background:i%2===0?'transparent':'rgba(255,255,255,0.03)' }}>
              {cols.map(c => (
                <td key={c.key} style={{ padding:'10px 12px', fontSize:13, color:c.highlight?'#c084fc':T_BODY, fontWeight:c.highlight?700:500, textAlign:c.align||'center', whiteSpace:'nowrap', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
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
    <div style={{ display:'flex', gap:5, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:5, overflowX:'auto' }}>
      {tabs.map(t => (
        <motion.button key={t.key} onClick={() => onChange(t.key)} whileTap={{ scale:0.96 }}
          style={{ flex:'1 0 auto', padding:'9px 14px', borderRadius:11, border:active===t.key?'1px solid rgba(255,255,255,0.28)':'1px solid transparent', cursor:'pointer', background:active===t.key?'linear-gradient(180deg,#818cf8,#6d28d9)':'none', fontFamily:FONT, fontSize:13, fontWeight:active===t.key?800:500, color:active===t.key?'#fff':T_MUTE, boxShadow:active===t.key?'0 12px 30px -8px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.4)':'none', transition:'all 150ms ease', whiteSpace:'nowrap' }}>
          {t.label}
        </motion.button>
      ))}
    </div>
  )
}

// ── Generated match plan from DB data ─────────────────────────────────────
function MatchPlan({ batAnalysis, bowlAnalysis, arAnalysis, batStats, bowlStats, opp }) {
  const fn = a => a?.opponent_players?.player_name?.split(' ')[0] || '?'
  const fullFn = a => a?.opponent_players?.player_name || '?'

  const avoidBowlers  = bowlAnalysis.filter(a => a.tag === 'AVOID')
  const containBowlers = bowlAnalysis.filter(a => a.tag === 'CONTAIN')
  const targetBowlers  = bowlAnalysis.filter(a => a.tag === 'TARGET')
  const avoidBatters   = batAnalysis.filter(a => a.tag === 'AVOID')
  const containBatters = batAnalysis.filter(a => a.tag === 'CONTAIN')
  const targetBatters  = batAnalysis.filter(a => a.tag === 'TARGET')

  const bowlStatMap = Object.fromEntries(bowlStats.map(b => [b.opponent_players?.player_name || '', b]))
  const batStatMap  = Object.fromEntries(batStats.map(b => [b.opponent_players?.player_name || '', b]))

  const avoidBowlNames   = avoidBowlers.map(fn)
  const targetBowlNames  = targetBowlers.map(fn)
  const avoidBatterNames = avoidBatters.map(fn)
  const targetBatterNames= targetBatters.map(fn)

  // Phase-based batting plan
  const ppNote = avoidBowlers.length > 0
    ? `${avoidBowlNames.slice(0,2).join(' and ')} likely open the bowling — these are elite, dangerous spells. Play straight, take what's there, no reckless shots.`
    : 'Assess the openers in the first 2 overs. Play out their best deliveries and build from over 3.'
  const midNote = targetBowlers.length > 0
    ? `Middle overs (7–15) are your scoring phase. ${targetBowlNames.join(', ')} ${targetBowlers.length === 1 ? 'is exploitable' : 'are exploitable'} — look to score 9–11 per over when they bowl. Don't give them dot balls to build confidence.`
    : containBowlers.length > 0
    ? `Middle overs: ${containBowlers.map(fn).join(', ')} will try to contain — manufacture singles, rotate the strike, and wait for the loose ball. Don't give your wicket cheaply.`
    : 'Middle overs: build the platform with a run-a-ball rate, looking for 2s and 3s. Acceleration in overs 16–20.'
  const deathNote = targetBowlers.length > 0
    ? `Death overs (16–20): if ${targetBowlNames[0]}${targetBowlers.length > 1 ? ` or ${targetBowlNames[1]}` : ''} returns, target them aggressively. Any economy above 7 in this phase is your cue to attack every ball.`
    : 'Death overs: commit to a shot every delivery. Back your hitter to stay in — one over of 15+ can win a game.'

  // Phase-based bowling plan
  const ppBowlNote = avoidBatters.length > 0
    ? `${avoidBatterNames.slice(0,2).join(' and ')} will likely open or bat high — they are their most dangerous. Post your best bowler against them and don't give them a free hit in the powerplay.`
    : 'Identify their in-form batters quickly. Tight lines in the powerplay — keep them under 45 in the first 6.'
  const midBowlNote = targetBatters.length > 0
    ? `Middle overs: ${targetBatterNames.join(', ')} ${targetBatters.length === 1 ? 'has a weakness under pressure' : 'have weaknesses under pressure'}. Attack with short-pitched bowling or change of pace — they tend to give wickets away.`
    : 'Middle overs: maintain tight dot-ball pressure, vary your pace, and rotate ends every 3 overs to break any partnership.'
  const deathBowlNote = avoidBatters.length > 0
    ? `Prevent ${avoidBatterNames[0]} from facing the final 2 overs at all costs — keep fielders in attacking positions and rotate your most experienced bowler for overs 19–20.`
    : 'Death overs: keep two fielders inside the circle, back yourself with slower balls, and don\'t go full until you have to.'

  // Top all-rounders
  const topAR = arAnalysis.slice(0,3)
  const arAvoidList = arAnalysis.filter(a => a.tag === 'AVOID')
  const arContainList = arAnalysis.filter(a => a.tag === 'CONTAIN')

  const SectionHeader = ({ icon, title, sub, color = C.green }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
        <div style={{ width:34, height:34, borderRadius:11, background: color === C.green ? 'rgba(96,165,250,0.16)' : 'rgba(233,160,32,0.16)', border:`1px solid ${color === C.green ? 'rgba(96,165,250,0.35)' : 'rgba(233,160,32,0.4)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{icon}</div>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, ...TITLE_GRAD }}>{title}</div>
      </div>
      <div style={{ fontFamily:FONT, fontSize:12, color:T_MUTE, marginLeft:44 }}>{sub}</div>
    </div>
  )

  const PhaseCard = ({ phase, overs, desc, color = '#2563eb', delay = 0 }) => (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.28, ease:EASE }}
      style={{ ...NESTED, padding:'13px 16px', marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:13, color:'#fff' }}>{phase}</div>
        <div style={{ fontFamily:FONT, fontSize:10, fontWeight:700, color:color, background:`${color}28`, border:`1px solid ${color}55`, padding:'3px 8px', borderRadius:20 }}>{overs}</div>
      </div>
      <div style={{ fontFamily:FONT, fontSize:13, color:T_BODY, lineHeight:1.65 }}>{desc}</div>
    </motion.div>
  )

  const ThreatCard = ({ a, statObj, mode }) => {
    const nm = fullFn(a)
    const st = statObj || {}
    const isBowl = mode === 'bowl'
    const stat1 = isBowl
      ? `${st.wickets ?? '—'} wkts`
      : `${st.runs ?? '—'} runs`
    const stat2 = isBowl
      ? `Econ ${parseFloat(st.economy_rate)?.toFixed(2) ?? '—'}`
      : `SR ${parseFloat(st.strike_rate)?.toFixed(1) ?? '—'}`
    const tagColor = a.tag === 'AVOID' ? '#dc2626' : a.tag === 'TARGET' ? '#16a34a' : '#d97706'
    const tactics = a.scouting_notes || (isBowl
      ? (a.tag === 'AVOID' ? 'This bowler is dangerous — defend their deliveries, take singles, don\'t take risks.' : a.tag === 'TARGET' ? 'Their economy is exploitable — attack from ball one, go over the top if needed.' : 'Steady performer — rotate the strike and look for boundary opportunities.')
      : (a.tag === 'AVOID' ? 'Do not give cheap runs — bowl full and straight, use yorkers at the death.' : a.tag === 'TARGET' ? 'Can be dismissed under pressure — vary pace, bowl short, change angles.' : 'Solid batter — keep the pressure on, bowl tight lines, no loose deliveries.')
    )
    return (
      <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.28, ease:EASE }}
        style={{ ...NESTED, padding:'12px 14px', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          {a.opponent_players?.photo_url
            ? <div style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:`2px solid ${tagColor}40` }}><img src={a.opponent_players.photo_url} alt={nm} style={{ width:'100%', height:'100%', objectFit:'cover' }}/></div>
            : <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${tagColor}30,${tagColor}10)`, border:`2px solid ${tagColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, fontWeight:800, fontSize:13, color:tagColor }}>{nm.slice(0,2).toUpperCase()}</div>
          }
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:FONT, fontWeight:800, fontSize:13, color:'#fff' }}>{nm}</div>
            <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap' }}>
              <Badge label={a.tag}/>
              <span style={{ fontFamily:FONT, fontSize:10, color:T_MUTE, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:6, padding:'2px 7px' }}>{stat1}</span>
              <span style={{ fontFamily:FONT, fontSize:10, color:T_MUTE, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:6, padding:'2px 7px' }}>{stat2}</span>
            </div>
          </div>
        </div>
        <div style={{ fontFamily:FONT, fontSize:12.5, color:T_BODY, lineHeight:1.6, paddingLeft:10, borderLeft:`3px solid ${tagColor}` }}>{tactics}</div>
      </motion.div>
    )
  }

  return (
    <div>
      {/* === INTEL SUMMARY === */}
      <div style={{ background:`linear-gradient(135deg, ${C.greenDark}, #1e40af)`, borderRadius:16, padding:'16px 18px', marginBottom:20, color:'#fff' }}>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:13, marginBottom:10, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:0.5 }}>📋 Pre-Match Intel</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            { v: avoidBatters.length,  l:'Danger Batters', c:'#fca5a5' },
            { v: targetBatters.length, l:'Targetable Batters', c:'#86efac' },
            { v: avoidBowlers.length,  l:'Danger Bowlers', c:'#fca5a5' },
            { v: targetBowlers.length, l:'Targetable Bowlers', c:'#86efac' },
          ].map(({ v, l, c }) => (
            <div key={l} style={{ flex:'1 1 100px', background:'rgba(255,255,255,.1)', borderRadius:12, padding:'10px 12px' }}>
              <div style={{ fontFamily:FONT, fontWeight:900, fontSize:22, color:c }}>{v}</div>
              <div style={{ fontFamily:FONT, fontSize:10, color:'rgba(255,255,255,.65)', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* === WHEN WE BAT === */}
      <div style={{ marginBottom:24 }}>
        <SectionHeader icon="🏏" title="When We Bat" sub="Phase-by-phase batting strategy against their attack" color={C.green}/>
        <PhaseCard phase="Powerplay (Overs 1–6)" overs="Overs 1–6" desc={ppNote} color="#2563eb" delay={0}/>
        <PhaseCard phase="Middle Overs" overs="Overs 7–15" desc={midNote} color="#7c3aed" delay={0.05}/>
        <PhaseCard phase="Death Overs" overs="Overs 16–20" desc={deathNote} color="#dc2626" delay={0.1}/>

        {bowlAnalysis.length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, color:'#fff', marginBottom:4 }}>🎳 Bowler-by-Bowler Guide</div>
            <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:12 }}>How to approach each bowler when you're at the crease</div>
            {bowlAnalysis.map(a => (
              <ThreatCard key={a.id} a={a} statObj={bowlStatMap[fullFn(a)]} mode="bowl"/>
            ))}
          </div>
        )}
      </div>

      {/* === WHEN WE BOWL === */}
      <div style={{ marginBottom:24 }}>
        <SectionHeader icon="🎳" title="When We Bowl" sub="Phase-by-phase bowling strategy against their lineup" color="#d97706"/>
        <PhaseCard phase="Powerplay (Overs 1–6)" overs="Overs 1–6" desc={ppBowlNote} color="#2563eb" delay={0}/>
        <PhaseCard phase="Middle Overs" overs="Overs 7–15" desc={midBowlNote} color="#7c3aed" delay={0.05}/>
        <PhaseCard phase="Death Overs" overs="Overs 16–20" desc={deathBowlNote} color="#dc2626" delay={0.1}/>

        {batAnalysis.length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, color:'#fff', marginBottom:4 }}>🏏 Batter-by-Batter Guide</div>
            <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:12 }}>How to bowl at each of their batters</div>
            {batAnalysis.map(a => (
              <ThreatCard key={a.id} a={a} statObj={batStatMap[fullFn(a)]} mode="bat"/>
            ))}
          </div>
        )}
      </div>

      {/* === ALL-ROUNDER WATCH === */}
      {topAR.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, ...TITLE_GRAD, marginBottom:4 }}>⚡ All-rounder Watch</div>
          <div style={{ fontFamily:FONT, fontSize:12, color:T_MUTE, marginBottom:14 }}>Players who can impact BOTH phases — require dual planning</div>
          {topAR.map(a => {
            const nm = fn(a)
            const bs = batStatMap[fullFn(a)]
            const bw = bowlStatMap[fullFn(a)]
            const tagColor = a.tag === 'AVOID' ? '#dc2626' : a.tag === 'TARGET' ? '#16a34a' : '#d97706'
            return (
              <motion.div key={a.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.28, ease:EASE }}
                whileHover={{ y:-3 }} style={{ ...GLASS, borderRadius:18, padding:'14px 16px', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  {a.opponent_players?.photo_url
                    ? <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', flexShrink:0 }}><img src={a.opponent_players.photo_url} alt={nm} style={{ width:'100%', height:'100%', objectFit:'cover' }}/></div>
                    : <div style={{ width:40, height:40, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${tagColor}30,${tagColor}10)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, fontWeight:800, fontSize:14, color:tagColor }}>{nm.slice(0,2).toUpperCase()}</div>
                  }
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, color:'#fff' }}>{fullFn(a)}</div>
                    <Badge label={a.tag}/>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:FONT, fontWeight:900, fontSize:18, color:'#c084fc' }}>{Math.round(a.composite_score)}</div>
                    <div style={{ fontFamily:FONT, fontSize:9, color:T_MUTE }}>AR Score</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ flex:1, background:'rgba(52,211,153,0.14)', border:'1px solid rgba(52,211,153,0.32)', borderRadius:12, padding:'8px 10px' }}>
                    <div style={{ fontFamily:FONT, fontSize:10, fontWeight:700, color:'#34d399', marginBottom:4 }}>🏏 BAT</div>
                    <div style={{ fontFamily:FONT, fontSize:12, color:T_BODY }}>{bs?.runs ?? '—'} runs @ SR {parseFloat(bs?.strike_rate)?.toFixed(0) ?? '—'}</div>
                    <div style={{ fontFamily:FONT, fontSize:10, color:T_MUTE, marginTop:2 }}>Bat score: {Math.round(a.batting_score||0)}/100</div>
                  </div>
                  <div style={{ flex:1, background:'rgba(192,132,252,0.16)', border:'1px solid rgba(192,132,252,0.32)', borderRadius:12, padding:'8px 10px' }}>
                    <div style={{ fontFamily:FONT, fontSize:10, fontWeight:700, color:'#c084fc', marginBottom:4 }}>🎳 BOWL</div>
                    <div style={{ fontFamily:FONT, fontSize:12, color:T_BODY }}>{bw?.wickets ?? '—'} wkts @ {parseFloat(bw?.economy_rate)?.toFixed(2) ?? '—'} econ</div>
                    <div style={{ fontFamily:FONT, fontSize:10, color:T_MUTE, marginTop:2 }}>Bowl score: {Math.round(a.bowling_score||0)}/100</div>
                  </div>
                </div>
                {a.scouting_notes && <div style={{ fontFamily:FONT, fontSize:12, color:T_BODY, lineHeight:1.6, marginTop:10, padding:'8px 10px', background:'rgba(255,255,255,0.05)', borderRadius:10, borderLeft:`3px solid ${tagColor}` }}>{a.scouting_notes}</div>}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* === KEY MATCHUP MATRIX === */}
      {avoidBatters.length > 0 && avoidBowlers.length > 0 && (
        <div style={{ ...GLASS, padding:16, marginBottom:20 }}>
          <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:4 }}>🔑 Key Matchups</div>
          <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:14 }}>Critical individual contests that could decide the match</div>
          {avoidBowlers.slice(0,2).map((bwl, i) => (
            <div key={i} style={{ background:'linear-gradient(90deg,rgba(96,165,250,0.16),rgba(192,132,252,0.16))', border:'1px solid rgba(255,255,255,0.10)', borderRadius:12, padding:'10px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:'#fff', flex:1 }}>vs {fn(bwl)}</div>
              <div style={{ fontFamily:FONT, fontSize:10, color:T_MUTE }}>Our top-order batters must survive their opening spell</div>
            </div>
          ))}
          {avoidBatters.slice(0,2).map((bat, i) => (
            <div key={i} style={{ background:'linear-gradient(90deg,rgba(233,160,32,0.14),rgba(244,114,182,0.14))', border:'1px solid rgba(255,255,255,0.10)', borderRadius:12, padding:'10px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontFamily:FONT, fontSize:12, fontWeight:700, color:'#fff', flex:1 }}>Bowl to {fn(bat)}</div>
              <div style={{ fontFamily:FONT, fontSize:10, color:T_MUTE }}>Our best bowler must dismiss them early — crucial wicket</div>
            </div>
          ))}
        </div>
      )}

      {/* === BADGE LEGEND === */}
      <div style={{ ...GLASS, padding:16 }}>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:12 }}>🏷️ Badge Legend</div>
        {[
          { badge:'AVOID',   desc:'Elite player — do NOT give easy runs/wickets. Maximum respect.' },
          { badge:'CONTAIN', desc:'Good player — keep dot-ball pressure, no freebies but manageable.' },
          { badge:'TARGET',  desc:'Exploitable — actively look to score off or target their dismissal.' },
          { badge:'WATCH',   desc:'Insufficient data — approach with caution, assess in real time.' },
        ].map(({ badge, desc }) => (
          <div key={badge} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:8 }}>
            <Badge label={badge}/>
            <span style={{ fontFamily:FONT, fontSize:13, color:T_BODY, lineHeight:1.5 }}>{desc}</span>
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
    supabase.from('opponents').select('id, name, season, match_date, notes')
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

  const battingSRChart = useMemo(() =>
    [...batStats].sort((a,b)=>b.runs-a.runs).slice(0,8).map(r=>({
      name: r.opponent_players?.player_name?.split(' ')[0] || '?',
      sr: parseFloat(r.strike_rate) || 0,
    })), [batStats])

  const batScatterData = useMemo(() =>
    batStats.filter(r=>r.runs>0).map(r=>({
      name: r.opponent_players?.player_name?.split(' ')[0] || '?',
      runs: r.runs, sr: parseFloat(r.strike_rate) || 0,
    })), [batStats])

  const bowlEconChart = useMemo(() =>
    [...bowlStats].filter(r=>r.overs>=10).sort((a,b)=>a.economy_rate-b.economy_rate).map(r=>({
      name: r.opponent_players?.player_name?.split(' ')[0] || '?',
      econ: parseFloat(r.economy_rate) || 0, wkts: r.wickets,
    })), [bowlStats])

  const bowlScatterData = useMemo(() =>
    bowlStats.filter(r=>r.overs>=10).map(r=>({
      name: r.opponent_players?.player_name?.split(' ')[0] || '?',
      wickets: r.wickets, econ: parseFloat(r.economy_rate) || 0,
    })), [bowlStats])

  const arScatterData = useMemo(() =>
    arAnalysis.map(a=>({
      name: a.opponent_players?.player_name?.split(' ')[0] || '?',
      bat: Math.round(a.batting_score||0), bowl: Math.round(a.bowling_score||0),
    })), [arAnalysis])

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
      <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'60px 16px', textAlign:'center', fontFamily:FONT, color:T_MUTE }}>
        Loading opponents…
      </div>
    </>
  )

  if (opponents.length === 0) return (
    <>
      <Nav/>
      <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'60px 16px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
        <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, ...TITLE_GRAD, marginBottom:8 }}>No opponents yet</div>
        <div style={{ fontFamily:FONT, fontSize:14, color:T_MUTE }}>
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
          style={{ margin:'24px 0 20px', ...GLASS, padding:'22px 20px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(233,160,32,.15)', border:'1px solid rgba(233,160,32,.35)', borderRadius:20, padding:'4px 12px', marginBottom:10 }}>
            <span style={{ fontSize:10, fontWeight:800, color:'#e9a020', letterSpacing:1, textTransform:'uppercase' }}>🔍 Opposition Scouting</span>
          </div>
          <h1 style={{ fontFamily:FONT, fontSize:20, fontWeight:900, ...TITLE_GRAD, margin:'0 0 6px', letterSpacing:-0.3, lineHeight:1.2 }}>
            {selectedOpp ? `${selectedOpp.name} · ${selectedOpp.season}` : 'Opposition Analysis'}
          </h1>

          {/* Description */}
          {selectedOpp?.notes && (
            <p style={{ fontFamily:FONT, fontSize:13, color:'rgba(255,255,255,.72)', margin:'0 0 16px', lineHeight:1.65, maxWidth:500 }}>
              {selectedOpp.notes}
            </p>
          )}

          {/* Quick stats — inside hero, white-on-dark */}
          {!loadingData && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              {[
                { v: batStats.length,    l:'Batters analysed' },
                { v: bowlStats.filter(r=>r.overs>=10).length, l:'Bowlers (10+ overs)' },
                { v: bowlStats.reduce((s,r)=>s+(r.five_wkt_haul||0),0), l:'Five-wkt hauls' },
                { v: batStats.reduce((s,r)=>s+(r.hundreds||0),0), l:'Centuries' },
              ].map(({ v, l }) => (
                <div key={l} style={{ flex:'1 1 100px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'8px 12px' }}>
                  <div style={{ fontFamily:FONT, fontWeight:900, fontSize:18, color:'#fff' }}>{v}</div>
                  <div style={{ fontFamily:FONT, fontSize:10, color:'rgba(255,255,255,.55)', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          )}

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
          <div style={{ textAlign:'center', padding:'40px 0', fontFamily:FONT, color:T_MUTE }}>
            ⏳ Loading scouting data…
          </div>
        )}

        {!loadingData && (
          <>

            {/* Tabs */}
            <div style={{ marginBottom:20 }}>
              <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab}/>
            </div>

            <AnimatePresence mode="wait">

              {/* ── BATTING ── */}
              {activeTab==='batting' && (
                <motion.div key="batting" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.22, ease:EASE }}>
                  {battingChart.length > 0 && (
                    <div style={{ ...GLASS, padding:'16px 14px', marginBottom:14 }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:12 }}>📊 Total Runs</div>
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={battingChart} margin={{ top:0, right:0, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)"/>
                          <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <YAxis tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Bar dataKey="runs" fill="#60a5fa" radius={[5,5,0,0]} name="Runs"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {battingSRChart.length > 0 && (
                    <div style={{ ...GLASS, padding:'16px 14px', marginBottom:14 }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:4 }}>⚡ Strike Rate</div>
                      <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:12 }}>100 = scoring at 1 run per ball — above is aggressive, below is defensive</div>
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={battingSRChart} margin={{ top:0, right:0, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)"/>
                          <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <YAxis domain={[0, 'auto']} tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <Tooltip content={<ChartTip/>}/>
                          <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" label={{ value:'SR 100', position:'insideTopRight', fontFamily:FONT, fontSize:10, fill:'#94a3b8' }}/>
                          <Bar dataKey="sr" fill="#f59e0b" radius={[5,5,0,0]} name="Strike Rate"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {batScatterData.length >= 2 && (
                    <div style={{ ...GLASS, padding:'16px 14px', marginBottom:14 }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:4 }}>🎯 Runs vs Strike Rate — Threat Quadrant</div>
                      <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:12 }}>Top-right = most dangerous (high volume + fast). Top-left = slow but lots of runs. Bottom-right = swings hard but scores little.</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <ScatterChart margin={{ top:10, right:20, left:-10, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)"/>
                          <XAxis dataKey="runs" name="Runs" type="number" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }} label={{ value:'Runs', position:'insideBottom', offset:-2, fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <YAxis dataKey="sr" name="Strike Rate" type="number" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }} label={{ value:'SR', angle:-90, position:'insideLeft', fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => payload?.length ? (
                            <div style={{ background:'#1e293b', borderRadius:10, padding:'8px 12px', fontFamily:FONT, fontSize:12, color:'#fff' }}>
                              <div style={{ fontWeight:800, marginBottom:4 }}>{payload[0]?.payload?.name}</div>
                              <div>Runs: <strong>{payload[0]?.payload?.runs}</strong></div>
                              <div>SR: <strong>{payload[0]?.payload?.sr?.toFixed(1)}</strong></div>
                            </div>
                          ) : null}/>
                          <Scatter data={batScatterData} fill="#60a5fa" opacity={0.85}
                            shape={(props) => {
                              const { cx, cy, payload } = props
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={6} fill="#60a5fa" opacity={0.85}/>
                                  <text x={cx} y={cy-10} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize={9} fontFamily={FONT}>{payload.name}</text>
                                </g>
                              )
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ ...eyebrowStyle, marginBottom:8 }}>Threat Index</div>
                  <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, ...TITLE_GRAD, marginBottom:4 }}>Top {batAnalysis.length} Batters — Watch List</div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:T_MUTE, marginBottom:14 }}>Weighted composite: 40% runs, 25% SR, 15% HS, 10% milestones, 10% matches</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                    {batAnalysis.map(a => <BatCard key={a.id} a={a} bat={batMap[a.player_id]}/>)}
                  </div>

                  {batTableRows.length > 0 && (
                    <>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:16, ...TITLE_GRAD, marginBottom:4 }}>Full Batting Statistics</div>
                      <div style={{ fontFamily:FONT, fontSize:12, color:T_MUTE, marginBottom:10 }}>Click any column header to sort</div>
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
                    <div style={{ ...GLASS, padding:'16px 14px', marginBottom:14 }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:12 }}>🎳 Wickets (min. 10 overs)</div>
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={bowlingChart} margin={{ top:0, right:0, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)"/>
                          <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <YAxis tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Bar dataKey="wickets" fill="#7c3aed" radius={[5,5,0,0]} name="Wickets"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {bowlEconChart.length > 0 && (
                    <div style={{ ...GLASS, padding:'16px 14px', marginBottom:14 }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:4 }}>💰 Economy Rate (best first)</div>
                      <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:12 }}>Lower = harder to score off. Under 5.0 = elite economy. Above 7.0 = exploitable.</div>
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={bowlEconChart} margin={{ top:0, right:0, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)"/>
                          <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <YAxis domain={[0,'auto']} tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <Tooltip content={<ChartTip/>}/>
                          <ReferenceLine y={7} stroke="#f59e0b" strokeDasharray="4 4" label={{ value:'7.0 threshold', position:'insideTopRight', fontFamily:FONT, fontSize:10, fill:'#f59e0b' }}/>
                          <Bar dataKey="econ" fill="#ef4444" radius={[5,5,0,0]} name="Economy"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {bowlScatterData.length >= 2 && (
                    <div style={{ ...GLASS, padding:'16px 14px', marginBottom:14 }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:4 }}>🎯 Wickets vs Economy — Danger Quadrant</div>
                      <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:12 }}>Top-left = dangerous (lots of wickets + cheap). Top-right = wickets but expensive. Bottom-left = safe to face.</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <ScatterChart margin={{ top:10, right:20, left:-10, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)"/>
                          <XAxis dataKey="econ" name="Economy" type="number" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }} label={{ value:'Economy', position:'insideBottom', offset:-2, fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <YAxis dataKey="wickets" name="Wickets" type="number" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }} label={{ value:'Wkts', angle:-90, position:'insideLeft', fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => payload?.length ? (
                            <div style={{ background:'#1e293b', borderRadius:10, padding:'8px 12px', fontFamily:FONT, fontSize:12, color:'#fff' }}>
                              <div style={{ fontWeight:800, marginBottom:4 }}>{payload[0]?.payload?.name}</div>
                              <div>Wickets: <strong>{payload[0]?.payload?.wickets}</strong></div>
                              <div>Economy: <strong>{payload[0]?.payload?.econ?.toFixed(2)}</strong></div>
                            </div>
                          ) : null}/>
                          <Scatter data={bowlScatterData} fill="#7c3aed" opacity={0.85}
                            shape={(props) => {
                              const { cx, cy, payload } = props
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={6} fill="#7c3aed" opacity={0.85}/>
                                  <text x={cx} y={cy-10} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize={9} fontFamily={FONT}>{payload.name}</text>
                                </g>
                              )
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ ...eyebrowStyle, marginBottom:8 }}>Threat Index</div>
                  <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, ...TITLE_GRAD, marginBottom:4 }}>Top {bowlAnalysis.length} Bowlers — Threat Assessment</div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:T_MUTE, marginBottom:14 }}>Weighted composite: 40% wickets, 30% economy (inv.), 20% average (inv.), 10% SR (inv.)</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                    {bowlAnalysis.map(a => <BowlCard key={a.id} a={a} bowl={bowlMap[a.player_id]}/>)}
                  </div>

                  {bowlTableRows.length > 0 && (
                    <>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:16, ...TITLE_GRAD, marginBottom:4 }}>Full Bowling Statistics</div>
                      <div style={{ fontFamily:FONT, fontSize:12, color:T_MUTE, marginBottom:10 }}>Click any column header to sort</div>
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
                    <div style={{ ...GLASS, padding:'16px 14px', marginBottom:14 }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:4 }}>⚡ Bat vs Bowl Contribution</div>
                      <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:12 }}>Normalised 0–100 scale</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={arAnalysis.map(a=>({ name:a.opponent_players?.player_name?.split(' ')[0]||'?', bat:Math.round(a.batting_score||0), bowl:Math.round(a.bowling_score||0) }))}
                          margin={{ top:0, right:0, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)"/>
                          <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <YAxis domain={[0,110]} tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Legend iconType="circle" wrapperStyle={{ fontFamily:FONT, fontSize:12 }}/>
                          <Bar dataKey="bat"  fill="#60a5fa"  radius={[4,4,0,0]} name="Bat Score"/>
                          <Bar dataKey="bowl" fill="#7c3aed" radius={[4,4,0,0]} name="Bowl Score"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {arScatterData.length >= 2 && (
                    <div style={{ ...GLASS, padding:'16px 14px', marginBottom:14 }}>
                      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:14, ...TITLE_GRAD, marginBottom:4 }}>🔮 All-rounder Skill Map</div>
                      <div style={{ fontFamily:FONT, fontSize:11, color:T_MUTE, marginBottom:12 }}>Top-right = true all-rounder threat (dangerous bat AND bowl). Axes = normalised 0–100 skill score.</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <ScatterChart margin={{ top:10, right:20, left:-10, bottom:10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)"/>
                          <XAxis dataKey="bat" name="Bat Score" type="number" domain={[0,105]} tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }} label={{ value:'Bat Score', position:'insideBottom', offset:-5, fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <YAxis dataKey="bowl" name="Bowl Score" type="number" domain={[0,105]} tick={{ fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }} label={{ value:'Bowl', angle:-90, position:'insideLeft', fontFamily:FONT, fontSize:11, fill:'rgba(255,255,255,0.55)' }}/>
                          <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => payload?.length ? (
                            <div style={{ background:'#1e293b', borderRadius:10, padding:'8px 12px', fontFamily:FONT, fontSize:12, color:'#fff' }}>
                              <div style={{ fontWeight:800, marginBottom:4 }}>{payload[0]?.payload?.name}</div>
                              <div>Bat Score: <strong>{payload[0]?.payload?.bat}</strong></div>
                              <div>Bowl Score: <strong>{payload[0]?.payload?.bowl}</strong></div>
                            </div>
                          ) : null}/>
                          <Scatter data={arScatterData} fill="#f59e0b" opacity={0.9}
                            shape={(props) => {
                              const { cx, cy, payload } = props
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={7} fill="#f59e0b" opacity={0.9}/>
                                  <text x={cx} y={cy-11} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize={9} fontFamily={FONT}>{payload.name}</text>
                                </g>
                              )
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ fontFamily:FONT, fontWeight:800, fontSize:18, ...TITLE_GRAD, marginBottom:4 }}>Top {arAnalysis.length} All-rounders</div>
                  <div style={{ fontFamily:FONT, fontSize:12, color:T_MUTE, marginBottom:14 }}>Composite = 50% bat score + 50% bowl score. Min 3 games + 10 overs.</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                    {arAnalysis.map(a => <ArCard key={a.id} a={a} bat={batMap[a.player_id]} bowl={bowlMap[a.player_id]}/>)}
                  </div>
                  <Methodology type="allrounder"/>
                </motion.div>
              )}

              {/* ── MATCH PLAN ── */}
              {activeTab==='matchplan' && (
                <motion.div key="plan" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.22, ease:EASE }}>
                  <MatchPlan batAnalysis={batAnalysis} bowlAnalysis={bowlAnalysis} arAnalysis={arAnalysis} batStats={batStats} bowlStats={bowlStats} opp={selectedOpp}/>
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
    <div style={{ marginTop:18, padding:'12px 16px', ...NESTED, borderLeft:'3px solid #c084fc' }}>
      <div style={{ fontFamily:FONT, fontWeight:800, fontSize:11, color:'#c084fc', marginBottom:3, textTransform:'uppercase', letterSpacing:0.5 }}>📐 Methodology</div>
      <p style={{ fontFamily:FONT, fontSize:12, color:T_BODY, lineHeight:1.6, margin:0 }}>{notes[type]}</p>
    </div>
  )
}
