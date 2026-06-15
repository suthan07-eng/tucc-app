import { C, FONT } from '../../constants'

// Richer, more distinct palette
const PALETTE = [
  '#2563eb', // brand green
  '#7c3aed', // violet
  '#0369a1', // ocean blue
  '#b45309', // amber
  '#0891b2', // cyan
  '#be185d', // rose
  '#059669', // emerald
  '#6d28d9', // purple
  '#dc2626', // red
  '#0f766e', // teal
]

function colorFor(name = '') {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0xffffff
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// Squircle border-radius (softer than circle, more distinctive than rounded square)
function squircleRadius(size) {
  return Math.round(size * 0.32)
}

export default function Avatar({ name = '', size = 36, shape = 'circle', style }) {
  const radius = shape === 'squircle' ? squircleRadius(size) : '50%'
  const bg = colorFor(name)

  return (
    <div
      aria-label={name || 'Player avatar'}
      role="img"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: Math.round(size * 0.36),
        letterSpacing: 0.3,
        flexShrink: 0,
        userSelect: 'none',
        boxShadow: `0 1px 3px rgba(0,0,0,.2)`,
        ...style,
      }}
    >
      {initials(name)}
    </div>
  )
}
