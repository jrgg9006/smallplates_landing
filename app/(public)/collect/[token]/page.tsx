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
  
  // Reason: proxy couple image through our API to resize (1200x630), compress (<600KB),
  // and serve from our domain — Supabase adds x-robots-tag:none which can block crawlers
  const ogImageUrl = tokenInfo.couple_image_url
    ? `/api/og-image?url=${encodeURIComponent(tokenInfo.couple_image_url)}`
    : '/images/2SmallPlates-verticallogowhiteback.png'

  const ogImageAlt = tokenInfo.couple_image_url
    ? `Recipe Collection for ${tokenInfo.couple_names || 'the couple'}`
    : 'Small Plates & Company'

  return {
    title,
    description,
    metadataBase: new URL('https://www.smallplatesandcompany.com'),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/collect/${token}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
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
          url: ogImageUrl,
          alt: ogImageAlt,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function CollectPage({ params }: PageProps) {
  return <CollectionForm />
}