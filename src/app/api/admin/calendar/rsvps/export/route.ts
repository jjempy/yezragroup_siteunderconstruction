import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { CalendarSession, MasterclassRsvp } from '@/types/database';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV export of every masterclass RSVP across every session — filter/sort
 * in a spreadsheet once it's downloaded rather than building that here. */
export async function GET() {
  await requireAdmin();
  const supabase = createClient();

  const [{ data: rsvps, error }, { data: sessions }] = await Promise.all([
    supabase.from('masterclass_rsvps').select('*').order('created_at', { ascending: false }),
    supabase.from('calendar_sessions').select('id, label, topic'),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sessionById = new Map(
    ((sessions as Pick<CalendarSession, 'id' | 'label' | 'topic'>[]) ?? []).map((s) => [s.id, s])
  );

  const rows = [['Session', 'Name', 'Email', 'Phone', 'RSVP Date']];
  ((rsvps as MasterclassRsvp[]) ?? []).forEach((r) => {
    const session = sessionById.get(r.calendar_session_id);
    const sessionLabel = session ? `${session.label} — ${session.topic}` : '(deleted session)';
    rows.push([sessionLabel, r.full_name, r.email, r.phone, r.created_at]);
  });

  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orchemet-masterclass-rsvps-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
