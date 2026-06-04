import { C, FONT } from '../../constants'

export default function Field({ label, error, required, hint, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.gray5 }}>
          {label}
          {required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.gray3 }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.red }}>{error}</span>
      )}
    </div>
  )
}

const inputBase = (error) => ({
  height: 46,
  padding: '0 14px',
  border: `1.5px solid ${error ? C.red : C.gray2}`,
  borderRadius: 10,
  fontFamily: FONT,
  fontSize: 15,
  color: C.dark,
  background: C.white,
  width: '100%',
  outline: 'none',
  transition: 'border-color .15s',
  boxSizing: 'border-box',
})

export function Input({ error, style, ...props }) {
  return (
    <input
      style={{ ...inputBase(error), ...style }}
      {...props}
    />
  )
}

export function Select({ error, children, style, ...props }) {
  return (
    <select
      style={{ ...inputBase(error), cursor: 'pointer', ...style }}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ error, style, ...props }) {
  return (
    <textarea
      style={{
        padding: '10px 12px',
        border: `1.5px solid ${error ? C.red : C.gray2}`,
        borderRadius: 8,
        fontFamily: FONT,
        fontSize: 15,
        color: C.dark,
        background: C.white,
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
