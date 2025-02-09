/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    FLIPSIDE_API_KEY: '167fcdba-cf42-42c8-9697-156978509b47'
  },
  reactStrictMode: true,
  images: {
    domains: ['**'],
  },
  transpilePackages: ['@solana/web3.js', '@solana/spl-token'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/address',
        destination: '/account',
        permanent: true,
      },
    ]
  },
  // Enable standalone output mode for Docker optimization
  output: 'standalone',
  experimental: {
    // Enable optimizations
    optimizeCss: true,
    optimizePackageImports: ['@solana/web3.js', '@solana/spl-token']
    // Removed 'turbotrace' as it's invalid
  }
}

module.exports = nextConfig
