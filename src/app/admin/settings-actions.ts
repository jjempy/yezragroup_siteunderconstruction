'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const BRAND_FIELDS = [
  'brand_name',
  'logo_url',
  'color_gold',
  'color_gold_deep',
  'color_ink',
  'color_cream',
  'heading_font',
  'body_font',
] as const;

const CONTENT_FIELDS = [
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

type FieldSet = readonly string[];

async function updateSettings(formData: FormData, fields: FieldSet) {
  await requireAdmin();
  const supabase = createClient();

  const update: Record<string, string> = {};
  for (const key of fields) {
    update[key] = (formData.get(key) as string | null) ?? '';
  }

  const { error } = await supabase.from('site_settings').update(update).eq('id', 'default');
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin/brand');
  revalidatePath('/admin/content');
}

export async function updateBrandSettings(formData: FormData) {
  await updateSettings(formData, BRAND_FIELDS);
  redirect('/admin/brand?saved=1');
}

export async function updateContentSettings(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const update: Record<string, unknown> = {};
  for (const key of CONTENT_FIELDS) {
    update[key] = (formData.get(key) as string | null) ?? '';
  }

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
