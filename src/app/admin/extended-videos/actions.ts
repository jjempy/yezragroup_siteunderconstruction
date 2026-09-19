'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { PaidVideoRow } from '@/types/database';
import { extractYouTubeId } from '@/lib/youtube';

// Extended Videos merged into the Videos page (see AdminNav /
// admin/videos/page.tsx) — this file stays at its original path since
// server actions don't need to live next to the page that calls them,
// but every redirect/revalidate target below now points at the merged
// page instead of this now-retired route.
function done() {
  revalidatePath('/library');
  revalidatePath('/admin/videos');
  redirect('/admin/videos?saved=1');
}

export async function addPaidVideo(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('paid_videos')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('paid_videos').insert({
    title: (formData.get('title') as string) ?? '',
    youtube_id: extractYouTubeId((formData.get('youtube_id') as string) ?? ''),
    duration: (formData.get('duration') as string) ?? '',
    preview_seconds: Number(formData.get('preview_seconds')) || 45,
    sort_order: nextOrder,
    is_visible: true,
  });
  if (error) throw new Error(error.message);
  done();
}

export async function updatePaidVideo(videoId: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from('paid_videos')
    .update({
      title: (formData.get('title') as string) ?? '',
      youtube_id: extractYouTubeId((formData.get('youtube_id') as string) ?? ''),
      duration: (formData.get('duration') as string) ?? '',
      preview_seconds: Number(formData.get('preview_seconds')) || 45,
      is_visible: formData.get('is_visible') === 'on',
    })
    .eq('id', videoId);
  if (error) throw new Error(error.message);
  done();
}

export async function deletePaidVideo(videoId: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('paid_videos').delete().eq('id', videoId);
  if (error) throw new Error(error.message);
  done();
}

export async function movePaidVideo(videoId: string, direction: 'up' | 'down') {
  await requireAdmin();
  const supabase = createClient();

  const { data: all } = await supabase.from('paid_videos').select('*').order('sort_order');
  const list = (all as PaidVideoRow[]) ?? [];
  const index = list.findIndex((v) => v.id === videoId);
  if (index === -1) return;
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= list.length) return;

  const a = list[index];
  const b = list[swapWith];

  await Promise.all([
    supabase.from('paid_videos').update({ sort_order: b.sort_order }).eq('id', a.id),
    supabase.from('paid_videos').update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);

  done();
}
