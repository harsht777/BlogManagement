import type { NextConfig } from 'next';

const internalApiUrl = process.env.INTERNAL_API_URL || (process.env.NODE_ENV === 'production' ? 'http://api:4000' : 'http://localhost:4000');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/storage/images/:path*',
        destination: `${internalApiUrl}/storage/images/:path*`,
      },
    ];
  },
};

export default nextConfig;
