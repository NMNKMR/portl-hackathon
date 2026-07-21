-- Portl: create_society RPC (run in Supabase SQL Editor after schema.sql)
-- Creates society + approved admin membership for the caller.

create or replace function public.create_society(
  p_name text,
  p_plan society_plan default 'free'
)
returns table (
  id uuid,
  name varchar,
  code varchar,
  plan society_plan
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_society societies%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Society name is required';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from societies s where s.code = v_code);
  end loop;

  insert into societies (name, code, plan)
  values (trim(p_name), v_code, coalesce(p_plan, 'free'))
  returning * into v_society;

  insert into memberships (user_id, society_id, role, status)
  values (auth.uid(), v_society.id, 'admin', 'approved');

  return query
    select v_society.id, v_society.name, v_society.code, v_society.plan;
end;
$$;

grant execute on function public.create_society(text, society_plan) to authenticated;
grant execute on function public.lookup_society_by_code(text) to authenticated;

create or replace function public.list_flats_for_society(p_society_id uuid)
returns table (id uuid, flat_number varchar)
language sql
stable
security definer
set search_path = public
as $$
  select f.id, f.flat_number
  from flats f
  where f.society_id = p_society_id
  order by f.flat_number;
$$;

grant execute on function public.list_flats_for_society(uuid) to authenticated;
