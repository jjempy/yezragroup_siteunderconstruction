/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Baseline defense-in-depth headers an external audit flagged as
  // missing entirely (only HSTS was present before this). Deliberately
  // NOT including Content-Security-Policy here — a real CSP has to be
  // staged Report-Only first against every third-party origin this site
  // actually loads (Stripe, Supabase, Google Fonts/Analytics) or it risks
  // silently breaking checkout; that's follow-up work, not a drop-in.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
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
