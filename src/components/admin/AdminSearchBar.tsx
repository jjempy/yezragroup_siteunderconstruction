'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminSearchMatch } from '@/lib/admin-search';

/** Searches every admin-editable field's live value (not just page names)
 * and jumps straight to the match — see AdminHighlightOnLoad, which reads
 * the ?highlight=&q= this sets and scrolls/selects the field on arrival. */
export function AdminSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<AdminSearchMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setMatches([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((body) => {
          setMatches(body.matches ?? []);
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function goTo(match: AdminSearchMatch) {
    setOpen(false);
    router.push(`${match.page}?highlight=${encodeURIComponent(match.fieldId)}&q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="admin-search" ref={containerRef}>
      <input
        type="search"
        placeholder="Search admin content…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
      />
      {open && query.trim().length >= 2 && (
        <div className="admin-search-results">
          {loading ? (
            <div className="admin-search-empty">Searching…</div>
          ) : matches.length === 0 ? (
            <div className="admin-search-empty">No matches for "{query}"</div>
          ) : (
            matches.map((m) => (
              <button key={`${m.page}-${m.fieldId}`} className="admin-search-result" onClick={() => goTo(m)}>
                <div className="admin-search-path">
                  {m.pageLabel} → {m.fieldLabel}
                </div>
                <div className="admin-search-snippet">{m.snippet}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
