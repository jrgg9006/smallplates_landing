import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recipe Collection Form — Small Plates & Company',
  description: 'Help us collect recipes for a cookbook! Please share your favorite recipes with us.',
  openGraph: {
    title: 'Recipe Collection Form',
    description: 'Help us collect recipes for a cookbook! Please share your favorite recipes with us.',
    type: 'website',
    images: [
      {
        url: '/images/SmallPlates_logo_horizontal.png',
        width: 800,
        height: 400,
        alt: 'Small Plates & Company Logo',
      },
    ],
    siteName: 'Small Plates & Company',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recipe Collection Form',
    description: 'Help us collect recipes for a cookbook! Please share your favorite recipes with us.',
    images: ['/images/SmallPlates_logo_horizontal.png'],
  },
  icons: {
    icon: '/images/SmallPlates_logo_horizontal.png',
    apple: '/images/SmallPlates_logo_horizontal.png',
  },
}

export default function CollectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}