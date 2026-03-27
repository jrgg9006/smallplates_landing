import type { Metadata } from 'next'
import { DM_Sans, Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  adjustFontFallback: false,
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  adjustFontFallback: false,
})
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Small Plates & Company — Finally, a wedding gift people actually use',
  description: 'A wedding cookbook made by the people who showed up. Their recipes. Their stories. Your kitchen. Not a keepsake—a kitchen book.',
  metadataBase: new URL('https://www.smallplatesandcompany.com'),
  openGraph: {
    title: 'Small Plates & Company — Finally, a wedding gift people actually use',
    description: 'A wedding cookbook made by everyone who matters. Not a keepsake—a kitchen book.',
    type: 'website',
    url: 'https://www.smallplatesandcompany.com/',
    images: [
      {
        url: '/images/landing_hero_image2.jpg',
        width: 1200,
        height: 630,
        alt: 'Small Plates & Company — A wedding cookbook made by your people',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Small Plates & Company — Finally, a wedding gift people actually use',
    description: 'A wedding cookbook made by everyone who matters. Not a keepsake—a kitchen book.',
    images: ['/images/landing_hero_image2.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${inter.variable}`}>
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
