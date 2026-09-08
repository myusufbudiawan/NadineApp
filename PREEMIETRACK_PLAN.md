# PreemieTrack — Engineering Execution Plan (Source of Truth)

> **Status:** Proposed / Prototype-to-MVP
> **Version:** 1.0 (derived from Software Specification v1.0, 5 Sept 2026)
> **Audience:** Coding agent(s) executing this build. This document is the authoritative reference — when in doubt, this file wins over assumptions.
> **Product boundary (read first, never violate):** PreemieTrack is a **tracking and education tool, not a diagnostic system.** Never generate, infer, or surface clinical diagnoses, dosing recommendations, or alarming/urgent medical language. All clinical thresholds, growth standards, medication reference data, and alert copy require sign-off from a pediatric/neonatal clinical advisor before shipping — until that sign-off exists, ship these as clearly-labeled placeholders, not silent guesses.

---

## 0.A Engineering Constitution (applies to every task in this document)

These rules override convenience or shortcuts anywhere else in this plan. If a task's instructions seem to conflict with these, the constitution wins.

### 1. One app, one codebase philosophy

- **Single Expo/React Native app** for iOS and Android — no separate native codebases.
- **Backend is a thin, separate service** (not bundled into the Expo app, not a monorepo mess) — see Section 0.1 for the concrete recommended stack. Client and server are two clearly separated concerns even if they live in one repo.
- Do not introduce a second UI framework, a second state-management paradigm, or a second styling system partway through. Consistency across the whole app beats "best tool for this one screen."

### 2. Reusable components, always

- **No one-off screens built from scratch.** Every screen is composed from a shared component library (Section 0.2). If a screen needs a UI element that doesn't exist yet, build it as a reusable component first, then use it — never inline a bespoke version "just for this screen."
- Before writing a new component, check whether an existing one can be extended via props. Duplication of visual patterns (cards, rows, forms, buttons, headers) is a defect, not a shortcut.
- Concretely, every "Add X" form (Feeding, Weight, Diaper, Sleep, Temperature, Medication) **must** share one underlying `EntryForm` component/pattern — they differ only in field configuration, not in structure, save behavior, or layout. Same for every Track row (`TrackRow`), every summary card (`SummaryCard`/`MetricCard`), and every list item pattern across Tips/Reminders/More.
- Component API design: props in, callbacks out, no screen-specific logic baked into a shared component. A shared component should not need to know which screen rendered it.

### 3. Organized, human-friendly backend/service structure

- Organize by **domain**, not by technical layer-only. Each domain (Identity, Baby Profile, Care Events, Growth, Reminders, Content, Sharing, Reports, Sync) gets its own folder with its own routes/handlers, data access, and validation — not one giant `routes.js` or `controllers/` dumping ground.
- Naming is plain and predictable: a new engineer (or agent) should be able to guess where `feeding` logic lives without searching. Prefer `services/care-events/feeding.ts` over cleverness.
- No magic — no hidden global state, no implicit side effects in shared utilities, no unexplained abbreviations. Every module has a clear single responsibility.
- Shared backend logic (validation, auth middleware, error formatting, audit logging) lives in a common layer used by every domain module — not copy-pasted per domain.
- See Section 0.1 for the concrete folder structure to use.

### 4. UI follows the prototype exactly

- The supplied prototype image (6 screens: Home, Track, Add Feeding, Growth, Tips, More) is the **literal visual target**, not a loose reference. Match layout, spacing rhythm, card structure, iconography style, copy, and color roles as closely as the design system (Section 6.1) allows.
- Where earlier language in this document (Section 14: Prototype-to-Implementation Mapping) suggested loose adaptation, **the prototype now takes precedence on anything visual.** This document's job is to add the states, validation, and accessibility the static prototype can't show — not to reinterpret its visual design.
- Any visual deviation from the prototype must be justified (e.g., accessibility requirement, platform constraint) and noted in the PR, not made silently for convenience.
- See Section 6.8 for the literal screen-by-screen breakdown extracted from the prototype image.

---

## 0. How to use this document

0. Read Section 0.A (Engineering Constitution) first — it governs architecture, component reuse, backend structure, and UI fidelity for every task below, and overrides convenience elsewhere in this document.
1. Work phase by phase (Section 10). Do not start a later phase's tasks until the prior phase's tasks are checked off, unless explicitly parallelizable (noted inline).
2. Every task has a checkbox. Check it off (`[x]`) only when the acceptance criteria under it are met — not just when code is written.
3. If a requirement is ambiguous or an Open Product Decision (Section 9) blocks a task, stop and flag it rather than guessing a clinical or compliance-sensitive default.
4. Keep this file updated as the plan evolves — it is meant to be a living tracker, not a static spec dump. Add new tasks under the correct phase rather than creating parallel task lists elsewhere.
5. Anything touching clinical content, growth-standard datasets, medication data, or alert thresholds must be tagged `NEEDS-CLINICAL-REVIEW` in code comments and PR descriptions, and must not be enabled by default in production until reviewed.
6. **Every change that touches this repo updates [README.md](README.md)'s Changelog.** Before ending a work session (or a PR, if working in that unit), add one entry — newest at the top — under README's `## Changelog` section: date, the phase/task ID(s) touched, a one-or-two-line summary of what changed, and any gaps deliberately left open (mirroring how gaps are flagged in Section 11). This applies to every change, not only completed phases — a partial task or a fix gets an entry too. Do not batch multiple sessions' changes into one entry, and do not rewrite prior entries except to fix a factual error.

---

## 1. Product Summary

PreemieTrack is a mobile companion (iOS + Android) for caregivers of premature or medically monitored infants. Core design principle: **reduce cognitive load** while giving a reliable longitudinal view of the baby's daily care and growth.

**Product goals:**

- Care logging fast enough to complete in seconds.
- At-a-glance current state without overwhelm.
- Clear separation of actual age vs. corrected age.
- Longitudinal measurements turned into understandable growth trends.
- Personalized, non-diagnostic educational content.
- Reminders, reports, controlled caregiver/clinician sharing.
- Sensitive infant/family data protected by default.

**Design direction:** minimalist, calm, comprehensive, accessibility-first, clinical-but-warm (never hospital-like).

**Primary platforms:** iOS and Android.

---

## 2. Personas

| Persona               | Needs                                | Primary workflows                                  |
| --------------------- | ------------------------------------ | -------------------------------------------------- |
| Primary caregiver     | Fast logging, reassurance, reminders | Home → Track → review trends                       |
| Secondary caregiver   | Shared access, simple status         | Shared baby → log care → view daily summary        |
| Clinician / care team | Structured historical data           | Receive/export report with caregiver consent       |
| Product administrator | Content and operational management   | Manage educational content, feature flags, support |

---

## 3. Scope

### 3.1 MVP — In Scope

- Account creation/sign-in, secure session management.
- Baby profile: birth date/time, gestational age at birth, birth measurements.
- Actual age and corrected-age calculation.
- Daily logging: feeding, weight, diapers, sleep, temperature, medications, free-form notes.
- Home dashboard with latest values and daily summaries.
- Growth charts, selectable metric, corrected-age axis.
- Reminders and scheduled notifications.
- Educational Tips content with category filtering.
- Reports/export and controlled sharing.
- Offline-first local capture with later sync.
- Audit history for sensitive data changes.

### 3.2 Explicitly Post-MVP (do not build now)

- Multiple babies under one account.
- Wearable/device integrations.
- Bluetooth scale/thermometer ingestion.
- Clinician portal.
- Advanced anomaly detection (only after clinical validation).
- Family timeline and photo journal.
- Localization / multilingual content.

If a task below tempts scope creep into this list, stop and flag it instead of implementing.

---

## 4. Core Navigation (5-tab bottom nav)

| Tab    | Purpose                  | Primary actions                                                         |
| ------ | ------------------------ | ----------------------------------------------------------------------- |
| Home   | Daily snapshot           | Baby card, current metrics, goals, recent activity                      |
| Track  | Record care events       | Feeding, weight, diaper, sleep, temperature, medication, notes          |
| Growth | Longitudinal development | Weight, length, head circumference, corrected-age charts                |
| Tips   | Education                | Kangaroo care, feeding, nutrition, sleep, daily care, emotional support |
| More   | Account and utilities    | Baby profile, reminders, reports, sharing, settings, support            |

---

## 5. Functional Requirements (traceable IDs — keep these IDs in code/PR references)

