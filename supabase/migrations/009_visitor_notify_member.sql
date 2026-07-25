-- Guard picks which flat member gets the visitor-waiting push.
-- Also: security-definer RPC so guards can list approved residents for a flat.

alter table public.visitor_requests
  add column if not exists notify_membership_id uuid references public.memberships(id);

create index if not exists visitor_requests_notify_membership_id_idx
  on public.visitor_requests (notify_membership_id);

-- Prefer migration 010 if you already ran an older 009 — it replaces this RPC.
create or replace function public.list_flat_residents_for_gate(p_flat_id uuid)
returns table (
  membership_id uuid,
  user_id uuid,
  full_name text,
  phone text,
  member_type text,
  resident_type text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_society_id uuid;
begin
  select f.society_id into v_society_id
  from public.flats f
  where f.id = p_flat_id;

  if v_society_id is null then
    raise exception 'Flat not found';
  end if;

  if not exists (
    select 1
    from public.memberships gm
    where gm.user_id = auth.uid()
      and gm.society_id = v_society_id
      and gm.status = 'approved'
      and gm.role in ('guard', 'admin')
  ) then
    raise exception 'Not allowed';
  end if;

  return query
  select
    m.id as membership_id,
    m.user_id as user_id,
    coalesce(u.full_name, '')::text as full_name,
    coalesce(u.phone, '')::text as phone,
    coalesce(m.member_type::text, '') as member_type,
    coalesce(m.resident_type::text, '') as resident_type
  from public.memberships m
  left join public.users u on u.id = m.user_id
  where m.flat_id = p_flat_id
    and m.role = 'resident'
    and m.status = 'approved'
  order by
    case when m.member_type = 'primary' then 0 else 1 end,
    m.created_at;
end;
$$;

grant execute on function public.list_flat_residents_for_gate(uuid) to authenticated;
grant execute on function public.list_flat_residents_for_gate(uuid) to service_role;
