/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {
    USE_MOCK_DATA: 'false', // Disable mock data to use real data
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    OPENSVM_RPC_LIST: process.env.OPENSVM_RPC_LIST,
    OPENSVM_RPC_LIST_2: process.env.OPENSVM_RPC_LIST_2
  },
  experimental: {
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  serverExternalPackages: ['@solana/web3.js'],
  images: {
    domains: ['raw.githubusercontent.com', 'arweave.net', 'www.arweave.net'],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  httpAgentOptions: {
    keepAlive: true,
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 30 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 15,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  }
}

module.exports = nextConfig
