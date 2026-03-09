import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Article {
  id: string
  title: string
  source_url: string
  published: string
  summary: string
  headline?: string
  body?: string
  tags?: string[]
  meta_description?: string
  /**
   * image_url — saved by the scraper from the source's OG image / Pixabay.
   * Frontend always prefers this over generated images. See lib/images.ts.
   */
  image_url?: string
  /**
   * section — maps to football platform nav sections:
   * 'breaking' | 'transfers' | 'gist' | 'investigations' | 'analysis' | 'history' | 'players'
   */
  section?: string
  /** source_name — e.g. "Sky Sports", "BBC Sport", "ESPN" */
  source_name?: string
  public: boolean
  created_at: string
  updated_at: string
}

/* ── Generic article fetchers ────────────────────────────────────── */

export async function getArticles(limit = 20, offset = 0): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('public', true)
    .order('published', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  return data || []
}

/* ── Football section fetchers ───────────────────────────────────── */

export async function getArticlesBySection(section: string, limit = 20): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('section', section)
    .eq('public', true)
    .order('published', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(`Error fetching ${section} articles:`, error)
    return []
  }

  return data || []
}

export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .contains('tags', [tag])
    .eq('public', true)
    .order('published', { ascending: false })

  if (error) {
    console.error('Error fetching articles by tag:', error)
    return []
  }

  return data || []
}

export async function searchArticles(query: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .or(`title.ilike.%${query}%,body.ilike.%${query}%,headline.ilike.%${query}%`)
    .eq('public', true)
    .order('published', { ascending: false })

  if (error) {
    console.error('Error searching articles:', error)
    return []
  }

  return data || []
}

/* ── Trending: most-commented articles ───────────────────────────── */

export async function getTrendingArticleIds(limit = 5): Promise<string[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('article_id')
    .limit(200)

  if (error || !data) return []

  // Count comment frequency per article
  const counts: Record<string, number> = {}
  data.forEach(({ article_id }) => {
    counts[article_id] = (counts[article_id] || 0) + 1
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}
