'use client'

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'Technology', label: '💻 Technology' },
  { id: 'Business', label: '💼 Business' },
  { id: 'Entertainment', label: '🎬 Entertainment' },
  { id: 'Sports', label: '⚽ Sports' },
  { id: 'Science', label: '🧬 Science' },
]

export default function CategoryFilter({
  selected,
  onChange,
}: {
  selected: string
  onChange: (category: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-4 py-2 rounded-full font-medium transition ${
            selected === cat.id
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
