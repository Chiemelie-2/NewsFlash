'use client'

/**
 * components/DidYouKnow.tsx
 * ─────────────────────────────────────────────────────────
 * "Did You Know?" Football Facts viral widget.
 *
 * Features:
 *  ✅ Random football fact card
 *  ✅ Share button (Web Share API + clipboard fallback)
 *  ✅ Auto-cycles every 12s
 *  ✅ Manual next / prev navigation
 *  ✅ Optimized for social media sharing
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react'
import { Share2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

const FACTS = [
  { id: 1,  emoji: '🐐', fact: 'Lionel Messi scored 91 goals in a single calendar year — 2012.', category: 'Records' },
  { id: 2,  emoji: '⚡', fact: 'Cristiano Ronaldo is the only player to win the Champions League with three different English-style clubs.', category: 'UCL' },
  { id: 3,  emoji: '🏟️', fact: 'The first-ever FIFA World Cup was held in Uruguay in 1930. Uruguay won it.', category: 'History' },
  { id: 4,  emoji: '🔢', fact: 'The most goals scored in a single World Cup game was 12 — Austria 7–5 Switzerland in 1954.', category: 'Records' },
  { id: 5,  emoji: '⚽', fact: 'Pelé scored over 1,000 career goals — a feat no other professional footballer has officially achieved.', category: 'Legends' },
  { id: 6,  emoji: '🇩🇪', fact: 'Germany and Brazil have appeared in the most World Cup finals combined.', category: 'World Cup' },
  { id: 7,  emoji: '🏆', fact: 'Real Madrid have won the UEFA Champions League a record 14 times.', category: 'UCL' },
  { id: 8,  emoji: '🔵', fact: 'Erling Haaland reached 50 Premier League goals faster than any player in history.', category: 'PL Records' },
  { id: 9,  emoji: '🎯', fact: 'The fastest goal in Premier League history was scored in 7.69 seconds by Shane Long in 2019.', category: 'PL Records' },
  { id: 10, emoji: '💰', fact: 'Neymar\'s transfer from Barcelona to PSG in 2017 (€222m) remains the most expensive transfer ever.', category: 'Transfers' },
  { id: 11, emoji: '🤝', fact: 'The first football shirt numbers were introduced in 1928 during a game between Arsenal and Chelsea.', category: 'History' },
  { id: 12, emoji: '🌍', fact: 'Over 265 million people worldwide play football — making it the world\'s most popular sport.', category: 'Facts' },
]

export default function DidYouKnow() {
  const [index, setIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const fact = FACTS[index]

  // ── Auto-cycle every 12 seconds ──────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % FACTS.length)
    }, 12_000)
    return () => clearInterval(timer)
  }, [])

  const prev = useCallback(() => setIndex(i => (i - 1 + FACTS.length) % FACTS.length), [])
  const next = useCallback(() => setIndex(i => (i + 1) % FACTS.length), [])

  // ── Share ─────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const text = `⚽ Did You Know? ${fact.fact} — via NewsFlash Football`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [fact])

  return (
    <div style={{
      background: 'var(--pitch-mid)',
      border: '1px solid var(--pitch-border)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      {/* Header strip */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--green-glow)',
        borderBottom: '1px solid rgba(0,255,135,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--green-spark)' }}>
          ⚽ Did You Know?
        </span>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700,
          letterSpacing:'0.1em', textTransform:'uppercase',
          padding:'2px 8px', borderRadius:'2px',
          background:'rgba(0,255,135,0.15)', color:'var(--green-spark)',
          border:'1px solid rgba(0,255,135,0.2)',
        }}>
          {fact.category}
        </span>
      </div>

      {/* Fact content */}
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize:'36px', marginBottom:'12px', textAlign:'center' }}>
          {fact.emoji}
        </div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          textAlign: 'center',
          fontStyle: 'italic',
        }}>
          "{fact.fact}"
        </p>
      </div>

      {/* Controls */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--pitch-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Prev / next */}
        <div style={{ display:'flex', gap:'6px' }}>
          <button onClick={prev} style={{
            width:'30px', height:'30px', borderRadius:'4px',
            border:'1px solid var(--pitch-border)', background:'var(--pitch-surface)',
            color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          }}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={next} style={{
            width:'30px', height:'30px', borderRadius:'4px',
            border:'1px solid var(--pitch-border)', background:'var(--pitch-surface)',
            color:'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Counter */}
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.06em' }}>
          {index + 1} / {FACTS.length}
        </span>

        {/* Share button */}
        <button
          onClick={handleShare}
          style={{
            display:'inline-flex', alignItems:'center', gap:'6px',
            fontFamily:'var(--font-mono)', fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
            background: copied ? 'var(--green-glow)' : 'var(--pitch-surface)',
            border: `1px solid ${copied ? 'rgba(0,255,135,0.4)' : 'var(--pitch-border)'}`,
            color: copied ? 'var(--green-spark)' : 'var(--text-secondary)',
            padding:'6px 12px', borderRadius:'4px', cursor:'pointer',
            transition:'all 0.15s',
          }}
        >
          <Share2 size={11} />
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Progress bar — auto-advances */}
      <div style={{ height:'2px', background:'var(--pitch-border)' }}>
        <div
          key={index}
          style={{
            height:'100%', background:'var(--green-spark)',
            animation:'progress-fill 12s linear forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes progress-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
