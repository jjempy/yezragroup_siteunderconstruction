-- Fixes a real bug: enforce_profile_self_update() was reverting role/
-- blocked changes made directly via the SQL Editor (or any service-role
-- write), because auth.uid() is null outside an authenticated app
-- request — and is_admin(null) is always false — so the trigger read
-- every direct SQL update as "a non-admin trying to self-promote" and
-- silently undid it. This is exactly why the documented "make yourself
-- admin" SQL Editor step appeared to succeed but never actually applied.
-- Now the restriction only applies when there's a real signed-in app
-- user (auth.uid() is not null) who isn't already an admin.
create or replace function public.enforce_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    new.role := old.role;
    new.blocked := old.blocked;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
