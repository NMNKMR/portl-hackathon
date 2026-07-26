# Portl

**Replace the gate call. Run your society in one app.**

Portl is a mobile-first society (apartment community) management platform. It connects **Admin**, **Resident**, and **Security Guard** in a single app — with real-time visitor approvals, push notifications, and day-to-day community workflows backed by Postgres and Row Level Security.

Built for a hackathon with production-minded architecture: a flawless **Tier 1 demo spine**, plus **Tier 2** features that are fully functional (not mocked).

---

## Try the app (Android preview)

**Install:** [Download Portl Preview APK](https://expo.dev/accounts/namangoel/projects/portl-hackathon/builds/87d44ebc-d918-4472-a2fd-a24747f5638c)

Android internal build (`com.portl.app.preview`). Sign in with phone or Google — requires network access to Supabase.

> **Maintainers:** Preview builds must have `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in [EAS environment variables](https://expo.dev) for the `preview` environment before `eas build --profile preview`. See [Preview build setup](#preview-build-setup) below.

---

## Demo Video

https://drive.google.com/file/d/1NKI1kVb56aKupuygEu7ezggxqhQVZBnU/view?usp=drivesdk

---

## The problem

A delivery partner reaches the gate. The guard calls the flat. The resident misses the call. The visitor waits.

That same manual pattern repeats for guest approvals, notices, complaints, staff entry, and community polls. Portl moves all of it into one secure, role-based mobile experience.

---

## Roles

| Role         | What they do in Portl                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**    | Create the society, manage blocks/flats, approve join requests, post notices, run polls, triage complaints, view society-wide visitor logs     |
| **Resident** | Approve/reject visitors (via push), pre-approve guests with QR passes, read notices, vote in polls, raise complaints, manage household members |
| **Guard**    | Register visitors at the gate, scan QR passes, verify staff passes, check visitors in/out, view the duty log                                   |

Staff (maids, delivery partners on recurring passes) do not log in — they are directory records with scannable passes verified by the guard.

---

## Live demo flow (recommended)

This is the core loop judges can click through on a physical device:

1. **Admin** — Sign up → create society → add a flat → share join code → approve a resident
2. **Guard** — Register a visitor for that flat
3. **Resident** — Receive a **push notification** → approve the visitor
4. **Guard** — Check in → check out
5. **All roles** — See the entry in the visitor log

**Bonus paths (Tier 2):**

- Resident pre-approves a guest → shares QR → guard scans and admits
- Admin posts a notice → resident opens it (read receipt)
- Admin creates a poll → resident votes → admin views results
- Resident raises a complaint → admin updates status

---

## What's built

### Tier 1 — Demo spine ✅

Real backend, real push, no manual SQL tricks:

- Society creation and join-by-code onboarding
- Admin approval queue (including bulk approve)
- Blocks, flats, and flat member detail
- Household join (primary + household members)
- Guard visitor registration (photo, type, vehicle)
- **Push notifications** via Supabase Edge Function → Expo Push → FCM/APNs
- Resident approve/reject with Realtime / pull-to-refresh
- Guard check-in / check-out
- RLS-scoped visitor logs for admin, resident, and guard
- Phone auth, Google OAuth, profile/avatar, light/dark theme
- Role dashboards with bottom navigation

### Tier 2 — Functional, simplified ✅

| Feature            | Summary                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| Guest pre-approval | Resident creates a pass (optional QR, multi-entry); guard scans or admits from list |
| Staff directory    | Recurring staff passes with QR; guard verify/search                                 |
| Complaints         | Resident raises (+ photo); admin triages Open → In Progress → Resolved              |
| Notices            | Admin compose (+ optional photo, expiry); resident read tracking                    |
| Polls              | Admin compose; resident votes once; admin sees live results; creator closes poll    |

### Tier 3 — Schema ready, UI stubbed

Database tables exist; screens show “Coming soon” or are not wired:

- Full amenity slot booking
- Maintenance dues + payment flows
- Plan limit enforcement UI (free / starter / pro)

### Tier 4 — Roadmap

- Payment gateway (Razorpay / Stripe)
- SMS fallback for non-smartphone residents
- Guard shift scheduling
- Multi-society operator console

---

## Tech stack

| Layer        | Technology                                                      |
| ------------ | --------------------------------------------------------------- |
| Mobile       | Expo SDK 55, React Native, Expo Router                          |
| UI           | Uniwind (Tailwind for RN), CVA component variants               |
| State / data | TanStack Query, Supabase Realtime                               |
| Backend      | Supabase — PostgreSQL, Auth, RLS, Storage, Edge Functions       |
| Push         | Expo Push Service (requires EAS dev/preview build, not Expo Go) |
| Build        | EAS Build (`development`, `preview`, `production`)              |
| Language     | TypeScript                                                      |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Portl mobile app (Expo + React Native)                 │
│  Admin · Resident · Guard dashboards                    │
└───────────────────────────┬─────────────────────────────┘
                            │
          Auth / CRUD / Realtime / Storage uploads
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + RLS)                            │
│  Multi-tenant: Society → Block → Flat → Membership      │
└───────────────────────────┬─────────────────────────────┘
                            │  DB webhook on INSERT
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Edge Function: notify-visitor-request                  │
│  Service role → lookup push_tokens → Expo Push API       │
└───────────────────────────┬─────────────────────────────┘
                            ▼
                    Resident device notification
```

Row Level Security enforces role and society scoping at the database layer — not only in app code.

---

## Project structure

```
src/
  app/           Expo Router screens (admin / resident / guard / auth)
  components/    UI primitives and feature components
  hooks/         TanStack Query hooks
  lib/           Supabase client, API helpers, query keys
  providers/     Auth, theme, push token registration
supabase/
  migrations/    Incremental SQL (run after context/schema.sql)
  functions/     Edge Functions (visitor push)
context/         Architecture notes, build plan, design tokens
designs/         Screen reference mockups
```

Application code lives under `src/` (Expo `src` layout). Path alias: `@/*` → `./src/*`.

---

## Getting started (developers)

### Prerequisites

- Node.js 20+
- Expo account and [EAS CLI](https://docs.expo.dev/build/setup/) for device builds
- A Supabase project

### 1. Clone and install

```bash
git clone https://github.com/NMNKMR/portl-hackathon.git
cd portl-hackathon
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and set:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Never commit `.env` or put the Supabase **service role** key in the client.

### 3. Database

1. Run `context/schema.sql` once in the Supabase SQL Editor.
2. Apply migrations in order from `supabase/migrations/` (`001` through `013`).
3. Deploy the push Edge Function and wire the database webhook — see [`supabase/functions/notify-visitor-request/README.md`](supabase/functions/notify-visitor-request/README.md).

### 4. Run the app

Push notifications and camera QR require a **development or preview build**, not Expo Go:

```bash
# After installing a dev/preview build on your device:
npx expo start --dev-client
```

Build profiles are defined in `eas.json`:

```bash
eas build --profile development --platform android
eas build --profile preview --platform android
```

---

## Security model

- Client uses only the Supabase **anon/publishable** key; RLS restricts all reads/writes.
- Service role is used **only** in Edge Functions (server-side).
- Join-by-code uses the `lookup_society_by_code` RPC — societies are not openly listed.
- Each membership is scoped to one society; roles (`admin`, `resident`, `guard`) drive UI and policies.

---

## Known limitations (hackathon scope)

- UI polish pass ongoing on some inner screens vs design references
- Visitor list live updates prefer Realtime publication on `visitor_requests` (pull-to-refresh works as fallback)
- Amenity booking, dues, and OCR plate assist are planned but not shipped in this submission
- Simulated payments only — no live payment gateway

---

## Documentation

| Document                                                     | Contents                 |
| ------------------------------------------------------------ | ------------------------ |
| [`context/project-overview.md`](context/project-overview.md) | Vision, tiers, roles     |
| [`context/architecture.md`](context/architecture.md)         | Stack, folders, patterns |
| [`context/build-plan.md`](context/build-plan.md)             | Milestone checklist      |
| [`context/design.md`](context/design.md)                     | Visual direction         |
| [`AGENTS.md`](AGENTS.md)                                     | Contributor conventions  |

---

## License

Hackathon submission — see repository for usage terms.
