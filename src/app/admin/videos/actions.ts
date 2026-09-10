'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { VideoRow } from '@/types/database';

function done() {
  revalidatePath('/');
  revalidatePath('/library');
  revalidatePath('/admin/videos');
  redirect('/admin/videos?saved=1');
}

export async function addVideo(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { data: existing } = await supabase.from('videos').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('videos').insert({
    title: (formData.get('title') as string) ?? '',
    youtube_id: (formData.get('youtube_id') as string) ?? '',
    duration: (formData.get('duration') as string) ?? '',
    sort_order: nextOrder,
    is_visible: true,
  });
  if (error) throw new Error(error.message);
  done();
}

export async function updateVideo(videoId: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from('videos')
    .update({
      title: (formData.get('title') as string) ?? '',
      youtube_id: (formData.get('youtube_id') as string) ?? '',
      duration: (formData.get('duration') as string) ?? '',
      is_visible: formData.get('is_visible') === 'on',
    })
    .eq('id', videoId);
  if (error) throw new Error(error.message);
  done();
}

export async function deleteVideo(videoId: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('videos').delete().eq('id', videoId);
  if (error) throw new Error(error.message);
  done();
}

export async function moveVideo(videoId: string, direction: 'up' | 'down') {
  await requireAdmin();
  const supabase = createClient();

  const { data: all } = await supabase.from('videos').select('*').order('sort_order');
  const list = (all as VideoRow[]) ?? [];
  const index = list.findIndex((v) => v.id === videoId);
  if (index === -1) return;
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= list.length) return;

  const a = list[index];
  const b = list[swapWith];

  await Promise.all([
    supabase.from('videos').update({ sort_order: b.sort_order }).eq('id', a.id),
    supabase.from('videos').update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);

  done();
}
