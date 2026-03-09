'use client'

/**
 * frontend/app/article/[id]/page.tsx
 *
 * Full story page — shown when user taps any article card.
 * Features:
 *  ✅ Full article body + hero image
 *  ✅ Facebook-style comment section (no login required)
 *  ✅ Persistent name stored in localStorage (feels like you're "logged in")
 *  ✅ Nested replies (1 level deep, like Facebook)
 *  ✅ Like / ❤️ / 😂 reactions per comment
 *  ✅ Report / flag a comment
 *  ✅ Comment count badge
 *  ✅ Real-time optimistic UI (comments appear instantly)
 *  ✅ All data stored in Supabase comments table
 *  ✅ Football platform visual theme
 */

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Article } from '@/lib/supabase'
import { fetchArticleImage, ArticleImage } from '@/lib/images'
import {
  ArrowLeft, ExternalLink, ThumbsUp, Heart, Laugh,
  MessageCircle, Flag, Send, ChevronDown, ChevronUp,
  MoreHorizontal, X, Share2, BookOpen
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
interface Comment {
  id: string
  article_id: string
  parent_id: string | null
  author_name: string
  author_initial: string
  author_color: string
  body: string
  reactions: { thumbs: number; heart: number; laugh: number }
  user_reaction: string | null   // tracked in localStorage
  reported: boolean
  created_at: string
  replies?: Comment[]
}

const REACTIONS = [
  { key: 'thumbs', icon: '👍', label: 'Like' },
  { key: 'heart',  icon: '❤️', label: 'Love' },
  { key: 'laugh',  icon: '😂', label: 'Haha' },
]

const AVATAR_COLORS = [
  '#ef4444','#f97316','#eab308','#22c55e',
  '#00FF87','#3b82f6','#a855f7','#ec4899',
]

function getColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function stripHtml(html: string): string {
  if (!html) return ""
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, `"`)
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60)    return 'Just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

// ── Reaction picker ──────────────────────────────────────────────
function ReactionPicker({ onPick }: { onPick: (r: string) => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: '28px', left: 0,
      display: 'flex', gap: '4px',
      background: 'var(--pitch-surface)',
      border: '1px solid var(--pitch-border)',
      borderRadius: '24px',
      padding: '6px 10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      zIndex: 20,
    }}>
      {REACTIONS.map(r => (
        <button key={r.key} onClick={() => onPick(r.key)}
          title={r.label}
          style={{
            fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer',
            transition: 'transform 0.15s', padding: '2px',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
        >
          {r.icon}
        </button>
      ))}
    </div>
  )
}

