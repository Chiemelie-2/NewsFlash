'use client'

/**
 * page.tsx — Desktop-first responsive news portal
 *
 * Desktop layout:
 *  - Sticky top nav bar (logo, category tabs, search, city)
 *  - 12-col grid: 8-col main feed + 4-col sticky sidebar
 *  - Bento hero: large featured card left + 3 secondary cards right
 *  - Card hover elevation + border-color transitions
 *  - "Load More" button (no infinite scroll on desktop)
 *  - Left sidebar trending topics (vertical, always visible)
 *
 * Mobile (<768px):
 *  - Collapses to single column
 *  - Bottom nav bar restored
 *  - Horizontal scrolling topic bubbles
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getArticles, Article } from '@/lib/supabase'
import { fetchArticleImage, ArticleImage } from '@/lib/images'
import {
  Search, Home as HomeIcon, Play, User, Flame,
  ExternalLink, ChevronDown, MessageCircle,
  TrendingUp, Clock, Star, Zap, BookOpen, Menu, X
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────
function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Image hook — uses DB cache, then Pixabay, then SVG ───────────
function useArticleImage(article: Article | null) {
  const [img, setImg] = useState<ArticleImage | null>(null)
  useEffect(() => {
    if (!article) return
    // Use DB-cached image from scraper first (zero API calls)
    if (article.image_url) {
      setImg({ src: article.image_url, alt: article.headline || article.title, source: 'db' })
      return
    }
    // No image_url — generate SVG instantly, no network call
    setImg(fetchArticleImage(article.tags || [], article.headline || article.title))
  }, [article?.id])
  return img
}

// ── Tabs config ───────────────────────────────────────────────────
const TABS = [
  { id: 'for-you',       label: 'For You',       icon: Star },
  { id: 'politics',      label: 'Politics',       icon: Zap },
  { id: 'entertainment', label: 'Entertainment',  icon: Play },
  { id: 'finance',       label: 'Finance',        icon: TrendingUp },
  { id: 'live',          label: 'Live',           icon: Clock },
]

const TAB_KEYWORDS: Record<string, string[]> = {
  'politics':      ['politics','political','government','election','president','congress','senate','trump','biden','parliament','minister','policy','war','military','iran','ukraine','nato','vote'],
  'entertainment': ['entertainment','celebrity','movies','music','film','tv','netflix','disney','hollywood','actor','singer','album','award','oscar','grammy','sport','nfl','nba','football','gaming'],
  'finance':       ['finance','financial','economy','economic','market','stock','investing','bank','tax','insurance','mortgage','inflation','gdp','jobs','salary','budget','crypto','bitcoin','trading'],
}

// ── Trending topics sidebar data ──────────────────────────────────
const TRENDING_TOPICS = [
  { label: '#AI',         count: 1090, color: '#3b82f6' },
  { label: '#Business',   count: 1247, color: '#10b981' },
  { label: '#Crypto',     count: 353,  color: '#f59e0b' },
  { label: '#Apple',      count: 1163, color: '#6366f1' },
  { label: '#Politics',   count: 892,  color: '#ef4444' },
  { label: '#Tech',       count: 2103, color: '#8b5cf6' },
  { label: '#Markets',    count: 677,  color: '#06b6d4' },
  { label: '#SpaceX',     count: 441,  color: '#64748b' },
]

// ── Featured hero card (large, left bento) ────────────────────────
function HeroCard({ article }: { article: Article }) {
  const img = useArticleImage(article)
  const [hovered, setHovered] = useState(false)
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/article/${article.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{ height: '480px' }}
    >
      {/* Image */}
      <div className="absolute inset-0 bg-gray-900">
        {img ? (
          <img
            src={img.src} alt={img.alt}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{ transform: hovered ? 'scale(1.03)' : 'scale(1)' }}
          />
        ) : (
          <div className="w-full h-full animate-pulse bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Top badge */}
      <div className="absolute top-4 left-4">
        <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
          Featured
        </span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex gap-2 mb-3">
            {article.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                {t}
              </span>
            ))}
          </div>
        )}
        <h2
          className="text-white font-black leading-tight mb-3 transition-all duration-300"
          style={{
            fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {article.headline || article.title}
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-black">N</span>
            </div>
            <span className="text-gray-300 text-xs">
              {timeAgo(article.published || article.created_at)}
            </span>
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <MessageCircle size={11} /> Comments
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 text-white text-xs font-semibold bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20 transition-all duration-200 hover:bg-white/20"
          >
            Read Story <ExternalLink size={11} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Secondary bento card (right stack) ───────────────────────────
function BentoSecondaryCard({ article }: { article: Article }) {
  const img = useArticleImage(article)
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/article/${article.id}`)}
      className="flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md hover:bg-white dark:hover:bg-gray-800 group"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        {img ? (
          <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full animate-pulse bg-gray-300 dark:bg-gray-600" />
        )}
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        {article.tags?.[0] && (
          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">{article.tags[0]}</p>
        )}
        <h3
          className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          {article.headline || article.title}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{timeAgo(article.published || article.created_at)}</p>
      </div>
    </div>
  )
}

// ── Main feed article card ────────────────────────────────────────
function FeedCard({ article, index }: { article: Article; index: number }) {
  const img = useArticleImage(article)
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()
  const summary = stripHtml(article.body || article.summary || '')

  return (
    <article
      className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden cursor-pointer"
        style={{ height: '200px' }}
        onClick={() => router.push(`/article/${article.id}`)}
      >
        {img ? (
          <img
            src={img.src} alt={img.alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
        )}
        {/* Category pill on image */}
        {article.tags?.[0] && (
          <div className="absolute top-3 left-3">
            <span className="bg-black/60 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              {article.tags[0]}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h2
          onClick={() => router.push(`/article/${article.id}`)}
          className="font-bold text-gray-900 dark:text-white mb-2 leading-snug cursor-pointer group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2"
          style={{ fontSize: '1rem', fontFamily: "'Georgia', serif" }}
        >
          {article.headline || article.title}
        </h2>

        {/* Summary */}
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
          {summary.slice(0, 160)}{summary.length > 160 ? '…' : ''}
        </p>

        {/* Expand inline */}
        {expanded && (
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3 border-l-2 border-red-500 pl-3">
            {summary}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white text-[8px] font-black">N</span>
            </div>
            <time className="text-xs text-gray-400">
              {timeAgo(article.published || article.created_at)}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
            >
              {expanded ? 'Less ▲' : 'Summary ▼'}
            </button>
            <button
              onClick={() => router.push(`/article/${article.id}`)}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              Full Story <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Sidebar: Trending Topics ──────────────────────────────────────
function TrendingSidebar({ articles }: { articles: Article[] }) {
  const router = useRouter()
  const latest = articles.slice(0, 6)

  return (
    <aside className="space-y-6">
      {/* Trending topics */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-orange-500" fill="currentColor" />
          <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">
            Trending Now
          </h3>
        </div>
        <div className="space-y-2">
          {TRENDING_TOPICS.map((t, i) => (
            <div key={t.label}
              className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black text-gray-300 dark:text-gray-600 w-4">{i + 1}</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{t.label}</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {t.count >= 1000 ? `${(t.count / 1000).toFixed(1)}k` : t.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest stories mini list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-gray-500" />
          <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">
            Latest
          </h3>
        </div>
        <div className="space-y-3">
          {latest.map(a => (
            <div
              key={a.id}
              onClick={() => router.push(`/article/${a.id}`)}
              className="cursor-pointer group"
            >
              <p
                className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {a.headline || a.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {timeAgo(a.published || a.created_at)}
              </p>
              {a !== latest[latest.length - 1] && (
                <div className="border-b border-gray-100 dark:border-gray-700 mt-3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 text-white">
        <BookOpen size={20} className="mb-3 opacity-80" />
        <h3 className="font-black text-sm mb-1">Daily Briefing</h3>
        <p className="text-xs opacity-80 mb-4 leading-relaxed">
          Get the top 5 stories delivered to your inbox every morning.
        </p>
        <input
          type="email"
          placeholder="your@email.com"
          className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-xs placeholder-white/60 text-white outline-none focus:bg-white/30 mb-2"
        />
        <button className="w-full bg-white text-red-600 rounded-lg py-2 text-xs font-black hover:bg-gray-50 transition-colors">
          Subscribe Free
        </button>
      </div>
    </aside>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function Home() {
  const [articles, setArticles]       = useState<Article[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [activeTab, setActiveTab]     = useState('for-you')
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenu, setMobileMenu]   = useState(false)
  const [page, setPage]               = useState(1)
  const [darkMode, setDarkMode]       = useState(false)
  const CARDS_PER_PAGE = 9

  useEffect(() => {
    setLoading(true)
    setError(null)
    getArticles(100, 0)
      .then(data => {
        setArticles(data)
        if (data.length === 0) setError('no_articles')
      })
      .catch(() => setError('fetch_failed'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  // ── Filter articles by active tab ───────────────────────────
  const filtered = articles.filter(a => {
    if (activeTab === 'for-you' || activeTab === 'live') return true
    const keys = TAB_KEYWORDS[activeTab] || []
    const tagMatch = a.tags?.some(tag => keys.some(k => tag.toLowerCase().includes(k)))
    if (tagMatch) return true
    const text = `${a.title} ${a.headline || ''} ${a.summary || ''}`.toLowerCase()
    return keys.some(k => text.includes(k))
  }).filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.title.toLowerCase().includes(q) ||
      (a.headline || '').toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q)
    )
  })

  const heroArticle       = filtered[0] || null
  const bentoSecondary    = filtered.slice(1, 4)
  const feedArticles      = filtered.slice(4, 4 + page * CARDS_PER_PAGE)
  const hasMore           = filtered.length > 4 + page * CARDS_PER_PAGE

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">

      {/* ── Sticky Top Navigation ──────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">

          {/* Top bar */}
          <div className="flex items-center gap-6 py-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-base italic">N</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-gray-900 dark:text-white font-black text-lg leading-none tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>NewsFlash</p>
                <p className="text-gray-400 text-[10px] tracking-widest uppercase">AI News Engine</p>
              </div>
            </div>

            {/* Category tabs — desktop centered */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setPage(1) }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-red-600 text-white shadow-sm shadow-red-200 dark:shadow-red-900'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-auto lg:ml-0">
              {/* Search */}
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                  <Search size={14} className="text-gray-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                    placeholder="Search stories…"
                    className="bg-transparent text-sm text-gray-800 dark:text-white outline-none w-48"
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setSearchOpen(false) }}>
                      <X size={14} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Search size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              )}

              {/* City selector */}
              <button className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5">
                <span>📍</span> Set City <ChevronDown size={12} />
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(v => !v)}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Mobile menu */}
              <button
                onClick={() => setMobileMenu(v => !v)}
                className="lg:hidden w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                {mobileMenu ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          {mobileMenu && (
            <div className="lg:hidden pb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setPage(1); setMobileMenu(false) }}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon size={11} /> {tab.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── Page body ──────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" style={{ height: '480px' }} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse h-64" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse h-64" />
              <div className="rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse h-48" />
            </div>
          </div>
        ) : error === 'fetch_failed' ? (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 p-8 text-center">
            <p className="text-red-600 font-bold mb-1">⚠️ Could not connect to database</p>
            <p className="text-red-400 text-sm">Check your Supabase URL and anon key in <code>.env.local</code></p>
          </div>
        ) : error === 'no_articles' ? (
          <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 p-8 text-center">
            <p className="text-yellow-700 font-bold mb-1">📭 No articles yet</p>
            <p className="text-yellow-600 text-sm mb-2">Run the scraper to populate articles.</p>
            <code className="text-xs bg-yellow-100 px-3 py-1.5 rounded">cd scraper && python main.py</code>
          </div>
        ) : (
          /* ── 12-column main layout ─────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">

            {/* ── 8-col main content ────────────────────── */}
            <div className="lg:col-span-8 space-y-8">

              {/* ── Bento hero ──────────────────────────── */}
              {heroArticle && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-red-600 rounded-full" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Top Stories
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Primary large card — 3 cols */}
                    <div className="md:col-span-3">
                      <HeroCard article={heroArticle} />
                    </div>
                    {/* Secondary stack — 2 cols */}
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                      {bentoSecondary.length > 0
                        ? bentoSecondary.map(a => <BentoSecondaryCard key={a.id} article={a} />)
                        : [...Array(3)].map((_, i) => (
                            <div key={i} className="p-4 animate-pulse">
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                          ))
                      }
                    </div>
                  </div>
                </section>
              )}

              {/* ── Section divider ──────────────────────── */}
              <div className="flex items-center gap-4">
                <div className="w-1 h-5 bg-red-600 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {TABS.find(t => t.id === activeTab)?.label || 'Latest News'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400">{filtered.length} stories</span>
              </div>

              {/* ── 3-column article grid ────────────────── */}
              {feedArticles.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-500 font-semibold">No {TABS.find(t => t.id === activeTab)?.label} stories</p>
                  <button onClick={() => setActiveTab('for-you')} className="mt-3 text-red-500 text-sm hover:underline">
                    Back to For You
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {feedArticles.map((a, i) => (
                    <FeedCard key={a.id} article={a} index={i} />
                  ))}
                </div>
              )}

              {/* ── Load More ────────────────────────────── */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-red-300 hover:text-red-600 font-semibold px-8 py-3 rounded-full transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                  >
                    Load More Stories
                    <span className="text-xs text-gray-400">({filtered.length - (4 + page * CARDS_PER_PAGE)} remaining)</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── 4-col sticky sidebar ──────────────────── */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <TrendingSidebar articles={filtered} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300 mt-16">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                  <span className="text-white font-black text-sm italic">N</span>
                </div>
                <span className="text-white font-black text-lg" style={{ fontFamily: "'Georgia', serif" }}>NewsFlash</span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">
                AI-powered news platform. Real-time stories enriched with SEO headlines and summaries.
              </p>
            </div>
            {/* Company */}
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest mb-3">Company</p>
              <ul className="space-y-2">
                {['About', 'Careers', 'Contact', 'Advertise'].map(l => (
                  <li key={l}><a href="#" className="text-gray-500 text-xs hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest mb-3">Legal</p>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Use', 'Cookies', 'Accessibility'].map(l => (
                  <li key={l}><a href="#" className="text-gray-500 text-xs hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            {/* Topics */}
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest mb-3">Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {['AI', 'Crypto', 'Business', 'Politics', 'Tech', 'Science'].map(t => (
                  <span key={t} className="px-2 py-0.5 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white text-[10px] rounded-full cursor-pointer transition-colors">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-700 text-xs">© {new Date().getFullYear()} NewsFlash. All rights reserved.</p>
            <p className="text-gray-700 text-xs">
              Images: <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline">Pixabay</a>
              {' · '}AI: <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline">Gemini</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav — only shown on small screens */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex z-50">
        {[
          { icon: HomeIcon, label: 'Home',  id: 'home' },
          { icon: Search,   label: 'Search', id: 'search' },
          { icon: Play,     label: 'Video',  id: 'video' },
          { icon: User,     label: 'Me',     id: 'me' },
        ].map(({ icon: Icon, label, id }) => (
          <button key={id} className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-400 dark:text-gray-500">
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
      <div className="lg:hidden h-16" /> {/* bottom nav spacer on mobile */}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
