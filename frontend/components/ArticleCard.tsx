'use client'

import { Article } from '@/lib/supabase'
import { ExternalLink, Tag } from 'lucide-react'

export default function ArticleCard({ article }: { article: Article }) {
  const headline = article.headline || article.title
  const body = article.body || article.summary

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg dark:shadow-gray-900 transition transform hover:scale-105">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {headline}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {body}
        </p>

        {article.meta_description && (
          <p className="text-gray-500 dark:text-gray-500 text-xs italic mb-4">
            {article.meta_description}
          </p>
        )}

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs rounded-full"
              >
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <time className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(article.published || article.created_at).toLocaleDateString()}
          </time>

          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition text-sm"
          >
            Read More
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </article>
  )
}
