'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { CalendarSession } from '@/types/database';

function done() {
  revalidatePath('/');
  revalidatePath('/admin/calendar');
  redirect('/admin/calendar?saved=1');
}

// A thrown error from a Server Action just crashes to Next's generic error
// screen with no detail — redirect with the real message as a toast
// instead so a failure (e.g. a migration that hasn't been run yet) is
// actually visible and diagnosable, not a dead end.
function failure(message: string): never {
  redirect(`/admin/calendar?error=${encodeURIComponent(message)}`);
}

// If the 0008 migration (adding calendar_sessions.session_date) hasn't
// been run against this Supabase project yet, any write that includes it
// fails outright — which used to crash the whole page. Detect that one
// specific, recognizable case and retry without the column so the rest of
// the form still saves; every other error still surfaces as a toast.
function isMissingColumn(message: string, column: string) {
  return message.includes(column) && (message.includes('column') || message.includes('schema cache'));
}

function parseCapacity(formData: FormData): number | null {
  const raw = (formData.get('capacity') as string) ?? '';
  if (!raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

export async function addSession(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('calendar_sessions')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const row: Record<string, unknown> = {
    label: (formData.get('label') as string) ?? '',
    topic: (formData.get('topic') as string) ?? '',
    location: (formData.get('location') as string) ?? '',
    date_text: (formData.get('date_text') as string) ?? '',
    session_date: (formData.get('session_date') as string) || null,
    capacity: parseCapacity(formData),
    status: (formData.get('status') as string) || 'Open',
    sort_order: nextOrder,
    is_visible: true,
  };

  let { error } = await supabase.from('calendar_sessions').insert(row);
  if (error && isMissingColumn(error.message, 'session_date')) {
    delete row.session_date;
    ({ error } = await supabase.from('calendar_sessions').insert(row));
  }
  if (error && isMissingColumn(error.message, 'capacity')) {
    delete row.capacity;
    ({ error } = await supabase.from('calendar_sessions').insert(row));
  }
  if (error) failure(`Couldn't add session: ${error.message}`);
  done();
}

export async function updateSession(sessionId: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const row: Record<string, unknown> = {
    label: (formData.get('label') as string) ?? '',
    topic: (formData.get('topic') as string) ?? '',
    location: (formData.get('location') as string) ?? '',
    date_text: (formData.get('date_text') as string) ?? '',
    session_date: (formData.get('session_date') as string) || null,
    capacity: parseCapacity(formData),
    status: (formData.get('status') as string) || 'Open',
    is_visible: formData.get('is_visible') === 'on',
  };

  let { error } = await supabase.from('calendar_sessions').update(row).eq('id', sessionId);
  if (error && isMissingColumn(error.message, 'session_date')) {
    delete row.session_date;
    ({ error } = await supabase.from('calendar_sessions').update(row).eq('id', sessionId));
  }
  if (error && isMissingColumn(error.message, 'capacity')) {
    delete row.capacity;
    ({ error } = await supabase.from('calendar_sessions').update(row).eq('id', sessionId));
  }
  if (error) failure(`Couldn't save session: ${error.message}`);
  done();
}

export async function deleteSession(sessionId: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('calendar_sessions').delete().eq('id', sessionId);
  if (error) failure(`Couldn't remove session: ${error.message}`);
  done();
}

export async function moveSession(sessionId: string, direction: 'up' | 'down') {
  await requireAdmin();
  const supabase = createClient();

  const { data: all } = await supabase.from('calendar_sessions').select('*').order('sort_order');
  const list = (all as CalendarSession[]) ?? [];
  const index = list.findIndex((s) => s.id === sessionId);
  if (index === -1) return;
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= list.length) return;

  const a = list[index];
  const b = list[swapWith];

  await Promise.all([
    supabase.from('calendar_sessions').update({ sort_order: b.sort_order }).eq('id', a.id),
    supabase.from('calendar_sessions').update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);

  done();
}
