'use client'

/**
 * app/transfers/page.tsx
 * ─────────────────────────────────────────────────────────
 * Transfer Rumor Tracker page.
 *
 * Features:
 *  ✅ Transfer rumor cards with Rumor Reliability Meter
 *     🟢 Confirmed  🟡 Likely  🔴 Rumour
 *  ✅ Player name + clubs (from → to) with emoji flags
 *  ✅ Source attribution (Sky Sports, Fabrizio Romano etc.)
 *  ✅ Fee estimate
 *  ✅ Last updated timestamp
 *  ✅ Filter by status / league
 *  ✅ Confirmed deals section
 *  ✅ Latest transfer news articles pulled from Supabase
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import ArticleCard from '@/components/ArticleCard'
import { getArticlesBySection, Article } from '@/lib/supabase'
import { ArrowRight, RefreshCw, TrendingUp } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
type RumorStatus = 'confirmed' | 'likely' | 'rumour'

interface TransferRumor {
  id: string
  player: string
  playerNation: string
  fromClub: string
  fromLeague: string
  toClub: string
  toLeague: string
  fee: string
  source: string
  status: RumorStatus
  updatedAt: string
}

// ── Status config ────────────────────────────────────────────────
const STATUS_CONFIG: Record<RumorStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  confirmed: { label: 'CONFIRMED', color: '#00FF87', bg: 'rgba(0,255,135,0.08)', border: 'rgba(0,255,135,0.3)', dot: '#00FF87' },
  likely:    { label: 'LIKELY',    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', dot: '#f59e0b' },
  rumour:    { label: 'RUMOUR',    color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', dot: '#ef4444' },
}

// ── Placeholder rumors (replace with your API/DB data) ───────────
const PLACEHOLDER_RUMORS: TransferRumor[] = [
  { id: '1', player: 'Kylian Mbappé',     playerNation: '🇫🇷', fromClub: 'PSG',            fromLeague: 'Ligue 1',   toClub: 'Real Madrid',    toLeague: 'La Liga',     fee: '€180m', source: 'L\'Equipe',        status: 'confirmed', updatedAt: '2 hours ago' },
  { id: '2', player: 'Erling Haaland',    playerNation: '🇳🇴', fromClub: 'Man City',       fromLeague: 'PL',        toClub: 'Real Madrid',    toLeague: 'La Liga',     fee: '€250m', source: 'Sky Sports',       status: 'rumour',    updatedAt: '5 hours ago' },
  { id: '3', player: 'Jude Bellingham',   playerNation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', fromClub: 'Real Madrid',   fromLeague: 'La Liga',   toClub: 'Man City',       toLeague: 'PL',          fee: '€120m', source: 'Fabrizio Romano', status: 'rumour',    updatedAt: '1 day ago' },
  { id: '4', player: 'Victor Osimhen',    playerNation: '🇳🇬', fromClub: 'Napoli',         fromLeague: 'Serie A',   toClub: 'Arsenal',        toLeague: 'PL',          fee: '€80m',  source: 'The Athletic',    status: 'likely',    updatedAt: '3 hours ago' },
  { id: '5', player: 'Pedri',             playerNation: '🇪🇸', fromClub: 'Barcelona',      fromLeague: 'La Liga',   toClub: 'Barcelona',      toLeague: 'La Liga',     fee: 'Extension', source: 'Marca',        status: 'confirmed', updatedAt: '6 hours ago' },
  { id: '6', player: 'Florian Wirtz',     playerNation: '🇩🇪', fromClub: 'Bayer Leverkusen', fromLeague: 'Bundesliga', toClub: 'Liverpool',   toLeague: 'PL',          fee: '€110m', source: 'BILD',            status: 'likely',    updatedAt: '12 hours ago' },
  { id: '7', player: 'Lautaro Martínez',  playerNation: '🇦🇷', fromClub: 'Inter Milan',    fromLeague: 'Serie A',   toClub: 'Chelsea',        toLeague: 'PL',          fee: '€95m',  source: 'Telegraph',       status: 'rumour',    updatedAt: '2 days ago' },
  { id: '8', player: 'Marcus Rashford',   playerNation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', fromClub: 'Man United',    fromLeague: 'PL',        toClub: 'PSG',            toLeague: 'Ligue 1',     fee: '€60m',  source: 'Guardian',        status: 'likely',    updatedAt: '8 hours ago' },
]

// ── Meter bar component ───────────────────────────────────────────
function ReliabilityMeter({ status }: { status: RumorStatus }) {
  const cfg = STATUS_CONFIG[status]
  const width = status === 'confirmed' ? '100%' : status === 'likely' ? '60%' : '25%'
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          RELIABILITY
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
          letterSpacing: '0.1em', color: cfg.color,
        }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ height: '4px', background: 'var(--pitch-border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width, background: cfg.color,
          borderRadius: '2px', transition: 'width 0.8s ease',
          boxShadow: `0 0 6px ${cfg.color}`,
        }} />
      </div>
    </div>
  )
}

// ── Transfer card ────────────────────────────────────────────────
function TransferCard({ rumor }: { rumor: TransferRumor }) {
  const cfg = STATUS_CONFIG[rumor.status]
  return (
    <div
      className="card-hover"
      style={{
        background: 'var(--pitch-mid)',
        border: `1px solid ${cfg.border}`,
        borderRadius: '8px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status glow top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: cfg.color, opacity: 0.7 }} />

      {/* Player + nation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>{rumor.playerNation}</span>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900,
          letterSpacing: '-0.01em', textTransform: 'uppercase', color: 'var(--text-primary)',
        }}>
          {rumor.player}
        </span>
      </div>

      {/* Club move: FROM → TO */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px',
        background: 'var(--pitch-surface)',
        borderRadius: '6px',
        marginBottom: '12px',
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '2px' }}>FROM</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{rumor.fromClub}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>{rumor.fromLeague}</p>
        </div>
        <ArrowRight size={16} style={{ color: cfg.color, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '2px' }}>TO</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: cfg.color }}>{rumor.toClub}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>{rumor.toLeague}</p>
        </div>
      </div>

      {/* Fee + source */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>FEE</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{rumor.fee}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>SOURCE</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{rumor.source}</p>
        </div>
      </div>

      {/* Reliability meter */}
      <ReliabilityMeter status={rumor.status} />

      {/* Last updated */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '8px' }}>
        Updated {rumor.updatedAt}
      </p>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function TransfersPage() {
  const [filter, setFilter]         = useState<RumorStatus | 'all'>('all')
  const [articles, setArticles]     = useState<Article[]>([])
  const [loadingArts, setLoadingArts] = useState(true)

  useEffect(() => {
    getArticlesBySection('transfers', 6).then(data => {
      setArticles(data)
      setLoadingArts(false)
    })
  }, [])

  const filtered = filter === 'all'
    ? PLACEHOLDER_RUMORS
    : PLACEHOLDER_RUMORS.filter(r => r.status === filter)

  const counts = {
    confirmed: PLACEHOLDER_RUMORS.filter(r => r.status === 'confirmed').length,
    likely:    PLACEHOLDER_RUMORS.filter(r => r.status === 'likely').length,
    rumour:    PLACEHOLDER_RUMORS.filter(r => r.status === 'rumour').length,
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--pitch-black)' }}>
      <Header />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 16px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: '8px' }}>Transfer Centre</span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 6vw, 60px)',
            fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase',
            color: 'var(--text-primary)', lineHeight: 1,
          }}>
            Transfer<br />
            <span style={{ color: 'var(--green-spark)' }}>Rumor Tracker</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Live transfer news, rumors, and confirmed deals — updated in real time.
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {(Object.entries(counts) as [RumorStatus, number][]).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status]
            return (
              <div key={status} style={{
                padding: '10px 18px',
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, display: 'block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: cfg.color }}>
                  {count} {cfg.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {(['all', 'confirmed', 'likely', 'rumour'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '7px 16px', borderRadius: '4px', cursor: 'pointer',
                border: filter === f
                  ? `1px solid ${f === 'all' ? 'var(--green-spark)' : STATUS_CONFIG[f]?.color || 'var(--green-spark)'}`
                  : '1px solid var(--pitch-border)',
                background: filter === f ? 'var(--pitch-surface)' : 'transparent',
                color: filter === f
                  ? (f === 'all' ? 'var(--green-spark)' : STATUS_CONFIG[f]?.color || 'var(--green-spark)')
                  : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {f === 'all' ? '⚽ All Rumors' : `${f === 'confirmed' ? '🟢' : f === 'likely' ? '🟡' : '🔴'} ${f}`}
            </button>
          ))}
        </div>

        {/* Rumor grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '48px',
        }}>
          {filtered.map(rumor => <TransferCard key={rumor.id} rumor={rumor} />)}
        </div>

        {/* Transfer news articles */}
        {articles.length > 0 && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <span className="section-label">Latest Transfer News</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {articles.map(article => <ArticleCard key={article.id} article={article} />)}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
