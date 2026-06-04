import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { C, FONT } from '../constants'

const ToastCtx = createContext(() => {})

const TYPE = {
  success: { bg: C.greenDark, border: C.greenLight, icon: '✓', iconBg: C.ok },
  error:   { bg: '#3b1010',   border: '#7f1d1d',    icon: '✕', iconBg: C.red },
  info:    { bg: '#0f1f35',   border: '#1e3a5f',    icon: 'ℹ', iconBg: C.blue },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3800)
  }, [])

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 8,
          alignItems: 'center',
          pointerEvents: 'none',
          width: 'calc(100% - 32px)',
          maxWidth: 400,
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const s = TYPE[t.type] ?? TYPE.success
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', duration: 0.38, bounce: 0.18 }}
                onClick={() => dismiss(t.id)}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  color: '#fff',
                  padding: '12px 14px 12px 12px',
                  borderRadius: 14,
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  boxShadow: '0 8px 32px rgba(0,0,0,.35), 0 2px 8px rgba(0,0,0,.2)',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {/* Icon badge */}
                <span style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: s.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                  color: '#fff',
                }}>
                  {s.icon}
                </span>

                {/* Message */}
                <span style={{ flex: 1 }}>{t.message}</span>

                {/* Dismiss × */}
                <span style={{ opacity: 0.4, fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
