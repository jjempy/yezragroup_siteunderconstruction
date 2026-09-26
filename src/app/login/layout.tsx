import type { Metadata } from 'next';

// page.tsx here is a Client Component ('use client'), which can't export
// `metadata` itself — a sibling layout is the standard way to still give
// the route its own title/description instead of silently inheriting the
// homepage's (an audit-flagged gap: login/signup showed the homepage's
// tab title and share preview). noindex: pure auth utility, nobody
// searches for it and it shouldn't compete with the homepage for ranking.
const PAGE_URL = 'https://orchemet.com/login';
const PAGE_TITLE = 'Sign In';
const PAGE_DESCRIPTION = 'Sign in to your Orchemet account.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: { url: PAGE_URL, title: PAGE_TITLE, description: PAGE_DESCRIPTION },
  twitter: { title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
