-- Idempotent notice read + creator-only notice edit + resident own-complaint edit

create or replace function public.mark_notice_read(
  p_notice_id uuid,
  p_membership_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_read_at timestamptz;
begin
  if not exists (
    select 1
    from public.memberships m
    where m.id = p_membership_id
      and m.user_id = auth.uid()
      and m.status = 'approved'
  ) then
    raise exception 'not allowed';
  end if;

  if not exists (
    select 1
    from public.notices n
    where n.id = p_notice_id
      and n.society_id in (select public.my_society_ids())
  ) then
    raise exception 'notice not found';
  end if;

  insert into public.notice_reads (notice_id, membership_id, read_at)
  values (p_notice_id, p_membership_id, now())
  on conflict (notice_id, membership_id) do nothing;

  select nr.read_at
  into v_read_at
  from public.notice_reads nr
  where nr.notice_id = p_notice_id
    and nr.membership_id = p_membership_id;

  return v_read_at;
end;
$$;

grant execute on function public.mark_notice_read(uuid, uuid) to authenticated;

-- Notices: admins compose; only the poster may edit content
drop policy if exists "admin manages notices" on public.notices;

create policy "admin inserts notices" on public.notices
  for insert with check (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

create policy "creator updates own notices" on public.notices
  for update using (
    posted_by_membership_id in (
      select id
      from public.memberships
      where user_id = auth.uid() and status = 'approved'
    )
  )
  with check (
    posted_by_membership_id in (
      select id
      from public.memberships
      where user_id = auth.uid() and status = 'approved'
    )
  );

-- Complaints: residents may edit complaints they raised (status changes stay admin-only in UI)
drop policy if exists "resident updates own complaints" on public.complaints;

create policy "resident updates own complaints" on public.complaints
  for update using (
    raised_by_membership_id in (
      select id
      from public.memberships
      where user_id = auth.uid() and status = 'approved'
    )
  )
  with check (
    raised_by_membership_id in (
      select id
      from public.memberships
      where user_id = auth.uid() and status = 'approved'
    )
  );
