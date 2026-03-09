'use client'

/**
 * components/SearchBar.tsx
 * ─────────────────────────────────────────────────────────
 * Football platform search input.
 * Keeps original props interface (value / onChange) intact.
 * ─────────────────────────────────────────────────────────
 */

import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search players, clubs, transfers…',
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 40px',
            background: 'var(--pitch-surface)',
            border: '1px solid var(--pitch-border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--green-spark)'
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--green-glow)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--pitch-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.05em',
              padding: '2px 6px',
            }}
          >
            CLEAR
          </button>
        )}
      </div>
    </form>
  )
}
