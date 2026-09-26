import type { Metadata } from 'next';

// See login/layout.tsx for why this exists as a separate file: page.tsx
// is a Client Component and can't export metadata directly.
const PAGE_URL = 'https://orchemet.com/reset-password';
const PAGE_TITLE = 'Set a New Password';
const PAGE_DESCRIPTION = 'Set a new password for your Orchemet account.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: { url: PAGE_URL, title: PAGE_TITLE, description: PAGE_DESCRIPTION },
  twitter: { title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
