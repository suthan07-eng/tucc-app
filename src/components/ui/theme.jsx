import { createContext, useContext } from 'react'

// UI theme for shared components. Default 'dark' (public site + player portal).
// The admin panel wraps its tree in value="light" to keep its original look.
export const ThemeContext = createContext('dark')
export function useUITheme() { return useContext(ThemeContext) }

export const PALETTES = {
  dark: {
    surface:    'rgba(15,28,60,0.58)',          // glass card (matches portal)
    border:     'rgba(255,255,255,0.08)',
    shadow:     '0 8px 30px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.4)',
    text:       '#f1f5f9',
    label:      'rgba(255,255,255,0.78)',
    muted:      'rgba(255,255,255,0.5)',
    inputBg:    'rgba(255,255,255,0.05)',
    inputBorder:'rgba(255,255,255,0.14)',
    skel1:      'rgba(255,255,255,0.06)',
    skel2:      'rgba(255,255,255,0.12)',
  },
  light: {
    surface:    '#ffffff',
    border:     '#e2e8f0',
    shadow:     '0 2px 12px rgba(30,58,138,0.07), 0 1px 3px rgba(30,58,138,0.11)',
    text:       '#0f172a',
    label:      '#334155',
    muted:      '#64748b',
    inputBg:    '#ffffff',
    inputBorder:'#e2e8f0',
    skel1:      '#e2e8f0',
    skel2:      '#f1f5f9',
  },
}

export function usePalette() { return PALETTES[useUITheme()] || PALETTES.dark }
