import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NewsApp - AI-Driven News Engine',
  description: 'Stay updated with curated, AI-enhanced news articles.',
  openGraph: {
    title: 'NewsApp',
    description: 'AI-driven news platform with real-time trending stories.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="min-h-screen bg-white dark:bg-gray-950">
          {children}
        </div>
      </body>
    </html>
  )
}
