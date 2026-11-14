/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/ritm_me',
  assetPrefix: '/ritm_me/',
};

export default nextConfig;
