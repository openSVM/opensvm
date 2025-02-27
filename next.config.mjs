/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack configuration for optimizing chunks
  webpack: (config, { isServer }) => {
    // Optimize client-side chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 70000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Bundle commonly used libraries together
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            reuseExistingChunk: true,
          },
          // Create a separate chunk for chart.js
          charts: {
            test: /[\\/]node_modules[\\/]chart\.js[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 10,
          },
          // Create a separate chunk for Solana dependencies
          solana: {
            test: /[\\/]node_modules[\\/]@solana[\\/]/,
            name: 'solana',
            chunks: 'all',
            priority: 10,
          },
          // UI components chunk
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            chunks: 'all',
            enforce: true,
            priority: 20,
          },
          // Icons chunk
          icons: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'icons',
            chunks: 'all',
            priority: 15,
          },
          // Providers chunk
          providers: {
            test: /[\\/]providers[\\/]/,
            name: 'providers',
            chunks: 'all',
            enforce: true,
            priority: 20,
          },
        },
      };

      // Optimize module concatenation
      config.optimization.concatenateModules = true;

      // Enable module size optimization
      config.optimization.moduleIds = 'deterministic';
    }
    return config;
  },

  // Image optimization
  images: {
    domains: ['arweave.net', 'www.arweave.net'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.arweave.net',
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable modern optimizations
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs'
    ],
    // Enable server actions with increased limit
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Enable production source maps for better debugging
  productionBrowserSourceMaps: true,

  // Disable unnecessary features
  poweredByHeader: false,
};

export default nextConfig;
