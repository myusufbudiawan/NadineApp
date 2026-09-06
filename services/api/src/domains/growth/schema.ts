import { z } from 'zod';
export const growthSchema = z.object({
  metric: z.enum(['weight', 'length', 'headCircumference']),
  value: z.number().positive(),
  unit: z.string().min(1),
  measuredAt: z.coerce.date(),
});
