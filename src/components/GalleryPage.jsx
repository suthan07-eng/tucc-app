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

// ── Upload Modal ────────────────────────────────────────────────
function UploadModal({ user, playerInfo, onClose, onPosted }) {
  const [file,       setFile]       = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [caption,    setCaption]    = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [error,      setError]      = useState('')
  const [dragging,   setDragging]   = useState(false)
  const inputRef = useRef()

  const handleFile = f => {
    if (!f) return
    const maxMB = f.type.startsWith('video') ? 100 : 20
    if (f.size > maxMB * 1024 * 1024) { setError(`File too large (max ${maxMB} MB)`); return }
    setFile(f)
    setError('')
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = e => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function submit() {
    if (!file) { setError('Please select a photo or video'); return }
    setUploading(true); setError(''); setProgress(10)
    try {
      const ext  = file.name.split('.').pop()
      const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      setProgress(30)
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl:'3600', upsert:false })
      if (upErr) throw upErr
      setProgress(70)
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const mediaType = file.type.startsWith('video') ? 'video' : 'image'
      const { error: dbErr } = await supabase.from('posts').insert({
        player_id:    playerInfo?.id   || null,
        player_name:  playerInfo?.name || user.email,
        player_email: user.email,
        media_url:    publicUrl,
        media_type:   mediaType,
        caption:      caption.trim() || null,
      })
      if (dbErr) throw dbErr
      setProgress(100)
      onPosted()
      onClose()
    } catch (e) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
        background:'rgba(6,13,46,.72)', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale:.92, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:.92, opacity:0, y:20 }}
        transition={{ type:'spring', damping:24, stiffness:300 }}
        style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:480, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ fontWeight:800, fontSize:15, color:'#060d2e', fontFamily:FONT }}>📸 New Post</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#f3f4f6', cursor:'pointer', fontSize:18, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Drop zone / preview */}
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#e9a020' : '#d1d5db'}`,
                borderRadius:16, padding:'40px 20px', cursor:'pointer',
                textAlign:'center', background: dragging ? '#fffbeb' : '#fafafa',
                transition:'all .2s',
              }}
            >
              <div style={{ fontSize:40, marginBottom:10 }}>📷</div>
              <div style={{ fontWeight:700, fontSize:14, color:'#374151', fontFamily:FONT }}>Drop photo or video here</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:4, fontFamily:FONT }}>or click to browse · images up to 20 MB · video up to 100 MB</div>
            </div>
          ) : (
            <div style={{ position:'relative', borderRadius:16, overflow:'hidden', aspectRatio:'1', background:'#000' }}>
              {isVideo(file?.name || preview)
                ? <video src={preview} style={{ width:'100%', height:'100%', objectFit:'contain' }} controls/>
                : <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              }
              <button
                onClick={() => { setFile(null); setPreview(null) }}
                style={{ position:'absolute', top:10, right:10, width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(0,0,0,.6)', color:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}
              >×</button>
              <button
                onClick={() => inputRef.current?.click()}
                style={{ position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,.6)', color:'#fff', border:'none', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontSize:11, fontFamily:FONT, fontWeight:700 }}
              >Change</button>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>

          {/* Caption */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', marginBottom:6, textTransform:'uppercase', letterSpacing:.5, fontFamily:FONT }}>Caption (optional)</div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Share what's happening… 🏏"
              maxLength={400}
              style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'10px 12px', fontFamily:FONT, fontSize:14, color:'#374151', resize:'none', minHeight:80, outline:'none', boxSizing:'border-box', lineHeight:1.5 }}
            />
            <div style={{ textAlign:'right', fontSize:11, color:'#9ca3af', marginTop:3 }}>{caption.length}/400</div>
          </div>

          {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#dc2626', fontFamily:FONT }}>{error}</div>}

          {/* Progress bar */}
          {uploading && (
            <div style={{ background:'#f3f4f6', borderRadius:99, height:6, overflow:'hidden' }}>
              <motion.div
                animate={{ width:`${progress}%` }}
                transition={{ duration:.3 }}
                style={{ height:'100%', background:'linear-gradient(90deg,#e9a020,#f59e0b)', borderRadius:99 }}
              />
            </div>
          )}

          <button
            onClick={submit}
            disabled={uploading || !file}
            style={{
              background: file ? 'linear-gradient(135deg,#e9a020,#f59e0b)' : '#e5e7eb',
              color: file ? '#fff' : '#9ca3af',
              border:'none', borderRadius:14, padding:'14px', fontFamily:FONT, fontSize:15, fontWeight:800,
              cursor: file && !uploading ? 'pointer' : 'default',
              transition:'all .2s', boxShadow: file ? '0 4px 16px rgba(233,160,32,.4)' : 'none',
            }}
          >
            {uploading ? `Uploading… ${progress}%` : '🚀 Share Post'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Lightbox Modal ──────────────────────────────────────────────
function LightboxModal({ post, user, playerInfo, onClose, onReactionChange, onCommentChange, onDelete }) {
  const [comments,    setComments]    = useState([])
  const [commentText, setCommentText] = useState('')
  const [posting,     setPosting]     = useState(false)
  const [reactions,   setReactions]   = useState({ likes:0, dislikes:0, mine:null })
  const [animLike,    setAnimLike]    = useState(false)
  const commentEndRef = useRef()

  const myEmail = user?.email?.toLowerCase()
  const isOwner = myEmail && post.player_email?.toLowerCase() === myEmail

  useEffect(() => {
    loadComments()
    loadReactions()
  }, [post.id])

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
      // toggle off
      await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('player_email', myEmail)
      setReactions(r => ({ ...r, likes: r.likes - (type==='like'?1:0), dislikes: r.dislikes - (type==='dislike'?1:0), mine: null }))
    } else if (current) {
      // switch reaction
      await supabase.from('post_reactions').update({ reaction:type }).eq('post_id', post.id).eq('player_email', myEmail)
      setReactions(r => ({
        likes:    r.likes    + (type==='like'?1:-1),
        dislikes: r.dislikes + (type==='dislike'?1:-1),
        mine:     type,
      }))
    } else {
      // new reaction
      await supabase.from('post_reactions').insert({ post_id:post.id, player_email:myEmail, player_name: playerInfo?.name || user.email, reaction:type })
      setReactions(r => ({ ...r, likes: r.likes+(type==='like'?1:0), dislikes: r.dislikes+(type==='dislike'?1:0), mine:type }))
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

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(0,0,0,.85)', backdropFilter:'blur(6px)', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale:.94, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.94, opacity:0 }}
        transition={{ type:'spring', damping:26, stiffness:300 }}
        style={{
          display:'flex', flexDirection:'row',
          background:'#fff', borderRadius:20, overflow:'hidden',
          width:'100%', maxWidth:940, maxHeight:'92vh',
          boxShadow:'0 40px 100px rgba(0,0,0,.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* LEFT — Media */}
        <div style={{ flex:'0 0 55%', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', minHeight:400 }}>
          {post.media_type === 'video'
            ? <video src={post.media_url} controls autoPlay muted style={{ width:'100%', maxHeight:'92vh', objectFit:'contain' }}/>
            : (
              <>
                <img src={post.media_url} alt={post.caption||''} style={{ width:'100%', maxHeight:'92vh', objectFit:'contain' }}/>
                {/* Double-tap like animation */}
                <AnimatePresence>
                  {animLike && (
                    <motion.div
                      initial={{ scale:0, opacity:1 }} animate={{ scale:1.6, opacity:0 }} exit={{ opacity:0 }}
                      transition={{ duration:.7 }}
                      style={{ position:'absolute', fontSize:80, pointerEvents:'none' }}
                    >❤️</motion.div>
                  )}
                </AnimatePresence>
              </>
            )
          }
          {/* Close btn */}
          <button
            onClick={onClose}
            style={{ position:'absolute', top:14, left:14, width:34, height:34, borderRadius:'50%', border:'none', background:'rgba(0,0,0,.55)', color:'#fff', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}
          >←</button>
        </div>

        {/* RIGHT — Details */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Post header */}
          <div style={{ padding:'16px 18px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <Avatar name={post.player_name} size={38}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:14, color:'#060d2e', fontFamily:FONT }}>{post.player_name}</div>
              <div style={{ fontSize:11, color:'#9ca3af', fontFamily:FONT }}>{timeAgo(post.created_at)}</div>
            </div>
            {(isOwner) && (
              <button
                onClick={() => { onDelete(post.id); onClose() }}
                style={{ border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', fontSize:12, fontFamily:FONT, fontWeight:700, padding:'4px 8px', borderRadius:8 }}
              >🗑 Delete</button>
            )}
          </div>

          {/* Caption */}
          {post.caption && (
            <div style={{ padding:'12px 18px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
              <span style={{ fontWeight:700, fontSize:13, color:'#060d2e', fontFamily:FONT }}>{post.player_name} </span>
              <span style={{ fontSize:13, color:'#374151', fontFamily:FONT, lineHeight:1.5 }}>{post.caption}</span>
            </div>
          )}

          {/* Comments */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 18px', display:'flex', flexDirection:'column', gap:10 }}>
            {comments.length === 0 && (
              <div style={{ color:'#9ca3af', fontSize:13, textAlign:'center', padding:'20px 0', fontFamily:FONT }}>
                No comments yet · be the first! 💬
              </div>
            )}
            {comments.map(c => (
              <div key={c.id} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                <Avatar name={c.player_name} size={28} style={{ flexShrink:0, marginTop:2 }}/>
                <div style={{ flex:1, background:'#f9fafb', borderRadius:12, padding:'8px 12px', position:'relative' }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'#060d2e', fontFamily:FONT, marginBottom:2 }}>{c.player_name}</div>
                  <div style={{ fontSize:13, color:'#374151', fontFamily:FONT, lineHeight:1.5, wordBreak:'break-word' }}>{c.text}</div>
                  <div style={{ fontSize:10, color:'#9ca3af', marginTop:4, fontFamily:FONT }}>{timeAgo(c.created_at)}</div>
                </div>
                {(myEmail === c.player_email?.toLowerCase() || myEmail === post.player_email?.toLowerCase()) && (
                  <button onClick={() => deleteComment(c.id)} style={{ border:'none', background:'transparent', color:'#d1d5db', cursor:'pointer', fontSize:14, padding:'4px', flexShrink:0, marginTop:4 }}
                    onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}
                  >×</button>
                )}
              </div>
            ))}
            <div ref={commentEndRef}/>
          </div>

          {/* Reactions + comment input */}
          <div style={{ borderTop:'1px solid #f0f0f0', padding:'12px 18px', flexShrink:0 }}>
            {/* Reaction row */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <motion.button
                whileTap={{ scale:1.3 }}
                onClick={() => handleReaction('like')}
                style={{ border:'none', background:'none', cursor: user ? 'pointer':'default', padding:0, display:'flex', alignItems:'center', gap:5, fontFamily:FONT }}
              >
                <span style={{ fontSize:22, filter: reactions.mine==='like'?'none':'grayscale(1)', transition:'filter .2s' }}>❤️</span>
                <span style={{ fontSize:13, fontWeight:700, color: reactions.mine==='like'?'#ef4444':'#6b7280' }}>{reactions.likes}</span>
              </motion.button>
              <motion.button
                whileTap={{ scale:1.3 }}
                onClick={() => handleReaction('dislike')}
                style={{ border:'none', background:'none', cursor: user ? 'pointer':'default', padding:0, display:'flex', alignItems:'center', gap:5, fontFamily:FONT }}
              >
                <span style={{ fontSize:22, filter: reactions.mine==='dislike'?'none':'grayscale(1)', transition:'filter .2s' }}>👎</span>
                <span style={{ fontSize:13, fontWeight:700, color: reactions.mine==='dislike'?'#6366f1':'#6b7280' }}>{reactions.dislikes}</span>
              </motion.button>
              <div style={{ marginLeft:'auto', fontSize:12, color:'#9ca3af', fontFamily:FONT }}>💬 {comments.length}</div>
            </div>
            {/* Comment input */}
            {user ? (
              <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                <Avatar name={playerInfo?.name || user.email} size={28} style={{ flexShrink:0 }}/>
                <div style={{ flex:1, position:'relative' }}>
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }}
                    placeholder="Add a comment…"
                    rows={1}
                    style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:20, padding:'8px 44px 8px 14px', fontFamily:FONT, fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', lineHeight:1.4, maxHeight:100, overflowY:'auto' }}
                  />
                  <button
                    onClick={postComment}
                    disabled={!commentText.trim() || posting}
                    style={{ position:'absolute', right:8, bottom:6, border:'none', background:'none', color: commentText.trim()? '#e9a020':'#d1d5db', cursor: commentText.trim()?'pointer':'default', fontWeight:800, fontSize:13, fontFamily:FONT, padding:4 }}
                  >Post</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', fontSize:12, color:'#9ca3af', fontFamily:FONT }}>
                Log in to like and comment
              </div>
            )}
          </div>
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

      {/* Player badge */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'20px 10px 10px', background:'linear-gradient(transparent,rgba(0,0,0,.65))' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.9)', fontFamily:FONT, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {post.player_name}
        </div>
        {post.caption && (
          <div style={{ fontSize:10, color:'rgba(255,255,255,.7)', fontFamily:FONT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
            {post.caption}
          </div>
        )}
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

  const sortedPosts = [...posts].sort((a,b) => {
    if (sortBy === 'popular') return (b._likeCount - a._likeCount) || (b._commentCount - a._commentCount)
    return new Date(b.created_at) - new Date(a.created_at)
  })

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
                  <span style={{ fontSize:16 }}>+</span> Post Photo
                </motion.button>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display:'flex', gap:20, marginTop:18, flexWrap:'wrap' }}>
            {[
              { label:'Posts',    value:posts.length,                                emoji:'🖼️' },
              { label:'Likes',    value:posts.reduce((s,p)=>s+p._likeCount,0),       emoji:'❤️' },
              { label:'Comments', value:posts.reduce((s,p)=>s+p._commentCount,0),    emoji:'💬' },
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

      {/* ── Feed ────────────────────────────────────────────── */}
      <div style={{ maxWidth:MAX_WIDTH, margin:'0 auto', padding:'24px 16px', width:'100%', boxSizing:'border-box', flex:1 }}>
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            {Array.from({length:9}).map((_,i) => (
              <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:[0.3,0.6,0.3] }} transition={{ duration:1.4, repeat:Infinity, delay:i*.08 }}
                style={{ aspectRatio:'1', borderRadius:16, background:'#e5e7eb' }}/>
            ))}
          </div>
        ) : sortedPosts.length === 0 ? (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:60, marginBottom:16 }}>📷</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#060d2e', fontFamily:FONT, marginBottom:8 }}>No posts yet!</div>
            <div style={{ fontSize:14, color:'#9ca3af', fontFamily:FONT, marginBottom:24 }}>Be the first to share a team moment 🏏</div>
            {canPost && (
              <motion.button whileTap={{ scale:.96 }} onClick={() => setShowUpload(true)}
                style={{ background:'linear-gradient(135deg,#e9a020,#f59e0b)', color:'#fff', border:'none', borderRadius:14, padding:'13px 28px', fontFamily:FONT, fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 20px rgba(233,160,32,.4)' }}>
                📸 Share First Post
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible:{ transition:{ staggerChildren:.04 } } }}
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}
          >
            {sortedPosts.map(post => (
              <motion.div key={post.id} variants={{ hidden:{ opacity:0, scale:.9 }, visible:{ opacity:1, scale:1, transition:{ type:'spring', damping:20 } } }}>
                <PostCard post={post} onClick={() => setSelectedPost(post)}/>
              </motion.div>
            ))}
          </motion.div>
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
