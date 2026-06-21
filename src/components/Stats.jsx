import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import PlayerOfWeek from './PlayerOfWeek'
import { Skeleton } from './ui/Loader'
import {
  BarChart2, Target, Shield, ArrowLeft,
  TrendingUp, Award, Zap, ChevronDown, ChevronUp, Users
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ScatterChart, Scatter, ZAxis, LineChart, Line,
  LabelList, ReferenceLine,
} from 'recharts'

// ── Easing & variants ─────────────────────────────────────
const EASE_OUT = [0.23, 1, 0.32, 1]
const fadeUp   = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } } }
const stagger  = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } }
const SEASONS  = ['2026', '2025', '2024']
const MEDALS   = ['🥇', '🥈', '🥉']

// Per-tab color themes
const TAB_THEMES = {
  batting:  { color: '#2563eb', light: '#1d4ed8', bg: 'rgba(59,130,246,0.12)', grad: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' },
  bowling:  { color: '#be123c', light: '#f43f5e', bg: 'rgba(239,68,68,0.12)', grad: 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)' },
  fielding: { color: '#6d28d9', light: '#8b5cf6', bg: 'rgba(168,85,247,0.12)', grad: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)' },
  matchlog: { color: '#1d4ed8', light: '#3b82f6', bg: 'rgba(59,130,246,0.12)', grad: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' },
}

// ── Bold Gradient theme helpers ───────────────────────────
const GLASS_CARD = {
  background: 'linear-gradient(150deg, rgba(37,99,235,0.24), rgba(124,58,237,0.22) 60%, rgba(20,184,166,0.14))',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)',
  borderRadius: 22,
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
}
const GLASS_NESTED = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 16,
}
const GRAD_TEXT = {
  color: '#fff',
  backgroundImage: 'linear-gradient(92deg,#60a5fa,#c084fc 60%,#f472b6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}
const PILL_BTN = {
  background: 'linear-gradient(180deg,#818cf8,#6d28d9)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: '0 12px 30px -8px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.4)',
  borderRadius: 12,
  fontWeight: 700,
}

// ── Custom tooltip ────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit = '', color }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: C.white, borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,.15)', border: `1px solid ${C.gray2}`,
      fontFamily: FONT, minWidth: 120,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color || color }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: p.fill || p.color || color }}>
            {typeof p.value === 'number' && !Number.isInteger(p.value) ? p.value.toFixed(2) : p.value}
          </span>
          {unit && <span style={{ fontSize: 11, color: C.gray3 }}>{unit}</span>}
        </div>
      ))}
    </div>
  )
}

