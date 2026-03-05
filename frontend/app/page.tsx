'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import ArticleCard from '@/components/ArticleCard'
import CategoryFilter from '@/components/CategoryFilter'
import SearchBar from '@/components/SearchBar'
import { getArticles, Article } from '@/lib/supabase'

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true)
      try {
        const data = await getArticles(50, 0)
        setArticles(data)
      } catch (error) {
        console.error('Failed to fetch articles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  const filteredArticles = articles.filter(a => {
    const matchesCategory = !selectedCategory || a.tags?.includes(selectedCategory)
    const matchesSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <CategoryFilter
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 dark:text-gray-400">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 dark:text-gray-400">No articles found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
