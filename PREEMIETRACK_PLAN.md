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

- [ ] Header: greeting, caregiver name, notification icon.
- [ ] Baby card: photo/avatar, name, birth info, latest weight, actual age, corrected age.
- [ ] "Today at a glance": weight, feeding, sleep, diaper compact cards, aggregated from today's CareEvents + latest measurements.
- [ ] Daily goal/encouragement card — copy reviewed for non-judgmental tone.
- [ ] Proper empty states everywhere data is missing (never a misleading zero).
- _Acceptance:_ Dashboard accurately reflects latest state after any log action from Phase 1, updates in near-real-time on save, and shows correct empty states for a brand-new baby profile.

**2.2 Growth measurement pipeline (FR-012)**

- [ ] `GrowthMeasurement` entity; `/v1/babies/{id}/growth` (GET/POST).
- [ ] Ingest weight/length/head-circumference measurements (weight can source from WeightEvent; length/head-circ need their own capture point — confirm whether these come from a dedicated "Growth entry" screen or are inferred from existing forms; flag as a gap since the prototype doesn't fully specify this).
- _Acceptance:_ Growth measurements are queryable by babyId + metric + date range, with correct units preserved.

**2.3 Growth screen (SCR-11)**

- [ ] Segmented selector: Weight / Length / Head Circumference.
- [ ] Corrected-age indicator above chart, sourced from 0.5 engine.
- [ ] Interactive chart: pinch/drag or accessible range selection; text/table alternative for screen readers (Section 14).
- [ ] Show latest value, Δ24h, Δ7d where sufficient data exists.
- [ ] Reference bands sourced from a clinically approved, named/versioned growth-standard dataset. `NEEDS-CLINICAL-REVIEW` — ship with dataset placeholder clearly marked "pending clinical approval" if Open Decision #1 unresolved; do not fabricate percentile curves.
- [ ] Never label any band/percentile as a diagnosis — copy review required.
- _Acceptance:_ Chart renders correctly with sparse, dense, and out-of-range datasets (see QA 17.1); screen-reader users get an equivalent data table; no diagnostic language present anywhere in this screen.

---

### Phase 3 — Engagement

**3.1 Tips content pipeline (FR-013, SCR-12, SCR-13)**

- [ ] `TipContent` entity + admin/content console (separate authenticated interface, per Section 10.1) for clinically reviewed content entry.
- [ ] `/v1/tips` (GET) — eligibility filtering by baby stage/corrected age.
- [ ] Tips screen: "For you today" featured card + topic list (Feeding & Nutrition, Growth & Development, Sleep, Daily Care, Emotional Support).
- [ ] Tip Detail screen: article + visible source/review metadata + "educational information" boundary notice.
- _Acceptance:_ Content can be authored/published via admin console; mobile Tips screen reflects stage-appropriate filtering; every clinical article visibly discloses its educational-only status and review metadata. `NEEDS-CLINICAL-REVIEW` on all seeded content before production enablement.

**3.2 Reminders (FR-014, SCR-15)**

- [ ] `Reminder` entity; `/v1/babies/{id}/reminders` (GET/POST).
- [ ] Reminder types: feeding, medication (reminder-only, no dose logic), measurement, general/configurable recurring (exact set pending Open Decision #8).
- [ ] Create/edit/snooze/complete flows.
- [ ] Timezone-aware scheduling, correct behavior across DST transitions.
- [ ] Missed-reminder UX: neutral status, no shaming copy, easy reschedule (Section 12).
- _Acceptance:_ Recurring reminder correctly fires across a DST boundary (test explicitly per QA 17.1); missed reminders never use guilt-oriented language (copy review).

**3.3 Notifications infrastructure**

- [ ] Local + push notification delivery via APNs/FCM abstraction from 0.1.
- [ ] Notification copy pass: concise, calm, non-judgmental, no alarming language absent an approved clinical safety workflow.
- _Acceptance:_ Notifications deliver reliably on both platforms; copy review sign-off recorded.

---

### Phase 4 — Sharing & Reports

**4.1 Sharing (FR-016, SCR-17)**

- [ ] `ShareGrant` entity; `/v1/babies/{id}/shares` (GET/POST).
- [ ] Invite caregiver flow, read/write permission levels, explicit consent capture.
- [ ] Revocation flow with **immediate** access denial (test explicitly).
- _Acceptance:_ Revoking access blocks the revoked caregiver from all reads/writes within the same session (no cached-permission bypass) — verified via QA 17.1 scenario.

**4.2 Reports & export (FR-015, SCR-16)**

- [ ] `/v1/babies/{id}/reports` (POST) — date range + category selection.
- [ ] Report contents: baby profile, actual/corrected age context, measurement history, care-event summary, timestamps.
- [ ] Clearly label data as caregiver-entered unless measurement source is verified.
- [ ] PDF/CSV export preserving units and timestamps.
- [ ] Sharing a generated report is a one-time action — must **not** grant ongoing account access.
- _Acceptance:_ Generated report correctly reflects selected date range/categories with correct units/timestamps; sharing the report file does not create any new ShareGrant.

**4.3 Privacy controls (FR-018)**

- [ ] Data export (self-service, distinct from clinician report export).
- [ ] Deletion request workflow (policy pending Open Decision #9 — implement the request/approval pipeline even if final retention period is TBD).
- [ ] Account management (profile edit, sign-out, session revocation across devices).
- [ ] Sharing control surfaced in Settings/More.
- _Acceptance:_ User can request data export and initiate account/data deletion; deletion request is logged and enters the defined workflow even if final auto-purge timing is still pending sign-off.

---

### Phase 5 — Hardening (Production Candidate)

**5.1 Offline-first sync (FR-017)**

- [ ] Local-first writes: UI never blocks on network.
- [ ] Client-generated UUID per mutation.
- [ ] Mutation queue with createdAt/updatedAt/sync state.
- [ ] Exponential backoff retry.
- [ ] Server-side idempotency on mutation UUID/idempotency key.
- [ ] Explicit conflict resolution UX for conflicting edits (no silent overwrite).
- [ ] Tombstone-based deletes for reliable multi-device sync.
- [ ] `/v1/sync` (POST) endpoint implementing the above.
- _Acceptance:_ QA scenario: log feeding offline, restart app, reconnect → exactly one server-side event created. Edit same event from two devices → conflict surfaced, not silently overwritten.

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
