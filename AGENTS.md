# AGENTS.md — Portl

## Expo HAS CHANGED

Before writing any Expo / React Native code, read the **exact versioned docs**:  
[https://docs.expo.dev/versions/v55.0.0/](https://docs.expo.dev/versions/v55.0.0/)

Prefer Markdown endpoints (`…/Page.md`) and `npx expo install <pkg>` so versions match SDK 55. Do not rely on memory of older SDKs (Expo Go push behavior, Router APIs, SecureStore, SQLite, etc. have changed).

---

## What this project is

**Portl** — mobile-first society (apartment) management app: visitor approvals, notices, complaints, polls, amenities, dues. Three roles: **Admin**, **Resident**, **Guard**. Backend: Supabase. Client: Expo + React Native + Uniwind.

Hackathon target compressed to **2–3 days**. Tier 1 (demo spine) is non-negotiable quality. Tier 2+ only after Tier 1 is demo-ready. See `context/project-overview.md` and `context/build-plan.md`.

---

## Mandatory context (read before coding)

Read in order, then keep them updated as you work:

1. `context/project-overview.md` — why / roles / tiers
2. `context/architecture.md` — stack, folders, security, client libraries
3. `context/build-plan.md` — checklist and human-only setup
4. `context/progress-tracker.md` — **current status** (trust this for “what’s done”)
5. `context/design.md` — visual direction
6. `context/design-tokens.md` — **component + token registry** (reuse / append)
7. `context/schema.sql` — database + Tier 1 RLS

Design image refs (when present): `designs/screens/` at repo root.

**Conflict rule:** if docs disagree with the codebase, **the codebase wins** — flag the conflict and update the doc.

---

## Human collaboration (non-negotiable)

1. **Ask when human input is required** — never invent secrets, Supabase credentials, Expo/EAS account actions, OAuth client IDs, device provisioning, or irreversible cloud config. Surface a clear question and mark the item `blocked` in `progress-tracker.md`.
2. **Say when something is ready to test** — after a coherent slice works, set status `ready-to-test`, tell the user exactly what to open/click/expect, and wait.
3. **Commit only after a successful test** — and only when the user asks / confirms. Do not commit untested work or force-push. Follow the user’s git commit rules.
4. Do not skip hooks or amend unless the user’s rules allow it.

---

## Models & multi-agent

- Use **Cursor-native models only** for subagents (e.g. **Composer 2.5**, Cursor Grok, GPT variants listed in Cursor).
- **Do not** route work through third-party Claude API models for this project.
- Prefer parallel subagents for independent slices (UI primitives vs auth shell vs schema types vs Edge Function scaffold), then integrate carefully.
- Every subagent must be told to: read this file + `progress-tracker.md` + `design-tokens.md`, stay in-scope, and leave a short summary in `progress-tracker.md` when done.

---

## How to work (quality bar)

### Planning & scope

- Optimize for the **Tier 1 demo loop** first (society → join → approve membership → register visitor → push → approve → entry/exit → log).
- No half-built Tier 2 that risks Tier 1. Schema may already include Tier 2/3 tables; UI can wait.
- Prefer small, testable vertical slices over giant untested branches.

### Folder structure (keep it clean)

```
/src
  /app                      # Expo Router only — screens/layouts. No business logic dumps.
    /(auth)
    /(admin)
    /(resident)
    /(guard)
  /components
    /ui                     # CVA primitives (Text, Button, TextInput, Badge, …)
  /lib
    supabase.ts
    query-client.ts         # TanStack Query client + onlineManager/focusManager
    storage.ts              # SecureStore + AsyncStorage (theme/settings) helpers
    api/                    # query/mutation fns (Supabase calls)
  /hooks
  /providers
  /types
/assets
/context                    # agent docs (this package) — update, don’t abandon
/designs                    # visual refs (screens/, reference/)
/supabase                   # migrations / edge functions when using CLI
/global.css                 # Uniwind + Tailwind theme tokens
```

Note: this repo uses the Expo `src/` layout (`@/*` → `./src/*`). Do not create a parallel root-level `app/` or `components/` tree.

- **kebab-case** file names. Path aliases over deep relatives.
- Never co-locate reusable components/utils inside `app/` routes.
- Match existing patterns once the codebase exists; don’t create parallel trees.

### UI / design system

- Uniwind (Tailwind for RN) + **class-variance-authority (CVA)** for typed variants on primitives (`Text`, `Button`, `TextInput`, `Badge`, etc.).
- Before adding a component: check `context/design-tokens.md`. If new → implement **and** register it there.
- Follow `design.md` palette, typography, icon rules, and screen extrapolation map.
- Icons via scoped **`@react-native-vector-icons/*`** packages (Expo recommends `@react-native-vector-icons/*` over deprecated `@expo/vector-icons`). Wrapper: **`src/components/ui/icon.tsx`**. Installed families: ionicons, material-icons, material-design-icons (MaterialCommunity), feather. Do not use lucide-react-native or the old umbrella `react-native-vector-icons` package; do not add FlashList unless revisited.
- **Never hardcode hex/rgb color literals in components.** Prefer Uniwind `className` tokens. When a JS color string is required (Icon `color`, `placeholderTextColor`, SystemUI, charts), use `useThemeColors()` / `useCSSVariable('--color-…')` from Uniwind, or a single shared constants module that only re-exports theme tokens — never scatter raw `#…` in screens.
- Empty / loading / error states required on list/detail flows.
- **Keyboard:** Always use `KeyboardAvoidingView` with `behavior="padding"` on both iOS and Android. Never use `height`, `null`, or iOS-only padding (`Platform.OS === 'ios' ? 'padding' : undefined`). Android needs padding too; height/null do not work reliably in this project.

### Data & sync

- **TanStack Query** for server state: queries, mutations, cache, invalidation. Keep Supabase client in sync via mutation `onSuccess` invalidation / optimistic updates where safe.
- **Required RN bootstrap** (per TanStack React Native docs): wire `onlineManager` to a network listener ( `expo-network`) and `focusManager` to `AppState` so the client refetches on reconnect / foreground. This is part of Query setup, not a later nice-to-have.
- Query-key factory under `lib/` or `hooks/` — no ad-hoc string keys.
- **Realtime** (visitor approvals): subscribe in a dedicated hook; invalidate or patch the Query cache on events — don’t maintain a second source of truth.
- Typed helpers in `lib/api/*`; hooks call those helpers.

### Storage

| Need                                                           | Tool                                        |
| -------------------------------------------------------------- | ------------------------------------------- |
| Secrets (session / sensitive client material)                  | `expo-secure-store`                         |
| Theme + Settings preferences (and similar non-sensitive prefs) | `@react-native-async-storage/async-storage` |
| Structured offline / heavier local cache (only if needed)      | `expo-sqlite`                               |

Supabase Auth session handling: use the official Supabase RN auth storage adapter pattern with SecureStore where appropriate — never put service-role keys (or other secrets) in AsyncStorage.

### Auth, security, env

- Client only: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Service role: Edge Functions only.
- Respect RLS; add policies when enabling Tier 2/3 tables (RLS-on + no policy = empty results, easy to mis-debug).
- Join-by-code uses `lookup_society_by_code` RPC — do not open broad `societies` SELECT.

### Native / push

- Remote push requires **EAS Development Build** (`npx expo start --dev-client`), not classic Expo Go.
- Ask the human to kick off / install the build early; don’t pretend push works in Expo Go.

### Docs agents must update

After meaningful work, update:

- `context/progress-tracker.md` (status, session log, ready-to-test queue)
- `context/design-tokens.md` (any new UI token/component/decision)
- `context/build-plan.md` checkboxes when a planned item actually completes

---

## Definition of “ready to test”

A slice is ready when:

- It runs on the expected client (Expo Go only if no native-only APIs; otherwise dev client)
- Happy path works without manual SQL edits
- Obvious error/empty states aren’t blank crashes
- You can give the human a 3–6 step verification script

Then stop and notify. After they confirm, commit if they ask.

---

## Anti-patterns

- Inventing UI patterns already covered by the five core screens / design-tokens registry
- Bypassing TanStack Query with one-off `useEffect` + `useState` fetches for server data
- Hardcoding secrets or committing `.env`
- Expanding Tier 2 while Tier 1 push/approval loop is unproven
- Silent doc drift (code changes without progress-tracker / design-tokens updates)
- Using non-Cursor Claude API models for project subagents
- `KeyboardAvoidingView` with `behavior="height"` / `null` / iOS-only padding (always use `"padding"` on both platforms)

---

## Quick start for a new agent session

1. Read this file + `context/progress-tracker.md`.
2. Skim `architecture.md` + `design-tokens.md`.
3. Confirm with the human only if blocked or if starting a new major slice.
4. Implement the next `todo` / unblock `ready-to-test`.
5. Update trackers; announce test steps.
