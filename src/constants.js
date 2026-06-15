export const C = {
  // ─── Brand (blue — matches club logo) ───────────────────────────────
  green:      '#3b82f6',   // primary buttons, links, key CTAs (brighter on dark)
  greenDark:  '#0d1b3e',   // hero blocks, header, footer (deep navy — matches public site)
  greenLight: '#60a5fa',   // hover states
  greenBg:    'rgba(59,130,246,0.14)',  // tinted backgrounds, active-nav

  // Gold — accent
  gold:       '#e9a020',

  // ─── Neutrals — DARK THEME (portal re-skin; public site unaffected) ──
  // Card surfaces are translucent so the global liquid-glass rule (blur) shows through.
  white:      'rgba(15,28,60,0.58)',   // ⬅ primary CARD SURFACE (glass)
  bg:         'transparent', // page wrappers transparent — dark texture from App.jsx shows through
  gray1:      'rgba(22,36,80,0.52)',   // raised / alt surface, zebra rows (glass)
  gray2:      'rgba(255,255,255,0.10)', // borders & dividers
  gray3:      'rgba(255,255,255,0.42)', // placeholder text, muted icons
  gray4:      'rgba(255,255,255,0.60)', // secondary text
  gray5:      'rgba(255,255,255,0.82)', // body text
  dark:       '#f1f5f9',   // headings (near-white)

  // ─── Semantic (functional states) ────────────────────────────────────
  red:        '#ef4444',   // danger
  redBg:      'rgba(239,68,68,0.14)',
  ok:         '#22c55e',   // success — "available", wins
  okBg:       'rgba(34,197,94,0.14)',
  blue:       '#3b82f6',
  blueBg:     'rgba(59,130,246,0.14)',

  // ─── Shadows (deeper for dark theme) ─────────────────────────────────
  shadow:     'rgba(0, 0, 0, 0.25)',
  shadowMd:   'rgba(0, 0, 0, 0.35)',
  shadowLg:   'rgba(0, 0, 0, 0.5)',
}

// ─── Dark portal theme tokens (matches public site; lighter-weight) ────
// Used for the authenticated player-portal re-skin.
export const D = {
  bg:        '#0a1228',   // page base (also set in App texture)
  surface:   '#0d1b3e',   // primary card surface
  surface2:  '#111f45',   // raised / nested surface
  surfaceUp: '#16264f',   // hover / elevated
  border:    'rgba(255,255,255,0.08)',
  borderUp:  'rgba(255,255,255,0.16)',
  text:      '#ffffff',                 // headings
  textBody:  'rgba(255,255,255,0.72)',  // body
  textMuted: 'rgba(255,255,255,0.5)',   // secondary
  textDim:   'rgba(255,255,255,0.35)',  // faint labels
  gold:      '#e9a020',
  goldSoft:  'rgba(233,160,32,0.12)',
  blue:      '#3b82f6',
  blueSoft:  'rgba(59,130,246,0.12)',
  green:     '#22c55e',
  greenSoft: 'rgba(34,197,94,0.12)',
  red:       '#ef4444',
  redSoft:   'rgba(239,68,68,0.12)',
  shadow:    '0 4px 20px rgba(0,0,0,0.35)',
  shadowLg:  '0 16px 50px rgba(0,0,0,0.45)',
}

export const FONT = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper', 'Fielder']

export const FORMATS = ['T20', 'ODI', 'T10', 'Hundred', 'Friendly']

export const ADMIN_EMAIL    = import.meta.env.VITE_ADMIN_EMAIL    || 'suthan07@gmail.com'
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'TUCC@2025'

export const MAX_WIDTH = 680
