import type { Metadata } from 'next';

// See login/layout.tsx for why this exists as a separate file: page.tsx
// is a Client Component and can't export metadata directly.
const PAGE_URL = 'https://orchemet.com/signup';
const PAGE_TITLE = 'Create Account';
const PAGE_DESCRIPTION = 'Create a free Orchemet account to access your purchases and manage your account.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: { url: PAGE_URL, title: PAGE_TITLE, description: PAGE_DESCRIPTION },
  twitter: { title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
