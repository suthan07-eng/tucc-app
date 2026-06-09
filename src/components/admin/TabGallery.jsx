import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import { C, FONT } from '../../constants'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import { Skeleton } from '../ui/Loader'
import { useToast } from '../Toast'

const BUCKET = 'team-media'
const ADMIN_NAME = 'Tamil United CC (Admin)'
const ADMIN_EMAIL = 'suthan07@gmail.com'

function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function isVideo(url) { return /\.(mp4|mov|webm|ogg)$/i.test(url||'') }

// ── Admin Upload Modal (bulk) ─────────────────────────────────
function AdminUploadModal({ onClose, onPosted }) {
  const [items,     setItems]     = useState([])
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [globalErr, setGlobalErr] = useState('')
  const inputRef = useRef()

  const MAX_FILES = 20

  function addFiles(fileList) {
    const newFiles = Array.from(fileList)
    const errors = [], valid = []
    newFiles.forEach(f => {
      const maxMB = f.type.startsWith('video') ? 100 : 20
      if (f.size > maxMB * 1024 * 1024) { errors.push(`${f.name} exceeds ${maxMB} MB`); return }
      valid.push(f)
    })
    if (errors.length) setGlobalErr(errors.join(' · '))
    const toAdd = valid.slice(0, MAX_FILES - items.length)
    setItems(prev => [...prev, ...toAdd.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f, preview: URL.createObjectURL(f),
      title:'', caption:'', status:'pending', error:'',
    }))])
  }

  function removeItem(id) { setItems(prev => prev.filter(x => x.id !== id)) }
  function updateItem(id, patch) { setItems(prev => prev.map(x => x.id===id ? {...x,...patch} : x)) }

  async function uploadOne(item) {
    updateItem(item.id, { status:'uploading' })
    try {
      const ext  = item.file.name.split('.').pop()
      const path = `posts/${Date.now()}-admin-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, item.file, { cacheControl:'3600', upsert:false })
      if (upErr) throw upErr
      const { data:{ publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const { error: dbErr } = await supabase.from('posts').insert({
        player_id:null, player_name:ADMIN_NAME, player_email:ADMIN_EMAIL,
        media_url:publicUrl, media_type:item.file.type.startsWith('video')?'video':'image',
        title:item.title.trim()||null, caption:item.caption.trim()||null,
      })
      if (dbErr) throw dbErr
      updateItem(item.id, { status:'done' })
    } catch(e) {
      updateItem(item.id, { status:'error', error:e.message||'Upload failed' })
    }
  }

  async function submitAll() {
    const pending = items.filter(x => x.status !== 'done')
    if (!pending.length) { setGlobalErr('Select files first'); return }
    setUploading(true); setGlobalErr('')
    // Upload all files in parallel — each item updates its own status via updateItem
    await Promise.allSettled(pending.map(item => uploadOne(item)))
    setUploading(false)
    onPosted()
    onClose()
  }

  const progress = items.length ? Math.round((items.filter(x=>x.status==='done').length / items.length)*100) : 0

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:12,
        background:'rgba(0,0,0,.65)', backdropFilter:'blur(8px)' }}
      onClick={e => { if(e.target===e.currentTarget && !uploading) onClose() }}
    >
      <motion.div
        initial={{ scale:.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.9, opacity:0 }}
        transition={{ type:'spring', damping:24, stiffness:300 }}
        style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:640, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:C.dark, fontFamily:FONT }}>📤 Upload as Admin {items.length>1?`— ${items.length} items`:''}</div>
            <div style={{ fontSize:11, color:C.gray3, fontFamily:FONT, marginTop:1 }}>Select multiple photos & videos at once</div>
          </div>
          <button onClick={onClose} disabled={uploading} style={{ width:30, height:30, borderRadius:'50%', border:'none', background:'#f3f4f6', cursor:'pointer', fontSize:16, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', opacity:uploading?.5:1 }}>×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Drop zone */}
          <div
            onDrop={e=>{ e.preventDefault(); setDragging(false); if(!uploading) addFiles(e.dataTransfer.files) }}
            onDragOver={e=>{ e.preventDefault(); setDragging(true) }}
            onDragLeave={()=>setDragging(false)}
            onClick={()=>{ if(!uploading) inputRef.current?.click() }}
            style={{ border:`2px dashed ${dragging?'#e9a020':'#d1d5db'}`, borderRadius:14, padding:items.length?'14px 16px':'28px 16px', cursor:uploading?'default':'pointer', textAlign:'center', background:dragging?'#fffbeb':'#fafafa', transition:'all .2s', flexShrink:0 }}
          >
            {items.length===0 ? (
              <>
                <div style={{ fontSize:32, marginBottom:6 }}>📷</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#374151', fontFamily:FONT }}>Drop or click to select files</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:3, fontFamily:FONT }}>Multiple files supported · Images & Videos · up to {MAX_FILES} items</div>
              </>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                <span style={{ fontSize:18 }}>➕</span>
                <span style={{ fontSize:13, fontWeight:700, color:dragging?'#e9a020':C.gray4, fontFamily:FONT }}>Add more files ({items.length}/{MAX_FILES})</span>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple style={{ display:'none' }} onChange={e=>{ addFiles(e.target.files); e.target.value='' }}/>

          {globalErr && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#dc2626', fontFamily:FONT }}>{globalErr}</div>}

          {/* Item cards */}
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div key={item.id}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20 }}
                style={{ border: item.status==='done'?'2px solid #bbf7d0':item.status==='error'?'2px solid #fecaca':item.status==='uploading'?'2px solid #fde68a':'1.5px solid #f0f0f0', borderRadius:14, overflow:'hidden', background:'#fff', boxShadow:'0 1px 6px rgba(0,0,0,.06)' }}
              >
                <div style={{ display:'flex' }}>
                  <div style={{ width:100, flexShrink:0, position:'relative', background:'#000' }}>
                    {item.file.type.startsWith('video')
                      ? <video src={item.preview} muted playsInline preload="metadata" style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:100 }}/>
                      : <img src={item.preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:100, display:'block' }}/>
                    }
                    {item.status==='uploading' && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center' }}><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}} style={{width:22,height:22,borderRadius:'50%',border:'3px solid rgba(255,255,255,.3)',borderTopColor:'#fff'}}/></div>}
                    {item.status==='done'  && <div style={{ position:'absolute', inset:0, background:'rgba(21,128,61,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>✅</div>}
                    {item.status==='error' && <div style={{ position:'absolute', inset:0, background:'rgba(220,38,38,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>❌</div>}
                    <div style={{ position:'absolute', top:5, left:5, background:'rgba(0,0,0,.55)', borderRadius:99, padding:'2px 6px', fontSize:9, color:'#fff', fontFamily:FONT, fontWeight:700 }}>
                      {item.file.type.startsWith('video')?'🎬':'🖼️'} {idx+1}
                    </div>
                  </div>
                  <div style={{ flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
                    <input value={item.title} onChange={e=>updateItem(item.id,{title:e.target.value})} placeholder="Title (e.g. Match Day 🏏)" disabled={uploading} maxLength={80}
                      style={{ border:'1.5px solid #e5e7eb', borderRadius:7, padding:'5px 9px', fontFamily:FONT, fontSize:12, color:C.dark, outline:'none', boxSizing:'border-box', fontWeight:700 }}/>
                    <textarea value={item.caption} onChange={e=>updateItem(item.id,{caption:e.target.value})} placeholder="Caption…" disabled={uploading} maxLength={300} rows={2}
                      style={{ border:'1.5px solid #e5e7eb', borderRadius:7, padding:'5px 9px', fontFamily:FONT, fontSize:12, color:C.dark, resize:'none', outline:'none', boxSizing:'border-box', lineHeight:1.4 }}/>
                    {item.error && <div style={{ fontSize:11, color:'#dc2626', fontFamily:FONT }}>{item.error}</div>}
                  </div>
                  {!uploading && <button onClick={()=>removeItem(item.id)} style={{ width:32, background:'transparent', border:'none', cursor:'pointer', color:'#d1d5db', fontSize:17, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'10px 6px 0', flexShrink:0 }}
                    onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#d1d5db'}>×</button>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #f0f0f0', flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>
          {uploading && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:700, color:C.dark, fontFamily:FONT }}>Uploading {items.filter(x=>x.status==='done').length} of {items.length}…</span>
                <span style={{ fontSize:12, color:C.gray3, fontFamily:FONT }}>{progress}%</span>
              </div>
              <div style={{ background:'#f3f4f6', borderRadius:99, height:5, overflow:'hidden' }}>
                <motion.div animate={{width:`${progress}%`}} transition={{duration:.3}} style={{height:'100%',background:'linear-gradient(90deg,#e9a020,#f59e0b)',borderRadius:99}}/>
              </div>
            </div>
          )}
          <button onClick={submitAll} disabled={uploading||!items.length}
            style={{ background:items.length?'linear-gradient(135deg,#e9a020,#f59e0b)':'#e5e7eb', color:items.length?'#fff':'#9ca3af', border:'none', borderRadius:12, padding:'12px', fontFamily:FONT, fontSize:14, fontWeight:800, cursor:items.length&&!uploading?'pointer':'default' }}>
            {uploading ? `Uploading ${items.filter(x=>x.status==='done').length} of ${items.length}…`
              : items.length===0 ? '📷 Select files'
              : items.length===1 ? '🚀 Publish Post'
              : `🚀 Publish All ${items.length} Posts`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Comment moderation row ─────────────────────────────────────
function CommentRow({ comment, onDelete }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
      <Avatar name={comment.player_name} size={26} style={{ flexShrink:0, marginTop:2 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:11, color:C.dark, fontFamily:FONT }}>{comment.player_name}</span>
          <span style={{ fontSize:10, color:C.gray3, fontFamily:FONT }}>{timeAgo(comment.created_at)}</span>
        </div>
        <div style={{ fontSize:12, color:'#374151', fontFamily:FONT, wordBreak:'break-word', lineHeight:1.4 }}>{comment.text}</div>
      </div>
      <button onClick={() => onDelete(comment.id)}
        style={{ border:'none', background:'transparent', color:C.gray3, cursor:'pointer', fontSize:16, fontWeight:700, padding:'2px 4px', flexShrink:0 }}
        onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color=C.gray3}
        title="Delete comment"
      >×</button>
    </div>
  )
}

// ── Admin Post Card ────────────────────────────────────────────
function AdminPostCard({ post, onDelete, onViewComments }) {
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState(null)

  async function loadComments() {
    if (comments !== null) { setShowComments(v => !v); return }
    const { data } = await supabase.from('post_comments').select('*').eq('post_id', post.id).order('created_at')
    setComments(data || [])
    setShowComments(true)
  }

  async function deleteComment(cId) {
    await supabase.from('post_comments').delete().eq('id', cId)
    setComments(c => c.filter(x => x.id !== cId))
  }

  return (
    <motion.div
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.07)', border:'1px solid #f0f0f0' }}
    >
      {/* Thumbnail */}
      <div style={{ position:'relative', aspectRatio:'1', background:'#1a1060', overflow:'hidden' }}>
        {post.media_type==='video'
          ? <video src={post.media_url} muted playsInline preload="metadata" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <img src={post.media_url} alt="" loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        }
        {/* Delete overlay */}
        <button
          onClick={() => onDelete(post.id, post.media_url)}
          style={{ position:'absolute', top:8, right:8, width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(220,38,38,.85)', color:'#fff', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}
          title="Delete post"
        >🗑</button>
        {post.media_type==='video' && (
          <div style={{ position:'absolute', bottom:6, left:6, background:'rgba(0,0,0,.55)', borderRadius:99, padding:'2px 7px', fontSize:9, color:'#fff', fontFamily:FONT, fontWeight:700 }}>▶ VIDEO</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
          <Avatar name={post.player_name} size={22}/>
          <span style={{ fontSize:11, fontWeight:700, color:C.dark, fontFamily:FONT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{post.player_name}</span>
          <span style={{ fontSize:9, color:C.gray3, fontFamily:FONT, flexShrink:0 }}>{timeAgo(post.created_at)}</span>
        </div>
        {post.title && <div style={{ fontSize:12, fontWeight:800, color:C.dark, fontFamily:FONT, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</div>}
        {post.caption && <div style={{ fontSize:11, color:'#374151', fontFamily:FONT, lineHeight:1.4, marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{post.caption}</div>}

        {/* Counts */}
        <div style={{ display:'flex', gap:12, marginBottom:8 }}>
          <span style={{ fontSize:11, color:C.gray4, fontFamily:FONT }}>❤️ {post._likeCount||0}</span>
          <span style={{ fontSize:11, color:C.gray4, fontFamily:FONT }}>👎 {post._dislikeCount||0}</span>
          <span style={{ fontSize:11, color:C.gray4, fontFamily:FONT }}>💬 {post._commentCount||0}</span>
        </div>

        {/* Comments toggle */}
        {(post._commentCount||0) > 0 && (
          <button onClick={loadComments}
            style={{ border:`1px solid ${showComments ? '#e9a020' : C.gray2}`, borderRadius:8, padding:'5px 10px', background:'transparent', cursor:'pointer', fontFamily:FONT, fontSize:11, fontWeight:700, color: showComments ? '#e9a020' : C.gray4, width:'100%', transition:'all .15s' }}>
            {showComments ? '▲ Hide' : `💬 Moderate ${post._commentCount} comment${post._commentCount>1?'s':''}`}
          </button>
        )}

        <AnimatePresence>
          {showComments && comments && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ marginTop:8 }}>
              {comments.map(c => <CommentRow key={c.id} comment={c} onDelete={deleteComment}/>)}
              {comments.length === 0 && <div style={{ fontSize:11, color:C.gray3, fontFamily:FONT, textAlign:'center', padding:'6px 0' }}>No comments</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Main Admin Tab ─────────────────────────────────────────────
export default function TabGallery() {
  const toast = useToast()
  const [posts,       setPosts]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showUpload,  setShowUpload]  = useState(false)
  const [filterBy,    setFilterBy]    = useState('all') // all | image | video
  const [searchName,  setSearchName]  = useState('')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const { data: rawPosts } = await supabase.from('posts').select('*').order('created_at', { ascending:false })
    if (!rawPosts?.length) { setPosts([]); setLoading(false); return }

    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase.from('post_reactions').select('post_id,reaction'),
      supabase.from('post_comments').select('post_id'),
    ])
    const likeMap={}, dislikeMap={}, commentMap={}
    ;(reactions||[]).forEach(r => {
      if(r.reaction==='like')    likeMap[r.post_id]    = (likeMap[r.post_id]||0)+1
      if(r.reaction==='dislike') dislikeMap[r.post_id] = (dislikeMap[r.post_id]||0)+1
    })
    ;(comments||[]).forEach(c => { commentMap[c.post_id]=(commentMap[c.post_id]||0)+1 })

    setPosts(rawPosts.map(p => ({
      ...p,
      _likeCount:    likeMap[p.id]||0,
      _dislikeCount: dislikeMap[p.id]||0,
      _commentCount: commentMap[p.id]||0,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  async function handleDelete(postId, mediaUrl) {
    try {
      await supabase.from('posts').delete().eq('id', postId)
      // Try to clean up storage (best-effort)
      const path = mediaUrl?.split('/team-media/')[1]
      if (path) await supabase.storage.from(BUCKET).remove([path])
      setPosts(ps => ps.filter(p => p.id !== postId))
      toast('Post deleted')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const filtered = posts.filter(p => {
    if (filterBy !== 'all' && p.media_type !== filterBy) return false
    if (searchName && !p.player_name?.toLowerCase().includes(searchName.toLowerCase())) return false
    return true
  })

  const totalLikes    = posts.reduce((s,p) => s+p._likeCount, 0)
  const totalComments = posts.reduce((s,p) => s+p._commentCount, 0)
  const topPost       = [...posts].sort((a,b) => b._likeCount-a._likeCount)[0]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, fontFamily:FONT }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.dark }}>📸 Gallery Management</div>
        <button onClick={() => setShowUpload(true)}
          style={{ background:'linear-gradient(135deg,#e9a020,#f59e0b)', color:'#fff', border:'none', borderRadius:10, padding:'9px 16px', fontFamily:FONT, fontSize:12, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          + Upload Post
        </button>
      </div>

      {/* Summary pills */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { label:'Total Posts',    value:posts.length,    bg:'#eff6ff', color:'#2563eb', emoji:'🖼️' },
          { label:'Total Likes',    value:totalLikes,      bg:'#fef2f2', color:'#dc2626', emoji:'❤️' },
          { label:'Total Comments', value:totalComments,   bg:'#f0fdf4', color:'#15803d', emoji:'💬' },
          { label:'Videos',         value:posts.filter(p=>p.media_type==='video').length, bg:'#fdf4ff', color:'#7c3aed', emoji:'🎬' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'10px 16px', minWidth:90, flexShrink:0 }}>
            <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:10, fontWeight:700, color:s.color, marginTop:3, textTransform:'uppercase', letterSpacing:.4, opacity:.8 }}>{s.emoji} {s.label}</div>
          </div>
        ))}
      </div>

      {/* Top post callout */}
      {topPost && topPost._likeCount > 0 && (
        <div style={{ background:'linear-gradient(135deg,#fffbeb,#fef9c3)', border:'1.5px solid #fde68a', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24, flexShrink:0 }}>🏆</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:13, color:'#92400e', fontFamily:FONT }}>Most Liked Post</div>
            <div style={{ fontSize:12, color:'#78350f', fontFamily:FONT, marginTop:2 }}>
              By {topPost.player_name} · ❤️ {topPost._likeCount} likes · 💬 {topPost._commentCount} comments
            </div>
            {topPost.caption && <div style={{ fontSize:11, color:'#92400e', fontFamily:FONT, marginTop:2, opacity:.8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>"{topPost.caption}"</div>}
          </div>
          <div style={{ width:50, height:50, borderRadius:10, overflow:'hidden', flexShrink:0 }}>
            {topPost.media_type==='video'
              ? <video src={topPost.media_url} muted playsInline preload="metadata" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <img src={topPost.media_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/>
            }
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', background:C.gray1, borderRadius:10, padding:3 }}>
          {[{id:'all',label:'All'},{id:'image',label:'🖼 Photos'},{id:'video',label:'🎬 Videos'}].map(f => (
            <button key={f.id} onClick={() => setFilterBy(f.id)}
              style={{ padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:FONT, fontSize:11, fontWeight:700, transition:'all .15s',
                background:filterBy===f.id?'#fff':'transparent', color:filterBy===f.id?C.dark:C.gray3,
                boxShadow:filterBy===f.id?'0 1px 4px rgba(0,0,0,.1)':'none', whiteSpace:'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={searchName} onChange={e => setSearchName(e.target.value)}
          placeholder="🔍 Filter by player name…"
          style={{ border:`1.5px solid ${C.gray2}`, borderRadius:10, padding:'7px 12px', fontFamily:FONT, fontSize:12, color:C.dark, outline:'none', minWidth:180, background:'#fff' }}
        />
        <span style={{ fontSize:12, color:C.gray3, fontFamily:FONT }}>
          {filtered.length} post{filtered.length!==1?'s':''}
        </span>
      </div>

      {/* Posts grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
          {Array.from({length:8}).map((_,i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <Skeleton width="100%" height={180} borderRadius={16}/>
              <Skeleton width={120} height={10}/>
              <Skeleton width={80} height={10}/>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px', color:C.gray3, fontSize:14, fontFamily:FONT }}>
          {posts.length === 0 ? '📷 No posts yet — upload one!' : 'No posts match this filter.'}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
          {filtered.map(post => (
            <AdminPostCard key={post.id} post={post} onDelete={handleDelete}/>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload && (
          <AdminUploadModal
            onClose={() => setShowUpload(false)}
            onPosted={() => { setShowUpload(false); loadPosts(); toast('Post published! 🚀') }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
