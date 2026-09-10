'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { LadderSlug } from '@/types/database';

// Maps a tier's slug to the site_settings column holding its checkout /
// intake link, for the tiers whose href isn't a plain in-page anchor.
const LINK_FIELD: Partial<Record<LadderSlug, string>> = {
  workshop_library: 'stripe_workshop_library_url',
  audit_room: 'stripe_group_masterclass_url',
  scoped_engagement: 'scoped_engagement_url',
  vip: 'vip_application_url',
};

export async function updateTier(tierId: string, slug: LadderSlug, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from('ladder_tiers')
    .update({
      title: (formData.get('title') as string) ?? '',
      description: (formData.get('description') as string) ?? '',
      price_label: (formData.get('price_label') as string) ?? '',
      price_sub_label: (formData.get('price_sub_label') as string) ?? '',
      cta_label: (formData.get('cta_label') as string) ?? '',
      is_visible: formData.get('is_visible') === 'on',
    })
    .eq('id', tierId);
  if (error) throw new Error(error.message);

  const linkField = LINK_FIELD[slug];
  if (linkField) {
    const link = (formData.get('link') as string) ?? '';
    const { error: linkError } = await supabase
      .from('site_settings')
      .update({ [linkField]: link })
      .eq('id', 'default');
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath('/');
  revalidatePath('/admin/ladder');
  redirect('/admin/ladder?saved=1');
}
