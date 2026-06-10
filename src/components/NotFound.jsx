import { useNavigate } from 'react-router-dom'
import { C, FONT } from '../constants'

export default function NotFound() {
  const nav = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: FONT,
        textAlign: 'center',
      }}
    >
      {/* Club logo */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(30,58,138,0.15)', overflow: 'hidden', marginBottom: 28,
      }}>
        <img src="/logo.png" alt="TUCC" style={{ width: 64, height: 64, objectFit: 'contain' }} />
      </div>

      {/* 404 number */}
      <div style={{
        fontSize: 96, fontWeight: 900, color: C.greenDark,
        lineHeight: 1, letterSpacing: -4, marginBottom: 8,
        opacity: 0.15, userSelect: 'none',
      }}>
        404
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: '0 0 10px' }}>
        Stumped!
      </h1>
      <p style={{ fontSize: 15, color: C.gray4, maxWidth: 340, lineHeight: 1.65, margin: '0 auto 32px' }}>
        This page isn't in our playing XI — it may have been retired or the link
        is incorrect. Let's get you back on the field.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => nav('/')}
          style={{
            background: C.green, color: '#fff', border: 'none',
            borderRadius: 12, padding: '12px 24px',
            fontFamily: FONT, fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Go to Home
        </button>
        <button
          onClick={() => nav(-1)}
          style={{
            background: C.gray1, color: C.dark, border: 'none',
            borderRadius: 12, padding: '12px 24px',
            fontFamily: FONT, fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>

      <p style={{ marginTop: 48, fontSize: 12, color: C.gray3 }}>
        Tamil United Cricket Club · tucc.club
      </p>
    </div>
  )
}
