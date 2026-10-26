# Feeding Reminder (time since last feeding) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A parent can turn on a reminder that fires a chosen time after the last logged feeding, and turn it off again.

**Architecture:** A device-local setting (`enabled`, `intervalMinutes`) in `secureStoreAdapter`, like `features/dashboard/preferences.ts`. One local notification is kept scheduled for `lastFeeding.occurredAt + interval`; `syncFeedingReminder()` re-derives it from the DB and is called after every feeding save, edit, delete and setting change. No server calls, so it works offline.

**Tech Stack:** Expo 57 / expo-notifications (already used by `features/reminders/notifications.ts`), expo-sqlite, expo-secure-store. No new dependencies.

**Spec:** the user story in the `/feature` request plus the Phase 1 answer "A" (see Assumptions).

## Assumptions (confirm at gate)
- Global setting for the baby, not a row in the existing `reminders` table (those are fixed clock-time alarms with weekdays).
- Preset intervals only: 120, 150, 180, 210, 240 minutes. Default is **off**, with **no interval pre-selected**; the reminder only starts once the user picks one. (Interval presets, the 3 h example and the copy are clinical defaults: `NEEDS-CLINICAL-REVIEW`, off by default.)
- Fires once per feeding (no repeats/nagging), stays silent if the due time has already passed when scheduled.
- Copy: title `It's been {N} since the last feeding` (e.g. "3 hours"), body reuses the existing "A gentle reminder from PreemieTrack." Tracking only, no advice.
- Not included in backup/export (`prefs`) and not synced; a restored device re-enables it manually.
- Web demo: setting saves, no device notification (existing behaviour of `notifications.ts`).

## Global Constraints
- Tracking/education only; calm copy, no medical advice.
- Offline: no server calls on `OFFLINE_ONLY` / `WEB_DEMO` paths.
- Domain logic separate from UI; pure logic importable by `node --experimental-strip-types` (no `expo`/`react-native` imports in the pure file).
- Deliberate shortcuts carry a `ponytail:` comment.

## Review Focus
- Feeding edited to an earlier time so it is no longer the latest: reminder follows the new latest. (test in Task 1: `latestFeedingDue` uses max occurredAt)
- Latest feeding deleted: reminder cancelled / re-pointed at the previous feeding. (Task 2)
- Due time already in the past (old backdated feeding): nothing scheduled, no instant buzz. (Task 1)
- Corrupt or unknown stored interval (e.g. 45): treated as not configured, not scheduled. (Task 1)
- Disable: pending notification cancelled. (Task 2)

## Files
- Create `apps/mobile/features/feeding-reminder/interval.ts` — pure: presets, parse, label, due-time.
- Create `apps/mobile/features/feeding-reminder/service.ts` — load/save settings, `syncFeedingReminder`.
- Create `apps/mobile/__tests__/feedingReminder.runner.ts`; add to `npm test` script in `apps/mobile/package.json`.
- Modify `apps/mobile/features/care-events/storage.ts` — call sync after feeding save/edit/delete.
- Modify `apps/mobile/app/more/settings.tsx` — "Feeding reminder" card.
- No schema/migration. No server changes.

### Task 1: Pure interval logic

**Files:** Create `features/feeding-reminder/interval.ts`; Test `__tests__/feedingReminder.runner.ts`; Modify `package.json` test script.

**Interfaces — Produces:**
```ts
export const feedingIntervalPresets = [120, 150, 180, 210, 240] as const; // NEEDS-CLINICAL-REVIEW
export type FeedingReminderSettings = { enabled: boolean; intervalMinutes?: number };
export function parseSettings(raw: string | null): FeedingReminderSettings; // invalid/unknown interval => { enabled:false }
export function intervalLabel(minutes: number): string; // 180 -> "3 hours", 150 -> "2.5 hours"
export function dueAt(lastFeedingAt: string | undefined, s: FeedingReminderSettings, now: Date): Date | undefined;
// undefined when disabled, no interval, no feeding, or due time <= now
```

- [ ] Write failing runner asserting: `parseSettings(null)` → `{enabled:false}`; garbage JSON → `{enabled:false}`; `{enabled:true,intervalMinutes:45}` → `{enabled:false}`; valid round trips; `intervalLabel(180)==='3 hours'`, `intervalLabel(150)==='2.5 hours'`; `dueAt('2026-01-01T10:00:00Z', {enabled:true,intervalMinutes:180}, 2026-01-01T11:00Z)` → 13:00Z; past due → undefined; disabled / no interval / no feeding → undefined.
- [ ] Run `npm run test --workspace @preemietrack/mobile`; expect FAIL (module missing).
- [ ] Implement `interval.ts`; add runner to the `test` script.
- [ ] Run tests; expect PASS. Commit.

### Task 2: Service + wiring into feeding writes

**Files:** Create `features/feeding-reminder/service.ts`; Modify `features/care-events/storage.ts`.

**Interfaces — Consumes:** Task 1 exports; `secureStoreAdapter` (`@/lib/auth/session`); `loadLatestCareEvents`-style query via `getLatestCareEventsByType(LOCAL_BABY_ID)` (`@/lib/offline/database`); `scheduleReminderNotification(title, fireAt)` / `cancelReminderNotification(id)` (`@/features/reminders/notifications`). **Produces:**
```ts
export async function loadFeedingReminderSettings(): Promise<FeedingReminderSettings>;
export async function saveFeedingReminderSettings(s: FeedingReminderSettings): Promise<void>; // persists then syncFeedingReminder()
export async function syncFeedingReminder(): Promise<void>; // cancel stored notification id, recompute dueAt from latest non-deleted feeding, schedule, store new id
```

- [ ] Logic is covered by Task 1 (dueAt). Service is thin glue over device APIs, so test = runner case that `syncFeedingReminder` is not imported by pure file, plus manual check at gate 2. (`ponytail:` comment: service untested against real notifications; upgrade path is injecting a notifier.)
- [ ] Implement service; notification id stored under its own secure-store key.
- [ ] In `care-events/storage.ts`: after `saveCareEvent` (when `input.type === 'feeding'`), `editCareEvent` and `deleteCareEvent` (when `existing.type === 'feeding'`), `await syncFeedingReminder()`.
- [ ] Run test, lint, typecheck. Commit.

### Task 3: Settings UI

**Files:** Modify `app/more/settings.tsx`. Reuse `Card`, `Switch`, `SegmentedControl` already imported there.

- [ ] Add "Feeding reminder" card under Notifications: Switch (enable/disable) and, when on, `SegmentedControl` over `feedingIntervalPresets` labels (none selected until chosen). Caption: "Remind me this long after each feeding." Load via `loadFeedingReminderSettings` in the existing `useFocusEffect`; changes call `saveFeedingReminderSettings`.
- [ ] Run test, lint, typecheck; render web demo and confirm card toggles and persists on reload. Commit.

## Risk flags
- `schema`: no
- `auth`: no
- `sync`: **yes** — touches the care-event save/edit/delete path; must stay offline and not change queued mutations.
- `release`: no (expo-notifications already in the build)

## Found along the way
(none yet)
