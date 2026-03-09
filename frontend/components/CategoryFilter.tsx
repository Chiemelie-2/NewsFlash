'use client'

/**
 * components/CategoryFilter.tsx
 * ─────────────────────────────────────────────────────────
 * Football section filter pills.
 * Keeps original props interface (selected / onChange) intact.
 * ─────────────────────────────────────────────────────────
 */

const CATEGORIES = [
  { id: '',               label: 'All',          emoji: '⚽' },
  { id: 'breaking',       label: 'Breaking',     emoji: '🔴' },
  { id: 'transfers',      label: 'Transfers',    emoji: '🔁' },
  { id: 'analysis',       label: 'Analysis',     emoji: '📊' },
  { id: 'gist',           label: 'Gist',         emoji: '🔥' },
  { id: 'investigations', label: 'Investigate',  emoji: '🔍' },
  { id: 'history',        label: 'History',      emoji: '📜' },
  { id: 'players',        label: 'Players',      emoji: '⭐' },
]

export default function CategoryFilter({
  selected,
  onChange,
}: {
  selected: string
  onChange: (category: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '28px',
      }}
    >
      {CATEGORIES.map(cat => {
        const active = selected === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 14px',
              borderRadius: '4px',
              border: active ? '1px solid var(--green-spark)' : '1px solid var(--pitch-border)',
              background: active ? 'var(--green-glow)' : 'var(--pitch-surface)',
              color: active ? 'var(--green-spark)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
            onMouseEnter={e => {
              if (!active) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--green-spark)'
                el.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--pitch-border)'
                el.style.color = 'var(--text-secondary)'
              }
            }}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
