import { useNavigate } from 'react-router-dom'
import Nav from '../Nav'
import Footer from '../Footer'
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

export default function TermsOfUse() {
  const nav = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <main style={{ flex: 1, padding: '40px 20px 60px', maxWidth: MAX_WIDTH, margin: '0 auto', width: '100%' }}>

        <button
          onClick={() => nav(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.green, fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back
        </button>

        <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: C.dark, marginBottom: 6, marginTop: 0 }}>
          Terms of Use
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.gray3, marginBottom: 36 }}>
          Last updated: June 2025 · Applies to tucc.club
        </p>

        <Section title="1. Acceptance">
          <p>
            By accessing or using the Tamil United Cricket Club member portal at tucc.club (the
            "App"), you agree to these Terms of Use. These terms apply to all registered members.
            If you do not agree, do not use the App.
          </p>
          <p style={{ marginTop: 10 }}>
            These terms are issued by <strong>[LEGAL_ENTITY_NAME]</strong>,{' '}
            <strong>[REGISTERED_ADDRESS]</strong> ("we", "us", "the Club").
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            Access is restricted to current club members who have been registered by a club
            administrator. Accounts are personal and non-transferable. You must be 16 or over to
            register independently; members under 16 require a parent or guardian's consent.
          </p>
        </Section>

        <Section title="3. Your Account">
          <ul style={{ paddingLeft: 20 }}>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li style={{ marginTop: 8 }}>You must not share your account or access the App using another member's credentials.</li>
            <li style={{ marginTop: 8 }}>You must notify us immediately at <strong>[CLUB_EMAIL]</strong> if you suspect unauthorised access to your account.</li>
            <li style={{ marginTop: 8 }}>We reserve the right to suspend or deactivate accounts that are inactive, misused, or belonging to members who have left the club.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            <li>Upload, post, or share content that is unlawful, defamatory, threatening, harassing, obscene, or discriminatory</li>
            <li style={{ marginTop: 6 }}>Use the App for any commercial purpose or to solicit other members</li>
            <li style={{ marginTop: 6 }}>Attempt to reverse-engineer, scrape, or gain unauthorised access to the App or its data</li>
            <li style={{ marginTop: 6 }}>Upload malware, viruses, or any harmful code</li>
            <li style={{ marginTop: 6 }}>Impersonate another member or administrator</li>
            <li style={{ marginTop: 6 }}>Use automated tools to access or submit data to the App</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Violations may result in immediate account suspension and referral to the club
            committee for disciplinary action.
          </p>
        </Section>

        <Section title="5. Intellectual Property">
          <p>
            <strong>Club content:</strong> All logos, branding, match data, statistics, and
            editorial content in the App are owned by or licensed to Tamil United Cricket Club
            and may not be reproduced without our written consent.
          </p>
          <p style={{ marginTop: 10 }}>
            <strong>Member-uploaded content:</strong> By uploading photos, videos, or other
            content to the gallery or elsewhere in the App, you grant the Club a non-exclusive,
            royalty-free, perpetual licence to use, display, and reproduce that content for
            club purposes (website, social media, promotional materials). You confirm you own or
            have permission to share any content you upload, and that it does not infringe
            third-party rights.
          </p>
          <p style={{ marginTop: 10 }}>
            <strong>AI-generated content:</strong> Player profiles and gallery captions generated
            by AI are produced for informational and motivational purposes only. They are owned
            by the Club and do not constitute official assessments.
          </p>
        </Section>

        <Section title="6. Availability &amp; Changes">
          <p>
            We aim to keep the App available at all times but cannot guarantee uninterrupted
            access. We may update, suspend, or discontinue features at any time, including to
            correct errors or perform maintenance, without liability.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, the Club is not liable for:
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            <li>Loss of data, revenue, or profits arising from use of or inability to use the App</li>
            <li style={{ marginTop: 6 }}>The accuracy of AI-generated player profile descriptions or match statistics imported from third-party sources (BTCL / Play Cricket)</li>
            <li style={{ marginTop: 6 }}>Any indirect, consequential, or special damages</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Nothing in these terms limits liability for death or personal injury caused by
            negligence, or for fraud.
          </p>
        </Section>

        <Section title="8. Governing Law">
          <p>
            These terms are governed by the laws of England and Wales. Any disputes shall be
            subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </Section>

        <Section title="9. Changes to These Terms">
          <p>
            We may update these terms at any time. Continued use of the App after changes are
            posted constitutes acceptance of the updated terms. Material changes will be
            communicated via the App or email.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these terms: <strong>[CLUB_EMAIL]</strong>
          </p>
        </Section>

      </main>

      <Footer />
    </div>
  )
}
