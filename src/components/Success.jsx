import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Footer from './Footer'
import Button from './ui/Button'

const staggerList = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}
const popIn = {
  hidden:  { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 18 } },
}

export default function Success() {
  const nav = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}
        >
          {/* Success icon — spring pop */}
          <motion.div variants={popIn} style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: C.okBg, border: `3px solid #bbf7d0`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, margin: '0 auto',
            }}>
              🎉
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} style={{ fontSize: 28, fontWeight: 800, color: C.dark, margin: '0 0 8px' }}>
            Response Submitted!
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize: 22, color: C.green, fontWeight: 800, margin: '0 0 4px', letterSpacing: 0.3 }}>
            வெற்றி பெறுவோம்!
          </motion.p>
          <motion.p variants={fadeUp} style={{ color: C.gray3, fontSize: 13, margin: '0 0 20px', fontStyle: 'italic' }}>
            "We shall win!"
          </motion.p>

          <motion.div variants={fadeUp} style={{
            background: C.white, borderRadius: 16, border: `1px solid ${C.gray2}`,
            boxShadow: '0 2px 16px rgba(0,0,0,.07)',
            padding: '24px 28px', marginBottom: 24,
          }}>
            <p style={{ color: C.gray4, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Your availability has been recorded and a confirmation email has been sent. The captain will be in touch!
            </p>
          </motion.div>

          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button size="full" onClick={() => nav('/')}>
              ← Back to Home
            </Button>
            <Button size="full" variant="ghost" onClick={() => nav('/availability')}>
              Update My Response
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
