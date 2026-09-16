'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { uploadPublicImage } from '@/lib/storage';
import { updateDroppingMissingColumns } from '@/lib/safe-update';

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

const COLOR_FIELDS = new Set(['color_gold', 'color_gold_deep', 'color_ink', 'color_cream']);

// These get written straight into a CSS custom property (`--gold:${value}`
// in layout.tsx) — a hex value missing its leading "#" is invalid CSS, so
// the browser silently drops that one declaration and falls back to the
// hardcoded default, with no error anywhere. Normalizing here means a
// pasted "d5512b" behaves the same as "#d5512b" instead of quietly not
// applying at all.
function normalizeColor(value: string): string {
  const trimmed = value.trim();
  if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed}`;
  return trimmed;
}

const CONTENT_TEXT_FIELDS = [
  'hero_eyebrow',
  'hero_heading',
  'hero_lede',
  'calendar_eyebrow',
  'calendar_heading',
  'calendar_lede',
  'founder_photo_url',
  'contact_email',
  'contact_phone',
  'youtube_channel_url',
  'spotify_url',
  'ga4_measurement_id',
] as const;

// A thrown error from a Server Action renders Next's generic crash screen
// with no detail — useless for an admin trying to figure out why a save
// didn't do what they expected. Redirecting with the real message as a
// toast instead means a failure is always visible and readable.
function failure(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function updateBrandSettings(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const update: Record<string, unknown> = {};
  for (const key of BRAND_TEXT_FIELDS) {
    const raw = (formData.get(key) as string | null) ?? '';
    update[key] = COLOR_FIELDS.has(key) ? normalizeColor(raw) : raw;
  }
  update.hero_mark_url = (formData.get('hero_mark_url') as string | null) ?? '';
  const opacityRaw = Number(formData.get('hero_mark_opacity'));
  update.hero_mark_opacity = Number.isFinite(opacityRaw) ? Math.min(100, Math.max(0, Math.round(opacityRaw))) : 35;

  // An uploaded file always wins over whatever's in the URL text field —
  // that field stays as a manual/advanced fallback (e.g. pasting a link
  // to something already hosted elsewhere). Logo and hero mark are two
  // fully independent images/uploads — one is not derived from the other.
  const logoFile = formData.get('logo_file') as File | null;
  const { url: uploadedLogoUrl, error: logoUploadError } = await uploadPublicImage(supabase, logoFile, 'logos');
  if (logoUploadError) failure('/admin/brand', `Logo upload failed: ${logoUploadError}`);
  if (uploadedLogoUrl) update.logo_url = uploadedLogoUrl;

  const heroMarkFile = formData.get('hero_mark_file') as File | null;
  const { url: uploadedHeroMarkUrl, error: heroMarkUploadError } = await uploadPublicImage(
    supabase,
    heroMarkFile,
    'hero-mark'
  );
  if (heroMarkUploadError) failure('/admin/brand', `Hero mark upload failed: ${heroMarkUploadError}`);
  if (uploadedHeroMarkUrl) update.hero_mark_url = uploadedHeroMarkUrl;

  const { error } = await updateDroppingMissingColumns(supabase, 'site_settings', { id: 'default' }, update);
  if (error) failure('/admin/brand', `Save failed: ${error}`);

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
  if (uploadError) failure('/admin/content', `Photo upload failed: ${uploadError}`);
  if (uploadedPhotoUrl) update.founder_photo_url = uploadedPhotoUrl;

  // about_body comes in as one paragraph per line from a textarea.
  const aboutRaw = (formData.get('about_body') as string | null) ?? '';
  update.about_body = aboutRaw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const { error } = await updateDroppingMissingColumns(supabase, 'site_settings', { id: 'default' }, update);
  if (error) failure('/admin/content', `Save failed: ${error}`);

  revalidatePath('/');
  revalidatePath('/admin/content');
  redirect('/admin/content?saved=1');
}
