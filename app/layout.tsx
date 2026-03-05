import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-96BCVQ91GC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-96BCVQ91GC');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vr3wrugj4z");
          `}
        </Script>
        <link rel="stylesheet" href="https://use.typekit.net/fvk8ngw.css" />
      </head>
      <body className="antialiased bg-white text-gray-900">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
