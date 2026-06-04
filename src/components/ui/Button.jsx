import { C, FONT } from '../../constants'

const sizes = {
  sm:   { padding: '8px 16px',  fontSize: 13, minHeight: 36 },
  md:   { padding: '10px 20px', fontSize: 15, minHeight: 44 },
  lg:   { padding: '14px 28px', fontSize: 16, minHeight: 48 },
  full: { padding: '14px 28px', fontSize: 16, minHeight: 48, width: '100%' },
}

const variants = {
  primary: { background: C.green,  color: C.white, border: 'none' },
  danger:  { background: C.red,    color: C.white, border: 'none' },
  ghost:   { background: 'transparent', color: C.green, border: `1.5px solid ${C.green}` },
  subtle:  { background: C.greenBg, color: C.green, border: 'none' },
  gold:    { background: C.gold,   color: C.dark,  border: 'none' },
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
        transition: 'opacity .15s, box-shadow .15s',
        opacity: disabled ? 0.55 : 1,
        boxShadow: disabled ? 'none' : '0 1px 4px rgba(0,0,0,.10)',
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
