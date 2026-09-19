'use client';

import { useEffect, useState } from 'react';

/** Renders a stored UTC timestamp in whoever is actually looking at the
 * screen's real local time, instead of the server's.
 *
 * The bug this fixes: every admin page that formatted a timestamp with
 * `new Date(iso).toLocaleString(...)` was doing that formatting inside a
 * Server Component — which runs on Vercel's server, not the admin's own
 * device. `toLocaleString()` with no explicit `timeZone` uses whatever
 * timezone the *runtime* considers local, which on Vercel is UTC, not
 * Eastern — hence timestamps reading ~4-5 hours ahead of when things
 * actually happened. Formatting has to happen in the browser to know the
 * viewer's real timezone at all, since a Server Component genuinely has
 * no way to know that.
 *
 * Renders nothing until mounted (rather than the server's — wrong —
 * value) to avoid a hydration mismatch between server and client
 * markup; the swap from blank to the real local time happens
 * immediately on load, not after some later interaction. */
export function LocalTimestamp({
  iso,
  variant,
}: {
  iso: string;
  variant: 'when' | 'date';
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date(iso);
    setText(
      variant === 'when'
        ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    );
  }, [iso, variant]);

  return <>{text ?? ' '}</>;
}
