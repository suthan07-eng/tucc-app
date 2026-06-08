export const C = {
  // ─── Brand (blue — matches club logo) ───────────────────────────────
  green:      '#2563eb',   // brand-600  — primary buttons, links, key CTAs  (was: #2563eb green)
  greenDark:  '#1e3a8a',   // brand-900  — hero blocks, header, footer        (was: #1e3a8a dark green)
  greenLight: '#1d4ed8',   // brand-700  — hover states                       (was: #1d4ed8 light green)
  greenBg:    '#eff6ff',   // brand-50   — tinted backgrounds, active-nav      (was: #eff6ff green tint)

  // Gold — keep as accent (unchanged)
  gold:       '#e9a020',

  // ─── Neutrals (cool slate — cohesive with blue) ──────────────────────
  white:      '#ffffff',
  bg:         'transparent', // page wrappers transparent — texture from App.jsx fixed layer shows through
  gray1:      '#f1f5f9',   // neutral-100 — alt surfaces, zebra rows           (was: #f1f5f2 green-tinted)
  gray2:      '#e2e8f0',   // neutral-200 — borders & dividers                 (was: #dde8e2 green-tinted)
  gray3:      '#94a3b8',   // neutral-400 — placeholder text, muted icons      (was: #8fa898 green-gray)
  gray4:      '#64748b',   // neutral-500 — secondary text                     (was: #5c7468 green-gray)
  gray5:      '#334155',   // neutral-700 — body text                          (was: #2d3f38 dark green-gray)
  dark:       '#0f172a',   // neutral-900 — headings                           (was: #0f172a near-black green)

  // ─── Semantic (functional states — green survives only here) ─────────
  red:        '#dc2626',   // danger
  redBg:      '#fee2e2',
  ok:         '#16a34a',   // success — "available", wins (only green allowed)
  okBg:       '#dcfce7',
  blue:       '#2563eb',
  blueBg:     '#eff6ff',

  // ─── Shadows (tinted with brand-blue hue) ────────────────────────────
  shadow:     'rgba(30, 58, 138, 0.07)',
  shadowMd:   'rgba(30, 58, 138, 0.11)',
  shadowLg:   'rgba(30, 58, 138, 0.18)',
}

export const FONT = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper', 'Fielder']

export const FORMATS = ['T20', 'ODI', 'T10', 'Hundred', 'Friendly']

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'suthan07@gmail.com'
export const ADMIN_PASSWORD = 'TUCC@2025'

export const MAX_WIDTH = 680
