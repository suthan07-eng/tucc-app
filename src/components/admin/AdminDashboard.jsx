import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { C, FONT, MAX_WIDTH } from '../../constants'
import TabAvailability from './TabAvailability'
import TabPlayers from './TabPlayers'
import TabMatch from './TabMatch'
import TabTeamSelection from './TabTeamSelection'
import TabMessages from './TabMessages'
import TabStats from './TabStats'
import TabSettings from './TabSettings'
import TabPOTW from './TabPOTW'
import TabActivity from './TabActivity'
import TabGallery from './TabGallery'

const TABS = [
  { id: 'availability', label: '📋 Availability' },
  { id: 'players',      label: '👥 Players' },
  { id: 'activity',     label: '🕵️ Activity' },
  { id: 'gallery',      label: '📸 Gallery' },
  { id: 'match',        label: '🏏 Match' },
  { id: 'team',         label: '🎽 Team' },
  { id: 'messages',     label: '💬 Messages' },
  { id: 'stats',        label: '📊 Stats' },
  { id: 'potw',         label: '🏆 POTW' },
  { id: 'settings',     label: '⚙️ Settings' },
]

export default function AdminDashboard() {
  const nav = useNavigate()
  const [tab, setTab] = useState('availability')

  function logout() {
    sessionStorage.removeItem('tucc_admin')
    nav('/admin/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>
      {/* Admin header */}
      <div style={{ background: C.greenDark, borderBottom: `2px solid ${C.greenLight}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div
          style={{
            maxWidth: MAX_WIDTH,
            margin: '0 auto',
            padding: '0 16px',
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,.25)', overflow: 'hidden' }}>
              <img src="/logo.png" alt="DTU CC" style={{ width: 34, height: 34, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: C.gold, fontFamily: FONT, fontWeight: 800, fontSize: 13 }}>Tamil United CC</div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontFamily: FONT, fontSize: 10, lineHeight: 1 }}>
                Admin Panel
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              color: 'rgba(255,255,255,.5)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 13,
              padding: '6px 0',
            }}
          >
            Sign out
          </button>
        </div>

        {/* Tab bar */}
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
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t.id ? C.gold : 'transparent'}`,
                color: tab === t.id ? C.gold : 'rgba(255,255,255,.55)',
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: tab === t.id ? 700 : 400,
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

      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', padding: '20px 16px 80px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {tab === 'availability' && <TabAvailability />}
            {tab === 'players'      && <TabPlayers />}
            {tab === 'activity'     && <TabActivity />}
            {tab === 'gallery'      && <TabGallery />}
            {tab === 'match'        && <TabMatch />}
            {tab === 'team'         && <TabTeamSelection />}
            {tab === 'messages'     && <TabMessages />}
            {tab === 'stats'        && <TabStats />}
            {tab === 'potw'        && <TabPOTW />}
            {tab === 'settings'    && <TabSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
