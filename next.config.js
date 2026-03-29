/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;