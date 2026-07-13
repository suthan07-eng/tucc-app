import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Public page (no login) — embeds the standalone 2026 Survival Report HTML.
export default function SurvivalReport() {
  const nav = useNavigate()
  useEffect(() => {
    document.title = 'TUCC 2026 Survival Report | Tamil United CC'
  }, [])

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f8f8f6', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div style={{
        background: '#0d1b3e', color: '#fff', padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,.25)',
      }}>
        <button
          onClick={() => nav(-1)}
          aria-label="Back"
          style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 20 }}>🏏</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Premier Division Survival Report</div>
          <div style={{ fontSize: 11.5, opacity: 0.75 }}>Tamil United CC · Knights · BTCL 2026 Season</div>
        </div>
        <a
          href="/"
          style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.85)', textDecoration: 'none', fontSize: 12.5, fontWeight: 700, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 8, padding: '6px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Home
        </a>
      </div>

      {/* Full report */}
      <iframe
        src="/survival-report.html"
        title="TUCC 2026 Survival Report"
        style={{ width: '100%', flex: 1, minHeight: 'calc(100vh - 58px)', border: 'none', display: 'block' }}
      />
    </div>
  )
}
