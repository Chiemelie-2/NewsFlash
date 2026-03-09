'use client'

/**
 * components/Header.tsx
 * ─────────────────────────────────────────────────────────
 * Football platform sticky header with:
 *  ✅ NewsFlash Football brand
 *  ✅ Full section navigation (Home, Live Scores, Transfers, Match Reports,
 *      Football Gist, Investigations, History, Players)
 *  ✅ Dark / light mode toggle (same logic as original)
 *  ✅ Breaking news ticker tape
 *  ✅ Mobile hamburger menu
 *  ✅ Responsive at all breakpoints
 * ─────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Menu, X, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { href: '/',               label: 'Home' },
  { href: '/live-scores',    label: '⚡ Live' },
  { href: '/transfers',      label: 'Transfers' },
  { href: '/match-reports',  label: 'Match Reports' },
  { href: '/gist',           label: 'Football Gist' },
  { href: '/investigations', label: 'Investigations' },
  { href: '/history',        label: 'History' },
  { href: '/players',        label: 'Players' },
]

const TICKER_ITEMS = [
  '⚽ LIVE: Arsenal vs Chelsea — 67\' — 2:1',
  '🔴 BREAKING: Major transfer confirmed — details soon',
  '⚡ Real Madrid extend Bellingham contract to 2030',
  '🟡 VAR controversy: Man City penalty overturned',
  '📊 Haaland hits 50 Premier League goals — fastest ever',
]

export default function Header() {
  const [darkMode, setDarkMode]   = useState(true)   // default dark — football aesthetic
  const [menuOpen, setMenuOpen]   = useState(false)
  const pathname = usePathname()

  // ── Sync dark mode with document class (same logic as original) ──
  useEffect(() => {
    const isDark = !document.documentElement.classList.contains('light')
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('light')) {
      document.documentElement.classList.remove('light')
      setDarkMode(true)
    } else {
      document.documentElement.classList.add('light')
      setDarkMode(false)
    }
  }

  return (
    <>
      {/* ── Breaking news ticker ────────────────────────────────── */}
      <div
        style={{
          background: 'var(--red-card)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            background: '#c0392b',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'white',
            zIndex: 1,
          }}
        >
          BREAKING
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <span
            className="animate-ticker"
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              color: 'white',
            }}
          >
            {TICKER_ITEMS.join('   ·   ')}
          </span>
        </div>
      </div>

      {/* ── Main header ─────────────────────────────────────────── */}
      <header
        style={{
          background: 'var(--pitch-dark)',
          borderBottom: '1px solid var(--pitch-border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 16px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* ── Brand ──────────────────────────────────────────── */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'var(--green-spark)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={18} color="#0a0a0a" fill="#0a0a0a" />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              News<span style={{ color: 'var(--green-spark)' }}>Flash</span>
            </span>
          </Link>

          {/* ── Desktop nav ────────────────────────────────────── */}
          <nav
            className="hide-mobile"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}
          >
            {NAV_LINKS.map(link => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    fontWeight: active ? 700 : 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: active ? 'var(--green-spark)' : 'var(--text-secondary)',
                    background: active ? 'var(--green-glow)' : 'transparent',
                    borderBottom: active ? '2px solid var(--green-spark)' : '2px solid transparent',
                    transition: 'color 0.15s, background 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* ── Right controls ─────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Dark mode toggle — same logic as original Header */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                border: '1px solid var(--pitch-border)',
                background: 'var(--pitch-surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Admin link */}
            <Link
              href="/admin"
              className="hide-mobile"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid var(--pitch-border)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              Admin
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="hide-desktop hide-tablet"
              onClick={() => setMenuOpen(v => !v)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                border: '1px solid var(--pitch-border)',
                background: 'var(--pitch-surface)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown menu ─────────────────────────────── */}
        {menuOpen && (
          <nav
            style={{
              background: 'var(--pitch-mid)',
              borderTop: '1px solid var(--pitch-border)',
              padding: '8px 0',
            }}
          >
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 20px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: pathname === link.href ? 'var(--green-spark)' : 'var(--text-secondary)',
                  borderLeft: pathname === link.href ? '3px solid var(--green-spark)' : '3px solid transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                color: 'var(--text-muted)',
                borderLeft: '3px solid transparent',
              }}
            >
              Admin
            </Link>
          </nav>
        )}
      </header>
    </>
  )
}
