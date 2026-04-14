/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iinnpndsxepvviafrmwz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async redirects() {
    return [
      // Instagram
      {
        source: '/ig',
        destination: '/?utm_source=instagram&utm_medium=bio&utm_campaign=profile',
        permanent: false,
      },
      {
        source: '/ig-story',
        destination: '/?utm_source=instagram&utm_medium=story&utm_campaign=stories',
        permanent: false,
      },
      {
        source: '/ig-reel',
        destination: '/?utm_source=instagram&utm_medium=reel&utm_campaign=reels',
        permanent: false,
      },
      // TikTok
      {
        source: '/tiktok',
        destination: '/?utm_source=tiktok&utm_medium=bio&utm_campaign=profile',
        permanent: false,
      },
      {
        source: '/tt-video',
        destination: '/?utm_source=tiktok&utm_medium=video&utm_campaign=videos',
        permanent: false,
      },
      // Pinterest
      {
        source: '/pinterest',
        destination: '/?utm_source=pinterest&utm_medium=bio&utm_campaign=profile',
        permanent: false,
      },
      {
        source: '/pin',
        destination: '/?utm_source=pinterest&utm_medium=pin&utm_campaign=pins',
        permanent: false,
      },
      // Facebook
      {
        source: '/fb',
        destination: '/?utm_source=facebook&utm_medium=bio&utm_campaign=profile',
        permanent: false,
      },
      {
        source: '/fb-post',
        destination: '/?utm_source=facebook&utm_medium=post&utm_campaign=posts',
        permanent: false,
      },
      {
        source: '/fb-story',
        destination: '/?utm_source=facebook&utm_medium=story&utm_campaign=stories',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
