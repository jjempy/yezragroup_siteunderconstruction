import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/types/database';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  await requireAdmin();

  const admin = createAdminClient();

  const { data: profiles, error } = await admin.from('profiles').select('*');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // auth.admin.listUsers() is paginated (default 50/page) — walk every page
  // so the export covers the whole user base, not just the first page.
  const emailById = new Map<string, string>();
  let page = 1;
  for (;;) {
    const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    data.users.forEach((u) => emailById.set(u.id, u.email ?? ''));
    if (data.users.length < 200) break;
    page += 1;
  }

  const rows = [['Name', 'Email', 'Phone', 'Marketing Opt-In']];
  (profiles as Profile[]).forEach((p) => {
    rows.push([
      p.full_name ?? '',
      emailById.get(p.id) ?? '',
      p.phone ?? '',
      p.marketing_opt_in ? 'yes' : 'no',
    ]);
  });

  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orchemet-users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
