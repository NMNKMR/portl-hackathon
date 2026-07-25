-- Resolve poll voter membership server-side (poll society + auth.uid()).
-- Ignores stale/wrong client membership ids instead of failing with "not allowed".

create or replace function public.cast_poll_vote(
  p_poll_id uuid,
  p_option_id uuid,
  p_membership_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_option_id uuid;
  v_membership_id uuid;
  v_society_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select p.society_id
  into v_society_id
  from public.polls p
  where p.id = p_poll_id
    and p.society_id in (select public.my_society_ids())
    and (p.closes_at is null or p.closes_at > now());

  if v_society_id is null then
    raise exception 'poll closed or not found';
  end if;

  select m.id
  into v_membership_id
  from public.memberships m
  where m.user_id = auth.uid()
    and m.society_id = v_society_id
    and m.status = 'approved'
  order by
    case m.role
      when 'resident' then 0
      when 'admin' then 1
      when 'guard' then 2
      else 3
    end,
    m.created_at desc
  limit 1;

  if p_membership_id is not null and exists (
    select 1
    from public.memberships m
    where m.id = p_membership_id
      and m.user_id = auth.uid()
      and m.society_id = v_society_id
      and m.status = 'approved'
  ) then
    v_membership_id := p_membership_id;
  end if;

  if v_membership_id is null then
    raise exception 'not allowed';
  end if;

  if not exists (
    select 1
    from public.poll_options po
    where po.id = p_option_id
      and po.poll_id = p_poll_id
  ) then
    raise exception 'invalid option';
  end if;

  insert into public.poll_votes (poll_id, option_id, membership_id)
  values (p_poll_id, p_option_id, v_membership_id)
  on conflict (poll_id, membership_id) do nothing;

  select pv.option_id
  into v_option_id
  from public.poll_votes pv
  where pv.poll_id = p_poll_id
    and pv.membership_id = v_membership_id;

  return v_option_id;
end;
$$;

grant execute on function public.cast_poll_vote(uuid, uuid, uuid) to authenticated;
