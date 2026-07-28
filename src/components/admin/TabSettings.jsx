import { useState, useEffect } from 'react'
import { C, FONT } from '../../constants'
const AC = { green:'#2563eb', greenDark:'#1e3a8a', greenLight:'#1d4ed8', greenBg:'#eff6ff', gold:'#e9a020', white:'#ffffff', bg:'#eef2ff', gray1:'#f1f5f9', gray2:'#e2e8f0', gray3:'#94a3b8', gray4:'#64748b', gray5:'#334155', dark:'#0f172a', red:'#dc2626', redBg:'#fee2e2', ok:'#16a34a', okBg:'#dcfce7', blue:'#2563eb', blueBg:'#eff6ff', shadow:'rgba(30,58,138,0.07)', shadowMd:'rgba(30,58,138,0.11)', shadowLg:'rgba(30,58,138,0.18)' } // admin keeps original light theme
import Card from '../ui/Card'
import { useToast } from '../Toast'
import { getSetting, setSetting } from '../../lib/appSettings'

// Reusable iOS-style toggle
function Toggle({ on, disabled, onChange }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-pressed={on}
      style={{
        width: 52, height: 30, borderRadius: 999, border: 'none', position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
        background: on ? AC.ok : AC.gray2, transition: 'background .2s', opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 25 : 3, width: 24, height: 24,
        borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.3)',
        transition: 'left .2s',
      }} />
    </button>
  )
}

export default function TabSettings() {
  const toast = useToast()
  const [survivalOn, setSurvivalOn] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSetting('survival_report_enabled', false).then((v) => {
      setSurvivalOn(v === true)
      setLoaded(true)
    })
  }, [])

  async function toggleSurvival(next) {
    setSaving(true)
    setSurvivalOn(next) // optimistic
    const ok = await setSetting('survival_report_enabled', next)
    if (!ok) {
      setSurvivalOn(!next) // revert
      toast('Could not save — please try again', 'error')
    } else {
      toast(next ? 'Survival Report is now ON ✓' : 'Survival Report hidden ✓')
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Feature toggles */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: AC.dark, marginBottom: 4 }}>🎛️ Player Features</div>
        <div style={{ fontSize: 13, color: AC.gray3, fontFamily: FONT, marginBottom: 18, lineHeight: 1.5 }}>
          Show or hide optional features across the player portal.
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: '14px 16px', borderRadius: 12, background: AC.gray1, border: `1px solid ${AC.gray2}`,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: AC.dark, fontFamily: FONT }}>
              🚨 Survival Report
            </div>
            <div style={{ fontSize: 12.5, color: AC.gray4, fontFamily: FONT, marginTop: 3, lineHeight: 1.45 }}>
              Shows the red “Relegation Battle” banner on the player home page and a Survival Report link in the menu.
              {loaded && (
                <span style={{ color: survivalOn ? AC.ok : AC.gray3, fontWeight: 700 }}>
                  {' '}Currently {survivalOn ? 'ON' : 'OFF'}.
                </span>
              )}
            </div>
          </div>
          <Toggle on={survivalOn} disabled={!loaded || saving} onChange={toggleSurvival} />
        </div>
      </Card>

      {/* Admin password */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: AC.dark, marginBottom: 4 }}>🔒 Admin Password</div>
        <div style={{ fontSize: 13, color: AC.gray3, fontFamily: FONT, marginBottom: 20, lineHeight: 1.5 }}>
          Admin authentication uses Supabase Auth. To change your password, use the Supabase password reset flow.
        </div>
        <a
          href="/reset-password"
          style={{
            display: 'inline-block', padding: '11px 20px', borderRadius: 12,
            background: `linear-gradient(135deg,${AC.greenDark},${AC.green})`,
            color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 14,
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(37,99,235,.35)',
          }}
        >
          Reset Password →
        </a>
      </Card>
    </div>
  )
}
