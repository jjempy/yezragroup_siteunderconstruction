/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    // Next.js Server Actions default to a 1MB request body limit — fine
    // for text fields, but a real photo from a phone camera (logo/founder
    // photo uploads on the Brand/Content admin pages) is routinely 3-8MB
    // and silently fails to even reach the action at all past that limit
    // (no error surfaces — it just never saves). Raised to comfortably
    // cover the 8MB max our own upload code already enforces, plus
    // multipart/form-data overhead.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
