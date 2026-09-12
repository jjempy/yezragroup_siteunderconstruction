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
