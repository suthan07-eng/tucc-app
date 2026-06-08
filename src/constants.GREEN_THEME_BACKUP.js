export const C = {
  // Primary greens — slightly more saturated and vivid
  green:      '#2563eb',
  greenDark:  '#1e3a8a',
  greenLight: '#1d4ed8',
  greenBg:    '#eff6ff',

  // Gold — slightly richer, less orange
  gold:       '#e9a020',

  // Neutrals — warm-tinted grays (consistent hue, not mixed warm/cool)
  white:      '#ffffff',
  bg:         '#f8fafc',   // slight green tint for cohesion
  gray1:      '#f1f5f2',   // green-tinted light gray
  gray2:      '#dde8e2',   // green-tinted border
  gray3:      '#8fa898',   // muted green-gray
  gray4:      '#5c7468',   // medium green-gray
  gray5:      '#2d3f38',   // dark green-gray (replaces blue-gray #374151)
  dark:       '#0f172a',   // near-black with green tint

  // Semantic
  red:        '#c8302a',
  redBg:      '#fdf1f0',
  ok:         '#15803d',
  okBg:       '#edfaf3',
  blue:       '#2563eb',
  blueBg:     '#eff6ff',

  // Shadows — tinted with green hue instead of pure black
  shadow:     'rgba(15, 56, 37, 0.08)',
  shadowMd:   'rgba(15, 56, 37, 0.12)',
  shadowLg:   'rgba(15, 56, 37, 0.18)',
}

export const FONT = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper', 'Fielder']

export const FORMATS = ['T20', 'ODI', 'T10', 'Hundred', 'Friendly']

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'suthan07@gmail.com'
export const ADMIN_PASSWORD = 'TUCC@2025'

export const MAX_WIDTH = 680
