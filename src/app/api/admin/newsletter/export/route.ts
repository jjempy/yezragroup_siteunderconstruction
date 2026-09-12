import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV export of the lean newsletter_signups capture — this is the whole
 * migration path to a real ESP (Beehiiv): export here, import there. */
export async function GET() {
  await requireAdmin();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('newsletter_signups')
    .select('email, source, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = [['Email', 'Source', 'Signed Up']];
  (data ?? []).forEach((row) => {
    rows.push([row.email, row.source, row.created_at]);
  });

  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orchemet-newsletter-signups-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
