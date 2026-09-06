import { z } from 'zod';
export const babySchema = z.object({
  name: z.string().trim().min(1),
  dateOfBirth: z.coerce.date().max(new Date()),
  gestationalWeeks: z.number().int().min(20).max(45),
  gestationalDays: z.number().int().min(0).max(6),
  birthWeightKg: z.number().positive(),
  birthLengthCm: z.number().positive().optional(),
  birthHeadCircumferenceCm: z.number().positive().optional(),
  fullTermReferenceWeeks: z.number().int().min(37).max(45),
});
