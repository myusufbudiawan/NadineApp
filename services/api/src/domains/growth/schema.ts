import { z } from 'zod';

export const growthMetrics = ['weight', 'length', 'headCircumference'] as const;
export type GrowthMetric = (typeof growthMetrics)[number];

// NEEDS-CLINICAL-REVIEW: plausibility bounds below are engineering placeholders
// to reject impossible entries, not clinically approved thresholds (Section 8.3).
export const growthSchema = z
  .object({
    metric: z.enum(growthMetrics),
    value: z.number().positive(),
    unit: z.enum(['kg', 'lb', 'cm', 'in']),
    measuredAt: z.coerce.date(),
    // Lets the mobile client's local row id round-trip: cross-device pull
    // (see lib/offline/hydrate.ts) reconciles against this instead of the
    // server-assigned id, so re-pulling the same measurement never
    // duplicates it locally. Optional/server-generated when absent so
    // direct API callers aren't required to supply one.
    idempotencyKey: z.string().uuid().optional(),
  })
  .refine(
    (d) => {
      if (d.metric === 'weight') return d.value <= (d.unit === 'kg' ? 25 : 55);
      if (d.metric === 'length') return d.value <= (d.unit === 'cm' ? 120 : 47);
      return d.value <= (d.unit === 'cm' ? 60 : 24);
    },
    { message: 'Measurement is outside the plausible range' },
  );

export type GrowthInput = z.infer<typeof growthSchema>;
