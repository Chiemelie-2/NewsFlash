'use client'

import { useState, useEffect, useRef } from 'react'
import { ExternalLink, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { Article } from '@/lib/supabase'
import { fetchArticleImage, ArticleImage } from '@/lib/images'

export default function ArticleCard({ article }: { article: Article }) {
  const headline = article.headline || article.title
  const summary = article.summary || ''
  const fullBody = article.body || summary
  const tags = article.tags || []

  const [expanded, setExpanded] = useState(false)
  const [image, setImage] = useState<ArticleImage | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const cardRef = useRef<HTMLElement>(null)

  // Lazy-load: only fetch image when card scrolls into viewport
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

  useEffect(() => {
    if (!inView) return
    let cancelled = false
    fetchArticleImage(tags, headline).then(img => { if (!cancelled) setImage(img) })
    return () => { cancelled = true }
  }, [inView, tags, headline])

  const truncatedSummary =
    summary.length > 180 ? summary.slice(0, 180).trimEnd() + '…' : summary

  return (
    <article
      ref={cardRef}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
      itemScope
      itemType="https://schema.org/NewsArticle"
    >
      {/* Hero Image */}
      <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {inView && image ? (
          <>
            <img
              src={image.src}
              alt={image.alt}
              itemProp="image"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {/* AI badge — only shown for fallback SVG images */}
            {image.source === 'ai-generated' && (
              <span className="absolute bottom-1 right-2 text-white text-[10px] bg-purple-600/80 px-1.5 py-0.5 rounded">
                AI Preview
              </span>
            )}
          </>
        ) : (
          /* Skeleton shimmer while loading */
          <div className="w-full h-full animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h2
          itemProp="headline"
          className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug"
        >
          {headline}
        </h2>

        {article.meta_description && (
          <meta itemProp="description" content={article.meta_description} />
        )}

        <div className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
          <p itemProp="description">{expanded ? fullBody : truncatedSummary}</p>
          {fullBody.length > 180 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
            >
              {expanded
                ? <><ChevronUp size={13} /> Show less</>
                : <><ChevronDown size={13} /> Read full summary</>}
            </button>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3" itemProp="keywords">
            {tags.slice(0, 5).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] rounded-full border border-blue-200 dark:border-blue-700"
              >
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
          <time
            itemProp="datePublished"
            dateTime={article.published || article.created_at}
            className="text-xs text-gray-400 dark:text-gray-500"
          >
            {new Date(article.published || article.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </time>
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            itemProp="url"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            Full Story <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  )
}
