/**
 * images.ts
 * ─────────────────────────────────────────────────────────
 * Pexels image lookup with Claude AI-generated fallback.
 *
 * WHERE TO ADD IT:  frontend/lib/images.ts  (new file)
 *
 * HOW IT WORKS:
 *  1. fetchArticleImage(keywords, articleId) is called from ArticleCard
 *  2. It first queries Pexels free API using the article tags/headline
 *  3. If Pexels returns nothing, it calls Claude claude-sonnet-4-20250514 to
 *     describe a vivid image and uses an SVG placeholder with that prompt
 *     (or swap for a real text-to-image API such as Replicate/Stability)
 * ─────────────────────────────────────────────────────────
 */

const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY || ''

export interface ArticleImage {
  src: string
  alt: string
  photographer?: string
  photographerUrl?: string
  source: 'pixabay' | 'ai-generated'
}

/** Search Pixabay for a relevant photo */
async function searchPixabay(query: string): Promise<ArticleImage | null> {
  if (!PIXABAY_API_KEY) return null
  try {
    const params = new URLSearchParams({
      key: PIXABAY_API_KEY,
      q: query,
      image_type: 'photo',
      orientation: 'horizontal',
      category: 'backgrounds',   // wide editorial-style shots
      per_page: '3',
      safesearch: 'true',
      order: 'popular',
    })
    const res = await fetch(`https://pixabay.com/api/?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const hit = data?.hits?.[0]
    if (!hit) return null
    return {
      // webformatURL = ~640px wide, good balance of quality vs speed
      // use largeImageURL for higher quality if needed
      src: hit.webformatURL,
      alt: query,
      source: 'pixabay',
    }
  } catch {
    return null
  }
}


/** Generate a themed SVG image when Pixabay returns nothing */
async function generateAIImage(headline: string, tags: string[]): Promise<ArticleImage> {
  const topic = tags[0] || headline.split(' ').slice(0, 3).join(' ')
  const colors = topicToColors(topic)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <circle cx="650" cy="80"  r="120" fill="${colors[2]}" opacity="0.15" filter="url(#blur)"/>
    <circle cx="100" cy="370" r="90"  fill="${colors[2]}" opacity="0.10" filter="url(#blur)"/>
    <circle cx="400" cy="225" r="160" fill="${colors[2]}" opacity="0.07" filter="url(#blur)"/>
    <text x="400" y="210" font-family="system-ui,sans-serif" font-size="40" font-weight="700"
      fill="white" text-anchor="middle" opacity="0.92">${escapeXml(topic.toUpperCase())}</text>
    <text x="400" y="255" font-family="system-ui,sans-serif" font-size="15"
      fill="white" text-anchor="middle" opacity="0.65">AI Generated Preview</text>
  </svg>`


  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  return { src: dataUrl, alt: headline, source: 'ai-generated' }
}

function escapeXml(str: string) {
  return str.replace(/[<>&'"]/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c)
  )
}

function topicToColors(topic: string): [string, string, string] {
  const t = topic.toLowerCase()
  if (t.includes('tech') || t.includes('ai') || t.includes('software') || t.includes('openai'))
    return ['#1e3a5f', '#0f2027', '#4fc3f7']
  if (t.includes('crypto') || t.includes('bitcoin') || t.includes('blockchain'))
    return ['#1a1a2e', '#16213e', '#f7931a']
  if (t.includes('business') || t.includes('finance') || t.includes('market'))
    return ['#1b4332', '#081c15', '#40916c']
  if (t.includes('apple') || t.includes('iphone') || t.includes('mac'))
    return ['#1c1c1e', '#2c2c2e', '#8e8e93']
  if (t.includes('tesla') || t.includes('electric') || t.includes('ev'))
    return ['#cc0000', '#8b0000', '#ff6b6b']
  if (t.includes('space') || t.includes('nasa') || t.includes('rocket'))
    return ['#0b0c10', '#1f2833', '#66fcf1']
  if (t.includes('google') || t.includes('alphabet'))
    return ['#1a73e8', '#0d47a1', '#4285f4']
  if (t.includes('microsoft') || t.includes('windows'))
    return ['#003366', '#001f4d', '#00a4ef']
  if (t.includes('meta') || t.includes('facebook'))
    return ['#1877f2', '#0c4a9e', '#42b3ff']
  if (t.includes('amazon') || t.includes('aws'))
    return ['#ff9900', '#b36b00', '#ffb84d']
  return ['#2d3561', '#1a1a2e', '#6c63ff']
}

/** Main export — tries Pixabay first, then AI fallback */
export async function fetchArticleImage(
  keywords: string[],
  headline: string
): Promise<ArticleImage> {
  const query = keywords.slice(0, 3).join(' ') || headline.slice(0, 50)

  const pixabayResult = await searchPixabay(query)
  if (pixabayResult) return pixabayResult

  return generateAIImage(headline, keywords)
}
