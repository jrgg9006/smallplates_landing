import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { ProfileOnboardingProvider } from '@/lib/contexts/ProfileOnboardingContext'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'Small Plates & Company — The People Behind Every Recipe',
  description: 'A cookbook experience made with your loved ones\' recipes — high-quality hardcover books that bring memories to life.',
  metadataBase: new URL('https://smallplatesandcompany.com'),
  openGraph: {
    title: 'Small Plates & Company',
    description: 'A cookbook experience made with your loved ones\' recipes.',
    type: 'website',
    url: 'https://smallplatesandcompany.com/',
    images: [
      {
        url: '/images/share-card.svg',
        width: 1200,
        height: 630,
        alt: 'Small Plates & Company - Cookbook Experience',
        type: 'image/svg+xml',
      },
      {
        url: '/images/SmallPlates_logo_horizontal.png',
        width: 1920,
        height: 1080,
        alt: 'Small Plates & Company Logo',
        type: 'image/png',
      },
    ],
    siteName: 'Small Plates & Company',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@smallplatesandco',
    title: 'Small Plates & Company',
    description: 'A cookbook experience made with your loved ones\' recipes.',
    images: [
      {
        url: '/images/share-card.svg',
        alt: 'Small Plates & Company - Cookbook Experience',
      },
    ],
  },
  icons: {
    icon: '/images/SmallPlates_logo_horizontal.png',
    apple: '/images/SmallPlates_logo_horizontal.png',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/fvk8ngw.css" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="antialiased bg-white text-gray-900">
        <QueryProvider>
          <AuthProvider>
            <ProfileOnboardingProvider>
              {children}
            </ProfileOnboardingProvider>
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
