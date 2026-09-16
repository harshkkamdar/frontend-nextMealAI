import type { NextConfig } from 'next'

const isCap = process.env.NEXT_PUBLIC_TARGET === 'capacitor'

const nextConfig: NextConfig = {
  output: isCap ? 'export' : undefined,
  trailingSlash: isCap,
  images: { unoptimized: true },
  ...(isCap ? {} : {
    async redirects() {
      return [
        { source: '/diary', destination: '/food', permanent: true },
        { source: '/activity', destination: '/train', permanent: true },
        { source: '/activity/workout/:id', destination: '/train/session?id=:id', permanent: true },
        { source: '/chat/:id((?!session).*)', destination: '/chat/session?id=:id', permanent: true },
        { source: '/plans/:id((?!new|view|edit).*)', destination: '/plans/view?id=:id', permanent: true },
        { source: '/plans/:id/edit', destination: '/plans/edit?id=:id', permanent: true },
      ]
    },
  }),
}

export default nextConfig