// ── Runs bar chart ────────────────────────────────────────
function RunsBarChart({ data, color }) {
  const top = [...data]
    .filter(s => s.bat_runs > 0)
    .sort((a, b) => b.bat_runs - a.bat_runs)
    .slice(0, 8)
    .map(s => ({ name: s.player_name.split(' ')[0], runs: s.bat_runs, avg: parseFloat(s.bat_average) || 0 }))

  if (!top.length) return null

  const BAR_COLORS = [
    '#2563eb','#1d4ed8','#3b82f6','#60a5fa','#059669','#0d9488','#0891b2','#0369a1',
  ]

  return (
    <div style={{ ...GLASS_CARD, padding: '20px 16px 12px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,#60a5fa,#c084fc)', borderRadius: 99 }} />
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, ...GRAD_TEXT }}>Runs This Season</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={top} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }} barSize={18}>
          <defs>
            {BAR_COLORS.map((c, i) => (
              <linearGradient key={i} id={`runGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid horizontal={false} stroke={`${C.gray2}80`} strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontFamily: FONT, fontSize: 10, fill: C.gray3 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, fill: C.dark }} axisLine={false} tickLine={false} width={80} />
          <Tooltip content={<ChartTooltip unit="runs" color={color} />} cursor={{ fill: `${color}08` }} />
          <Bar dataKey="runs" radius={[0, 8, 8, 0]}>
            {top.map((_, i) => <Cell key={i} fill={`url(#runGrad${i})`} />)}
            <LabelList dataKey="runs" position="right" style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, fill: C.dark }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Avg vs SR scatter ─────────────────────────────────────
function AvgSRChart({ data, color }) {
  const pts = data
    .filter(s => s.bat_innings >= 2 && s.bat_runs > 0)
    .map(s => ({
      name: s.player_name.split(' ')[0],
      avg: parseFloat(s.bat_average) || 0,
      sr: parseFloat(s.bat_strike_rate) || 0,
      runs: s.bat_runs,
    }))
  if (pts.length < 2) return null

  const avgMean = pts.reduce((s, p) => s + p.avg, 0) / pts.length
  const srMean  = pts.reduce((s, p) => s + p.sr,  0) / pts.length

  const CustomDot = (props) => {
    const { cx, cy, payload } = props
    return (
      <g>
        <circle cx={cx} cy={cy} r={Math.max(6, Math.min(14, payload.runs / 12))} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.5} />
        <text x={cx} y={cy - Math.max(8, Math.min(16, payload.runs / 12)) - 3} textAnchor="middle" fill={C.dark} fontSize={10} fontFamily={FONT} fontWeight={700}>
          {payload.name}
        </text>
      </g>
    )
  }

  return (
    <div style={{ ...GLASS_CARD, padding: '20px 16px 8px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,#60a5fa,#c084fc)', borderRadius: 99 }} />
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, ...GRAD_TEXT }}>Average vs Strike Rate</span>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray3, marginBottom: 12, paddingLeft: 12 }}>Bubble size = runs scored</div>
      <ResponsiveContainer width="100%" height={200}>
        <ScatterChart margin={{ left: -10, right: 16, top: 16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={`${C.gray2}80`} />
          <XAxis dataKey="avg" name="Avg" type="number" tick={{ fontFamily: FONT, fontSize: 10, fill: C.gray3 }} axisLine={false} tickLine={false} label={{ value: 'Average', position: 'insideBottom', offset: -2, fontFamily: FONT, fontSize: 10, fill: C.gray3 }} />
          <YAxis dataKey="sr"  name="SR"  type="number" tick={{ fontFamily: FONT, fontSize: 10, fill: C.gray3 }} axisLine={false} tickLine={false} label={{ value: 'Strike Rate', angle: -90, position: 'insideLeft', fontFamily: FONT, fontSize: 10, fill: C.gray3 }} />
          <ZAxis dataKey="runs" range={[40, 300]} />
          <ReferenceLine x={avgMean} stroke={`${color}40`} strokeDasharray="4 4" />
          <ReferenceLine y={srMean}  stroke={`${color}40`} strokeDasharray="4 4" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0]?.payload
            return (
              <div style={{ background: C.white, borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,.15)', border: `1px solid ${C.gray2}`, fontFamily: FONT }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.dark, marginBottom: 6 }}>{d?.name}</div>
                <div style={{ fontSize: 11, color: C.gray3 }}>Avg: <b style={{ color }}>{d?.avg?.toFixed(1)}</b></div>
                <div style={{ fontSize: 11, color: C.gray3 }}>SR: <b style={{ color }}>{d?.sr?.toFixed(1)}</b></div>
                <div style={{ fontSize: 11, color: C.gray3 }}>Runs: <b style={{ color: C.dark }}>{d?.runs}</b></div>
              </div>
            )
          }} />
          <Scatter data={pts} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Wickets bar chart ─────────────────────────────────────
function WicketsBarChart({ data, color }) {
  const top = [...data]
    .filter(s => s.bowl_wickets > 0)
    .sort((a, b) => b.bowl_wickets - a.bowl_wickets)
    .slice(0, 8)
    .map(s => ({ name: s.player_name.split(' ')[0], wkts: s.bowl_wickets, econ: parseFloat(s.bowl_economy) || 0 }))

  if (!top.length) return null

  const BAR_COLORS = ['#be123c','#e11d48','#f43f5e','#fb7185','#be123c','#e11d48','#f43f5e','#fb7185']

  return (
    <div style={{ ...GLASS_CARD, padding: '20px 16px 12px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,#60a5fa,#c084fc)', borderRadius: 99 }} />
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, ...GRAD_TEXT }}>Wickets This Season</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={top} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }} barSize={18}>
          <defs>
            {BAR_COLORS.map((c, i) => (
              <linearGradient key={i} id={`wktGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.65} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid horizontal={false} stroke={`${C.gray2}80`} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={{ fontFamily: FONT, fontSize: 10, fill: C.gray3 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, fill: C.dark }} axisLine={false} tickLine={false} width={80} />
          <Tooltip content={<ChartTooltip unit="wkts" color={color} />} cursor={{ fill: `${color}08` }} />
          <Bar dataKey="wkts" radius={[0, 8, 8, 0]}>
            {top.map((_, i) => <Cell key={i} fill={`url(#wktGrad${i})`} />)}
            <LabelList dataKey="wkts" position="right" style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, fill: C.dark }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Economy rate chart ────────────────────────────────────
function EconomyChart({ data, color }) {
  const bowlers = [...data]
    .filter(s => parseFloat(s.bowl_overs) >= 2 && s.bowl_economy > 0)
    .sort((a, b) => parseFloat(a.bowl_economy) - parseFloat(b.bowl_economy))
    .slice(0, 8)
    .map(s => ({ name: s.player_name.split(' ')[0], econ: parseFloat(s.bowl_economy) || 0, wkts: s.bowl_wickets }))

  if (bowlers.length < 2) return null

  const getColor = (econ) => {
    if (econ < 6)  return '#15803d'
    if (econ < 8)  return '#b45309'
    if (econ < 10) return '#be123c'
    return '#7c3aed'
  }

  return (
    <div style={{ ...GLASS_CARD, padding: '20px 16px 12px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,#60a5fa,#c084fc)', borderRadius: 99 }} />
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, ...GRAD_TEXT }}>Economy Rates</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[['< 6','#15803d'],['6–8','#b45309'],['8+','#be123c']].map(([lbl, col]) => (
            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />
              <span style={{ fontFamily: FONT, fontSize: 9, color: C.gray3, fontWeight: 600 }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bowlers} layout="vertical" margin={{ left: 0, right: 44, top: 0, bottom: 0 }} barSize={16}>
          <CartesianGrid horizontal={false} stroke={`${C.gray2}80`} strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 'auto']} tick={{ fontFamily: FONT, fontSize: 10, fill: C.gray3 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, fill: C.dark }} axisLine={false} tickLine={false} width={80} />
          <ReferenceLine x={6} stroke="#15803d50" strokeDasharray="4 3" />
          <ReferenceLine x={8} stroke="#b4530950" strokeDasharray="4 3" />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const econ = payload[0]?.value
            return (
              <div style={{ background: C.white, borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,.15)', border: `1px solid ${C.gray2}`, fontFamily: FONT }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.dark, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: getColor(econ) }}>Economy: {econ?.toFixed(2)}</div>
              </div>
            )
          }} cursor={{ fill: '#00000006' }} />
          <Bar dataKey="econ" radius={[0, 8, 8, 0]}>
            {bowlers.map((b, i) => <Cell key={i} fill={getColor(b.econ)} />)}
            <LabelList dataKey="econ" position="right" formatter={v => v.toFixed(2)} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, fill: C.dark }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Fielding stacked chart ────────────────────────────────
function FieldingChart({ data }) {
  const fielders = [...data]
    .map(s => ({
      name: s.player_name.split(' ')[0],
      catches: s.field_catches || 0,
      runOuts: s.field_run_outs || 0,
      stumpings: s.field_stumpings || 0,
    }))
    .filter(s => s.catches + s.runOuts + s.stumpings > 0)
    .sort((a, b) => (b.catches + b.runOuts + b.stumpings) - (a.catches + a.runOuts + a.stumpings))
    .slice(0, 8)

  if (!fielders.length) return null

  return (
    <div style={{ ...GLASS_CARD, padding: '20px 16px 12px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 18, background: 'linear-gradient(180deg,#60a5fa,#c084fc)', borderRadius: 99 }} />
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, ...GRAD_TEXT }}>Fielding Breakdown</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[['Catches','#6d28d9'],['Run Outs','#be123c'],['Stumpings','#b45309']].map(([lbl, col]) => (
            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
              <span style={{ fontFamily: FONT, fontSize: 9, color: C.gray3, fontWeight: 600 }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={fielders} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }} barSize={16} barGap={0}>
          <defs>
            <linearGradient id="catchGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6d28d9" /><stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="roGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#be123c" /><stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="stmpGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b45309" /><stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke={`${C.gray2}80`} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={{ fontFamily: FONT, fontSize: 10, fill: C.gray3 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, fill: C.dark }} axisLine={false} tickLine={false} width={80} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div style={{ background: C.white, borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,.15)', border: `1px solid ${C.gray2}`, fontFamily: FONT }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.dark, marginBottom: 6 }}>{label}</div>
                {payload.map((p, i) => p.value > 0 && (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
                    <span style={{ fontSize: 11, color: C.gray4 }}>{p.name}: </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: p.fill }}>{p.value}</span>
                  </div>
                ))}
              </div>
            )
          }} cursor={{ fill: '#00000006' }} />
          <Bar dataKey="catches"   name="Catches"   stackId="a" fill="url(#catchGrad)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="runOuts"   name="Run Outs"  stackId="a" fill="url(#roGrad)"    radius={[0, 0, 0, 0]} />
          <Bar dataKey="stumpings" name="Stumpings" stackId="a" fill="url(#stmpGrad)"  radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Formatters
const fmt1  = v => { const n = parseFloat(v); return (!n && n !== 0) || isNaN(n) ? '—' : n.toFixed(1) }
const fmt2  = v => { const n = parseFloat(v); return (!n && n !== 0) || isNaN(n) ? '—' : n.toFixed(2) }
const fmtN  = v => { const n = parseInt(v);   return (!n && n !== 0) || isNaN(n) ? '—' : n }
const fmtHS   = (r, no) => { const n = parseInt(r); return (!n && n !== 0) ? '—' : `${n}${no ? '*' : ''}` }
const fmtBest = (w, r)  => { const n = parseInt(w); return !n ? '—' : `${n}/${parseInt(r) || 0}` }

const cellStyle = { fontFamily: FONT, fontSize: 13, color: C.gray5, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }

// ── Player photo lookup (same data as api/potw.js) ───────
const PHOTO_BASE = 'https://admin.btcluk.com/players/'
const PLAYER_PHOTOS = {
  'Mohamed Nafaz':                   '4309WhatsApp Image 2022-04-27 at 5.51.37 PM.jpeg',
  'Gobinath Navaratnam':             '90041.jpg',
  'Raj Sorna':                       '3615Raj.jpg',
  'Roshan Thishanthan':              'IMG-20240409-WA0034-removebg-preview.png',
  'Mahadeva Amaranath':              '8625IMG-20220408-WA0011.jpg',
  'Abbi Kanthiraj':                  '4321IMG-20220428-WA0009.jpg',
  'Ajanthan Navaratnam':             '5336IMG-20220411-WA0010.jpg',
  'Harriharan Aravinthan':           '3635IMG-20220408-WA0018.jpg',
  'Theepan Rajah Rajasekaran':       'Theepan.jpeg',
  'Sanjiv Balachandran':             '6916IMG-20220411-WA0018.jpg',
  'Namasevayam Vipooshanan':         '1660IMG-20220419-WA0009.jpg',
  'Elankopan Thavalinkam':           '4720IMG-20220420-WA0032.jpg',
  'Raguvaran Aravinthan':            '3215IMG-20220408-WA0017.jpg',
  'Kajenth Thanabalasingham':        '237279A25C56-43AC-49FA-B68D-FE810DBA9C4A.jpeg',
  'Muralitharan Guganeshan':         '4485WhatsApp Image 2022-07-03 at 10.40.58 AM.jpeg',
  'Krishen Daniel':                  '2304IMG-20220418-WA0030.jpg',
  'Gaajuran Ganagabalan':            '4971.jpeg',
  'Eashwaran Aravinthan':            'image0 (3).jpeg',
  'Hrithisshan Kanendran':           '976Under 15.png',
  'Abdul Khaliq Hakeem':             '6984886Under 18.png',
  'Shenal Daniel Anthony':           'bc581ed9-b973-48e3-9e12-52912924f432.jpeg',
  'Thevakumar Kanagarathinam Anton': '6631.jpeg',
  'Malindu Maduranga':               '7348.jpeg',
  'Prayash Singh':                   '7349.jpeg',
  'Arivu Sasikumar':                 '7358.jpeg',
  'Dilesh Sangaran':                 '7361.jpeg',
  'Inthikhab Mazeez':                '7435.jpeg',
  'Pathmajeyan Asokumar':            '7514.jpeg',
  'Mihin Sugeeswaran':               '7526.jpeg',
}
function photoUrl(name) {
  const file = PLAYER_PHOTOS[name]
  return file ? PHOTO_BASE + encodeURIComponent(file) : null
}

// ── Avatar ────────────────────────────────────────────────
function Avatar({ name = '', size = 32 }) {
  const [imgOk, setImgOk] = React.useState(true)
  const url = photoUrl(name)
  const PALETTE = ['#2563eb','#7c3aed','#0369a1','#b45309','#0891b2','#be185d','#059669','#6d28d9']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  const bg = PALETTE[Math.abs(h) % PALETTE.length]
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {url && imgOk ? (
        <img src={url} alt={name} onError={() => setImgOk(false)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
      ) : (
        <span style={{ color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: Math.round(size * 0.34), userSelect: 'none' }}>
          {initials}
        </span>
      )}
    </div>
  )
}

// ── Vivid gradient stat card ──────────────────────────────
function StatCard({ icon: Icon, label, value, sub, gradient, loading }) {
  return (
    <motion.div variants={fadeUp} style={{
      background: gradient,
      borderRadius: 20,
      padding: '20px 18px',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circle */}
      <div style={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -16, left: -16, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />

      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} color="#fff" strokeWidth={2.5} />
      </div>
      {loading
        ? <Skeleton height={30} width={60} style={{ background: 'rgba(255,255,255,.3)' }} />
        : <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      }
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.9)', textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</div>
        {sub && !loading && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

// ── Mini progress bar ─────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4
  return (
    <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,.07)', borderRadius: 99, overflow: 'hidden', marginTop: 3 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  )
}

// ── Rank badge ────────────────────────────────────────────
function RankBadge({ rank }) {
  const grads = {
    1: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    2: 'linear-gradient(135deg, #78909c, #b0bec5)',
    3: 'linear-gradient(135deg, #a1522c, #cd7f5e)',
  }
  const style = {
    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 900,
  }
  if (grads[rank]) return <div style={{ ...style, background: grads[rank], color: '#fff' }}>{rank}</div>
  return <div style={{ ...style, background: C.gray1, color: C.gray3 }}>{rank}</div>
}

// ── Podium ────────────────────────────────────────────────
function Podium({ items, valueKey, label, fmtFn = fmtN, tabTheme }) {
  const top3 = [...items].filter(s => (parseFloat(s[valueKey]) || 0) > 0)
    .sort((a, b) => (parseFloat(b[valueKey]) || 0) - (parseFloat(a[valueKey]) || 0))
    .slice(0, 3)
  if (!top3.length) return null

  const medals = [
    { grad: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', shadow: '0 8px 28px #f59e0b35', height: 112, avatarSize: 46 },
    { grad: 'linear-gradient(135deg, #78909c 0%, #b0bec5 100%)', shadow: '0 6px 20px #78909c25', height: 88,  avatarSize: 38 },
    { grad: 'linear-gradient(135deg, #a1522c 0%, #cd7f5e 100%)', shadow: '0 6px 20px #a1522c25', height: 76,  avatarSize: 34 },
  ]
  const order    = [top3[1], top3[0], top3[2]].filter(Boolean)
  const orderIdx = [1, 0, 2]

  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      initial="hidden" animate="visible"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 28 }}
    >
      {order.map((s, i) => {
        const ri = orderIdx[i]
        const mc = medals[ri]
        return (
          <motion.div
            key={s.id}
            variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', duration: 0.55, bounce: 0.28 } } }}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 20, overflow: 'hidden',
              boxShadow: mc.shadow,
              border: `1px solid ${ri === 0 ? '#f59e0b' : 'rgba(255,255,255,0.10)'}`,
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minHeight: mc.height,
            }}
          >
            <div style={{ background: mc.grad, width: '100%', padding: '12px 8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 20 }}>{MEDALS[ri]}</div>
              <Avatar name={s.player_name} size={mc.avatarSize} />
            </div>
            <div style={{ padding: '10px 8px 14px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 11, color: C.dark, lineHeight: 1.2 }}>
                {s.player_name.split(' ')[0]}
              </div>
              <div style={{ fontSize: ri === 0 ? 28 : 22, fontWeight: 900, color: ri === 0 ? tabTheme.color : C.gray5, fontVariantNumeric: 'tabular-nums' }}>
                {fmtFn(s[valueKey])}
              </div>
              <div style={{ fontSize: 9, color: C.gray3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ── Section heading ───────────────────────────────────────
function SectionHeading({ children, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 4, height: 20, background: 'linear-gradient(180deg,#60a5fa,#c084fc)', borderRadius: 99 }} />
      <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, ...GRAD_TEXT }}>{children}</div>
    </div>
  )
}

// ── Skeletons / empty ─────────────────────────────────────
function SkeletonDash() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[1,2,3,4].map(i => <Skeleton key={i} height={108} borderRadius={20} />)}
      </div>
      <Skeleton height={150} borderRadius={20} />
      <Skeleton height={300} borderRadius={18} />
    </div>
  )
}

function EmptyState({ tab }) {
  return (
    <div style={{ ...GLASS_CARD, textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 17, ...GRAD_TEXT }}>No {tab} stats yet</div>
      <div style={{ fontFamily: FONT, fontSize: 13, color: C.gray4, marginTop: 6 }}>Upload the Excel file to populate this section.</div>
    </div>
  )
}

// ── Batting dashboard ──────────────────────────────────────
function BattingDashboard({ stats, loading }) {
  const [sortCol, setSortCol] = useState('bat_runs')
  const [sortDir, setSortDir] = useState('desc')
  const [showAll, setShowAll] = useState(false)
  const theme = TAB_THEMES.batting

  if (loading) return <SkeletonDash />
  if (!stats.length) return <EmptyState tab="batting" />

  const sorted = [...stats].filter(s => s.bat_innings > 0 || s.bat_runs > 0).sort((a, b) => {
    const av = typeof a[sortCol] === 'string' ? a[sortCol].toLowerCase() : parseFloat(a[sortCol]) || 0
    const bv = typeof b[sortCol] === 'string' ? b[sortCol].toLowerCase() : parseFloat(b[sortCol]) || 0
    return sortDir === 'asc' ? (av < bv ? -1 : 1) : (bv < av ? -1 : 1)
  })

  const maxRuns      = Math.max(...sorted.map(s => s.bat_runs || 0))
  const totalRuns    = sorted.reduce((s, p) => s + (parseInt(p.bat_runs) || 0), 0)
  const totalFifties = sorted.reduce((s, p) => s + (parseInt(p.bat_fifties) || 0), 0)
  const totalSixes   = sorted.reduce((s, p) => s + (parseInt(p.bat_sixes) || 0), 0)
  const topSR = [...sorted].filter(s => s.bat_balls >= 10).sort((a, b) => (b.bat_strike_rate || 0) - (a.bat_strike_rate || 0))[0]

  const visible = showAll ? sorted : sorted.slice(0, 8)
  const onSort  = col => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div>
      <motion.div variants={stagger} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}
      >
        <StatCard icon={TrendingUp} label="Total Runs"      value={totalRuns}    sub={`${sorted.length} batters`}                 gradient="linear-gradient(135deg, #2563eb, #1d4ed8)" loading={false} />
        <StatCard icon={Award}      label="Half Centuries"  value={totalFifties} sub="50+ scores this season"                     gradient="linear-gradient(135deg, #b45309, #f59e0b)" loading={false} />
        <StatCard icon={Zap}        label="Sixes Hit"       value={totalSixes}   sub="maximums this season"                       gradient="linear-gradient(135deg, #6d28d9, #8b5cf6)" loading={false} />
        <StatCard icon={BarChart2}  label="Top Strike Rate" value={topSR ? fmt2(topSR.bat_strike_rate) : '—'} sub={topSR?.player_name?.split(' ')[0] || '—'} gradient="linear-gradient(135deg, #0369a1, #0ea5e9)" loading={false} />
      </motion.div>

      <RunsBarChart data={sorted} color={theme.color} />
      <AvgSRChart   data={sorted} color={theme.color} />

      <SectionHeading theme={theme}>🏆 Top Run Scorers</SectionHeading>
      <Podium items={sorted} valueKey="bat_runs" label="Runs" tabTheme={theme} />

      <SectionHeading theme={theme}>Batting Averages</SectionHeading>
      <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 34px 42px 44px 34px 52px', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div />
          {[
            { col: 'player_name', label: 'Player', align: 'left' },
            { col: 'bat_innings', label: 'Inn',  align: 'center' },
            { col: 'bat_runs',    label: 'Runs', align: 'center' },
            { col: 'bat_highest', label: 'HS',   align: 'center' },
            { col: 'bat_fifties', label: '50s',  align: 'center' },
            { col: 'bat_average', label: 'Avg',  align: 'center' },
          ].map(({ col, label, align }) => (
            <button key={col} onClick={() => onSort(col)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: 0.7,
              color: sortCol === col ? theme.color : C.gray3, textTransform: 'uppercase',
              textAlign: align, display: 'flex', alignItems: 'center',
              justifyContent: align === 'left' ? 'flex-start' : 'center', gap: 2,
            }}>
              {label}
              {sortCol === col && (sortDir === 'asc' ? <ChevronUp size={9} /> : <ChevronDown size={9} />)}
            </button>
          ))}
        </div>

        {visible.map((s, i) => (
          <motion.div key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT, delay: i * 0.03 }}
            style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 34px 42px 44px 34px 52px',
              padding: '12px 14px', alignItems: 'center',
              borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: i === 0 ? 'rgba(192,132,252,0.14)' : i % 2 !== 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
            }}
          >
            <RankBadge rank={i + 1} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, paddingLeft: 6 }}>
              <Avatar name={s.player_name} size={30} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.player_name}
                </div>
                <MiniBar value={s.bat_runs || 0} max={maxRuns} color={theme.color} />
              </div>
            </div>
            <div style={cellStyle}>{fmtN(s.bat_innings)}</div>
            <div style={{ ...cellStyle, fontWeight: 900, color: theme.color, fontSize: 15 }}>{fmtN(s.bat_runs)}</div>
            <div style={cellStyle}>{fmtHS(s.bat_highest, s.bat_highest_not_out)}</div>
            <div style={{ ...cellStyle, color: (s.bat_fifties || 0) > 0 ? '#b45309' : C.gray3, fontWeight: (s.bat_fifties || 0) > 0 ? 800 : 400 }}>{fmtN(s.bat_fifties)}</div>
            <div style={{ ...cellStyle, fontWeight: 700, color: parseFloat(s.bat_average) >= 20 ? theme.color : C.gray5 }}>{fmt2(s.bat_average)}</div>
          </motion.div>
        ))}
      </div>

      {sorted.length > 8 && (
        <button onClick={() => setShowAll(a => !a)} style={{
          ...PILL_BTN, marginTop: 12, width: '100%', padding: '12px',
          fontFamily: FONT, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <ChevronDown size={14} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          {showAll ? 'Show fewer batters' : `Show all ${sorted.length} batters`}
        </button>
      )}
    </div>
  )
}

