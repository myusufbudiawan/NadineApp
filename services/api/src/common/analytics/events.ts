import { z } from 'zod';

// Section 15 guardrail: "No sensitive measurement data in analytics or logs
// by default." This is the only path analytics events may go out through —
// each event type's schema is a closed allowlist of category-only fields, so
// there is no field a caller could smuggle a raw weight/temp/dose/feeding
// amount or free-text note through. `.strict()` rejects any extra key
// instead of silently dropping it, so a mistaken extra field fails loudly in
// development/tests rather than shipping quietly.
const babyScoped = { babyId: z.string() };

export const analyticsEventSchema = z.discriminatedUnion('name', [
  z.object({ name: z.literal('screen_viewed'), screen: z.string() }).strict(),
  z
    .object({
      name: z.literal('event_type_logged'),
      ...babyScoped,
      category: z.enum([
        'feeding',
        'weight',
        'diaper',
        'sleep',
        'temperature',
        'medication',
        'note',
      ]),
    })
    .strict(),
  z
    .object({
      name: z.literal('log_completion_time_bucket'),
      category: z.string(),
      bucket: z.enum(['under_10s', '10_30s', '30_60s', 'over_60s']),
    })
    .strict(),
  z.object({ name: z.literal('reminder_created'), ...babyScoped, type: z.string() }).strict(),
  z.object({ name: z.literal('reminder_completed'), ...babyScoped, type: z.string() }).strict(),
  z.object({ name: z.literal('report_generated'), ...babyScoped, format: z.enum(['json', 'csv']) }).strict(),
  z
    .object({
      name: z.literal('sync_result'),
      status: z.enum(['success', 'failure']),
      mutationCount: z.number().int().nonnegative(),
    })
    .strict(),
  z.object({ name: z.literal('feature_adopted'), feature: z.string() }).strict(),
]);

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export class AnalyticsRejectedError extends Error {}

const sink: AnalyticsEvent[] = [];

// Every emitted event is parsed against the allowlist above before it ever
// reaches a sink (in-memory here; a real destination — Amplitude/Segment/etc.
// — plugs in behind this same chokepoint). Reject rather than best-effort
// strip: a caller that tried to pass a disallowed field made a mistake worth
// surfacing immediately, not silently laundering into "safe" analytics.
export function trackEvent(event: unknown): AnalyticsEvent {
  const parsed = analyticsEventSchema.safeParse(event);
  if (!parsed.success) {
    throw new AnalyticsRejectedError(
      `Analytics event rejected — not on the allowlist: ${parsed.error.message}`,
    );
  }
  sink.push(parsed.data);
  return parsed.data;
}

export function _analyticsSinkForTests(): readonly AnalyticsEvent[] {
  return sink;
}
