import { useSyncExternalStore } from 'react'

/* ────────────────────────────────────────────────────────────────────────────
   PORTAL SKIN — swappable visual themes for the player portal.
   A lightweight external store lets a floating switcher flip the whole portal
   look live (cards, buttons, background) so the user can pick a favourite.
   Portal-only: admin + public site never read this.
   ──────────────────────────────────────────────────────────────────────────── */

const KEY = 'tucc_portal_skin'
const DEFAULT = 'bold'   // chosen portal theme

let current = DEFAULT
try { const s = sessionStorage.getItem(KEY); if (s === 'neon' || s === 'gold' || s === 'bold') current = s } catch { /* ssr */ }

const listeners = new Set()
export function getSkin() { return current }
export function setSkin(s) {
  if (!SKINS[s] || s === current) return
  current = s
  try { sessionStorage.setItem(KEY, s) } catch { /* ignore */ }
  listeners.forEach(l => l())
}
function subscribe(l) { listeners.add(l); return () => listeners.delete(l) }

export function useSkin() { return useSyncExternalStore(subscribe, getSkin, getSkin) }
export function useSkinTokens() { return SKINS[useSkin()] || SKINS[DEFAULT] }

export const SKIN_ORDER = ['neon', 'gold', 'bold']

export const SKINS = {
  // ── 1. NEON / SPORTY — electric, high-energy ──────────────────────────────
  neon: {
    name: 'Neon',
    accent: '#22d3ee',
    headingGrad: 'linear-gradient(92deg, #22d3ee, #3b82f6 55%, #a855f7)',
    orbs: [
      { c: 'rgba(34,211,238,0.42)',  size: 600, top: '-12%', left: '-8%',  anim: 'spatial-orb-a 24s ease-in-out infinite' },
      { c: 'rgba(168,85,247,0.38)',  size: 560, top: '24%',  left: '64%',  anim: 'spatial-orb-b 30s ease-in-out infinite' },
      { c: 'rgba(59,130,246,0.36)',  size: 520, top: '62%',  left: '-6%',  anim: 'spatial-orb-c 28s ease-in-out infinite' },
      { c: 'rgba(236,72,153,0.26)',  size: 440, top: '72%',  left: '66%',  anim: 'spatial-orb-a 34s ease-in-out infinite' },
    ],
    grain: 0.05,
    card: {
      background: 'linear-gradient(165deg, rgba(13,22,48,0.78), rgba(8,15,35,0.72))',
      border: '1px solid rgba(34,211,238,0.30)',
      boxShadow: '0 0 0 1px rgba(34,211,238,0.08), 0 26px 60px -22px rgba(4,16,32,0.85), 0 0 38px -14px rgba(34,211,238,0.55), inset 0 1px 0 rgba(255,255,255,0.14)',
      radius: 20,
    },
    btnPrimary: { background: 'linear-gradient(180deg, #2dd4ee, #2563eb)', color: '#04121c', border: '1px solid rgba(255,255,255,0.28)', boxShadow: '0 0 30px -6px rgba(34,211,238,0.7), inset 0 1px 0 rgba(255,255,255,0.5)' },
    btnGold:    { background: 'linear-gradient(180deg, #f6b73c, #e9a020)', color: '#1a0a00', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 0 26px -8px rgba(233,160,32,0.6), inset 0 1px 0 rgba(255,255,255,0.5)' },
  },

  // ── 2. GOLD LUXE — elegant deep-navy + gold ───────────────────────────────
  gold: {
    name: 'Gold Luxe',
    accent: '#e9a020',
    headingGrad: 'linear-gradient(92deg, #fbe3a8, #e9a020)',
    orbs: [
      { c: 'rgba(233,160,32,0.26)',  size: 560, top: '-10%', left: '-6%',  anim: 'spatial-orb-a 34s ease-in-out infinite' },
      { c: 'rgba(245,158,11,0.18)',  size: 520, top: '30%',  left: '66%',  anim: 'spatial-orb-b 40s ease-in-out infinite' },
      { c: 'rgba(30,58,138,0.30)',   size: 600, top: '66%',  left: '-8%',  anim: 'spatial-orb-c 38s ease-in-out infinite' },
      { c: 'rgba(233,160,32,0.12)',  size: 420, top: '74%',  left: '68%',  anim: 'spatial-orb-a 44s ease-in-out infinite' },
    ],
    grain: 0.06,
    card: {
      background: 'linear-gradient(165deg, rgba(20,31,62,0.88), rgba(11,20,44,0.84))',
      border: '1px solid rgba(233,160,32,0.30)',
      boxShadow: '0 26px 64px -24px rgba(0,0,0,0.62), 0 0 30px -16px rgba(233,160,32,0.3), inset 0 1px 0 rgba(233,160,32,0.20)',
      radius: 18,
    },
    btnPrimary: { background: 'linear-gradient(180deg, #f6b73c, #e9a020)', color: '#1a0a00', border: '1px solid rgba(255,255,255,0.32)', boxShadow: '0 12px 28px -8px rgba(233,160,32,0.6), inset 0 1px 0 rgba(255,255,255,0.55)' },
    btnGold:    { background: 'linear-gradient(180deg, #f6b73c, #e9a020)', color: '#1a0a00', border: '1px solid rgba(255,255,255,0.32)', boxShadow: '0 12px 28px -8px rgba(233,160,32,0.6), inset 0 1px 0 rgba(255,255,255,0.55)' },
  },

  // ── 3. BOLD GRADIENT — vivid, colourful, punchy ───────────────────────────
  bold: {
    name: 'Bold',
    accent: '#c084fc',
    headingGrad: 'linear-gradient(92deg, #60a5fa, #c084fc 60%, #f472b6)',
    orbs: [
      { c: 'rgba(37,99,235,0.50)',   size: 620, top: '-12%', left: '-10%', anim: 'spatial-orb-a 22s ease-in-out infinite' },
      { c: 'rgba(124,58,237,0.46)',  size: 580, top: '22%',  left: '60%',  anim: 'spatial-orb-b 28s ease-in-out infinite' },
      { c: 'rgba(20,184,166,0.34)',  size: 500, top: '60%',  left: '-8%',  anim: 'spatial-orb-c 26s ease-in-out infinite' },
      { c: 'rgba(236,72,153,0.34)',  size: 480, top: '70%',  left: '64%',  anim: 'spatial-orb-a 32s ease-in-out infinite' },
    ],
    grain: 0.04,
    card: {
      background: 'linear-gradient(150deg, rgba(37,99,235,0.24), rgba(124,58,237,0.22) 60%, rgba(20,184,166,0.14))',
      border: '1px solid rgba(255,255,255,0.18)',
      boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)',
      radius: 22,
    },
    btnPrimary: { background: 'linear-gradient(180deg, #818cf8, #6d28d9)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)', boxShadow: '0 12px 30px -8px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.4)' },
    btnGold:    { background: 'linear-gradient(180deg, #f6b73c, #e9a020)', color: '#1a0a00', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 12px 28px -8px rgba(233,160,32,0.55), inset 0 1px 0 rgba(255,255,255,0.5)' },
  },
}
