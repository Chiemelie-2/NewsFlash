'use client'

/**
 * frontend/app/article/[id]/page.tsx  ← NEW FILE
 *
 * Full story page — shown when user taps "Full Story" on any card.
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
 */

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Article } from '@/lib/supabase'
import { fetchArticleImage, ArticleImage } from '@/lib/images'
import {
  ArrowLeft, ExternalLink, ThumbsUp, Heart, Laugh,
  MessageCircle, Flag, Send, ChevronDown, ChevronUp,
  MoreHorizontal, X
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
  '#e53e3e','#dd6b20','#d69e2e','#38a169',
  '#3182ce','#805ad5','#d53f8c','#00b5d8',
]

function getColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

// ── Reaction picker ──────────────────────────────────────────────
function ReactionPicker({ onPick }: { onPick: (r: string) => void }) {
  return (
    <div className="absolute bottom-8 left-0 flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-2 py-1.5 z-20">
      {REACTIONS.map(r => (
        <button key={r.key} onClick={() => onPick(r.key)}
          className="text-xl hover:scale-125 transition-transform active:scale-110"
          title={r.label}>
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
  const [showMenu, setShowMenu] = useState(false)
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
      <div className={`${depth > 0 ? 'ml-10' : ''} py-2`}>
        <p className="text-xs text-gray-400 italic">This comment has been reported and is under review.</p>
      </div>
    )
  }

  const totalReactions = (comment.reactions.thumbs || 0) + (comment.reactions.heart || 0) + (comment.reactions.laugh || 0)

  return (
    <div className={`${depth > 0 ? 'ml-10 mt-2' : 'mt-4'}`}>
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: comment.author_color }}>
          {comment.author_initial}
        </div>

        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-3 py-2 relative">
            <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{comment.author_name}</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{comment.body}</p>

            {/* 3-dot menu */}
            <div className="absolute top-2 right-2">
              <button onClick={() => setShowMenu(v => !v)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 w-36">
                  <button
                    onClick={() => { onReport(comment.id); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    <Flag size={12} /> Report comment
                  </button>
                  <button onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl">
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-4 mt-1 ml-1">
            {/* Reaction button */}
            <div className="relative" ref={pickerRef}>
              <button
                onMouseEnter={() => setShowPicker(true)}
                onClick={() => comment.user_reaction
                  ? onReact(comment.id, comment.user_reaction)
                  : setShowPicker(v => !v)
                }
                className={`text-xs font-semibold transition-colors ${
                  comment.user_reaction ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600'
                }`}
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
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">
                Reply
              </button>
            )}

            {/* Time */}
            <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>

            {/* Reaction summary */}
            {totalReactions > 0 && (
              <span className="text-[10px] text-gray-400 ml-auto">
                {[
                  comment.reactions.thumbs > 0 ? `👍 ${comment.reactions.thumbs}` : '',
                  comment.reactions.heart > 0  ? `❤️ ${comment.reactions.heart}` : '',
                  comment.reactions.laugh > 0  ? `😂 ${comment.reactions.laugh}` : '',
                ].filter(Boolean).join('  ')}
              </span>
            )}
          </div>

          {/* Replies toggle */}
          {comment.replies && comment.replies.length > 0 && (
            <button onClick={() => setShowReplies(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 mt-1 ml-1">
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

  const [article, setArticle]     = useState<Article | null>(null)
  const [image, setImage]         = useState<ArticleImage | null>(null)
  const [comments, setComments]   = useState<Comment[]>([])
  const [loading, setLoading]     = useState(true)
  const [commLoading, setCommLoading] = useState(true)

  // Author name (persisted in localStorage — feels like "logged in")
  const [authorName, setAuthorName] = useState('')
  const [nameSet, setNameSet]       = useState(false)
  const [nameInput, setNameInput]   = useState('')

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
          fetchArticleImage(data.tags || [], data.headline || data.title)
            .then(setImage)
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

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)

  // ── Render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 max-w-md mx-auto">
        <div className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!article) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Article not found.</div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 max-w-md mx-auto" style={{ fontFamily: "'Georgia', serif" }}>

      {/* ── Back header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-red-600 font-bold">NewsFlash</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
            {article.headline || article.title}
          </p>
        </div>
      </header>

      {/* ── Hero image ───────────────────────────────────────── */}
      {image && (
        <div className="relative w-full" style={{ height: '240px' }}>
          <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* ── Article content ──────────────────────────────────── */}
      <div className="px-4 py-5">
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tags.slice(0, 4).map(t => (
              <span key={t} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2">
          {article.headline || article.title}
        </h1>

        {/* Meta description */}
        {article.meta_description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4 border-l-2 border-red-500 pl-3">
            {article.meta_description}
          </p>
        )}

        {/* Body */}
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
          {(article.body || article.summary || '').split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Source link */}
        <a href={article.source_url} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-red-600 border border-red-200 dark:border-red-800 rounded-full px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Read original source <ExternalLink size={12} />
        </a>

        {/* Published date */}
        <p className="text-xs text-gray-400 mt-3">
          {new Date(article.published || article.created_at).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="h-2 bg-gray-100 dark:bg-gray-800" />

      {/* ── Comments Section ─────────────────────────────────── */}
      <div className="px-4 py-4">

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={18} className="text-gray-700 dark:text-gray-300" />
          <h2 className="text-base font-black text-gray-900 dark:text-white">
            Comments
          </h2>
          {totalComments > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {totalComments}
            </span>
          )}
        </div>

        {/* ── Name setup (if not set) ───────────────────────── */}
        {!nameSet && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
              What's your name?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Set your display name once and it will be saved for future comments — just like being signed in.
            </p>
            <div className="flex gap-2">
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Your name…"
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 dark:text-white"
              />
              <button onClick={saveName}
                className="bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors">
                Save
              </button>
            </div>
          </div>
        )}

        {/* ── Name badge (if set) ───────────────────────────── */}
        {nameSet && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: getColor(authorName) }}>
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-white">{authorName}</p>
              <button onClick={() => { setNameSet(false); setNameInput(authorName) }}
                className="text-[10px] text-blue-500 hover:underline">
                Change name
              </button>
            </div>
          </div>
        )}

        {/* ── Comment input ─────────────────────────────────── */}
        {nameSet && (
          <div className="mb-5">
            {replyTo && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 mb-2">
                <span className="text-xs text-blue-600 font-medium">↩ Replying to {replyTo.name}</span>
                <button onClick={() => setReplyTo(null)} className="ml-auto">
                  <X size={13} className="text-blue-400" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: getColor(authorName) }}>
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2 flex items-end gap-2">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                  placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Write a comment…'}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white outline-none resize-none leading-relaxed"
                  style={{ maxHeight: '120px' }}
                  onInput={e => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = el.scrollHeight + 'px'
                  }}
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submitting}
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center disabled:opacity-40 hover:bg-red-700 transition-colors"
                >
                  <Send size={13} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Comments list ─────────────────────────────────── */}
        {commLoading ? (
          <div className="space-y-4 mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-2.5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No comments yet.</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Be the first to share your thoughts!</p>
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
      <div className="h-10" />
    </div>
  )
}
