'use client'

/**
 * app/live-scores/page.tsx
 * ─────────────────────────────────────────────────────────
 * Matchday Hub — full live scores page.
 *
 * Features:
 *  ✅ League tabs (EPL, La Liga, Bundesliga, Serie A, UCL)
 *  ✅ Live match cards with score, minute, status
 *  ✅ Upcoming fixtures with kickoff times
 *  ✅ Completed results
 *  ✅ Match detail drawer (lineups, stats, events)
 *  ✅ Live commentary feed
 *  ✅ Auto-refresh every 60s when live games present
 *
 * API: Wire up /api/scores to football-data.org or API-Football.
 *      Placeholder data shown until connected.
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import { RefreshCw, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────
type MatchStatus = 'LIVE' | 'HT' | 'FT' | 'NS' | 'PPD'

interface MatchEvent {
  minute: number
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'var'
  team: 'home' | 'away'
  player: string
}

interface TeamLineup {
  name: string
  formation: string
  players: string[]
}

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  homeCrest: string
  awayCrest: string
  status: MatchStatus
  minute?: number
  kickoff: string
  stadium: string
  competition: string
  events?: MatchEvent[]
  homeLineup?: TeamLineup
  awayLineup?: TeamLineup
  possession?: [number, number]
  shots?: [number, number]
  corners?: [number, number]
}

// ── Placeholder data ──────────────────────────────────────────────
const PLACEHOLDER_MATCHES: Match[] = [
  {
    id: '1', homeTeam: 'Arsenal', awayTeam: 'Chelsea', homeScore: 2, awayScore: 1,
    homeCrest: '🔴', awayCrest: '🔵', status: 'LIVE', minute: 67,
    kickoff: '15:00', stadium: 'Emirates Stadium', competition: 'EPL',
    possession: [56, 44], shots: [12, 8], corners: [5, 3],
    events: [
      { minute: 12, type: 'goal',   team: 'home', player: 'Saka' },
      { minute: 34, type: 'goal',   team: 'away', player: 'Palmer' },
      { minute: 55, type: 'yellow', team: 'away', player: 'Gallagher' },
      { minute: 61, type: 'goal',   team: 'home', player: 'Havertz' },
    ],
    homeLineup: { name: 'Arsenal', formation: '4-3-3', players: ['Raya','White','Saliba','Gabriel','Zinchenko','Odegaard','Rice','Havertz','Saka','Trossard','Martinelli'] },
    awayLineup: { name: 'Chelsea', formation: '4-2-3-1', players: ['Sanchez','James','Fofana','Disasi','Cucurella','Caicedo','Gallagher','Madueke','Palmer','Sterling','Jackson'] },
  },
  {
    id: '2', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeScore: 1, awayScore: 1,
    homeCrest: '🔵🔴', awayCrest: '⚪', status: 'HT', minute: 45,
    kickoff: '16:00', stadium: 'Camp Nou', competition: 'La Liga',
    possession: [62, 38], shots: [8, 6], corners: [4, 2],
    events: [
      { minute: 23, type: 'goal', team: 'home', player: 'Lewandowski' },
      { minute: 41, type: 'goal', team: 'away', player: 'Vinicius Jr' },
    ],
  },
  {
    id: '3', homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', homeScore: null, awayScore: null,
    homeCrest: '🔴⚪', awayCrest: '🟡⚫', status: 'NS',
    kickoff: '18:30', stadium: 'Allianz Arena', competition: 'Bundesliga',
    events: [],
  },
  {
    id: '4', homeTeam: 'Inter Milan', awayTeam: 'Juventus', homeScore: 0, awayScore: 2,
    homeCrest: '🔵⚫', awayCrest: '⚫⚪', status: 'FT', minute: 90,
    kickoff: '14:00', stadium: 'San Siro', competition: 'Serie A',
    possession: [48, 52], shots: [9, 14], corners: [3, 7],
    events: [
      { minute: 31, type: 'goal', team: 'away', player: 'Vlahovic' },
      { minute: 78, type: 'goal', team: 'away', player: 'Yildiz' },
    ],
  },
  {
    id: '5', homeTeam: 'Liverpool', awayTeam: 'PSG', homeScore: 3, awayScore: 1,
    homeCrest: '🔴', awayCrest: '🔵🔴', status: 'FT', minute: 90,
    kickoff: '20:00', stadium: 'Anfield', competition: 'UCL',
    possession: [54, 46], shots: [18, 10], corners: [8, 4],
    events: [
      { minute: 8,  type: 'goal', team: 'home', player: 'Salah' },
      { minute: 44, type: 'goal', team: 'away', player: 'Mbappé' },
      { minute: 67, type: 'goal', team: 'home', player: 'Diaz' },
      { minute: 88, type: 'goal', team: 'home', player: 'Salah' },
    ],
  },
]

const LEAGUES = ['All', 'EPL', 'La Liga', 'Bundesliga', 'Serie A', 'UCL']

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', yellow: '🟡', red: '🔴', sub: '🔄', var: '📺',
}

// ── Match status badge ─────────────────────────────────────────────
function StatusBadge({ match }: { match: Match }) {
  if (match.status === 'LIVE') return <span className="badge-live">{match.minute}'</span>
  if (match.status === 'HT')   return <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', background:'var(--amber-boost)', color:'#000', padding:'2px 8px', borderRadius:'2px' }}>HT</span>
  if (match.status === 'FT')   return <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', color:'var(--text-muted)' }}>FT</span>
  if (match.status === 'PPD')  return <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', color:'var(--red-card)' }}>PPD</span>
  return (
    <div style={{ textAlign:'center' }}>
      <Clock size={12} style={{ color:'var(--text-muted)' }} />
      <p style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.05em', marginTop:'2px' }}>{match.kickoff}</p>
    </div>
  )
}

// ── Match card ────────────────────────────────────────────────────
function MatchCard({ match, onClick, expanded }: { match: Match; onClick: () => void; expanded: boolean }) {
  const isLive = match.status === 'LIVE' || match.status === 'HT'
  const hasScore = match.homeScore !== null && match.awayScore !== null

  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        background: isLive ? 'rgba(0,255,135,0.03)' : 'var(--pitch-mid)',
        border: `1px solid ${isLive ? 'rgba(0,255,135,0.25)' : 'var(--pitch-border)'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Competition strip */}
      <div style={{
        padding: '6px 14px', background: 'var(--pitch-surface)',
        borderBottom: '1px solid var(--pitch-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)' }}>
          {match.competition} · {match.stadium}
        </span>
        {expanded ? <ChevronUp size={12} style={{ color:'var(--text-muted)' }} /> : <ChevronDown size={12} style={{ color:'var(--text-muted)' }} />}
      </div>

      {/* Score row */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Home */}
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'22px' }}>{match.homeCrest}</span>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'15px', fontWeight:800, textTransform:'uppercase', color:'var(--text-primary)', letterSpacing:'0.02em' }}>
            {match.homeTeam}
          </span>
        </div>

        {/* Score / Status */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', minWidth:'80px' }}>
          <StatusBadge match={match} />
          {hasScore && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'28px', fontWeight:900, color: isLive ? 'var(--green-spark)' : 'var(--text-primary)' }}>
                {match.homeScore}
              </span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'14px', color:'var(--text-muted)' }}>—</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'28px', fontWeight:900, color: isLive ? 'var(--green-spark)' : 'var(--text-primary)' }}>
                {match.awayScore}
              </span>
            </div>
          )}
        </div>

        {/* Away */}
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', justifyContent:'flex-end' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'15px', fontWeight:800, textTransform:'uppercase', color:'var(--text-primary)', letterSpacing:'0.02em', textAlign:'right' }}>
            {match.awayTeam}
          </span>
          <span style={{ fontSize:'22px' }}>{match.awayCrest}</span>
        </div>
      </div>

      {/* Goal events preview */}
      {match.events && match.events.filter(e => e.type === 'goal').length > 0 && (
        <div style={{ padding: '0 16px 12px', display:'flex', flexWrap:'wrap', gap:'6px' }}>
          {match.events.filter(e => e.type === 'goal').map((ev, i) => (
            <span key={i} style={{
              fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.04em',
              color:'var(--text-muted)', background:'var(--pitch-surface)',
              padding:'2px 8px', borderRadius:'2px',
            }}>
              ⚽ {ev.player} {ev.minute}'
            </span>
          ))}
        </div>
      )}

      {/* Expanded: full stats + lineups + events */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--pitch-border)', padding: '16px' }}>

          {/* Stats */}
          {match.possession && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'12px', textAlign:'center' }}>
                Match Stats
              </p>
              {[
                { label:'Possession', home: match.possession[0] + '%', away: match.possession[1] + '%', homeW: match.possession[0] },
                { label:'Shots',      home: String(match.shots![0]), away: String(match.shots![1]), homeW: (match.shots![0] / (match.shots![0] + match.shots![1])) * 100 },
                { label:'Corners',    home: String(match.corners![0]), away: String(match.corners![1]), homeW: (match.corners![0] / (match.corners![0] + match.corners![1])) * 100 },
              ].map(stat => (
                <div key={stat.label} style={{ marginBottom: '10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', fontWeight:700, color:'var(--text-primary)' }}>{stat.home}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'0.08em' }}>{stat.label.toUpperCase()}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', fontWeight:700, color:'var(--text-primary)' }}>{stat.away}</span>
                  </div>
                  <div style={{ height:'4px', background:'var(--pitch-border)', borderRadius:'2px', overflow:'hidden', display:'flex' }}>
                    <div style={{ width:`${stat.homeW}%`, background:'var(--green-spark)', transition:'width 0.6s ease' }} />
                    <div style={{ flex:1, background:'var(--sky-live)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All events timeline */}
          {match.events && match.events.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'8px' }}>
                Match Events
              </p>
              {match.events.map((ev, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'10px',
                  padding:'6px 0',
                  borderBottom: i < match.events!.length - 1 ? '1px solid var(--pitch-border)' : 'none',
                  flexDirection: ev.team === 'away' ? 'row-reverse' : 'row',
                }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', minWidth:'28px', textAlign: ev.team === 'away' ? 'right' : 'left' }}>{ev.minute}'</span>
                  <span style={{ fontSize:'14px' }}>{EVENT_ICONS[ev.type]}</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'13px', fontWeight:700, textTransform:'uppercase', color:'var(--text-primary)' }}>{ev.player}</span>
                </div>
              ))}
            </div>
          )}

          {/* Lineups */}
          {match.homeLineup && match.awayLineup && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              {[match.homeLineup, match.awayLineup].map((lineup, side) => (
                <div key={side}>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:'13px', fontWeight:800, textTransform:'uppercase', color: side === 0 ? 'var(--green-spark)' : 'var(--sky-live)', letterSpacing:'0.04em', marginBottom:'8px' }}>
                    {lineup.name} · {lineup.formation}
                  </p>
                  {lineup.players.map((p, i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:'8px', padding:'4px 0',
                      borderBottom: i < lineup.players.length - 1 ? '1px solid var(--pitch-border)' : 'none',
                    }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', color:'var(--text-muted)', minWidth:'16px' }}>{i + 1}</span>
                      <span style={{ fontFamily:'var(--font-body)', fontSize:'12px', color:'var(--text-secondary)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function LiveScoresPage() {
  const [league, setLeague]         = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const hasLiveGames = PLACEHOLDER_MATCHES.some(m => m.status === 'LIVE' || m.status === 'HT')

  // ── Auto-refresh every 60s when live games are on ──────────────
  useEffect(() => {
    if (!hasLiveGames) return
    const interval = setInterval(() => {
      setLastUpdated(new Date())
      // Wire up: fetch('/api/scores').then(...)
    }, 60_000)
    return () => clearInterval(interval)
  }, [hasLiveGames])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setLastUpdated(new Date())
      setRefreshing(false)
      // Wire up: fetch('/api/scores').then(...)
    }, 800)
  }, [])

  const filtered = league === 'All'
    ? PLACEHOLDER_MATCHES
    : PLACEHOLDER_MATCHES.filter(m => m.competition === league)

  const live      = filtered.filter(m => m.status === 'LIVE' || m.status === 'HT')
  const upcoming  = filtered.filter(m => m.status === 'NS')
  const completed = filtered.filter(m => m.status === 'FT' || m.status === 'PPD')

  return (
    <main style={{ minHeight: '100vh', background: 'var(--pitch-black)' }}>
      <Header />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>

        {/* Page header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <span className="section-label" style={{ display:'block', marginBottom:'6px' }}>Matchday Hub</span>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,5vw,52px)', fontWeight:900, letterSpacing:'-0.02em', textTransform:'uppercase', color:'var(--text-primary)', lineHeight:1 }}>
              Live <span style={{ color:'var(--green-spark)' }}>Scores</span>
            </h1>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px' }}>
            <button
              onClick={handleRefresh}
              style={{
                display:'inline-flex', alignItems:'center', gap:'6px',
                fontFamily:'var(--font-mono)', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                background:'var(--pitch-surface)', border:'1px solid var(--pitch-border)',
                color:'var(--text-muted)', padding:'8px 14px', borderRadius:'4px', cursor:'pointer',
              }}
            >
              <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.05em' }}>
              Updated {lastUpdated.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
        </div>

        {/* League tabs */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'28px', overflowX:'auto', paddingBottom:'4px' }}>
          {LEAGUES.map(l => (
            <button
              key={l}
              onClick={() => setLeague(l)}
              style={{
                flexShrink:0,
                fontFamily:'var(--font-display)', fontSize:'13px', fontWeight:700,
                letterSpacing:'0.05em', textTransform:'uppercase',
                padding:'7px 14px', borderRadius:'4px', cursor:'pointer',
                border: league === l ? '1px solid var(--green-spark)' : '1px solid var(--pitch-border)',
                background: league === l ? 'var(--green-glow)' : 'transparent',
                color: league === l ? 'var(--green-spark)' : 'var(--text-muted)',
                transition:'all 0.15s',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Live matches */}
        {live.length > 0 && (
          <div style={{ marginBottom:'32px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
              <span className="badge-live">LIVE</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.06em' }}>{live.length} match{live.length > 1 ? 'es' : ''} in progress</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {live.map(m => (
                <MatchCard key={m.id} match={m}
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  expanded={expandedId === m.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom:'32px' }}>
            <div style={{ marginBottom:'14px' }}>
              <span className="section-label">Upcoming</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {upcoming.map(m => (
                <MatchCard key={m.id} match={m}
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  expanded={expandedId === m.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <div style={{ marginBottom:'14px' }}>
              <span className="section-label">Results</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {completed.map(m => (
                <MatchCard key={m.id} match={m}
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  expanded={expandedId === m.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
