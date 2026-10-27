---
description: Run the full build loop for one feature, stopping only at the plan gate and the final review gate
argument-hint: "<requirement>" [--assume]
---

You are running the personal build loop for this requirement:

$ARGUMENTS

If `--assume` appears, it is a flag, not part of the requirement: strip it before deriving the slug or passing the requirement on.

Run the phases below in order, without waiting for a prompt between them. Stop only at the two marked GATE steps, or if you are blocked. Do not narrate each step; keep a task list and update it.

If the arguments contain `--assume`, never ask clarifying questions in phase 1. Decide, and list every assumption at gate 1 instead. Exception: ambiguous clinical or compliance defaults (thresholds, growth standards, medication data, alert copy) are never assumed; stop and ask, per CLAUDE.md.

## Phase 0: Preflight

1. Confirm the working tree is clean, ignoring untracked files under `.claude/commands/`. If not, stop and say what is dirty.
2. `git checkout main && git pull --ff-only`, then create branch `feat/<short-slug>`.
3. Read CLAUDE.md. Note the test, lint and run commands. If any is missing, ask once, then record it in CLAUDE.md (on the feature branch).

## Phase 1: Brainstorm

Invoke the `brainstorming` skill (Superpowers) with the requirement.

- Explore the codebase first; answer from the code whenever possible.
- Ask the user only what the code cannot answer, as ONE batched question with options and a recommended default. Skip questions entirely under `--assume`.
- Apply the Ponytail ladder: cut scope that does not need to exist, reuse what is already in the repo, prefer the stdlib or existing helpers.
- Use Context7 for any library API you are unsure of. Do not guess APIs.

## Phase 2: Plan

Invoke the `writing-plans` skill. Save the plan to `docs/plans/<slug>.md` (it is committed with the feature and kept in `docs/plans/` permanently as the reference record of what was planned; never delete or move it, and override the skill's default `docs/superpowers/plans/` location). The plan must list: tasks in order (test first for each), files touched, schema or migration changes, and risk flags.

Set these risk flags if true: `schema` (Postgres migration in `services/api/src/common/db/migrations/`), `auth` (tokens, user IDs, permissions), `sync` (mobile offline behaviour, `OFFLINE_ONLY` / `WEB_DEMO` paths), `release` (needs a new native mobile build).

### GATE 1: Plan approval (STOP)

Show the plan summary, the assumptions made, and the risk flags. Ask: approve, edit, or reject. Do not write any code until the user approves. If they edit the plan file, re-read it before continuing.

## Phase 3: Execute

Invoke the `executing-plans` skill (use subagent-driven execution for independent tasks). Follow `test-driven-development`: write the failing test, watch it fail, then write the minimum code to pass.

- Commit after each task with a clear message.
- Do not widen scope. If you find something outside the plan, note it in `docs/plans/<slug>.md` under "Found along the way" and carry on.
- Mark every deliberate shortcut with a `ponytail:` comment naming the upgrade path.
- If blocked for any reason other than a missing decision, retry once with a different approach, then stop and report.

## Phase 4: Verify

Invoke `verification-before-completion`. Run the project's test, lint and typecheck commands from CLAUDE.md. API tests need Postgres at `DATABASE_URL` with migrations applied; if it is unavailable, stop and report rather than debugging the environment. All must pass. Fix failures yourself, at most 3 attempts per failure, then stop and report; do not proceed on red.

## Phase 5: Review (auto, max 2 rounds)

Invoke these with the Skill tool (they are skills, not typed commands):

1. `code-review:code-review` on the branch.
2. `ponytail:ponytail-review`.
3. If any risk flag is set, also `pr-review-toolkit:review-pr` with `all`.
4. Triage findings. Fix the real ones (bugs, security, missing tests, bloat). Reject noise and say why in one line each.
5. Re-run Phase 4. Repeat this phase once more if you fixed anything significant, then move on.

### GATE 2: Final decision (STOP)

Present:

- What changed, in two or three sentences.
- The diff stat and the plan tasks done.
- Review findings: fixed, rejected, and anything left open.
- Manual checks for the user, built from the risk flags:
  - `schema`: the migration file and how to apply it to a local Postgres.
  - `sync`: the offline test (make the change offline, confirm no server calls, reconnect and confirm it syncs) and the same-record conflict test.
  - `auth`: confirm nothing opens access beyond what existed before.
  - `release`: a new native build is needed.

Ask: ship, send back to plan, or discard.

If the `release` flag is set, also ask which EAS profile to build: `preview` (internal APK), `production` (store build), `offline-preview` or `offline-production` (same, with `EXPO_PUBLIC_OFFLINE_ONLY=1`). Never pick one yourself.

## Phase 6: Ship (only after the user says ship)

1. Invoke `commit-commands:commit-push-pr` with the Skill tool.
2. Report the PR link.
3. Wait for CI with `gh pr checks --watch`. If any check fails, stop and report; do not merge. If all are green, merge the PR. Do not ask.
4. After the merge, `git checkout main && git pull --ff-only`. "The diff" below means `git diff --name-only <main sha before the merge>..HEAD`. Deploy through GitHub Actions first; fall back to manual only where an action cannot do the job.
   - **Actions first.** The merge push triggers `deploy-api.yml` (paths `services/api/**`) and `deploy-web.yml` (paths `apps/mobile/**`). Look at `gh run list --branch main --limit 6` and `gh run view <id>` once (no polling loops) and report each run. A run only counts as deployed if its deploy steps actually ran: `deploy-web.yml` goes green in seconds without deploying when the `VERCEL_WEB_PROJECT_ID` secret is unset. If the diff touches `services/api` or `apps/mobile` but its run did not trigger, was skipped, or failed, run it with `gh workflow run deploy-api.yml` / `gh workflow run deploy-web.yml` (both have `workflow_dispatch`) and report that run.
   - **APK.** If the `release` flag is set and the profile chosen at gate 2 is `preview` or `offline-preview`, run `gh workflow run build-android.yml -f profile=<profile>` (it builds on EAS and attaches the APK to a GitHub Release). Do not also run `eas build` by hand.
   - **Manual fallback**, only when no action can do it (the Action failed twice, a secret is missing and the user cannot set it now, or the profile is `production` / `offline-production`, which `build-android.yml` does not offer). Say which action was skipped and why, then:
     - Before each `vercel --prod`, confirm that directory has `.vercel/project.json`; if not, stop and report, do not create a project. Linking to an existing project (`vercel link --yes --project <name>`) is allowed only if the user says so.
     - API: `vercel --prod --archive=tgz` from `services/api`.
     - Web demo: the Vercel project's root directory is `apps/mobile`, so deploy from the repo root (not `apps/mobile`), with a temporary untracked `.vercelignore` excluding `apps/mobile/ios`, `apps/mobile/android`, `**/node_modules`; delete it afterwards.
     - Store builds: `eas build --platform android --profile <profile> --non-interactive` from `apps/mobile`.
   - Report each result. If one fails, stop and report; do not retry blindly.
5. Stop.

## Hard rules

- Never run SQL against a production database. Write migration files in `services/api/src/common/db/migrations/` and say so.
- Merge, GitHub Actions deploys/builds, and any manual `eas` / `vercel` fallback happen only in Phase 6, after the user said ship and CI is green, and only in the order listed there.
- Always try the GitHub Actions in `.github/workflows/` before a manual `vercel` or `eas` command. Never run an `eas` or `vercel` command anywhere else in the loop.
- Never skip a gate, even if the change looks small. If the change is trivial, say so at the gate and keep it short.
- Never edit files outside this repo.
- Do not add dependencies without listing them at gate 1.
