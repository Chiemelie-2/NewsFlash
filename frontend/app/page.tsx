'use client'

/**
 * app/page.tsx
 * ─────────────────────────────────────────────────────────
 * Football platform homepage.
 *
 * Layout:
 *  1. Header (sticky)
 *  2. Live scores banner
 *  3. Hero feature — top article full-width
 *  4. Two-column layout:
 *     LEFT:  SearchBar + CategoryFilter + Article grid + Load more
 *     RIGHT: Fan Polls, Did You Know?, Transfer CTA, Player CTA
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import ArticleCard from '@/components/ArticleCard'
import CategoryFilter from '@/components/CategoryFilter'
import SearchBar from '@/components/SearchBar'
import LiveScoresBanner from '@/components/LiveScoresBanner'
import FanPolls from '@/components/FanPolls'
import DidYouKnow from '@/components/DidYouKnow'
import { getArticles, Article } from '@/lib/supabase'
import { fetchArticleImage } from '@/lib/images'
import { Clock, ChevronDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 18

export default function Home() {
  const [articles, setArticles]             = useState<Article[]>([])
  const [loading, setLoading]               = useState(true)
  const [loadingMore, setLoadingMore]       = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery]       = useState<string>('')
  const [offset, setOffset]                 = useState(0)
  const [hasMore, setHasMore]               = useState(true)

  // ── Initial fetch ─────────────────────────────────────────────
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true)
      try {
        const data = await getArticles(PAGE_SIZE, 0)
        setArticles(data)
        setHasMore(data.length === PAGE_SIZE)
        setOffset(PAGE_SIZE)
      } catch (error) {
        console.error('Failed to fetch articles:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [])

  // ── Load more ────────────────────────────────────────────────
  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await getArticles(PAGE_SIZE, offset)
      setArticles(prev => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
      setOffset(prev => prev + PAGE_SIZE)
    } catch (error) {
      console.error('Failed to load more:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // ── Filter logic — same as original ──────────────────────────
  const filteredArticles = articles.filter(a => {
    const matchesCategory = !selectedCategory ||
      a.tags?.includes(selectedCategory) ||
      a.section === selectedCategory
    const matchesSearch = !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // ── Hero = first article ──────────────────────────────────────
  const [heroArticle, ...gridArticles] = filteredArticles
  const heroImage = heroArticle
    ? heroArticle.image_url
      ? { src: heroArticle.image_url, alt: heroArticle.headline || heroArticle.title, source: 'db' as const }
      : fetchArticleImage(heroArticle.tags || [], heroArticle.headline || heroArticle.title)
    : null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--pitch-black)' }}>
      <Header />
      <LiveScoresBanner />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>

        {/* ── Hero Feature Article ───────────────────────────── */}
        {!loading && heroArticle && heroImage && (
          <Link href={`/article/${heroArticle.id}`} style={{ textDecoration:'none', display:'block' }}>
            <div className="card-hover" style={{ position:'relative', width:'100%', height:'clamp(280px, 45vw, 520px)', borderRadius:'10px', overflow:'hidden', margin:'24px 0', cursor:'pointer' }}>
              <img src={heroImage.src} alt={heroImage.alt} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }} />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'clamp(16px,3vw,40px)' }}>
                {heroArticle.section && (
                  <span style={{ display:'inline-block', background:'var(--green-spark)', color:'#000', fontFamily:'var(--font-mono)', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', padding:'3px 10px', borderRadius:'2px', marginBottom:'12px' }}>
                    {heroArticle.section}
                  </span>
                )}
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px, 4vw, 48px)', fontWeight:900, letterSpacing:'-0.01em', textTransform:'uppercase', color:'white', lineHeight:1.05, marginBottom:'10px', maxWidth:'800px', textShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
                  {heroArticle.headline || heroArticle.title}
                </h1>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <Clock size={12} style={{ color:'rgba(255,255,255,0.6)' }} />
                  <time style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'rgba(255,255,255,0.6)', letterSpacing:'0.05em' }}>
                    {new Date(heroArticle.published || heroArticle.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </time>
                  {heroArticle.source_name && (
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--green-spark)', letterSpacing:'0.05em' }}>{heroArticle.source_name}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Two-column: main + sidebar ────────────────────── */}
        <div className="home-grid">

          {/* ── Main column ────────────────────────────────── */}
          <div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />

            <div style={{ marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span className="section-label">
                {selectedCategory ? selectedCategory.toUpperCase() : searchQuery ? `RESULTS FOR "${searchQuery.toUpperCase()}"` : 'LATEST FOOTBALL NEWS'}
              </span>
              {filteredArticles.length > 0 && (
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-muted)', letterSpacing:'0.06em' }}>
                  {filteredArticles.length} articles
                </span>
              )}
            </div>

            {loading ? (
              <div className="articles-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ background:'var(--pitch-mid)', border:'1px solid var(--pitch-border)', borderRadius:'8px', overflow:'hidden' }}>
                    <div style={{ height:'200px', background:'var(--pitch-surface)', animation:'shimmer 1.5s infinite', backgroundSize:'200% 100%' }} />
                    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                      {[90,70,80].map((w,j) => <div key={j} style={{ height:'13px', background:'var(--pitch-surface)', borderRadius:'3px', width:`${w}%`, animation:'shimmer 1.5s infinite', backgroundSize:'200% 100%' }} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : gridArticles.length === 0 && !heroArticle ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'280px', gap:'12px' }}>
                <span style={{ fontSize:'48px' }}>⚽</span>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'20px', fontWeight:700, letterSpacing:'0.05em', color:'var(--text-muted)', textTransform:'uppercase' }}>No articles found</p>
                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ fontFamily:'var(--font-mono)', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', background:'none', border:'1px solid var(--pitch-border)', color:'var(--green-spark)', cursor:'pointer', padding:'8px 16px', borderRadius:'4px' }}>Clear search</button>}
              </div>
            ) : (
              <>
                <div className="articles-grid" style={{ marginBottom:'32px' }}>
                  {gridArticles.map((article, i) => (
                    <div key={article.id} style={{ animationDelay:`${(i % 6) * 60}ms` }}>
                      <ArticleCard article={article} />
                    </div>
                  ))}
                </div>
                {hasMore && !searchQuery && !selectedCategory && (
                  <div style={{ display:'flex', justifyContent:'center', paddingBottom:'48px' }}>
                    <button onClick={loadMore} disabled={loadingMore} style={{ display:'inline-flex', alignItems:'center', gap:'8px', fontFamily:'var(--font-display)', fontSize:'15px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', padding:'12px 32px', borderRadius:'6px', border:'1px solid var(--pitch-border)', background: loadingMore ? 'var(--pitch-surface)' : 'var(--pitch-mid)', color: loadingMore ? 'var(--text-muted)' : 'var(--text-primary)', cursor: loadingMore ? 'not-allowed' : 'pointer', transition:'all 0.15s ease' }}>
                      {loadingMore ? 'Loading…' : <><ChevronDown size={16} /> Load more</>}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="home-sidebar">
            <FanPolls />
            <DidYouKnow />

            {/* Transfer CTA */}
            <Link href="/transfers" style={{ textDecoration:'none' }}>
              <div className="card-hover" style={{ background:'var(--pitch-mid)', border:'1px solid rgba(56,189,248,0.25)', borderRadius:'10px', padding:'18px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--sky-live)' }}>Transfer Centre</span>
                  <ArrowRight size={14} style={{ color:'var(--sky-live)' }} />
                </div>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'16px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.02em', color:'var(--text-primary)', lineHeight:1.2 }}>Latest Rumors &amp; Confirmed Deals</p>
                <p style={{ fontFamily:'var(--font-body)', fontSize:'12px', color:'var(--text-muted)', marginTop:'6px' }}>Track every transfer with the Rumor Reliability Meter →</p>
              </div>
            </Link>

            {/* Player comparison CTA */}
            <Link href="/players" style={{ textDecoration:'none' }}>
              <div className="card-hover" style={{ background:'var(--pitch-mid)', border:'1px solid rgba(0,255,135,0.2)', borderRadius:'10px', padding:'18px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--green-spark)' }}>Player Hub</span>
                  <ArrowRight size={14} style={{ color:'var(--green-spark)' }} />
                </div>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'16px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.02em', color:'var(--text-primary)', lineHeight:1.2 }}>Compare Players</p>
                <p style={{ fontFamily:'var(--font-body)', fontSize:'12px', color:'var(--text-muted)', marginTop:'6px' }}>Messi vs Ronaldo, Haaland vs Mbappé — head-to-head stats →</p>
              </div>
            </Link>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        /* Two-column layout on desktop */
        .home-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
        }
        .home-sidebar {
          position: sticky;
          top: 76px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        /* Article card grid */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        /* Tablet: collapse sidebar, 2-col article grid */
        @media (max-width: 1024px) {
          .home-grid { grid-template-columns: 1fr !important; }
          .home-sidebar { position: static !important; flex-direction: row !important; flex-wrap: wrap !important; }
          .home-sidebar > * { flex: 1 1 280px; }
          .articles-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        /* Mobile: single column */
        @media (max-width: 640px) {
          .home-sidebar { flex-direction: column !important; }
          .articles-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
