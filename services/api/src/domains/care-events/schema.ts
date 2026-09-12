import { z } from 'zod';

const envelope = {
  occurredAt: z.coerce.date(),
  notes: z.string().max(2000).optional(),
  idempotencyKey: z.string().uuid(),
  // Lets the mobile client's local row id become the canonical server id —
  // otherwise the server mints its own random id and every subsequent
  // update/delete for that event (which references the client's local id)
  // fails with "not found". Optional so direct API callers aren't required
  // to supply one.
  id: z.string().uuid().optional(),
};

const feedingData = z.object({
  method: z.enum(['bottle', 'breastmilk']),
  amount: z.number().positive().max(500),
  unit: z.enum(['ml', 'oz']),
});

const weightData = z
  .object({
    value: z.number().positive(),
    unit: z.enum(['kg', 'lb']),
    measurementSource: z.enum(['manual', 'device']).default('manual'),
  })
  // NEEDS-CLINICAL-REVIEW: plausibility bounds are placeholders, not clinically approved.
  .refine((d) => d.value <= (d.unit === 'kg' ? 25 : 55), {
    message: 'Weight is outside the plausible range',
  });

const diaperData = z.object({
  diaperType: z.enum(['wet', 'dirty', 'both', 'other']),
});

const sleepData = z
  .object({
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: 'endAt must be after startAt',
  });

const temperatureData = z
  .object({
    value: z.number(),
    unit: z.enum(['C', 'F']),
    method: z.enum(['oral', 'axillary', 'temporal', 'rectal', 'other']),
  })
  // NEEDS-CLINICAL-REVIEW: plausibility bounds are placeholders, not clinically approved.
  .refine(
    (d) =>
      d.unit === 'C' ? d.value >= 25 && d.value <= 45 : d.value >= 77 && d.value <= 113,
    { message: 'Temperature is outside the plausible range' },
  );

// Tracking only — no dosing recommendation fields exist or are ever derived here.
const medicationData = z.object({
  medicationName: z.string().trim().min(1),
  dose: z.number().nonnegative(),
  unit: z.string().trim().min(1),
  scheduledAt: z.coerce.date().optional(),
  takenAt: z.coerce.date().optional(),
});

const kangarooData = z
  .object({
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: 'endAt must be after startAt',
  });

const noteData = z.object({}).strict();

export const careEventTypes = [
  'feeding',
  'weight',
  'diaper',
  'sleep',
  'temperature',
  'medication',
  'kangaroo',
  'note',
] as const;

export const careEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('feeding'), data: feedingData, ...envelope }),
  z.object({ type: z.literal('weight'), data: weightData, ...envelope }),
  z.object({ type: z.literal('diaper'), data: diaperData, ...envelope }),
  z.object({ type: z.literal('sleep'), data: sleepData, ...envelope }),
  z.object({ type: z.literal('temperature'), data: temperatureData, ...envelope }),
  z.object({ type: z.literal('medication'), data: medicationData, ...envelope }),
  z.object({ type: z.literal('kangaroo'), data: kangarooData, ...envelope }),
  z.object({ type: z.literal('note'), data: noteData, ...envelope }),
]);

export const careEventPatchSchema = z.object({
  occurredAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type CareEventInput = z.infer<typeof careEventSchema>;
export type CareEventPatchInput = z.infer<typeof careEventPatchSchema>;
