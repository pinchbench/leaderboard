/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true, // PostHog sends trailing-slash requests that Next.js would otherwise 308-redirect
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/decide',        destination: 'https://us.i.posthog.com/decide' },
      { source: '/ingest/:path*',        destination: 'https://us.i.posthog.com/:path*' },
    ]
  },
}

export default nextConfig
