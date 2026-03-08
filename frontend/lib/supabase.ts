import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

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
  image_url?: string
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
    console.error('❌ Error fetching articles:', error.message, error.hint || '')
    return []
  }

  console.log(`✅ Fetched ${data?.length ?? 0} articles`)
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
    console.error('❌ Error fetching articles by tag:', error.message)
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
    console.error('❌ Error searching articles:', error.message)
    return []
  }
  return data || []
}
