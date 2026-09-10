import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Server-side Supabase client, scoped to the signed-in user via their
 * auth cookies. Respects RLS — this is the client every server component,
 * server action, and route handler should use for anything user-scoped.
 *
 * Deliberately untyped against the generated `Database` schema (the hand
 * written src/types/database.ts doesn't match postgrest-js's exact generic
 * shape) — callers cast/annotate query results with the types in
 * src/types/database.ts instead. Swap in `createServerClient<Database>` if
 * you later generate real types with `supabase gen types`.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — middleware refreshes the
            // session instead, so this can be safely ignored.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}
