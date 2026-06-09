import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { C, FONT, MAX_WIDTH } from '../constants'
import Nav from './Nav'
import Avatar from './ui/Avatar'

const SUPABASE_URL = 'https://nrbuweeexnoofitznffo.supabase.co'
const BUCKET = 'team-media'

function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)  return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`
  if (s < 604800) return `${Math.floor(s/86400)}d`
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

function isVideo(url) {
  return /\.(mp4|mov|webm|ogg)$/i.test(url)
}

function fmtDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function fmtDateShort(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function fetchAITitle({ fileName, mediaType, playerName }) {
  try {
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const res = await fetch('/api/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, mediaType, playerName, dateStr }),
    })
    const data = await res.json()
    return data.title || null
  } catch {
    return null
  }
}

// ── Upload Modal (bulk) ─────────────────────────────────────────
function UploadModal({ user, playerInfo, onClose, onPosted }) {
  // items: [{ file, preview, title, caption, status, error }]
  const [items,     setItems]     = useState([])
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [doneCount, setDoneCount] = useState(0)
  const [globalErr, setGlobalErr] = useState('')
  const inputRef = useRef()

  const MAX_IMAGE_MB = 20, MAX_VIDEO_MB = 100, MAX_FILES = 20

  async function addFiles(fileList) {
    const newFiles = Array.from(fileList)
    const errors = []
    const valid = []
    newFiles.forEach(f => {
      const maxMB = f.type.startsWith('video') ? MAX_VIDEO_MB : MAX_IMAGE_MB
      if (f.size > maxMB * 1024 * 1024) { errors.push(`${f.name} exceeds ${maxMB} MB`); return }
      valid.push(f)
    })
    if (errors.length) setGlobalErr(errors.join(' · '))
    const toAdd = valid.slice(0, MAX_FILES - items.length)
    const newItems = toAdd.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      preview: URL.createObjectURL(f),
      title: '',
      caption: '',
      status: 'pending',
      generating: true,  // AI title in progress
      error: '',
    }))
    setItems(prev => [...prev, ...newItems])
    // Auto-generate AI titles in parallel
    newItems.forEach(item => {
      fetchAITitle({
        fileName: item.file.name,
        mediaType: item.file.type.startsWith('video') ? 'video' : 'image',
        playerName: playerInfo?.name || user?.email || '',
      }).then(title => {
        setItems(prev => prev.map(x =>
          x.id === item.id ? { ...x, title: title || x.title, generating: false } : x
        ))
      })
    })
  }

  async function regenTitle(item) {
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, generating: true } : x))
    const title = await fetchAITitle({
      fileName: item.file.name,
      mediaType: item.file.type.startsWith('video') ? 'video' : 'image',
      playerName: playerInfo?.name || user?.email || '',
    })
    setItems(prev => prev.map(x =>
      x.id === item.id ? { ...x, title: title ?? x.title, generating: false } : x
    ))
  }

  function removeItem(id) { setItems(prev => prev.filter(x => x.id !== id)) }
  function updateItem(id, patch) { setItems(prev => prev.map(x => x.id === id ? {...x, ...patch} : x)) }

  async function uploadItem(item) {
    updateItem(item.id, { status:'uploading' })
    try {
      const ext  = item.file.name.split('.').pop()
      const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, item.file, { cacheControl:'3600', upsert:false })
      if (upErr) throw upErr
      const { data:{ publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const { error: dbErr } = await supabase.from('posts').insert({
        player_id:    playerInfo?.id   || null,
        player_name:  playerInfo?.name || user.email,
        player_email: user.email,
        media_url:    publicUrl,
        media_type:   item.file.type.startsWith('video') ? 'video' : 'image',
        title:        item.title.trim()   || null,
        caption:      item.caption.trim() || null,
      })
      if (dbErr) throw dbErr
      updateItem(item.id, { status:'done' })
    } catch (e) {
      updateItem(item.id, { status:'error', error: e.message || 'Upload failed' })
    }
  }

  async function submitAll() {
    if (!items.length) { setGlobalErr('Please add at least one photo or video'); return }
    setUploading(true); setDoneCount(0); setGlobalErr('')
    // Upload sequentially so we can show per-item progress
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue
      await uploadItem(items[i])
      setDoneCount(i + 1)
    }
    setUploading(false)
    onPosted()
    onClose()
  }

  const allDone = items.length > 0 && items.every(x => x.status === 'done')
  const progress = items.length ? Math.round((items.filter(x=>x.status==='done').length / items.length) * 100) : 0

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'12px',
        background:'rgba(6,13,46,.75)', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget && !uploading) onClose() }}
    >
      <motion.div
        initial={{ scale:.93, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:.93, opacity:0, y:20 }}
        transition={{ type:'spring', damping:24, stiffness:300 }}
        style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:680,
          maxHeight:'92vh', display:'flex', flexDirection:'column',
          overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:'#060d2e', fontFamily:FONT }}>
              📸 New Post {items.length > 1 ? `— ${items.length} items` : ''}
            </div>
            <div style={{ fontSize:11, color:'#9ca3af', fontFamily:FONT, marginTop:1 }}>
              Select multiple photos & videos at once
            </div>
          </div>
          <button onClick={onClose} disabled={uploading}
            style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#f3f4f6', cursor:'pointer', fontSize:18, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', opacity:uploading?.5:1 }}>×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Drop zone */}
          <div
            onDrop={e => { e.preventDefault(); setDragging(false); if(!uploading) addFiles(e.dataTransfer.files) }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => { if(!uploading) inputRef.current?.click() }}
            style={{
              border:`2px dashed ${dragging?'#e9a020':'#d1d5db'}`,
              borderRadius:16, padding:items.length?'16px 20px':'36px 20px',
              cursor: uploading?'default':'pointer', textAlign:'center',
              background: dragging?'#fffbeb':'#fafafa', transition:'all .2s', flexShrink:0,
            }}
          >
            {items.length === 0 ? (
              <>
                <div style={{ fontSize:44, marginBottom:8 }}>📷</div>
                <div style={{ fontWeight:700, fontSize:14, color:'#374151', fontFamily:FONT }}>Drop photos & videos here</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:4, fontFamily:FONT }}>
                  or click to browse · select multiple files · up to {MAX_FILES} items
                </div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2, fontFamily:FONT }}>
                  Images up to 20 MB · Videos up to 100 MB each
                </div>
              </>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                <span style={{ fontSize:20 }}>➕</span>
                <span style={{ fontSize:13, fontWeight:700, color:dragging?'#e9a020':'#6b7280', fontFamily:FONT }}>
                  Add more files ({items.length}/{MAX_FILES})
                </span>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple style={{ display:'none' }}
            onChange={e => { addFiles(e.target.files); e.target.value='' }}/>

          {globalErr && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#dc2626', fontFamily:FONT }}>{globalErr}</div>
          )}

          {/* Item cards */}
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div key={item.id}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20 }}
                transition={{ type:'spring', damping:22, stiffness:280 }}
                style={{
                  border: item.status==='done'   ? '2px solid #bbf7d0'
                        : item.status==='error'  ? '2px solid #fecaca'
                        : item.status==='uploading' ? '2px solid #fde68a'
                        : '1.5px solid #f0f0f0',
                  borderRadius:16, overflow:'hidden', background:'#fff',
                  boxShadow:'0 2px 10px rgba(0,0,0,.06)',
                }}
              >
                <div style={{ display:'flex', gap:0 }}>
                  {/* Thumbnail */}
                  <div style={{ width:110, flexShrink:0, position:'relative', background:'#000' }}>
                    {item.file.type.startsWith('video')
                      ? <video src={item.preview} muted playsInline preload="metadata" style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:110 }}/>
                      : <img src={item.preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:110, display:'block' }}/>
                    }
                    {/* Status overlay */}
                    {item.status === 'uploading' && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }} style={{ width:24, height:24, borderRadius:'50%', border:'3px solid rgba(255,255,255,.3)', borderTopColor:'#fff' }}/>
                      </div>
                    )}
                    {item.status === 'done' && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(21,128,61,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>✅</div>
                    )}
                    {item.status === 'error' && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(220,38,38,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>❌</div>
                    )}
                    {/* File type badge */}
                    <div style={{ position:'absolute', top:6, left:6, background:'rgba(0,0,0,.55)', borderRadius:99, padding:'2px 6px', fontSize:9, color:'#fff', fontFamily:FONT, fontWeight:700 }}>
                      {item.file.type.startsWith('video') ? '🎬' : '🖼️'} {idx+1}
                    </div>
                  </div>

                  {/* Fields */}
                  <div style={{ flex:1, padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                    {/* Title */}
                    <div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.4, fontFamily:FONT }}>Title</div>
                        <button
                          onClick={() => regenTitle(item)}
                          disabled={item.generating || uploading}
                          title="Re-generate AI title"
                          style={{ display:'flex', alignItems:'center', gap:3, background: item.generating ? '#f3f4f6' : '#fef9c3', border:'none', borderRadius:6, padding:'2px 7px', cursor: item.generating||uploading ? 'default':'pointer', opacity: uploading?0.4:1, transition:'all .15s' }}
                        >
                          {item.generating
                            ? <motion.span animate={{ rotate:360 }} transition={{ duration:.9, repeat:Infinity, ease:'linear' }} style={{ display:'inline-block', fontSize:11 }}>⟳</motion.span>
                            : <span style={{ fontSize:11 }}>✨</span>
                          }
                          <span style={{ fontSize:10, fontWeight:700, color: item.generating ? '#9ca3af' : '#92400e', fontFamily:FONT }}>
                            {item.generating ? 'Generating…' : 'AI Title'}
                          </span>
                        </button>
                      </div>
                      <input
                        value={item.title}
                        onChange={e => updateItem(item.id, { title:e.target.value })}
                        placeholder={item.generating ? 'Generating AI title…' : 'e.g. Match Day vs West 3 CC 🏏'}
                        disabled={uploading}
                        maxLength={80}
                        style={{ width:'100%', border: item.generating ? '1.5px solid #fde68a' : '1.5px solid #e5e7eb', borderRadius:8, padding:'6px 10px', fontFamily:FONT, fontSize:12, color:'#374151', outline:'none', boxSizing:'border-box', fontWeight:600, background: item.generating ? '#fffbeb' : '#fff', transition:'all .2s' }}
                      />
                    </div>
                    {/* Caption */}
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', marginBottom:3, textTransform:'uppercase', letterSpacing:.4, fontFamily:FONT }}>Caption</div>
                      <textarea
                        value={item.caption}
                        onChange={e => updateItem(item.id, { caption:e.target.value })}
                        placeholder="Describe the moment…"
                        disabled={uploading}
                        maxLength={300}
                        rows={2}
                        style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'6px 10px', fontFamily:FONT, fontSize:12, color:'#374151', resize:'none', outline:'none', boxSizing:'border-box', lineHeight:1.4 }}
                      />
                    </div>
                    {item.error && <div style={{ fontSize:11, color:'#dc2626', fontFamily:FONT }}>{item.error}</div>}
                  </div>

                  {/* Remove */}
                  {!uploading && (
                    <button onClick={() => removeItem(item.id)}
                      style={{ width:36, background:'transparent', border:'none', cursor:'pointer', color:'#d1d5db', fontSize:18, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'12px 8px 0', flexShrink:0 }}
                      onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                      onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}
                    >×</button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px', borderTop:'1px solid #f0f0f0', flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
          {/* Overall progress */}
          {uploading && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#374151', fontFamily:FONT }}>
                  Uploading {items.filter(x=>x.status==='done').length} of {items.length}…
                </span>
                <span style={{ fontSize:12, color:'#9ca3af', fontFamily:FONT }}>{progress}%</span>
              </div>
              <div style={{ background:'#f3f4f6', borderRadius:99, height:6, overflow:'hidden' }}>
                <motion.div animate={{ width:`${progress}%` }} transition={{ duration:.3 }}
                  style={{ height:'100%', background:'linear-gradient(90deg,#e9a020,#f59e0b)', borderRadius:99 }}/>
              </div>
            </div>
          )}

          <button
            onClick={submitAll}
            disabled={uploading || !items.length}
            style={{
              background: items.length ? 'linear-gradient(135deg,#e9a020,#f59e0b)' : '#e5e7eb',
              color: items.length ? '#fff' : '#9ca3af',
              border:'none', borderRadius:14, padding:'14px', fontFamily:FONT, fontSize:15, fontWeight:800,
              cursor: items.length && !uploading ? 'pointer' : 'default',
              transition:'all .2s', boxShadow: items.length ? '0 4px 16px rgba(233,160,32,.4)' : 'none',
            }}
          >
            {uploading
              ? `Uploading ${items.filter(x=>x.status==='done').length} of ${items.length}…`
              : items.length === 0 ? '📷 Select files to post'
              : items.length === 1 ? '🚀 Share Post'
              : `🚀 Share All ${items.length} Posts`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Lightbox Modal ──────────────────────────────────────────────
function LightboxModal({ post, user, playerInfo, onClose, onReactionChange, onCommentChange, onDelete }) {
  const [comments,     setComments]     = useState([])
  const [commentText,  setCommentText]  = useState('')
  const [posting,      setPosting]      = useState(false)
  const [reactions,    setReactions]    = useState({ likes:0, dislikes:0, mine:null })
  const [animLike,     setAnimLike]     = useState(false)
  const [downloading,  setDownloading]  = useState(false)
  const [showShare,    setShowShare]    = useState(false)
  const [copied,       setCopied]       = useState(false)
  const commentEndRef = useRef()
  const shareRef      = useRef()

  const myEmail = user?.email?.toLowerCase()
  const isOwner = myEmail && post.player_email?.toLowerCase() === myEmail

  useEffect(() => { loadComments(); loadReactions() }, [post.id])

  // Close share sheet when clicking outside
  useEffect(() => {
    if (!showShare) return
    function handleClick(e) {
      if (shareRef.current && !shareRef.current.closest('[data-share-sheet]')?.contains(e.target)
          && !shareRef.current.contains(e.target)) {
        setShowShare(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showShare])

  async function loadComments() {
    const { data } = await supabase.from('post_comments').select('*').eq('post_id', post.id).order('created_at')
    setComments(data || [])
  }

  async function loadReactions() {
    const { data } = await supabase.from('post_reactions').select('*').eq('post_id', post.id)
    const all = data || []
    const likes    = all.filter(r => r.reaction === 'like').length
    const dislikes = all.filter(r => r.reaction === 'dislike').length
    const mine     = myEmail ? (all.find(r => r.player_email?.toLowerCase() === myEmail)?.reaction || null) : null
    setReactions({ likes, dislikes, mine })
  }

  async function handleReaction(type) {
    if (!user) return
    const current = reactions.mine
    if (current === type) {
      await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('player_email', myEmail)
      setReactions(r => ({ ...r, likes: r.likes-(type==='like'?1:0), dislikes: r.dislikes-(type==='dislike'?1:0), mine:null }))
    } else if (current) {
      await supabase.from('post_reactions').update({ reaction:type }).eq('post_id', post.id).eq('player_email', myEmail)
      setReactions(r => ({ likes: r.likes+(type==='like'?1:-1), dislikes: r.dislikes+(type==='dislike'?1:-1), mine:type }))
    } else {
      await supabase.from('post_reactions').insert({ post_id:post.id, player_email:myEmail, player_name:playerInfo?.name||user.email, reaction:type })
      setReactions(r => ({ ...r, likes:r.likes+(type==='like'?1:0), dislikes:r.dislikes+(type==='dislike'?1:0), mine:type }))
      if (type === 'like') { setAnimLike(true); setTimeout(() => setAnimLike(false), 700) }
    }
    onReactionChange?.(post.id)
  }

  async function postComment() {
    if (!commentText.trim() || !user) return
    setPosting(true)
    const { data } = await supabase.from('post_comments').insert({
      post_id:      post.id,
      player_email: myEmail,
      player_name:  playerInfo?.name || user.email,
      text:         commentText.trim(),
    }).select().single()
    if (data) {
      setComments(c => [...c, data])
      onCommentChange?.(post.id, (post._commentCount||0)+1)
      setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
    }
    setCommentText('')
    setPosting(false)
  }

  async function deleteComment(cId) {
    await supabase.from('post_comments').delete().eq('id', cId)
    setComments(c => c.filter(x => x.id !== cId))
    onCommentChange?.(post.id, Math.max(0,(post._commentCount||0)-1))
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const res  = await fetch(post.media_url)
      const blob = await res.blob()
      const ext  = blob.type.split('/')[1]?.split(';')[0] || (post.media_type==='video' ? 'mp4' : 'jpg')
      const name = `${(post.title||post.player_name||'tucc').replace(/[^a-z0-9]/gi,'_')}.${ext}`
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = name
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch {
      window.open(post.media_url, '_blank')
    }
    setDownloading(false)
  }

  const shareText = encodeURIComponent(
    `${post.player_name}${post.title ? ' — ' + post.title : ''} 🏏 Tamil United CC`
  )
  const shareUrl = encodeURIComponent(post.media_url)

  const SHARE_OPTIONS = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      emoji: '💬',
      bg: '#dcfce7', color: '#15803d', hoverBg: '#bbf7d0',
      href: `https://wa.me/?text=${shareText}%20${shareUrl}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      emoji: '👥',
      bg: '#eff6ff', color: '#1d4ed8', hoverBg: '#dbeafe',
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      id: 'twitter',
      label: 'X (Twitter)',
      emoji: '🐦',
      bg: '#f0f9ff', color: '#0369a1', hoverBg: '#e0f2fe',
      href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      emoji: '✈️',
      bg: '#f0f9ff', color: '#0284c7', hoverBg: '#bae6fd',
      href: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
    },
  ]

  async function copyLink() {
    try { await navigator.clipboard.writeText(post.media_url) } catch {}
    setCopied(true)
    setTimeout(() => { setCopied(false); setShowShare(false) }, 2000)
  }

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(0,0,0,.88)', backdropFilter:'blur(8px)', padding:'12px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale:.93, opacity:0, y:16 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:.93, opacity:0, y:16 }}
        transition={{ type:'spring', damping:26, stiffness:300 }}
        style={{
          display:'flex', flexDirection:'column',
          background:'#fff', borderRadius:22, overflow:'hidden',
          width:'100%', maxWidth:560, maxHeight:'94vh',
          boxShadow:'0 40px 100px rgba(0,0,0,.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── TOP BAR: uploader info + close ── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 16px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
          <Avatar name={post.player_name} size={36}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:14, color:'#060d2e', fontFamily:FONT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.player_name}</div>
            <div style={{ fontSize:10, color:'#9ca3af', fontFamily:FONT, marginTop:1 }}>
              {fmtDateTime(post.created_at)}
              <span style={{ marginLeft:6, background:'#f3f4f6', borderRadius:99, padding:'1px 6px', fontSize:9, color:'#6b7280', fontWeight:700 }}>{timeAgo(post.created_at)}</span>
            </div>
          </div>
          {isOwner && (
            <button onClick={() => { onDelete(post.id); onClose() }}
              style={{ border:'none', background:'#fef2f2', color:'#ef4444', cursor:'pointer', fontSize:11, fontFamily:FONT, fontWeight:700, padding:'5px 10px', borderRadius:8 }}>
              🗑 Delete
            </button>
          )}
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#f3f4f6', cursor:'pointer', fontSize:17, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            ×
          </button>
        </div>

        {/* ── MEDIA ── */}
        <div style={{ background:'#000', position:'relative', flexShrink:0 }}>
          {post.media_type === 'video'
            ? <video src={post.media_url} controls autoPlay muted style={{ width:'100%', maxHeight:'52vh', objectFit:'contain', display:'block' }}/>
            : (
              <>
                <img src={post.media_url} alt={post.caption||''} style={{ width:'100%', maxHeight:'52vh', objectFit:'contain', display:'block' }}/>
                <AnimatePresence>
                  {animLike && (
                    <motion.div initial={{ scale:0, opacity:1 }} animate={{ scale:1.8, opacity:0 }} exit={{ opacity:0 }}
                      transition={{ duration:.65 }}
                      style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:80, pointerEvents:'none' }}>
                      ❤️
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )
          }
        </div>

        {/* ── TITLE + CAPTION ── */}
        {(post.title || post.caption) && (
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
            {post.title && (
              <div style={{ fontWeight:900, fontSize:15, color:'#060d2e', fontFamily:FONT, marginBottom: post.caption?4:0, lineHeight:1.3 }}>
                {post.title}
              </div>
            )}
            {post.caption && (
              <div style={{ fontSize:13, color:'#374151', fontFamily:FONT, lineHeight:1.6 }}>
                <span style={{ fontWeight:700, color:'#060d2e' }}>{post.player_name} </span>
                {post.caption}
              </div>
            )}
          </div>
        )}

        {/* ── ACTION BAR: reactions + download + share ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'1px solid #f3f4f6', flexShrink:0 }}>
          {/* Like */}
          <motion.button whileTap={{ scale:1.3 }} onClick={() => handleReaction('like')}
            style={{ border:'none', background: reactions.mine==='like'?'#fef2f2':'transparent', borderRadius:99, padding:'5px 10px', cursor:user?'pointer':'default', display:'flex', alignItems:'center', gap:5, transition:'background .2s' }}>
            <span style={{ fontSize:20, filter:reactions.mine==='like'?'none':'grayscale(1)', transition:'filter .2s' }}>❤️</span>
            <span style={{ fontSize:13, fontWeight:700, color:reactions.mine==='like'?'#ef4444':'#6b7280', fontFamily:FONT }}>{reactions.likes}</span>
          </motion.button>
          {/* Dislike */}
          <motion.button whileTap={{ scale:1.3 }} onClick={() => handleReaction('dislike')}
            style={{ border:'none', background:reactions.mine==='dislike'?'#eff6ff':'transparent', borderRadius:99, padding:'5px 10px', cursor:user?'pointer':'default', display:'flex', alignItems:'center', gap:5, transition:'background .2s' }}>
            <span style={{ fontSize:20, filter:reactions.mine==='dislike'?'none':'grayscale(1)', transition:'filter .2s' }}>👎</span>
            <span style={{ fontSize:13, fontWeight:700, color:reactions.mine==='dislike'?'#6366f1':'#6b7280', fontFamily:FONT }}>{reactions.dislikes}</span>
          </motion.button>
          {/* Comments count */}
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px' }}>
            <span style={{ fontSize:18 }}>💬</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#6b7280', fontFamily:FONT }}>{comments.length}</span>
          </div>

          {/* Spacer */}
          <div style={{ flex:1 }}/>

          {/* Download */}
          <motion.button whileTap={{ scale:.94 }} onClick={handleDownload} disabled={downloading}
            style={{ display:'flex', alignItems:'center', gap:6, border:'1.5px solid #e5e7eb', borderRadius:10, padding:'7px 13px', background:downloading?'#f9fafb':'#fff', cursor:downloading?'default':'pointer', transition:'all .18s', flexShrink:0 }}
            onMouseEnter={e => { if(!downloading){ e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#86efac' }}}
            onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e5e7eb' }}>
            {downloading
              ? <motion.span animate={{ rotate:360 }} transition={{ duration:.9, repeat:Infinity, ease:'linear' }} style={{ display:'inline-block', fontSize:15 }}>⟳</motion.span>
              : <span style={{ fontSize:15 }}>⬇️</span>
            }
            <span style={{ fontSize:12, fontWeight:700, color:downloading?'#9ca3af':'#374151', fontFamily:FONT }}>
              {downloading ? 'Saving…' : 'Download'}
            </span>
          </motion.button>

          {/* Share — toggles sheet */}
          <div style={{ position:'relative' }} ref={shareRef}>
            <motion.button whileTap={{ scale:.94 }} onClick={() => setShowShare(v => !v)}
              style={{ display:'flex', alignItems:'center', gap:6, border:`1.5px solid ${showShare?'#6366f1':'#e5e7eb'}`, borderRadius:10, padding:'7px 13px', background:showShare?'#eef2ff':'#fff', cursor:'pointer', transition:'all .18s', flexShrink:0 }}
              onMouseEnter={e => { if(!showShare){ e.currentTarget.style.background='#eef2ff'; e.currentTarget.style.borderColor='#a5b4fc' }}}
              onMouseLeave={e => { if(!showShare){ e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e5e7eb' }}}>
              <span style={{ fontSize:15 }}>🔗</span>
              <span style={{ fontSize:12, fontWeight:700, color: showShare?'#4f46e5':'#374151', fontFamily:FONT }}>Share</span>
            </motion.button>
          </div>
        </div>

        {/* ── SHARE SHEET ── */}
        <AnimatePresence>
          {showShare && (
            <motion.div
              initial={{ opacity:0, y:-8, scaleY:.92 }}
              animate={{ opacity:1, y:0, scaleY:1 }}
              exit={{ opacity:0, y:-8, scaleY:.92 }}
              transition={{ type:'spring', damping:22, stiffness:320 }}
              data-share-sheet="1"
              style={{ background:'#fafafa', borderBottom:'1px solid #e5e7eb', padding:'14px 16px', flexShrink:0, transformOrigin:'top' }}
            >
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:.5, fontFamily:FONT, marginBottom:10 }}>
                Share via
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {SHARE_OPTIONS.map(opt => (
                  <motion.a
                    key={opt.id}
                    href={opt.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShare(false)}
                    whileTap={{ scale:.93 }}
                    whileHover={{ y:-2 }}
                    style={{ display:'flex', alignItems:'center', gap:7, background:opt.bg, border:`1.5px solid ${opt.hoverBg}`, borderRadius:12, padding:'9px 15px', textDecoration:'none', cursor:'pointer', transition:'all .15s', flex:'1 1 120px' }}
                    onMouseEnter={e => e.currentTarget.style.background=opt.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background=opt.bg}
                  >
                    <span style={{ fontSize:18 }}>{opt.emoji}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:opt.color, fontFamily:FONT }}>{opt.label}</span>
                  </motion.a>
                ))}

                {/* Copy Link */}
                <motion.button
                  whileTap={{ scale:.93 }} whileHover={{ y:-2 }}
                  onClick={copyLink}
                  style={{ display:'flex', alignItems:'center', gap:7, background: copied?'#f0fdf4':'#f3f4f6', border:`1.5px solid ${copied?'#86efac':'#e5e7eb'}`, borderRadius:12, padding:'9px 15px', cursor:'pointer', transition:'all .15s', flex:'1 1 120px' }}
                >
                  <span style={{ fontSize:18 }}>{copied ? '✅' : '📋'}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: copied?'#15803d':'#374151', fontFamily:FONT }}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMMENTS LIST (scrollable) ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>
          {comments.length === 0 && (
            <div style={{ color:'#9ca3af', fontSize:13, textAlign:'center', padding:'18px 0', fontFamily:FONT }}>
              No comments yet · be the first! 💬
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <Avatar name={c.player_name} size={28} style={{ flexShrink:0, marginTop:2 }}/>
              <div style={{ flex:1, background:'#f9fafb', borderRadius:12, padding:'8px 12px' }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#060d2e', fontFamily:FONT, marginBottom:2 }}>{c.player_name}</div>
                <div style={{ fontSize:13, color:'#374151', fontFamily:FONT, lineHeight:1.5, wordBreak:'break-word' }}>{c.text}</div>
                <div style={{ fontSize:10, color:'#9ca3af', marginTop:3, fontFamily:FONT }}>{timeAgo(c.created_at)}</div>
              </div>
              {(myEmail === c.player_email?.toLowerCase() || myEmail === post.player_email?.toLowerCase()) && (
                <button onClick={() => deleteComment(c.id)}
                  style={{ border:'none', background:'transparent', color:'#d1d5db', cursor:'pointer', fontSize:14, padding:'4px', flexShrink:0, marginTop:4 }}
                  onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}>×</button>
              )}
            </div>
          ))}
          <div ref={commentEndRef}/>
        </div>

        {/* ── COMMENT INPUT (pinned bottom) ── */}
        <div style={{ borderTop:'1px solid #f0f0f0', padding:'12px 16px', flexShrink:0, background:'#fff' }}>
          {user ? (
            <div style={{ display:'flex', gap:9, alignItems:'flex-end' }}>
              <Avatar name={playerInfo?.name || user.email} size={30} style={{ flexShrink:0 }}/>
              <div style={{ flex:1, position:'relative' }}>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }}
                  placeholder="Add a comment… (Enter to post)"
                  rows={1}
                  style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:20, padding:'9px 50px 9px 14px', fontFamily:FONT, fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', lineHeight:1.4, maxHeight:90, overflowY:'auto', transition:'border .15s' }}
                  onFocus={e => e.target.style.borderColor='#e9a020'}
                  onBlur={e => e.target.style.borderColor='#e5e7eb'}
                />
                <button onClick={postComment} disabled={!commentText.trim() || posting}
                  style={{ position:'absolute', right:8, bottom:7, border:'none', background: commentText.trim()?'#e9a020':'transparent', borderRadius:99, padding:'4px 10px', color: commentText.trim()?'#fff':'#d1d5db', cursor:commentText.trim()?'pointer':'default', fontWeight:800, fontSize:12, fontFamily:FONT, transition:'all .15s' }}>
                  Post
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', fontSize:12, color:'#9ca3af', fontFamily:FONT, padding:'4px 0' }}>
              Log in to like and comment
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Post Card (grid tile) ───────────────────────────────────────
function PostCard({ post, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      whileHover={{ scale:1.02 }}
      transition={{ type:'spring', damping:20, stiffness:300 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      style={{ position:'relative', aspectRatio:'1', borderRadius:16, overflow:'hidden', cursor:'pointer', background:'#1a1060', boxShadow:'0 4px 20px rgba(0,0,0,.15)' }}
    >
      {post.media_type === 'video'
        ? (
          <>
            <video src={post.media_url} muted playsInline preload="metadata" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            <div style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,.6)', borderRadius:99, padding:'2px 8px', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:12 }}>▶</span>
              <span style={{ fontSize:10, color:'#fff', fontFamily:FONT, fontWeight:700 }}>Video</span>
            </div>
          </>
        )
        : <img src={post.media_url} alt={post.caption||''} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .3s', transform: hovered?'scale(1.05)':'scale(1)' }}/>
      }

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', gap:22 }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'#fff', fontFamily:FONT }}>
              <span style={{ fontSize:20 }}>❤️</span>
              <span style={{ fontSize:14, fontWeight:800 }}>{post._likeCount||0}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'#fff', fontFamily:FONT }}>
              <span style={{ fontSize:20 }}>💬</span>
              <span style={{ fontSize:14, fontWeight:800 }}>{post._commentCount||0}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info overlay */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'28px 10px 10px', background:'linear-gradient(transparent,rgba(0,0,0,.82))' }}>
        {post.title && (
          <div style={{ fontSize:12, color:'#fff', fontFamily:FONT, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
            {post.title}
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:5, overflow:'hidden' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.9)', fontFamily:FONT, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0, maxWidth:'55%' }}>
            {post.player_name}
          </div>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.4)', flexShrink:0 }}>·</span>
          <div style={{ fontSize:9, color:'rgba(255,255,255,.6)', fontFamily:FONT, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {fmtDateShort(post.created_at)}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ───────────────────────────────────────────────────
export default function GalleryPage() {
  const { user } = useAuth()
  const [posts,        setPosts]        = useState([])
  const [playerInfo,   setPlayerInfo]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showUpload,   setShowUpload]   = useState(false)
  const [sortBy,       setSortBy]       = useState('newest') // newest | popular
  const [mediaTab,     setMediaTab]     = useState('photos') // photos | videos

  // Load player info for logged-in user
  useEffect(() => {
    if (!user) return
    supabase.from('players').select('id,name,email').eq('email', user.email).maybeSingle()
      .then(({ data }) => setPlayerInfo(data))
  }, [user])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const { data: rawPosts } = await supabase.from('posts').select('*').order('created_at', { ascending:false })
    if (!rawPosts?.length) { setPosts([]); setLoading(false); return }

    // Load reaction + comment counts in parallel
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase.from('post_reactions').select('post_id,reaction'),
      supabase.from('post_comments').select('post_id'),
    ])

    const likeMap = {}, dislikeMap = {}, commentMap = {}
    ;(reactions||[]).forEach(r => {
      if (r.reaction === 'like')    likeMap[r.post_id]    = (likeMap[r.post_id]||0)+1
      if (r.reaction === 'dislike') dislikeMap[r.post_id] = (dislikeMap[r.post_id]||0)+1
    })
    ;(comments||[]).forEach(c => { commentMap[c.post_id] = (commentMap[c.post_id]||0)+1 })

    const enriched = rawPosts.map(p => ({
      ...p,
      _likeCount:    likeMap[p.id]    || 0,
      _dislikeCount: dislikeMap[p.id] || 0,
      _commentCount: commentMap[p.id] || 0,
    }))
    setPosts(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  // Real-time: new posts appear instantly
  useEffect(() => {
    const ch = supabase.channel('gallery-posts')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'posts' }, () => loadPosts())
      .on('postgres_changes', { event:'DELETE',  schema:'public', table:'posts' }, () => loadPosts())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [loadPosts])

  function handleReactionChange(postId) {
    // Refresh counts on the post in list
    supabase.from('post_reactions').select('post_id,reaction').eq('post_id', postId)
      .then(({ data }) => {
        const likes    = (data||[]).filter(r=>r.reaction==='like').length
        const dislikes = (data||[]).filter(r=>r.reaction==='dislike').length
        setPosts(ps => ps.map(p => p.id===postId ? {...p, _likeCount:likes, _dislikeCount:dislikes} : p))
      })
  }

  function handleCommentChange(postId, newCount) {
    setPosts(ps => ps.map(p => p.id===postId ? {...p, _commentCount:newCount} : p))
    if (selectedPost?.id === postId) setSelectedPost(p => ({...p, _commentCount:newCount}))
  }

  async function handleDelete(postId) {
    // Delete from DB (storage file cleanup is best-effort)
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(ps => ps.filter(p => p.id !== postId))
  }

  const sorted = [...posts].sort((a,b) => {
    if (sortBy === 'popular') return (b._likeCount - a._likeCount) || (b._commentCount - a._commentCount)
    return new Date(b.created_at) - new Date(a.created_at)
  })
  const photos = sorted.filter(p => p.media_type === 'image')
  const videos = sorted.filter(p => p.media_type === 'video')
  const visiblePosts = mediaTab === 'photos' ? photos : videos

  const canPost = !!user

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:FONT, display:'flex', flexDirection:'column' }}>
      <Nav/>

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg, #060d2e 0%, #0f1e5a 50%, #1a1060 100%)', padding:'32px 20px 28px', position:'relative', overflow:'hidden' }}>
        {/* Decorative orbs */}
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(233,160,32,.12)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-30, left:30, width:100, height:100, borderRadius:'50%', background:'rgba(103,232,249,.08)', pointerEvents:'none' }}/>
        <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <span style={{ fontSize:28 }}>📸</span>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:-.3 }}>Team Gallery</h1>
              </div>
              <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.5 }}>
                Share moments, celebrate wins, build team spirit 🏏
              </p>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {/* Sort toggle */}
              <div style={{ display:'flex', background:'rgba(255,255,255,.1)', borderRadius:99, padding:3 }}>
                {['newest','popular'].map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    style={{ padding:'6px 14px', borderRadius:99, border:'none', cursor:'pointer', fontFamily:FONT, fontSize:11, fontWeight:700, transition:'all .2s',
                      background: sortBy===s ? '#e9a020' : 'transparent',
                      color: sortBy===s ? '#fff' : 'rgba(255,255,255,.6)',
                    }}>
                    {s === 'newest' ? '🕐 Latest' : '🔥 Popular'}
                  </button>
                ))}
              </div>
              {canPost && (
                <motion.button
                  whileTap={{ scale:.96 }} whileHover={{ scale:1.04 }}
                  onClick={() => setShowUpload(true)}
                  style={{ background:'linear-gradient(135deg,#e9a020,#f59e0b)', color:'#fff', border:'none', borderRadius:12, padding:'10px 18px', fontFamily:FONT, fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:'0 4px 16px rgba(233,160,32,.5)' }}
                >
                  <span style={{ fontSize:16 }}>+</span> {mediaTab === 'videos' ? 'Post Video' : 'Post Photo'}
                </motion.button>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display:'flex', gap:20, marginTop:18, flexWrap:'wrap' }}>
            {[
              { label:'Photos',   value:posts.filter(p=>p.media_type==='image').length, emoji:'🖼️' },
              { label:'Videos',   value:posts.filter(p=>p.media_type==='video').length, emoji:'🎬' },
              { label:'Likes',    value:posts.reduce((s,p)=>s+p._likeCount,0),          emoji:'❤️' },
              { label:'Comments', value:posts.reduce((s,p)=>s+p._commentCount,0),       emoji:'💬' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:16 }}>{s.emoji}</span>
                <span style={{ fontSize:14, fontWeight:800, color:'#e9a020' }}>{s.value}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,.5)', fontFamily:FONT }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Media Tabs ──────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', position:'sticky', top:56, zIndex:50 }}>
        <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'0 16px', display:'flex', gap:0 }}>
          {[
            { id:'photos', label:'🖼️ Photos', count: posts.filter(p=>p.media_type==='image').length },
            { id:'videos', label:'🎬 Videos', count: posts.filter(p=>p.media_type==='video').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMediaTab(tab.id)}
              style={{
                padding:'14px 22px', border:'none', background:'transparent', cursor:'pointer',
                fontFamily:FONT, fontSize:13, fontWeight: mediaTab===tab.id ? 800 : 500,
                color: mediaTab===tab.id ? '#060d2e' : '#9ca3af',
                borderBottom: `2px solid ${mediaTab===tab.id ? '#e9a020' : 'transparent'}`,
                transition:'all .18s', display:'flex', alignItems:'center', gap:7,
              }}
            >
              {tab.label}
              <span style={{
                background: mediaTab===tab.id ? '#e9a020' : '#f3f4f6',
                color: mediaTab===tab.id ? '#fff' : '#9ca3af',
                borderRadius:99, padding:'1px 8px', fontSize:11, fontWeight:700, fontFamily:FONT,
                transition:'all .18s',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Feed ────────────────────────────────────────────── */}
      <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'24px 16px', width:'100%', boxSizing:'border-box', flex:1 }}>
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            {Array.from({length:9}).map((_,i) => (
              <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:[0.3,0.6,0.3] }} transition={{ duration:1.4, repeat:Infinity, delay:i*.08 }}
                style={{ aspectRatio:'1', borderRadius:16, background:'#e5e7eb' }}/>
            ))}
          </div>
        ) : visiblePosts.length === 0 ? (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:60, marginBottom:16 }}>{mediaTab === 'videos' ? '🎬' : '📷'}</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#060d2e', fontFamily:FONT, marginBottom:8 }}>
              No {mediaTab === 'videos' ? 'videos' : 'photos'} yet!
            </div>
            <div style={{ fontSize:14, color:'#9ca3af', fontFamily:FONT, marginBottom:24 }}>
              {mediaTab === 'videos' ? 'Share a match or training video 🎥' : 'Be the first to share a team moment 🏏'}
            </div>
            {canPost && (
              <motion.button whileTap={{ scale:.96 }} onClick={() => setShowUpload(true)}
                style={{ background:'linear-gradient(135deg,#e9a020,#f59e0b)', color:'#fff', border:'none', borderRadius:14, padding:'13px 28px', fontFamily:FONT, fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 20px rgba(233,160,32,.4)' }}>
                {mediaTab === 'videos' ? '🎬 Upload First Video' : '📸 Share First Photo'}
              </motion.button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={mediaTab}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:.22, ease:'easeOut' }}
              style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}
            >
              {visiblePosts.map((post, i) => (
                <motion.div key={post.id}
                  initial={{ opacity:0, scale:.92 }} animate={{ opacity:1, scale:1 }}
                  transition={{ type:'spring', damping:20, delay: Math.min(i * .04, .3) }}
                >
                  <PostCard post={post} onClick={() => setSelectedPost(post)}/>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            user={user}
            playerInfo={playerInfo}
            onClose={() => setShowUpload(false)}
            onPosted={() => { setShowUpload(false); loadPosts() }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost && (
          <LightboxModal
            post={selectedPost}
            user={user}
            playerInfo={playerInfo}
            onClose={() => setSelectedPost(null)}
            onReactionChange={handleReactionChange}
            onCommentChange={handleCommentChange}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
