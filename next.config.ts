import type { NextConfig } from 'next'

const IMMUTABLE = 'public, max-age=31536000, immutable'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE }],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE }],
      },
    ]
  },
}

export default nextConfig
