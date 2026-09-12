'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Testimonial } from '@/types/database';

function done() {
  revalidatePath('/');
  revalidatePath('/admin/testimonials');
  redirect('/admin/testimonials?saved=1');
}

export async function addTestimonial(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('testimonials')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('testimonials').insert({
    quote: (formData.get('quote') as string) ?? '',
    name: (formData.get('name') as string) ?? '',
    title: (formData.get('title') as string) ?? '',
    company: (formData.get('company') as string) ?? '',
    sort_order: nextOrder,
    is_visible: true,
  });
  if (error) throw new Error(error.message);
  done();
}

export async function updateTestimonial(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from('testimonials')
    .update({
      quote: (formData.get('quote') as string) ?? '',
      name: (formData.get('name') as string) ?? '',
      title: (formData.get('title') as string) ?? '',
      company: (formData.get('company') as string) ?? '',
      is_visible: formData.get('is_visible') === 'on',
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  done();
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  done();
}

export async function moveTestimonial(id: string, direction: 'up' | 'down') {
  await requireAdmin();
  const supabase = createClient();

  const { data: all } = await supabase.from('testimonials').select('*').order('sort_order');
  const list = (all as Testimonial[]) ?? [];
  const index = list.findIndex((t) => t.id === id);
  if (index === -1) return;
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= list.length) return;

  const a = list[index];
  const b = list[swapWith];

  await Promise.all([
    supabase.from('testimonials').update({ sort_order: b.sort_order }).eq('id', a.id),
    supabase.from('testimonials').update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);

  done();
}
