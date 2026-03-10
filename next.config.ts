import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_CORE_API_URL}/:path*`,
      },
      {
        source: '/api/vision/:path*',
        destination: `${process.env.NEXT_PUBLIC_VISION_API_URL}/v1/vision/:path*`,
      },
    ]
  },
}

export default nextConfig
