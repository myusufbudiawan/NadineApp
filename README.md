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

## Notes for contributors

- Keep app route files thin: reusable UI belongs in `components/`, feature logic in `features/`, and shared platform code in `lib/`.
- A backend domain owns `routes.ts`, `service.ts`, `repository.ts`, and `schema.ts`. Domains must communicate through services, never another domain’s repository.
- Store session secrets only through platform secure storage. Do not put secrets or health data in logs, analytics, or plaintext storage.
- Implement only the active phase in the plan and update its checklist when its acceptance criteria are actually met.
- **Update the Changelog below for every change**, per [PREEMIETRACK_PLAN.md](PREEMIETRACK_PLAN.md) Section 0, rule 6 — newest entry at the top, one entry per session/PR, gaps flagged rather than glossed over.

## Changelog

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
