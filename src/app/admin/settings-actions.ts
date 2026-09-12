'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { uploadPublicImage } from '@/lib/storage';

const BRAND_TEXT_FIELDS = [
  'brand_name',
  'logo_url',
  'color_gold',
  'color_gold_deep',
  'color_ink',
  'color_cream',
  'heading_font',
  'body_font',
] as const;

const CONTENT_TEXT_FIELDS = [
  'hero_eyebrow',
  'hero_heading',
  'hero_lede',
  'founder_photo_url',
  'contact_email',
  'contact_phone',
  'youtube_channel_url',
  'spotify_url',
  'ga4_measurement_id',
] as const;

export async function updateBrandSettings(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const update: Record<string, string> = {};
  for (const key of BRAND_TEXT_FIELDS) {
    update[key] = (formData.get(key) as string | null) ?? '';
  }

  // An uploaded file always wins over whatever's in the URL text field —
  // that field stays as a manual/advanced fallback (e.g. pasting a link
  // to something already hosted elsewhere).
  const logoFile = formData.get('logo_file') as File | null;
  const { url: uploadedLogoUrl, error: uploadError } = await uploadPublicImage(supabase, logoFile, 'logos');
  if (uploadError) throw new Error(uploadError);
  if (uploadedLogoUrl) update.logo_url = uploadedLogoUrl;

  const { error } = await supabase.from('site_settings').update(update).eq('id', 'default');
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin/brand');
  redirect('/admin/brand?saved=1');
}

export async function updateContentSettings(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const update: Record<string, unknown> = {};
  for (const key of CONTENT_TEXT_FIELDS) {
    update[key] = (formData.get(key) as string | null) ?? '';
  }

  const photoFile = formData.get('founder_photo_file') as File | null;
  const { url: uploadedPhotoUrl, error: uploadError } = await uploadPublicImage(
    supabase,
    photoFile,
    'founder-photo'
  );
  if (uploadError) throw new Error(uploadError);
  if (uploadedPhotoUrl) update.founder_photo_url = uploadedPhotoUrl;

  // about_body comes in as one paragraph per line from a textarea.
  const aboutRaw = (formData.get('about_body') as string | null) ?? '';
  update.about_body = aboutRaw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const { error } = await supabase.from('site_settings').update(update).eq('id', 'default');
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin/content');
  redirect('/admin/content?saved=1');
}
