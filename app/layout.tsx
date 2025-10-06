import type { Metadata } from 'next'
import './globals.css'

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
      <body className="antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
