'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { LadderSlug } from '@/types/database';

// Maps an offer's slug to the site_settings column holding its checkout /
// intake link, for the ones whose href isn't a plain in-page anchor.
const LINK_FIELD: Partial<Record<LadderSlug, string>> = {
  workshop_library: 'stripe_workshop_library_url',
  audit_room: 'stripe_group_masterclass_url',
  scoped_engagement: 'scoped_engagement_url',
  // vip intentionally omitted — see the matching comment in page.tsx.
};

// A thrown error from a Server Action crashes to Next's generic error
// screen with no detail — redirect with the real message as a toast
// instead so a failure (e.g. a migration that hasn't been run yet) is
// visible and diagnosable, not a dead end.
function failure(message: string): never {
  redirect(`/admin/offers?error=${encodeURIComponent(message)}`);
}

function isMissingColumn(message: string, column: string) {
  return message.includes(column) && (message.includes('column') || message.includes('schema cache'));
}

export async function updateTier(tierId: string, slug: LadderSlug, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const row: Record<string, unknown> = {
    title: (formData.get('title') as string) ?? '',
    description: (formData.get('description') as string) ?? '',
    price_label: (formData.get('price_label') as string) ?? '',
    price_sub_label: (formData.get('price_sub_label') as string) ?? '',
    cta_label: (formData.get('cta_label') as string) ?? '',
    is_visible: formData.get('is_visible') === 'on',
    sold_out: formData.get('sold_out') === 'on',
    sold_out_message: (formData.get('sold_out_message') as string) ?? '',
  };

  let { error } = await supabase.from('ladder_tiers').update(row).eq('id', tierId);
  // The 0016 migration (sold_out / sold_out_message) not run yet against
  // this Supabase project shouldn't block saving everything else on this
  // form — retry without those two fields rather than crashing the save.
  if (error && (isMissingColumn(error.message, 'sold_out') || isMissingColumn(error.message, 'sold_out_message'))) {
    delete row.sold_out;
    delete row.sold_out_message;
    ({ error } = await supabase.from('ladder_tiers').update(row).eq('id', tierId));
  }
  if (error) failure(`Couldn't save: ${error.message}`);

  const linkField = LINK_FIELD[slug];
  if (linkField) {
    const link = (formData.get('link') as string) ?? '';
    const { error: linkError } = await supabase
      .from('site_settings')
      .update({ [linkField]: link })
      .eq('id', 'default');
    if (linkError) failure(`Couldn't save link: ${linkError.message}`);
  }

  revalidatePath('/');
  revalidatePath('/admin/offers');
  redirect('/admin/offers?saved=1');
}
