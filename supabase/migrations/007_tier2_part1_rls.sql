-- Tier 2 Part 1: pre-approval scans, staff pass tokens, RLS for Tier 2 tables.
-- Run in Supabase SQL Editor after 005/006.

-- ---- visitor_requests: multi-entry party passes ----
alter table public.visitor_requests
  add column if not exists max_scans int not null default 1;

alter table public.visitor_requests
  add column if not exists scan_count int not null default 0;

alter table public.visitor_requests
  drop constraint if exists visitor_requests_max_scans_check;

alter table public.visitor_requests
  add constraint visitor_requests_max_scans_check
  check (max_scans >= 1 and scan_count >= 0 and scan_count <= max_scans);

-- Resident can create pre-approvals for their own flat
drop policy if exists "resident inserts own flat visitor_requests" on public.visitor_requests;
create policy "resident inserts own flat visitor_requests"
  on public.visitor_requests for insert
  with check (
    flat_id in (select public.my_flat_ids())
    and initiated_by = 'resident'
  );

-- ---- staff_directory pass token ----
alter table public.staff_directory
  add column if not exists pass_token uuid unique default gen_random_uuid();

update public.staff_directory
set pass_token = gen_random_uuid()
where pass_token is null;

alter table public.staff_directory
  alter column pass_token set not null;

alter table public.staff_directory
  alter column pass_token set default gen_random_uuid();

-- ---- staff_categories RLS ----
drop policy if exists "members read staff categories" on public.staff_categories;
drop policy if exists "admin manages staff categories" on public.staff_categories;

create policy "members read staff categories" on public.staff_categories
  for select using (
    society_id is null
    or society_id in (select public.my_society_ids())
  );

create policy "admin manages staff categories" on public.staff_categories
  for all using (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  )
  with check (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

-- ---- staff_directory RLS ----
drop policy if exists "members read staff directory" on public.staff_directory;
drop policy if exists "admin manages staff directory" on public.staff_directory;
drop policy if exists "resident manages flat staff" on public.staff_directory;
drop policy if exists "guard reads staff directory" on public.staff_directory;

create policy "members read staff directory" on public.staff_directory
  for select using (society_id in (select public.my_society_ids()));

create policy "admin manages staff directory" on public.staff_directory
  for all using (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  )
  with check (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

create policy "resident manages flat staff" on public.staff_directory
  for all using (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'resident'
    and (flat_id is null or flat_id in (select public.my_flat_ids()))
  )
  with check (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'resident'
    and (flat_id is null or flat_id in (select public.my_flat_ids()))
  );

-- ---- complaints RLS ----
drop policy if exists "members read complaints" on public.complaints;
drop policy if exists "resident inserts complaints" on public.complaints;
drop policy if exists "admin updates complaints" on public.complaints;
drop policy if exists "resident reads own flat complaints" on public.complaints;

create policy "resident reads own flat complaints" on public.complaints
  for select using (flat_id in (select public.my_flat_ids()));

create policy "admin reads society complaints" on public.complaints
  for select using (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

create policy "resident inserts complaints" on public.complaints
  for insert with check (
    flat_id in (select public.my_flat_ids())
    and society_id in (select public.my_society_ids())
  );

create policy "admin updates complaints" on public.complaints
  for update using (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

-- ---- notices RLS ----
drop policy if exists "members read notices" on public.notices;
drop policy if exists "admin manages notices" on public.notices;
drop policy if exists "members manage own notice reads" on public.notice_reads;
drop policy if exists "members read own notice reads" on public.notice_reads;

create policy "members read notices" on public.notices
  for select using (society_id in (select public.my_society_ids()));

create policy "admin manages notices" on public.notices
  for all using (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  )
  with check (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

create policy "members read own notice reads" on public.notice_reads
  for select using (
    membership_id in (
      select id from public.memberships where user_id = auth.uid()
    )
  );

create policy "members insert own notice reads" on public.notice_reads
  for insert with check (
    membership_id in (
      select id from public.memberships where user_id = auth.uid()
    )
  );
