const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.tsx?$/,
      include: path.resolve(__dirname, '../www-sacred'),
      use: [{ 
        loader: 'ts-loader',
        options: { 
          transpileOnly: true,
          configFile: path.resolve(__dirname, 'tsconfig.json')
        }
      }]
    });
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@sacred': path.resolve(__dirname, '../www-sacred/components'),
      '@components': path.resolve(__dirname, './app/styles'),
      '@common': path.resolve(__dirname, '../www-sacred/common')
    };
    
    return config;
  }
}

module.exports = nextConfig
