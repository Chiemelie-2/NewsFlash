'use client'

/**
 * components/LiveScoresBanner.tsx
 * ─────────────────────────────────────────────────────────
 * Horizontally scrolling live scores banner.
 * Fetches from /api/scores every 60 seconds.
 * Shows LIVE matches first, then upcoming (NS), then FT.
 */

import { useState, useEffect } from 'react'

interface Match {
  id: number
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  status: string        // 'LIVE' | 'HT' | 'FT' | 'NS' | ...
  minute: number | null
  competition: string
  competitionLogo?: string
  homeLogo?: string
  awayLogo?: string
  kickoff: string
}

// Shorten long team names for the compact banner
function shortName(name: string): string {
  const overrides: Record<string, string> = {
    'Manchester City':    'Man City',
    'Manchester United':  'Man Utd',
    'Tottenham Hotspur':  'Spurs',
    'Newcastle United':   'Newcastle',
    'Nottingham Forest':  "Nott'm Forest",
    'West Ham United':    'West Ham',
    'Wolverhampton Wanderers': 'Wolves',
    'Brighton & Hove Albion': 'Brighton',
    'Atletico Madrid':    'Atlético',
    'Real Madrid':        'Real Madrid',
    'Paris Saint Germain': 'PSG',
    'Paris Saint-Germain': 'PSG',
    'Borussia Dortmund':  'Dortmund',
    'RB Leipzig':         'Leipzig',
    'Bayer Leverkusen':   'Leverkusen',
    'Internazionale':     'Inter',
    'AC Milan':           'Milan',
    'Juventus':           'Juventus',
  }
  return overrides[name] ?? (name.length > 12 ? name.slice(0, 11) + '…' : name)
}

function StatusBadge({ status, minute }: { status: string; minute: number | null }) {
  const isLive = status === 'LIVE' || status === 'HT'

  if (status === 'LIVE') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        background: '#e60000', color: 'white',
        fontSize: '8px', fontWeight: 800, padding: '1px 5px',
        borderRadius: '4px', letterSpacing: '0.04em',
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: 'white', flexShrink: 0,
          animation: 'livePulse 1s infinite',
        }} />
        {minute ? `${minute}'` : 'LIVE'}
      </span>
    )
  }

  if (status === 'HT') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        background: '#ff7a00', color: 'white',
        fontSize: '8px', fontWeight: 800, padding: '1px 5px',
        borderRadius: '4px', letterSpacing: '0.04em',
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>
        HT
      </span>
    )
  }

  if (status === 'FT') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        background: '#555', color: 'white',
        fontSize: '8px', fontWeight: 700, padding: '1px 5px',
        borderRadius: '4px', letterSpacing: '0.04em',
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>
        FT
      </span>
    )
  }

  // NS — show kickoff time
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: '#eee', color: '#555',
      fontSize: '8px', fontWeight: 700, padding: '1px 5px',
      borderRadius: '4px', letterSpacing: '0.03em',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      NS
    </span>
  )
}

export default function LiveScoresBanner() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/scores')

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? `HTTP ${res.status}`)
        }

        const data: Match[] = await res.json()
        setMatches(data)
      } catch (err: any) {
        console.error('LiveScoresBanner fetch error:', err)
        setError(err?.message ?? 'Failed to load scores')
      } finally {
        setLoading(false)
      }
    }

    fetchScores()

    // Refresh every 60 seconds
    const interval = setInterval(fetchScores, 60_000)
    return () => clearInterval(interval)
  }, [])

  // ── Loading skeleton ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        background: '#111', borderBottom: '1px solid #222',
        padding: '8px 0',
        display: 'flex', gap: '10px', overflowX: 'auto',
        paddingLeft: '14px', scrollbarWidth: 'none',
      }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{
            flexShrink: 0, width: '120px', height: '52px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }} />
        ))}
        <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        background: '#111', borderBottom: '1px solid #222',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '13px' }}>⚠️</span>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '12px', color: '#888',
        }}>
          {error === 'FOOTBALL_API_KEY is not set in environment variables'
            ? 'Add FOOTBALL_API_KEY to .env.local to see live scores'
            : `Scores unavailable — ${error}`}
        </span>
      </div>
    )
  }

  // ── No matches today ─────────────────────────────────────────────
  if (matches.length === 0) {
    return (
      <div style={{
        background: '#111', borderBottom: '1px solid #222',
        padding: '10px 14px',
      }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '12px', color: '#666',
        }}>
          No matches today in top leagues
        </span>
      </div>
    )
  }

  // ── Scores strip ─────────────────────────────────────────────────
  const liveCount = matches.filter(m => m.status === 'LIVE' || m.status === 'HT').length

  return (
    <div style={{
      background: '#111',
      borderBottom: '2px solid #e60000',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 14px 3px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {liveCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              background: '#e60000', color: 'white',
              fontSize: '9px', fontWeight: 800, padding: '1px 6px',
              borderRadius: '4px', letterSpacing: '0.06em',
              fontFamily: "'Barlow Condensed', sans-serif",
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%', background: 'white',
                animation: 'livePulse 1s infinite',
              }} />
              {liveCount} LIVE
            </span>
          )}
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '11px', fontWeight: 700, color: '#aaa',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Scores
          </span>
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px', color: '#555',
        }}>
          ↻ 60s
        </span>
      </div>

      {/* Scrollable match cards */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto',
        padding: '4px 14px 10px', scrollbarWidth: 'none',
      }}>
        {matches.map(match => {
          const isLive = match.status === 'LIVE' || match.status === 'HT'
          const isNS   = match.status === 'NS'

          return (
            <div key={match.id} style={{
              flexShrink: 0, width: '130px',
              background: isLive ? '#1a0000' : '#1a1a1a',
              border: `1px solid ${isLive ? '#e60000' : '#2a2a2a'}`,
              borderRadius: '8px', padding: '8px 9px',
              display: 'flex', flexDirection: 'column', gap: '5px',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}>
              {/* Competition + status */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '9px', fontWeight: 600, color: '#666',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  maxWidth: '70px',
                }}>
                  {match.competition}
                </span>
                <StatusBadge status={match.status} minute={match.minute} />
              </div>

              {/* Home team row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                  {match.homeLogo && (
                    <img
                      src={match.homeLogo}
                      alt={match.homeTeam}
                      style={{ width: '14px', height: '14px', objectFit: 'contain', flexShrink: 0 }}
                    />
                  )}
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '12px', fontWeight: 700, color: 'white',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    {shortName(match.homeTeam)}
                  </span>
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px', fontWeight: 700,
                  color: isNS ? '#555' : 'white',
                  minWidth: '14px', textAlign: 'right',
                }}>
                  {isNS ? '–' : (match.homeScore ?? 0)}
                </span>
              </div>

              {/* Away team row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                  {match.awayLogo && (
                    <img
                      src={match.awayLogo}
                      alt={match.awayTeam}
                      style={{ width: '14px', height: '14px', objectFit: 'contain', flexShrink: 0 }}
                    />
                  )}
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '12px', fontWeight: 700, color: 'white',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    {shortName(match.awayTeam)}
                  </span>
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px', fontWeight: 700,
                  color: isNS ? '#555' : 'white',
                  minWidth: '14px', textAlign: 'right',
                }}>
                  {isNS ? '–' : (match.awayScore ?? 0)}
                </span>
              </div>

              {/* Kickoff time for NS */}
              {isNS && (
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px', color: '#888',
                  }}>
                    {match.kickoff}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
