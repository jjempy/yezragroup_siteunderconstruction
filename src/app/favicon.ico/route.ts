import { NextResponse } from 'next/server';

// Browsers still probe the classic /favicon.ico path directly (not just
// the <link rel="icon"> the app's dynamic Icon route sets), and that
// probe was landing on a bare 404. Redirecting it to the real (dynamic,
// brand-aware) icon route means there's no dead link left to trip over,
// without needing a second, separately-maintained static icon file.
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/icon', request.url), 302);
}
