/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig
