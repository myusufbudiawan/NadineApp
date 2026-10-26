# PreemieTrack

npm-workspaces monorepo: `apps/mobile` (Expo Router app, also the no-backend web demo) and `services/api` (Fastify + Postgres, deployed to Vercel). Product spec and progress live in `PREEMIETRACK_PLAN.md`.

## Product boundary
- Tracking and education only, never diagnostic. No diagnoses, dosing advice, or alarming medical copy.
- Clinical thresholds, growth standards, medication data and alert copy get a `NEEDS-CLINICAL-REVIEW` comment (and a PR note) and stay off by default.
- Ambiguous clinical or compliance default? Stop and ask, don't guess.

## Rules
- Simple over clever. No speculative abstractions, no defensive fallbacks.
- Screens are built from shared components (`EntryForm`, `TrackRow`, `SummaryCard`…); add a reusable component rather than a one-off.
- Domain logic stays in `services/api/src/domains/<domain>`; keep route, validation (zod) and DB code separate. Async all the way down.
- Mobile must keep working offline: `OFFLINE_ONLY` / `WEB_DEMO` paths make no server calls.
- Every change ships with a test. Run `npm run test` (and lint + typecheck) before calling anything done.
- Look up library APIs with Context7 instead of guessing (Expo 57, RN 0.86, Fastify 5, Zod 4 move fast).
- Leave a `ponytail:` comment on any deliberate shortcut.

## Commands (from repo root)
- Test: `npm run test` — API tests need Postgres at `DATABASE_URL` with migrations from `services/api/src/common/db/migrations/` applied (see `.github/workflows/ci.yml`)
- Lint / typecheck: `npm run lint` · `npm run typecheck`
- Build: `npm run build` · web demo: `npm run build:web --workspace @preemietrack/mobile`
- Run: `npm run dev --workspace @preemietrack/api` (port 3000) · `npm run start --workspace @preemietrack/mobile`

## Workflow
One feature or fix per branch; changes land on `main` through a PR with green CI.
1. Brainstorm `/superpowers:brainstorm` (skip for one-file fixes) → plan `/superpowers:write-plan` (human gate) → build `/superpowers:execute-plan`.
2. Review: `/code-review:code-review`; big or risky changes add `/pr-review-toolkit:review-pr all`; then `/ponytail-review`.
3. Human reads the full diff. Wrong design → back to the plan, not the build.
4. Ship: `/commit-commands:commit-push-pr`. Weekly: `/ponytail-debt`, `/commit-commands:clean_gone`.
