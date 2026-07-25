-- Staff categories: ensure all approved society members can SELECT categories.
-- Split admin write policies out of FOR ALL so read is never ambiguous.
-- Run in Supabase SQL Editor after 007.

alter table public.staff_categories enable row level security;

drop policy if exists "members read staff categories" on public.staff_categories;
drop policy if exists "admin manages staff categories" on public.staff_categories;
drop policy if exists "approved members read staff categories" on public.staff_categories;
drop policy if exists "admin inserts staff categories" on public.staff_categories;
drop policy if exists "admin updates staff categories" on public.staff_categories;
drop policy if exists "admin deletes staff categories" on public.staff_categories;

create policy "approved members read staff categories"
  on public.staff_categories for select
  using (
    society_id is null
    or society_id in (select public.my_society_ids())
  );

create policy "admin inserts staff categories"
  on public.staff_categories for insert
  with check (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

create policy "admin updates staff categories"
  on public.staff_categories for update
  using (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  )
  with check (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

create policy "admin deletes staff categories"
  on public.staff_categories for delete
  using (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );
