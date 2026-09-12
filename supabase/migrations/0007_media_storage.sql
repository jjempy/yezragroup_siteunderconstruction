-- Storage bucket for admin-uploaded public site images (logo, founder
-- photo). Public read (these are marketing-site assets meant to be seen
-- by anyone, no auth required) — but only an admin can upload/replace/
-- remove anything in it.
--
-- Deliberately scoped to public, non-sensitive assets only. If/when a
-- paid-downloadable-resource feature is built, that's a SEPARATE bucket
-- (e.g. 'paid-resources') with public = false, served through a signed
-- URL a server route generates only after checking the buyer's
-- entitlement — never through this bucket's public access.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin(auth.uid()));

create policy "media_admin_update"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_admin(auth.uid()));

create policy "media_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin(auth.uid()));
