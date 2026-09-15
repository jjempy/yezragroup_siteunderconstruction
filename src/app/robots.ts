import type { MetadataRoute } from 'next';

const SITE_URL = 'https://orchemet.com';

// Pages with no unique indexable content (auth flows, gated/personal
// pages, the admin panel, raw API routes) — kept out of the index so
// they never show up as thin/duplicate results, without blocking the
// pages that actually matter.
const DISALLOW = ['/admin', '/account', '/library', '/api', '/login', '/signup', '/forgot-password', '/reset-password', '/auth', '/checkout'];

// Explicit allow rules for AI crawlers/answer engines, on top of the
// default "*" rule — the whole point of this pass is making the site
// legible to ChatGPT/Claude/Gemini/Perplexity when someone asks for a
// resource like this one, not just classic search.
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'Google-Extended',
  'PerplexityBot',
  'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
