import { C } from '../../constants'

export default function Card({ children, style, ...props }) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 18,
        boxShadow: `0 2px 12px ${C.shadow}, 0 1px 3px ${C.shadowMd}`,
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
