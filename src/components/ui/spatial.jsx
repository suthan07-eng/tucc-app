import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FONT } from '../../constants'
import { useSkinTokens, useSkin, setSkin, SKINS, SKIN_ORDER } from './portalSkin'

/* ────────────────────────────────────────────────────────────────────────────
   SPATIAL UI — visionOS-inspired design layer for the player portal.
   Depth via layered translucent glass, drifting light orbs, concentric radii,
   inner highlights and soft ambient glow. Dark/portal only — admin (light)
   and the public site are untouched.
   ──────────────────────────────────────────────────────────────────────────── */

export const SPATIAL_EASE = [0.22, 1, 0.36, 1]

// Glass token presets (use on translucent surfaces so the global frost rule applies)
export const glass = {
  // outer "tray" shell of a double-bezel card
  shell: {
    background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 24px 60px -20px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.16)',
  },
  // inner core surface
  core: {
    background: 'linear-gradient(165deg, rgba(19,33,68,0.72), rgba(11,21,46,0.66))',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
  },
}

// Inject global spatial CSS once
const STYLE_ID = 'tucc-spatial-styles'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes spatial-orb-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(6vw,4vh,0) scale(1.12); } }
    @keyframes spatial-orb-b { 0%,100% { transform: translate3d(0,0,0) scale(1.05); } 50% { transform: translate3d(-7vw,-5vh,0) scale(0.92); } }
    @keyframes spatial-orb-c { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(5vw,-6vh,0) scale(1.15); } }
    @keyframes spatial-sheen { 0% { background-position: -180% 0; } 100% { background-position: 180% 0; } }
    @keyframes spatial-hero-in { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: scale(1); } }
    /* Portrait backdrop on any portrait screen (phone + tablet portrait), wide on landscape */
    .spatial-hero-mobile { display: none; }
    @media (orientation: portrait) {
      .spatial-hero-desktop { display: none; }
      .spatial-hero-mobile { display: block; }
    }

    /* Frosted-glass cards — concentric, machined feel. Hover gives a gentle lift. */
    .spatial-card {
      -webkit-backdrop-filter: blur(22px) saturate(165%);
      backdrop-filter: blur(22px) saturate(165%);
      transition: transform 520ms cubic-bezier(0.22,1,0.36,1),
                  box-shadow 520ms cubic-bezier(0.22,1,0.36,1),
                  border-color 300ms ease;
      will-change: transform;
    }
    @media (hover: hover) and (pointer: fine) {
      .spatial-card.spatial-hover:hover {
        transform: translateY(-4px);
        box-shadow: 0 34px 80px -24px rgba(0,0,0,0.62), 0 6px 16px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.20);
        border-color: rgba(255,255,255,0.18);
      }
    }
    /* Magnetic glass button */
    .spatial-btn {
      position: relative; overflow: hidden;
      -webkit-tap-highlight-color: transparent;
      transition: transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms ease, filter 200ms ease;
    }
    @media (hover: hover) and (pointer: fine) {
      .spatial-btn:not(:disabled):hover { transform: translateY(-2px); filter: brightness(1.06); }
    }
    .spatial-btn:not(:disabled):active { transform: scale(0.97); }

    @media (prefers-reduced-motion: reduce) {
      .spatial-orb { animation: none !important; }
      .spatial-card { transition: none !important; }
    }
  `
  document.head.appendChild(el)
}

/* ── Drifting orb background (fixed, behind content, portal only) ── */
export function SpatialBackground({ image, video, scrim }) {
  const skin = useSkinTokens()
  const orbs = skin.orbs
  const zoomRef = useRef(null)
  const scrimBg = scrim || 'linear-gradient(to bottom, rgba(10,18,40,0.12) 0%, rgba(10,18,40,0.18) 50%, rgba(10,18,40,0.44) 100%)'

  // Scroll-driven zoom: zoom IN to the subject on scroll down, OUT on scroll up
  useEffect(() => {
    const el = zoomRef.current
    if (!el) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const s = 1 + Math.min((window.scrollY || 0) / 1500, 0.32)
      el.style.transform = `scale(${s})`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [image, video])

  const vidStyle = {
    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
    opacity: 1, animation: 'spatial-hero-in 1.1s cubic-bezier(0.22,1,0.36,1) both',
  }
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* cinematic cricket hero — animated video where provided, else image; portrait on mobile, wide on desktop */}
      {(video || image) && (
        <>
          <div ref={zoomRef} style={{ position: 'absolute', inset: 0, willChange: 'transform', transformOrigin: 'center center', transition: 'transform 120ms linear' }}>
            {video ? (
              <>
                <video key={video} className="spatial-hero spatial-hero-desktop" style={vidStyle}
                  autoPlay muted loop playsInline preload="auto" poster={image}>
                  <source src={video} type="video/mp4" />
                </video>
                <video key={`${video}-m`} className="spatial-hero spatial-hero-mobile" style={vidStyle}
                  autoPlay muted loop playsInline preload="auto" poster={image && image.replace('.webp', '-m.webp')}>
                  <source src={video.replace('.mp4', '-m.mp4')} type="video/mp4" />
                </video>
              </>
            ) : (
              <>
                <div key={image} className="spatial-hero spatial-hero-desktop" style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center',
                  opacity: 1, animation: 'spatial-hero-in 1.1s cubic-bezier(0.22,1,0.36,1) both',
                }} />
                <div key={`${image}-m`} className="spatial-hero spatial-hero-mobile" style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${image.replace('.webp', '-m.webp')})`, backgroundSize: 'cover', backgroundPosition: 'center',
                  opacity: 1, animation: 'spatial-hero-in 1.1s cubic-bezier(0.22,1,0.36,1) both',
                }} />
              </>
            )}
          </div>
          {/* readability scrim — kept light so the cricket image stays visible behind every section incl. footer */}
          <div style={{ position: 'absolute', inset: 0, background: scrimBg }} />
        </>
      )}
      {orbs.map((o, i) => (
        <div key={`${skin.name}-${i}`} className="spatial-orb" style={{
          position: 'absolute', top: o.top, left: o.left,
          width: o.size, height: o.size, borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%, ${o.c}, transparent 70%)`,
          filter: 'blur(34px)', animation: o.anim,
        }} />
      ))}
      {/* fine grain for a physical, non-flat feel */}
      <div style={{
        position: 'absolute', inset: 0, opacity: skin.grain ?? 0.04, mixBlendMode: 'overlay',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
      }} />
    </div>
  )
}

/* ── Eyebrow + title section header ── */
export function SectionHeader({ eyebrow, title, subtitle, icon, align = 'left', style }) {
  return (
    <div style={{ textAlign: align, marginBottom: 18, ...style }}>
      {eyebrow && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 999,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          fontFamily: FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: 2,
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)',
        }}>
          {icon}{eyebrow}
        </span>
      )}
      <h1 style={{
        margin: '12px 0 0', fontFamily: FONT, fontWeight: 800,
        fontSize: 'clamp(24px, 6vw, 34px)', letterSpacing: -0.8, lineHeight: 1.08,
        color: '#fff', background: 'linear-gradient(180deg,#ffffff,rgba(255,255,255,0.74))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ margin: '8px 0 0', fontFamily: FONT, fontSize: 14.5, lineHeight: 1.55,
          color: 'rgba(255,255,255,0.55)', maxWidth: 560, ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : null) }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

/* ── Double-bezel glass panel (outer tray + inner core) ── */
export function GlassPanel({ children, hover = false, glow, padding = 20, radius = 24, style, ...props }) {
  return (
    <div className={`spatial-card${hover ? ' spatial-hover' : ''}`} style={{
      position: 'relative', borderRadius: radius, padding: 6, ...glass.shell, ...style,
    }} {...props}>
      {glow && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: radius,
          background: `radial-gradient(120% 80% at 50% -10%, ${glow}, transparent 60%)`, pointerEvents: 'none' }} />
      )}
      <div style={{ position: 'relative', borderRadius: radius - 6, padding, ...glass.core }}>
        {children}
      </div>
    </div>
  )
}

/* ── Stat tile ── */
export function StatTile({ value, label, icon, accent = '#3b82f6', style }) {
  return (
    <div className="spatial-card" style={{
      position: 'relative', borderRadius: 18, padding: '16px 14px', textAlign: 'center',
      background: 'linear-gradient(165deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 14px 36px -16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14)',
      ...style,
    }}>
      <div aria-hidden style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
        width: 90, height: 50, background: `radial-gradient(circle, ${accent}55, transparent 70%)`, filter: 'blur(14px)', pointerEvents: 'none' }} />
      {icon && <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 6, color: accent }}>{icon}</div>}
      <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
      <div style={{ position: 'relative', marginTop: 5, fontFamily: FONT, fontSize: 10.5, fontWeight: 700, letterSpacing: 1,
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
    </div>
  )
}

/* ── Floating theme switcher (preview only — remove once a skin is chosen) ── */
export function SkinSwitcher() {
  const active = useSkin()
  return (
    <div style={{
      position: 'fixed', top: 74, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 7px', borderRadius: 999,
      background: 'rgba(10,18,40,0.72)', border: '1px solid rgba(255,255,255,0.14)',
      backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      boxShadow: '0 14px 40px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
    }}>
      <span style={{ fontFamily: FONT, fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2,
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', padding: '0 4px 0 6px', whiteSpace: 'nowrap' }}>
        Theme
      </span>
      {SKIN_ORDER.map(key => {
        const s = SKINS[key]
        const on = active === key
        return (
          <button key={key} onClick={() => setSkin(key)} className="spatial-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
              fontFamily: FONT, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap',
              border: on ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
              background: on ? s.btnPrimary.background : 'rgba(255,255,255,0.05)',
              color: on ? (s.btnPrimary.color || '#fff') : 'rgba(255,255,255,0.7)',
              boxShadow: on ? s.btnPrimary.boxShadow : 'none',
            }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.accent,
              boxShadow: `0 0 8px ${s.accent}`, flexShrink: 0 }} />
            {s.name}
          </button>
        )
      })}
    </div>
  )
}

/* ── Scroll-reveal wrapper (blur-up) ── */
export function Reveal({ children, delay = 0, y = 18, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: SPATIAL_EASE }}
      style={style}
    >
      {children}
    </motion.div>
  )
}
