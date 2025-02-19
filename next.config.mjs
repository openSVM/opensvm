/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    USE_MOCK_DATA: 'false',
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    OPENSVM_RPC_LIST: process.env.OPENSVM_RPC_LIST,
    OPENSVM_RPC_LIST_2: process.env.OPENSVM_RPC_LIST_2
  },
  preconnect: [
    'https://actions-registry.dial.to',
    'https://api.mainnet-beta.solana.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
  experimental: {
    optimizeCss: true,
    serverActions: true,
    optimizeFonts: true,
    outputFileTracingRoot: process.cwd(),
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
  },
  
  images: {
    domains: ['raw.githubusercontent.com', 'arweave.net', 'www.arweave.net'],
    remotePatterns: [
      {
        hostname: 'www.google.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Enable React strict mode for better development
  reactStrictMode: true,
  
  webpack: (config, { isServer }) => {
    // Handle ES modules
    config.experiments = { ...config.experiments, topLevelAwait: true };
    
    // Add necessary polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Transpile deepscatter dependencies
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Handle Three.js imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'three': 'three/build/three.module.js',
    };

    // External packages
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    return config;
  },

  // Performance optimizations
  httpAgentOptions: {
    keepAlive: true,
  },
  poweredByHeader: false,
  compress: true,
  
  // Optimize page loading
  onDemandEntries: {
    maxInactiveAge: 30 * 1000,
    pagesBufferLength: 15,
  },

  // CORS headers
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
      {
        // Add cache-control headers for static assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Add cache-control headers for fonts
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Build optimization
  generateBuildId: async () => 'build',
  generateEtags: false,
  distDir: '.next',
  swcMinify: true,
  cleanDistDir: true,
};

export default nextConfig;
