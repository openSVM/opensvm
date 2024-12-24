/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'www.google.com',
      },
    ],
  },
  env: {
    PROJECT_NAME: 'opensvm'
  },
  sassOptions: {
    includePaths: ['./styles', '../www-sacred/components'],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    });
    return config;
  },
};

export default nextConfig;
