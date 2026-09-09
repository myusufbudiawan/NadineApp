# PreemieTrack

PreemieTrack is a calm, privacy-conscious companion app for caregivers of premature or medically monitored infants. It is a tracking and education tool — never a diagnostic or dosing-recommendation system.

The product requirements and delivery checklist live in [PREEMIETRACK_PLAN.md](PREEMIETRACK_PLAN.md). That document is the project source of truth.

## Status

Phase 0 (Foundation) and Phase 1 (Tracking) are implemented — see the [Changelog](#changelog) below and [PREEMIETRACK_PLAN.md](PREEMIETRACK_PLAN.md) Section 11 for the authoritative per-task checklist. The repository has a working Expo/React Native app with local-first SQLite care-event logging across all six event types plus notes, a reusable component system, a SecureStore-backed session boundary, a configurable corrected-age engine, and a Fastify API with a `care-events`/`audit` domain pair. Growth dashboards, reminders, tips, sharing, reports, real Postgres-backed persistence, offline sync, and production authentication (Phase 2+) remain unimplemented.

No clinical reference thresholds, percentile curves, advice, or dosing logic have been added. The corrected-age reference is configurable and explicitly marked `NEEDS-CLINICAL-REVIEW`.

## Structure

```
apps/mobile/       Expo Router app, shared components, feature logic, local persistence
services/api/      Fastify API, organized by domain
  src/domains/     identity, baby-profile, care-events, growth, reminders, content,
                   sharing, reports, sync, audit
```

## Prerequisites

- Node.js 22+
- npm 10+
- Expo Go, iOS Simulator, or Android Emulator for the mobile app
- PostgreSQL for a production-backed API (the initial SQL migration is under `services/api/src/common/db/migrations/`)

## Run locally

Install dependencies once from the repository root:

```sh
npm install
```

Start the mobile app:

```sh
npm run start --workspace=@preemietrack/mobile
```

Start the API in another terminal:

```sh
npm run dev --workspace=@preemietrack/api
```

The API health check is available at `http://localhost:3000/health`.

## Verify

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

GitHub Actions runs the same checks for pushes and pull requests.

## CI/CD

- **CI** (`.github/workflows/ci.yml`) — lint/typecheck/test/build on every push and PR.
- **Deploy API** (`.github/workflows/deploy-api.yml`) — deploys `services/api` to Vercel on every push to `main` that touches it, or via manual dispatch. Requires repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- **Build Android APK** (`.github/workflows/build-android.yml`) — manual dispatch only. Builds a debug APK with EAS and attaches it to a GitHub Release. Requires repo secret `EXPO_TOKEN`.

## Notes for contributors

- Keep app route files thin: reusable UI belongs in `components/`, feature logic in `features/`, and shared platform code in `lib/`.
- A backend domain owns `routes.ts`, `service.ts`, `repository.ts`, and `schema.ts`. Domains must communicate through services, never another domain’s repository.
- Store session secrets only through platform secure storage. Do not put secrets or health data in logs, analytics, or plaintext storage.
- Implement only the active phase in the plan and update its checklist when its acceptance criteria are actually met.
- **Update the Changelog below for every change**, per [PREEMIETRACK_PLAN.md](PREEMIETRACK_PLAN.md) Section 0, rule 6 — newest entry at the top, one entry per session/PR, gaps flagged rather than glossed over.

## Changelog

### 2026-09-08 — Phase 5 (Hardening): Offline sync engine end-to-end, log-scrubbing, analytics allowlist

- **5.1 Offline-first sync (FR-017):** new `services/api/src/domains/sync/*` — `POST /v1/sync` applies a batch of client-queued mutations (create/update/delete on care events) with server-side idempotency per mutation id (`SyncRepository`) and optimistic-concurrency conflict detection (`CareEventsService.update` now takes `expectedUpdatedAt`, throws `ConflictError` carrying the server's current record). `test/sync.test.ts` — 5 passing (apply-once, retry-is-duplicate, conflict-not-silently-overwritten, invalid-shape rejected, delete-is-idempotent).
- Mobile: `lib/offline/sync.ts` finally drains the `mutation_queue` table that's existed since Phase 1 — batches pending rows, exponential backoff (5s→5min) on failure, tracked via new `attempts`/`next_attempt_at`/`last_error` columns. Conflicts are pulled out of the retry loop into a new `sync_conflicts` table and surfaced at `app/more/sync-conflicts.tsx` (linked from More) with "Keep mine" / "Use theirs" resolution — no silent overwrite. `hooks/useSync.ts` mounted at the root layout runs sync on launch/foreground/interval.
- Also fixed: mobile care-event data used capitalized display enums (`'Bottle'`, `'Oral'`, `'Wet'`) that would have failed the backend's lowercase schema on the very first real sync — `features/care-events/serverPayload.ts` translates only at the outbound sync-payload boundary, local/display values untouched.
- **5.2/5.4 (partial):** `buildServer()` now sets explicit Fastify logger `redact`/`serializers` so request logs never carry a body; `test/log-scrubbing.test.ts` boots the real server and asserts canary temperature/dose/note values never reach the log stream. New `common/analytics/events.ts` is a closed, `.strict()` allowlist of analytics event shapes (category-only, no raw measurements/notes) — `trackEvent()` throws on anything else, verified by `test/analytics.test.ts` (5 passing). Nothing calls `trackEvent` yet; this is the chokepoint for whenever an analytics destination is added.
- **Gaps left open (see PREEMIETRACK_PLAN.md Phase 5 for detail):** sync is scoped to care events only — growth measurements and reminders remain local-only (same not-yet-reconciled pattern already flagged at 2.2/3.2). The full on-device sync/conflict QA scenario was **not click-verified** — `expo-sqlite` doesn't run in this session's web preview (same pre-existing limitation noted throughout Phases 2–4). 5.2's remaining items (TLS, encrypted local storage, least-privilege server-side authorization, jurisdiction-matched deletion, legal/compliance review) are blocked upstream on Phase 0.3 (auth is still an unstarted stub — there's no actor identity yet to authorize against) and were not attempted rather than faked. 5.3 (accessibility audit), 5.5 (error/empty-state UI beyond the new conflicts screen), 5.6 (QA pass), and 5.7 (DoD sign-off gate) are not started — all are on-device/manual/organizational work outside this pass's scope.

### 2026-09-07 — Phase 4 (Sharing & Reports): Sharing, Reports/export, Privacy controls — full stack

- **Sharing (4.1):** new `services/api/src/domains/sharing/*` (`ShareGrant` entity, `GET/POST /v1/babies/{id}/shares`, `DELETE .../shares/{id}` for immediate revocation, migration table `share_grants`, `test/sharing.test.ts` — 4 passing). Mobile: `apps/mobile/app/more/share-data.tsx` (invite by email + read/write permission, revoke with confirmation), backed by a new `apps/mobile/lib/api/*` client — the first mobile feature calling the backend directly instead of through offline SQLite, since inviting a caregiver is inherently server-mediated.
- **Reports & export (4.2):** new `services/api/src/domains/reports/*` — `POST /v1/babies/{id}/reports` generates a report on demand (date range + category filter, JSON or CSV) by reading across Baby Profile/Care Events/Growth through each domain's own service, never their repositories directly (Constitution 0.A #3). Refactored `server.ts` to construct one shared service instance per domain per `buildServer()` call and thread it to every domain needing cross-domain reads, instead of each domain privately owning its instance (each domain's own tests still get a fresh, isolated instance per call — verified unaffected, `test/reports.test.ts` 4 passing). Ported the actual/corrected-age calculation server-side (`services/api/src/common/util/age.ts`, duplicated from the mobile client, same precedent as `timezone.ts`). Mobile: `app/more/reports.tsx` (date-range pickers, summary view, CSV export via the OS share sheet).
- **Privacy controls (4.3):** extended `services/api/src/domains/identity/*` with `GET /v1/account/export` (aggregates every baby + its events/growth/reminders/shares), a deletion-request pipeline (`POST/GET /v1/account/deletion-requests`, cancel) that only ever reaches `pending`/`cancelled` per the still-open retention policy decision (Section 9, #9), and `POST /v1/auth/sessions/revoke-all`. Migration table `deletion_requests`. `test/privacy.test.ts` — 3 passing. Mobile: `app/more/settings.tsx` (export my data, request/cancel deletion).
- **Gaps left open (see PREEMIETRACK_PLAN.md Phase 4 for detail):** PDF export not implemented (CSV covers the export requirement; no PDF library exists in the backend today and none was added silently); no route yet calls `SharingService.hasActiveAccess()` for authorization since there is no session/auth middleware at all (Phase 0.3 unstarted); mobile Sharing/Reports/Settings screens use the local-only `LOCAL_BABY_ID` and will not resolve against a real backend until Baby Setup (0.4) posts a baby to the API — screens, API client, and backend are each independently correct and tested, only that id-reconciliation link is missing (same category of gap already flagged for Growth and Reminders); none of the three new mobile screens were click-verified on-device in this session.

### 2026-09-07 — Fix crash: expo-notifications import breaks Android Expo Go

- **Bug fix, reported live after the Phase 3 reminders work below:** opening the new Add/Edit Reminder screen crashed with an uncaught error from `expo-notifications` — as of Expo SDK 53, Expo Go no longer supports Android remote push, and the module throws synchronously on import (a side effect of its push-token auto-registration), not something a `try/catch` around individual calls can catch since the throw happens at `require` time, before any of our code runs.
- Fix: `features/reminders/notifications.ts` now lazy-loads `expo-notifications` via `require()` inside a `try/catch`, caching the module (or `null` on failure). Every exported function checks the cache and degrades to "no device notification scheduled" rather than throwing — a reminder still saves and displays correctly either way. A development build (not Expo Go) is unaffected by the underlying SDK 53 change.
- Not independently reproduced on-device in this session (reasoned from the reported stack trace + Expo's documented change) — the user should confirm Add/Edit Reminder no longer crashes on their Android Expo Go setup.

### 2026-09-07 — Phase 3 (Engagement): Reminders end-to-end, Tips content pipeline (backend only)

- **Reminders (3.2, 3.3), full stack:** backend `services/api/src/domains/reminders/*` (CRUD + snooze/complete, `test/reminders.test.ts`, 5 passing) and a DST-correct scheduler (`services/api/src/common/util/timezone.ts`, `test/timezone.test.ts`) that resolves wall-clock times via `Intl.DateTimeFormat` per-date rather than a fixed UTC offset — verified against the real America/New_York 2027 spring-forward transition. Mobile: local-first `reminders` SQLite table (`lib/offline/database.ts`), `features/reminders/{storage,schedule,notifications,rowConfig}.ts`, and two screens (`app/more/reminders.tsx` list, `app/more/add-reminder.tsx` add/edit/snooze/complete/delete, reachable from More > Reminders) built from the shared `EntryForm` skeleton plus a new reusable `WeekdayToggle` component. Local notifications scheduled/cancelled via `expo-notifications` on every state change.
- **Tips content pipeline (3.1), backend only:** `services/api/src/domains/content/*` (`TipContent` entity, `GET /v1/tips` with category + corrected-age-day eligibility filtering, authoring via `POST /v1/tips`, `test/content.test.ts`, 3 passing). Seeded placeholder content ships as `needs-clinical-review` so it never appears in the default listing (Section 15 guardrail) — proven by test.
- **Gaps left open (see PREEMIETRACK_PLAN.md Phase 3 for detail):** no dedicated admin console UI for authoring tips (the API is the only entry point so far); mobile Tips screen is still the static prototype, intentionally not wired to `GET /v1/tips` since no approved content exists yet and wiring it today would just show an empty screen; no Tip Detail screen; mobile reminders are local-only and not yet synced with the backend `reminders` API (same pattern as Growth, Phase 5 reconciles this); only local device notifications exist, no push/APNs/FCM dispatch; local-notification delivery not click-verified on a simulator/device in this session.

### 2026-09-07 — Fix SQLite native crash from repeated navigation (Android)

- **Bug fix, reported from a real device (Expo Go, Android):** repeatedly navigating to/from Home eventually crashed with `NativeDatabase.prepareAsync ... NullPointerException`. Root cause in `lib/offline/database.ts#getDatabase`: it cached the *resolved* database object, checked with `if (!db)` — a classic check-then-await race. Every screen's `useFocusEffect` calls `getDatabase()` independently, so concurrent calls (fired on rapid navigation) could all see the cache empty before the first `await SQLite.openDatabaseAsync(...)` settled, each opening a second native handle to the same file; Android's SQLite binding doesn't tolerate that and the older handle goes invalid mid-query.
- Fix: cache the in-flight *promise* instead (`dbPromise`), so `SQLite.openDatabaseAsync` + the migration `execAsync` run exactly once and every caller — concurrent or not — awaits that same promise. Clears the cache on failure so a later call can retry rather than being stuck on a permanently rejected promise.
- Not independently reproduced in this session (sqlite doesn't run in the web preview, and no Android device is available here) — fix is based on code inspection matching the exact reported symptom and repro steps; the user should confirm the crash no longer occurs after re-testing on device.

### 2026-09-07 — Growth chart: fixed 0.5 kg y-axis step for weight

- `components/domain/GrowthChart.tsx` was auto-picking a "nice" y-axis step (1/2/5×10ⁿ) from the plotted range, which landed on 2 kg increments once the WHO reference band widened the range. Added an optional `yStep` prop that forces a fixed tick spacing instead of the auto-picked one (with a guard rail: falls back to the auto step if a forced step would draw more than 14 gridlines, e.g. a very wide range) — `app/(tabs)/growth.tsx` passes `yStep={0.5}` for the weight metric only.
- `tsc`/`eslint` clean.

### 2026-09-07 — Baby sex field + Home hero card cleanup

- Added `sex: 'girl' | 'boy'` to `BabyProfile` (mobile: `features/baby-profile/types.ts`) and to the backend's `babySchema`/`StoredBaby` (`services/api/src/common/validation/baby.ts`, `src/domains/baby-profile/repository.ts`), required at Baby Setup via a new segmented Girl/Boy control (`app/baby-setup.tsx`) and enforced in `validateBaby`.
- Wired the sex field into the one place it actually changes output: the growth chart's WHO reference band. `features/growth/reference-data.ts` previously only had the boys' WHO Child Growth Standards table used as an unisex stand-in (a flagged gap in the 2026-09-07 WHO-reference-band changelog entry below) — sourced the girls' equivalent (weight/length/head-circumference-for-age, 0–24 months, 15th/50th/85th percentiles) the same way the boys' table was sourced, via web search + `pdftotext` extraction of the official `cdn.who.int` percentile PDFs, and `whoReferenceBandAt(metric, ageWeeks, sex)` now picks the matching table. `app/(tabs)/growth.tsx` passes the baby's actual sex through.
- Home (`app/(tabs)/home.tsx`) now shows the sex in the hero card's "Born ..." line (e.g. "Girl · Born 32w 3d · 1.58 kg").
- Home/hero-card polish requested directly: enlarged the baby photo (`BabyHeroCard`, 112×205 → 152×240) and the baby's name text (17px → 24px), and removed the decorative ♥ characters/icons from the caregiver greeting, the hero name, the empty photo placeholder (now a neutral person icon), and the no-profile CTA icon.
- Verified: `tsc` clean on both packages (mobile's only remaining error is the pre-existing unrelated `age.runner.ts` extension warning); `npm test` green in both packages (mobile age tests, 10 backend vitest cases unaffected by the new required `sex` field since no fixture constructs a baby payload without going through the schema). Clicked through Baby Setup's new Girl/Boy control and Home's hero card in the `react-native-web` preview to confirm sizing/heart removal — did not click-verify the sex value surviving a save, since `expo-sqlite` still doesn't complete writes in that preview (same pre-existing, documented limitation as prior entries); needs a real iOS/Android run to confirm end-to-end.

### 2026-09-07 — Phase 2.3: real WHO reference band on the growth chart

- Sourced real WHO Child Growth Standards (2006) data via web search + `pdftotext` extraction of the official `cdn.who.int` percentile PDFs (boys, weight/length/head-circumference-for-age, 0–24 months) into `features/growth/reference-data.ts` (`whoReferenceBandAt`, linear interpolation between monthly 15th/50th/85th anchors). Investigated Fenton (preterm) first — its underlying LMS data is proprietary/license-gated, confirmed via search — and a substitute open-license preterm dataset (INTERGROWTH-21st) wasn't sourced in time, so per the user's own fallback instruction, no band renders before the due date; the WHO band only appears from the due date onward.
- `components/domain/GrowthChart.tsx`: added an actual shaded reference band (approximated as many thin adjacent strips — there's still no SVG/charting library, so no true path fill) plus a swatch in the legend; the y-domain now also considers the band's extent so it's never clipped, and a minimum 0.5-unit y-axis pad guarantees points never sit flush against the plot edges.
- Known simplifications flagged in code comments: boys' values stand in for a unisex chart since `BabyProfile` has no sex field yet; band uses monthly anchors (not weekly) interpolated linearly.
- `tsc`/`eslint` clean; band interpolation spot-checked against the source WHO table (not click-verified in the browser preview per standing instruction on sqlite).

### 2026-09-07 — Phase 2.3 polish: growth chart axis labels

- Mobile: `components/domain/GrowthChart.tsx` was missing numeric axis reference entirely (just an unlabeled border), unlike the prototype's labeled kg/weeks axes. Added a "nice ticks" helper (`niceStep`/`computeTicks`, standard 1/2/5×10ⁿ rounding) that snaps the axis domain to round numbers and renders y-axis value labels + unit (left gutter) and x-axis week labels (below the plot), plus horizontal gridlines at each y-tick.
- `tsc`/`eslint` clean; not click-verified per explicit instruction (sqlite writes don't complete in the web preview).

### 2026-09-07 — Phase 2.3 polish: preemie-aware corrected age + growth reference switching

- **Bug fix:** `lib/age.ts#correctedAge` was clamping negative results to zero via `Math.max(0, …)`. A preterm baby's corrected age is *supposed* to be negative until it reaches its full-term-equivalent due date (Section 8.2) — the clamp silently collapsed every growth reading taken before that date onto corrected-age zero, which is exactly the population this app targets. Replaced with a signed day/week breakdown (`toSignedAge`) that preserves the sign; `actualAge` keeps its non-negative clamp since a birth date can't be in the future. Added `formatAgeDetailed()` for the "N days (Xw Yd) before due date" phrasing and fixed `formatAge()`'s sign handling.
- Mobile: `features/growth/reference.ts` is a new, small switch — `growthReferenceFor(correctedAgeTotalDays)` — that names which growth standard *should* apply: a preterm-referenced standard (e.g. Fenton-style) while corrected age is negative, a term infant standard (e.g. WHO Child Growth Standards) once it crosses zero. Per the Open Product Decision #1 rule (Section 9: don't hard-code an unresolved clinical choice, but don't block the architecture on it either), this only decides the *label*, not the percentile numbers — no curve is fabricated, consistent with Section 2.3's explicit "do not fabricate percentile curves" acceptance criterion. `app/(tabs)/growth.tsx` computes it from the baby's current corrected age and passes the resulting disclaimer into the chart legend and its accessibility label, replacing the previous static "pending clinical review" text.
- Mobile: `components/domain/GrowthChart.tsx` axis math now supports a negative x-domain (previously hardcoded to start at 0, which would have plotted every preterm reading on top of each other at the left edge) and draws a dashed "Due date" marker at corrected-age zero so preterm readings sit meaningfully to its left. The chart's `accessibilityLabel` now phrases negative ages as "N weeks before the due date" instead of a bare negative number.
- Mobile: `app/(tabs)/home.tsx`'s corrected-age hero label now reads "N days pre-term" instead of a bare negative number, since it shares the same underlying calculation.
- Verified: updated `__tests__/age.runner.ts` with an extreme-preterm case asserting corrected age stays negative (`-110` days, not `0`) plus `formatAge`/`formatAgeDetailed` sign-handling assertions — `npm test` passes. `tsc`/`eslint` clean on the mobile package (only the pre-existing unrelated `age.runner.ts` extension error under `tsc` remains); backend untouched and still green. Per the user's explicit note, did not attempt to click-verify in the browser preview since `expo-sqlite` writes don't complete there (documented gap under 2.1/2.2).
- Gap carried forward: still no real named/versioned clinical dataset behind either reference label (Open Decision #1 unresolved) and no fabricated percentile curve — by design, pending clinical sign-off.

### 2026-09-07 — Phase 2.2/2.3: growth measurement pipeline + real Growth screen

- Backend: implemented the previously-stubbed `growth` domain end to end — `services/api/src/domains/growth/{repository,schema,service,routes}.ts` (in-memory repo, plausibility-bounds validation flagged `NEEDS-CLINICAL-REVIEW`, audit-trail hook), registered in `server.ts`, migration added to `001_initial.sql`. Covered by `services/api/test/growth.test.ts` (create/list/filter-by-metric/reject-implausible/audit — 4 passing, full suite still green at 10/10).
- Mobile: new `features/growth/` module (`types.ts`, `validation.ts`, `storage.ts`, `stats.ts`) plus a `growth_measurements` SQLite table in `lib/offline/database.ts`, following the same local-first + mutation-queue pattern as care-events. Resolved the gap flagged in Section 2.2 of the plan: weight growth points are read directly from the existing `WeightEvent` history (no duplicate capture), while length/head-circumference get a new dedicated screen, `app/track/add-growth.tsx`, built from the shared `EntryForm` skeleton like every other Add-X screen.
- Mobile: `app/(tabs)/growth.tsx` rewritten to show real data — segmented Weight/Length/Head Circ. selector, live corrected-age indicator, a real latest-value/Δ-vs-previous/Δ7d stat pair, and a "+" header action routed to the right add screen per metric. `components/domain/GrowthChart.tsx` now plots real measurements (each placed at the corrected age it was taken at) with a data-driven axis instead of the old hardcoded prototype shape, still using plain Views (no charting library added). `ScreenHeader` gained an optional `right` slot to support the add button.
- Deliberate visual deviation from the literal prototype (Constitution 0.A #4): the pink percentile-band shape was dropped rather than kept as a fabricated curve — Open Product Decision #1 (growth standard) is unresolved and Section 2.3 explicitly forbids fabricating percentile curves, so the legend carries a text-only "pending clinical review" placeholder instead.
- Verified: `tsc`/`eslint` clean on both packages (only the pre-existing unrelated `age.runner.ts` extension error remains); backend test suite green. Mobile UI verified live in a `react-native-web` preview — baby profile setup, Growth tab empty states per metric, segmented switching, and the Add Measurement screen (including its Length/Head Circ. toggle) all render and route correctly.
- Gaps flagged: (1) the interactive pinch/drag chart and a full screen-reader data-table alternative from Section 2.3 are not built — the chart currently exposes only a computed `accessibilityLabel` summary; deferred to the Phase 5 accessibility pass. (2) Could not click-verify the actual save → local DB write → chart re-render path: `expo-sqlite` writes (`runAsync`) hang indefinitely in this web preview session. Confirmed this reproduces identically on the untouched, pre-existing Add Weight screen, so it's an environment limitation of the web preview (reads work, writes don't), not a defect in the new growth code — consistent with the same caveat already recorded under 2.1. Needs an iOS/Android run to confirm end to end. (3) The mobile local growth pipeline and the new backend `/v1/babies/{id}/growth` endpoint are not yet reconciled — mobile is local-only until Phase 5 sync, matching how care-events already works today.

### 2026-09-06 — Phase 1 polish: group tracking history by day

- Mobile: the per-type history screen (`app/track/history/[type].tsx`) now groups entries under day headers ("Today", "Yesterday", then `Fri, Sep 4`-style dates for older days) instead of one flat list, via a new `groupEventsByDay` helper in `features/care-events/rowConfig.ts`. Groups preserve the existing chronological-descending order from `loadCareEventHistory`, so no extra sort was needed.
- Verified the grouping function's date-bucketing logic in isolation (today/yesterday/older-day labeling across a multi-day event list) and confirmed the history screen still renders its empty state without error in a `react-native-web` preview; `tsc`/`eslint` clean (only the pre-existing unrelated `age.runner.ts` error remains). Full grouped-list rendering with real entries needs a real iOS/Android run since `expo-sqlite` doesn't run on web.

### 2026-09-06 — Phase 1 polish: safe-area padding, keyboard/drag stepper editing, weight precision

- Mobile: added a `SafeAreaProvider` at the root and a new shared `FormScreen` wrapper (`components/ui/Screen.tsx`) that pads content below the status bar/notch; `TabScreen` now does the same for the tab screens. Every Add-X screen, the per-type history list, Baby Setup, and Onboarding were switched onto this so top padding always clears the device notification bar instead of each screen guessing its own padding.
- Mobile: `NumericStepper` (`components/ui/NumericStepper.tsx`) now supports tap-to-edit — tapping the value switches it to a focused, select-all `TextInput` (decimal keypad) so it can be typed directly — and drag-to-scrub — a vertical `PanResponder` drag adjusts the value continuously, one `step` per ~14px, as a touch-friendly stand-in for a scroll wheel. Both paths, plus the existing +/- buttons, now round through a shared `roundToStep` helper keyed off the field's `step`, fixing the floating-point drift that previously showed values like `1.95555555555 kg`.
- Mobile: Add Weight's step changed from `0.05` to `0.1` so the value always displays and stores at exactly one decimal place, per explicit request.
- Verified via `tsc`/`eslint` (mobile clean, only the pre-existing unrelated `age.runner.ts` extension error remains) and a live `react-native-web` walkthrough of Add Weight: confirmed the value renders as `2.0`, typing `1.23456` and blurring commits `1.2`, and the ruler highlight tracks the rounded value.
- Gaps flagged: the vertical drag-to-scrub gesture is a touch analogue for "scroll to edit," not a literal scroll-wheel/mouse-wheel handler — no mouse-wheel (`onWheel`) support was added since the target platforms are iOS/Android, not web.

### 2026-09-06 — Phase 2 (partial): Home dashboard reflects real baby data + photo upload

- Mobile: Home screen (`app/(tabs)/home.tsx`) no longer shows hardcoded mock data — it now loads the saved `BabyProfile` and today's care events on every focus (`features/baby-profile/storage.ts#loadBabyProfile`, new `getProfile` in `lib/offline/database.ts`, new `features/care-events/todaySummary.ts`), so the baby hero card, actual/corrected age, and the four "Today at a glance" metric cards (weight, feeding, sleep, diapers) now reflect whatever the user entered in Baby Setup and logged in Track. Added a proper empty state (no fabricated data) prompting profile setup when none exists yet, and genuine per-metric empty states ("No weight logged yet", etc.) instead of the old static numbers.
- Mobile: `BabyHeroCard` photo is now insertable — tapping it opens the device photo library (`expo-image-picker`, added as a new dependency) and saves the selected photo's URI onto the baby profile immediately.
- Gaps flagged: caregiver name in the header greeting is still hardcoded ("Mama") since auth/caregiver profile (Phase 0.3) isn't built yet; weight delta caption only compares the two most recent weight entries if their units match (no unit conversion yet, consistent with the Phase 1 gap already on record); photo storage is local-only (`file://` URI on device), no remote/object storage per Open Decision #4.
- Verified via `tsc` (no new errors beyond the pre-existing `age.runner.ts` extension warning) and a `react-native-web` walkthrough of Home's empty state and Baby Setup's form; full save→Home data flow could not be click-verified in the web preview because `expo-sqlite` doesn't run there without extra WASM config (same known, already-documented limitation as the Phase 1 entry below, not something this change introduces) — needs a real iOS/Android run to confirm end-to-end.

### 2026-09-06 — Phase 1: Tracking (end-to-end care event logging)

- Backend: added the `care-events` domain (envelope + per-type discriminated validation for feeding/weight/diaper/sleep/temperature/medication/note, idempotency-key dedup, full CRUD routes) and the `audit` domain (actor/action/entity/timestamp trail, no raw payload), wired together so every create/update/delete on a care event is audited. Migration adds the `care_events` table. 6 new vitest cases, including an explicit check that medication events never carry dosing-guidance fields.
- Mobile: local-first care-event storage on SQLite; generalized `EntryForm` into a config-driven skeleton (segmented/stepper/text/time fields) shared by all six Add-X screens plus new shared `TimePicker`, `UnitSelector`, `NotesInput`; built Add Feeding (rewired), Add Weight, Add Diaper, Add Sleep, Add Temperature, Add Medication, Add Note; Track screen now reads real latest-per-type data with genuine empty states; every Add screen doubles as an edit screen (`?id=`) and a shared per-type history list offers inline delete, both behind confirmation dialogs.
- Gaps flagged (see [PREEMIETRACK_PLAN.md](PREEMIETRACK_PLAN.md) Section 11, Phase 1): no live kg↔lb conversion widget on the Weight form; Sleep only supports start/end entry, not a separate duration-input mode; Notes have no search/filter UI yet; backend care-events/audit services are still in-memory per server instance (same prototype-stage pattern as `baby-profile`), not yet backed by the Postgres migration.
- Verified via `tsc`, `eslint`, and vitest in both packages, an `expo export` bundle check, and a live `react-native-web` walkthrough of Track → Add Feeding → save (SQLite itself doesn't run on web without extra WASM config, which is out of scope since web isn't a target platform).
