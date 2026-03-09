'use client'

/**
 * app/players/page.tsx
 * ─────────────────────────────────────────────────────────
 * Players hub — two features in one:
 *
 *  1. PLAYER COMPARISON TOOL
 *     Compare any two players side-by-side:
 *     goals, assists, appearances, trophies, rating
 *
 *  2. PLAYER STORIES
 *     Articles from Supabase tagged 'players' section
 *
 * Stat data: wire up to API-Football /players endpoint.
 * Placeholder data shown until connected.
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import ArticleCard from '@/components/ArticleCard'
import { getArticlesBySection, Article } from '@/lib/supabase'
import { TrendingUp, Award, Target, Users } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
interface PlayerStats {
  id: string
  name: string
  nation: string
  club: string
  league: string
  position: string
  age: number
  goals: number
  assists: number
  appearances: number
  trophies: number
  rating: number
  image: string   // placeholder emoji / URL
}

// ── Placeholder player data ────────────────────────────────────────
const PLAYERS: PlayerStats[] = [
  { id: 'messi',      name: 'Lionel Messi',     nation: '🇦🇷', club: 'Inter Miami',   league: 'MLS',      position: 'Forward',  age: 36, goals: 838, assists: 385, appearances: 1075, trophies: 44, rating: 9.4, image: '🐐' },
  { id: 'ronaldo',    name: 'Cristiano Ronaldo', nation: '🇵🇹', club: 'Al Nassr',      league: 'Saudi PL', position: 'Forward',  age: 39, goals: 905, assists: 245, appearances: 1165, trophies: 35, rating: 9.2, image: '⚡' },
  { id: 'haaland',    name: 'Erling Haaland',   nation: '🇳🇴', club: 'Man City',      league: 'PL',       position: 'Striker',  age: 23, goals: 184, assists: 56,  appearances: 221,  trophies: 8,  rating: 9.0, image: '🔵' },
  { id: 'mbappe',     name: 'Kylian Mbappé',    nation: '🇫🇷', club: 'Real Madrid',   league: 'La Liga',  position: 'Forward',  age: 25, goals: 361, assists: 177, appearances: 484,  trophies: 16, rating: 9.1, image: '⚡' },
  { id: 'bellingham', name: 'Jude Bellingham',  nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Real Madrid',   league: 'La Liga',  position: 'Midfield', age: 20, goals: 53,  assists: 42,  appearances: 182,  trophies: 5,  rating: 8.8, image: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'salah',      name: 'Mohamed Salah',    nation: '🇪🇬', club: 'Liverpool',     league: 'PL',       position: 'Forward',  age: 31, goals: 220, assists: 103, appearances: 355,  trophies: 8,  rating: 8.9, image: '🔴' },
  { id: 'pedri',      name: 'Pedri',            nation: '🇪🇸', club: 'Barcelona',     league: 'La Liga',  position: 'Midfield', age: 21, goals: 28,  assists: 40,  appearances: 163,  trophies: 4,  rating: 8.7, image: '🔵' },
  { id: 'vinicius',   name: 'Vinicius Jr',      nation: '🇧🇷', club: 'Real Madrid',   league: 'La Liga',  position: 'Forward',  age: 23, goals: 104, assists: 85,  appearances: 271,  trophies: 8,  rating: 8.9, image: '⚪' },
]

// ── Stat bar ───────────────────────────────────────────────────────
function StatBar({
  label, a, b, max, icon,
}: { label: string; a: number; b: number; max: number; icon: React.ReactNode }) {
  const aW = Math.round((a / max) * 100)
  const bW = Math.round((b / max) * 100)
  const aWins = a >= b

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
        <span style={{
          fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:900,
          color: aWins ? 'var(--green-spark)' : 'var(--text-primary)',
        }}>{a.toLocaleString()}</span>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          {icon}
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)' }}>{label}</span>
        </div>
        <span style={{
          fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:900,
          color: !aWins ? 'var(--green-spark)' : 'var(--text-primary)',
        }}>{b.toLocaleString()}</span>
      </div>
      <div style={{ height:'6px', background:'var(--pitch-border)', borderRadius:'3px', overflow:'hidden', display:'flex' }}>
        <div style={{ flex: aW, background:'var(--green-spark)', transition:'flex 0.8s ease' }} />
        <div style={{ flex: 100-aW-bW, background:'var(--pitch-surface)' }} />
        <div style={{ flex: bW, background:'var(--sky-live)', transition:'flex 0.8s ease' }} />
      </div>
    </div>
  )
}

// ── Player selector ────────────────────────────────────────────────
function PlayerSelector({ selected, onSelect, side }: { selected: PlayerStats; onSelect: (p: PlayerStats) => void; side: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const color = side === 'left' ? 'var(--green-spark)' : 'var(--sky-live)'

  return (
    <div style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:'100%', background:'var(--pitch-surface)', border:`1px solid ${color}`,
          borderRadius:'8px', padding:'16px', cursor:'pointer', textAlign:'left',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'32px' }}>{selected.image}</span>
          <div>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:900, textTransform:'uppercase', letterSpacing:'-0.01em', color:'var(--text-primary)', lineHeight:1 }}>
              {selected.name}
            </p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.06em', marginTop:'3px' }}>
              {selected.nation} {selected.club} · {selected.position}
            </p>
          </div>
        </div>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:30,
          background:'var(--pitch-mid)', border:'1px solid var(--pitch-border)',
          borderRadius:'8px', overflow:'hidden', boxShadow:'0 16px 40px rgba(0,0,0,0.6)',
        }}>
          {PLAYERS.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setOpen(false) }}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:'10px',
                padding:'10px 14px', background:'none', border:'none', cursor:'pointer',
                borderBottom:'1px solid var(--pitch-border)',
                transition:'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--pitch-surface)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
            >
              <span style={{ fontSize:'20px' }}>{p.image}</span>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'14px', fontWeight:800, textTransform:'uppercase', color:'var(--text-primary)' }}>{p.name}</p>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.06em' }}>{p.nation} {p.club}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default function PlayersPage() {
  const [playerA, setPlayerA] = useState<PlayerStats>(PLAYERS[0])
  const [playerB, setPlayerB] = useState<PlayerStats>(PLAYERS[1])
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    getArticlesBySection('players', 6).then(setArticles)
  }, [])

  const maxGoals       = Math.max(playerA.goals,       playerB.goals)
  const maxAssists     = Math.max(playerA.assists,      playerB.assists)
  const maxApps        = Math.max(playerA.appearances,  playerB.appearances)
  const maxTrophies    = Math.max(playerA.trophies,     playerB.trophies)

  const aScore = [playerA.goals > playerB.goals, playerA.assists > playerB.assists, playerA.appearances > playerB.appearances, playerA.trophies > playerB.trophies, playerA.rating > playerB.rating].filter(Boolean).length
  const bScore = 5 - aScore
  const winner = aScore > bScore ? playerA : bScore > aScore ? playerB : null

  return (
    <main style={{ minHeight:'100vh', background:'var(--pitch-black)' }}>
      <Header />

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom:'28px' }}>
          <span className="section-label" style={{ display:'block', marginBottom:'8px' }}>Player Hub</span>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,5vw,52px)', fontWeight:900, letterSpacing:'-0.02em', textTransform:'uppercase', color:'var(--text-primary)', lineHeight:1 }}>
            Player <span style={{ color:'var(--green-spark)' }}>Comparison</span>
          </h1>
        </div>

        {/* Player selectors */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'16px', alignItems:'center', marginBottom:'28px' }}>
          <PlayerSelector selected={playerA} onSelect={setPlayerA} side="left" />
          <div style={{
            fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:900,
            color:'var(--text-muted)', textAlign:'center',
          }}>VS</div>
          <PlayerSelector selected={playerB} onSelect={setPlayerB} side="right" />
        </div>

        {/* Winner banner */}
        {winner && (
          <div style={{
            background:'var(--green-glow)', border:'1px solid rgba(0,255,135,0.3)',
            borderRadius:'6px', padding:'12px 20px', marginBottom:'24px',
            display:'flex', alignItems:'center', gap:'10px',
          }}>
            <Award size={18} style={{ color:'var(--green-spark)', flexShrink:0 }} />
            <p style={{ fontFamily:'var(--font-display)', fontSize:'16px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.04em', color:'var(--green-spark)' }}>
              {winner.name} wins — {aScore > bScore ? aScore : bScore}/5 categories
            </p>
          </div>
        )}

        {/* Stat comparison */}
        <div style={{
          background:'var(--pitch-mid)', border:'1px solid var(--pitch-border)',
          borderRadius:'10px', padding:'24px', marginBottom:'40px',
        }}>
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'16px', marginBottom:'24px' }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'14px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em', color:'var(--green-spark)', textAlign:'center' }}>
              {playerA.name.split(' ').pop()}
            </p>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', textAlign:'center', minWidth:'80px' }}>
              STAT
            </p>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'14px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.04em', color:'var(--sky-live)', textAlign:'center' }}>
              {playerB.name.split(' ').pop()}
            </p>
          </div>

          <StatBar label="Goals"       a={playerA.goals}       b={playerB.goals}       max={maxGoals}    icon={<Target size={12} style={{ color:'var(--text-muted)' }} />} />
          <StatBar label="Assists"     a={playerA.assists}     b={playerB.assists}     max={maxAssists}  icon={<TrendingUp size={12} style={{ color:'var(--text-muted)' }} />} />
          <StatBar label="Appearances" a={playerA.appearances} b={playerB.appearances} max={maxApps}     icon={<Users size={12} style={{ color:'var(--text-muted)' }} />} />
          <StatBar label="Trophies"    a={playerA.trophies}    b={playerB.trophies}    max={maxTrophies} icon={<Award size={12} style={{ color:'var(--text-muted)' }} />} />

          {/* Rating */}
          <div style={{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid var(--pitch-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ textAlign:'center', flex:1 }}>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'32px', fontWeight:900, color: playerA.rating >= playerB.rating ? 'var(--green-spark)' : 'var(--text-primary)' }}>
                {playerA.rating}
              </p>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.08em' }}>RATING</p>
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', textAlign:'center', padding:'0 16px' }}>
              Overall<br />Rating
            </div>
            <div style={{ textAlign:'center', flex:1 }}>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'32px', fontWeight:900, color: playerB.rating >= playerA.rating ? 'var(--sky-live)' : 'var(--text-primary)' }}>
                {playerB.rating}
              </p>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.08em' }}>RATING</p>
            </div>
          </div>
        </div>

        {/* Player Stories articles */}
        {articles.length > 0 && (
          <>
            <div style={{ marginBottom:'20px' }}>
              <span className="section-label">Player Stories</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px' }}>
              {articles.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