// ── Bowling dashboard ──────────────────────────────────────
function BowlingDashboard({ stats, loading }) {
  const [sortCol, setSortCol] = useState('bowl_wickets')
  const [sortDir, setSortDir] = useState('desc')
  const [showAll, setShowAll] = useState(false)
  const theme = TAB_THEMES.bowling

  if (loading) return <SkeletonDash />
  if (!stats.length) return <EmptyState tab="bowling" />

  const sorted = [...stats].filter(s => s.bowl_overs > 0 || s.bowl_wickets > 0).sort((a, b) => {
    const av = parseFloat(a[sortCol]) || 0
    const bv = parseFloat(b[sortCol]) || 0
    return sortDir === 'asc' ? (av < bv ? -1 : 1) : (bv < av ? -1 : 1)
  })

  const maxWkts    = Math.max(...sorted.map(s => s.bowl_wickets || 0))
  const totalWkts  = sorted.reduce((s, p) => s + (parseInt(p.bowl_wickets) || 0), 0)
  const totalOvers = sorted.reduce((s, p) => s + (parseFloat(p.bowl_overs) || 0), 0)
  const bestEcon   = [...sorted].filter(s => parseFloat(s.bowl_overs) >= 4)
    .sort((a, b) => (parseFloat(a.bowl_economy) || 99) - (parseFloat(b.bowl_economy) || 99))[0]
  const fiveWkts   = sorted.reduce((s, p) => s + (parseInt(p.bowl_five_fers) || 0), 0)

  const visible = showAll ? sorted : sorted.slice(0, 8)
  const onSort  = col => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  return (
    <div>
      <motion.div variants={stagger} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}
      >
        <StatCard icon={Target}    label="Total Wickets"   value={totalWkts}    sub={`${sorted.length} bowlers`}                  gradient="linear-gradient(135deg, #be123c, #f43f5e)" loading={false} />
        <StatCard icon={BarChart2} label="Overs Bowled"    value={fmt1(totalOvers)} sub="total this season"                       gradient="linear-gradient(135deg, #2563eb, #1d4ed8)" loading={false} />
        <StatCard icon={Zap}       label="Best Economy"    value={bestEcon ? fmt2(bestEcon.bowl_economy) : '—'} sub={bestEcon?.player_name?.split(' ')[0] || '—'} gradient="linear-gradient(135deg, #0891b2, #06b6d4)" loading={false} />
        <StatCard icon={Award}     label="5-Wicket Hauls"  value={fiveWkts}     sub="season total"                               gradient="linear-gradient(135deg, #b45309, #f59e0b)" loading={false} />
      </motion.div>

      <WicketsBarChart data={sorted} color={theme.color} />
      <EconomyChart    data={sorted} color={theme.color} />

      <SectionHeading theme={theme}>🎯 Top Wicket Takers</SectionHeading>
      <Podium items={sorted} valueKey="bowl_wickets" label="Wkts" tabTheme={theme} />

      <SectionHeading theme={theme}>Bowling Figures</SectionHeading>
      <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 40px 36px 48px 52px 52px', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div />
          {[
            { col: 'player_name',       label: 'Player', align: 'left' },
            { col: 'bowl_overs',        label: 'Ovr',   align: 'center' },
            { col: 'bowl_wickets',      label: 'Wkts',  align: 'center' },
            { col: 'bowl_best_wickets', label: 'Best',  align: 'center' },
            { col: 'bowl_economy',      label: 'Econ',  align: 'center' },
            { col: 'bowl_average',      label: 'Avg',   align: 'center' },
          ].map(({ col, label, align }) => (
            <button key={col} onClick={() => onSort(col)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: 0.7,
              color: sortCol === col ? theme.color : C.gray3, textTransform: 'uppercase',
              textAlign: align, display: 'flex', alignItems: 'center',
              justifyContent: align === 'left' ? 'flex-start' : 'center', gap: 2,
            }}>
              {label}
              {sortCol === col && (sortDir === 'asc' ? <ChevronUp size={9} /> : <ChevronDown size={9} />)}
            </button>
          ))}
        </div>

        {visible.map((s, i) => (
          <motion.div key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT, delay: i * 0.03 }}
            style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 40px 36px 48px 52px 52px',
              padding: '12px 14px', alignItems: 'center',
              borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: i === 0 ? 'rgba(192,132,252,0.14)' : i % 2 !== 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
            }}
          >
            <RankBadge rank={i + 1} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, paddingLeft: 6 }}>
              <Avatar name={s.player_name} size={30} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.player_name}</div>
                <MiniBar value={s.bowl_wickets || 0} max={maxWkts} color={theme.color} />
              </div>
            </div>
            <div style={cellStyle}>{fmt1(s.bowl_overs)}</div>
            <div style={{ ...cellStyle, fontWeight: 900, color: theme.color, fontSize: 15 }}>{fmtN(s.bowl_wickets)}</div>
            <div style={cellStyle}>{fmtBest(s.bowl_best_wickets, s.bowl_best_runs)}</div>
            <div style={{ ...cellStyle, color: parseFloat(s.bowl_economy) < 6 ? '#059669' : parseFloat(s.bowl_economy) < 9 ? '#b45309' : theme.color, fontWeight: 700 }}>{fmt2(s.bowl_economy)}</div>
            <div style={cellStyle}>{fmt2(s.bowl_average)}</div>
          </motion.div>
        ))}
      </div>

      {sorted.length > 8 && (
        <button onClick={() => setShowAll(a => !a)} style={{
          ...PILL_BTN, marginTop: 12, width: '100%', padding: '12px',
          fontFamily: FONT, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <ChevronDown size={14} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          {showAll ? 'Show fewer bowlers' : `Show all ${sorted.length} bowlers`}
        </button>
      )}
    </div>
  )
}

