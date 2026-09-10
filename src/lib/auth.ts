import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

/**
 * Returns the signed-in user and their profile (role/blocked/etc), or null
 * if no one is signed in. Safe to call from any server component/action.
 */
export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>();

  return { user, profile: profile ?? null };
}

/** Redirects to /login unless someone is signed in (and not blocked). */
export async function requireUser() {
  const session = await getSessionUser();
  if (!session || session.profile?.blocked) {
    redirect('/login');
  }
  return session;
}

/** Redirects non-admins away. Use at the top of every /admin page. */
export async function requireAdmin() {
  const session = await requireUser();
  if (session.profile?.role !== 'admin') {
    redirect('/');
  }
  return session;
}
