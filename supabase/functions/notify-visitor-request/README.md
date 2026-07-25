# `notify-visitor-request`

Supabase Edge Function: on `visitor_requests` **INSERT**, look up approved residents for that flat, load their Expo push tokens, and send a notification via the Expo Push API.

**Prereq:** run migration `supabase/migrations/005_visitor_push_rls_and_storage.sql` first (push_tokens RLS + visitor-photos bucket).

## Deploy

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project):

```bash
supabase functions deploy notify-visitor-request
```

## Secrets

Hosted functions usually already have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Confirm / set:

```bash
supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Optional (only if you use Expo push credentials / higher limits):

```bash
supabase secrets set EXPO_ACCESS_TOKEN=<expo-access-token>
```

Do **not** put the service role key (or Expo access token) in the Expo app / `.env` client vars.

## Database Webhook

1. Supabase Dashboard → **Database** → **Webhooks** (or Integrations → Database Webhooks).
2. Create webhook:
   - **Table:** `visitor_requests`
   - **Events:** `INSERT`
   - **Type:** HTTP Request / Supabase Edge Function
   - **URL / Function:** `notify-visitor-request`  
     (or full URL `https://<project-ref>.supabase.co/functions/v1/notify-visitor-request`)
3. Method: `POST`. Auth: use the project’s function invoke key / service role as required by your dashboard UI.

Payload shapes handled by the function:

- `{ "type": "INSERT", "table": "visitor_requests", "record": { ... } }`
- `{ "record": { ... } }`

## Notification shape

| Field | Value |
|---|---|
| title | `Visitor waiting` |
| body | `{visitor_name} ({visitor_type}) is at the gate` |
| data | `{ visitorRequestId, flatId }` |
| channelId | `portl` (Android; matches app `PORTL_NOTIFICATION_CHANNEL_ID`) |

## Smoke check

After deploy + webhook + migration 005 + at least one resident push token:

1. Insert a `visitor_requests` row for a flat with an approved resident who has a `push_tokens` row.
2. Check function logs: `supabase functions logs notify-visitor-request`
3. Expect JSON summary `{ "sent": N, "tokens": N }`.
