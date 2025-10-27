import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recipe Collection Form — Small Plates & Company',
  description: 'Help us collect recipes for a cookbook! Share your favorite recipes with us.',
  metadataBase: new URL('https://smallplatesandcompany.com'),
  openGraph: {
    title: 'Recipe Collection Form',
    description: 'Help us collect recipes for a cookbook! Share your favorite recipes with us.',
    type: 'website',
    url: '/collect',
    images: [
      {
        url: '/images/share-card.svg',
        width: 1200,
        height: 630,
        alt: 'Recipe Collection Form - Small Plates & Company',
        type: 'image/svg+xml',
      },
    ],
    siteName: 'Small Plates & Company',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@smallplatesandco',
    title: 'Recipe Collection Form',
    description: 'Help us collect recipes for a cookbook! Share your favorite recipes with us.',
    images: [
      {
        url: '/images/share-card.svg',
        alt: 'Recipe Collection Form - Small Plates & Company',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'fb:app_id': '123456789', // Replace with actual Facebook App ID if you have one
  },
}

export default function CollectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <head>
        {/* Additional WhatsApp and sharing optimization meta tags */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="canonical" href="https://smallplatesandcompany.com/collect" />
      </head>
      {children}
    </>
  )
}