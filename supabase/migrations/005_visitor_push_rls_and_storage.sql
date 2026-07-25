-- Push token RLS + public visitor-photos storage bucket.
-- Run in Supabase SQL Editor after schema.sql (visitor_requests / push_tokens already exist).

-- ============================================================
-- push_tokens — users manage their own device tokens
-- ============================================================
drop policy if exists "users select own push_tokens" on push_tokens;
drop policy if exists "users insert own push_tokens" on push_tokens;
drop policy if exists "users update own push_tokens" on push_tokens;
drop policy if exists "users delete own push_tokens" on push_tokens;

create policy "users select own push_tokens" on push_tokens
  for select using (user_id = auth.uid());

create policy "users insert own push_tokens" on push_tokens
  for insert with check (user_id = auth.uid());

create policy "users update own push_tokens" on push_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users delete own push_tokens" on push_tokens
  for delete using (user_id = auth.uid());

-- Unique token per user (upsert from client)
create unique index if not exists push_tokens_user_token_uidx
  on push_tokens (user_id, expo_push_token);

-- ============================================================
-- Storage: visitor-photos (public for Tier 1 demo speed)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'visitor-photos',
  'visitor-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated upload visitor photos" on storage.objects;
drop policy if exists "public read visitor photos" on storage.objects;
drop policy if exists "owners update visitor photos" on storage.objects;
drop policy if exists "owners delete visitor photos" on storage.objects;

create policy "authenticated upload visitor photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'visitor-photos');

create policy "public read visitor photos" on storage.objects
  for select
  using (bucket_id = 'visitor-photos');

create policy "owners update visitor photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'visitor-photos' and owner = auth.uid())
  with check (bucket_id = 'visitor-photos' and owner = auth.uid());

create policy "owners delete visitor photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'visitor-photos' and owner = auth.uid());
