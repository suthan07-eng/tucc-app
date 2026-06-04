import { C } from '../../constants'

export function Skeleton({ height = 16, width = '100%', borderRadius = 8, style }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        background: `linear-gradient(90deg, ${C.gray2} 25%, ${C.gray1} 50%, ${C.gray2} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite linear',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

export default function Loader({ size = 32 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid ${C.gray2}`,
          borderTopColor: C.green,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  )
}
