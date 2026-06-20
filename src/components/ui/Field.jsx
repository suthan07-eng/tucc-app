import { C, FONT } from '../../constants'
import { usePalette } from './theme'

export default function Field({ label, error, required, hint, children, style }) {
  const p = usePalette()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: p.label }}>
          {label}
          {required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <span style={{ fontFamily: FONT, fontSize: 12, color: p.muted }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.red }}>{error}</span>
      )}
    </div>
  )
}

function useInputBase(error) {
  const p = usePalette()
  return {
    height: 48,
    padding: '0 14px',
    border: `1.5px solid ${error ? C.red : p.inputBorder}`,
    borderRadius: 12,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: 500,
    color: p.text,
    background: p.inputBg,
    width: '100%',
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
    boxSizing: 'border-box',
  }
}

export function Input({ error, style, ...props }) {
  const base = useInputBase(error)
  return <input style={{ ...base, ...style }} {...props} />
}

export function Select({ error, children, style, ...props }) {
  const base = useInputBase(error)
  return <select style={{ ...base, cursor: 'pointer', ...style }} {...props}>{children}</select>
}

export function Textarea({ error, style, ...props }) {
  const p = usePalette()
  return (
    <textarea
      style={{
        padding: '10px 12px',
        border: `1.5px solid ${error ? C.red : p.inputBorder}`,
        borderRadius: 8,
        fontFamily: FONT,
        fontSize: 15,
        color: p.text,
        background: p.inputBg,
        width: '100%',
        resize: 'vertical',
        minHeight: 88,
        lineHeight: 1.5,
        ...style,
      }}
      {...props}
    />
  )
}
