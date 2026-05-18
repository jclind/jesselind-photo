import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const IMMUTABLE = 'public, max-age=31536000, immutable'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
    // Firebase Storage URLs include per-upload tokens, so the source URL
    // changes on re-upload — long TTL is safe and avoids re-transformations.
    minimumCacheTTL: 31536000,
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

export default withBundleAnalyzer(nextConfig)
