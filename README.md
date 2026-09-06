# PreemieTrack

PreemieTrack is a calm, privacy-conscious companion app for caregivers of premature or medically monitored infants. It is a tracking and education tool — never a diagnostic or dosing-recommendation system.

The product requirements and delivery checklist live in [PREEMIETRACK_PLAN.md](PREEMIETRACK_PLAN.md). That document is the project source of truth.

## Phase 0 status

The repository contains a working Expo/React Native prototype, reusable component system, local SQLite persistence boundary, SecureStore-backed session boundary, configurable corrected-age engine, and a separate Fastify API scaffold. The static prototype screens are deliberately UI previews; Phase 1+ event persistence, sync, clinical datasets, and production authentication remain unimplemented.

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
