import { usePalette } from './theme'

export default function Card({ children, style, ...props }) {
  const p = usePalette()
  return (
    <div
      style={{
        background: p.surface,
        borderRadius: 18,
        boxShadow: p.shadow,
        border: `1px solid ${p.border}`,
        padding: 24,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