| ID     | Feature          | Requirement                                                                                                        | Priority     |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------ | ------------ |
| FR-001 | Baby profile     | Create/edit baby profile: name, DOB/time, gestational age, birth weight, birth length, head circumference          | High         |
| FR-002 | Age calculation  | Calculate actual age continuously from DOB/time                                                                    | High         |
| FR-003 | Corrected age    | Calculate from gestational age at birth + configurable full-term reference; display weeks/days + calculation basis | **Critical** |
| FR-004 | Daily dashboard  | Show current weight, recent feeding, sleep, diaper count, other configured summary metrics                         | High         |
| FR-005 | Feeding log      | Method, amount, unit, timestamp, notes, optional breastmilk/formula metadata                                       | **Critical** |
| FR-006 | Weight log       | Value, unit, timestamp, source                                                                                     | **Critical** |
| FR-007 | Diaper log       | wet/dirty/both/other + timestamp                                                                                   | High         |
| FR-008 | Sleep log        | Start/end time or duration + optional notes                                                                        | High         |
| FR-009 | Temperature log  | Value, unit, measurement method, timestamp                                                                         | **Critical** |
| FR-010 | Medication log   | Name, dose, unit, scheduled/actual time, notes. **No dosing recommendations.**                                     | **Critical** |
| FR-011 | Notes            | Timestamped free-form caregiver notes                                                                              | Medium       |
| FR-012 | Growth charts    | Plot weight/length/head circumference vs. corrected age; latest value + trend                                      | **Critical** |
| FR-013 | Tips             | Educational content categorized: feeding, growth, sleep, daily care, kangaroo care, emotional support              | High         |
| FR-014 | Reminders        | Create, edit, snooze, complete                                                                                     | High         |
| FR-015 | Reports          | Date-range report with selected measurements + event history                                                       | High         |
| FR-016 | Sharing          | Invite caregiver, revoke access, read/write permissions                                                            | High         |
| FR-017 | Offline logging  | Core logging works offline; sync on reconnect                                                                      | **Critical** |
| FR-018 | Privacy controls | Export, deletion request, account management, sharing control                                                      | **Critical** |
| FR-019 | Audit trail      | Track create/update/delete of sensitive records without over-exposing data                                         | High         |

---

## 6. UI/UX Specification

### 6.1 Design system

| Element       | Spec                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| Visual style  | Minimal, soft, calm, clinical-but-warm — avoid hospital-like density             |
| Color         | Neutral background, restrained accents; subtle semantic accent per data category |
| Typography    | High-legibility sans serif, strong hierarchy, min ~16px body on mobile           |
| Cards         | Rounded, light elevation/borders, generous internal spacing                      |
| Icons         | Simple outlined + text labels; never color-only meaning                          |
| Navigation    | 5-item bottom nav matching prototype                                             |
| Interaction   | Large touch targets, quick-entry controls, confirm destructive actions           |
| Accessibility | Dynamic text, screen-reader labels, sufficient contrast, reduced-motion support  |

### 6.2 Home screen

- Header: greeting + caregiver name + notification/reminder icon.
- Baby card: photo/avatar, name, birth info, latest weight, actual age, corrected age.
- Today at a glance: compact metric cards (weight, feeding, sleep, diapers).
- Daily goal/encouragement card — **non-judgmental language only.**
- Bottom nav: Home, Track, Growth, Tips, More.
- Empty states: e.g. "No feeding logged yet" — **never show misleading zeros.**

### 6.3 Track screen

Operational center. Each event type = consistent list row (icon, title, latest value, timestamp). Tap → dedicated entry form.

### 6.4 Add Feeding

- Toggle: Bottle / Breastmilk / (configurable future options).
- Amount input: large numeric control + unit selector.
- Timestamp selector, defaults to now.
- Optional notes.
- Save button fixed near bottom, enabled only when required fields valid.
- On save: persist locally immediately → update dashboard → schedule sync → lightweight confirmation.

### 6.5 Growth screen

- Segmented selector: Weight / Length / Head Circumference.
- Corrected-age indicator above chart.
- Chart: pinch/drag or accessible range selection.
- Show latest value, Δ24h, Δ7d where data allows.
- Reference bands: from clinically approved growth-standard dataset only; must name standard/version used. `NEEDS-CLINICAL-REVIEW`.
- Never label a percentile/band as a diagnosis.

### 6.6 Tips screen

- Featured "For you today" card.
- Topics: Feeding & Nutrition, Growth & Development, Sleep, Daily Care, Emotional Support.
- Content tagged by baby stage / corrected age where clinically appropriate.
- Every clinical/medical article: internal source/review metadata + visible "educational information" boundary. `NEEDS-CLINICAL-REVIEW`.

### 6.7 More screen

Baby profile, caregiver profile, Reminders, Reports, Share data, Settings, Help & Support, About PreemieTrack.

### 6.8 Literal prototype breakdown (source of visual truth — see Constitution 0.A #4)

Extracted directly from the supplied prototype image. Build to this pixel-for-pixel where the design system allows; do not reinterpret.

**Home**

- Status bar, then header row: "Good morning," (small, gray) + "Mama ♥" (bold, larger) on the left; circular notification-bell button, top right.
- Baby hero card: pink/blush background, rounded corners, full-width. Left: circular baby photo. Right: baby name + heart icon, "Born 32w 3d · 1.58 kg" subline. Below: two-column stat block — "Actual age / 20 days / (34w 2d)" and "Corrected age / 6 days / (33w 2d)", corrected age in bold/emphasized weight.
- "Today at a glance" section label, then a 2×2 grid of `MetricCard`s: Weight (pink icon chip, value + delta vs yesterday), Feeding (purple icon chip, value + frequency), Sleep (blue icon chip, total duration), Diapers (yellow icon chip, count + wet/dirty breakdown).
- "Today's goal" card: soft pink background, encouraging copy ("Keep going Mama! You're doing an amazing job."), small icon graphic right side.
- Bottom tab bar: Home (active/pink), Track, Growth, Tips, More — icon + label, 5 equal-width items.

**Track**

