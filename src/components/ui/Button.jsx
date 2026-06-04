import { C, FONT } from '../../constants'

const sizes = {
  sm:   { padding: '7px 16px',  fontSize: 13, minHeight: 34, letterSpacing: 0.1 },
  md:   { padding: '10px 22px', fontSize: 15, minHeight: 44, letterSpacing: 0.1 },
  lg:   { padding: '13px 28px', fontSize: 16, minHeight: 50, letterSpacing: 0.1 },
  full: { padding: '13px 28px', fontSize: 16, minHeight: 50, width: '100%', letterSpacing: 0.1 },
}

const variants = {
  primary: { background: C.green,       color: C.white, border: 'none' },
  danger:  { background: C.red,         color: C.white, border: 'none' },
  ghost:   { background: 'transparent', color: C.green, border: `1.5px solid ${C.green}` },
  subtle:  { background: C.greenBg,     color: C.green, border: 'none' },
  gold:    { background: C.gold,        color: C.dark,  border: 'none' },
}

// Inject global button active/hover styles once
const STYLE_ID = 'tucc-button-styles'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    .tucc-btn {
      transition: transform 160ms cubic-bezier(0.23,1,0.32,1),
                  opacity 150ms ease,
                  box-shadow 150ms ease,
                  background 150ms ease !important;
    }
    @media (hover: hover) and (pointer: fine) {
      .tucc-btn:not(:disabled):hover {
        filter: brightness(1.07);
        box-shadow: 0 4px 12px rgba(0,0,0,.15) !important;
        transform: translateY(-1px);
      }
    }
    .tucc-btn:not(:disabled):active {
      transform: scale(0.97) !important;
      box-shadow: 0 1px 3px rgba(0,0,0,.10) !important;
      filter: brightness(0.97);
    }
  `
  document.head.appendChild(el)
}

export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled, type = 'button', style, ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="tucc-btn"
      style={{
        fontFamily: FONT,
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        letterSpacing: 0.2,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        boxShadow: disabled ? 'none' : `0 1px 4px ${C.shadow}, 0 0 0 0 transparent`,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
