import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Small Plates & Company — Psst...pass a plate',
  description: 'A book experience made with your loved ones\' recipes — high-quality hardcover books that bring memories to life.',
  metadataBase: new URL('https://smallplates.co'),
  openGraph: {
    title: 'Small Plates & Company',
    description: 'A book experience made with your loved ones\' recipes.',
    type: 'website',
    url: 'https://smallplates.co/',
    images: [
      {
        url: '/images/landing_hero_image2.jpg',
        width: 1200,
        height: 630,
        alt: 'Small Plates & Company - Psst...pass a plate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Small Plates & Company',
    description: 'A book experience made with your loved ones\' recipes.',
    images: ['/images/landing_hero_image2.jpg'],
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
      </head>
      <body className="antialiased bg-white text-gray-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
