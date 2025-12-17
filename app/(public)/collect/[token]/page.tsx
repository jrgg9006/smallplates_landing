import type { Metadata } from 'next'
import { validateCollectionToken } from '@/lib/supabase/collection'
import CollectionForm from './CollectionForm'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ 
  params,
  searchParams 
}: { 
  params: Promise<{ token: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const { token } = await params
  const resolvedSearchParams = await searchParams
  const groupId = typeof resolvedSearchParams.group === 'string' ? resolvedSearchParams.group : null
  
  // Get user info from token for personalized meta tags
  // Pass groupId to load custom_share_message from group_members
  const { data: tokenInfo, error } = await validateCollectionToken(token, groupId)
  
  // Default metadata if token is invalid
  if (error || !tokenInfo) {
    return {
      title: 'Share a Recipe to my Cookbook - SP&Co',
      description: 'Share your favorite recipe for our cookbook!',
      robots: { index: false, follow: false },
    }
  }

  // Extract user name for personalization
  const userName = tokenInfo.user_name || tokenInfo.raw_full_name || 'Someone'
  const firstName = userName.split(' ')[0] || 'Someone'
  
  // Use couple names if available (from group), otherwise use firstName
  const displayName = tokenInfo.couple_names || firstName
  
  // Generate personalized meta tags
  // Use custom_share_message if available (from group_members), otherwise use default
  const title = 'Share a Recipe to my Cookbook - SP&Co'
  const defaultDescription = `${displayName} invites you to share your favorite recipe with them! They will print a cookbook with recipes from family and friends.`
  const description = tokenInfo.custom_share_message || defaultDescription
  
  return {
    title,
    description,
    metadataBase: new URL('https://smallplatesandcompany.com'),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/collect/${token}`,
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
      title,
      description,
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
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/svg+xml',
    },
  }
}

export default async function CollectPage({ params }: PageProps) {
  return <CollectionForm />
}