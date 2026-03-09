'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { supabase, Article } from '@/lib/supabase'
import { Shield, Eye, EyeOff, RefreshCw } from 'lucide-react'

export default function AdminPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const fetchAllArticles = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('published', { ascending: false })

        if (error) throw error
        setArticles(data || [])
      } catch (error) {
        console.error('Failed to fetch articles:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllArticles()
  }, [])

  const togglePublic = async (id: string, currentPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ public: !currentPublic })
        .eq('id', id)

      if (error) throw error
      setArticles(articles.map(a => a.id === id ? { ...a, public: !currentPublic } : a))
    } catch (error) {
      console.error('Failed to toggle article:', error)
    }
  }

  const published  = articles.filter(a => a.public).length
  const drafts     = articles.length - published

  return (
    <main style={{ minHeight: '100vh', background: 'var(--pitch-black)' }}>
      <Header />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Shield size={22} style={{ color: 'var(--green-spark)' }} />
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900,
            letterSpacing: '-0.01em', textTransform: 'uppercase', color: 'var(--text-primary)',
          }}>
            Admin Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Articles', value: articles.length, color: 'var(--text-primary)' },
            { label: 'Published',      value: published,         color: 'var(--green-spark)' },
            { label: 'Drafts',         value: drafts,            color: 'var(--amber-boost)' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--pitch-mid)', border: '1px solid var(--pitch-border)',
              borderRadius: '8px', padding: '16px 24px', minWidth: '140px',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '10px' }}>
            <RefreshCw size={18} style={{ color: 'var(--green-spark)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Loading articles…
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--pitch-mid)', border: '1px solid var(--pitch-border)',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pitch-border)', background: 'var(--pitch-surface)' }}>
                  {['Title', 'Section', 'Published', 'Status', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articles.map((article, i) => (
                  <tr
                    key={article.id}
                    style={{
                      borderBottom: i < articles.length - 1 ? '1px solid var(--pitch-border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--pitch-surface)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', maxWidth: '360px' }}>
                      <p style={{
                        fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700,
                        letterSpacing: '0.02em', textTransform: 'uppercase',
                        color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {article.headline || article.title}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {article.section ? (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: '2px',
                          background: 'var(--pitch-surface)', color: 'var(--green-spark)',
                          border: '1px solid var(--pitch-border)',
                        }}>
                          {article.section}
                        </span>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                        {new Date(article.published).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: '2px',
                        background: article.public ? 'rgba(0,255,135,0.1)' : 'rgba(245,158,11,0.1)',
                        color: article.public ? 'var(--green-spark)' : 'var(--amber-boost)',
                        border: `1px solid ${article.public ? 'rgba(0,255,135,0.25)' : 'rgba(245,158,11,0.25)'}`,
                      }}>
                        {article.public ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => togglePublic(article.id, article.public)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          background: 'none', border: '1px solid var(--pitch-border)',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          padding: '5px 10px', borderRadius: '4px',
                          transition: 'color 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.color = article.public ? 'var(--red-card)' : 'var(--green-spark)'
                          el.style.borderColor = article.public ? 'var(--red-card)' : 'var(--green-spark)'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.color = 'var(--text-muted)'
                          el.style.borderColor = 'var(--pitch-border)'
                        }}
                      >
                        {article.public ? <><EyeOff size={11} /> Unpublish</> : <><Eye size={11} /> Publish</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
