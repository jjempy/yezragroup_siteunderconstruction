import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/types/database';

export interface AdminUserEntitlement {
  product: string;
  status: string;
  amount_total: number | null;
  currency: string | null;
  source: string;
  note: string | null;
  granted_at: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'standard' | 'admin';
  blocked: boolean;
  marketing_opt_in: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  entitlements: AdminUserEntitlement[];
}

/** Combines auth.users (email, last sign-in) with public.profiles
 * (name/phone/role/blocked/marketing) and entitlements (purchases/manual
 * grants) for the admin Users page. Walks every page of
 * auth.admin.listUsers() so it covers the whole user base. */
export async function getUsersForAdmin(): Promise<AdminUserRow[]> {
  const admin = createAdminClient();

  const authUsers: { id: string; email: string; last_sign_in_at: string | null }[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    authUsers.push(
      ...data.users.map((u) => ({ id: u.id, email: u.email ?? '', last_sign_in_at: u.last_sign_in_at ?? null }))
    );
    if (data.users.length < 200) break;
    page += 1;
  }

  const { data: profiles, error: profileError } = await admin.from('profiles').select('*');
  if (profileError) throw new Error(profileError.message);

  // select('*') rather than naming status/note explicitly: this keeps
  // working (just without those two fields) if the 0010 migration hasn't
  // been run against this Supabase project yet, instead of a hard error.
  const { data: entitlementRows } = await admin.from('entitlements').select('*');

  const profileById = new Map<string, Profile>((profiles as Profile[]).map((p) => [p.id, p]));
  const entitlementsByUser = new Map<string, AdminUserEntitlement[]>();
  for (const row of (entitlementRows as Record<string, unknown>[] | null) ?? []) {
    const userId = row.user_id as string;
    const list = entitlementsByUser.get(userId) ?? [];
    list.push({
      product: row.product as string,
      status: (row.status as string) ?? 'active',
      amount_total: (row.amount_total as number | null) ?? null,
      currency: (row.currency as string | null) ?? null,
      source: row.source as string,
      note: (row.note as string | null) ?? null,
      granted_at: row.granted_at as string,
    });
    entitlementsByUser.set(userId, list);
  }

  return authUsers.map((u) => {
    const profile = profileById.get(u.id);
    return {
      id: u.id,
      email: u.email,
      full_name: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      role: profile?.role ?? 'standard',
      blocked: profile?.blocked ?? false,
      marketing_opt_in: profile?.marketing_opt_in ?? true,
      last_sign_in_at: u.last_sign_in_at,
      created_at: profile?.created_at ?? '',
      entitlements: entitlementsByUser.get(u.id) ?? [],
    };
  });
}
