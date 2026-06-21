import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'

const fadeUp    = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }
const staggerList = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const staggerItem = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

const LEAGUE_URL = 'https://www.btcluk.com/leagues/137680'

const SUB_TABS = [
  { id: 'table',    label: '🏆 League Table' },
  { id: 'fixtures', label: '📅 Fixtures' },
  { id: 'results',  label: '📊 Results' },
]

export default function League() {
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState('table')
  const [iframeState, setIframeState] = useState('loading') // 'loading' | 'loaded' | 'failed'
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIframeState((s) => (s === 'loading' ? 'failed' : s))
    }, 4000)
    return () => clearTimeout(timerRef.current)
  }, [])

  function handleLoad() {
    clearTimeout(timerRef.current)
    setIframeState('loaded')
  }

  function handleError() {
    clearTimeout(timerRef.current)
    setIframeState('failed')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* Header */}
      <div style={{ background: 'linear-gradient(150deg, rgba(37,99,235,0.24), rgba(124,58,237,0.22) 60%, rgba(20,184,166,0.14))', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', padding: '24px 20px' }}>
        <motion.div variants={staggerList} initial="hidden" animate="visible" style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          <motion.button
            variants={fadeUp}
            onClick={() => nav('/app')}
            style={{ color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, padding: 0, marginBottom: 12 }}
          >
            ← Home
          </motion.button>
          <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 38, flexShrink: 0 }}>🏆</span>
            <div>
              <h1 style={{ color: '#fff', backgroundImage: 'linear-gradient(92deg,#60a5fa,#c084fc 60%,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                BTCL UK · British Tamil Cricket League
              </h1>
              <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, margin: '4px 0 0' }}>
                Tamil United CC — League 137680
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Sub-tabs */}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <div
          style={{
            maxWidth: MAX_WIDTH,
            margin: '0 auto',
            padding: '0 12px',
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
          }}
        >
          {SUB_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                borderBottom: `2.5px solid ${activeTab === t.id ? C.green : 'transparent'}`,
                color: activeTab === t.id ? '#fff' : 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: activeTab === t.id ? 700 : 400,
                whiteSpace: 'nowrap',
                transition: 'color .15s',
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: MAX_WIDTH, margin: '0 auto', padding: '16px 16px 32px', width: '100%' }}>
        {iframeState === 'failed' ? (
          <FallbackCard />
        ) : (
          <div
            style={{
              borderRadius: 22,
              overflow: 'hidden',
              background: 'linear-gradient(150deg, rgba(37,99,235,0.24), rgba(124,58,237,0.22) 60%, rgba(20,184,166,0.14))',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              minHeight: iframeState === 'loading' ? 380 : 'auto',
            }}
          >
            {iframeState === 'loading' && (
              <div
                style={{
                  height: 380,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 36 }}>⏳</span>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Loading league data…</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                  Will open in browser if unavailable here
                </div>
              </div>
            )}
            <iframe
              src={LEAGUE_URL}
              onLoad={handleLoad}
              onError={handleError}
              title="BTCL UK League"
              style={{
                width: '100%',
                height: 620,
                border: 'none',
                display: iframeState === 'loaded' ? 'block' : 'none',
              }}
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

function FallbackCard() {
  const LINKS = [
    { label: '🏆 View League Table →' },
    { label: '📅 View Fixtures →' },
    { label: '📊 View Results →' },
  ]
  return (
    <div
      style={{
        background: 'linear-gradient(150deg, rgba(37,99,235,0.24), rgba(124,58,237,0.22) 60%, rgba(20,184,166,0.14))',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 22,
        boxShadow: '0 26px 64px -20px rgba(37,40,120,0.62), 0 0 40px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.26)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '32px 24px 28px',
          textAlign: 'center',
        }}
      >
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 2px 12px rgba(0,0,0,.15)', overflow: 'hidden' }}>
          <img src="/logo.png" alt="DTU CC" style={{ width: 72, height: 72, objectFit: 'contain' }} />
        </div>
        <div style={{ color: C.gold, fontWeight: 800, fontSize: 18, letterSpacing: 0.4 }}>
          BTCL UK League
        </div>
        <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, marginTop: 6 }}>
          Tamil United CC — League 137680
        </div>
      </div>
      <div style={{ padding: '24px 24px 32px' }}>
        <p
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 14,
            textAlign: 'center',
            marginTop: 0,
            marginBottom: 22,
          }}
        >
          Tap to open the BTCL UK website
        </p>
        <motion.div variants={staggerList} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LINKS.map(({ label }) => (
            <motion.a
              key={label}
              variants={staggerItem}
              href={LEAGUE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
                color: '#fff',
                padding: '17px 20px',
                borderRadius: 12,
                textDecoration: 'none',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 15,
                textAlign: 'center',
              }}
            >
              {label}
            </motion.a>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
