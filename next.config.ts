import type { NextConfig } from 'next'

const coreApiUrl = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:4010'
const visionApiUrl = process.env.NEXT_PUBLIC_VISION_API_URL || 'http://localhost:4013'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/vision/:path*',
        destination: `${visionApiUrl}/v1/vision/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${coreApiUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
