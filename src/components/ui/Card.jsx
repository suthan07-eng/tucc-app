import { usePalette, useUITheme } from './theme'
import { useSkinTokens } from './portalSkin'

export default function Card({ children, style, hover = false, glow, ...props }) {
  const p = usePalette()
  const theme = useUITheme()
  const skin = useSkinTokens()

  // ── Admin (light) — unchanged classic card ──
  if (theme !== 'dark') {
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

  // ── Portal (dark) — skinned frosted glass with inner highlight + ambient depth ──
  const c = skin.card
  return (
    <div
      className={`spatial-card${hover ? ' spatial-hover' : ''}`}
      style={{
        position: 'relative',
        background: c.background,
        borderRadius: c.radius,
        border: c.border,
        boxShadow: c.boxShadow,
        padding: 24,
        ...style,
      }}
      {...props}
    >
      {glow && (
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, borderRadius: c.radius, pointerEvents: 'none',
            background: `radial-gradient(120% 70% at 50% -10%, ${glow}, transparent 60%)`,
          }}
        />
      )}
      {glow ? <div style={{ position: 'relative' }}>{children}</div> : children}
    </div>
  )
}
