import { C, FONT } from '../../constants'
import { useUITheme } from './theme'
import { useSkinTokens } from './portalSkin'

const sizes = {
  sm:   { padding: '8px 16px',   fontSize: 13, minHeight: 36,  letterSpacing: 0.1,  borderRadius: 10 },
  md:   { padding: '11px 22px',  fontSize: 15, minHeight: 46,  letterSpacing: 0.1,  borderRadius: 12 },
  lg:   { padding: '14px 28px',  fontSize: 16, minHeight: 52,  letterSpacing: 0.15, borderRadius: 14 },
  full: { padding: '14px 28px',  fontSize: 16, minHeight: 52,  letterSpacing: 0.15, borderRadius: 14, width: '100%' },
}

// Admin (light) — original flat variants
const variantsLight = {
  primary: { background: C.green,        color: '#fff',  border: 'none' },
  danger:  { background: C.red,          color: '#fff',  border: 'none' },
  ghost:   { background: 'transparent',  color: C.green,  border: `1.5px solid ${C.green}` },
  subtle:  { background: C.greenBg,      color: C.green,  border: `1px solid ${C.gray2}` },
  gold:    { background: C.gold,         color: '#1a0a00', border: 'none' },
}

// Portal (dark) — Spatial glass variants with inner highlight + soft glow
const variantsDark = {
  primary: { background: 'linear-gradient(180deg, #4f8ff7, #2563eb)', color: '#fff',     border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 10px 24px -8px rgba(37,99,235,0.65), inset 0 1px 0 rgba(255,255,255,0.35)' },
  danger:  { background: 'linear-gradient(180deg, #f26d6d, #dc2626)', color: '#fff',     border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 10px 24px -8px rgba(220,38,38,0.55), inset 0 1px 0 rgba(255,255,255,0.30)' },
  ghost:   { background: 'rgba(255,255,255,0.06)', color: C.greenLight, border: `1.5px solid ${C.greenLight}`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' },
  subtle:  { background: 'rgba(255,255,255,0.08)', color: '#fff',       border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' },
  gold:    { background: 'linear-gradient(180deg, #f6b73c, #e9a020)', color: '#1a0a00', border: '1px solid rgba(255,255,255,0.30)', boxShadow: '0 10px 24px -8px rgba(233,160,32,0.6), inset 0 1px 0 rgba(255,255,255,0.5)' },
}

// Inject global button styles once
const STYLE_ID = 'tucc-button-styles'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    .tucc-btn {
      transition: transform 160ms cubic-bezier(0.23,1,0.32,1),
                  opacity 150ms ease,
                  box-shadow 150ms ease,
                  filter 150ms ease !important;
      -webkit-tap-highlight-color: transparent;
    }
    @media (hover: hover) and (pointer: fine) {
      .tucc-btn:not(:disabled):hover {
        filter: brightness(1.08);
        box-shadow: 0 6px 16px rgba(15,56,37,.22) !important;
        transform: translateY(-1px);
      }
    }
    .tucc-btn:not(:disabled):active {
      transform: scale(0.965) !important;
      box-shadow: 0 1px 4px rgba(15,56,37,.12) !important;
      filter: brightness(0.96);
    }
    .tucc-btn:focus-visible {
      outline: 3px solid rgba(233,160,32,.6);
      outline-offset: 2px;
    }
    .tucc-btn:disabled {
      cursor: not-allowed;
      pointer-events: none;
    }
    /* Loading spinner */
    @keyframes tucc-spin {
      to { transform: rotate(360deg); }
    }
    .tucc-btn-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: tucc-spin 0.65s linear infinite;
      flex-shrink: 0;
    }
  `
  document.head.appendChild(el)
}

export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled, loading, type = 'button', style, ...props
}) {
  const isDisabled = disabled || loading
  const theme = useUITheme()
  const skin = useSkinTokens()
  // In the portal, primary + gold follow the active skin; other variants stay generic-dark
  const variants = theme === 'dark'
    ? { ...variantsDark, primary: skin.btnPrimary, gold: skin.btnGold }
    : variantsLight
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className="tucc-btn"
      aria-busy={loading || undefined}
      style={{
        fontFamily: FONT,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: isDisabled ? (loading ? 0.75 : 0.48) : 1,
        boxShadow: isDisabled ? 'none' : `0 1px 3px ${C.shadow}`,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {loading && <span className="tucc-btn-spinner" />}
      {children}
    </button>
  )
}
