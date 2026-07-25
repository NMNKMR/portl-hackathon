-- Reliable poll voting via SECURITY DEFINER RPC + tighter insert policy.

create or replace function public.cast_poll_vote(
  p_poll_id uuid,
  p_option_id uuid,
  p_membership_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_option_id uuid;
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
    from public.polls p
    where p.id = p_poll_id
      and p.society_id in (select public.my_society_ids())
      and (p.closes_at is null or p.closes_at > now())
  ) then
    raise exception 'poll closed or not found';
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
  values (p_poll_id, p_option_id, p_membership_id)
  on conflict (poll_id, membership_id) do nothing;

  select pv.option_id
  into v_option_id
  from public.poll_votes pv
  where pv.poll_id = p_poll_id
    and pv.membership_id = p_membership_id;

  return v_option_id;
end;
$$;

grant execute on function public.cast_poll_vote(uuid, uuid, uuid) to authenticated;

drop policy if exists "member casts vote" on public.poll_votes;

create policy "member casts vote" on public.poll_votes
  for insert with check (
    membership_id in (
      select id
      from public.memberships
      where user_id = auth.uid() and status = 'approved'
    )
    and exists (
      select 1
      from public.polls p
      where p.id = poll_id
        and p.society_id in (select public.my_society_ids())
        and (p.closes_at is null or p.closes_at > now())
    )
    and exists (
      select 1
      from public.poll_options po
      where po.id = option_id and po.poll_id = poll_id
    )
  );
