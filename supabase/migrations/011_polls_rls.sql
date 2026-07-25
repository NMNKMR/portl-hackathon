-- Polls RLS: members read; admin creates; creator/admin closes; members vote once.
-- Run in Supabase SQL Editor after 007_tier2_part1_rls.sql.

-- ---- polls ----
drop policy if exists "members read polls" on public.polls;
drop policy if exists "admin manages polls" on public.polls;
drop policy if exists "admin creates polls" on public.polls;
drop policy if exists "creator or admin closes poll" on public.polls;

create policy "members read polls" on public.polls
  for select using (society_id in (select public.my_society_ids()));

create policy "admin creates polls" on public.polls
  for insert with check (
    society_id in (select public.my_society_ids())
    and public.my_role_in_society(society_id) = 'admin'
  );

create policy "creator or admin closes poll" on public.polls
  for update using (
    society_id in (select public.my_society_ids())
    and (
      public.my_role_in_society(society_id) = 'admin'
      or created_by_membership_id in (
        select id from public.memberships where user_id = auth.uid()
      )
    )
  );

-- ---- poll_options ----
drop policy if exists "members read poll options" on public.poll_options;
drop policy if exists "admin inserts poll options" on public.poll_options;

create policy "members read poll options" on public.poll_options
  for select using (
    poll_id in (
      select id from public.polls
      where society_id in (select public.my_society_ids())
    )
  );

create policy "admin inserts poll options" on public.poll_options
  for insert with check (
    poll_id in (
      select id from public.polls
      where society_id in (select public.my_society_ids())
        and public.my_role_in_society(society_id) = 'admin'
    )
  );

-- ---- poll_votes ----
drop policy if exists "members read poll votes" on public.poll_votes;
drop policy if exists "member casts vote" on public.poll_votes;

create policy "members read poll votes" on public.poll_votes
  for select using (
    poll_id in (
      select id from public.polls
      where society_id in (select public.my_society_ids())
    )
  );

create policy "member casts vote" on public.poll_votes
  for insert with check (
    membership_id in (
      select id from public.memberships where user_id = auth.uid()
    )
    and poll_id in (
      select id from public.polls
      where society_id in (select public.my_society_ids())
        and (closes_at is null or closes_at > now())
    )
  );
