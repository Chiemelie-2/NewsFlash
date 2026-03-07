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
  image_url?: string        // ← NEW: cached Pexel URL (optional)
  public: boolean
  created_at: string
  updated_at: string
}

export async function getArticles(limit = 10, offset = 0): Promise<Article[]> {
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
