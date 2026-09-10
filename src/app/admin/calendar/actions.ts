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

export async function addSession(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('calendar_sessions')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('calendar_sessions').insert({
    label: (formData.get('label') as string) ?? '',
    topic: (formData.get('topic') as string) ?? '',
    location: (formData.get('location') as string) ?? '',
    date_text: (formData.get('date_text') as string) ?? '',
    status: (formData.get('status') as string) || 'Open',
    sort_order: nextOrder,
    is_visible: true,
  });
  if (error) throw new Error(error.message);
  done();
}

export async function updateSession(sessionId: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from('calendar_sessions')
    .update({
      label: (formData.get('label') as string) ?? '',
      topic: (formData.get('topic') as string) ?? '',
      location: (formData.get('location') as string) ?? '',
      date_text: (formData.get('date_text') as string) ?? '',
      status: (formData.get('status') as string) || 'Open',
      is_visible: formData.get('is_visible') === 'on',
    })
    .eq('id', sessionId);
  if (error) throw new Error(error.message);
  done();
}

export async function deleteSession(sessionId: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('calendar_sessions').delete().eq('id', sessionId);
  if (error) throw new Error(error.message);
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
