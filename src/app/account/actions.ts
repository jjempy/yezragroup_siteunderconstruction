'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/phone';

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

function failure(message: string): never {
  redirect(`/account?error=${encodeURIComponent(message)}`);
}

/** Lets a member fix their own name/phone in two clicks instead of it
 * being frozen at whatever they typed during signup. */
export async function updateProfileAction(formData: FormData) {
  const { user } = await requireUser();
  const supabase = createClient();

  const fullName = ((formData.get('full_name') as string) ?? '').trim();
  const phoneRaw = ((formData.get('phone') as string) ?? '').trim();

  const { value: phone, valid } = normalizePhone(phoneRaw);
  if (!valid) {
    failure("That phone number doesn't look right — check the area code and digits.");
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName || null, phone })
    .eq('id', user.id);

  if (error) failure(`Couldn't save: ${error.message}`);

  revalidatePath('/account');
  redirect('/account?saved=1');
}
