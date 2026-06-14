import { useNavigate } from 'react-router-dom'
import PublicNav from '../../public/PublicNav'
import PublicFooter from '../../public/PublicFooter'
import { C, FONT, MAX_WIDTH } from '../../constants'

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 12, marginTop: 0 }}>
        {title}
      </h2>
      <div style={{ fontFamily: FONT, fontSize: 15, color: C.gray5, lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  )
}

function CodeBlock({ children }) {
  return (
    <code style={{ background: C.gray1, border: `1px solid ${C.gray2}`, borderRadius: 6, padding: '2px 7px', fontSize: 13, fontFamily: 'monospace' }}>
      {children}
    </code>
  )
}

export default function CookiePolicy() {
  const nav = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      <main style={{ flex: 1, padding: '108px 20px 60px', maxWidth: MAX_WIDTH, margin: '0 auto', width: '100%' }}>

        <button
          onClick={() => nav(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.green, fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back
        </button>

        <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: C.dark, marginBottom: 6, marginTop: 0 }}>
          Cookie &amp; Storage Policy
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.gray3, marginBottom: 36 }}>
          Last updated: June 2025 · Applies to tucc.club
        </p>

        <Section title="1. Overview">
          <p>
            This page explains what cookies and browser storage the Tamil United Cricket Club
            member portal (tucc.club) uses. We keep this as minimal as possible — we do{' '}
            <strong>not</strong> use advertising cookies, tracking pixels, or third-party analytics.
          </p>
        </Section>

        <Section title="2. What We Use">

          <p><strong>Browser localStorage (strictly necessary)</strong></p>
          <p style={{ marginTop: 8 }}>
            We use <CodeBlock>localStorage</CodeBlock> — not HTTP cookies — to store your
            authentication session. This is set automatically by Supabase Auth when you log in.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14, fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.gray1 }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${C.gray2}` }}>Storage Key</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${C.gray2}` }}>Purpose</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${C.gray2}` }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['sb-nrbuweeexnoofitznffo-auth-token', 'Supabase authentication session token — keeps you logged in', 'Until you log out or token expires (1 hour, auto-refreshed)'],
                ['tucc_admin_pw', 'Admin panel password (hashed in localStorage — only set if you use the admin Settings tab)', 'Until manually cleared'],
              ].map(([key, purpose, duration]) => (
                <tr key={key} style={{ borderBottom: `1px solid ${C.gray2}` }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: C.dark }}>{key}</td>
                  <td style={{ padding: '8px 12px' }}>{purpose}</td>
                  <td style={{ padding: '8px 12px', color: C.gray4 }}>{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: 20 }}><strong>sessionStorage (strictly necessary)</strong></p>
          <p style={{ marginTop: 8 }}>
            A single flag <CodeBlock>tucc_admin</CodeBlock> is stored in{' '}
            <CodeBlock>sessionStorage</CodeBlock> during an active admin session. It is
            automatically cleared when you close the browser tab.
          </p>

          <p style={{ marginTop: 20 }}><strong>No HTTP cookies</strong></p>
          <p style={{ marginTop: 8 }}>
            The App does not set any HTTP cookies directly. Vercel's edge network may set
            infrastructure cookies for load balancing, but these are temporary, strictly necessary,
            and not accessible to the App.
          </p>
        </Section>

        <Section title="3. What We Do NOT Use">
          <ul style={{ paddingLeft: 20 }}>
            <li>No Google Analytics or any analytics service cookies</li>
            <li style={{ marginTop: 6 }}>No Facebook Pixel or any advertising / retargeting cookies</li>
            <li style={{ marginTop: 6 }}>No cross-site tracking</li>
            <li style={{ marginTop: 6 }}>No fingerprinting or device tracking beyond basic browser info logged in activity logs (for admin security purposes)</li>
          </ul>
        </Section>

        <Section title="4. How to Clear Storage">
          <p>You can clear all stored data at any time:</p>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            <li>
              <strong>Chrome / Edge:</strong> Settings → Privacy and Security → Clear browsing
              data → Check "Cookies and other site data" → Clear data
            </li>
            <li style={{ marginTop: 8 }}>
              <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
              → Manage Data → search tucc.club → Remove
            </li>
            <li style={{ marginTop: 8 }}>
              <strong>Safari:</strong> Preferences → Privacy → Manage Website Data → tucc.club
              → Remove
            </li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Clearing storage will log you out of the App.
          </p>
        </Section>

        <Section title="5. Legal Basis">
          <p>
            The localStorage items described above are strictly necessary for the App to function.
            Under the UK Privacy and Electronic Communications Regulations (PECR), strictly
            necessary storage does not require consent. We do not use any optional or analytical
            storage that would require a cookie banner.
          </p>
        </Section>

        <Section title="6. Changes">
          <p>
            If we introduce any new storage items, this policy will be updated and the "last
            updated" date will change. Check back periodically.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>
            Questions: <strong>info@tucc.club</strong>
          </p>
        </Section>

      </main>

      <PublicFooter />
    </div>
  )
}
