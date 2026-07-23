-- Update list_flats_for_society to include optional block info (for joiners).
-- Run in Supabase SQL Editor after 001_create_society_rpc.sql
-- Must DROP first: Postgres cannot change OUT/return row type via CREATE OR REPLACE.

drop function if exists public.list_flats_for_society(uuid);

create function public.list_flats_for_society(p_society_id uuid)
returns table (
  id uuid,
  flat_number varchar,
  block_id uuid,
  block_name varchar
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id,
    f.flat_number,
    f.block_id,
    b.name as block_name
  from flats f
  left join blocks b on b.id = f.block_id
  where f.society_id = p_society_id
  order by b.name nulls first, f.flat_number;
$$;

grant execute on function public.list_flats_for_society(uuid) to authenticated;
