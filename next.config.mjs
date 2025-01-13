/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle ES modules
    config.experiments = { ...config.experiments, topLevelAwait: true };
    
    // Add necessary polyfills
    config.resolve.fallback = {git 
      ...config.resolve.fallb
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
