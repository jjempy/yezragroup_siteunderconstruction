'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function updateVipApplicationStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  const supabase = createClient();
  await supabase.from('vip_applications').update({ status }).eq('id', id);

  revalidatePath('/admin/vip-applications');
}

/** A running internal log — meant to be appended to by hand over time
 * (dated entries the admin types themselves), not a structured
 * activity feed. Stands in for a real CRM (Airtable) until that's set
 * up; text has no length limit at the database level. */
export async function updateVipApplicationNotes(formData: FormData) {
  await requireAdmin();
  const id = formData.get('id') as string;
  const notes = (formData.get('notes') as string) ?? '';

  const supabase = createClient();
  await supabase.from('vip_applications').update({ notes }).eq('id', id);

  revalidatePath('/admin/vip-applications');
}
