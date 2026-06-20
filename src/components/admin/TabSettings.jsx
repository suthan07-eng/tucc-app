import { C, FONT } from '../../constants'
const AC = { green:'#2563eb', greenDark:'#1e3a8a', greenLight:'#1d4ed8', greenBg:'#eff6ff', gold:'#e9a020', white:'#ffffff', bg:'#eef2ff', gray1:'#f1f5f9', gray2:'#e2e8f0', gray3:'#94a3b8', gray4:'#64748b', gray5:'#334155', dark:'#0f172a', red:'#dc2626', redBg:'#fee2e2', ok:'#16a34a', okBg:'#dcfce7', blue:'#2563eb', blueBg:'#eff6ff', shadow:'rgba(30,58,138,0.07)', shadowMd:'rgba(30,58,138,0.11)', shadowLg:'rgba(30,58,138,0.18)' } // admin keeps original light theme
import Card from '../ui/Card'

export default function TabSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