// ── Fielding dashboard ────────────────────────────────────
function FieldingDashboard({ stats, loading }) {
  const theme = TAB_THEMES.fielding
  if (loading) return <SkeletonDash />

  const fielders = stats
    .map(s => ({ ...s, _total: (s.field_catches || 0) + (s.field_run_outs || 0) + (s.field_stumpings || 0) }))
    .filter(s => s._total > 0)
    .sort((a, b) => b._total - a._total)

  if (!fielders.length) return <EmptyState tab="fielding" />

  const maxTotal    = Math.max(...fielders.map(s => s._total))
  const totalCatch  = fielders.reduce((s, p) => s + (p.field_catches  || 0), 0)
  const totalRO     = fielders.reduce((s, p) => s + (p.field_run_outs || 0), 0)

  return (
    <div>
      <motion.div variants={stagger} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}
      >
        <StatCard icon={Shield} label="Catches"  value={totalCatch} sub={`${fielders.length} fielders`} gradient="linear-gradient(135deg, #6d28d9, #8b5cf6)" loading={false} />
        <StatCard icon={Zap}    label="Run Outs" value={totalRO}    sub="direct hits" gradient="linear-gradient(135deg, #be123c, #f43f5e)" loading={false} />
      </motion.div>

      <FieldingChart data={stats} />

      <SectionHeading theme={theme}>🧤 Fielding Contributions</SectionHeading>
      <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 44px 60px 50px 52px', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div />
          {['Player', 'Cat', 'Run Out', 'Stmp', 'Total'].map((h, idx) => (
            <div key={h} style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: C.gray3, textTransform: 'uppercase', letterSpacing: 0.7, textAlign: idx === 0 ? 'left' : 'center' }}>{h}</div>
          ))}
        </div>
        {fielders.map((s, i) => (
          <motion.div key={s.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            style={{ display: 'grid', gridTemplateColumns: '28px 1fr 44px 60px 50px 52px', padding: '12px 14px', borderBottom: i < fielders.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'center', background: i === 0 ? 'rgba(192,132,252,0.14)' : i % 2 !== 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}
          >
            <RankBadge rank={i + 1} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 6 }}>
              <Avatar name={s.player_name} size={30} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark }}>{s.player_name}</div>
                <MiniBar value={s._total} max={maxTotal} color={theme.color} />
              </div>
            </div>
            <div style={cellStyle}>{fmtN(s.field_catches)}</div>
            <div style={cellStyle}>{fmtN(s.field_run_outs)}</div>
            <div style={cellStyle}>{fmtN(s.field_stumpings)}</div>
            <div style={{ ...cellStyle, fontWeight: 900, color: theme.color, fontSize: 15 }}>{s._total}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── Match log ──────────────────────────────────────────────
function MatchLogDashboard({ season }) {
  const [matches, setMatches]     = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [perfs, setPerfs]         = useState([])
  const [loadingM, setLoadingM]   = useState(true)
  const [loadingP, setLoadingP]   = useState(false)

  useEffect(() => {
    async function load() {
      setLoadingM(true)
      const { data: ps } = await supabase.from('match_performances').select('match_id').eq('season', season)
      const ids = [...new Set((ps || []).map(p => p.match_id))]
      if (!ids.length) { setMatches([]); setLoadingM(false); return }
      const { data: ms } = await supabase.from('matches').select('id,opponent,date,venue,format').in('id', ids).order('date', { ascending: false })
      setMatches(ms || [])
      if (ms?.length) { setSelectedId(ms[0].id); loadPerfs(ms[0].id) }
      setLoadingM(false)
    }
    load()
  }, [season])

  async function loadPerfs(mid) {
    setLoadingP(true)
    const { data } = await supabase.from('match_performances').select('*').eq('match_id', mid)
    setPerfs(data || []); setLoadingP(false)
  }

  if (loadingM) return <div style={{ color: C.gray3, fontSize: 13, padding: '20px 0' }}>Loading…</div>
  if (!matches.length) return <EmptyState tab="match log" />

  const theme   = TAB_THEMES.matchlog
  const batters = perfs.filter(p => p.bat_did_bat).sort((a, b) => (b.bat_runs || 0) - (a.bat_runs || 0))
  const bowlers = perfs.filter(p => p.bowl_did_bowl).sort((a, b) => (b.bowl_wickets || 0) - (a.bowl_wickets || 0))

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {matches.map(m => (
          <button key={m.id} onClick={() => { setSelectedId(m.id); loadPerfs(m.id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              borderRadius: 14, border: `1px solid ${m.id === selectedId ? 'rgba(192,132,252,0.6)' : 'rgba(255,255,255,0.10)'}`,
              background: m.id === selectedId ? 'rgba(192,132,252,0.14)' : 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: m.id === selectedId ? '#c084fc' : C.dark }}>vs {m.opponent || 'TBC'}</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.gray3, marginTop: 2 }}>
                {m.date ? new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}{m.venue ? ` · ${m.venue}` : ''}
              </div>
            </div>
            <span style={{ fontFamily: FONT, fontSize: 11, color: C.gray3 }}>{m.format || 'T20'}</span>
          </button>
        ))}
      </div>

      {loadingP ? <Skeleton height={200} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {batters.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7, ...GRAD_TEXT }}>🏏 Batting</div>
              <div style={{ ...GLASS_NESTED, overflow: 'hidden' }}>
                {batters.map((p, i) => {
                  const sr = p.bat_balls ? ((p.bat_runs || 0) * 100 / p.bat_balls).toFixed(0) : '—'
                  return (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 36px 36px 40px', padding: '10px 14px', borderBottom: i < batters.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'center', gap: 0, background: i % 2 !== 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={p.player_name} size={26} />
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark }}>{p.player_name}</span>
                      </div>
                      <div style={{ ...cellStyle, fontWeight: 800, color: C.green }}>{p.bat_runs ?? '—'}{p.bat_not_out ? '*' : ''}</div>
                      <div style={cellStyle}>{p.bat_balls ?? '—'}</div>
                      <div style={cellStyle}>{p.bat_fours ?? '—'}</div>
                      <div style={cellStyle}>{p.bat_sixes ?? '—'}</div>
                      <div style={cellStyle}>{sr}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {bowlers.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7, ...GRAD_TEXT }}>⚡ Bowling</div>
              <div style={{ ...GLASS_NESTED, overflow: 'hidden' }}>
                {bowlers.map((p, i) => {
                  const econ = p.bowl_overs ? (p.bowl_runs / p.bowl_overs).toFixed(2) : '—'
                  return (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 36px 36px 44px', padding: '10px 14px', borderBottom: i < bowlers.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'center', gap: 0, background: i % 2 !== 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={p.player_name} size={26} />
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.dark }}>{p.player_name}</span>
                      </div>
                      <div style={cellStyle}>{p.bowl_overs ?? '—'}</div>
                      <div style={{ ...cellStyle, fontWeight: 800, color: C.red }}>{p.bowl_wickets ?? '—'}</div>
                      <div style={cellStyle}>{p.bowl_runs ?? '—'}</div>
                      <div style={cellStyle}>{econ}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {!batters.length && !bowlers.length && (
            <div style={{ textAlign: 'center', padding: '24px', color: C.gray3, fontSize: 13 }}>No scorecard data for this match.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Stats page ────────────────────────────────────────
const TABS = [
  { id: 'batting',  label: 'Batting',   icon: BarChart2 },
  { id: 'bowling',  label: 'Bowling',   icon: Target },
  { id: 'fielding', label: 'Fielding',  icon: Shield },
  { id: 'matchlog', label: 'Match Log', icon: TrendingUp },
]

export default function Stats() {
  const nav = useNavigate()
  const [season, setSeason]       = useState('2026')
  const [tab, setTab]             = useState('batting')
  const [batting, setBatting]     = useState([])
  const [bowling, setBowling]     = useState([])
  const [fielding, setFielding]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [source, setSource]       = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/player-stats?season=${season}`)
      .then(r => r.json())
      .then(d => {
        setBatting(d.batting   || [])
        setBowling(d.bowling   || [])
        setFielding(d.fielding || [])
        setSource(d.source)
        setUpdatedAt(d.updatedAt)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [season])

  const batStats   = batting.map((p, i) => ({ id: i, player_name: p.name, bat_matches: p.matches, bat_innings: p.innings, bat_runs: p.runs, bat_balls: p.balls, bat_fours: p.fours, bat_sixes: p.sixes, bat_not_out: p.not_outs > 0, bat_average: p.average, bat_strike_rate: p.strike_rate, bat_highest: p.highest, bat_highest_not_out: p.highest_no, bat_fifties: p.fifties, bat_hundreds: p.hundreds }))
  const bowlStats  = bowling.map((p, i) => ({ id: i, player_name: p.name, bowl_matches: p.matches, bowl_overs: p.overs, bowl_balls: p.balls, bowl_runs: p.runs, bowl_wickets: p.wickets, bowl_maidens: p.maidens, bowl_economy: p.economy, bowl_average: p.average, bowl_strike_rate: p.strike_rate, bowl_five_fers: p.five_fers, bowl_best_wickets: p.best_wickets, bowl_best_runs: p.best_runs }))
  const fieldStats = fielding.map((p, i) => ({ id: i, player_name: p.name, field_catches: p.catches, field_run_outs: p.run_outs, field_stumpings: p.stumpings }))

  const activeTheme = TAB_THEMES[tab] || TAB_THEMES.batting

  return (
    <div style={{ minHeight: '100dvh', background: 'transparent', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* Hero */}
      <div style={{
        background: `radial-gradient(ellipse at 80% -10%, ${activeTheme.light}55 0%, transparent 55%), linear-gradient(150deg, rgba(37,99,235,0.24), rgba(124,58,237,0.22) 60%, rgba(20,184,166,0.14))`,
        backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)',
        padding: '28px 20px 0', position: 'relative',
        transition: 'background 400ms ease',
      }}>
        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          <motion.button onClick={() => nav('/app')} whileTap={{ scale: 0.96 }} transition={{ duration: 0.14 }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.55)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 16 }}
          >
            <ArrowLeft size={14} strokeWidth={2} /> Home
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE_OUT }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(0,0,0,.25)', flexShrink: 0 }}>
                  <img src="/logo.png" alt="TUCC" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ display: 'inline-block', fontFamily: FONT, fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 99, padding: '3px 10px', marginBottom: 8 }}>Season Stats</div>
                  <h1 style={{ color: '#fff', fontSize: 23, fontWeight: 900, margin: 0, letterSpacing: -0.4, ...GRAD_TEXT }}>Player Statistics</h1>
                  <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, marginTop: 2 }}>Tamil United CC · {season} Season</div>
                </div>
              </div>
              <select value={season} onChange={e => setSeason(e.target.value)}
                style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,.25)', borderRadius: 10, padding: '8px 14px', fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
              >
                {SEASONS.map(s => <option key={s} value={s} style={{ color: C.dark, background: C.white }}>{s} Season</option>)}
              </select>
            </div>

            {/* Source badge */}
            {source && (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: source === 'live' ? 'rgba(21,128,61,.35)' : 'rgba(233,160,32,.2)',
                  border: `1px solid ${source === 'live' ? 'rgba(21,128,61,.5)' : 'rgba(233,160,32,.4)'}`,
                  borderRadius: 20, padding: '5px 12px',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: source === 'live' ? '#60a5fa' : C.gold, boxShadow: source === 'live' ? '0 0 6px #60a5fa' : 'none' }} />
                  <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: source === 'live' ? '#86efac' : C.gold }}>
                    {source === 'live' ? 'Live · play-cricket.com' : `Excel import · Updated ${updatedAt ? new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}`}
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tab bar — pill style */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 1 }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id
              const tt = TAB_THEMES[id]
              return (
                <button key={id} onClick={() => setTab(id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: '12px 12px 0 0',
                  background: active ? 'rgba(255,255,255,.12)' : 'none',
                  border: 'none',
                  borderBottom: active ? `3px solid ${tt.light}` : '3px solid transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,.5)',
                  cursor: 'pointer', fontFamily: FONT, fontSize: 13,
                  fontWeight: active ? 700 : 500, whiteSpace: 'nowrap',
                  transition: 'all 180ms ease', flexShrink: 0,
                }}>
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Player of the Week */}
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '20px 16px 0', width: '100%' }}>
        <PlayerOfWeek />
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '20px 16px 56px', width: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab + season}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            {tab === 'batting'  && <BattingDashboard  stats={batStats}   loading={loading} />}
            {tab === 'bowling'  && <BowlingDashboard  stats={bowlStats}  loading={loading} />}
            {tab === 'fielding' && <FieldingDashboard stats={fieldStats} loading={loading} />}
            {tab === 'matchlog' && <MatchLogDashboard season={season} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}
