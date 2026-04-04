/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Permet aux API routes longues (generate-plan) de ne pas timeout
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
