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
  }
};

export default nextConfig;
