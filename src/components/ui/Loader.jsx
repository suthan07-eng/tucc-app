import { C } from '../../constants'
import { usePalette } from './theme'

export function Skeleton({ height = 16, width = '100%', borderRadius = 8, style }) {
  const p = usePalette()
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        background: `linear-gradient(90deg, ${p.skel1} 25%, ${p.skel2} 50%, ${p.skel1} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite linear',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

export default function Loader({ size = 32 }) {
  const p = usePalette()
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid ${p.border}`,
          borderTopColor: C.gold,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  )
}
