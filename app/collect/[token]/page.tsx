import type { Metadata } from 'next'
import { validateCollectionToken } from '@/lib/supabase/collection'
import CollectionForm from './CollectionForm'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  
  // Get user info from token for personalized meta tags
  const { data: tokenInfo, error } = await validateCollectionToken(token)
  
  // Default metadata if token is invalid
  if (error || !tokenInfo) {
    return {
      title: 'Share a Recipe to my Cookbook - SP&Co',
      description: 'Help us collect recipes for a cookbook! Share your favorite recipes with us.',
      robots: { index: false, follow: false }, // Don't index invalid token pages
    }
  }

  // Extract user name for personalization
  const userName = tokenInfo.user_name || tokenInfo.raw_full_name || 'Someone'
  const firstName = userName.split(' ')[0] || 'Someone'
  
  // Generate personalized meta tags like Partiful
  const personalizedTitle = 'Share a Recipe to my Cookbook - SP&Co'
  const personalizedDescription = `${firstName} invites you to share your favorite recipe with them! They will print a cookbook with recipes from family and friends.`

  return {
    title: personalizedTitle,
    description: personalizedDescription,
    metadataBase: new URL('https://smallplatesandcompany.com'),
    openGraph: {
      title: personalizedTitle,
      description: personalizedDescription,
      type: 'website',
      url: `/collect/${token}`,
      images: [
        {
          url: '/images/share-card.svg',
          width: 1200,
          height: 630,
          alt: `Recipe Collection Form - ${firstName} invites you to share recipes`,
          type: 'image/svg+xml',
        },
      ],
      siteName: 'Small Plates & Company',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@smallplatesandco',
      title: personalizedTitle,
      description: personalizedDescription,
      images: [
        {
          url: '/images/share-card.svg',
          alt: `Recipe Collection Form - ${firstName} invites you to share recipes`,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/svg+xml',
    },
  }
}

export default async function CollectPage({ params }: PageProps) {
  return <CollectionForm />
}