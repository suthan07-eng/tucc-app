import { C, FONT } from '../../constants'
import Card from '../ui/Card'

export default function TabSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 4 }}>🔒 Admin Password</div>
        <div style={{ fontSize: 13, color: C.gray3, fontFamily: FONT, marginBottom: 20, lineHeight: 1.5 }}>
          Admin authentication uses Supabase Auth. To change your password, use the Supabase password reset flow.
        </div>
        <a
          href="/reset-password"
          style={{
            display: 'inline-block', padding: '11px 20px', borderRadius: 12,
            background: `linear-gradient(135deg,${C.greenDark},${C.green})`,
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
