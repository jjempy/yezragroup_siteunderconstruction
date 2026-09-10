import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. Bypasses RLS entirely — never import this
 * from a Client Component, never send its key to the browser, and never
 * call it without first checking the caller is an authenticated admin
 * (see requireAdmin() in src/lib/auth.ts).
 *
 * Used for: the Stripe webhook (grants entitlements for arbitrary users),
 * and the admin user-management page (auth.admin.listUsers / ban / role
 * changes, CSV export) which needs data outside what RLS exposes to a
 * regular authenticated session.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — set them in your server environment only.'
    );
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
