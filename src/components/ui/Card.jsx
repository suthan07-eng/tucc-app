import { C } from '../../constants'

export default function Card({ children, style, ...props }) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,.07)',
        border: `1px solid ${C.gray2}`,
        padding: 24,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
