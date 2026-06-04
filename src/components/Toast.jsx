import { createContext, useContext, useState, useCallback } from 'react'
import { C, FONT } from '../constants'

const ToastCtx = createContext(() => {})

const TYPE_STYLES = {
  success: { bg: C.ok,   icon: '✓' },
  error:   { bg: C.red,  icon: '✕' },
  info:    { bg: C.blue, icon: 'ℹ' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

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
          flexDirection: 'column',
          gap: 8,
          alignItems: 'center',
          pointerEvents: 'none',
          width: 'calc(100% - 32px)',
          maxWidth: 420,
        }}
      >
        {toasts.map((t) => {
          const s = TYPE_STYLES[t.type] ?? TYPE_STYLES.success
          return (
            <div
              key={t.id}
              style={{
                background: s.bg,
                color: C.white,
                padding: '12px 20px',
                borderRadius: 12,
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 500,
                boxShadow: '0 4px 20px rgba(0,0,0,.22)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                animation: 'slideUp .2s ease',
                pointerEvents: 'auto',
              }}
            >
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              {t.message}
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
