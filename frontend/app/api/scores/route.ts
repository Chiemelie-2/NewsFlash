import { NextResponse } from 'next/server'

const API_KEY = process.env.FOOTBALL_API_KEY

const TOP_LEAGUES = [
  39,  // Premier League
  140, // La Liga
  78,  // Bundesliga
  135, // Serie A
  2    // Champions League
]

const statusMap: Record<string, string> = {
  '1H': 'LIVE',
  '2H': 'LIVE',
  'HT': 'HT',
  'FT': 'FT',
  'NS': 'NS',
  'LIVE': 'LIVE',
}

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'FOOTBALL_API_KEY is not set in environment variables' },
        { status: 500 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    const requests = TOP_LEAGUES.map(league =>
      fetch(
        `https://v3.football.api-sports.io/fixtures?league=${league}&season=2024&date=${today}`,
        {
          headers: {
            'x-apisports-key': API_KEY!,
          },
          next: { revalidate: 60 }, // cache for 60 seconds
        }
      ).then(res => res.json())
    )

    const responses = await Promise.all(requests)

    const matches = responses.flatMap((r: any) => r.response ?? [])

    const formatted = matches.map((m: any) => ({
      id: m.fixture.id,
      homeTeam: m.teams.home.name,
      awayTeam: m.teams.away.name,
      homeScore: m.goals.home,
      awayScore: m.goals.away,
      status: statusMap[m.fixture.status.short] ?? m.fixture.status.short,
      minute: m.fixture.status.elapsed,
      competition: m.league.name,
      competitionLogo: m.league.logo,
      homeLogo: m.teams.home.logo,
      awayLogo: m.teams.away.logo,
      kickoff: new Date(m.fixture.date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))

    // Sort: LIVE first, then NS, then FT
    const order = ['LIVE', 'HT', 'NS', 'FT']
    formatted.sort((a: any, b: any) => {
      const ai = order.indexOf(a.status)
      const bi = order.indexOf(b.status)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

    return NextResponse.json(formatted)
  } catch (err) {
    console.error('LiveScores API error:', err)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}
