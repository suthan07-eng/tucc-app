import { C, FONT } from '../../constants'

const PALETTE = [C.green, '#9333ea', '#2563eb', '#d97706', '#0891b2', '#be185d', '#059669', '#7c3aed']

function colorFor(name = '') {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0xffffff
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Avatar({ name = '', size = 36, style }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colorFor(name),
        color: C.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        flexShrink: 0,
        userSelect: 'none',
        ...style,
      }}
    >
      {initials(name)}
    </div>
  )
}
