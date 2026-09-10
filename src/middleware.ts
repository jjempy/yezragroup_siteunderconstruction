import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Refreshes the Supabase auth session cookie on every request so server
// components always see a valid session. Page-level guards (requireUser /
// requireAdmin in src/lib/auth.ts) do the actual access control + redirects;
// this just keeps the cookie alive.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Not configured yet — let requests through unauthenticated rather than
    // 500ing the whole site. Every auth-gated page still enforces this
    // itself (requireUser/requireAdmin), so nothing is exposed by skipping
    // the refresh; there's just no session to refresh yet.
    return response;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // Supabase URL configured but unreachable — don't take the whole site
    // down over a session-cookie refresh; page-level guards still apply.
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
