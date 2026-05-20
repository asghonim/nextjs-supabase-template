import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  compiler: {
    // removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { properties: ['data-testid'] } : false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
}

export default nextConfig
