'use client'

import Link from 'next/link'
import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark')
      setDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      setDarkMode(true)
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
          📰 NewsApp
        </Link>

        <nav className="hidden md:flex gap-6">
          <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
            Home
          </Link>
          <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
            Admin
          </Link>
        </nav>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
