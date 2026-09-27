import { NextResponse } from 'next/server';

// Browsers still probe the classic /favicon.ico path directly (not just
// the <link rel="icon"> tag layout.tsx sets), and that probe was landing
// on a bare 404. Redirecting it to the real (dynamic, brand-aware, and
// explicitly versioned — see api/favicon/route.tsx) icon route means
// there's no dead link left to trip over, without needing a second,
// separately-maintained static icon file. Keep this target's `?v=` in
// sync with layout.tsx's `icons` field.
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/api/favicon?v=2', request.url), 302);
}
