import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — plenty for a logo/headshot photo

/**
 * Uploads an admin-provided image (logo, founder photo, etc.) to the
 * public 'media' storage bucket and returns its public URL. Returns null
 * if no file was actually chosen (the caller should fall back to keeping
 * whatever URL is already saved).
 */
export async function uploadPublicImage(
  supabase: SupabaseClient,
  file: File | null,
  folder: string
): Promise<{ url: string | null; error: string | null }> {
  if (!file || file.size === 0) return { url: null, error: null };

  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'That file is not an image — please choose a JPG, PNG, SVG, or WebP.' };
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: 'That image is too large — please use a file under 8MB.' };
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

const FONT_EXTENSIONS: Record<string, string> = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };

/**
 * Uploads a custom font file (for a typeface that isn't on Google Fonts —
 * e.g. a purchased display font) to the same public 'media' bucket. Font
 * files are validated by extension, not file.type: browsers report wildly
 * inconsistent MIME types for fonts (often generic application/octet-stream),
 * so trusting file.type the way uploadPublicImage does would reject valid
 * uploads more often than it'd catch bad ones.
 */
export async function uploadPublicFontFile(
  supabase: SupabaseClient,
  file: File | null,
  folder: string
): Promise<{ url: string | null; error: string | null }> {
  if (!file || file.size === 0) return { url: null, error: null };

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const contentType = FONT_EXTENSIONS[ext];
  if (!contentType) {
    return { url: null, error: 'That file is not a font — please choose a .woff2, .woff, .ttf, or .otf file.' };
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: 'That font file is too large — please use a file under 8MB.' };
  }

  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType, upsert: false });
  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
