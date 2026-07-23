-- Join-phase RLS fix + admin pending queue RPC
-- Pending members could not read societies/flats (my_society_ids is approved-only),
-- so hub pending cards lacked society name / flat. Fix SELECT to any membership status.
-- Writes stay gated by approved my_society_ids() + admin role.

create or replace function public.my_membership_society_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct society_id
  from memberships
  where user_id = auth.uid();
$$;

drop policy if exists "society members can read their society" on societies;
create policy "society members can read their society"
  on societies for select
  using (id in (select public.my_membership_society_ids()));

drop policy if exists "members can read blocks" on blocks;
create policy "members can read blocks" on blocks for select
  using (society_id in (select public.my_membership_society_ids()));

drop policy if exists "members can read flats" on flats;
create policy "members can read flats" on flats for select
  using (society_id in (select public.my_membership_society_ids()));

-- Rich pending queue for admins (avoids sparse embeds / null names).
create or replace function public.list_pending_memberships(p_society_id uuid)
returns table (
  id uuid,
  role membership_role,
  resident_type resident_type,
  member_type resident_member_type,
  created_at timestamptz,
  full_name varchar,
  phone varchar,
  flat_number varchar,
  block_name varchar
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from memberships m
    where m.user_id = auth.uid()
      and m.society_id = p_society_id
      and m.role = 'admin'
      and m.status = 'approved'
  ) then
    raise exception 'Not allowed';
  end if;

  return query
  select
    m.id,
    m.role,
    m.resident_type,
    m.member_type,
    m.created_at,
    u.full_name,
    u.phone,
    f.flat_number,
    b.name as block_name
  from memberships m
  left join users u on u.id = m.user_id
  left join flats f on f.id = m.flat_id
  left join blocks b on b.id = f.block_id
  where m.society_id = p_society_id
    and m.status = 'pending'
  order by m.created_at asc;
end;
$$;

grant execute on function public.my_membership_society_ids() to authenticated;
grant execute on function public.list_pending_memberships(uuid) to authenticated;
