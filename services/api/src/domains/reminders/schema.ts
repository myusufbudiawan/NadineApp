import { z } from 'zod';

// Exact set pending Open Product Decision #8 — kept extensible rather than
// hard-coded to today's guess (Section 9 rule: don't hard-code unresolved
// product decisions).
export const reminderTypes = ['feeding', 'medication', 'measurement', 'general'] as const;
export type ReminderType = (typeof reminderTypes)[number];

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Expected HH:MM');

export const reminderSchema = z.object({
  type: z.enum(reminderTypes),
  title: z.string().min(1),
  timeOfDay,
  // 0=Sun .. 6=Sat.
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  timezone: z.string().min(1),
  enabled: z.boolean().default(true),
});
export type ReminderInput = z.infer<typeof reminderSchema>;

export const reminderUpdateSchema = reminderSchema.partial();
export type ReminderUpdateInput = z.infer<typeof reminderUpdateSchema>;

export const snoozeSchema = z.object({ minutes: z.number().int().positive() });
