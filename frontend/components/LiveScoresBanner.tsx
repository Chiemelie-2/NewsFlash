'use client'

/**
 * components/LiveScoresBanner.tsx
 * ─────────────────────────────────────────────────────────
 * Horizontal scrollable live scores strip for the homepage.
 * Data comes from /api/scores (or a direct football API).
 * Falls back to placeholder UI while loading.
 *
 * Supported leagues: EPL, La Liga, Bundesliga, Serie A, UCL
 * API: football-data.org (free tier) or API-Football
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'

interface MatchScore {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  status: 'LIVE' | 'FT' | 'HT' | 'NS' | string
  minute?: number
  competition: string
  kickoff?: string
}

// ── Placeholder matches shown before real data loads ──────────────
const PLACEHOLDER_MATCHES: MatchScore[] = [
  { id: '1', homeTeam: 'Arsenal',   awayTeam: 'Chelsea',    homeScore: 2, awayScore: 1, status: 'LIVE', minute: 67, competition: 'EPL' },
  { id: '2', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeScore: 1, awayScore: 1, status: 'HT',  competition: 'La Liga' },
  { id: '3', homeTeam: 'Bayern',    awayTeam: 'Dortmund',    homeScore: null, awayScore: null, status: 'NS', kickoff: '20:45', competition: 'Bundesliga' },
  { id: '4', homeTeam: 'Juventus',  awayTeam: 'Inter',       homeScore: 0, awayScore: 2, status: 'FT',  competition: 'Serie A' },
  { id: '5', homeTeam: 'Liverpool', awayTeam: 'PSG',         homeScore: 3, awayScore: 1, status: 'FT',  competition: 'UCL' },
]

function StatusBadge({ status, minute }: { status: string; minute?: number }) {
  if (status === 'LIVE') {
    return (
      <span className="badge-live">
        {minute ? `${minute}'` : 'LIVE'}
      </span>
    )
  }
  if (status === 'HT') {
    return (
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
        letterSpacing: '0.1em', padding: '2px 6px', borderRadius: '2px',
        background: 'var(--amber-boost)', color: '#000',
      }}>HT</span>
    )
  }
  if (status === 'FT') {
    return (
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
        letterSpacing: '0.1em', color: 'var(--text-muted)',
      }}>FT</span>
    )
  }
  // Not started — show kickoff time
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
      color: 'var(--text-muted)', letterSpacing: '0.04em',
    }}>
      {status === 'NS' ? '' : status}
    </span>
  )
}

function MatchCard({ match }: { match: MatchScore }) {
  const isLive = match.status === 'LIVE'
  const hasScore = match.homeScore !== null && match.awayScore !== null

  return (
    <div
      style={{
        flexShrink: 0,
        background: isLive ? 'rgba(0,255,135,0.05)' : 'var(--pitch-surface)',
        border: `1px solid ${isLive ? 'rgba(0,255,135,0.3)' : 'var(--pitch-border)'}`,
        borderRadius: '6px',
        padding: '10px 14px',
        minWidth: '160px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {/* Competition + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
          color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {match.competition}
        </span>
        <StatusBadge status={match.status} minute={match.minute} />
      </div>

      {/* Teams + scores */}
      {[
        { team: match.homeTeam, score: match.homeScore },
        { team: match.awayTeam, score: match.awayScore },
      ].map(({ team, score }) => (
        <div key={team} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700,
            letterSpacing: '0.02em', textTransform: 'uppercase',
            color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {team}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700,
            color: isLive ? 'var(--green-spark)' : 'var(--text-primary)',
            minWidth: '16px', textAlign: 'right',
          }}>
            {hasScore ? score : (match.kickoff || '–')}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function LiveScoresBanner() {
  const [matches, setMatches] = useState<MatchScore[]>(PLACEHOLDER_MATCHES)
  const [loading, setLoading] = useState(false)

  // ── Fetch live scores from /api/scores (connect your football API there) ──
  useEffect(() => {
    // Uncomment and wire up when API is ready:
    // setLoading(true)
    // fetch('/api/scores')
    //   .then(r => r.json())
    //   .then(data => { setMatches(data); setLoading(false) })
    //   .catch(() => setLoading(false))
  }, [])

  return (
    <div
      style={{
        background: 'var(--pitch-dark)',
        borderBottom: '1px solid var(--pitch-border)',
        padding: '12px 0',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
        {/* Label row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span className="section-label">Live Scores</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}>
            EPL · La Liga · Bundesliga · Serie A · UCL
          </span>
        </div>

        {/* Scrollable match strip */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{
                  flexShrink: 0, minWidth: '160px', height: '80px', borderRadius: '6px',
                  background: 'var(--pitch-surface)',
                  animation: 'shimmer 1.5s infinite',
                  backgroundSize: '200% 100%',
                }} />
              ))
            : matches.map(m => <MatchCard key={m.id} match={m} />)
          }
        </div>
      </div>
    </div>
  )
}
