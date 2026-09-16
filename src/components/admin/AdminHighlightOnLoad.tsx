'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/** Drop this into any admin page that has form fields with real `id`
 * attributes. If the URL carries ?highlight=<fieldId> (set by
 * AdminSearchBar), scrolls that field into view, focuses it, and — when
 * ?q=<term> is also present and the field's current value contains it —
 * selects that exact substring, so the searched word is visibly
 * highlighted via the browser's native text selection. */
export function AdminHighlightOnLoad() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const fieldId = searchParams.get('highlight');
    if (!fieldId) return;
    const el = document.getElementById(fieldId);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('admin-highlight-pulse');
    const timeout = setTimeout(() => el.classList.remove('admin-highlight-pulse'), 2400);

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus({ preventScroll: true });
      const query = searchParams.get('q');
      if (query) {
        const idx = el.value.toLowerCase().indexOf(query.toLowerCase());
        if (idx !== -1) {
          el.setSelectionRange(idx, idx + query.length);
        }
      }
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
