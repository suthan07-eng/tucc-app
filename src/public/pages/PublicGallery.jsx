import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabase'
import PublicNav from '../PublicNav'
import PublicFooter from '../PublicFooter'
import { SITE } from '../siteConfig'

function isVideo(url) {
  return /\.(mp4|mov|webm|ogg)$/i.test(url || '')
}

function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 86400) return 'Today'
  if (s < 604800) return `${Math.floor(s/86400)}d ago`
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
}

// Varied heights for a dynamic masonry look (deterministic by index)
const SPANS = [220, 300, 260, 340, 240, 290, 320, 250]

function GalleryItem({ item, index, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const vid = isVideo(item.media_url)
  const accents = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#f97316']
  const accent = accents[index % accents.length]
  const h = SPANS[index % SPANS.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '80px' }}
      transition={{ delay: (index % 8) * 0.04, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => !error && onClick(item, index)}
      style={{
        breakInside: 'avoid', marginBottom: 16,
        borderRadius: 18, overflow: 'hidden', cursor: error ? 'default' : 'pointer',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        height: h,
        position: 'relative',
        transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s, border-color 0.35s',
      }}
      onMouseEnter={e => { if (!error) { e.currentTarget.style.transform = 'translateY(-5px) scale(1.015)'; e.currentTarget.style.boxShadow = `0 22px 60px ${accent}40, 0 6px 20px rgba(0,0,0,0.5)`; e.currentTarget.style.borderColor = `${accent}66` } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
    >
      {/* Coloured skeleton behind the image */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accent}33 0%, rgba(6,13,31,0.6) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loaded ? 0 : 1, transition: 'opacity 0.4s' }}>
        <div style={{ fontSize: 30, opacity: 0.25 }}>{vid ? '🎬' : '📸'}</div>
      </div>

      {!vid && !error && (
        <img
          src={item.media_url}
          alt={item.caption || 'Club photo'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }}
        />
      )}
      {vid && (
        <video
          src={item.media_url}
          muted playsInline preload="metadata"
          onLoadedData={() => setLoaded(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }}
        />
      )}

      {/* Gradient overlay on hover */}
      <div className="gallery-overlay" style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to top, rgba(0,0,0,0.82) 0%, ${accent}1a 45%, transparent 70%)`,
        opacity: 0, transition: 'opacity 0.3s',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px 18px',
      }}>
        {vid && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid rgba(255,255,255,0.3)' }}>▶</div>
        )}
        {item.album_name && (
          <span style={{ alignSelf: 'flex-start', fontSize: 9, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#fff', background: `${accent}cc`, borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>{item.album_name}</span>
        )}
        {item.caption && (
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.caption}</p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '4px 0 0', letterSpacing: '0.5px' }}>{timeAgo(item.created_at)}</p>
      </div>

      <style>{`.gallery-overlay:hover { opacity: 1 !important; }`}</style>
    </motion.div>
  )
}

function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const item = items[index]
  if (!item) return null
  const vid = isVideo(item.media_url)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index])

  return (
    <AnimatePresence>
      <motion.div
        key="lb"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <button onClick={e => { e.stopPropagation(); onPrev() }} style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 52, height: 52, color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>‹</button>

        <div onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {vid
            ? <video src={item.media_url} controls autoPlay muted style={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: 12, objectFit: 'contain' }} />
            : <img src={item.media_url} alt={item.caption || ''} style={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: 12, objectFit: 'contain' }} />
          }
          <div style={{ textAlign: 'center' }}>
            {item.caption && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, margin: '0 0 4px' }}>{item.caption}</p>}
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
              {item.album_name || 'Club Gallery'} · {index + 1} / {items.length}
            </p>
          </div>
        </div>

        <button onClick={e => { e.stopPropagation(); onNext() }} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 52, height: 52, color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>›</button>
      </motion.div>
    </AnimatePresence>
  )
}

export default function PublicGallery() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lbIndex, setLbIndex] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, media_url, caption, album_name, created_at')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!error) setPosts(data || [])
        setLoading(false)
      })
  }, [])

  const albums = ['All', ...Array.from(new Set(posts.map(p => p.album_name).filter(Boolean)))]
  const filtered = filter === 'All' ? posts : posts.filter(p => p.album_name === filter)

  function openLb(_, index) { setLbIndex(index) }
  function closeLb() { setLbIndex(null) }
  function prevLb() { setLbIndex(i => (i - 1 + filtered.length) % filtered.length) }
  function nextLb() { setLbIndex(i => (i + 1) % filtered.length) }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#060d1f', color: '#fff', minHeight: '100vh' }}>
      <PublicNav />

      {/* Hero */}
      <section style={{
        padding: '140px 24px 80px', textAlign: 'center',
        background: 'linear-gradient(180deg, #0d1b3e 0%, #060d1f 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ color: SITE.colors.gold, fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Gallery</div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>Club Photos</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Match days, training sessions, club events, and unforgettable moments.
          </p>
        </motion.div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px 120px' }}>
        {/* Album filter tabs */}
        {albums.length > 1 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40, justifyContent: 'center' }}>
            {albums.map(a => {
              const active = filter === a
              return (
                <button key={a} onClick={() => setFilter(a)} style={{
                  padding: '9px 20px', borderRadius: 100, cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: active ? 800 : 600,
                  border: `1.5px solid ${active ? SITE.colors.gold : 'rgba(255,255,255,0.14)'}`,
                  background: active ? `linear-gradient(135deg, ${SITE.colors.gold}, #f59e0b)` : 'rgba(255,255,255,0.05)',
                  color: active ? '#000' : 'rgba(255,255,255,0.7)',
                  boxShadow: active ? `0 6px 20px ${SITE.colors.gold}40` : 'none',
                  transition: 'all 0.2s',
                }}>{a}</button>
              )
            })}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>
            Loading photos…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📸</div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>No photos yet — check back after our next match!</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ columnGap: 16, columnWidth: 280 }}>
            {filtered.map((item, i) => (
              <GalleryItem key={item.id} item={item} index={i} onClick={openLb} />
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>
              Showing {filtered.length} photo{filtered.length !== 1 ? 's' : ''} · Member photos from match days and club events
            </p>
          </motion.div>
        )}
      </section>

      {lbIndex !== null && (
        <Lightbox items={filtered} index={lbIndex} onClose={closeLb} onPrev={prevLb} onNext={nextLb} />
      )}

      <PublicFooter />
    </div>
  )
}
