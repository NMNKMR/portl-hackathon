-- Household member join: flat join info + primary can approve household pending.
-- Run in Supabase SQL Editor after 003.

-- Join screen: does this flat already have a primary (pending or approved)?
create or replace function public.get_flat_join_info(p_flat_id uuid)
returns table (
  has_primary boolean,
  has_approved_primary boolean,
  primary_resident_type resident_type
)
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from memberships m
      where m.flat_id = p_flat_id
        and m.role = 'resident'
        and m.member_type = 'primary'
        and m.status in ('pending', 'approved')
    ) as has_primary,
    exists (
      select 1
      from memberships m
      where m.flat_id = p_flat_id
        and m.role = 'resident'
        and m.member_type = 'primary'
        and m.status = 'approved'
    ) as has_approved_primary,
    (
      select m.resident_type
      from memberships m
      where m.flat_id = p_flat_id
        and m.role = 'resident'
        and m.member_type = 'primary'
        and m.status in ('pending', 'approved')
      order by case when m.status = 'approved' then 0 else 1 end
      limit 1
    ) as primary_resident_type;
$$;

-- Primary's pending household queue for a flat they own/tenant as primary.
create or replace function public.list_pending_household(p_flat_id uuid)
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
      and m.flat_id = p_flat_id
      and m.role = 'resident'
      and m.member_type = 'primary'
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
  where m.flat_id = p_flat_id
    and m.status = 'pending'
    and m.member_type = 'household'
  order by m.created_at asc;
end;
$$;

-- Admin society pending: exclude household (those go to flat primary).
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
    and (m.member_type is null or m.member_type = 'primary')
  order by m.created_at asc;
end;
$$;

-- Flat ids where I am approved primary resident.
create or replace function public.my_primary_flat_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select flat_id
  from memberships
  where user_id = auth.uid()
    and role = 'resident'
    and member_type = 'primary'
    and status = 'approved'
    and flat_id is not null;
$$;

-- Primary can read memberships on their flats (see pending household).
drop policy if exists "primary reads flat memberships" on memberships;
create policy "primary reads flat memberships"
  on memberships for select
  using (flat_id in (select public.my_primary_flat_ids()));

-- Primary can approve/reject household pending on their flats.
drop policy if exists "primary manages household on their flat" on memberships;
create policy "primary manages household on their flat"
  on memberships for update
  using (
    flat_id in (select public.my_primary_flat_ids())
    and member_type = 'household'
  )
  with check (
    flat_id in (select public.my_primary_flat_ids())
    and member_type = 'household'
  );

grant execute on function public.get_flat_join_info(uuid) to authenticated;
grant execute on function public.list_pending_household(uuid) to authenticated;
grant execute on function public.my_primary_flat_ids() to authenticated;
grant execute on function public.list_pending_memberships(uuid) to authenticated;
