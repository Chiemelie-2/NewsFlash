'use client'

/**
 * components/FanPolls.tsx
 * ─────────────────────────────────────────────────────────
 * Interactive fan polls widget.
 *
 * Features:
 *  ✅ Vote on football questions
 *  ✅ Live result bars update after vote
 *  ✅ User vote persisted in localStorage (one vote per poll)
 *  ✅ Vote counts stored in Supabase 'polls' table
 *  ✅ Multiple polls displayed in carousel
 *
 * Supabase table: polls
 *   id, question, options (jsonb), votes (jsonb), created_at
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
interface PollOption {
  id: string
  label: string
  emoji?: string
}

interface Poll {
  id: string
  question: string
  options: PollOption[]
  votes: Record<string, number>   // optionId → vote count
}

// ── Placeholder polls (replaced by Supabase data when available) ──
const DEFAULT_POLLS: Poll[] = [
  {
    id: 'poll-1',
    question: 'Who will win the Premier League?',
    options: [
      { id: 'a', label: 'Manchester City', emoji: '🔵' },
      { id: 'b', label: 'Arsenal',         emoji: '🔴' },
      { id: 'c', label: 'Liverpool',       emoji: '🔴⚪' },
      { id: 'd', label: 'Chelsea',         emoji: '🔵⚪' },
    ],
    votes: { a: 1240, b: 980, c: 860, d: 420 },
  },
  {
    id: 'poll-2',
    question: 'Who is the best player in the world right now?',
    options: [
      { id: 'a', label: 'Erling Haaland',  emoji: '🇳🇴' },
      { id: 'b', label: 'Kylian Mbappé',   emoji: '🇫🇷' },
      { id: 'c', label: 'Jude Bellingham', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { id: 'd', label: 'Vinicius Jr',     emoji: '🇧🇷' },
    ],
    votes: { a: 2100, b: 1800, c: 1400, d: 1200 },
  },
  {
    id: 'poll-3',
    question: 'Who will win the Champions League?',
    options: [
      { id: 'a', label: 'Real Madrid',  emoji: '⚪' },
      { id: 'b', label: 'Man City',     emoji: '🔵' },
      { id: 'c', label: 'Barcelona',    emoji: '🔵🔴' },
      { id: 'd', label: 'Liverpool',    emoji: '🔴' },
    ],
    votes: { a: 1600, b: 1400, c: 900, d: 800 },
  },
]

// ── Single poll component ──────────────────────────────────────────
function PollCard({ poll }: { poll: Poll }) {
  const storageKey = `nf_poll_${poll.id}`
  const [voted, setVoted]       = useState<string | null>(null)
  const [votes, setVotes]       = useState(poll.votes)
  const [submitting, setSubmitting] = useState(false)

  // ── Load previous vote from localStorage ──────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) setVoted(saved)
  }, [storageKey])

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0)

  // ── Cast vote ─────────────────────────────────────────────────
  async function castVote(optionId: string) {
    if (voted || submitting) return
    setSubmitting(true)

    // Optimistic update
    setVotes(prev => ({ ...prev, [optionId]: (prev[optionId] || 0) + 1 }))
    setVoted(optionId)
    localStorage.setItem(storageKey, optionId)

    // Persist to Supabase (best-effort — table may not exist yet)
    try {
      const { data } = await supabase.from('polls').select('votes').eq('id', poll.id).single()
      if (data) {
        const updated = { ...data.votes, [optionId]: (data.votes[optionId] || 0) + 1 }
        await supabase.from('polls').update({ votes: updated }).eq('id', poll.id)
      }
    } catch {
      // Supabase polls table not yet set up — vote is still tracked locally
    }
    setSubmitting(false)
  }

  return (
    <div style={{
      background: 'var(--pitch-mid)',
      border: '1px solid var(--pitch-border)',
      borderRadius: '10px',
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Question */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', marginBottom:'16px' }}>
        <TrendingUp size={16} style={{ color:'var(--green-spark)', flexShrink:0, marginTop:'3px' }} />
        <p style={{ fontFamily:'var(--font-display)', fontSize:'17px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.02em', color:'var(--text-primary)', lineHeight:1.15 }}>
          {poll.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display:'flex', flexDirection:'column', gap:'8px', flex:1 }}>
        {poll.options.map(opt => {
          const optVotes = votes[opt.id] || 0
          const pct      = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0
          const isVoted  = voted === opt.id
          const hasVoted = !!voted

          return (
            <button
              key={opt.id}
              onClick={() => castVote(opt.id)}
              disabled={hasVoted}
              style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                padding: '10px 12px',
                background: isVoted ? 'var(--green-glow)' : 'var(--pitch-surface)',
                border: `1px solid ${isVoted ? 'rgba(0,255,135,0.4)' : 'var(--pitch-border)'}`,
                borderRadius: '6px',
                cursor: hasVoted ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Result fill bar (shown after voting) */}
              {hasVoted && (
                <div style={{
                  position:'absolute', inset:0, left:0, top:0,
                  width:`${pct}%`, background: isVoted ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.03)',
                  transition:'width 0.8s ease', pointerEvents:'none',
                }} />
              )}

              <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  {opt.emoji && <span style={{ fontSize:'16px' }}>{opt.emoji}</span>}
                  <span style={{
                    fontFamily:'var(--font-display)', fontSize:'14px', fontWeight:700,
                    textTransform:'uppercase', letterSpacing:'0.03em',
                    color: isVoted ? 'var(--green-spark)' : 'var(--text-primary)',
                  }}>
                    {opt.label}
                  </span>
                </div>
                {hasVoted && (
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'12px', fontWeight:700, color: isVoted ? 'var(--green-spark)' : 'var(--text-muted)', letterSpacing:'0.06em', flexShrink:0 }}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Vote count */}
      <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.06em', marginTop:'12px', textAlign:'right' }}>
        {totalVotes.toLocaleString()} votes
        {!voted && <span style={{ color:'var(--green-spark)' }}> · Tap to vote</span>}
      </p>
    </div>
  )
}

// ── Exported polls widget (used on homepage) ──────────────────────
export default function FanPolls({ polls = DEFAULT_POLLS }: { polls?: Poll[] }) {
  const [index, setIndex] = useState(0)

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <span className="section-label">Fan Polls</span>
        <div style={{ display:'flex', gap:'6px' }}>
          <button
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            style={{
              width:'30px', height:'30px', borderRadius:'4px',
              border:'1px solid var(--pitch-border)', background:'var(--pitch-surface)',
              color: index === 0 ? 'var(--pitch-border)' : 'var(--text-secondary)',
              display:'flex', alignItems:'center', justifyContent:'center', cursor: index === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setIndex(i => Math.min(polls.length - 1, i + 1))}
            disabled={index === polls.length - 1}
            style={{
              width:'30px', height:'30px', borderRadius:'4px',
              border:'1px solid var(--pitch-border)', background:'var(--pitch-surface)',
              color: index === polls.length - 1 ? 'var(--pitch-border)' : 'var(--text-secondary)',
              display:'flex', alignItems:'center', justifyContent:'center', cursor: index === polls.length - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <PollCard poll={polls[index]} />

      {/* Dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:'6px', marginTop:'12px' }}>
        {polls.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            style={{
              width:'6px', height:'6px', borderRadius:'50%', border:'none', cursor:'pointer', padding:0,
              background: i === index ? 'var(--green-spark)' : 'var(--pitch-border)',
              transition:'background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
