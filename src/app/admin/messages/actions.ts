'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function updateMessageStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  const supabase = createClient();
  await supabase.from('contact_messages').update({ status }).eq('id', id);

  revalidatePath('/admin/messages');
}
