'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client for use in Client Components (auth forms, admin
 * CMS forms with live feedback, etc). Uses the public anon key only —
 * RLS still applies, same as the server client. See the note in
 * lib/supabase/server.ts about why this isn't typed against `Database`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
