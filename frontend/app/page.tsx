'use client'

/**
 * app/page.tsx
 * ─────────────────────────────────────────────────────────
 * Football platform homepage — NewsNow-style mobile layout.
 *
 * Layout (matches reference screenshots):
 *  1. Top bar — brand logo + city selector + action icons
 *  2. Trending topics strip — hashtag bubbles with fire badge + count
 *  3. Section tabs — For You, Breaking, Transfers, Analysis, Gist, History
 *  4. Hero carousel — full-width image cards with overlay headline,
 *                     source logo + timestamp, dot pagination
 *  5. Article list — two-column thumbnail grid below carousel
 *  6. Bottom nav — Home, Football, Live, Me
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getArticles, Article } from '@/lib/supabase'
import { fetchArticleImage } from '@/lib/images'
import { Search, Download, Bell, Home, Activity, Play, User, Flame, ChevronRight, Clock } from 'lucide-react'
import LiveScoresBanner from '@/components/LiveScoresBanner'

// ── Trending topics ───────────────────────────────────────────────
const TOPICS = [
  { label: 'See All\nTopics', icon: '⊞', count: null },
  { label: '#Premier\nLeague',  count: 2341 },
  { label: '#Transfer\nNews',   count: 1890 },
  { label: '#Champions\nLeague',count: 1247 },
  { label: '#Haaland',          count: 987  },
  { label: '#Mbappé',           count: 853  },
  { label: '#Arsenal',          count: 743  },
]

// ── Section tabs ──────────────────────────────────────────────────
const TABS = [
  { id: '',               label: 'For You'   },
  { id: 'breaking',       label: 'Breaking'  },
  { id: 'transfers',      label: 'Transfers' },
  { id: 'analysis',       label: 'Analysis'  },
  { id: 'gist',           label: 'Gist'      },
  { id: 'history',        label: 'History'   },
  { id: 'players',        label: 'Players'   },
]

// ── Time ago helper ───────────────────────────────────────────────
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60)    return 'Just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function Home() {
  const [articles, setArticles]     = useState<Article[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('')
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [navActive, setNavActive]   = useState('home')
  const carouselRef = useRef<HTMLDivElement>(null)

  // ── Fetch articles ────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    getArticles(30, 0).then(data => {
      setArticles(data)
      setLoading(false)
    })
  }, [])

  // ── Auto-advance carousel every 5s ───────────────────────────
  useEffect(() => {
    if (heroArticles.length < 2) return
    const t = setInterval(() => {
      setCarouselIdx(i => (i + 1) % Math.min(heroArticles.length, 5))
    }, 5000)
    return () => clearInterval(t)
  }, [articles, activeTab])

  // ── Filter by tab ─────────────────────────────────────────────
  const filtered = articles.filter(a =>
    !activeTab || a.section === activeTab || a.tags?.includes(activeTab)
  )

  const heroArticles = filtered.slice(0, 5)
  const listArticles = filtered.slice(5, 25)

  const currentHero = heroArticles[carouselIdx]
  const heroImg = currentHero
    ? currentHero.image_url
      ? { src: currentHero.image_url, alt: currentHero.headline || currentHero.title }
      : fetchArticleImage(currentHero.tags || [], currentHero.headline || currentHero.title)
    : null

  return (
    <div style={{
      maxWidth: '430px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: "'Barlow Condensed', sans-serif",
      position: 'relative',
      overflowX: 'hidden',
    }}>

      {/* ── Top bar ────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'white',
        borderBottom: '1px solid #eee',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Brand + city */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: '#e60000', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>N</span>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '16px', fontWeight: 700, color: '#111',
          }}>
            Set Your City
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Download size={20} color="#333" />
          <Search size={20} color="#333" />
          {/* MiniPay badge */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00b09b, #96c93d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em',
          }}>
            Mini
          </div>
        </div>
      </div>

      {/* ── Live Scores Banner ─────────────────────────────────── */}
      <LiveScoresBanner />

      {/* ── Trending topics strip ─────────────────────────────── */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #eee',
        padding: '10px 0',
      }}>
        <div style={{
          display: 'flex', gap: '10px', overflowX: 'auto',
          padding: '0 14px', scrollbarWidth: 'none',
        }}>
          {TOPICS.map((topic, i) => (
            <div key={i} style={{
              flexShrink: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '5px', cursor: 'pointer',
            }}>
              {/* Circle avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: i === 0
                    ? '#f0f0f0'
                    : `hsl(${i * 47}, 65%, 55%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                }}>
                  {i === 0
                    ? <span style={{ fontSize: '20px', color: '#555' }}>⊞</span>
                    : <span style={{ fontSize: '11px', fontWeight: 800, color: 'white', textAlign: 'center', lineHeight: 1.2, padding: '4px' }}>
                        {topic.label.replace('#', '').split('\n')[0]}
                      </span>
                  }
                </div>
                {/* Fire badge + count */}
                {topic.count && (
                  <div style={{
                    position: 'absolute', bottom: '-2px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#7c3aed',
                    borderRadius: '10px', padding: '1px 6px',
                    display: 'flex', alignItems: 'center', gap: '2px',
                    border: '1.5px solid white',
                    minWidth: '36px', justifyContent: 'center',
                  }}>
                    <Flame size={8} color="white" fill="white" />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 700, color: 'white' }}>
                      {topic.count >= 1000 ? `${(topic.count/1000).toFixed(1)}k` : topic.count}
                    </span>
                  </div>
                )}
              </div>
              {/* Label */}
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '10px', fontWeight: 600, color: '#333',
                textAlign: 'center', lineHeight: 1.2,
                whiteSpace: 'pre-line',
              }}>
                {topic.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section tabs ──────────────────────────────────────── */}
      <div style={{
        background: 'white',
        borderBottom: '2px solid #eee',
        position: 'sticky', top: '53px', zIndex: 40,
      }}>
        <div style={{
          display: 'flex', overflowX: 'auto',
          padding: '0 14px', gap: '0', scrollbarWidth: 'none',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCarouselIdx(0) }}
              style={{
                flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 14px',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '14px', fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#e60000' : '#555',
                borderBottom: activeTab === tab.id ? '2.5px solid #e60000' : '2.5px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.id === '' && <span style={{ marginRight: '4px', fontSize: '12px' }}>✏️</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero Carousel ──────────────────────────────────────── */}
      <div style={{ background: 'white', paddingBottom: '12px' }}>

        {loading ? (
          <div style={{
            height: '240px', background: '#eee',
            animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%',
          }} />
        ) : currentHero && heroImg ? (
          <>
            <Link href={`/article/${currentHero.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                <img
                  src={heroImg.src}
                  alt={heroImg.alt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Dark overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)',
                }} />

                {/* Source + time — top left */}
                <div style={{
                  position: 'absolute', bottom: '44px', left: '12px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '3px',
                    background: '#e60000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, fontStyle: 'italic' }}>S</span>
                  </div>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                  }}>
                    {currentHero.source_name || 'NewsFlash'} · {timeAgo(currentHero.published || currentHero.created_at)}
                  </span>
                </div>

                {/* Headline */}
                <div style={{
                  position: 'absolute', bottom: '12px', left: '12px', right: '12px',
                }}>
                  <p style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '18px', fontWeight: 800, lineHeight: 1.15,
                    color: 'white', textTransform: 'uppercase', letterSpacing: '0.01em',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}>
                    {currentHero.headline || currentHero.title}
                  </p>
                </div>
              </div>
            </Link>

            {/* Dot pagination */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '5px',
              padding: '8px 0 4px',
            }}>
              {heroArticles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  style={{
                    width: i === carouselIdx ? '18px' : '6px',
                    height: '6px', borderRadius: '3px', border: 'none', cursor: 'pointer', padding: 0,
                    background: i === carouselIdx ? '#e60000' : '#ccc',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* ── Headlines section ──────────────────────────────────── */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '22px', fontWeight: 900, color: '#111',
            letterSpacing: '-0.01em', textTransform: 'uppercase',
          }}>
            Headlines
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>🌤️</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#888' }}>--°C</span>
            <button style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '12px', fontWeight: 700, color: '#e60000',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>
              Set Weather
            </button>
          </div>
        </div>

        {/* Article list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: '90px', borderRadius: '8px', background: '#eee',
                animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%',
              }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {listArticles.map((article, i) => {
              const img = article.image_url
                ? { src: article.image_url, alt: article.headline || article.title }
                : fetchArticleImage(article.tags || [], article.headline || article.title)

              return (
                <Link key={article.id} href={`/article/${article.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      display: 'flex', gap: '10px', alignItems: 'flex-start',
                      padding: '10px 0',
                      borderBottom: '1px solid #eee',
                      background: 'white',
                      paddingLeft: '0', paddingRight: '0',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      flexShrink: 0, width: '90px', height: '68px',
                      borderRadius: '6px', overflow: 'hidden',
                      background: '#eee',
                    }}>
                      <img
                        src={img.src}
                        alt={img.alt}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Source + time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '2px',
                          background: '#e60000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ color: 'white', fontSize: '7px', fontWeight: 900, fontStyle: 'italic' }}>N</span>
                        </div>
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: '11px', color: '#888', fontWeight: 600,
                        }}>
                          {article.source_name || 'NewsFlash'} · {timeAgo(article.published || article.created_at)}
                        </span>
                      </div>

                      {/* Headline */}
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '15px', fontWeight: 700, lineHeight: 1.25,
                        color: '#111', textTransform: 'uppercase',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                      }}>
                        {article.headline || article.title}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom padding for nav */}
      <div style={{ height: '72px' }} />

      {/* ── Bottom nav ────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px',
        background: 'white',
        borderTop: '1px solid #eee',
        display: 'flex',
        zIndex: 50,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      }}>
        {[
          { id: 'home',     icon: <Home size={22} />,     label: 'Home',     href: '/'            },
          { id: 'football', icon: <span style={{ fontSize: '22px' }}>⚽</span>, label: 'Football', href: '/live-scores' },
          { id: 'video',    icon: <Play size={22} />,     label: 'Video',    href: '#'            },
          { id: 'me',       icon: <User size={22} />,     label: 'Me',       href: '#'            },
        ].map(item => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setNavActive(item.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 0 8px', textDecoration: 'none', gap: '3px',
              color: navActive === item.id ? '#e60000' : '#888',
              borderTop: navActive === item.id ? '2px solid #e60000' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            {item.icon}
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em',
            }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        body { margin: 0; }
      `}</style>
    </div>
  )
}