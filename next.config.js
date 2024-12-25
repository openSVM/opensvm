/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.tsx?$/,
      include: /www-sacred/,
      use: [{ loader: 'ts-loader', options: { transpileOnly: true } }]
    });
    config.resolve.alias = {
      ...config.resolve.alias,
      '@sacred': '/home/ubuntu/repos/www-sacred/components'
    };
    return config;
  }
}

module.exports = nextConfig
