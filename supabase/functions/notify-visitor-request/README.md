# Portl — Hackathon submission reference

**Portl** is a mobile-first society (apartment community) management app. It replaces gate calls, WhatsApp groups, and paper registers with one app for **visitor approvals, notices, complaints, polls, staff passes, and pre-approvals** — across three roles: **Admin**, **Resident**, and **Guard**.

Repo: [github.com/NMNKMR/portl-hackathon](https://github.com/NMNKMR/portl-hackathon)

---

## Tech stack

| Layer | Choice |
|---|---|
| Mobile | **Expo SDK 55**, **React Native**, **Expo Router** (file-based navigation) |
| Styling | **Uniwind** (Tailwind CSS for RN) + **CVA** component variants |
| Server state | **TanStack Query** + Supabase Realtime invalidation |
| Backend | **Supabase** — Postgres, Auth, Row Level Security, Realtime, Storage, Edge Functions |
| Auth | Phone/password (+ Google OAuth wired) |
| Push | **Expo Push Service** via **EAS Development / Preview builds** (not Expo Go) |
| Edge runtime | **Supabase Edge Functions** (Deno) — this folder |
| Storage | Supabase Storage (visitor photos, avatars, notice/complaint images) |
| Build / deploy | **EAS Build** (`development`, `preview`, `production` profiles) |

---

## What is built (demo-ready)

### Tier 1 — Demo spine ✅

End-to-end loop a judge can click through on a real device:

1. **Admin** creates a society → gets a join code → adds blocks/flats → approves join requests  
2. **Resident** joins by code (owner/tenant, primary/household) → lands on role dashboard after approval  
3. **Guard** registers a visitor at the gate (photo, type, vehicle)  
4. **Resident** receives a **real push notification** → approves or rejects  
5. **Guard** checks visitor in and out  
6. **Admin / Resident / Guard** each see the visitor log (RLS-scoped)

Also shipped:

- Phone auth, Google OAuth, profile + avatar, light/dark theme  
- Role-based tab navigation (Home, Visitors, Notices, Polls, Account)  
- Shared UI system (cards, badges, bottom sheets, list patterns)  
- TanStack Query + Realtime on visitor requests (with pull-to-refresh fallback)

### Tier 2 — Functional, simplified ✅ (recent slices)

| Feature | Status | Notes |
|---|---|---|
| **Guest pre-approval** | ✅ | Resident creates pass (optional QR, multi-entry `max_scans`); guard scan or list admit; no push on self-initiated pre-approvals |
| **Staff directory + recurring pass** | ✅ | Admin/resident manage society staff; QR pass; guard verify/search |
| **Complaints** | ✅ | Resident raises (+ photo); admin triages Open → In Progress → Resolved; resident can edit own while Open |
| **Notices** | ✅ | Admin compose (+ optional photo, expiry); resident list/detail; mark read on open; creator-only edit |
| **Polls** | ✅ | Admin compose (2+ options); resident vote once; admin sees live results; creator closes poll |
| **Household join** | ✅ | Primary + household members; primary approves household pending |
| **Needs attention feed** | ✅ | Dashboard cards for pending visitors, unread notices, open polls, complaints |

### Backend / infra ✅

- Postgres schema + **RLS** per role and society  
- Migrations `001`–`013` (society RPC, join, household, push tokens, storage, Tier 2 RLS, notice read RPC, polls RLS, vote RPC)  
- **`notify-visitor-request` Edge Function** (this folder) — DB webhook → Expo Push  
- EAS dev/preview builds with FCM configured  

---

## What is left (known gaps before polish)

| Item | Priority | Notes |
|---|---|---|
| **UI polish pass** | High | Dashboards and inner screens vs design refs — layout/spacing/visual consistency |
| **Tab navigation quirks** | High | Occasional flicker/reset when switching tabs — needs repro + fix |
| **`visitor_requests` Realtime publication** | Medium | Enable on `supabase_realtime` for live list updates without pull-to-refresh |
| **Edge Function redeploy** | Medium | Redeploy after `009_visitor_notify_member.sql` if using guard “notify member” picker |
| **Pending SQL migrations on some envs** | Medium | Confirm `008`, `009`, `011`, `012`, `013` applied in Supabase SQL Editor |
| **Camera QR rebuild** | Medium | Guard scan needs dev/preview build with `expo-camera` native module |
| **Generated Supabase types** | Low | Hand-maintained types in `src/types/database.ts` for now |

### Tier 2 not yet built

- Amenity booking (request-to-book flow)  
- Maintenance dues + simulated payment  
- Admin aggregated analytics dashboard beyond home summary cards  
- Number-plate OCR assist on guard register  

### Tier 3 — Schema-backed stubs (UI “Coming soon”)

Tables exist in schema; UI not wired:

- Full amenity slot booking engine  
- Plan soft limits (free/starter/pro enforcement UI)  
- Advanced reporting / exports  

### Tier 4 — Roadmap only (pitch mention)

- Payment gateway integration (Razorpay/Stripe)  
- SMS fallback for non-smartphone residents  
- Guard shift scheduling  
- Multi-society admin console  

---

## Demo script (recommended live flow)

1. **Admin** — Create society → add flat → share code → approve resident join  
2. **Guard** — Register visitor for that flat  
3. **Resident** — Push notification → Approve  
4. **Guard** — Check in → Check out  
5. **Resident** — Pre-approve guest → share QR  
6. **Guard** — Scan QR → admit  
7. **Admin** — Post notice + create poll  
8. **Resident** — Read notice + vote in poll  
9. **Admin** — View poll results + close poll  

---

# `notify-visitor-request` (Edge Function)

Supabase Edge Function: on `visitor_requests` **INSERT**, look up approved residents for that flat, load their Expo push tokens, and send a notification via the Expo Push API.

This is the **push pipeline** for Tier 1 — without it, the guard→resident approval loop has no notification.

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

**Skips push when:**

- `initiated_by === 'resident'` (pre-approvals — resident already knows)  
- `status !== 'pending'`

When `notify_membership_id` is set (guard register “notify member” picker), push goes only to that member. Otherwise falls back to flat primary/owner, then all approved residents on the flat.

Requires migration `009_visitor_notify_member.sql` for the notify-member column. **Redeploy** after pulling changes.

## Notification shape

| Field | Value |
|---|---|
| title | `Visitor waiting` |
| body | `{visitor_name} ({visitor_type}) is at the gate` |
| data | `{ visitorRequestId, flatId }` |
| channelId | `portl` (Android; matches app `PORTL_NOTIFICATION_CHANNEL_ID`) |

## Smoke check

After deploy + webhook + migration 005 + at least one resident push token:

1. Insert a `visitor_requests` row for a flat with an approved resident who has a `push_tokens` row (or use Guard → Register visitor in the app).
2. Check function logs: `supabase functions logs notify-visitor-request`
3. Expect JSON summary `{ "sent": N, "tokens": N }`.
4. Resident device should show **Visitor waiting** notification; tapping opens the app to the visitor flow.

## Architecture (push path)

```
Guard app → INSERT visitor_requests (pending, initiated_by=guard)
       → Postgres DB Webhook (INSERT)
       → notify-visitor-request (Edge Function, service role)
       → SELECT push_tokens for flat residents
       → POST https://exp.host/--/api/v2/push/send
       → FCM/APNs → Resident device
```

---

## Related docs in repo

| File | Purpose |
|---|---|
| `context/project-overview.md` | Vision, roles, tier system |
| `context/architecture.md` | Stack, folders, security |
| `context/build-plan.md` | Day-by-day checklist |
| `context/progress-tracker.md` | Live status, blockers, session log |
| `context/design.md` | Visual direction |
| `supabase/migrations/` | Incremental SQL after `context/schema.sql` |

---

## One-line pitch

**Portl** — one app for your society gate and community: real-time visitor approvals with push notifications, plus notices, complaints, polls, and staff passes — built for Admin, Resident, and Guard roles with database-enforced security.
