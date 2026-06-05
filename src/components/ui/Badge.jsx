import { C, FONT } from '../../constants'

const VARIANTS = {
  available:   { bg: C.okBg,    color: C.ok,    border: '#bbf7d0', label: 'Available'   },
  unavailable: { bg: C.redBg,   color: C.red,   border: '#fecaca', label: 'Unavailable' },
  pending:     { bg: C.gray1,   color: C.gray4, border: C.gray2,   label: 'Pending'     },
  info:        { bg: C.blueBg,  color: C.blue,  border: '#bfdbfe', label: 'Info'        },
  admin:       { bg: C.greenBg, color: C.green, border: '#86efac', label: 'Admin'       },
}

export default function Badge({ variant = 'pending', children, style }) {
  const v = VARIANTS[variant] ?? VARIANTS.pending
  return (
    <span
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        padding: '3px 9px',
        borderRadius: 6,
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children ?? v.label}
    </span>
  )
}
