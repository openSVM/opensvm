/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
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

    return config;
  },
  images: {
    remotePatterns: [
      {
        hostname: 'www.google.com',
      },
    ],
  },
};

export default nextConfig;
