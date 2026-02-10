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
      // Allow images from any HTTPS source as a fallback
      // This is less secure but necessary for handling various image sources
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
}

module.exports = nextConfig
