import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NewsFlash Football — Live Scores, Transfers & Analysis',
  description: 'The sharpest football news platform. Live scores, transfer news, match analysis and football gist — all in one place.',
  openGraph: {
    title: 'NewsFlash Football',
    description: 'Live scores, transfers, breaking football news.',
    type: 'website',
  },
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Responsive viewport — preserves existing meta query */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="min-h-screen" style={{ background: 'var(--pitch-black)', position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
