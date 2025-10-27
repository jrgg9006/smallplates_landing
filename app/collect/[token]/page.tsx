import type { Metadata } from 'next'
import { getCachedMetadata } from '@/lib/supabase/metadata-cache'
import CollectionForm from './CollectionForm'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  
  // Fast metadata lookup from cache - no heavy validation
  const { data: cachedMeta, error } = await getCachedMetadata(token)
  
  // Default metadata (used if cache miss or invalid token)
  const defaultTitle = 'Share a Recipe to my Cookbook - SP&Co'
  const defaultDescription = 'Share your favorite recipe for our cookbook!'
  
  // Use cached data if available, otherwise use defaults
  const title = cachedMeta?.cached_og_title || defaultTitle
  const description = cachedMeta?.cached_og_description || defaultDescription
  
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
      index: error ? false : true, // Don't index if token lookup failed
      follow: error ? false : true,
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