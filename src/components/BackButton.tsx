'use client';

import { useRouter } from 'next/navigation';

/** Behaves like the browser's own back gesture — not a hardcoded link to
 * "/" — so it returns wherever you actually came from (a specific admin
 * section, mid-checkout, etc.) instead of always dropping you at the
 * homepage. Falls back to "/" only when there's nowhere to go back to
 * (e.g. the page was opened directly in a new tab). */
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <a
      href="/"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push('/');
      }}
    >
      ← Back
    </a>
  );
}
