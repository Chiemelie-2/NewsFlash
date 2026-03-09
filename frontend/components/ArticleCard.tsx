'use client'

/**
 * components/ArticleCard.tsx
 * ─────────────────────────────────────────────────────────
 * Football article card with:
 *  ✅ Hero image — prefers article.image_url (DB-cached from scraper)
 *     Falls back to AI-generated football SVG (synchronous, no network)
 *  ✅ Lazy-loading via IntersectionObserver (200px rootMargin)
 *  ✅ Skeleton shimmer while image loads
 *  ✅ AI badge only on SVG fallback images
 *  ✅ Section badge (BREAKING / TRANSFERS / GIST etc.)
 *  ✅ Expand / collapse summary
 *  ✅ Tag chips
 *  ✅ Source name + published date
 *  ✅ Full story link
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ExternalLink, Tag, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Article } from '@/lib/supabase'
import { fetchArticleImage, ArticleImage } from '@/lib/images'

// ── Section colour mapping ────────────────────────────────────────
const SECTION_STYLES: Record<string, { label: string; color: string }> = {
  breaking:       { label: 'BREAKING',    color: '#ef4444' },
  transfers:      { label: 'TRANSFERS',   color: '#38bdf8' },
  gist:           { label: 'GIST',        color: '#a855f7' },
  investigations: { label: 'INVESTIGATE', color: '#f59e0b' },
  analysis:       { label: 'ANALYSIS',    color: '#00FF87' },
  history:        { label: 'HISTORY',     color: '#d97706' },
  players:        { label: 'PLAYERS',     color: '#f472b6' },
}

export default function ArticleCard({ article }: { article: Article }) {
  const headline = article.headline || article.title
  const summary  = article.summary || ''
  const fullBody = article.body || summary
  const tags     = article.tags || []

  const [expanded, setExpanded]   = useState(false)
  const [image, setImage]         = useState<ArticleImage | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [inView, setInView]       = useState(false)
  const cardRef = useRef<HTMLElement>(null)

  // ── Lazy-load: only fetch image when card scrolls into viewport ──
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Image resolution ─────────────────────────────────────────────
  useEffect(() => {
    if (!inView) return

    // 1. Use the image saved by the scraper (Pixabay / OG image) — NO network call
    if (article.image_url) {
      setImage({ src: article.image_url, alt: headline, source: 'db' })
      return
    }

    // 2. Fall back to AI-generated football SVG — synchronous, zero network calls
    setImage(fetchArticleImage(tags, headline))
  }, [inView, tags, headline, article.image_url])

  const truncatedSummary =
    summary.length > 160 ? summary.slice(0, 160).trimEnd() + '…' : summary

  const sectionStyle = article.section ? SECTION_STYLES[article.section] : null

  return (
    <article
      ref={cardRef}
      className="card-hover animate-fade-up"
      itemScope
      itemType="https://schema.org/NewsArticle"
      style={{
        background: 'var(--pitch-mid)',
        border: '1px solid var(--pitch-border)',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
    >
      {/* ── Hero Image ──────────────────────────────────────────── */}
      <Link href={`/article/${article.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            background: 'var(--pitch-surface)',
            overflow: 'hidden',
          }}
        >
          {inView && image ? (
            <>
              <img
                src={image.src}
                alt={image.alt}
                itemProp="image"
                onLoad={() => setImgLoaded(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: imgLoaded ? 1 : 0,
                  transition: 'opacity 0.5s ease, transform 0.4s ease',
                  display: 'block',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
              />

              {/* Gradient overlay for readability */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
              }} />

              {/* Section badge — top left */}
              {sectionStyle && (
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: sectionStyle.color,
                    color: '#000',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    padding: '3px 8px',
                    borderRadius: '2px',
                  }}
                >
                  {sectionStyle.label}
                </span>
              )}

              {/* AI badge — only shown for fallback SVG images */}
              {image.source === 'ai-generated' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(88,28,220,0.85)',
                    color: 'white',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '2px 7px',
                    borderRadius: '2px',
                  }}
                >
                  AI PREVIEW
                </span>
              )}
            </>
          ) : (
            /* Skeleton shimmer while loading */
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, var(--pitch-surface) 0%, var(--pitch-border) 50%, var(--pitch-surface) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          )}
        </div>
      </Link>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Headline */}
        <Link href={`/article/${article.id}`} style={{ textDecoration: 'none' }}>
          <h2
            itemProp="headline"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              marginBottom: '10px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {headline}
          </h2>
        </Link>

        {article.meta_description && (
          <meta itemProp="description" content={article.meta_description} />
        )}

        {/* Summary */}
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}
        >
          <p itemProp="description">{expanded ? fullBody : truncatedSummary}</p>
          {fullBody.length > 160 && (
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                marginTop: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--green-spark)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                padding: 0,
                textTransform: 'uppercase',
              }}
            >
              {expanded
                ? <><ChevronUp size={12} /> Show less</>
                : <><ChevronDown size={12} /> Read more</>}
            </button>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}
            itemProp="keywords"
          >
            {tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '3px 8px',
                  background: 'var(--pitch-surface)',
                  border: '1px solid var(--pitch-border)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  borderRadius: '2px',
                  textTransform: 'uppercase',
                }}
              >
                <Tag size={9} /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer — date + source + link */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--pitch-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <time
              itemProp="datePublished"
              dateTime={article.published || article.created_at}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {new Date(article.published || article.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </time>
            {article.source_name && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--green-spark)',
                  letterSpacing: '0.04em',
                  opacity: 0.8,
                }}
              >
                · {article.source_name}
              </span>
            )}
          </div>

          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            itemProp="url"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              padding: '4px 8px',
              border: '1px solid var(--pitch-border)',
              borderRadius: '3px',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.color = 'var(--green-spark)'
              el.style.borderColor = 'var(--green-spark)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.color = 'var(--text-muted)'
              el.style.borderColor = 'var(--pitch-border)'
            }}
          >
            Source <ExternalLink size={9} />
          </a>
        </div>
      </div>

      {/* Shimmer keyframe injected once */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </article>
  )
}
