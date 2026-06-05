import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Home, RefreshCw } from 'lucide-react'
import { C, FONT } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import Button from './ui/Button'

const EASE_OUT = [0.23, 1, 0.32, 1]

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
}
const popIn = {
  hidden:  { opacity: 0, scale: 0.82 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', duration: 0.55, bounce: 0.28 } },
}

export default function Success() {
  const nav = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 20px',
      }}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}
        >
          {/* Icon */}
          <motion.div variants={popIn} style={{ marginBottom: 28 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.ok} 0%, #22c55e 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
              boxShadow: `0 8px 32px rgba(21,128,61,.3), 0 0 0 12px ${C.okBg}`,
            }}>
              <CheckCircle2 size={44} color="#fff" strokeWidth={2} />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={fadeUp} style={{
            fontSize: 28, fontWeight: 900, color: C.dark, margin: '0 0 6px',
            letterSpacing: -0.4, lineHeight: 1.15,
          }}>
            Response submitted
          </motion.h1>

          {/* Tamil text */}
          <motion.p variants={fadeUp} style={{
            fontSize: 20, color: C.green, fontWeight: 800,
            margin: '0 0 3px', letterSpacing: 0.2,
          }}>
            வெற்றி பெறுவோம்!
          </motion.p>
          <motion.p variants={fadeUp} style={{
            color: C.gray3, fontSize: 13, margin: '0 0 28px',
            fontStyle: 'italic',
          }}>
            "We shall win!"
          </motion.p>

          {/* Message card */}
          <motion.div variants={fadeUp} style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.gray2}`,
            boxShadow: `0 2px 12px ${C.shadow}`,
            padding: '20px 24px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: C.greenBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <CheckCircle2 size={18} color={C.green} strokeWidth={2.5} />
              </div>
              <p style={{ color: C.gray5, fontSize: 14, lineHeight: 1.65, margin: 0, fontWeight: 400 }}>
                Your availability has been recorded and a confirmation email has been sent. The captain will be in touch!
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button size="full" onClick={() => nav('/')}>
              <Home size={16} strokeWidth={2.5} />
              Back to Home
            </Button>
            <Button size="full" variant="ghost" onClick={() => nav('/availability')}>
              <RefreshCw size={15} strokeWidth={2} />
              Update My Response
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