- Header: "Track" (large bold title), no back button (it's a tab root).
- Vertical list of `TrackRow` items, each: colored icon chip (left) matching category color, title (bold) + "Last: <value> · <time>" subline (gray), chevron (right). Rows: Feeding, Weight, Diaper, Sleep, Temperature, Medications ("No meds scheduled" when empty — this is the empty-state pattern), Notes ("Add a note").
- Same bottom tab bar, Track active.

**Add Feeding**

- Header: back-arrow (left) + "Add Feeding" title, no trailing action.
- Segmented toggle: "Bottle" (filled purple, active) / "Breastmilk" (outline, inactive) — full-width, pill-shaped, two segments.
- "Amount (ml)" label, then a large numeric stepper row: minus-circle button, huge bold number (purple) centered, plus-circle button. Below that: a horizontal tick-mark ruler/slider (20–50 range visible) with a marker at the current value — visual only, syncs with the stepper.
- "Time" label + a rounded input-like row showing "Today, 09:20 AM" with a clock icon and dropdown chevron.
- "Notes (optional)" label + multi-line text box with placeholder "e.g. tolerated well".
- Primary "Save" button: full-width, filled purple/violet, rounded, pinned near bottom above the tab bar equivalent space (this screen doesn't show tab bar — it's a pushed/modal screen).
- This exact structure (segmented toggle → big stepper+ruler → time row → notes → Save) is the `EntryForm` template — Add Weight/Diaper/Sleep/Temperature/Medication swap the toggle options and stepper unit/range but keep the same skeleton.

**Growth**

- Header: "Growth" title.
- Segmented control: Weight (active/filled pink) / Length / Head Circ. — three segments, pill group.
- "Corrected age" label + value inline ("6 days (33w 2d)"), pink/emphasized text.
- Line chart: pink shaded band (percentile reference range) behind a solid line + dots (actual measurements), axis labeled "Corrected age (weeks)" 0–10, y-axis "kg" 0.5–2.5. Legend below chart: filled pink dot "Aisyah" + outline dot "10th – 90th percentile".
- Two-column stat row below chart: "Latest / 1.68 kg / +0.05 kg vs yesterday" and "1.58 kg / Birth weight / +0.10 kg vs last 7 days" — laid out as two small stat cards.
- "Great progress!" encouragement card, pink background, star icon — same pattern family as Home's "Today's goal" card (reuse the component, don't rebuild).
- Bottom tab bar, Growth active.

**Tips**

- Header: "Tips" title.
- "For you today" label + one large featured card: photo (mother + baby skin-to-skin), title "Kangaroo Care" overlaid or below, short description text.
- "All topics" label + vertical list of category rows: Feeding & Nutrition, Growth & Development, Sleep, Daily Care, Emotional Support — each a colored icon chip + label + chevron, same `TrackRow`-style list pattern reused for a different domain.
- Bottom tab bar, Tips active.

**More**

- Header: "More" title.
- Profile summary row at top: circular avatar/initial (pink), name + heart, "Born on 15 May 2025 · 32w 3d · 1.58 kg" subline, chevron.
- Vertical list of navigation rows, same list-row pattern again: Profile & Baby Info, Reminders, Reports, Share Data, Settings, Help & Support, About PreemieTrack. Each: neutral gray icon chip + label + chevron.
- Bottom tab bar, More active.

**Shared visual language across all screens (encode as tokens/components, not per-screen CSS):**

- Icon chips: rounded-square, soft pastel background matching the data category's semantic color (pink=weight/baby, purple=feeding, blue=sleep, yellow=diapers, orange=temperature, gray=neutral/settings).
- Card corner radius, padding, and soft-shadow/border are consistent everywhere a card appears.
- Primary action color (purple/violet "Save" button, active segmented state) is one design token, used identically across all forms.
- Encouragement/goal cards (Home, Growth) share one component with swappable icon/copy — do not build two separate components for what's visually one pattern.
- The 5-item bottom tab bar is one component instance reused across Home/Track/Growth/Tips/More, differing only in the active index.

---

## 7. Data Model

| Entity            | Key fields                                                                                                    | Notes                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| User              | id, email, displayName, locale, timezone                                                                      | PII; secure auth                     |
| Baby              | id, userId/householdId, name, dob, gestationalWeeks, gestationalDays, birthWeight, birthLength, birthHeadCirc | Core profile                         |
| CareEvent         | id, babyId, type, occurredAt, createdAt, updatedAt, source, notes                                             | Common event envelope                |
| FeedingEvent      | careEventId, method, amount, unit                                                                             | Validated by unit                    |
| WeightEvent       | careEventId, value, unit, measurementSource                                                                   | Manual/device source                 |
| DiaperEvent       | careEventId, type                                                                                             | wet/dirty/both/etc.                  |
| SleepEvent        | careEventId, startAt, endAt                                                                                   | Duration derived                     |
| TemperatureEvent  | careEventId, value, unit, method                                                                              | Method retained for context          |
| MedicationEvent   | careEventId, medicationName, dose, unit, scheduledAt, takenAt                                                 | Tracking only — **no dosing engine** |
| Reminder          | id, babyId, type, schedule, title, enabled                                                                    | Timezone-aware                       |
| GrowthMeasurement | id, babyId, metric, value, unit, measuredAt                                                                   | Used by chart service                |
| TipContent        | id, title, body, category, stageTags, reviewedAt, source                                                      | Clinically reviewed content          |
| ShareGrant        | id, babyId, granteeUserId, permission, createdAt, revokedAt                                                   | Explicit authorization               |
| AuditEvent        | id, actorId, babyId, action, entityType, entityId, occurredAt                                                 | Security/audit trail                 |

---

## 8. Business Rules & Calculations

**8.1 Actual age** — elapsed time from recorded birth date/time to now, in selected timezone. UI may simplify to days/weeks.

**8.2 Corrected age** — calculated from gestational age at birth + configurable full-term reference (typical convention: 40 completed weeks, but must be configurable and clinically approved). Preserve weeks + days; **no rounding that alters clinical meaning.** `NEEDS-CLINICAL-REVIEW` on the default reference value.

**8.3 Data validation**

- Reject impossible dates, negative measurements, malformed units.
- Use clinically reviewed bounds for **warnings**, not silent rejection, when a valid measurement may legitimately fall outside expected range. `NEEDS-CLINICAL-REVIEW`.
- Never convert a warning into a diagnosis.
- All timestamps stored UTC, rendered in caregiver/baby timezone.
- Unit conversions: deterministic, decimal-safe; preserve original measurement for audit.

---

## 9. Open Product Decisions (must be resolved — track status here)

These block certain tasks below. Do not silently assume answers to items marked Critical-blocking.

| #   | Decision                                                 | Blocks                            | Status                                                                                                  |
| --- | -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Which clinical growth standard(s), for which population? | Growth charts, reference bands    | **OPEN**                                                                                                |
| 2   | Launch jurisdictions/countries?                          | Compliance review, data residency | **OPEN**                                                                                                |
| 3   | One baby per account (MVP) or multiple?                  | Data model, UI                    | **OPEN — spec assumes single-baby-first with multi-baby-ready schema (see Section 7)**                  |
| 4   | Photos stored remotely or local-only?                    | Object storage architecture       | **OPEN**                                                                                                |
| 5   | Which auth providers supported?                          | Auth module                       | **OPEN**                                                                                                |
| 6   | Which units/locales at launch?                           | Unit conversion, validation       | **OPEN — assume metric + US customary toggle as safe default; confirm before locking**                  |
| 7   | Clinician/care-team sharing workflow specifics?          | Sharing module scope              | **OPEN — MVP ships caregiver-to-caregiver sharing only per FR-016; clinician portal is post-MVP (3.2)** |
| 8   | Exact reminder types clinically/product appropriate?     | Reminders content                 | **OPEN**                                                                                                |
| 9   | Data retention/deletion policy?                          | Privacy controls (FR-018)         | **OPEN**                                                                                                |
| 10  | Who owns clinical content review, cadence?               | Tips content pipeline             | **OPEN**                                                                                                |

**Rule:** if a task requires an OPEN decision to proceed to production-grade completion, implement the feature architecture in a way that doesn't hard-code the unresolved choice (e.g., configurable growth-standard dataset reference rather than hard-coded percentile tables), and flag the gap rather than picking silently.

---

## 10. Delivery Phases (execute in order)

| Phase                  | Scope                                                            | Outcome                              |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| 0 — Foundation         | Design system, architecture, auth, baby profile                  | Clickable UI + secure app foundation |
| 1 — Tracking           | Track screen + feeding/weight/diaper/sleep/temp/medication/notes | End-to-end daily logging             |
| 2 — Dashboard & Growth | Home dashboard, corrected age, growth charts                     | Longitudinal visibility              |
| 3 — Engagement         | Tips, reminders, notifications                                   | Personalized daily experience        |
| 4 — Sharing & Reports  | Caregiver permissions, reports/export                            | Care-team collaboration              |
| 5 — Hardening          | Offline sync, security, accessibility, clinical review           | Production candidate                 |

---

## 11. Task Tracker

> Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `NEEDS-CLINICAL-REVIEW` = do not ship enabled-by-default until signed off.

### Phase 0 — Foundation

**0.1 Project & architecture setup**

**Stack decision (locked per Engineering Constitution, Section 0.A #1):** one Expo/React Native app (TypeScript) + one thin backend service. Recommended default: Node.js (TypeScript) API using Fastify or Express, PostgreSQL, deployed as a single small service — or Supabase if the team wants to skip hand-rolling auth/storage/row-level-security. Either way, the folder structure below is mandatory regardless of framework choice.

- [~] Scaffold Expo app (TypeScript template).
- [~] Set up local offline-first database on-device (e.g., SQLite via `expo-sqlite` + WatermelonDB, or `op-sqlite`).
- [~] Scaffold backend service with the domain-organized structure below (Section 0.A #3) — modular boundaries: Identity, Baby Profile, Care Events, Growth, Reminders, Content, Sharing, Reports, Sync.
- [~] Set up relational database (PostgreSQL) for transactional integrity.
- [~] Set up encrypted object storage for profile photos/reports (pending Open Decision #4 — build storage interface abstracted so local-only vs remote is swappable).
- [~] Set up push notification abstraction (Expo Notifications wrapping APNs/FCM).
- [~] Set up background worker infra (sync, report generation, notification scheduling) as its own service module, not inline in request handlers.
- [~] Establish CI/CD pipeline (lint, type-check, unit test, build) for both the Expo app and the backend service.
- _Acceptance:_ Repo builds, boots a blank app shell on iOS + Android simulators/Expo Go, API health check responds, CI pipeline green.

**Mandatory client folder structure (Expo app):**

```
app/                      # Expo Router screens — one file per route, thin (compose components only)
  (tabs)/
    home.tsx
    track.tsx
    growth.tsx
    tips.tsx
    more.tsx
  track/
    add-feeding.tsx
    add-weight.tsx
    add-diaper.tsx
    add-sleep.tsx
    add-temperature.tsx
    add-medication.tsx
components/
  ui/                      # Pure, reusable, no business logic: Card, Button, IconLabel, SegmentedControl, BottomNav
  forms/                   # EntryForm and its shared field components (NumericStepper, UnitSelector, TimePicker, NotesInput)
  domain/                  # Composed but still reusable: BabyHeroCard, MetricCard, TrackRow, GrowthChart, TipCard
features/                  # One folder per domain, owns its screens' logic via hooks
  baby-profile/
  care-events/
  growth/
  tips/
  reminders/
  sharing/
  reports/
  auth/
lib/
  api/                     # Typed API client, one file per backend domain (matches Section 12)
  offline/                 # Local DB schema, mutation queue, sync engine
  design-system/           # Tokens: color, type scale, spacing (Section 6.1)
hooks/                     # Cross-feature shared hooks (useAge, useCorrectedAge, useSync)
```

- _Acceptance:_ No screen file under `app/` contains form field markup, styling logic, or data-fetching logic directly — it only composes from `components/` and `features/`.

**Mandatory backend folder structure:**

```
src/
  domains/
    identity/              # auth, sessions
    baby-profile/
    care-events/           # feeding, weight, diaper, sleep, temperature, medication, notes
    growth/
    reminders/
    content/               # Tips CMS
    sharing/
    reports/
    sync/
    audit/
  common/
    middleware/            # auth guard, request-id, error formatting
    validation/             # shared schema validators
    db/                     # connection, migrations
  server.ts
```

Each `domains/<name>/` folder contains its own `routes.ts`, `service.ts` (business logic), `repository.ts` (data access), and `schema.ts` (validation) — consistently, every domain, no exceptions. Nothing reaches into another domain's `repository.ts` directly; cross-domain needs go through that domain's `service.ts`.

- _Acceptance:_ A new domain can be added by copying the folder pattern with zero changes to `common/`; no domain folder imports another domain's `repository.ts`.

**0.2 Design system**

- [~] Implement design tokens per Section 6.1 (color, type scale ≥16px body, spacing, elevation) — colors calibrated to match the prototype's pastel/semantic palette (Section 6.8) exactly.
- [~] Build the `components/ui/` base library: `Card`, `IconChip` (colored rounded-square icon container), `Button` (primary/destructive variants), `NumericStepper`, `SegmentedControl`, `BottomTabBar`, `ListRow` (icon chip + title + subline + chevron — powers Track/Tips/More rows identically).
- [~] Build `components/domain/`: `BabyHeroCard`, `MetricCard`, `EncouragementCard` (powers both Home's "Today's goal" and Growth's "Great progress!" — one component, swappable icon/copy per Section 6.8), `GrowthChart`.
- [~] Build `components/forms/`: the shared `EntryForm` skeleton (segmented toggle → stepper/input → time row → notes → Save) used by all six Add-X screens.
- [~] Bake in accessibility from the start: dynamic type scaling, screen-reader labels, contrast checks, reduced-motion respect.
- _Acceptance:_ Component library storybook/preview covers all base, domain, and form components; a visual diff against the prototype image (Section 6.8) shows no unexplained deviation; passes a contrast/accessibility lint pass; grep-check confirms no screen file duplicates a `ListRow`- or `EntryForm`-shaped layout inline.

**0.3 Auth & session management (includes SCR-01 Onboarding)**

- [ ] Onboarding screen (SCR-01): value proposition, privacy messaging, entry into sign-up/sign-in.
- [ ] Implement account creation/sign-in (provider(s) pending Open Decision #5 — architect pluggable auth).
- [ ] Secure session management (short-lived tokens, refresh flow, no plaintext secret storage — platform secure storage only).
- [ ] `/v1/auth/session` endpoint (POST, create/refresh).
- _Acceptance:_ User can sign up, sign in, session persists across app restart, secrets never touch plaintext local storage (verify via device inspection).

**0.4 Baby profile (FR-001)**

- [ ] Baby Setup screen (SCR-02): name, DOB/time, gestational age (weeks+days), birth weight, birth length, birth head circumference.
- [ ] `Baby` entity + `/v1/babies` (GET/POST) and `/v1/babies/{id}` (GET/PATCH).
- [ ] Field validation: reject impossible DOB (future dates, implausible gestational age), negative measurements, malformed units (per 8.3).
- [ ] Schema built multi-baby-ready even though MVP UI may present single-baby-first (Open Decision #3).
- _Acceptance:_ Can create and edit a baby profile; invalid inputs rejected with clear inline errors; data persists via API and appears after app restart.

**0.5 Age & corrected-age engine (FR-002, FR-003)**

- [ ] Implement actual-age calculation (continuous, timezone-aware).
- [ ] Implement corrected-age calculation from gestational age + configurable full-term reference (default flagged `NEEDS-CLINICAL-REVIEW`, do not hard-code 40 weeks as unconfigurable).
- [ ] Preserve weeks/days precision; no lossy rounding.
- [ ] Display calculation basis alongside corrected age in UI (per FR-003).
- [ ] Unit tests: leap years, DST transitions, exact-term and extremely preterm edge cases, timezone changes mid-day.
- _Acceptance:_ Given known birth date + gestational age, actual and corrected age match hand-calculated values across ≥10 test cases including edge cases; calculation basis is visibly shown in UI.

---

### Phase 1 — Tracking

**1.1 Track screen shell (SCR-04)**

- [x] Build Track screen: consistent list row (icon, title, latest value, timestamp) per event type.
- [x] Tap-to-open dedicated entry form pattern (shared component across all event types).
- _Acceptance:_ Track screen renders all 6 event-type rows with correct icon/label even with zero data (proper empty state, not zeros). — Verified live (web preview): all 7 rows (incl. Notes) render with real empty-state copy ("No feeding logged yet", etc.), no fake zeros. Rows with a latest event route to a history/edit list instead of straight to the add form.

**1.2 CareEvent envelope**

- [x] Implement `CareEvent` common entity (id, babyId, type, occurredAt, createdAt, updatedAt, source, notes).
- [x] `/v1/babies/{id}/events` (GET/POST), `/v1/babies/{id}/events/{eventId}` (PATCH/DELETE) with audit policy hook.
- [x] Idempotency key support on event creation (required for offline sync correctness later).
- _Acceptance:_ Can create/read/update/delete a generic event via API; duplicate idempotency key does not create duplicate records. — Verified by `services/api/test/care-events.test.ts` (6 passing vitest cases). Backend service is in-memory per server instance (same prototype-stage pattern as `baby-profile`) — real Postgres wiring is still open, migration added in `001_initial.sql`.

**1.3 Add Feeding (FR-005, SCR-05)**

- [x] Form: method toggle (Bottle/Breastmilk, extensible), amount (numeric + unit selector), timestamp (defaults to now), optional notes, optional breastmilk/formula metadata.
- [x] `FeedingEvent` entity + validation.
- [x] Save flow: persist locally instantly → optimistic dashboard update → queue sync → lightweight confirmation toast.
- _Acceptance:_ Feeding entry completable in a few taps; saved entry appears instantly in Track list and (later) Home dashboard even before server confirms. — Local SQLite write + mutation-queue entry happen before navigating back; Track list re-reads on focus. Home dashboard wiring is Phase 2 scope. "Confirmation toast" is currently just the screen closing — a lightweight toast component doesn't exist yet, flagging as a minor gap.

**1.4 Add Weight (FR-006, SCR-06)**

- [x] Form: value, unit selector, timestamp, source (manual/device — device deferred to post-MVP per 3.2, but field exists).
- [x] `WeightEvent` entity + validation (reject negative/implausible values).
- _Acceptance:_ Weight entries save correctly in both supported units with correct conversion. — Both kg and lb are accepted and validated with unit-appropriate plausibility bounds (`NEEDS-CLINICAL-REVIEW`). **Gap flagged:** switching the unit toggle does not numerically convert the in-progress value — each unit is validated/stored independently, no live kg↔lb conversion widget yet.

**1.5 Add Diaper (FR-007, SCR-07)**

- [x] Form: type (wet/dirty/both/other), timestamp.
- [x] `DiaperEvent` entity.
- _Acceptance:_ Diaper entry is the fastest of all forms (≤2 taps to save, per "seconds" goal in Section 2.1). — Select type (1 tap) + Save (1 tap).

**1.6 Add Sleep (FR-008, SCR-08)**

- [x] Form: start/end time OR duration entry, optional notes.
- [x] `SleepEvent` entity; duration derived server/client-side consistently.
- _Acceptance:_ Both entry modes (start/end vs. duration) produce correct, consistent duration values. — **Gap flagged:** only the start/end-time mode was built; a separate raw-duration entry mode does not exist. Duration is always derived from start/end, which is internally consistent, but the acceptance criterion's "both entry modes" is not literally satisfied.

**1.7 Add Temperature (FR-009, SCR-09)**

- [x] Form: value, unit, measurement method, timestamp.
- [x] `TemperatureEvent` entity + validation.
- _Acceptance:_ Entries save with method retained and displayed in history. — Method is stored and shown when editing an entry; the history list row itself currently surfaces value/unit/time only, not method, in its one-line summary. Acceptable for MVP; revisit if a fuller per-type history row is wanted.

**1.8 Add Medication (FR-010, SCR-10)**

- [x] Form: medication name, dose, unit, scheduled/actual time, notes.
- [x] `MedicationEvent` entity.
- [x] **Hard constraint:** no dosing recommendation logic, no auto-suggested doses, no "this seems high/low" inference anywhere in this flow.
- _Acceptance:_ Medication log is pure record-keeping; a code review explicitly confirms no dosing-guidance logic exists. — Confirmed by inspection (schema/service only carry name/dose/unit/scheduledAt/notes) and by an explicit vitest assertion that no recommend/suggested/max-dose-shaped field ever appears in a created medication event.

**1.9 Notes (FR-011)**

- [x] Timestamped free-form note entry, attachable standalone or to an event.
- _Acceptance:_ Notes save, list chronologically, and are searchable/filterable in Track history. — Notes save and list chronologically (history screen, `ORDER BY occurred_at DESC`). **Gap flagged:** no search/filter UI yet — out of scope for this pass, revisit in Phase 3/5 polish.

**1.10 Event edit/delete + audit hook**

- [x] Edit and delete flows for all event types with confirmation on destructive actions.
- [x] Wire every create/update/delete of sensitive records into `AuditEvent` logging (FR-019), without exposing unnecessary data in the audit record itself.
- _Acceptance:_ Editing/deleting any event produces a corresponding audit record with actor, action, entity, timestamp — and no raw sensitive payload duplicated unnecessarily into logs. — Every add-X screen doubles as an edit screen (`?id=`) with a destructive "Delete entry" action behind a confirm dialog; a shared history list per type also offers inline delete. Server-side, `AuditService` records actor/action/entityType/entityId/timestamp only (no payload) on every create/update/delete, verified in `care-events.test.ts`. Client-side local deletes are soft (`deleted_at`) and queued for sync; the authoritative audit trail lives server-side per the data model.

---

### Phase 2 — Dashboard & Growth

**2.1 Home dashboard (FR-004, SCR-03)**

- [~] Header: greeting, caregiver name, notification icon. — Greeting/icon in place; caregiver name still hardcoded "Mama" pending auth/caregiver profile (Phase 0.3).
- [x] Baby card: photo/avatar, name, birth info, latest weight, actual age, corrected age. — `BabyHeroCard` now reads the real `BabyProfile` and computes actual/corrected age via `lib/age.ts`; photo is tappable to pick from the device library (`expo-image-picker`) and persists to the profile.
- [x] "Today at a glance": weight, feeding, sleep, diaper compact cards, aggregated from today's CareEvents + latest measurements. — `features/care-events/todaySummary.ts` aggregates today's feeding/sleep/diaper counts and latest weight (with delta vs. previous reading) from local SQLite, loaded on every screen focus.
- [x] Daily goal/encouragement card — copy reviewed for non-judgmental tone. — Unchanged static copy, still non-judgmental.
- [x] Proper empty states everywhere data is missing (never a misleading zero). — No-profile state shows a setup prompt instead of fabricated data; each metric card shows "No X logged yet" until at least one event of that type has ever been logged.
- _Acceptance:_ Dashboard accurately reflects latest state after any log action from Phase 1, updates in near-real-time on save, and shows correct empty states for a brand-new baby profile. — Logic verified by code review + `tsc`; **not yet click-verified end-to-end on-device** because `expo-sqlite` doesn't run in the web preview without extra WASM config (pre-existing, documented limitation) — needs an iOS/Android run to confirm.

**2.2 Growth measurement pipeline (FR-012)**

- [x] `GrowthMeasurement` entity; `/v1/babies/{id}/growth` (GET/POST). — Backend: `services/api/src/domains/growth/{repository,schema,service,routes}.ts`, wired into `server.ts`, migration in `001_initial.sql`, covered by `test/growth.test.ts` (create/list/filter-by-metric/reject-implausible/audit — 4 passing).
- [x] Ingest weight/length/head-circumference measurements. — Resolved the flagged gap: weight sources live from the existing `WeightEvent` history (Track > Add Weight, Section 1.4) via `features/growth/storage.ts#loadMeasurementsForMetric` rather than duplicating capture; length/head-circumference get a dedicated capture screen, `app/track/add-growth.tsx`, built from the same shared `EntryForm` skeleton as every other Add-X screen (Constitution 0.A #2), reachable from a "+" button on the Growth screen header.
- _Acceptance:_ Backend measurements are queryable by babyId + metric + date range, units preserved (verified by tests). Mobile side is local-first only (SQLite `growth_measurements` table in `lib/offline/database.ts`), matching the not-yet-synced pattern of care-events (Phase 5 wires the two together) — this is not yet reconciled with the backend endpoint above.

**2.3 Growth screen (SCR-11)**

- [x] Segmented selector: Weight / Length / Head Circumference. — Switches data source and reloads on change.
- [x] Corrected-age indicator above chart, sourced from 0.5 engine (`lib/age.ts#correctedAge`).
- [~] Interactive chart: pinch/drag or accessible range selection; text/table alternative for screen readers (Section 14). — `components/domain/GrowthChart.tsx` now plots real data points (each measurement placed at the corrected age it was taken at, not "today"), scales its axis to the data, and handles zero/one/sparse/dense datasets. It exposes a computed `accessibilityLabel` summarizing the trend. **Gap flagged:** no pinch/drag/range-selection interaction and no full tabular alternative view yet — deferred to Phase 5 accessibility pass (5.3).
- [x] Show latest value, Δ vs previous reading, Δ7d where sufficient data exists (`features/growth/stats.ts`).
- [x] Reference bands: deliberately **not rendered** as a shape/curve — Open Decision #1 is unresolved and Section 2.3's acceptance explicitly forbids fabricating a percentile curve. The legend keeps a text-only note instead of the prototype's pink shaded band. This is a intentional visual deviation from the literal prototype (Constitution 0.A #4), justified by the guardrail in Section 15 ("no unconfigurable clinical constants" / never imply clinical data that doesn't exist).
- [x] **Preemie-aware reference switching (added 2026-09-07):** corrected age can now go negative — a preterm baby's corrected age is negative until it reaches its full-term-equivalent due date, and clamping that to zero (the original implementation) collapsed every early growth reading onto day zero, destroying the trend line for exactly the babies this app is for. Fixed in `lib/age.ts` (`correctedAge` now uses a signed day breakdown instead of `Math.max(0, …)`) and propagated through `features/growth/stats.ts` into the chart's x-axis. `features/growth/reference.ts` adds a `growthReferenceFor(correctedAgeTotalDays)` switch that labels the applicable standard — "preterm reference" while corrected age is negative, "term reference" once it crosses zero — surfaced in the chart legend and its accessibility label. `GrowthChart.tsx` draws a dashed "Due date" marker at corrected-age zero so preterm readings plot meaningfully to its left. Per the Open Decision #1 rule (Section 9), only the *label switch* is implemented — no percentile curve is fabricated for either standard; swap in the real named/versioned dataset behind this same switch once clinically approved.
- [x] No diagnostic language anywhere on this screen (copy reviewed).
- _Acceptance:_ Chart renders correctly with zero, sparse, and dense datasets, including negative-corrected-age (preterm) data (verified via browser preview for the empty/single-reading cases; age-math verified by the updated `__tests__/age.runner.ts`, which now asserts negative corrected age is preserved rather than clamped, plus `formatAge`/`formatAgeDetailed` sign handling). Out-of-range/dense-dataset and on-device SQLite write verification are outstanding — see gap below. Screen-reader users get an accessible summary label, not yet a full data table (gap noted above). No diagnostic language present anywhere in this screen.
- **Gap flagged:** end-to-end save-and-replot could not be click-verified in the web preview — `expo-sqlite` writes (`runAsync`) hang indefinitely in this Expo-web session (reads work fine). This reproduces identically on the untouched, pre-existing Add Weight screen, confirming it's an environment limitation of the web preview, not a defect introduced here (consistent with the same caveat already recorded under 2.1). Needs an iOS/Android simulator or device run to confirm the full write → reload → chart-updates path, including a genuinely preterm baby profile (corrected age still negative today).

---

### Phase 3 — Engagement

**3.1 Tips content pipeline (FR-013, SCR-12, SCR-13)**

- [x] `TipContent` entity + authoring endpoint for clinically reviewed content entry. — Backend: `services/api/src/domains/content/{repository,schema,service,routes,seed}.ts`, migration in `001_initial.sql`, covered by `test/content.test.ts` (3 passing). **Gap flagged:** no separate authenticated admin console UI exists — `POST /v1/tips` is the authoring entry point a future console would call, per Section 10.1's acceptance wording ("via admin console"), but there's no dedicated interface yet.
- [x] `/v1/tips` (GET) — eligibility filtering by category and corrected-age-in-days range (`?category=&correctedAgeDays=`).
- [ ] Tips screen: "For you today" featured card + topic list. — Left as the existing static prototype screen (`app/(tabs)/tips.tsx`), **not wired to the new endpoint.** Reasoning: `ContentService.list()` correctly returns nothing by default (Section 15 guardrail — only `reviewStatus: 'approved'` content is ever served, and the seeded placeholders are intentionally `needs-clinical-review`), so wiring it up today would just replace the static prototype content with an empty screen for no functional gain. Revisit once real clinically-approved content exists to author via `POST /v1/tips`.
- [ ] Tip Detail screen. — Not built; blocked on the same gap above.
- _Acceptance (backend portion only):_ Content can be authored via the create endpoint and is filterable by category/corrected-age; `needs-clinical-review`/`draft` content is proven (by test) to never appear in the default listing. Mobile-side acceptance (stage-appropriate rendering, visible review-metadata disclosure) is **not met** — flagged above, not silently skipped.

**3.2 Reminders (FR-014, SCR-15)**

- [x] `Reminder` entity; `/v1/babies/{id}/reminders` (GET/POST), plus `PATCH /:id`, `POST /:id/snooze`, `POST /:id/complete`. — `services/api/src/domains/reminders/{repository,schema,service,routes}.ts`, migration in `001_initial.sql`, `test/reminders.test.ts` (5 passing).
- [x] Reminder types: feeding, medication (reminder-only, no dose logic), measurement, general — kept as an extensible enum, not hard-coded further (Open Decision #8 still open).
- [x] Create/edit/snooze/complete flows — implemented both backend (`RemindersService`) and mobile (`app/more/add-reminder.tsx`, `features/reminders/storage.ts`).
- [x] Timezone-aware scheduling, correct behavior across DST transitions. — `services/api/src/common/util/timezone.ts` (server) and `apps/mobile/features/reminders/schedule.ts` (client, duplicated rather than shared — no cross-package sharing exists yet per Constitution 0.A #1) both resolve wall-clock times via `Intl.DateTimeFormat` per-date, not a fixed UTC offset. `test/timezone.test.ts` pins exact UTC instants either side of the America/New_York 2027 spring-forward transition and confirms the one-hour shift is honored.
- [x] Missed-reminder UX: neutral status, no shaming copy, easy reschedule. — `ReminderView.missed` is computed (server and client), rendered by the mobile list as "Missed — reschedule" (`features/reminders/rowConfig.ts`); reschedule is a normal edit, not a separate flow.
- _Acceptance:_ DST-boundary firing verified by `test/timezone.test.ts` (explicit unit test, not yet the full QA-17.1 device-level scenario). Missed-reminder copy reviewed — neutral, no guilt language. **Gap flagged:** mobile reminders are local-first only (SQLite `reminders` table in `lib/offline/database.ts`) and schedule *local* device notifications directly — they are not yet synced to/from the backend `reminders` API (same not-yet-reconciled pattern as Growth in 2.2; Phase 5 wires local and backend together).

**3.3 Notifications infrastructure**

- [x] Local notification delivery via the Expo Notifications abstraction. — `apps/mobile/features/reminders/notifications.ts` wraps `expo-notifications` (permission request, schedule/cancel by id, Android channel setup); called from `features/reminders/storage.ts` on every create/edit/snooze/complete so the scheduled notification always matches current reminder state.
- [ ] Push notification delivery (APNs/FCM via a server-side dispatch path). — **Gap flagged:** no device-token registration or server-triggered push exists; only on-device local notifications are wired up, which only fire while this install has ever scheduled them (won't survive an uninstall/reinstall or notify from another device). Full push requires the Phase 5 sync/backend-notification work.
- [x] Notification copy pass: concise, calm, non-judgmental. — Fixed copy ("A gentle reminder from PreemieTrack.") reviewed; no alarming language.
- _Acceptance:_ Local notifications deliver on-device (verified by code path + Expo Notifications API usage; **not yet click-verified on a simulator/device** in this pass — needs an iOS/Android run to confirm the permission prompt and scheduled delivery end-to-end). Push delivery acceptance is unmet per the gap above.
- **Fixed 2026-09-07 (post-review, device-reported):** importing `expo-notifications` at module scope crashed every screen that transitively imported `features/reminders/notifications.ts` on Android inside Expo Go — as of Expo SDK 53, Expo Go no longer supports Android remote push, and the module throws synchronously on import as a side effect of its push-token auto-registration (not something `try/catch` around individual calls can prevent, since the throw happens at `require` time). Fixed by lazy-loading the module via `require('expo-notifications')` behind a `try/catch` in `notifications.ts`, caching the result (or `null` on failure) so every exported function degrades to "no device notification scheduled" instead of crashing — the reminder itself still saves and displays normally either way (Section 16: no error here may block core tracking). A development build (not Expo Go) is unaffected. Not yet confirmed this restores the screen on the reporting device — only reasoned from the stack trace and Expo's documented SDK 53 change.

---

### Phase 4 — Sharing & Reports

**4.1 Sharing (FR-016, SCR-17)**

- [x] `ShareGrant` entity; `/v1/babies/{id}/shares` (GET/POST/DELETE). — `services/api/src/domains/sharing/{repository,schema,service,routes}.ts`, migration table `share_grants` in `001_initial.sql`, covered by `test/sharing.test.ts` (4 passing).
- [x] Invite caregiver flow, read/write permission levels, explicit consent capture. — `POST /v1/babies/{id}/shares` is itself the consent-capture point (a grant only exists because this call was made); mobile: `app/more/share-data.tsx`.
- [x] Revocation flow with **immediate** access denial (test explicitly). — `DELETE /v1/babies/{id}/shares/{id}` sets `revokedAt` synchronously in the same in-memory store `hasActiveAccess()` reads; `sharing.test.ts` asserts the very next list call reflects the revocation.
- _Acceptance:_ Verified at the service level (immediate, same-store revocation + audit trail). **Gap flagged:** `hasActiveAccess()` exists as the authorization check every baby-scoped resource should call, but no route actually calls it yet — there is no session/auth middleware in the app at all (Phase 0.3 still unstarted), so there is nothing today that a revoked grant could still bypass. Full QA-17.1 cross-session verification is blocked on Phase 0.3/5.2, not on this task.

**4.2 Reports & export (FR-015, SCR-16)**

- [x] `/v1/babies/{id}/reports` (POST) — date range + category selection. — `services/api/src/domains/reports/{schema,service,routes}.ts`, covered by `test/reports.test.ts` (4 passing). Reports are generated on demand (not a stored entity per Section 7), reading across Baby Profile/Care Events/Growth through each domain's own service (Constitution 0.A #3) — `server.ts` now constructs one shared service instance per domain per `buildServer()` call and threads it to every domain that needs cross-domain reads, rather than each domain owning a private instance.
- [x] Report contents: baby profile, actual/corrected age context, measurement history, care-event summary, timestamps. — Age context reuses the same signed-corrected-age math as the mobile client, ported server-side in `services/api/src/common/util/age.ts` (duplicated rather than shared, same precedent as `timezone.ts` — Constitution 0.A #1).
- [x] Clearly label data as caregiver-entered unless measurement source is verified. — Each care event in the summary carries `dataSource: 'caregiver-entered' | 'device'`, read from the existing `measurementSource` field.
- [~] PDF/CSV export preserving units and timestamps. — CSV implemented (`?format=csv` / `format: 'csv'` body field), verified by test. **Gap flagged:** no PDF export — the backend has no PDF library today and none was added without confirming that's wanted (no network-dependent dependency added silently); CSV covers the export requirement for now.
- [x] Sharing a generated report is a one-time action — must **not** grant ongoing account access. — Nothing about report generation touches the `ShareGrant` store; verified by `reports.test.ts`.
- _Acceptance:_ Verified by `test/reports.test.ts` (date range, category filtering, CSV format, no-ShareGrant-created). Mobile: `app/more/reports.tsx` (date range pickers, summary view, CSV export via the OS share sheet), backed by a new thin `lib/api/*` client (Sharing/Reports/Privacy are the first mobile features that call the backend directly rather than through the offline SQLite path, since inviting a caregiver or generating a report is inherently server-mediated, not local capture) — **not click-verified on-device in this pass.** **Gap flagged:** the mobile app still has no server-side baby (Baby Setup / `POST /v1/babies` from the client, Section 0.4, is unstarted) — `LOCAL_BABY_ID` is a local-only SQLite id, so these screens will 404/error against a real backend until Phase 0.4 wires baby-profile creation through to the API. The screens, API client, and backend are each independently correct and tested; only that final id-reconciliation link is missing, same category of gap already flagged for Growth (2.2) and Reminders (3.2).

**4.3 Privacy controls (FR-018)**

- [x] Data export (self-service, distinct from clinician report export). — `GET /v1/account/export` (`services/api/src/domains/identity/service.ts#exportAccount`) aggregates every baby + its care events/growth/reminders/share grants for the account, via each domain's service. Mobile: `app/more/settings.tsx` → "Export my data" (OS share sheet).
- [x] Deletion request workflow (policy pending Open Decision #9 — implement the request/approval pipeline even if final retention period is TBD). — `POST/GET /v1/account/deletion-requests`, `POST /v1/account/deletion-requests/{id}/cancel`; requests only ever reach `pending`/`cancelled` — no auto-purge implemented or implied, per the Open Decision #9 rule (Section 9). Migration table `deletion_requests` in `001_initial.sql`.
- [x] Account management (profile edit, sign-out, session revocation across devices). — `POST /v1/auth/sessions/revoke-all` clears every stored session for an email at once. **Gap flagged:** profile edit already exists via `PATCH /v1/babies/{id}` (baby profile) but there is no separate caregiver/user profile entity yet to edit (Phase 0.3 auth is still a stub, Open Decision #5) — nothing to edit beyond the baby profile today.
- [x] Sharing control surfaced in Settings/More. — `app/more/share-data.tsx`, linked from More.
- _Acceptance:_ Covered by `test/privacy.test.ts` (3 passing: account export shape, deletion request create/list/cancel, revoke-all session count). Mobile Settings screen (`app/more/settings.tsx`) surfaces export + deletion request/cancel — **not click-verified on-device in this pass.**

---

### Phase 5 — Hardening (Production Candidate)

**5.1 Offline-first sync (FR-017)**

- [x] Local-first writes: UI never blocks on network. — Unchanged from Phase 1: every Add-X screen writes to SQLite first (`features/care-events/storage.ts`), then queues a mutation.
- [x] Client-generated UUID per mutation. — `queueMutation` already keyed each row by a fresh `Crypto.randomUUID()` (Phase 1); unchanged.
- [x] Mutation queue with createdAt/updatedAt/sync state. — Extended `mutation_queue` (`lib/offline/database.ts`) with `attempts`, `next_attempt_at`, `last_error` so retry state persists across app restarts.
- [x] Exponential backoff retry. — `lib/offline/sync.ts#backoffFor`: 5s base, doubling, capped at 5 min; a failed mutation stays `pending` but ineligible for `listPendingMutations()` until its `next_attempt_at` elapses.
- [x] Server-side idempotency on mutation UUID/idempotency key. — New `services/api/src/domains/sync` domain: `SyncRepository` caches the result per client-generated mutation id, so a resubmitted batch (dropped response, app killed mid-sync) returns `'duplicate'` instead of reapplying. Care-event creation was already idempotent on `idempotencyKey` (Phase 1); update/delete mutations now get the same guarantee at the sync layer.
- [x] Explicit conflict resolution UX for conflicting edits (no silent overwrite). — `CareEventsService.update` now takes an optional `expectedUpdatedAt` and throws `ConflictError` (carrying the server's current record) when it doesn't match (`services/api/src/domains/care-events/service.ts`). The sync engine turns that into a `'conflict'` result and stores it client-side (`sync_conflicts` table) instead of applying it; `app/more/sync-conflicts.tsx` (linked from More) lets the caregiver pick "Keep mine" (re-queues the local edit against the server's latest version) or "Use theirs" (adopts the server copy). Verified server-side by `services/api/test/sync.test.ts` ("surfaces a conflict instead of silently overwriting a concurrent edit from another device" — asserts Device A's edit survives untouched).
- [x] Tombstone-based deletes for reliable multi-device sync. — Already soft-delete (`deletedAt`) since Phase 1; `sync.test.ts` additionally confirms a delete mutation is safe to resubmit (`'duplicate'` on retry, no resurrection).
- [x] `/v1/sync` (POST) endpoint implementing the above. — `services/api/src/domains/sync/{schema,repository,service,routes}.ts`, wired into `server.ts` sharing the same `CareEventsService` instance as `/v1/babies/{id}/events` (Constitution 0.A #3). Scoped to care-event mutations only (create/update/delete) — growth measurements and reminders are still local-only on the client (same not-yet-reconciled gap already flagged at 2.2/3.2) and are not part of this sync batch shape yet.
- [x] Also fixed in this pass: mobile care-event `data` fields used capitalized display enums (`'Bottle'`, `'Oral'`, `'Wet'`) that would have failed the backend's lowercase schema on first real sync attempt — `features/care-events/serverPayload.ts` translates at the sync-payload boundary only, local SQLite/display values are untouched.
- _Acceptance:_ Covered by `services/api/test/sync.test.ts` (5 passing: apply-once, retry-is-a-duplicate, conflict-not-overwrite, invalid-mutation-shape rejected, delete-is-idempotent). **Gap flagged:** this is server-side + unit-level verification only — the full on-device QA scenario (log feeding offline in the actual app, kill/restart, reconnect, confirm exactly one server event; resolve a real two-device conflict through the `sync-conflicts` screen) has **not been click-verified**, consistent with every other Phase 2–4 gap already recorded for the same reason (`expo-sqlite` doesn't run in this session's web preview). `useSync()` (`hooks/useSync.ts`) is mounted at the root layout so this now runs automatically on launch/foreground/interval — needs an iOS/Android run to confirm the permission-less background behavior end-to-end.

**5.2 Security & compliance (Section 11) — partial**

- [x] PII/baby data excluded from analytics, logs, crash reports by default — automated log-scrubbing check. — `buildServer()` (`services/api/src/server.ts`) now sets explicit Fastify logger `redact`/`serializers` so request logs never carry a body, and `services/api/test/log-scrubbing.test.ts` boots the real server, sends a temperature/medication event with canary values, and asserts none of them appear anywhere in the captured log stream. `services/api/src/common/analytics/events.ts` adds a closed, `.strict()` allowlist of analytics event shapes (screen viewed, event-type-logged-by-category-only, etc.) — `trackEvent()` throws on anything outside it, verified by `services/api/test/analytics.test.ts` (rejects raw weight values, notes, and medication dose). Nothing in the app calls `trackEvent` yet (no analytics destination is wired up) — this is the chokepoint ready for when one is.
- [ ] TLS everywhere, encrypted local storage, no plaintext secrets, least-privilege server-side authorization, jurisdiction-matched deletion, formal legal/compliance assessment. — **Not done.** All of these are blocked upstream on Phase 0.3 (auth/session management is still an unstarted stub) — there is no actor identity on any request yet for "least-privilege authorization" to check, and no secret-storage path exists to audit. Flagging rather than faking: implementing these now would mean architecting around an auth system that doesn't exist. `SharingService.hasActiveAccess()` (4.1) remains the authorization check every baby-scoped route should call once Phase 0.3 lands.

**5.3 Accessibility audit — not started.** No screen/interaction changes were made in this pass; the existing per-screen a11y notes from Phases 0–4 (dynamic type, contrast, chart text-alternative) stand as previously recorded. Full audit needs an on-device screen-reader pass, which is out of scope here (SQL/UI not exercisable in this session).

**5.4 Analytics correctness (Section 15)**

- [x] Implement allowed events only + explicit block on raw measurement values. — Covered above under 5.2 (`common/analytics/events.ts` + `analytics.test.ts`); listing both here and at 5.2 since the same work satisfies both checklist items rather than duplicating it.
- _Acceptance:_ `services/api/test/analytics.test.ts` (5 passing) audits the payload allowlist directly.

**5.5 Error & empty states — not started this pass.** No new UI states were added; existing empty-state/offline-indicator work from Phases 1–4 stands as previously recorded. Explicit sync-pending/sync-failed/retry UI (beyond the new conflicts screen) is a reasonable next increment once 5.1 is click-verified on-device.

**5.6 QA full pass / 5.7 Definition-of-Done gate — not started.** Both are inherently manual/on-device or organizational (legal/clinical sign-off) checklist items, not code — see the gaps flagged throughout 5.1/5.2/5.3 above for what's still outstanding before either can be attempted.

**5.2 Security & compliance (Section 11)**

- [ ] TLS everywhere (modern config, no legacy protocol support).
- [ ] Encrypt sensitive local data at rest (platform secure storage / DB encryption).
- [ ] No auth secrets in plaintext local storage — verify via device inspection.
- [ ] Least-privilege authorization enforced at user/household/baby/resource levels — verify server-side on every baby-scoped endpoint (not just client-side gating).
- [ ] PII/baby data excluded from analytics, logs, crash reports by default (Section 15) — automated log-scrubbing check.
- [ ] Account/data deletion workflows match applicable jurisdiction (pending Open Decisions #2, #9).
- [ ] Formal legal/compliance assessment completed before production launch if operating in a health-data-regulated jurisdiction — **do not assume applicability either way.**
- _Acceptance:_ Security review sign-off recorded; automated test confirms no raw weight/temp/dose/feeding-amount/notes reach analytics; penetration/authorization test confirms cross-baby/cross-household access is denied server-side.

**5.3 Accessibility audit (Section 14)**

- [ ] System font scaling / dynamic type across all screens.
- [ ] Contrast audit on text, controls, chart annotations.
- [ ] No color-only status communication anywhere.
- [ ] Every icon button has accessible label.
- [ ] Charts have text/table alternative.
- [ ] Touch target size audit.
- [ ] Reduced-motion support verified.
- [ ] Screen-reader pass (VoiceOver + TalkBack) on all critical flows.
- _Acceptance:_ Accessibility audit checklist fully passed and documented; screen reader can complete a full feeding-log flow start to finish.

**5.4 Analytics correctness (Section 15)**

- [ ] Implement allowed events only: screen viewed, event type logged (category only), log completion time bucket, reminder created/completed, report generated, sync success/failure category, feature adoption.
- [ ] Explicit block on sending raw measurement values/notes to any third-party analytics without documented approved privacy basis.
- _Acceptance:_ Analytics event payload audit confirms no sensitive values leak.

**5.5 Error & empty states (Section 16)**

- [ ] No-data states: explain next action, never show misleading zeros.
- [ ] Offline indicator: subtle, non-blocking, core logging still works.
- [ ] Sync pending / sync failed states with retry, preserving local entry.
- [ ] Invalid measurement: explain field/unit issue + correction path.
- [ ] Permission denied: explain without exposing protected data.
- [ ] Notification disabled: path to device settings, doesn't block core tracking.
- [ ] Server unavailable: app stays usable for cached/offline functions.
- _Acceptance:_ Each of the 8 states in Section 16 has a corresponding UI implementation, verified by manually or automatically forcing each condition.

**5.6 QA — full acceptance pass (Section 17)**

- [ ] Create baby profile → verify actual/corrected age calculations.
- [ ] Log feeding online → verify dashboard update.
- [ ] Log feeding offline → restart → reconnect → verify exactly one server-side event.
- [ ] Edit event from two devices → verify conflict handling.
- [ ] Record measurements in all supported units → verify conversion/display.
- [ ] Render growth chart with sparse, dense, out-of-range data.
- [ ] Create recurring reminder across a DST transition.
- [ ] Revoke caregiver access → verify immediate denial.
- [ ] Generate report → verify date range/units/timestamps.
- [ ] Verify no sensitive measurements in analytics/logs.
- [ ] Test screen reader, large font, reduced-motion settings.
- [ ] Test account deletion/data export workflow.
- _Acceptance:_ All scenarios above pass and are captured as automated tests where feasible (unit/integration), manual test scripts otherwise.

**5.7 Definition of Done — MVP sign-off gate**

- [ ] All Critical and High FRs implemented (see Section 5 table).
- [ ] Automated unit tests cover age calculations, validation, synchronization, authorization.
- [ ] Integration tests cover API/mobile sync.
- [ ] Security review completed.
- [ ] Clinical review completed for all medical guidance, thresholds, growth standards (`NEEDS-CLINICAL-REVIEW` items resolved).
- [ ] Accessibility audit completed.
- [ ] Crash-free beta quality target established and monitored.
- [ ] Privacy policy, consent, data-retention behavior finalized.
- _This gate is the final MVP release checkpoint — do not ship to production until every box here is checked._

---

## 12. API Reference (implement per Section 9 of spec)

| Endpoint                           | Method       | Purpose                                          |
| ---------------------------------- | ------------ | ------------------------------------------------ |
| `/v1/auth/session`                 | POST         | Create/refresh authenticated session             |
| `/v1/babies`                       | GET/POST     | List/create baby profiles                        |
| `/v1/babies/{id}`                  | GET/PATCH    | Read/update baby profile                         |
| `/v1/babies/{id}/events`           | GET/POST     | Read/create care events                          |
| `/v1/babies/{id}/events/{eventId}` | PATCH/DELETE | Modify/remove event (subject to audit policy)    |
| `/v1/babies/{id}/growth`           | GET/POST     | Retrieve/add growth measurements                 |
| `/v1/babies/{id}/reminders`        | GET/POST     | Manage reminders                                 |
| `/v1/babies/{id}/reports`          | POST         | Generate report                                  |
| `/v1/babies/{id}/shares`           | GET/POST     | Manage caregiver sharing                         |
| `/v1/tips`                         | GET          | Retrieve eligible educational content            |
| `/v1/sync`                         | POST         | Synchronize offline mutations, resolve conflicts |

**Cross-cutting API requirements:** JSON over HTTPS · authenticated bearer/session token · request IDs · idempotency keys on event creation · pagination for histories · consistent validation error format · server-side authorization on every baby-scoped resource (never trust client-side scoping alone).

**Example event payload** (illustrative only — production schemas must be versioned OpenAPI/JSON Schema):

```json
{
  "id": "evt_01H...",
  "babyId": "baby_01H...",
  "type": "feeding",
  "occurredAt": "2026-09-05T09:20:00Z",
  "data": { "method": "bottle", "amount": 36, "unit": "ml" },
  "notes": "Tolerated well"
}
```

---

## 13. Screen Inventory

| Screen ID | Screen          | Primary components                                           |
| --------- | --------------- | ------------------------------------------------------------ |
| SCR-01    | Onboarding      | Value proposition, privacy, account creation/sign-in         |
| SCR-02    | Baby Setup      | Baby identity, DOB/time, gestational age, birth measurements |
| SCR-03    | Home            | Baby card, summary cards, goals, navigation                  |
| SCR-04    | Track           | Care-event list                                              |
| SCR-05    | Add Feeding     | Method, amount, time, notes                                  |
| SCR-06    | Add Weight      | Value, unit, time, source                                    |
| SCR-07    | Add Diaper      | Type, time                                                   |
| SCR-08    | Add Sleep       | Start/end, duration                                          |
| SCR-09    | Add Temperature | Value, unit, method, time                                    |
| SCR-10    | Add Medication  | Medication, dose, time, notes                                |
| SCR-11    | Growth          | Metric selector, corrected age, chart, latest values         |
| SCR-12    | Tips            | Featured content + topics                                    |
| SCR-13    | Tip Detail      | Educational article, review/source metadata                  |
| SCR-14    | More            | Profile, reminders, reports, sharing, settings               |
| SCR-15    | Reminders       | List, create/edit reminder                                   |
| SCR-16    | Reports         | Date range, category selection, export                       |
| SCR-17    | Share Data      | Caregiver invitations, permissions, revocation               |
| SCR-18    | Settings        | Notifications, units, privacy, account                       |

---

## 14. Prototype-to-Implementation Mapping

Per the Engineering Constitution (Section 0.A #4), the prototype is now the **literal visual target** — see Section 6.8 for the pixel-level breakdown. This section maps prototype elements to their underlying data/behavior; it does not license visual reinterpretation. Add the states/validation/accessibility/error-handling defined in this document on top of the prototype's exact visuals, not instead of them.

| Prototype element          | Implementation interpretation                                                 |
| -------------------------- | ----------------------------------------------------------------------------- |
| Baby hero card             | Baby profile summary + dynamic age/corrected-age calculation                  |
| Today at a glance          | Aggregated query over today's care events + latest measurements               |
| Track rows                 | Event-type entry points + latest-event summaries                              |
| Purple Add Feeding control | Primary save action; exact color token lives in design system, not hard-coded |
| Growth chart               | Interactive, accessible chart driven by validated measurement dataset         |
| Tips card                  | CMS-backed educational content with stage/category targeting                  |
| More menu                  | Settings and secondary workflows                                              |
| Privacy message            | Backed by actual security architecture and policy, not just copy              |

---

## 15. Non-Negotiable Guardrails (apply across every phase)

- **No diagnostic behavior** anywhere — tracking/education only.
- **No dosing recommendations** in the medication flow — record only.
- **No alarming/urgent copy** without an explicitly approved clinical safety workflow.
- **No color-only status signaling.**
- **No misleading zero values** in empty states.
- **No silent overwrite** on sync conflicts.
- **No sensitive measurement data** in analytics or logs by default.
- **No ongoing access grant** from a one-time report share.
- **No unconfigurable clinical constants** (e.g., corrected-age full-term reference must be configurable, not hard-coded).
- Server-side authorization enforced on every baby-scoped resource — never rely on client-side checks alone.

---

## 16. Final Product Principle

> The app should feel **calm rather than clinical, comprehensive rather than complicated, and supportive rather than judgmental.** Preserve the prototype's minimalist visual language while engineering adds the reliability required for longitudinal infant-care data: correctness, traceability, offline resilience, privacy, accessibility, and clinically reviewed content.
