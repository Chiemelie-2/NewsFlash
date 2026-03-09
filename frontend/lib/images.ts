/**
 * images.ts
 * ─────────────────────────────────────────────────────────
 * Image resolution for articles — NO live API calls from the browser.
 *
 * Strategy (in order):
 *  1. article.image_url  — saved by the scraper into Supabase at scrape time
 *  2. AI-generated SVG   — football-themed gradient based on article topic/tags
 *
 * Pixabay is called ONLY by the Python scraper (server-side, rate-limited
 * properly). The frontend never touches Pixabay directly, so there are
 * zero 429 errors and zero API key exposure in the browser.
 * ─────────────────────────────────────────────────────────
 */

export interface ArticleImage {
  src: string
  alt: string
  /** 'db' = saved image URL from scraper | 'ai-generated' = fallback SVG */
  source: 'db' | 'ai-generated'
}

// ── In-memory SVG cache (avoids regenerating the same topic) ──────
const svgCache = new Map<string, ArticleImage>()

// ── Generate a football-themed SVG gradient image ─────────────────
export function generateAIImage(headline: string, tags: string[]): ArticleImage {
  const topic = tags[0] || headline.split(' ').slice(0, 3).join(' ')
  const cacheKey = topic.toLowerCase().slice(0, 30)

  if (svgCache.has(cacheKey)) return svgCache.get(cacheKey)!

  const colors = topicToColors(topic)
  const label  = topic.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().slice(0, 20)

  // Football-pitch-style SVG with field lines as background motif
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="${colors[0]}"/>
        <stop offset="100%" stop-color="${colors[1]}"/>
      </linearGradient>
      <filter id="b"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <!-- pitch centre circle motif -->
    <circle cx="400" cy="225" r="120" fill="none" stroke="white" stroke-width="1.5" opacity="0.06"/>
    <circle cx="400" cy="225" r="5"   fill="white" opacity="0.08"/>
    <!-- centre line -->
    <line x1="400" y1="30" x2="400" y2="420" stroke="white" stroke-width="1" opacity="0.05"/>
    <!-- penalty arcs -->
    <path d="M 120 165 A 80 80 0 0 1 120 285" fill="none" stroke="white" stroke-width="1" opacity="0.05"/>
    <path d="M 680 165 A 80 80 0 0 0 680 285" fill="none" stroke="white" stroke-width="1" opacity="0.05"/>
    <!-- glow blobs -->
    <circle cx="680" cy="70"  r="160" fill="${colors[2]}" opacity="0.10" filter="url(#b)"/>
    <circle cx="80"  cy="380" r="120" fill="${colors[2]}" opacity="0.08" filter="url(#b)"/>
    <!-- label -->
    <text x="400" y="212" font-family="'Barlow Condensed',sans-serif" font-size="52" font-weight="900"
      fill="white" text-anchor="middle" opacity="0.92" letter-spacing="3">${escXml(label)}</text>
    <text x="400" y="248" font-family="'JetBrains Mono',monospace" font-size="11"
      fill="white" text-anchor="middle" opacity="0.4" letter-spacing="6">NEWSFLASH ⚽</text>
  </svg>`

  const result: ArticleImage = {
    src: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`,
    alt: headline,
    source: 'ai-generated',
  }
  svgCache.set(cacheKey, result)
  return result
}

function escXml(s: string) {
  return s.replace(/[<>&'"]/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c)
  )
}

// ── Football-topic colour palette ─────────────────────────────────
function topicToColors(topic: string): [string, string, string] {
  const t = topic.toLowerCase()
  if (t.match(/transfer|deal|sign|contract|fee/))             return ['#0f172a','#1e3a5f','#38bdf8']
  if (t.match(/premier league|epl|english/))                  return ['#1a0533','#3b0764','#a855f7']
  if (t.match(/champions league|ucl|europa/))                 return ['#0c1445','#1e3a8a','#3b82f6']
  if (t.match(/la liga|spain|barcelona|real madrid/))         return ['#4a0404','#7f1d1d','#ef4444']
  if (t.match(/bundesliga|germany|bundesliga/))               return ['#1a0a00','#431407','#f97316']
  if (t.match(/serie a|italy|juventus|inter|milan/))          return ['#0a0a1a','#1e1b4b','#6366f1']
  if (t.match(/injury|fitness|return|knock/))                 return ['#0c1a0c','#14532d','#22c55e']
  if (t.match(/goal|score|result|win|loss|defeat/))           return ['#0a0f0a','#052e16','#00FF87']
  if (t.match(/haaland|mbapp|bellingham|salah|kane/))         return ['#0f0f0f','#1c1c1c','#fbbf24']
  if (t.match(/referee|var|offside|penalty|red card/))        return ['#2d0000','#450a0a','#ef4444']
  if (t.match(/history|legend|classic|greatest|nostalgia/))   return ['#1a1206','#292524','#d97706']
  if (t.match(/tactic|formation|analysis|system/))            return ['#0a1628','#0c2340','#0ea5e9']
  if (t.match(/corruption|scandal|investigation/))            return ['#1a0a00','#3b1c08','#f59e0b']
  if (t.match(/world cup|international|national/))            return ['#0a0e1a','#0f172a','#60a5fa']
  return ['#0a0a0a','#111827','#00FF87']
}

/**
 * Main export — resolves an image for an article.
 * Call this with article.image_url (from DB) when available,
 * otherwise falls back to the football SVG generator.
 *
 * Usage in components:
 *   if (article.image_url) → use directly as <img src={article.image_url}>
 *   else → const img = fetchArticleImage(article.tags, article.headline)
 *
 * This function is synchronous — no .then() needed.
 */
export function fetchArticleImage(
  keywords: string[],
  headline: string
): ArticleImage {
  // Pure SVG generation — synchronous, zero network calls
  return generateAIImage(headline, keywords)
}
