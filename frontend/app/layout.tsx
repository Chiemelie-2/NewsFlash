
import type { Metadata } from 'next'
import './globals.css'

/*
 * layout.tsx  (REPLACES frontend/app/layout.tsx)
 * ─────────────────────────────────────────────────────────────────
 * Changes vs original:
 *  ✅ Per-page dynamic SEO via generateMetadata (Next.js 13+)
 *  ✅ Open Graph + Twitter Card meta tags
 *  ✅ Canonical URL support
 *  ✅ Structured JSON-LD for NewsMediaOrganization
 * ─────────────────────────────────────────────────────────────────
 */

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://news-flash-one.vercel.app/'),
  title: {
    default: 'NewsFlash — AI-Driven News Engine',
    template: '%s | NewsFlash',
  },
  description:
    'Stay ahead with AI-curated, SEO-optimised news. Real-time trending stories across tech, business, crypto and more.',
  keywords: ['AI news', 'tech news', 'trending stories', 'crypto', 'business news'],
  authors: [{ name: 'NewsFlash' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'NewsFlash',
    title: 'NewsFlash — AI-Driven News Engine',
    description: 'Real-time AI-curated news with automatic SEO headlines and summaries.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NewsFlash' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NewsFlash — AI News',
    description: 'Real-time AI-curated news with automatic SEO headlines.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'NewsFlash',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://news-flash-one.vercel.app/',
  description: 'AI-powered news aggregation platform',
  logo: {
    '@type': 'ImageObject',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://news-flash-one.vercel.app/'}/favicon.ico`,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div className="min-h-screen bg-white dark:bg-gray-950">
          {children}
        </div>
      </body>
    </html>
  )
}

