// Pure logic only (no expo / react-native imports) so the node test runner can
// load it. Device wiring lives in service.ts.

// NEEDS-CLINICAL-REVIEW: the offered intervals. Off by default, and no interval
// is pre-selected — the user chooses one before any reminder is scheduled.
export const feedingIntervalPresets = [120, 150, 180, 210, 240] as const;

export type FeedingReminderSettings = { enabled: boolean; intervalMinutes?: number };

export function parseSettings(raw: string | null): FeedingReminderSettings {
  if (!raw) return { enabled: false };
  try {
    const parsed = JSON.parse(raw) as FeedingReminderSettings;
    if (parsed.intervalMinutes === undefined) return { enabled: parsed.enabled === true };
    if (!(feedingIntervalPresets as readonly number[]).includes(parsed.intervalMinutes)) {
      return { enabled: false };
    }
    return { enabled: parsed.enabled === true, intervalMinutes: parsed.intervalMinutes };
  } catch {
    return { enabled: false };
  }
}

export function intervalLabel(minutes: number): string {
  const hours = minutes / 60;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

// When the reminder should fire, or undefined when there is nothing to schedule
// (disabled, no interval chosen, no feeding logged, or the time already passed).
export function dueAt(
  lastFeedingAt: string | undefined,
  settings: FeedingReminderSettings,
  now: Date,
): Date | undefined {
  if (!settings.enabled || !settings.intervalMinutes || !lastFeedingAt) return undefined;
  const due = new Date(new Date(lastFeedingAt).getTime() + settings.intervalMinutes * 60_000);
  return due > now ? due : undefined;
}
