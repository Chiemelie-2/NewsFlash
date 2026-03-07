'use client'

/**
 * page.tsx — News UK style homepage
 * Inspired by the News UK app layout:
 *  - Top header with logo, city selector, search, avatar
 *  - Horizontal trending topics row with fire badges
 *  - Tab bar: For You / Politics / Entertainment / Benefits / Live
 *  - Hero carousel (featured stories, full-width with overlay headline)
 *  - Horizontal scroll feed below hero
 *  - Bottom nav bar: Home / Search / Video / Me
 */

import { useState, useEffect, useRef } from 'react'
import { getArticles, Article } from '@/lib/supabase'
import { fetchArticleImage, ArticleImage } from '@/lib/images'
import {
  Search, Download, ChevronDown, Play, User,
  Flame, ExternalLink, ChevronLeft, ChevronRight,
  Wifi, RefreshCw
} from 'lucide-react'

// ── Trending topics (static seeds; in prod pull from DB tag counts) ──
const TRENDING = [
  { id: 'all', label: 'See All\nTopics', count: null, img: null },
  { id: 'tech', label: '#AI', count: 1090, img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=80&h=80&fit=crop' },
  { id: 'business', label: '#Business', count: 1247, img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=80&fit=crop' },
  { id: 'crypto', label: '#Crypto', count: 353, img: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=80&h=80&fit=crop' },
  { id: 'apple', label: '#Apple', count: 1163, img: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=80&h=80&fit=crop' },
]

const TABS = ['For you', 'Politics', 'Entertainment', 'Benefits', 'Live']

// ── Article image cache ──────────────────────────────────────────
function useArticleImage(article: Article | null) {
  const [img, setImg] = useState<ArticleImage | null>(null)
  useEffect(() => {
    if (!article) return
    let cancelled = false
    fetchArticleImage(article.tags || [], article.headline || article.title)
      .then(i => { if (!cancelled) setImg(i) })
    return () => { cancelled = true }
  }, [article?.id])
  return img
}

// ── Hero slide component ─────────────────────────────────────────
function HeroSlide({ article, active }: { article: Article; active: boolean }) {
  const img = useArticleImage(article)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative w-full flex-shrink-0" style={{ width: '100%' }}>
      {/* Background image */}
      <div className="relative w-full bg-gray-900" style={{ height: '280px' }}>
        {img ? (
          <img src={img.src} alt={img.alt} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full animate-pulse bg-gray-700" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Source badge */}
        <div className="absolute bottom-14 left-3 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white text-[8px] font-black">N</span>
          </div>
          <span className="text-white text-xs font-medium opacity-90">
            NewsFlash · {timeAgo(article.published || article.created_at)}
          </span>
        </div>

        {/* Headline */}
        <div className="absolute bottom-3 left-3 right-3">
          <h2 className="text-white font-bold text-base leading-tight line-clamp-2">
            {article.headline || article.title}
          </h2>
        </div>
      </div>

      {/* Expandable summary below image */}
      {expanded && (
        <div className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {article.body || article.summary}
          </p>
          <a
            href={`/article/${article.id}`}
            className="mt-2 inline-flex items-center gap-1 text-red-600 text-sm font-semibold"
          >
            Full Story + Comments <ExternalLink size={13} />
          </a>
        </div>
      )}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs py-1.5 border-b border-gray-200 dark:border-gray-700"
      >
        {expanded ? '▲ Less' : '▼ Read more'}
      </button>
    </div>
  )
}

// ── Small article card (below hero) ─────────────────────────────
function SmallCard({ article }: { article: Article }) {
  const img = useArticleImage(article)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700" style={{ width: '200px' }}>
      <div className="relative h-28 bg-gray-200 dark:bg-gray-700">
        {img ? (
          <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full animate-pulse bg-gray-300 dark:bg-gray-600" />
        )}
      </div>
      <div className="p-2.5">
        <p className="text-[11px] text-red-600 font-bold mb-1">NewsFlash</p>
        <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight line-clamp-3">
          {article.headline || article.title}
        </p>
        {expanded && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
            {(article.body || article.summary || '').slice(0, 120)}…
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-[10px] text-blue-500 font-medium"
          >
            {expanded ? 'Less ▲' : 'More ▼'}
          </button>
          <a href={`/article/${article.id}`}>
            <ExternalLink size={11} className="text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  )
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / 1440)}d`
}

// ── Main page ────────────────────────────────────────────────────
export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('For you')
  const [activeNav, setActiveNav] = useState('Home')
  const [heroIndex, setHeroIndex] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getArticles(50, 0)
      .then(data => setArticles(data))
      .finally(() => setLoading(false))
  }, [])

  // Filter by tab
  const tabMap: Record<string, string[]> = {
    'Politics': ['politics', 'government', 'election'],
    'Entertainment': ['entertainment', 'celebrity', 'movies', 'music'],
    'Benefits': ['benefits', 'finance', 'money'],
    'Live': [],
  }

  const filtered = articles.filter(a => {
    if (activeTab === 'For you' || activeTab === 'Live') return true
    const keys = tabMap[activeTab] || []
    return a.tags?.some(t => keys.includes(t.toLowerCase()))
  }).filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.title.toLowerCase().includes(q) ||
      (a.headline || '').toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q)
    )
  })

  const heroArticles = filtered.slice(0, 5)
  const feedArticles = filtered.slice(5, 20)

  const prevHero = () => setHeroIndex(i => Math.max(0, i - 1))
  const nextHero = () => setHeroIndex(i => Math.min(heroArticles.length - 1, i + 1))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 max-w-md mx-auto relative" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* ── Status bar spacer ───────────────────────────────────── */}
      <div className="h-2 bg-white dark:bg-gray-900" />

      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        {/* Logo + City */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm italic">N</span>
          </div>
          <button className="flex items-center gap-1 text-sm font-semibold text-gray-800 dark:text-white">
            Set Your City
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSearchOpen(v => !v)}>
            <Download size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <button onClick={() => setSearchOpen(v => !v)}>
            <Search size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Pay</span>
          </div>
        </div>
      </header>

      {/* Search bar (slide down when open) */}
      {searchOpen && (
        <div className="bg-white dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stories…"
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-white outline-none"
          />
        </div>
      )}

      {/* ── Trending Topics Row ─────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {TRENDING.map(t => (
            <div key={t.id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative">
                {t.img ? (
                  <img src={t.img} alt={t.label}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5">
                      {[0,1,2,3].map(i => <div key={i} className="w-2.5 h-2.5 rounded-sm bg-gray-400" />)}
                    </div>
                  </div>
                )}
                {t.count && (
                  <div className="absolute -top-1 -right-1 bg-red-600 rounded-full px-1 min-w-[22px] text-center">
                    <span className="text-white text-[9px] font-bold">{t.count >= 1000 ? `${(t.count/1000).toFixed(1)}k` : t.count}</span>
                  </div>
                )}
                {t.count && (
                  <div className="absolute -top-2 left-0">
                    <Flame size={14} className="text-orange-500" fill="currentColor" />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-center text-gray-600 dark:text-gray-400 leading-tight whitespace-pre-line font-medium">
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[57px] z-40">
        <div className="flex overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
              style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
            >
              {tab === 'For you' && (
                <span className="flex items-center gap-1">
                  <span className="text-red-500">✏️</span> {tab}
                </span>
              )}
              {tab !== 'For you' && tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="pb-20">

        {/* Headlines label + weather */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-950">
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Headlines
          </h1>
          <button className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
            <span className="text-gray-400">-- °C</span>
            <span>☀️ Set Weather</span>
          </button>
        </div>

        {loading ? (
          /* Skeleton hero */
          <div className="mx-4 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse" style={{ height: '280px' }} />
        ) : heroArticles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No stories found.</div>
        ) : (
          <>
            {/* ── Hero Carousel ─────────────────────────────────── */}
            <div className="relative mx-3 rounded-2xl overflow-hidden shadow-lg">
              <div ref={heroRef} className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                >
                  {heroArticles.map(a => (
                    <div key={a.id} className="w-full flex-shrink-0">
                      <HeroSlide article={a} active={true} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel nav arrows */}
              {heroIndex > 0 && (
                <button onClick={prevHero}
                  className="absolute left-2 top-28 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center z-10">
                  <ChevronLeft size={18} className="text-white" />
                </button>
              )}
              {heroIndex < heroArticles.length - 1 && (
                <button onClick={nextHero}
                  className="absolute right-2 top-28 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center z-10">
                  <ChevronRight size={18} className="text-white" />
                </button>
              )}
            </div>

            {/* Carousel dots */}
            <div className="flex justify-center gap-1.5 py-3">
              {heroArticles.map((_, i) => (
                <button key={i} onClick={() => setHeroIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === heroIndex
                      ? 'w-5 h-2 bg-gray-900 dark:bg-white'
                      : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* ── Horizontal scroll feed ───────────────────────── */}
            {feedArticles.length > 0 && (
              <div className="px-4 mb-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {feedArticles.map(a => (
                    <SmallCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}

            {/* ── List feed below ──────────────────────────────── */}
            <div className="px-4 space-y-3">
              {filtered.slice(20).map(a => (
                <ListItem key={a.id} article={a} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex z-50">
        {[
          { icon: Home, label: 'Home', id: 'Home' },
          { icon: Search, label: 'Football', id: 'Football' },
          { icon: Play, label: 'Video', id: 'Video' },
          { icon: User, label: 'Me', id: 'Me' },
        ].map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => setActiveNav(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeNav === id
                ? 'text-red-600'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Website Footer ─────────────────────────────────────── */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300 px-5 pt-8 pb-24">
        {/* Logo + tagline */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow">
            <span className="text-white font-black text-base italic">N</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">NewsFlash</p>
            <p className="text-gray-500 text-[10px] mt-0.5">AI-Driven News Engine</p>
          </div>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed mb-6">
          Real-time AI-curated news across tech, business, crypto and more.
          Stories are automatically enriched with SEO headlines, summaries and tags.
        </p>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-6 mb-6 border-t border-gray-800 pt-6">
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-widest mb-3">Company</p>
            <ul className="space-y-2">
              {['About Us', 'Careers', 'Contact', 'Advertise'].map(l => (
                <li key={l}>
                  <a href="#" className="text-gray-400 text-xs hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Use', 'Cookie Settings', 'Accessibility'].map(l => (
                <li key={l}>
                  <a href="#" className="text-gray-400 text-xs hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Topics */}
        <div className="border-t border-gray-800 pt-5 mb-5">
          <p className="text-white text-xs font-bold uppercase tracking-widest mb-3">Topics</p>
          <div className="flex flex-wrap gap-2">
            {['Technology', 'Business', 'Crypto', 'AI', 'Politics', 'Entertainment', 'Science', 'Health'].map(t => (
              <span key={t}
                className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-400 text-[10px] hover:bg-red-600 hover:text-white transition-colors cursor-pointer">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Social icons */}
        <div className="border-t border-gray-800 pt-5 mb-5 flex items-center gap-4">
          {[
            { label: 'X', href: '#' },
            { label: 'FB', href: '#' },
            { label: 'IG', href: '#' },
            { label: 'YT', href: '#' },
          ].map(s => (
            <a key={s.label} href={s.href}
              className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-[11px] font-bold hover:bg-red-600 hover:text-white transition-colors">
              {s.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-4 flex flex-col gap-1">
          <p className="text-gray-600 text-[10px]">
            © {new Date().getFullYear()} NewsFlash. All rights reserved.
          </p>
          <p className="text-gray-700 text-[10px]">
            Images sourced from{' '}
            <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-gray-400">Pixabay</a>
            {' '}· Powered by{' '}
            <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-gray-400">Gemini AI</a>
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

// ── Inline list item for long feed ──────────────────────────────
function ListItem({ article }: { article: Article }) {
  const img = useArticleImage(article)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-red-600 font-bold mb-1">NewsFlash</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
            {article.headline || article.title}
          </p>
          {expanded && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              {article.body || article.summary}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => setExpanded(v => !v)}
              className="text-[11px] text-blue-500 font-medium">
              {expanded ? 'Show less ▲' : 'Read more ▼'}
            </button>
            {expanded && (
              <a href={`/article/${article.id}`}
                className="text-[11px] text-red-600 font-semibold flex items-center gap-0.5">
                Full Story <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
        {img && (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  )
}
