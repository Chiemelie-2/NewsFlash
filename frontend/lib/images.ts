/**
 * images.ts
 * ─────────────────────────────────────────────────────────
 * Image resolution for articles — NO live API calls from the browser.
 *
 * Strategy (in order):
 *  1. article.image_url  — saved by the scraper into Supabase at scrape time
 *  2. AI-generated SVG   — themed gradient based on article topic/tags
 *
 * Pixabay is called ONLY by the Python scraper (server-side, rate-limited
 * properly). The frontend never touches Pixabay directly, so there are
 * zero 429 errors and zero API key exposure in the browser.
 * ─────────────────────────────────────────────────────────
 */

export interface ArticleImage {
  src: string
  alt: string
  source: 'db' | 'ai-generated'
}

// ── In-memory SVG cache (avoids regenerating the same topic) ──────
const svgCache = new Map<string, ArticleImage>()

// ── Generate a themed SVG gradient image ─────────────────────────
export function generateAIImage(headline: string, tags: string[]): ArticleImage {
  const topic = tags[0] || headline.split(' ').slice(0, 3).join(' ')
  const cacheKey = topic.toLowerCase().slice(0, 30)

  if (svgCache.has(cacheKey)) return svgCache.get(cacheKey)!

  const colors = topicToColors(topic)
  const label  = topic.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().slice(0, 20)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="${colors[0]}"/>
        <stop offset="100%" stop-color="${colors[1]}"/>
      </linearGradient>
      <filter id="b"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <circle cx="680" cy="70"  r="140" fill="${colors[2]}" opacity="0.12" filter="url(#b)"/>
    <circle cx="80"  cy="380" r="100" fill="${colors[2]}" opacity="0.10" filter="url(#b)"/>
    <circle cx="400" cy="225" r="180" fill="${colors[2]}" opacity="0.06" filter="url(#b)"/>
    <rect x="60" y="170" width="680" height="2" fill="white" opacity="0.08"/>
    <rect x="60" y="278" width="680" height="2" fill="white" opacity="0.08"/>
    <text x="400" y="220" font-family="Georgia,serif" font-size="48" font-weight="700"
      fill="white" text-anchor="middle" opacity="0.95" letter-spacing="2">${escXml(label)}</text>
    <text x="400" y="260" font-family="system-ui,sans-serif" font-size="13"
      fill="white" text-anchor="middle" opacity="0.5" letter-spacing="4">NEWSFLASH</text>
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

function topicToColors(topic: string): [string, string, string] {
  const t = topic.toLowerCase()
  if (t.match(/tech|ai|software|openai|chatgpt|nvidia|robot/))  return ['#1e3a5f','#0f2027','#4fc3f7']
  if (t.match(/crypto|bitcoin|blockchain|ethereum|defi/))        return ['#1a1a2e','#16213e','#f7931a']
  if (t.match(/business|finance|market|economy|stock|trade/))    return ['#1b4332','#081c15','#40916c']
  if (t.match(/apple|iphone|mac|ipad|ios/))                      return ['#1c1c1e','#2c2c2e','#8e8e93']
  if (t.match(/tesla|electric|ev|car|auto/))                     return ['#7f1d1d','#450a0a','#ef4444']
  if (t.match(/space|nasa|rocket|spacex|satellite/))             return ['#0b0c10','#1f2833','#66fcf1']
  if (t.match(/google|alphabet|search|youtube/))                 return ['#1a73e8','#0d47a1','#4285f4']
  if (t.match(/microsoft|windows|azure|xbox/))                   return ['#003366','#001f4d','#00a4ef']
  if (t.match(/meta|facebook|instagram|whatsapp/))               return ['#1877f2','#0c4a9e','#42b3ff']
  if (t.match(/amazon|aws|retail|ecommerce/))                    return ['#78350f','#451a03','#f59e0b']
  if (t.match(/iran|war|military|conflict|ukraine|nato/))        return ['#7c2d12','#450a0a','#fb923c']
  if (t.match(/health|medical|covid|vaccine|hospital/))          return ['#164e63','#0c4a6e','#06b6d4']
  if (t.match(/politic|election|government|president|congress/)) return ['#1e1b4b','#0f0d2e','#818cf8']
  if (t.match(/sport|football|basketball|soccer|nba|nfl/))       return ['#14532d','#052e16','#4ade80']
  if (t.match(/music|film|movie|entertain|celeb|award/))         return ['#4a044e','#2e0033','#e879f9']
  return ['#2d3561','#1a1a2e','#6c63ff']
}

/**
 * Main export — resolves an image for an article.
 * Call this with article.image_url (from DB) when available,
 * otherwise falls back to the SVG generator.
 *
 * Usage in components:
 *   if (article.image_url) → use directly as <img src={article.image_url}>
 *   else → const img = fetchArticleImage(article.tags, article.headline)
 */
export function fetchArticleImage(
  keywords: string[],
  headline: string
): ArticleImage {
  // Pure SVG generation — synchronous, zero network calls
  return generateAIImage(headline, keywords)
}
