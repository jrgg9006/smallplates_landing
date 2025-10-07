import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Small Plates & Company — The People Behind Every Recipe',
  description: 'A cookbook experience made with your loved ones\' recipes — high-quality hardcover books that bring memories to life.',
  openGraph: {
    title: 'Small Plates & Company',
    description: 'A cookbook experience made with your loved ones\' recipes.',
    type: 'website',
    url: 'https://smallplates.co/',
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
