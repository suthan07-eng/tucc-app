import { C, FONT } from '../../constants'

const VARIANTS = {
  available:   { bg: C.okBg,    color: C.ok,    label: 'Available' },
  unavailable: { bg: C.redBg,   color: C.red,   label: 'Unavailable' },
  pending:     { bg: C.gray1,   color: C.gray4, label: 'Pending' },
  info:        { bg: C.blueBg,  color: C.blue,  label: 'Info' },
  admin:       { bg: C.greenBg, color: C.green, label: 'Admin' },
}

export default function Badge({ variant = 'pending', children, style }) {
  const v = VARIANTS[variant] ?? VARIANTS.pending
  return (
    <span
      style={{
        background: v.bg,
        color: v.color,
        padding: '3px 10px',
        borderRadius: 99,
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children ?? v.label}
    </span>
  )
}
