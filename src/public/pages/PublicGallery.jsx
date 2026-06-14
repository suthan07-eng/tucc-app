import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } }

// Placeholder gallery items — will be replaced when real images are dropped into /public/gallery/
const GALLERY_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  src: `/gallery/photo-${i + 1}.jpg`,
  alt: `TU CC gallery photo ${i + 1}`,
  label: ['Match Day', 'Training', 'Team Celebration', 'Club Event', 'Pre-Season', 'Awards Night', 'Community Day', 'End of Season', 'Batting', 'Bowling', 'Fielding', 'Team Photo'][i % 12],
}))

function GalleryImage({ item, onClick, index }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  if (error) return null

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.05, duration: 0.5 }}
      onClick={() => onClick(item)}
      style={{
        cursor: 'pointer', borderRadius: 14, overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        aspectRatio: index % 5 === 0 ? '16/9' : index % 4 === 0 ? '3/4' : '4/3',
        position: 'relative', transition: 'transform 0.3s',
        gridColumn: index % 5 === 0 ? 'span 2' : 'span 1',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {visible && (
        <img
          src={item.src}
          alt={item.alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none' }}
        />
      )}
      {(!loaded || !visible) && !error && (
        <div style={{ width: '100%', height: '100%', minHeight: 200, background: 'linear-gradient(135deg, rgba(30,58,138,0.3) 0%, rgba(6,13,31,0.6) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 32, opacity: 0.3 }}>📸</div>
        </div>
      )}
      {/* Hover overlay */}
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
        display: 'flex', alignItems: 'flex-end', padding: 16,
        transition: 'background 0.3s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
      >
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0, transition: 'opacity 0.3s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
        >{item.label}</span>
      </div>
    </motion.div>
  )
}

export default function PublicGallery() {
  const [lightbox, setLightbox] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  function openLightbox(item) {
    const idx = GALLERY_ITEMS.indexOf(item)
    setCurrentIndex(idx)
    setLightbox(item)
  }

  function closeLightbox(e) {
    if (e.target === e.currentTarget) setLightbox(null)
  }

  function prev(e) { e.stopPropagation(); const i = (currentIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length; setCurrentIndex(i); setLightbox(GALLERY_ITEMS[i]) }
  function next(e) { e.stopPropagation(); const i = (currentIndex + 1) % GALLERY_ITEMS.length; setCurrentIndex(i); setLightbox(GALLERY_ITEMS[i]) }

  useEffect(() => {
    function onKey(e) {
      if (!lightbox) return
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowLeft') prev(e)
      if (e.key === 'ArrowRight') next(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, currentIndex])

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      <section style={{
        padding: '140px 24px 80px', textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Gallery</div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>Club Photos</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Match days, training sessions, club events, and unforgettable moments.
          </p>
        </motion.div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {GALLERY_ITEMS.map((item, i) => (
            <GalleryImage key={i} item={item} onClick={openLightbox} index={i} />
          ))}
        </div>

        <motion.div {...fadeUp} style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>
            📸 More photos coming soon. Follow us on social media for match-day updates.
          </p>
        </motion.div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Close */}
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          {/* Prev */}
          <button onClick={prev} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          {/* Image */}
          <div style={{ maxWidth: '85vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.alt} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} />
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>{lightbox.label} · {currentIndex + 1} / {GALLERY_ITEMS.length}</div>
          </div>
          {/* Next */}
          <button onClick={next} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>
      )}

      <PublicFooter />
    </div>
  )
}