// ── Single comment ───────────────────────────────────────────────
function CommentItem({
  comment, onReact, onReply, onReport, depth = 0
}: {
  comment: Comment
  onReact: (id: string, reaction: string) => void
  onReply: (id: string, name: string) => void
  onReport: (id: string) => void
  depth?: number
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [showMenu, setShowMenu]     = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (comment.reported) {
    return (
      <div style={{ marginLeft: depth > 0 ? '40px' : '0', padding: '8px 0' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          This comment has been reported and is under review.
        </p>
      </div>
    )
  }

  const totalReactions = (comment.reactions.thumbs || 0) + (comment.reactions.heart || 0) + (comment.reactions.laugh || 0)

  return (
    <div style={{ marginLeft: depth > 0 ? '40px' : '0', marginTop: depth > 0 ? '8px' : '16px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* Avatar */}
        <div style={{
          flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: comment.author_color,
          fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800,
          color: '#000', textTransform: 'uppercase',
        }}>
          {comment.author_initial}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Bubble */}
          <div style={{
            background: 'var(--pitch-surface)',
            border: '1px solid var(--pitch-border)',
            borderRadius: '12px 12px 12px 3px',
            padding: '10px 12px',
            position: 'relative',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--text-primary)', marginBottom: '4px',
            }}>
              {comment.author_name}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {comment.body}
            </p>

            {/* 3-dot menu */}
            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
              <button onClick={() => setShowMenu(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: '20px',
                  background: 'var(--pitch-mid)', border: '1px solid var(--pitch-border)',
                  borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  zIndex: 10, minWidth: '140px', overflow: 'hidden',
                }}>
                  <button
                    onClick={() => { onReport(comment.id); setShowMenu(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px',
                      fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: 'var(--red-card)', background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <Flag size={11} /> Report
                  </button>
                  <button onClick={() => setShowMenu(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px',
                      fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
                    }}>
                    <X size={11} /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', marginLeft: '4px' }}>
            {/* Reaction button */}
            <div style={{ position: 'relative' }} ref={pickerRef}>
              <button
                onMouseEnter={() => setShowPicker(true)}
                onClick={() => comment.user_reaction
                  ? onReact(comment.id, comment.user_reaction)
                  : setShowPicker(v => !v)
                }
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: comment.user_reaction ? 'var(--green-spark)' : 'var(--text-muted)',
                  transition: 'color 0.15s',
                }}
              >
                {comment.user_reaction
                  ? REACTIONS.find(r => r.key === comment.user_reaction)?.icon + ' ' + REACTIONS.find(r => r.key === comment.user_reaction)?.label
                  : '👍 Like'
                }
              </button>
              {showPicker && (
                <ReactionPicker onPick={r => { onReact(comment.id, r); setShowPicker(false) }} />
              )}
            </div>

            {/* Reply */}
            {depth === 0 && (
              <button onClick={() => onReply(comment.id, comment.author_name)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)',
                  transition: 'color 0.15s',
                }}>
                Reply
              </button>
            )}

            {/* Time */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              {timeAgo(comment.created_at)}
            </span>

            {/* Reaction summary */}
            {totalReactions > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto', letterSpacing: '0.04em' }}>
                {[
                  comment.reactions.thumbs > 0 ? `👍 ${comment.reactions.thumbs}` : '',
                  comment.reactions.heart  > 0 ? `❤️ ${comment.reactions.heart}` : '',
                  comment.reactions.laugh  > 0 ? `😂 ${comment.reactions.laugh}` : '',
                ].filter(Boolean).join('  ')}
              </span>
            )}
          </div>

          {/* Replies toggle */}
          {comment.replies && comment.replies.length > 0 && (
            <button onClick={() => setShowReplies(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', marginLeft: '4px',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--green-spark)',
              }}>
              {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showReplies ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {showReplies && comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} onReact={onReact}
          onReply={onReply} onReport={onReport} depth={1} />
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function ArticlePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [article, setArticle]         = useState<Article | null>(null)
  const [image, setImage]             = useState<ArticleImage | null>(null)
  const [comments, setComments]       = useState<Comment[]>([])
  const [loading, setLoading]         = useState(true)
  const [commLoading, setCommLoading] = useState(true)

  // Author name (persisted in localStorage — feels like "logged in")
  const [authorName, setAuthorName]   = useState('')
  const [nameSet, setNameSet]         = useState(false)
  const [nameInput, setNameInput]     = useState('')

  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo]         = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Reaction state stored per-user in localStorage
  const [userReactions, setUserReactions] = useState<Record<string, string>>({})

  // ── Load author name from localStorage ──────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('nf_author_name')
    if (saved) { setAuthorName(saved); setNameSet(true) }
    const savedReactions = localStorage.getItem('nf_reactions')
    if (savedReactions) setUserReactions(JSON.parse(savedReactions))
  }, [])

  // ── Fetch article ────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    supabase.from('articles').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setArticle(data)
          // Use DB-cached image first — avoids a Pixabay API call
          if (data.image_url) {
            setImage({ src: data.image_url, alt: data.headline || data.title, source: 'db' })
          } else {
            // Sync SVG — no network call
            setImage(fetchArticleImage(data.tags || [], data.headline || data.title))
          }
        }
        setLoading(false)
      })
  }, [id])

  // ── Fetch comments ───────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    fetchComments()
  }, [id])

  async function fetchComments() {
    setCommLoading(true)
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', id)
      .order('created_at', { ascending: true })

    if (data) {
      // Load user reactions from localStorage
      const savedReactions = JSON.parse(localStorage.getItem('nf_reactions') || '{}')

      const flat: Comment[] = data.map((c: any) => ({
        ...c,
        reactions: c.reactions || { thumbs: 0, heart: 0, laugh: 0 },
        user_reaction: savedReactions[c.id] || null,
        replies: [],
      }))

      // Nest replies under parents
      const map: Record<string, Comment> = {}
      flat.forEach(c => { map[c.id] = c })
      const roots: Comment[] = []
      flat.forEach(c => {
        if (c.parent_id && map[c.parent_id]) {
          map[c.parent_id].replies = map[c.parent_id].replies || []
          map[c.parent_id].replies!.push(c)
        } else {
          roots.push(c)
        }
      })
      setComments(roots)
    }
    setCommLoading(false)
  }

  // ── Save name ────────────────────────────────────────────────
  function saveName() {
    const n = nameInput.trim()
    if (!n) return
    localStorage.setItem('nf_author_name', n)
    setAuthorName(n)
    setNameSet(true)
  }

  // ── Submit comment ───────────────────────────────────────────
  async function submitComment() {
    const body = commentText.trim()
    if (!body || !authorName || submitting) return
    setSubmitting(true)

    const newComment = {
      article_id: id,
      parent_id: replyTo?.id || null,
      author_name: authorName,
      author_initial: authorName.charAt(0).toUpperCase(),
      author_color: getColor(authorName),
      body,
      reactions: { thumbs: 0, heart: 0, laugh: 0 },
      reported: false,
    }

    const { data, error } = await supabase.from('comments').insert(newComment).select().single()
    if (!error && data) {
      setCommentText('')
      setReplyTo(null)
      await fetchComments()
    }
    setSubmitting(false)
  }

  // ── React to comment ─────────────────────────────────────────
  async function handleReact(commentId: string, reaction: string) {
    const prev = userReactions[commentId]
    const isRemoving = prev === reaction

    // Optimistic update
    setComments(prev => updateReaction(prev, commentId, reaction, isRemoving))

    // Persist user reaction choice
    const updated = { ...userReactions }
    if (isRemoving) delete updated[commentId]
    else updated[commentId] = reaction
    setUserReactions(updated)
    localStorage.setItem('nf_reactions', JSON.stringify(updated))

    // Fetch current reactions from DB
    const { data } = await supabase.from('comments').select('reactions').eq('id', commentId).single()
    if (!data) return

    const r = { ...(data.reactions || { thumbs: 0, heart: 0, laugh: 0 }) }
    if (isRemoving) r[reaction as keyof typeof r] = Math.max(0, (r[reaction as keyof typeof r] || 0) - 1)
    else {
      if (prev) r[prev as keyof typeof r] = Math.max(0, (r[prev as keyof typeof r] || 0) - 1)
      r[reaction as keyof typeof r] = (r[reaction as keyof typeof r] || 0) + 1
    }

    await supabase.from('comments').update({ reactions: r }).eq('id', commentId)
  }

  function updateReaction(list: Comment[], id: string, reaction: string, removing: boolean): Comment[] {
    return list.map(c => {
      if (c.id === id) {
        const r = { ...c.reactions }
        if (removing) { r[reaction as keyof typeof r] = Math.max(0, (r[reaction as keyof typeof r] || 0) - 1) }
        else {
          if (c.user_reaction) r[c.user_reaction as keyof typeof r] = Math.max(0, (r[c.user_reaction as keyof typeof r] || 0) - 1)
          r[reaction as keyof typeof r] = (r[reaction as keyof typeof r] || 0) + 1
        }
        return { ...c, reactions: r, user_reaction: removing ? null : reaction }
      }
      if (c.replies) return { ...c, replies: updateReaction(c.replies, id, reaction, removing) }
      return c
    })
  }

  // ── Report comment ───────────────────────────────────────────
  async function handleReport(commentId: string) {
    await supabase.from('comments').update({ reported: true }).eq('id', commentId)
    setComments(prev => markReported(prev, commentId))
  }

  function markReported(list: Comment[], id: string): Comment[] {
    return list.map(c => {
      if (c.id === id) return { ...c, reported: true }
      if (c.replies) return { ...c, replies: markReported(c.replies, id) }
      return c
    })
  }

  // ── Reply ────────────────────────────────────────────────────
  function handleReply(parentId: string, authorName: string) {
    setReplyTo({ id: parentId, name: authorName })
    setTimeout(() => commentInputRef.current?.focus(), 100)
  }

  // ── Share ─────────────────────────────────────────────────────
  function handleShare() {
    if (navigator.share && article) {
      navigator.share({ title: article.headline || article.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)

  // ── Loading skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--pitch-black)', maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ height: '280px', background: 'var(--pitch-surface)', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              height: '14px', borderRadius: '3px',
              background: 'var(--pitch-surface)',
              animation: 'shimmer 1.5s infinite',
              backgroundSize: '200% 100%',
              width: `${90 - i * 8}%`,
            }} />
          ))}
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      </div>
    )
  }

  if (!article) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--pitch-black)',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        Article not found.
      </p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pitch-black)', maxWidth: '680px', margin: '0 auto' }}>

      {/* ── Back header ──────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--pitch-border)',
        padding: '0 16px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: '36px', height: '36px', borderRadius: '6px',
            border: '1px solid var(--pitch-border)', background: 'var(--pitch-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--green-spark)', textTransform: 'uppercase', marginBottom: '1px' }}>
            NewsFlash ⚽
          </p>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700,
            letterSpacing: '0.02em', textTransform: 'uppercase',
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {article.headline || article.title}
          </p>
        </div>
        <button
          onClick={handleShare}
          style={{
            width: '36px', height: '36px', borderRadius: '6px',
            border: '1px solid var(--pitch-border)', background: 'var(--pitch-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
          }}
        >
          <Share2 size={15} />
        </button>
      </header>

      {/* ── Hero image ───────────────────────────────────────── */}
      {image && (
        <div style={{ position: 'relative', width: '100%', height: '260px' }}>
          <img src={image.src} alt={image.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
          {image.source === 'ai-generated' && (
            <span style={{
              position: 'absolute', bottom: '10px', right: '10px',
              background: 'rgba(88,28,220,0.85)', color: 'white',
              fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.08em', padding: '2px 8px', borderRadius: '2px',
            }}>
              AI PREVIEW
            </span>
          )}
        </div>
      )}

      {/* ── Article content ──────────────────────────────────── */}
      <div style={{ padding: '20px 16px' }}>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {article.tags.slice(0, 5).map(t => (
              <span key={t} style={{
                padding: '3px 10px',
                background: 'var(--green-glow)',
                border: '1px solid rgba(0,255,135,0.25)',
                color: 'var(--green-spark)',
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.1em', borderRadius: '2px', textTransform: 'uppercase',
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 900, letterSpacing: '-0.01em', textTransform: 'uppercase',
          color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: '12px',
        }}>
          {article.headline || article.title}
        </h1>

        {/* Meta description */}
        {article.meta_description && (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '14px', fontStyle: 'italic',
            color: 'var(--text-secondary)', marginBottom: '16px',
            borderLeft: '3px solid var(--green-spark)', paddingLeft: '12px', lineHeight: 1.6,
          }}>
            {article.meta_description}
          </p>
        )}

        {/* Meta row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
          paddingBottom: '16px', borderBottom: '1px solid var(--pitch-border)',
        }}>
          <BookOpen size={12} style={{ color: 'var(--text-muted)' }} />
          <time style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {new Date(article.published || article.created_at).toLocaleDateString('en-GB', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </time>
          {article.source_name && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green-spark)', letterSpacing: '0.05em' }}>
              · {article.source_name}
            </span>
          )}
        </div>

        {/* Body — strips any residual HTML tags from older RSS data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {stripHtml(article.body || article.summary || '')
            .split('\n')
            .filter(Boolean)
            .map((p, i) => (
              <p key={i} style={{
                fontFamily: 'var(--font-body)', fontSize: '15px',
                color: 'var(--text-secondary)', lineHeight: 1.75,
              }}>
                {p}
              </p>
            ))
          }
        </div>

        {/* Source link */}
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--green-spark)',
            border: '1px solid rgba(0,255,135,0.3)',
            padding: '8px 16px', borderRadius: '4px',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
        >
          Read original source <ExternalLink size={11} />
        </a>
      </div>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div style={{ height: '6px', background: 'var(--pitch-surface)' }} />

      {/* ── Comments Section ─────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <MessageCircle size={18} style={{ color: 'var(--text-primary)' }} />
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800,
            letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text-primary)',
          }}>
            Comments
          </h2>
          {totalComments > 0 && (
            <span style={{
              background: 'var(--green-spark)', color: '#000',
              fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '12px',
            }}>
              {totalComments}
            </span>
          )}
        </div>

        {/* ── Name setup (if not set) ───────────────────────── */}
        {!nameSet && (
          <div style={{
            background: 'var(--pitch-surface)', border: '1px solid var(--pitch-border)',
            borderRadius: '10px', padding: '16px', marginBottom: '16px',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '4px' }}>
              What's your name?
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Set your display name once and it will be saved for future comments — just like being signed in.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Your name…"
                style={{
                  flex: 1, background: 'var(--pitch-mid)', border: '1px solid var(--pitch-border)',
                  borderRadius: '6px', padding: '10px 14px', fontFamily: 'var(--font-body)',
                  fontSize: '14px', color: 'var(--text-primary)', outline: 'none',
                }}
              />
              <button
                onClick={saveName}
                style={{
                  background: 'var(--green-spark)', color: '#000', border: 'none',
                  borderRadius: '6px', padding: '10px 16px', fontFamily: 'var(--font-display)',
                  fontSize: '14px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* ── Name badge (if set) ───────────────────────────── */}
        {nameSet && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: getColor(authorName),
              fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: '#000', flexShrink: 0,
            }}>
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                {authorName}
              </p>
              <button
                onClick={() => { setNameSet(false); setNameInput(authorName) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--green-spark)', padding: 0, textTransform: 'uppercase' }}
              >
                Change name
              </button>
            </div>
          </div>
        )}

        {/* ── Comment input ─────────────────────────────────── */}
        {nameSet && (
          <div style={{ marginBottom: '20px' }}>
            {replyTo && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--pitch-surface)', border: '1px solid var(--pitch-border)',
                borderRadius: '6px', padding: '8px 12px', marginBottom: '8px',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--green-spark)', textTransform: 'uppercase' }}>
                  ↩ Replying to {replyTo.name}
                </span>
                <button onClick={() => setReplyTo(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={13} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: getColor(authorName),
                fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, color: '#000',
              }}>
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div style={{
                flex: 1, background: 'var(--pitch-surface)', border: '1px solid var(--pitch-border)',
                borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'flex-end', gap: '8px',
              }}>
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                  placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Write a comment…'}
                  rows={1}
                  style={{
                    flex: 1, background: 'transparent',
                    border: 'none', outline: 'none', resize: 'none',
                    fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)',
                    lineHeight: 1.5, maxHeight: '120px',
                  }}
                  onInput={e => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = el.scrollHeight + 'px'
                  }}
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submitting}
                  style={{
                    flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                    background: commentText.trim() ? 'var(--green-spark)' : 'var(--pitch-border)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background 0.15s',
                  }}
                >
                  <Send size={13} color={commentText.trim() ? '#000' : 'var(--text-muted)'} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Comments list ─────────────────────────────────── */}
        {commLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--pitch-surface)', flexShrink: 0, animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '12px', background: 'var(--pitch-surface)', borderRadius: '3px', width: '30%', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
                  <div style={{ height: '12px', background: 'var(--pitch-surface)', borderRadius: '3px', width: '70%', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <MessageCircle size={36} style={{ color: 'var(--pitch-border)', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              No comments yet
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--pitch-muted)', marginTop: '6px' }}>
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div>
            {comments.map(c => (
              <CommentItem key={c.id} comment={c}
                onReact={handleReact} onReply={handleReply} onReport={handleReport} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom padding for safe area */}
      <div style={{ height: '48px' }} />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  )
}
